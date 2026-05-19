import { useState, useEffect, useRef } from "react";
import {
  PhoneCall,
  MapPin,
  Package,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Radio,
  Siren,
  Hospital,
  Truck,
  Share2,
  Copy,
  ChevronRight,
  Clock,
  Users,
  ShieldAlert,
  X,
  Loader2,
  Phone,
  ExternalLink,
  Heart,
  Flame,
  Waves,
} from "lucide-react";

/* ─── Emergency Contacts ─────────────────────────────── */
const EMERGENCY_CONTACTS = [
  { label: "National Disaster Response Force", number: "011-24363260", color: "#dc2626", icon: ShieldAlert },
  { label: "Ambulance / Medical Emergency", number: "108", color: "#ef4444", icon: Heart },
  { label: "Police Control Room", number: "100", color: "#3b82f6", icon: Radio },
  { label: "Fire & Rescue", number: "101", color: "#f97316", icon: Flame },
  { label: "Flood Relief Helpline", number: "1070", color: "#06b6d4", icon: Waves },
];

/* ─── Simulated Relief Camps ─────────────────────────── */
const RELIEF_CAMPS = [
  { id: "RC-01", name: "Govt. School Relief Camp", area: "Zone A – Riverside", distance: "0.8 km", capacity: 350, available: 142, supplies: ["Water Packets", "Food Rations", "Medicines", "Blankets"] },
  { id: "RC-02", name: "Community Hall Shelter", area: "Zone B – East Plain", distance: "1.4 km", capacity: 200, available: 61, supplies: ["Water Packets", "Food Rations", "Baby Food"] },
  { id: "RC-03", name: "Temple Ground Camp", area: "Zone C – Market", distance: "2.1 km", capacity: 500, available: 210, supplies: ["Food Rations", "Medicines", "ORS Packets", "Blankets"] },
];

const SUPPLY_ITEMS = ["Drinking Water", "Food Rations", "ORS Packets", "Medicines", "Baby Food", "Blankets", "Sanitation Kit"];

/* ─── Nearest Hospitals (simulated) ─────────────────── */
const HOSPITALS = [
  { id: "H1", name: "District Civil Hospital", distance: "1.2 km", beds: 120, emergency: true, lat: 24.812, lng: 93.941, status: "OPEN" },
  { id: "H2", name: "Primary Health Centre – Zone A", distance: "0.6 km", beds: 30, emergency: false, lat: 24.808, lng: 93.937, status: "OPEN" },
  { id: "H3", name: "St. Joseph's Medical Centre", distance: "2.8 km", beds: 80, emergency: true, lat: 24.820, lng: 93.952, status: "OPEN" },
  { id: "H4", name: "Flood Relief Medical Unit", distance: "1.7 km", beds: 50, emergency: true, lat: 24.815, lng: 93.930, status: "ACTIVE" },
];

/* ─── Helpers ────────────────────────────────────────── */
function formatCoords(lat, lng) {
  return `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;
}

function gmapsUrl(lat, lng) {
  return `https://www.google.com/maps/search/hospital/@${lat},${lng},14z`;
}

