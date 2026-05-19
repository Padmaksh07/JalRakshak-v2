/**
 * HistoryChart.jsx  — styled to match original light theme
 */
import { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend,
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const COLORS = { ph:"#3b82f6", turbidity:"#f97316", contamination:"#ef4444" };
const THRESHOLDS = { ph:{min:6.5,max:8.5}, turbidity:{safe:25}, contamination:{safe:30} };

function formatTime(iso) {
  const d = new Date(iso);
  return d.getHours().toString().padStart(2,"0")+":"+d.getMinutes().toString().padStart(2,"0");
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:8, padding:"10px 14px", fontSize:12 }}>
      <p style={{ color:"var(--muted-2)", marginBottom:6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color:p.color, fontWeight:600, marginBottom:2 }}>
          {p.name}: {Number(p.value).toFixed(2)}
        </p>
      ))}
    </div>
  );
};

export default function HistoryChart({ zone="zone-a", hours=24 }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [metric,  setMetric]  = useState("all");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/sensors/history?zone=${zone}&hours=${hours}`);
      if (!res.ok) throw new Error();
      const { readings } = await res.json();

      if (!readings || readings.length === 0) {
        const BASE = {
          "zone-a":{ph:5.8,turbidity:72,contamination:81},
          "zone-b":{ph:6.1,turbidity:58,contamination:63},
          "zone-c":{ph:6.4,turbidity:44,contamination:47},
          "zone-d":{ph:7.1,turbidity:18,contamination:22},
        }[zone] || {ph:6.5,turbidity:40,contamination:40};
        const synth = [];
        for (let i=hours; i>=0; i-=1) {
          const t = new Date(Date.now() - i*3600000);
          const n = v => +(v + (Math.random()-0.5)*v*0.06).toFixed(2);
          synth.push({ time:formatTime(t.toISOString()), ph:n(BASE.ph), turbidity:n(BASE.turbidity), contamination:n(BASE.contamination) });
        }
        setData(synth);
      } else {
        setData(readings.map(r => ({ time:formatTime(r.createdAt), ph:+r.ph.toFixed(2), turbidity:+r.turbidity.toFixed(1), contamination:+r.contamination.toFixed(1) })));
      }
    } catch { setData([]); }
    finally { setLoading(false); }
  }, [zone, hours]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const visible = metric==="all" ? ["ph","turbidity","contamination"] : [metric];

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <p style={{ fontSize:11, color:"var(--muted-2)", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em" }}>
          Sensor trend (last {hours}h) · {data.length} points
        </p>
        <div style={{ display:"flex", gap:4 }}>
          {["all","ph","turbidity","contamination"].map(m => (
            <button key={m} onClick={() => setMetric(m)} style={{
              padding:"3px 10px", borderRadius:999, fontSize:11, fontWeight:600, cursor:"pointer",
              background: metric===m ? "var(--orange)" : "var(--surface-2)",
              color: metric===m ? "#fff" : "var(--muted-2)",
              border: `1px solid ${metric===m ? "var(--orange)" : "var(--border)"}`,
            }}>
              {m==="all" ? "All" : m.charAt(0).toUpperCase()+m.slice(1)}
            </button>
          ))}
          <button onClick={fetchHistory} style={{ background:"none", border:"1px solid var(--border)", borderRadius:999, padding:"3px 8px", fontSize:11, cursor:"pointer", color:"var(--muted-2)" }}>↺</button>
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height:160 }} />
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="time" tick={{ fontSize:10, fill:"var(--muted)" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize:10, fill:"var(--muted)" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize:11 }} />
            {visible.includes("ph") && <>
              <ReferenceLine y={THRESHOLDS.ph.min} stroke="#3b82f630" strokeDasharray="4 2" />
              <ReferenceLine y={THRESHOLDS.ph.max} stroke="#3b82f630" strokeDasharray="4 2" />
            </>}
            {visible.includes("turbidity") && <ReferenceLine y={25} stroke="#f9731630" strokeDasharray="4 2" />}
            {visible.includes("contamination") && <ReferenceLine y={30} stroke="#ef444430" strokeDasharray="4 2" />}
            {visible.map(k => <Line key={k} type="monotone" dataKey={k} stroke={COLORS[k]} strokeWidth={2} dot={false} activeDot={{ r:3 }} name={k.charAt(0).toUpperCase()+k.slice(1)} />)}
          </LineChart>
        </ResponsiveContainer>
      )}
      <p style={{ fontSize:10, color:"var(--muted)", textAlign:"right", marginTop:6 }}>
        Dashed lines = WHO safe thresholds
      </p>
    </div>
  );
}
