/**
 * AuthContext.jsx  —  demo-friendly
 * demoLogin() works with ANY username/password — no backend needed.
 */
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("jr_demo_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  function demoLogin(name, email) {
    const u = { name: name || "Demo Official", email: email || "official@jalrakshak.in", role: "official", demo: true };
    localStorage.setItem("jr_demo_user", JSON.stringify(u));
    setUser(u);
    return u;
  }

  async function login(email, password) {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }), signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("jr_token", data.token);
        localStorage.setItem("jr_demo_user", JSON.stringify(data.user));
        setToken(data.token); setUser(data.user); return data.user;
      }
    } catch {}
    return demoLogin(email.split("@")[0], email);
  }

  async function register(name, email, password) {
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }), signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("jr_token", data.token);
        localStorage.setItem("jr_demo_user", JSON.stringify(data.user));
        setToken(data.token); setUser(data.user); return data.user;
      }
    } catch {}
    return demoLogin(name, email);
  }

  function logout() {
    localStorage.removeItem("jr_token");
    localStorage.removeItem("jr_demo_user");
    setToken(null); setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token: token || (user?.demo ? "demo-token" : null), login, register, demoLogin, logout, loading, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