function osmNearbyHospitals(lat, lng) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=14&layers=N`;
}

/* ─── SOS Map SVG ────────────────────────────────────── */
function HospitalMapSVG({ userLat, userLng, hospitalsData = [] }) {
  const scale = 15000; // scale factor for lat/lng to SVG pixels

  const dynamicHospitals = hospitalsData.map((h, i) => {
    // If coords are missing, put them somewhere randomly around center
    const dx = userLng && h.lng ? (h.lng - userLng) * scale : (Math.cos(i) * 50);
    const dy = userLat && h.lat ? (userLat - h.lat) * scale : (Math.sin(i) * 40); // y-axis inverted

    // keep within map bounds
    const x = Math.max(30, Math.min(320, 175 + dx));
    const y = Math.max(30, Math.min(200, 125 + dy));

    const isEmergency = h.emergency || h.status === "ACTIVE";
    const color = isEmergency ? "#dc2626" : "#22c55e";
    const shortName = h.name.split(" ")[0] + (h.name.length > 8 ? "..." : "");

    return { x, y, label: shortName, color, pulse: false, size: isEmergency ? 8 : 6 };
  });

  const mapMarkers = [
    { x: 175, y: 125, label: "YOU", color: "#f97316", pulse: true, size: 10 },
    ...dynamicHospitals
  ];

  return (
    <div style={{ background: "#fefeffff", borderRadius: 12, border: "1px solid rgba(220,38,38,0.2)", overflow: "hidden", position: "relative" }}>
      {/* Map header bar */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", fontFamily: "monospace" }}>
          {userLat && userLng ? formatCoords(userLat, userLng) : "Locating…"}
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", letterSpacing: "0.1em" }}>● LIVE</span>
      </div>

      <svg viewBox="0 0 350 230" width="100%" style={{ display: "block" }}>
        {/* Grid */}
        <defs>
          <pattern id="em-grid" width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />
          </pattern>
          <radialGradient id="you-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="350" height="230" fill="#ffffff" />
        <rect width="350" height="230" fill="url(#em-grid)" />

        {/* Roads */}
        <line x1="0" y1="125" x2="350" y2="125" stroke="rgba(0,0,0,0.06)" strokeWidth="12" />
        <line x1="175" y1="0" x2="175" y2="230" stroke="rgba(0,0,0,0.06)" strokeWidth="8" />
        <path d="M 60 50 Q 175 60 280 50" stroke="rgba(0,0,0,0.04)" strokeWidth="6" fill="none" />

        {/* Distance rings */}
        <circle cx="175" cy="125" r="45" fill="none" stroke="rgba(249,115,22,0.12)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="175" cy="125" r="85" fill="none" stroke="rgba(249,115,22,0.07)" strokeWidth="1" strokeDasharray="4 4" />

        {/* Lines from user to hospitals */}
        {dynamicHospitals.map(({ x: hx, y: hy }, i) => (
          <line key={i} x1="175" y1="125" x2={hx} y2={hy}
            stroke="rgba(220,38,38,0.25)" strokeWidth="1" strokeDasharray="3 3" />
        ))}

        {/* YOU glow */}
        <circle cx="175" cy="125" r="28" fill="url(#you-glow)" />

        {/* Markers */}
        {mapMarkers.map(({ x, y, label, color, pulse, size }, i) => (
          <g key={i}>
            {pulse && <circle cx={x} cy={y} r={size + 8} fill={color} opacity="0.15">
              <animate attributeName="r" values={`${size + 5};${size + 14};${size + 5}`} dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
            </circle>}
            <circle cx={x} cy={y} r={size} fill={color} />
            {label !== "YOU" && <text x={x} y={y - size - 3} textAnchor="middle" fontSize="7.5"
              fill="rgba(0,0,0,0.7)" fontFamily="Inter, sans-serif" fontWeight="600">{label}</text>}
            {label === "YOU" && <text x={x} y={y + size + 10} textAnchor="middle" fontSize="8"
              fill="#f97316" fontFamily="Inter, sans-serif" fontWeight="800">YOU</text>}
          </g>
        ))}

        {/* Legend */}
        <g transform="translate(8, 208)">
          {[{ c: "#f97316", l: "Your Location" }, { c: "#dc2626", l: "Hospital" }, { c: "#22c55e", l: "PHC" }, { c: "#f59e0b", l: "Relief Unit" }].map(({ c, l }, i) => (
            <g key={l} transform={`translate(${i * 84}, 0)`}>
              <circle cx="5" cy="5" r="4" fill={c} />
              <text x="13" y="9" fontSize="7.5" fill="rgba(0,0,0,0.45)" fontFamily="Inter">{l}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

/* ─── Section Header ─────────────────────────────────── */
function SectionHeader({ icon: Icon, title, subtitle, color = "#dc2626" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", color: "#0a0a0a" }}>{title}</h2>
        <p style={{ fontSize: 12, color: "rgba(0,0,0,0.38)", marginTop: 2 }}>{subtitle}</p>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────── */
export default function EmergencyPage() {
  const [location, setLocation] = useState(null);
  const [hospitals, setHospitals] = useState(HOSPITALS);
  const [reliefCamps, setReliefCamps] = useState(RELIEF_CAMPS);
  const [locError, setLocError] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(0);
  const [sosActive, setSosActive] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [supplyItems, setSupplyItems] = useState([]);
  const [peopleCount, setPeopleCount] = useState(1);
  const [supplySuccess, setSupplySuccess] = useState(false);
  const [supplyLoading, setSupplyLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("sos");
  const countdownRef = useRef(null);

  /* Auto-fetch location on mount */
  useEffect(() => {
    fetchLocation();
  }, []);

  function fetchLocation() {
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported by browser.");
      return;
    }
    setLocLoading(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng, accuracy: pos.coords.accuracy });
        setLocLoading(false);
        fetchDynamicEmergencyInfo(lat, lng);
      },
      (err) => {
        // Use fallback demo coords (Imphal region)
        const lat = 24.8074;
        const lng = 93.9384;
        setLocation({ lat, lng, accuracy: null, demo: true });
        setLocError(null);
        setLocLoading(false);
        fetchDynamicEmergencyInfo(lat, lng);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  async function fetchDynamicEmergencyInfo(lat, lng) {
    try {
      const res = await fetch("http://localhost:5000/api/gemini/emergency-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });
      const data = await res.json();
      if (data.hospitals) setHospitals(data.hospitals);
      if (data.camps) setReliefCamps(data.camps);
    } catch (err) {
      console.error("Failed to fetch dynamic emergency info", err);
    }
  }

  function copyCoords() {
    if (!location) return;
    const text = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2500);
    });
  }

  function shareLocation() {
    if (!location) return;
    const text = `🆘 EMERGENCY — My Location:\nhttps://maps.google.com/?q=${location.lat},${location.lng}\nCoordinates: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
    if (navigator.share) {
      navigator.share({ title: "🆘 Emergency Location", text });
    } else {
      navigator.clipboard.writeText(text).then(() => alert("Location copied! Share it via WhatsApp or SMS."));
    }
  }

  function triggerSOS() {
    if (sosActive) return;
    setSosActive(true);
    setSosCountdown(5);
    countdownRef.current = setInterval(() => {
      setSosCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdownRef.current);
          setSosActive(false);
          setSosSent(true);

          if (location) {
            fetch("http://localhost:5000/api/alerts/sos", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lat: location.lat, lng: location.lng }),
            }).catch(e => console.error(e));
          }

          setTimeout(() => setSosSent(false), 8000);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  function cancelSOS() {
    clearInterval(countdownRef.current);
    setSosActive(false);
    setSosCountdown(0);
  }

  function toggleSupplyItem(item) {
    setSupplyItems((p) => p.includes(item) ? p.filter((i) => i !== item) : [...p, item]);
  }

  function requestSupply() {
    if (!selectedCamp || supplyItems.length === 0) return;
    setSupplyLoading(true);
    setTimeout(() => {
      setSupplyLoading(false);
      setSupplySuccess(true);
      setTimeout(() => setSupplySuccess(false), 6000);
    }, 1800);
  }

  const TABS = [
    { id: "sos", label: "SOS", icon: Siren },
    { id: "hospitals", label: "Hospitals", icon: Hospital },
    { id: "supplies", label: "Supplies", icon: Package },
    { id: "contacts", label: "Contacts", icon: Phone },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>

      {/* ── Page Banner ─────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(220,38,38,0.18) 0%, rgba(248,250,252,1) 60%)",
        borderBottom: "1px solid rgba(220,38,38,0.2)",
        padding: "28px 32px 0",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%", background: "#dc2626",
              boxShadow: "0 0 0 0 #dc2626",
              animation: "em-pulse 1.4s infinite",
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              Emergency Response Hub
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#0a0a0a", marginBottom: 8 }}>
            Emergency <span style={{ color: "#dc2626" }}>Control</span>
          </h1>
          <p style={{ fontSize: 14, color: "rgba(0,0,0,0.45)", marginBottom: 20 }}>
            SOS alerts · Hospital finder · Relief supply requests · Emergency contacts
          </p>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 2 }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "10px 18px",
                borderRadius: "8px 8px 0 0",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                transition: "all 0.15s",
                background: activeTab === id ? "#0d1117" : "transparent",
                color: activeTab === id ? "#dc2626" : "rgba(0,0,0,0.35)",
                borderTop: activeTab === id ? "1px solid rgba(220,38,38,0.4)" : "1px solid transparent",
                borderLeft: activeTab === id ? "1px solid rgba(220,38,38,0.15)" : "1px solid transparent",
                borderRight: activeTab === id ? "1px solid rgba(220,38,38,0.15)" : "1px solid transparent",
                position: "relative",
                bottom: -1,
              }}>
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 32px 60px" }}>

        {/* ════════ SOS TAB ════════ */}
        {activeTab === "sos" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* SOS Trigger Card */}
            <div style={{
              background: "#ffffff",
              border: "1px solid rgba(220,38,38,0.25)",
              borderRadius: 16,
              padding: 28,
              display: "flex", flexDirection: "column", gap: 24,
            }}>
              <SectionHeader icon={Siren} title="SOS Emergency Alert" subtitle="Triggers call + broadcasts your location" color="#dc2626" />

              {/* Big SOS button */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{ position: "relative", display: "inline-block" }}>
                  {/* Pulse rings */}
                  {(sosActive || sosSent) && (
                    <>
                      <div style={{ position: "absolute", inset: -16, borderRadius: "50%", border: "2px solid rgba(220,38,38,0.4)", animation: "ring-out 1.5s infinite" }} />
                      <div style={{ position: "absolute", inset: -32, borderRadius: "50%", border: "1px solid rgba(220,38,38,0.2)", animation: "ring-out 1.5s 0.4s infinite" }} />
                    </>
                  )}
                  <button
                    onClick={sosActive ? cancelSOS : triggerSOS}
                    disabled={sosSent}
                    style={{
                      width: 140, height: 140,
                      borderRadius: "50%",
                      background: sosSent
                        ? "radial-gradient(circle, #166534 0%, #14532d 100%)"
                        : sosActive
                          ? "radial-gradient(circle, #991b1b 0%, #7f1d1d 100%)"
                          : "radial-gradient(circle, #dc2626 0%, #991b1b 100%)",
                      border: `3px solid ${sosSent ? "#22c55e" : sosActive ? "#fca5a5" : "#ef4444"}`,
                      cursor: sosSent ? "default" : "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: sosActive
                        ? "0 0 40px rgba(220,38,38,0.6)"
                        : sosSent
                          ? "0 0 30px rgba(34,197,94,0.4)"
                          : "0 0 24px rgba(220,38,38,0.3)",
                      transition: "all 0.3s",
                    }}
                  >
                    {sosSent ? (
                      <>
                        <CheckCircle2 size={32} color="#22c55e" />
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#22c55e", letterSpacing: "0.1em" }}>SENT</span>
                      </>
                    ) : sosActive ? (
                      <>
                        <span style={{ fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{sosCountdown}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em" }}>TAP TO CANCEL</span>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "0.04em" }}>SOS</span>
                        <PhoneCall size={20} color="rgba(0,0,0,0.8)" />
                      </>
                    )}
                  </button>
                </div>

                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 12, color: "rgba(0,0,0,0.35)", lineHeight: 1.6 }}>
                    {sosSent
                      ? "✅ SOS dispatched to NDRF & local authorities"
                      : sosActive
                        ? "Hold — broadcasting in " + sosCountdown + "s"
                        : "Press & hold to broadcast emergency to authorities"}
                  </p>
                </div>
              </div>

              {/* Quick call buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Quick Dial</p>
                {[{ n: "108", l: "Ambulance" }, { n: "100", l: "Police" }, { n: "1070", l: "Flood Helpline" }].map(({ n, l }) => (
                  <a key={n} href={`tel:${n}`} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px", borderRadius: 10,
                    background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)",
                    textDecoration: "none", transition: "all 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(220,38,38,0.14)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(220,38,38,0.07)"}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <PhoneCall size={15} color="#dc2626" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#0a0a0a" }}>{l}</span>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#dc2626", fontFamily: "monospace" }}>{n}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Location Sharing Card */}
            <div style={{
              background: "#ffffff",
              border: "1px solid rgba(249,115,22,0.2)",
              borderRadius: 16,
              padding: 28,
              display: "flex", flexDirection: "column", gap: 20,
            }}>
              <SectionHeader icon={MapPin} title="Share Your Location" subtitle="Send GPS coordinates to rescuers" color="#f97316" />

              {/* Location status */}
              <div style={{
                padding: "16px 20px",
                borderRadius: 12,
                background: location
                  ? "rgba(34,197,94,0.07)"
                  : locLoading
                    ? "rgba(249,115,22,0.07)"
                    : "rgba(239,68,68,0.07)",
                border: `1px solid ${location ? "rgba(34,197,94,0.2)" : locLoading ? "rgba(249,115,22,0.2)" : "rgba(239,68,68,0.2)"}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: location ? 10 : 0 }}>
                  {locLoading ? (
                    <Loader2 size={16} color="#f97316" style={{ animation: "spin-slow 1s linear infinite" }} />
                  ) : location ? (
                    <CheckCircle2 size={16} color="#22c55e" />
                  ) : (
                    <AlertTriangle size={16} color="#ef4444" />
                  )}
                  <span style={{ fontSize: 13, fontWeight: 600, color: location ? "#22c55e" : locLoading ? "#f97316" : "#ef4444" }}>
                    {locLoading ? "Acquiring GPS…" : location ? (location.demo ? "Demo Location (GPS unavailable)" : "Location Acquired") : "GPS Error"}
                  </span>
                </div>

                {location && (
                  <div style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(0,0,0,0.5)", marginTop: 4 }}>
                    <div>{location.lat.toFixed(6)}° N</div>
                    <div>{location.lng.toFixed(6)}° E</div>
                    {location.accuracy && <div style={{ color: "rgba(0,0,0,0.3)", marginTop: 4 }}>Accuracy: ±{Math.round(location.accuracy)}m</div>}
                  </div>
                )}
              </div>

              {/* Map SVG */}
              <HospitalMapSVG userLat={location?.lat} userLng={location?.lng} hospitalsData={hospitals} />

              {/* Action buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={shareLocation} disabled={!location} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  padding: "13px 20px", borderRadius: 10,
                  background: location ? "rgba(249,115,22,0.12)" : "rgba(0,0,0,0.04)",
                  border: `1px solid ${location ? "rgba(249,115,22,0.35)" : "rgba(0,0,0,0.08)"}`,
                  color: location ? "#f97316" : "rgba(0,0,0,0.25)",
                  fontSize: 13, fontWeight: 700, cursor: location ? "pointer" : "default",
                  transition: "all 0.15s",
                }}>
                  <Share2 size={16} />
                  Share via WhatsApp / SMS
                </button>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={copyCoords} disabled={!location} style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "11px 16px", borderRadius: 10,
                    background: copiedCoords ? "rgba(34,197,94,0.1)" : "rgba(0,0,0,0.04)",
                    border: `1px solid ${copiedCoords ? "rgba(34,197,94,0.3)" : "rgba(0,0,0,0.1)"}`,
                    color: copiedCoords ? "#22c55e" : "rgba(0,0,0,0.45)",
                    fontSize: 12, fontWeight: 600, cursor: location ? "pointer" : "default",
                    transition: "all 0.15s",
                  }}>
                    {copiedCoords ? <><CheckCircle2 size={14} /> Copied!</> : <><Copy size={14} /> Copy Coords</>}
                  </button>

                  <button onClick={fetchLocation} style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "11px 16px", borderRadius: 10,
                    background: "rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.1)",
                    color: "rgba(0,0,0,0.45)",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    transition: "all 0.15s",
                  }}>
                    <Navigation size={14} /> Refresh GPS
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ HOSPITALS TAB ════════ */}
        {activeTab === "hospitals" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Map */}
              <div style={{
                background: "#ffffff",
                border: "1px solid rgba(220,38,38,0.2)",
                borderRadius: 16,
                padding: 28,
              }}>
                <SectionHeader icon={Hospital} title="Nearest Hospitals" subtitle="Tap a hospital to get directions" color="#dc2626" />
                <HospitalMapSVG userLat={location?.lat} userLng={location?.lng} hospitalsData={hospitals} />

                {location && (
                  <a
                    href={gmapsUrl(location.lat, location.lng)}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: "12px 20px", borderRadius: 10,
                      background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)",
                      color: "#dc2626", fontSize: 13, fontWeight: 700, textDecoration: "none",
                      transition: "all 0.15s",
                    }}
                  >
                    <ExternalLink size={14} /> Open in Google Maps
                  </a>
                )}
              </div>

              {/* Hospital list */}
              <div style={{
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,0.07)",
                borderRadius: 16,
                padding: 28,
              }}>
                <SectionHeader icon={Hospital} title="Hospital Directory" subtitle="Emergency facilities near you" color="#dc2626" />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {hospitals.map((h) => (
                    <div key={h.id} style={{
                      padding: "16px 18px",
                      borderRadius: 12,
                      background: "rgba(0,0,0,0.03)",
                      border: "1px solid rgba(0,0,0,0.08)",
                      transition: "all 0.15s",
                      cursor: "pointer",
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(220,38,38,0.35)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0a", marginBottom: 4 }}>{h.name}</h3>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <MapPin size={11} color="#f97316" />
                            <span style={{ fontSize: 12, color: "rgba(0,0,0,0.4)" }}>{h.distance} away</span>
                          </div>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
                          padding: "3px 9px", borderRadius: 6,
                          background: h.status === "ACTIVE" ? "rgba(34,197,94,0.1)" : "rgba(59,130,246,0.1)",
                          color: h.status === "ACTIVE" ? "#22c55e" : "#60a5fa",
                          border: `1px solid ${h.status === "ACTIVE" ? "rgba(34,197,94,0.25)" : "rgba(59,130,246,0.25)"}`,
                        }}>{h.status}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                        <span style={{ fontSize: 12, color: "rgba(0,0,0,0.4)" }}>
                          🛏 {h.beds} beds
                        </span>
                        {h.emergency && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#dc2626", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", padding: "1px 7px", borderRadius: 5 }}>
                            24/7 Emergency
                          </span>
                        )}
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          fontSize: 12, fontWeight: 700, color: "#dc2626",
                          textDecoration: "none",
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <Navigation size={12} /> Get Directions <ChevronRight size={12} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ SUPPLIES TAB ════════ */}
        {activeTab === "supplies" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Camp selector */}
            <div style={{
              background: "#ffffff",
              border: "1px solid rgba(6,182,212,0.2)",
              borderRadius: 16,
              padding: 28,
            }}>
              <SectionHeader icon={Truck} title="Relief Camps" subtitle="Select a camp to request supplies" color="#06b6d4" />

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {reliefCamps.map((camp) => {
                  const isSelected = selectedCamp?.id === camp.id;
                  const pct = Math.round((camp.available / camp.capacity) * 100);
                  return (
                    <div key={camp.id}
                      onClick={() => setSelectedCamp(isSelected ? null : camp)}
                      style={{
                        padding: "18px 20px",
                        borderRadius: 12,
                        border: `1px solid ${isSelected ? "rgba(6,182,212,0.5)" : "rgba(0,0,0,0.08)"}`,
                        background: isSelected ? "rgba(6,182,212,0.07)" : "rgba(0,0,0,0.02)",
                        cursor: "pointer", transition: "all 0.15s",
                      }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <h3 style={{ fontSize: 14, fontWeight: 700, color: isSelected ? "#06b6d4" : "#fff", marginBottom: 3 }}>{camp.name}</h3>
                          <p style={{ fontSize: 11, color: "rgba(0,0,0,0.35)" }}>{camp.area} · {camp.distance}</p>
                        </div>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%",
                          border: `2px solid ${isSelected ? "#06b6d4" : "rgba(0,0,0,0.15)"}`,
                          background: isSelected ? "#06b6d4" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {isSelected && <CheckCircle2 size={12} color="#000" />}
                        </div>
                      </div>

                      {/* Capacity bar */}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: "rgba(0,0,0,0.35)" }}>Capacity Available</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: pct > 40 ? "#22c55e" : "#f59e0b" }}>{camp.available}/{camp.capacity}</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: "rgba(0,0,0,0.08)" }}>
                          <div style={{ height: "100%", borderRadius: 2, width: `${pct}%`, background: pct > 40 ? "#22c55e" : "#f59e0b", transition: "width 0.5s" }} />
                        </div>
                      </div>

                      {/* Available supplies */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {camp.supplies.map((s) => (
                          <span key={s} style={{ fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 5, background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.18)", color: "rgba(6,182,212,0.8)" }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Supply request form */}
            <div style={{
              background: "#ffffff",
              border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: 16,
              padding: 28,
              display: "flex", flexDirection: "column", gap: 20,
            }}>
              <SectionHeader icon={Package} title="Request Emergency Supplies" subtitle="Submit your requirements to the relief camp" color="#f59e0b" />

              {/* People count */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 10 }}>
                  <Users size={11} style={{ display: "inline", marginRight: 5 }} />
                  Number of People
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {[1, 2, 5, 10, 25, 50].map((n) => (
                    <button key={n} onClick={() => setPeopleCount(n)} style={{
                      width: 44, height: 38, borderRadius: 8,
                      border: `1px solid ${peopleCount === n ? "rgba(245,158,11,0.5)" : "rgba(0,0,0,0.1)"}`,
                      background: peopleCount === n ? "rgba(245,158,11,0.12)" : "rgba(0,0,0,0.03)",
                      color: peopleCount === n ? "#f59e0b" : "rgba(0,0,0,0.4)",
                      fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                    }}>{n}</button>
                  ))}
                </div>
              </div>

              {/* Supply items */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 10 }}>
                  Select Required Items
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {SUPPLY_ITEMS.map((item) => {
                    const sel = supplyItems.includes(item);
                    return (
                      <button key={item} onClick={() => toggleSupplyItem(item)} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "11px 14px", borderRadius: 9,
                        border: `1px solid ${sel ? "rgba(245,158,11,0.4)" : "rgba(0,0,0,0.08)"}`,
                        background: sel ? "rgba(245,158,11,0.09)" : "rgba(0,0,0,0.02)",
                        color: sel ? "#f59e0b" : "rgba(0,0,0,0.45)",
                        fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                        textAlign: "left",
                      }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: 4,
                          border: `1.5px solid ${sel ? "#f59e0b" : "rgba(0,0,0,0.2)"}`,
                          background: sel ? "#f59e0b" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {sel && <CheckCircle2 size={10} color="#000" />}
                        </div>
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected camp display */}
              {selectedCamp ? (
                <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#06b6d4" }}>{selectedCamp.name}</p>
                    <p style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", marginTop: 2 }}>{selectedCamp.distance} · {selectedCamp.area}</p>
                  </div>
                  <button onClick={() => setSelectedCamp(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(0,0,0,0.3)" }}><X size={14} /></button>
                </div>
              ) : (
                <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(0,0,0,0.03)", border: "1px dashed rgba(0,0,0,0.1)", textAlign: "center" }}>
                  <p style={{ fontSize: 12, color: "rgba(0,0,0,0.25)" }}>← Select a relief camp from the list</p>
                </div>
              )}

              {/* Submit button */}
              <button
                onClick={requestSupply}
                disabled={!selectedCamp || supplyItems.length === 0 || supplyLoading || supplySuccess}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  padding: "14px 20px", borderRadius: 11,
                  background: supplySuccess
                    ? "rgba(34,197,94,0.12)"
                    : (!selectedCamp || supplyItems.length === 0)
                      ? "rgba(0,0,0,0.04)"
                      : "rgba(245,158,11,0.15)",
                  border: `1px solid ${supplySuccess ? "rgba(34,197,94,0.35)" : (!selectedCamp || supplyItems.length === 0) ? "rgba(0,0,0,0.08)" : "rgba(245,158,11,0.4)"}`,
                  color: supplySuccess ? "#22c55e" : (!selectedCamp || supplyItems.length === 0) ? "rgba(0,0,0,0.2)" : "#f59e0b",
                  fontSize: 14, fontWeight: 800, cursor: (!selectedCamp || supplyItems.length === 0) ? "default" : "pointer",
                  transition: "all 0.2s", letterSpacing: "0.02em",
                }}>
                {supplyLoading ? (
                  <><Loader2 size={16} style={{ animation: "spin-slow 1s linear infinite" }} /> Sending Request…</>
                ) : supplySuccess ? (
                  <><CheckCircle2 size={16} /> Request Confirmed!</>
                ) : (
                  <><Package size={16} /> Request {peopleCount} Person{peopleCount !== 1 ? "s'" : "'"} Supplies</>
                )}
              </button>

              {supplySuccess && (
                <div className="animate-fade-in" style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#22c55e", marginBottom: 4 }}>Supply Request Submitted</p>
                  <p style={{ fontSize: 12, color: "rgba(0,0,0,0.4)", lineHeight: 1.6 }}>
                    Your request for {supplyItems.join(", ")} for {peopleCount} person{peopleCount !== 1 ? "s" : ""} has been sent to <strong style={{ color: "rgba(0,0,0,0.6)" }}>{selectedCamp.name}</strong>. Expected arrival: 30–60 minutes.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════ CONTACTS TAB ════════ */}
        {activeTab === "contacts" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 16,
              padding: 28,
            }}>
              <SectionHeader icon={Phone} title="Emergency Contacts" subtitle="One-tap direct dial" color="#dc2626" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {EMERGENCY_CONTACTS.map(({ label, number, color, icon: Icon }) => (
                  <a key={number} href={`tel:${number}`} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 20px", borderRadius: 12,
                    background: `${color}0d`, border: `1px solid ${color}25`,
                    textDecoration: "none", transition: "all 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = `${color}18`}
                    onMouseLeave={e => e.currentTarget.style.background = `${color}0d`}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}15`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={17} color={color} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.75)" }}>{label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color, fontFamily: "monospace" }}>{number}</span>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <PhoneCall size={13} color={color} />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Info panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Location share card */}
              <div style={{
                background: "#ffffff",
                border: "1px solid rgba(249,115,22,0.2)",
                borderRadius: 16,
                padding: 24,
              }}>
                <SectionHeader icon={Share2} title="Share Emergency Info" subtitle="Send location + status to family" color="#f97316" />
                {location && (
                  <div style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(0,0,0,0.4)", marginBottom: 14, padding: "10px 14px", background: "rgba(0,0,0,0.03)", borderRadius: 8, border: "1px solid rgba(0,0,0,0.07)" }}>
                    🆘 EMERGENCY<br />
                    Location: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}<br />
                    Maps: maps.google.com/?q={location.lat.toFixed(5)},{location.lng.toFixed(5)}
                  </div>
                )}
                <button onClick={shareLocation} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
                  padding: "12px 20px", borderRadius: 10,
                  background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)",
                  color: "#f97316", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}>
                  <Share2 size={15} /> Share via WhatsApp / SMS
                </button>
              </div>

              {/* Info card */}
              <div style={{
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 16,
                padding: 24,
              }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b", marginBottom: 8 }}>Emergency Safety Tips</h3>
                    {[
                      "Stay on elevated ground until flood waters recede.",
                      "Do not drink untreated water — use ORS or boil first.",
                      "Keep phone charged; share your GPS with family.",
                      "Move to a relief camp if water level rises above knee.",
                      "Carry ID documents in a waterproof bag.",
                    ].map((tip, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", minWidth: 18, marginTop: 1 }}>{i + 1}.</span>
                        <span style={{ fontSize: 12, color: "rgba(0,0,0,0.45)", lineHeight: 1.6 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes em-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(220,38,38,0.6); }
          70%  { box-shadow: 0 0 0 8px rgba(220,38,38,0); }
          100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
        }
        @keyframes ring-out {
          0%   { transform: scale(0.9); opacity: 0.7; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
