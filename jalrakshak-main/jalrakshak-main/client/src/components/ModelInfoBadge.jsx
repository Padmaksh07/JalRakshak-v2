/**
 * ModelInfoBadge.jsx
 * Small collapsible panel showing the ML model's metadata.
 * Renders on the Prediction card so judges can inspect the model.
 *
 * Props:  modelInfo  object  from /api/predict/model-info
 */
import { useState } from "react";

export default function ModelInfoBadge({ modelInfo }) {
  const [open, setOpen] = useState(false);
  if (!modelInfo) return null;

  const imp = modelInfo.feature_importances || {};
  const sorted = Object.entries(imp).sort(([,a],[,b]) => b - a);

  return (
    <div style={styles.wrap}>
      <button onClick={() => setOpen(o => !o)} style={styles.toggle}>
        🤖 ML Model — {modelInfo.validation_accuracy
          ? `${(modelInfo.validation_accuracy * 100).toFixed(1)}% validation accuracy`
          : modelInfo.type}
        <span style={{ marginLeft:6 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={styles.body}>
          <Row label="Type"      value={modelInfo.type} />
          <Row label="Version"   value={modelInfo.version} />
          <Row label="Dataset"   value={modelInfo.trained_on} />
          <Row label="Samples"   value={modelInfo.training_samples?.toLocaleString()} />
          <Row label="Train acc" value={pct(modelInfo.training_accuracy)} />
          <Row label="Val acc"   value={pct(modelInfo.validation_accuracy)} />

          <div style={styles.divider} />
          <div style={styles.impTitle}>Feature Importances</div>
          {sorted.map(([feat, val]) => (
            <div key={feat} style={styles.impRow}>
              <span style={styles.impLabel}>{feat}</span>
              <div style={styles.bar}>
                <div style={{ ...styles.barFill, width: `${val * 100}%` }} />
              </div>
              <span style={styles.impVal}>{(val * 100).toFixed(1)}%</span>
            </div>
          ))}

          <div style={styles.divider} />
          <p style={styles.note}>
            Softmax logistic regression trained on synthetic CPCB Brahmaputra Basin
            data (2018–2023). See <code>server/ml/train.py</code> for full pipeline.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"2px 0" }}>
      <span style={{ color:"#64748b" }}>{label}</span>
      <span style={{ color:"#cbd5e1" }}>{value}</span>
    </div>
  );
}

function pct(v) { return v ? `${(v * 100).toFixed(1)}%` : "—"; }

const styles = {
  wrap:     { background:"#0f172a", borderRadius:10, overflow:"hidden", marginTop:10 },
  toggle:   { width:"100%", padding:"9px 12px", background:"none", border:"none",
             color:"#60a5fa", fontSize:12, cursor:"pointer", textAlign:"left", display:"flex",
             alignItems:"center", justifyContent:"space-between" },
  body:     { padding:"0 12px 12px" },
  divider:  { height:1, background:"#1e293b", margin:"10px 0" },
  impTitle: { fontSize:11, color:"#64748b", marginBottom:6 },
  impRow:   { display:"flex", alignItems:"center", gap:6, marginBottom:4 },
  impLabel: { fontSize:10, color:"#94a3b8", width:170, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  bar:      { flex:1, height:5, background:"#1e293b", borderRadius:3, overflow:"hidden" },
  barFill:  { height:"100%", background:"#3b82f6", borderRadius:3, transition:"width 0.5s" },
  impVal:   { fontSize:10, color:"#60a5fa", width:36, textAlign:"right" },
  note:     { fontSize:10, color:"#475569", margin:0, lineHeight:1.5 },
};
