import { Brain, AlertTriangle, ShieldCheck, SkipForward, CheckCircle2 } from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

const levelConfig = {
  CRITICAL: { color: "#dc2626", bg: "rgba(220,38,38,0.1)", border: "rgba(220,38,38,0.3)", label: "CRITICAL RISK" },
  HIGH:     { color: "#ea580c", bg: "rgba(234,88,12,0.1)", border: "rgba(234,88,12,0.3)",  label: "HIGH RISK" },
  MEDIUM:   { color: "#d97706", bg: "rgba(217,119,6,0.1)", border: "rgba(217,119,6,0.3)",  label: "MEDIUM RISK" },
  LOW:      { color: "#16a34a", bg: "rgba(22,163,74,0.1)", border: "rgba(22,163,74,0.25)", label: "LOW RISK" },
};

export default function RiskPrediction({ prediction, loading }) {
  const cfg = prediction ? levelConfig[prediction.level] : levelConfig.LOW;
  const pct = prediction ? Math.round((prediction.score / prediction.maxScore) * 100) : 0;
  const chartData = [{ name: "risk", value: pct, fill: cfg.color }];

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--orange-dim)", border: "1px solid rgba(249,115,22,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Brain size={18} color="var(--orange)" />
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Disease Risk Prediction</h2>
          <p style={{ fontSize: 11, color: "var(--muted-2)" }}>AI rule-based engine · Updated live</p>
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 200 }} />
      ) : prediction ? (
        <>
          {/* Risk gauge */}
          <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "16px 20px", borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            <div style={{ width: 100, height: 100, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" startAngle={90} endAngle={-270} data={chartData}>
                  <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "var(--surface-2)" }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: cfg.color, textTransform: "uppercase", marginBottom: 4 }}>
                {cfg.label}
              </div>
              <div style={{ fontSize: 40, fontWeight: 900, color: cfg.color, letterSpacing: "-0.03em", lineHeight: 1 }}>
                {pct}<span style={{ fontSize: 18 }}>%</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 4 }}>
                Score: {prediction.score}/{prediction.maxScore}
              </div>
            </div>
          </div>

          {/* Disease risks */}
          {prediction.diseases?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: "var(--muted-2)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Likely Pathogens</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {prediction.diseases.map((d) => (
                  <span key={d} style={{ padding: "4px 11px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning */}
          <div>
            <p style={{ fontSize: 11, color: "var(--muted-2)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
              AI Reasoning
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {prediction.reasons.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 12px", borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  <AlertTriangle size={13} color={cfg.color} style={{ flexShrink: 0, marginTop: 1 }} />
                  {r}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <CheckCircle2 size={16} color="var(--orange)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--orange)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Recommended Action</p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{prediction.recommendation}</p>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: 40, color: "var(--muted-2)" }}>No data available</div>
      )}
    </div>
  );
}
