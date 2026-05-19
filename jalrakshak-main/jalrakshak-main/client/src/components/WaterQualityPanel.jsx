import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Droplets, ThermometerSun, Waves, FlaskConical } from "lucide-react";

function Metric({ label, value, unit, color, status }) {
  return (
    <div style={{
      background: "var(--surface-2)", border: "1px solid var(--border)",
      borderRadius: 10, padding: "16px 18px",
    }}>
      <div style={{ fontSize: 11, color: "var(--muted-2)", fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: "-0.02em" }}>{value ?? "—"}</span>
        <span style={{ fontSize: 13, color: "var(--muted-2)" }}>{unit}</span>
      </div>
      {status && <div style={{ marginTop: 6, fontSize: 11, color, fontWeight: 600 }}>{status}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <p style={{ color: "var(--muted-2)", marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {Number(p.value).toFixed(1)}
        </p>
      ))}
    </div>
  );
};

export default function WaterQualityPanel({ sensors, loading }) {
  const cur = sensors?.current;
  const history = sensors?.history ?? [];

  const phColor = !cur ? "var(--muted-2)" : cur.ph < 6.5 ? "var(--danger)" : cur.ph > 8.5 ? "var(--warning)" : "var(--success)";
  const turbColor = !cur ? "var(--muted-2)" : cur.turbidity > 50 ? "var(--danger)" : cur.turbidity > 25 ? "var(--warning)" : "var(--success)";
  const contColor = !cur ? "var(--muted-2)" : cur.contamination > 60 ? "var(--danger)" : cur.contamination > 35 ? "var(--warning)" : "var(--success)";

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Droplets size={18} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>Water Quality Monitor</h2>
            <p style={{ fontSize: 11, color: "var(--muted-2)" }}>Live IoT sensor readings</p>
          </div>
        </div>
        <span className="live-dot" />
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Metric label="pH Level" value={cur?.ph?.toFixed(2)} unit="" color={phColor}
            status={cur?.ph < 6.5 ? "⚠ Acidic — Risk" : cur?.ph > 8.5 ? "⚠ Alkaline" : "✓ Normal"} />
          <Metric label="Turbidity" value={cur?.turbidity?.toFixed(1)} unit="NTU" color={turbColor}
            status={cur?.turbidity > 50 ? "⚠ Dangerous" : cur?.turbidity > 25 ? "⚠ Elevated" : "✓ Clear"} />
          <Metric label="Contamination" value={cur?.contamination?.toFixed(1)} unit="%" color={contColor}
            status={cur?.contamination > 60 ? "⚠ Critical" : cur?.contamination > 35 ? "⚠ Moderate" : "✓ Safe"} />
          <Metric label="E.coli Count" value={cur?.ecoli} unit="CFU/mL" color={cur?.ecoli > 250 ? "var(--danger)" : "var(--success)"}
            status={cur?.ecoli > 250 ? "⚠ Unsafe" : "✓ Within limits"} />
        </div>
      )}

      <div>
        <p style={{ fontSize: 11, color: "var(--muted-2)", marginBottom: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Contamination trend (last 60 min)
        </p>
        {loading ? (
          <div className="skeleton" style={{ height: 140 }} />
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="contamination" stroke="var(--orange)" strokeWidth={2} dot={false} name="Contamination %" />
              <Line type="monotone" dataKey="turbidity" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Turbidity NTU" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: "flex", gap: 20, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
        {[
          { icon: ThermometerSun, label: "Temp", val: cur?.temperature, unit: "°C" },
          { icon: Waves, label: "DO", val: cur?.dissolvedOxygen, unit: "mg/L" },
          { icon: FlaskConical, label: "Rainfall", val: cur?.rainfall?.toFixed(1), unit: "mm" },
        ].map(({ icon: Icon, label, val, unit }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon size={14} color="var(--muted-2)" />
            <span style={{ fontSize: 12, color: "var(--muted-2)" }}>{label}:</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{val ?? "—"} {unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
