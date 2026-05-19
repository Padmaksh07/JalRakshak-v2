/**
 * OfflineBanner.jsx — styled with original CSS variables (light theme)
 */
import { useState, useEffect } from "react";

export default function OfflineBanner() {
  const [isOnline, setIsOnline]               = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [offlineSince, setOfflineSince]       = useState(null);

  useEffect(() => {
    const goOff = () => { setIsOnline(false); setOfflineSince(new Date()); setShowReconnected(false); };
    const goOn  = () => { setIsOnline(true); setOfflineSince(null); setShowReconnected(true); setTimeout(() => setShowReconnected(false), 4000); };
    window.addEventListener("offline", goOff);
    window.addEventListener("online",  goOn);
    return () => { window.removeEventListener("offline", goOff); window.removeEventListener("online", goOn); };
  }, []);

  const sinceText = () => {
    if (!offlineSince) return "";
    const m = Math.floor((Date.now() - offlineSince) / 60000);
    return m < 1 ? "just now" : `${m} min ago`;
  };

  if (showReconnected) return (
    <div style={{ position:"sticky", top:0, zIndex:1000, display:"flex", alignItems:"center", gap:8, padding:"9px 20px", background:"rgba(22,163,74,0.1)", borderBottom:"1px solid rgba(22,163,74,0.25)", fontSize:13, color:"#16a34a" }}>
      <span>✓</span><span>Connection restored — refreshing live data</span>
    </div>
  );

  if (!isOnline) return (
    <div style={{ position:"sticky", top:0, zIndex:1000, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8, padding:"9px 20px", background:"rgba(245,158,11,0.1)", borderBottom:"1px solid rgba(245,158,11,0.3)", fontSize:13, color:"#92400e" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        <span style={{ fontWeight:700 }}>⚡ No internet</span>
        <span style={{ opacity:0.5 }}>·</span>
        <span>Showing cached sensor data, alerts and map tiles from last session</span>
      </div>
      {offlineSince && <span style={{ fontSize:11, opacity:0.7 }}>offline since {sinceText()}</span>}
    </div>
  );

  return null;
}
