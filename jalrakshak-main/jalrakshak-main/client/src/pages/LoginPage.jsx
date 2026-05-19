/**
 * LoginPage.jsx  — demo mode
 * Accepts ANY username and password — no server required.
 * If the backend is running, tries real JWT first then falls back.
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Droplets, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [mode,     setMode]     = useState("login");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await login(email || "official@jalrakshak.in", password || "demo");
    setLoading(false);
    navigate("/dashboard");
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoRow}>
          <div style={s.logoBox}>
            <Droplets size={20} color="#fff" />
          </div>
          <span style={s.logoText}>JalRakshak</span>
          <span style={s.betaBadge}>Beta</span>
        </div>

        <h2 style={s.heading}>Health Official Portal</h2>
        <p style={s.sub}>Sign in to send alerts and manage zones</p>

        {/* Demo hint */}
        <div style={s.hint}>
          <ShieldCheck size={14} color="#f97316" />
          <span>
            <strong>Demo mode:</strong> any username &amp; password will work
          </span>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {["login","register"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ ...s.tab, ...(mode===m ? s.tabActive : {}) }}>
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          {mode === "register" && (
            <div style={s.field}>
              <label style={s.label}>Full Name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)}
                placeholder="Dr. Ananya Bora" />
            </div>
          )}
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input className="input" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="official@jalrakshak.in" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input className="input" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Any password works in demo mode" />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 4, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? "Signing in…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign:"center", marginTop:20, fontSize:13, color:"var(--muted-2)" }}>
          <Link to="/" style={{ color:"var(--orange)" }}>← Back to Home</Link>
          &nbsp;·&nbsp;
          <Link to="/dashboard" style={{ color:"var(--muted-2)" }}>Skip to Dashboard</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page:      { minHeight:"100vh", background:"var(--black)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
  card:      { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, padding:32, width:"100%", maxWidth:420 },
  logoRow:   { display:"flex", alignItems:"center", gap:10, marginBottom:24 },
  logoBox:   { width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#f97316 0%,#dc2626 100%)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 14px rgba(249,115,22,0.3)" },
  logoText:  { fontSize:17, fontWeight:800, color:"var(--text)", letterSpacing:"-0.01em" },
  betaBadge: { fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:4, background:"rgba(249,115,22,0.12)", color:"var(--orange)", letterSpacing:"0.1em", textTransform:"uppercase", border:"1px solid rgba(249,115,22,0.2)" },
  heading:   { fontSize:22, fontWeight:800, color:"var(--text)", marginBottom:4, letterSpacing:"-0.02em" },
  sub:       { fontSize:13, color:"var(--muted-2)", marginBottom:16 },
  hint:      { display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"rgba(249,115,22,0.08)", border:"1px solid rgba(249,115,22,0.2)", borderRadius:9, fontSize:12, color:"var(--text-secondary)", marginBottom:20 },
  tabs:      { display:"flex", background:"var(--surface-2)", borderRadius:9, padding:4, marginBottom:20, gap:4 },
  tab:       { flex:1, padding:"8px 0", border:"none", borderRadius:7, background:"transparent", color:"var(--muted-2)", cursor:"pointer", fontSize:13, fontWeight:600 },
  tabActive: { background:"var(--black)", color:"var(--orange)", boxShadow:"0 1px 4px rgba(0,0,0,0.08)", border:"1px solid var(--border)" },
  form:      { display:"flex", flexDirection:"column", gap:14 },
  field:     { display:"flex", flexDirection:"column", gap:6 },
  label:     { fontSize:12, color:"var(--muted-2)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" },
};
