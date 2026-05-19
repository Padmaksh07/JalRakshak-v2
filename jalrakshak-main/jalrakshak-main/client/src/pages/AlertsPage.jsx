/**
 * AlertsPage — v2
 *
 * Changes over v1:
 *  • Assamese language toggle (3rd language, alongside English & Hindi)
 *  • PDF report download button
 *  • Shows real SMS status (sent vs simulated)
 *  • Handles MongoDB ObjectId-based alert ids
 */

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Bell, Send, CheckCircle2, AlertTriangle, Info, AlertCircle,
  X, Languages, Download, FileText,
} from "lucide-react";

const ZONES = [
  "Zone A – Riverside Colony",
  "Zone B – East Flood Plain",
  "Zone C – Low-lying Market",
  "Zone D – Northern Slum Belt",
];
const SEVERITIES = ["low", "medium", "high"];
const DISEASES    = ["Cholera", "Typhoid", "Dysentery", "Hepatitis A", "Leptospirosis", "Gastroenteritis"];

// Language cycle: en → hi → as → en
const LANG_CYCLE  = ["en", "hi", "as"];
const LANG_LABELS = { en: "English", hi: "हिंदी", as: "অসমীয়া" };

const sevStyle = {
  high:   { color: "#ea580c", bg: "rgba(234,88,12,0.08)",  border: "rgba(234,88,12,0.25)" },
  medium: { color: "#d97706", bg: "rgba(217,119,6,0.08)",  border: "rgba(217,119,6,0.25)" },
  low:    { color: "#16a34a", bg: "rgba(22,163,74,0.08)",  border: "rgba(22,163,74,0.2)"  },
};
const SevIcon = { high: AlertTriangle, medium: AlertCircle, low: Info };

// Preview templates (mirrored from server)
const preview = {
  en: {
    high:   (z, d) => `High ${d} risk detected in ${z}. Avoid tap water. Use bottled/boiled water only.`,
    medium: (z)    => `Moderate contamination risk in ${z}. Boil all drinking water before use.`,
    low:    (z)    => `Routine advisory for ${z}. Monitor water quality.`,
  },
  hi: {
    high:   (z, d) => `${z} में ${d} का उच्च जोखिम। तत्काल सुरक्षित पेयजल का उपयोग करें।`,
    medium: (z)    => `${z} में जल प्रदूषण का मध्यम जोखिम। पीने से पहले पानी उबालें।`,
    low:    (z)    => `${z} में जल गुणवत्ता सामान्य है। सावधानी बरतें।`,
  },
  as: {
    high:   (z, d) => `${z}ত ${d}ৰ উচ্চ বিপদ আছে। তৎক্ষণাত নিৰাপদ পানীয় জল ব্যৱহাৰ কৰক।`,
    medium: (z)    => `${z}ত জল প্ৰদূষণৰ মধ্যম বিপদ আছে। পান কৰাৰ আগতে পানী উতলাওক।`,
    low:    (z)    => `${z}ত জলৰ মান স্বাভাৱিক। সতৰ্ক থাকক।`,
  },
};

function getPreview(lang, severity, zone, disease) {
  const fn = preview[lang]?.[severity];
  return fn ? (severity === "high" ? fn(zone, disease) : fn(zone)) : "";
}

function getAlertText(alert, lang) {
  if (lang === "hi") return alert.hindiMessage    || alert.message;
  if (lang === "as") return alert.assameseMessage || alert.message;
  return alert.message;
}

function timeAgo(ts) {
  const d = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (d < 60)   return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  return `${Math.floor(d / 3600)}h ago`;
}

