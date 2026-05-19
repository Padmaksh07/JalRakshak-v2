import { Link, useLocation } from "react-router-dom";
import { Droplets, LayoutDashboard, Bell, Home, Siren, LogIn, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { to: "/",          label: "Home",      icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/alerts",    label: "Alerts",    icon: Bell },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <>
      <aside style={{
        position:"fixed", top:0, left:0, bottom:0, zIndex:100, width:"250px",
        background:"rgba(247,242,242,0.95)", backdropFilter:"blur(16px)",
        WebkitBackdropFilter:"blur(16px)", borderRight:"1px solid rgba(255,255,255,0.07)",
        display:"flex", flexDirection:"column", padding:"28px 20px",
      }}>
        <Link to="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none", marginBottom:40, paddingLeft:8 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,#f97316 0%,#dc2626 100%)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 16px rgba(249,115,22,0.3)", flexShrink:0 }}>
            <Droplets size={17} color="#fff" />
          </div>
          <span style={{ fontWeight:800, fontSize:16, color:"#0a0a0a", letterSpacing:"-0.01em" }}>JalRakshak</span>
          <span style={{ fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:4, background:"rgba(249,115,22,0.12)", color:"var(--orange)", letterSpacing:"0.1em", textTransform:"uppercase", border:"1px solid rgba(249,115,22,0.2)", flexShrink:0 }}>Beta</span>
        </Link>

        <nav style={{ display:"flex", flexDirection:"column", gap:8, flex:1 }}>
          {navLinks.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link key={to} to={to} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:10, fontSize:14, fontWeight:600, textDecoration:"none", transition:"all 0.15s", color:active?"var(--orange)":"var(--muted)", background:active?"rgba(249,115,22,0.1)":"transparent", border:active?"1px solid rgba(249,115,22,0.2)":"1px solid transparent" }}>
                <Icon size={18} />{label}
              </Link>
            );
          })}

          <div style={{ margin:"20px 0", height:1, background:"var(--border)" }} />

          <Link to="/emergency" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderRadius:10, fontSize:14, fontWeight:700, textDecoration:"none", transition:"all 0.2s", color:pathname==="/emergency"?"#fff":"#dc2626", background:pathname==="/emergency"?"linear-gradient(135deg,#dc2626 0%,#991b1b 100%)":"rgba(220,38,38,0.08)", border:pathname==="/emergency"?"1px solid rgba(220,38,38,0.5)":"1px solid rgba(220,38,38,0.2)", boxShadow:pathname==="/emergency"?"0 0 14px rgba(220,38,38,0.35)":"none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}><Siren size={18} />Emergency</div>
            <span style={{ width:8, height:8, borderRadius:"50%", background:pathname==="/emergency"?"#fff":"#dc2626", animation:"nav-em-pulse 1.5s ease-in-out infinite", display:"inline-block" }} />
          </Link>

          {/* Auth link */}
          <div style={{ marginTop:8 }}>
            {user ? (
              <div style={{ padding:"10px 16px", borderRadius:10, background:"rgba(249,115,22,0.06)", border:"1px solid rgba(249,115,22,0.15)" }}>
                <p style={{ fontSize:11, color:"var(--muted-2)", marginBottom:6 }}>
                  Logged in as<br />
                  <strong style={{ color:"var(--text)", fontSize:12 }}>{user.name}</strong>
                  {user.demo && <span style={{ fontSize:9, marginLeft:4, color:"var(--orange)" }}>(demo)</span>}
                </p>
                <button onClick={logout} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:"var(--muted-2)", fontSize:12, cursor:"pointer", padding:0, fontWeight:600 }}>
                  <LogOut size={13} /> Sign out
                </button>
              </div>
            ) : (
              <Link to="/login" style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:10, fontSize:14, fontWeight:600, textDecoration:"none", color:"var(--muted)", border:"1px solid transparent" }}>
                <LogIn size={18} /> Official Login
              </Link>
            )}
          </div>
        </nav>

        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:"auto", padding:"0 8px", opacity:0.8 }}>
          <span className="live-dot" />
          <span style={{ fontSize:12, color:"var(--muted)", fontWeight:500 }}>System Live</span>
        </div>
      </aside>

      <style>{`
        @keyframes nav-em-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </>
  );
}
