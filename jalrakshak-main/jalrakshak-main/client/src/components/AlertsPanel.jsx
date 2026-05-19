import { useState } from "react";
import { Bell, X, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

const severityIcon = { high: AlertTriangle, medium: AlertCircle, low: Info };
const severityStyle = {
  high:   { color: "#ea580c", bg: "rgba(234,88,12,0.08)",   border: "rgba(234,88,12,0.2)" },
  medium: { color: "#d97706", bg: "rgba(217,119,6,0.08)",   border: "rgba(217,119,6,0.2)" },
  low:    { color: "#16a34a", bg: "rgba(22,163,74,0.08)",   border: "rgba(22,163,74,0.2)" },
};

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function AlertsPanel({ alerts, onRefresh }) {
  const [dismissed, setDismissed] = useState(new Set());
  const visible = (alerts || []).filter((a) => !dismissed.has(a.id)).slice(0, 6);

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell size={18} color="#ef4444" />
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>Active Alerts</h2>
            <p style={{ fontSize: 11, color: "var(--muted-2)" }}>{visible.length} active alert{visible.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Link to="/alerts" className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }}>
          Manage All
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto" }}>
        {visible.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted-2)", fontSize: 13 }}>
            No active alerts
          </div>
        ) : (
          visible.map((alert) => {
            const sev = severityStyle[alert.severity] || severityStyle.low;
            const Icon = severityIcon[alert.severity] || Info;
            return (
              <div
                key={alert.id}
                className="animate-slide-right"
                style={{
                  padding: "12px 14px",
                  borderRadius: 9,
                  background: sev.bg,
                  border: `1px solid ${sev.border}`,
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <Icon size={15} color={sev.color} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: sev.color, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      {alert.severity} · {alert.zone}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>{timeAgo(alert.timestamp)}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 4 }}>
                    {alert.message}
                  </p>
                  {alert.hindiMessage && (
                    <p style={{ fontSize: 11, color: "var(--muted-2)", fontStyle: "italic" }}>
                      {alert.hindiMessage}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setDismissed((p) => new Set([...p, alert.id]))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 2, flexShrink: 0 }}
                >
                  <X size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
