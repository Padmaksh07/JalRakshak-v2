import { Link } from "react-router-dom";
import {
  ArrowRight, Droplets, Brain, Bell, Map,
  ShieldCheck, Activity, Zap, Users, Siren,
} from "lucide-react";

const features = [
  { icon: Brain, title: "AI-Powered Prediction", desc: "Rule-based ML engine analyzes pH, turbidity, contamination index, and rainfall data to compute disease outbreak probability with explainable reasoning." },
  { icon: Activity, title: "Real-Time IoT Monitoring", desc: "Simulated sensor nodes across flood zones push live water quality readings every 5 seconds — pH, E.coli count, dissolved oxygen, and turbidity." },
  { icon: Bell, title: "Multilingual Alert System", desc: "Instant alert dispatch in English and Hindi to 1,200+ registered residents per zone. Severity-coded: Critical, High, Medium, Low." },
  { icon: Map, title: "Zone Risk Mapping", desc: "Visual heat map of affected districts showing risk overlays per zone, enabling authorities to prioritize resources and evacuation routes." },
  { icon: ShieldCheck, title: "Outbreak Prevention", desc: "Early warning system cuts response time by predicting contamination spikes 30–60 minutes before they reach critical thresholds." },
  { icon: Zap, title: "Instant Decision Support", desc: "Actionable recommendations surfaced alongside every prediction — from boil-water advisories to full medical intervention protocols." },
];

const stats = [
  { value: "4", label: "Monitored Zones" },
  { value: "12", label: "Sensor Readings/Hour" },
  { value: "1,247", label: "Residents Covered" },
  { value: "< 30s", label: "Alert Response Time" },
];

const problems = [
  { icon: "💧", title: "Contaminated water sources", desc: "Floods mix sewage, industrial waste, and pathogens into drinking water supplies." },
  { icon: "🦠", title: "Delayed outbreak detection", desc: "Traditional lab testing takes 24–72 hours — far too slow to prevent mass infection." },
  { icon: "📵", title: "No real-time alerts", desc: "Communities receive warnings only after outbreaks begin, not before." },
];

