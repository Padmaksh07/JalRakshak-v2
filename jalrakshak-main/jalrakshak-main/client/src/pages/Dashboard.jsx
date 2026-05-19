/**
 * Dashboard.jsx  —  v3 (original UI restored)
 *
 * Keeps the exact original layout, CSS classes, and components.
 * v3 additions are layered on top:
 *   • HistoryChart row below the 4 main panels
 *   • "Send Alert" button in header (officials only)
 *   • ResidentChatbot floating widget
 *   • Real rainfall badge on the header
 */
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { RefreshCw, LogIn, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

import WaterQualityPanel from "../components/WaterQualityPanel";
import RiskPrediction    from "../components/RiskPrediction";
import AlertsPanel       from "../components/AlertsPanel";
import MapView           from "../components/MapView";
import HistoryChart      from "../components/HistoryChart";
import ResidentChatbot   from "../components/ResidentChatbot";
import { useAuth }       from "../context/AuthContext";

const ZONES = [
  { id: "zone-a", name: "Zone A – Riverside" },
  { id: "zone-b", name: "Zone B – East Plain" },
  { id: "zone-c", name: "Zone C – Market" },
  { id: "zone-d", name: "Zone D – North Belt" },
];

export default function Dashboard() {
  const { user, token, logout } = useAuth();

  const [zone,        setZone]        = useState("zone-a");
  const [sensors,     setSensors]     = useState(null);
  const [prediction,  setPrediction]  = useState(null);
  const [alerts,      setAlerts]      = useState([]);
  const [allZones,    setAllZones]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [alertMsg,    setAlertMsg]    = useState("");
  const [sending,     setSending]     = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [sensorRes, alertsRes, allZonesRes] = await Promise.all([
        axios.get(`/api/sensors?zone=${zone}`),
        axios.get("/api/alerts"),
        axios.get("/api/sensors/all-zones"),
      ]);
      setSensors(sensorRes.data);
      setAlerts(alertsRes.data);
      setAllZones(allZonesRes.data);

      const cur = sensorRes.data.current;
      const predRes = await axios.post("/api/predict", {
        ph: cur.ph, turbidity: cur.turbidity,
        contamination: cur.contamination, rainfall: cur.rainfall,
      });
      setPrediction(predRes.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [zone]);

  useEffect(() => {
    setLoading(true);
    fetchAll();
    const id = setInterval(fetchAll, 5000);
    return () => clearInterval(id);
  }, [fetchAll]);

  async function sendAlert() {
    setSending(true);
    setAlertMsg("");
    try {
      const level = prediction?.level?.toLowerCase() || "medium";
      const zoneName = ZONES.find(z => z.id === zone)?.name || zone;
      const res = await axios.post(
        "/api/alerts/send",
        { zone: zoneName, severity: level, disease: prediction?.diseases?.[0] || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAlertMsg(`✓ Alert sent (${res.data.smsSent} SMS${res.data.simulated ? " simulated" : ""})`);
      fetchAll();
    } catch (err) {
      setAlertMsg(`✗ ${err.response?.data?.error || err.message}`);
    } finally {
      setSending(false);
      setTimeout(() => setAlertMsg(""), 5000);
    }
  }

  const rainfallSource = sensors?.rainfallSource;
  const cur = sensors?.current || {};

  return (
    <div style={{ minHeight: "100vh", background: "var(--black)" }}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Health Surveillance Dashboard</h1>
          <p style={{ fontSize: 13, color: "var(--muted-2)", marginTop: 4, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            Real-time water quality monitoring · AI disease prediction
            {rainfallSource === "openmeteo" && (
              <span style={{ fontSize:10, padding:"2px 8px", borderRadius:999, background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.2)", color:"#3b82f6" }}>
                🛰 Live rainfall
              </span>
            )}
            {lastUpdated && (
              <span style={{ color:"var(--muted)" }}>
                · Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        <div style={s.controls}>
          {/* Zone selector */}
          <select className="input" style={{ width:"auto", fontSize:13 }}
            value={zone} onChange={e => setZone(e.target.value)}>
            {ZONES.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>

          {/* Refresh */}
          <button className="btn btn-ghost" style={{ padding:"8px 14px", fontSize:13 }} onClick={fetchAll}>
            <RefreshCw size={14} /> Refresh
          </button>

          {/* Auth: send alert or login link */}
          {user ? (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button
                className="btn btn-primary"
                style={{ padding:"8px 14px", fontSize:13, opacity: sending ? 0.7 : 1 }}
                onClick={sendAlert}
                disabled={sending}
              >
                📢 {sending ? "Sending…" : "Send Alert"}
              </button>
              <span style={{ fontSize:12, color:"var(--muted-2)" }}>
                {user.name}
                {user.demo && <span style={{ fontSize:10, marginLeft:4, color:"var(--orange)" }}>(demo)</span>}
              </span>
              <button className="btn btn-ghost" style={{ padding:"7px 12px", fontSize:12 }} onClick={logout}>
                <LogOut size={13} /> Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-ghost" style={{ padding:"8px 14px", fontSize:13 }}>
              <LogIn size={14} /> Official Login
            </Link>
          )}
        </div>
      </div>

      {/* Alert feedback */}
      {alertMsg && (
        <div style={{ maxWidth:1400, margin:"0 auto", padding:"0 32px" }}>
          <div style={{ padding:"9px 14px", borderRadius:8, fontSize:13,
            background: alertMsg.startsWith("✓") ? "rgba(22,163,74,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${alertMsg.startsWith("✓") ? "rgba(22,163,74,0.25)" : "rgba(239,68,68,0.25)"}`,
            color: alertMsg.startsWith("✓") ? "#16a34a" : "#ef4444" }}>
            {alertMsg}
          </div>
        </div>
      )}

      {/* ── Main 2×2 grid (original layout) ─────────────────────────── */}
      <div style={s.grid}>
        <WaterQualityPanel sensors={sensors} loading={loading} />
        <RiskPrediction    prediction={prediction} sensors={sensors} loading={loading} />
        <AlertsPanel       alerts={alerts} onRefresh={fetchAll} />
        <MapView           allZones={allZones} currentZone={zone} />
      </div>

      {/* ── v3 addition: 24h history charts ──────────────────────────── */}
      <div style={s.historyRow}>
        <div style={{ marginBottom:12 }}>
          <h2 style={{ fontSize:15, fontWeight:700 }}>24-Hour Sensor Trends</h2>
          <p style={{ fontSize:11, color:"var(--muted-2)", marginTop:3 }}>
            Historical readings for {ZONES.find(z=>z.id===zone)?.name}
          </p>
        </div>
        <div className="card">
          <HistoryChart zone={zone} hours={24} />
        </div>
      </div>

      {/* ── Floating AI chatbot ───────────────────────────────────────── */}
      <ResidentChatbot
        zoneData={cur.ph ? { ...cur, zone, riskLevel: prediction?.level } : null}
      />
    </div>
  );
}

const s = {
  header: {
    padding: "28px 32px 20px",
    maxWidth: 1400, margin: "0 auto",
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap", gap: 16,
  },
  title:    { fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" },
  controls: { display: "flex", alignItems: "center", gap: 10, flexWrap:"wrap" },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "auto auto",
    gap: 20,
    padding: "0 32px 24px",
    maxWidth: 1400, margin: "0 auto",
  },
  historyRow: {
    maxWidth: 1400, margin: "0 auto",
    padding: "0 32px 48px",
  },
};