// ── PDF download ──────────────────────────────────────────────────────────────
function downloadPdf({ days = 7, zone = "all", severity = "all" } = {}) {
  const params = new URLSearchParams({ days, zone, severity });
  window.open(`/api/reports/pdf?${params}`, "_blank");
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AlertsPage() {
  const [alerts, setAlerts]     = useState([]);
  const [zone, setZone]         = useState(ZONES[0]);
  const [severity, setSeverity] = useState("high");
  const [disease, setDisease]   = useState(DISEASES[0]);
  const [sending, setSending]   = useState(false);
  const [success, setSuccess]   = useState(null);
  // Per-card language: alertId → "en"|"hi"|"as"
  const [cardLang, setCardLang] = useState({});
  // Preview language
  const [previewLang, setPreviewLang] = useState("en");
  const [pdfDays, setPdfDays]   = useState(7);

  const fetchAlerts = async () => {
    try {
      const r = await axios.get("/api/alerts");
      setAlerts(r.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleSend = async () => {
    setSending(true); setSuccess(null);
    try {
      const r = await axios.post("/api/alerts/send", { zone, severity, disease });
      setSuccess(r.data);
      await fetchAlerts();
      setTimeout(() => setSuccess(null), 6000);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleDismiss = async (id) => {
    try { await axios.delete(`/api/alerts/${id}`); fetchAlerts(); } catch {}
  };

  const cycleLang = (id, currentLang) => {
    const idx  = LANG_CYCLE.indexOf(currentLang || "en");
    const next = LANG_CYCLE[(idx + 1) % LANG_CYCLE.length];
    setCardLang((p) => ({ ...p, [id]: next }));
  };

  const s = {
    page:  { minHeight: "100vh" },
    inner: { maxWidth: 1100, margin: "0 auto", padding: "36px 32px" },
    grid:  { display: "grid", gridTemplateColumns: "400px 1fr", gap: 24, marginTop: 28 },
  };

  return (
    <div style={s.page}>
      <div style={s.inner}>
        {/* Header */}
        <div style={{ marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>Alert System</h1>
            <p style={{ color: "var(--muted-2)", fontSize: 13, marginTop: 6 }}>
              Multilingual health alerts · English · हिंदी · অসমীয়া
            </p>
          </div>

          {/* ── PDF Report download ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select
              className="input"
              value={pdfDays}
              onChange={(e) => setPdfDays(Number(e.target.value))}
              style={{ width: 110, fontSize: 12, padding: "6px 10px" }}
            >
              {[1, 7, 14, 30].map((d) => (
                <option key={d} value={d}>Last {d} day{d > 1 ? "s" : ""}</option>
              ))}
            </select>
            <button
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", fontSize: 13 }}
              onClick={() => downloadPdf({ days: pdfDays })}
              title="Download PDF report of all alerts"
            >
              <Download size={14} /> PDF Report
            </button>
          </div>
        </div>

        <div style={s.grid}>
          {/* ── Composer ── */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20, height: "fit-content" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--orange-dim)", border: "1px solid rgba(249,115,22,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Send size={17} color="var(--orange)" />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700 }}>Compose Alert</h2>
                <p style={{ fontSize: 11, color: "var(--muted-2)" }}>Auto-translates · English · हिंदी · অসমীয়া</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Zone */}
              <div>
                <label style={labelStyle}>Zone</label>
                <select className="input" value={zone} onChange={(e) => setZone(e.target.value)}>
                  {ZONES.map((z) => <option key={z}>{z}</option>)}
                </select>
              </div>

              {/* Severity */}
              <div>
                <label style={labelStyle}>Severity</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {SEVERITIES.map((sev) => (
                    <button key={sev} onClick={() => setSeverity(sev)}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer",
                        border: `1px solid ${severity === sev ? sevStyle[sev].border : "var(--border)"}`,
                        background: severity === sev ? sevStyle[sev].bg : "var(--surface-2)",
                        color: severity === sev ? sevStyle[sev].color : "var(--muted-2)",
                        fontWeight: 600, fontSize: 12, textTransform: "capitalize", transition: "all 0.15s",
                      }}>
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Disease */}
              <div>
                <label style={labelStyle}>Disease / Risk Type</label>
                <select className="input" value={disease} onChange={(e) => setDisease(e.target.value)}>
                  {DISEASES.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Preview with language switcher */}
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Preview
                </p>
                {/* Language tabs */}
                <div style={{ display: "flex", gap: 4 }}>
                  {LANG_CYCLE.map((lang) => (
                    <button key={lang} onClick={() => setPreviewLang(lang)}
                      style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5, cursor: "pointer",
                        background: previewLang === lang ? "var(--orange)" : "none",
                        color: previewLang === lang ? "#fff" : "var(--muted-2)",
                        border: `1px solid ${previewLang === lang ? "var(--orange)" : "var(--border)"}`,
                        transition: "all 0.15s",
                      }}>
                      {LANG_LABELS[lang]}
                    </button>
                  ))}
                </div>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                {getPreview(previewLang, severity, zone, disease)}
              </p>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px" }}
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? (
                <><SpinDot /> Dispatching…</>
              ) : (
                <><Send size={15} /> Send Alert to {zone.split("–")[0].trim()}</>
              )}
            </button>

            {success && (
              <div className="animate-fade-in" style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.25)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <CheckCircle2 size={16} color="#22c55e" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#22c55e" }}>Alert Dispatched</p>
                  <p style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 2 }}>{success.message}</p>
                  {success.simulated && (
                    <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, fontStyle: "italic" }}>
                      ℹ️ SMS simulated — add Twilio creds in .env for real dispatch
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Alert Feed ── */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bell size={18} color="#ef4444" />
                </div>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 700 }}>Alert History</h2>
                  <p style={{ fontSize: 11, color: "var(--muted-2)" }}>{alerts.length} alerts · MongoDB persisted</p>
                </div>
              </div>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }} onClick={fetchAlerts}>
                Refresh
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 580, overflowY: "auto" }}>
              {alerts.map((alert) => {
                const ss    = sevStyle[alert.severity] || sevStyle.low;
                const Icon  = SevIcon[alert.severity] || Info;
                const lang  = cardLang[alert.id] || "en";
                const text  = getAlertText(alert, lang);
                const hasAs = !!alert.assameseMessage;

                return (
                  <div key={alert.id} className="animate-slide-right"
                    style={{ padding: "14px 16px", borderRadius: 10, background: ss.bg, border: `1px solid ${ss.border}`, display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <Icon size={15} color={ss.color} style={{ flexShrink: 0, marginTop: 3 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: ss.color, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                          {alert.severity} · {alert.zone}
                        </span>
                        <span style={{ fontSize: 10, color: "var(--muted)" }}>{timeAgo(alert.timestamp || alert.createdAt)}</span>
                      </div>

                      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 6 }}>
                        {text}
                      </p>

                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        {/* Language cycle button */}
                        <button
                          onClick={() => cycleLang(alert.id, lang)}
                          style={{ fontSize: 10, fontWeight: 600, color: ss.color, background: "none", border: `1px solid ${ss.border}`, borderRadius: 5, padding: "2px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <Languages size={9} />
                          {LANG_LABELS[lang]}
                          {hasAs && " ↻"}
                        </button>

                        {/* SMS status */}
                        {alert.sent && (
                          <span style={{ fontSize: 10, color: "#22c55e", display: "flex", alignItems: "center", gap: 3 }}>
                            <CheckCircle2 size={10} />
                            {alert.simulated ? "SMS Simulated" : `SMS Sent (${alert.smsCount || 0})`}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDismiss(alert.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 2, flexShrink: 0 }}>
                      <X size={13} />
                    </button>
                  </div>
                );
              })}

              {alerts.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted-2)" }}>
                  <Bell size={28} style={{ opacity: 0.3, marginBottom: 10 }} />
                  <p style={{ fontSize: 13 }}>No alerts yet. Compose one to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const labelStyle = {
  fontSize: 11, fontWeight: 600, color: "var(--muted-2)",
  textTransform: "uppercase", letterSpacing: "0.07em",
  display: "block", marginBottom: 6,
};

function SpinDot() {
  return (
    <span style={{
      width: 14, height: 14,
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "#fff", borderRadius: "50%",
      display: "inline-block",
      animation: "spin-slow 0.8s linear infinite",
    }} />
  );
}