export default function Home() {
  return (
    <div>
      {/* ── Hero ── */}
      <section style={{
        minHeight: "92vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "80px 32px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Background glow */}
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        {/* Grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "60px 60px", opacity: 0.3, pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 820 }} className="animate-fade-in">
          {/* Eyebrow */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, border: "1px solid var(--border-light)", background: "var(--surface)", marginBottom: 32, fontSize: 12, color: "var(--muted-2)", fontWeight: 500 }}>
            <span className="live-dot" />
            Post-Disaster Health Surveillance · Powered by AI + IoT
          </div>

          <h1 className="typewriter">
            Predict. <span style={{ color: "var(--orange)" }}>Prevent.</span><br />
            Protect.
          </h1>



          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/dashboard" className="btn btn-primary" style={{ fontSize: 15, padding: "12px 28px" }}>
              View Dashboard <ArrowRight size={16} />
            </Link>
            <Link to="/alerts" className="btn btn-ghost" style={{ fontSize: 15, padding: "12px 28px" }}>
              Alerts System <Bell size={16} />
            </Link>
            {/* Emergency CTA */}
            <Link to="/emergency" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 15, padding: "12px 28px", borderRadius: 8,
              background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.35)",
              color: "#dc2626", fontWeight: 700, textDecoration: "none",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.18)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(220,38,38,0.1)"; }}>
              <Siren size={16} /> Emergency Hub
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          position: "relative", zIndex: 1,
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1, marginTop: 80, width: "100%", maxWidth: 800,
          background: "var(--border)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden",
        }} className="animate-fade-in">
          {stats.map(({ value, label }) => (
            <div key={label} style={{ background: "var(--surface)", padding: "24px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: "var(--orange)", letterSpacing: "-0.02em" }}>{value}</div>
              <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 4, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem / Solution ── */}
      <section style={{ padding: "100px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--orange)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>The Problem</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 20 }}>Floods leave a silent, deadly legacy</h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: 36 }}>Every year, post-flood waterborne diseases kill hundreds of thousands. Contaminated wells, broken pipes, and flooded sanitation systems create perfect breeding grounds for cholera, typhoid, and dysentery — yet response is always reactive, never proactive.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {problems.map(({ icon, title, desc }) => (
                <div key={title} style={{ display: "flex", gap: 16, padding: "16px 20px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--success)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Our Solution</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 20 }}>AI surveillance that acts before you ask</h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: 36 }}>JalRakshak deploys simulated IoT sensor nodes across flood zones, continuously analyzing water quality parameters. The AI engine processes pH levels, turbidity, contamination index, and recent rainfall data to compute outbreak risk — and fires off multilingual alerts instantly.</p>
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
              <div style={{ background: "var(--surface-2)", padding: "10px 16px", borderBottom: "1px solid var(--border)", color: "var(--muted-2)", display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                <span style={{ marginLeft: 8 }}>ai_engine.log</span>
              </div>
              {[
                { t: "00:00", c: "var(--muted-2)", m: "[SENSOR] Zone A: pH=5.8, Turb=72 NTU" },
                { t: "00:01", c: "var(--warning)", m: "[WARN]   Contamination=81% — threshold exceeded" },
                { t: "00:01", c: "var(--warning)", m: "[WARN]   Rainfall=142mm — flood conditions active" },
                { t: "00:02", c: "var(--danger)", m: "[ALERT]  Risk Level: HIGH CHOLERA RISK" },
                { t: "00:02", c: "var(--orange)", m: "[ACTION] Dispatching SMS to 1,247 residents..." },
                { t: "00:03", c: "var(--success)", m: "[DONE]   Alert delivered. Authorities notified." },
              ].map(({ t, c, m }, i) => (
                <div key={i} style={{ padding: "8px 16px", borderBottom: i < 5 ? "1px solid var(--border)" : "none", display: "flex", gap: 12, color: c }}>
                  <span style={{ color: "var(--muted)", minWidth: 40 }}>{t}</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "80px 32px 120px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--orange)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Features</p>
          <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em" }}>Everything you need to respond faster</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--border)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ background: "var(--surface)", padding: "32px 28px", transition: "background 0.2s", cursor: "default" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface)")}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--orange-dim)", border: "1px solid rgba(249,115,22,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Icon size={20} color="var(--orange)" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{title}</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Emergency Banner ── */}
      <section style={{
        margin: "0 32px 60px", maxWidth: 1136, marginLeft: "auto", marginRight: "auto",
        borderRadius: 16, border: "1px solid rgba(220,38,38,0.3)",
        background: "linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(8,10,13,1) 60%)",
        padding: "40px 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Siren size={26} color="#dc2626" />
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>Need emergency help right now?</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>SOS alerts, hospital finder, relief supply requests & emergency contacts — all in one place.</p>
          </div>
        </div>
        <Link to="/emergency" style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          fontSize: 15, padding: "13px 28px", borderRadius: 10,
          background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
          border: "1px solid rgba(220,38,38,0.5)",
          color: "#fff", fontWeight: 800, textDecoration: "none",
          boxShadow: "0 0 24px rgba(220,38,38,0.3)", flexShrink: 0,
          transition: "all 0.2s",
        }}>
          <Siren size={16} /> Emergency Hub <ArrowRight size={16} />
        </Link>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{
        margin: "0 32px 100px", maxWidth: 1136, marginLeft: "auto", marginRight: "auto",
        borderRadius: 16, border: "1px solid rgba(249,115,22,0.3)",
        background: "linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(10,10,10,1) 60%)",
        padding: "64px 60px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40,
      }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>Ready to see it in action?</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>Explore the live dashboard with real-time sensor data and AI predictions.</p>
        </div>
        <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
          <Link to="/dashboard" className="btn btn-primary" style={{ fontSize: 15, padding: "13px 28px" }}>Open Dashboard <ArrowRight size={16} /></Link>
          <Link to="/alerts" className="btn btn-ghost" style={{ fontSize: 15, padding: "13px 28px" }}><Users size={16} /> Alert System</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 32px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          <Droplets size={14} color="var(--orange)" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>JalRakshak</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)" }}>Smart Post-Disaster Health Surveillance System · Built for disaster resilience</p>
      </footer>
    </div>
  );
}
