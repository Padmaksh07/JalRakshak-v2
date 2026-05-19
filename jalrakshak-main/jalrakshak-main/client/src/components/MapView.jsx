/**
 * MapView — v2
 *
 * Replaces static SVG with a real Leaflet.js interactive map centred on
 * Guwahati, Assam (NE India).  Each zone is rendered as a coloured polygon
 * overlay with a popup showing live sensor data.
 *
 * Dependencies: leaflet, react-leaflet (already in package.json)
 */

import { useEffect, useRef } from "react";
import { Map } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ── Fix Leaflet default icon paths broken by Vite bundling ───────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ── Zone definitions (Guwahati, Assam coordinates) ───────────────────────────
// Polygons approximate real low-lying / flood-prone wards of Guwahati
const ZONES = [
  {
    id: "zone-a",
    label: "A",
    name: "Riverside Colony",
    // Near Fancy Bazar / Brahmaputra embankment
    coords: [
      [26.1890, 91.7300],
      [26.1890, 91.7450],
      [26.1790, 91.7450],
      [26.1790, 91.7300],
    ],
  },
  {
    id: "zone-b",
    label: "B",
    name: "East Flood Plain",
    // Near Uzanbazar / Kachari Ghat
    coords: [
      [26.1840, 91.7480],
      [26.1840, 91.7650],
      [26.1720, 91.7650],
      [26.1720, 91.7480],
    ],
  },
  {
    id: "zone-c",
    label: "C",
    name: "Low-lying Market",
    // Pan Bazar area
    coords: [
      [26.1780, 91.7320],
      [26.1780, 91.7480],
      [26.1680, 91.7480],
      [26.1680, 91.7320],
    ],
  },
  {
    id: "zone-d",
    label: "D",
    name: "Northern Slum Belt",
    // North Guwahati / Jalukbari direction
    coords: [
      [26.1950, 91.7440],
      [26.1950, 91.7620],
      [26.1840, 91.7620],
      [26.1840, 91.7440],
    ],
  },
];

// ── Risk colour logic ─────────────────────────────────────────────────────────
function riskStyle(contamination = 0, isActive = false) {
  let color, label;
  if (contamination > 70)      { color = "#dc2626"; label = "CRITICAL"; }
  else if (contamination > 50) { color = "#ea580c"; label = "HIGH";     }
  else if (contamination > 30) { color = "#d97706"; label = "MEDIUM";   }
  else                         { color = "#16a34a"; label = "LOW";      }

  return {
    color:       isActive ? "#f97316" : color,
    weight:      isActive ? 3 : 2,
    opacity:     0.9,
    fillColor:   color,
    fillOpacity: 0.25,
    dashArray:   isActive ? null : "6 4",
    label,
    textColor:   color,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MapView({ allZones = [], currentZone }) {
  const mapRef      = useRef(null);   // leaflet Map instance
  const containerRef = useRef(null);  // DOM element
  const layersRef   = useRef({});     // zone polygon layers

  // Build a lookup: zoneId → sensor data
  const byId = {};
  allZones.forEach((z) => { byId[z.zoneId] = z; });

  // ── Initialise map once ──────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return; // already initialised

    const map = L.map(containerRef.current, {
      center: [26.1845, 91.7490],   // Guwahati city centre
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: false,       // prevent accidental scroll-hijack
    });

    // OpenStreetMap tiles (free, no API key)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add a Brahmaputra river label marker (decorative)
    L.marker([26.1960, 91.7530], {
      icon: L.divIcon({
        html: `<div style="
          background: rgba(59,130,246,0.85);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
          white-space: nowrap;
          letter-spacing: 0.05em;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ">🌊 Brahmaputra</div>`,
        className: "",
        iconAnchor: [40, 10],
      }),
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = {};
    };
  }, []);

  // ── Update zone polygons when sensor data / active zone changes ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    ZONES.forEach((zone) => {
      const sensor    = byId[zone.id];
      const contamination = sensor?.contamination ?? 0;
      const isActive  = zone.id === currentZone;
      const style     = riskStyle(contamination, isActive);

      // Build popup HTML
      const popupHtml = `
        <div style="font-family: Inter, sans-serif; min-width: 160px;">
          <div style="font-weight: 800; font-size: 13px; color: ${style.textColor}; margin-bottom: 6px;">
            Zone ${zone.label} — ${zone.name}
          </div>
          ${sensor ? `
            <table style="width:100%; font-size: 11px; border-collapse: collapse;">
              <tr><td style="color:#6b7280; padding: 2px 0;">pH</td>
                  <td style="font-weight:600; text-align:right">${sensor.ph?.toFixed(1) ?? "—"}</td></tr>
              <tr><td style="color:#6b7280; padding: 2px 0;">Contamination</td>
                  <td style="font-weight:600; text-align:right">${contamination.toFixed(0)}%</td></tr>
              <tr><td style="color:#6b7280; padding: 2px 0;">Turbidity</td>
                  <td style="font-weight:600; text-align:right">${sensor.turbidity?.toFixed(1) ?? "—"} NTU</td></tr>
              <tr><td style="color:#6b7280; padding: 2px 0;">Temp</td>
                  <td style="font-weight:600; text-align:right">${sensor.temperature?.toFixed(1) ?? "—"} °C</td></tr>
            </table>
            <div style="
              margin-top: 8px; padding: 3px 8px; border-radius: 4px;
              background: ${style.fillColor}22;
              border: 1px solid ${style.fillColor}66;
              color: ${style.textColor};
              font-size: 10px; font-weight: 700; text-align: center;
            ">${style.label} RISK</div>
          ` : `<p style="font-size: 11px; color: #6b7280;">No sensor data available</p>`}
        </div>
      `;

      // Remove old layer and redraw
      if (layersRef.current[zone.id]) {
        layersRef.current[zone.id].remove();
      }

      const poly = L.polygon(zone.coords, {
        color:       style.color,
        weight:      style.weight,
        opacity:     style.opacity,
        fillColor:   style.fillColor,
        fillOpacity: style.fillOpacity,
        dashArray:   style.dashArray,
      }).addTo(map);

      // Zone label (using DivIcon at polygon centroid)
      const center = poly.getBounds().getCenter();
      const labelIcon = L.divIcon({
        html: `
          <div style="
            background: ${style.fillColor};
            color: #fff;
            font-size: 10px;
            font-weight: 800;
            padding: 2px 7px;
            border-radius: 12px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            white-space: nowrap;
            letter-spacing: 0.04em;
            border: 1.5px solid rgba(255,255,255,0.6);
          ">${style.label} · Zone ${zone.label}</div>
        `,
        className: "",
        iconAnchor: [35, 10],
      });
      const labelMarker = L.marker(center, { icon: labelIcon, interactive: false }).addTo(map);

      poly.bindPopup(popupHtml, { maxWidth: 220 });
      if (isActive) poly.openPopup();

      // Store both polygon + label so we can remove both next render
      const group = L.layerGroup([poly, labelMarker]).addTo(map);
      layersRef.current[zone.id] = group;
    });
  }, [allZones, currentZone]);

  // ── Zone summary table (below map) ──────────────────────────────
  const summaryRows = ZONES.map((zone) => {
    const sensor = byId[zone.id];
    const style  = riskStyle(sensor?.contamination ?? 0, zone.id === currentZone);
    return { zone, sensor, style };
  });

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Map size={18} color="#6366f1" />
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Zone Risk Map</h2>
          <p style={{ fontSize: 11, color: "var(--muted-2)" }}>
            Guwahati, Assam — Live Leaflet overlay · click a zone for details
          </p>
        </div>
      </div>

      {/* ── Leaflet map container ── */}
      <div
        ref={containerRef}
        style={{
          height: 320,
          borderRadius: 10,
          border: "1px solid var(--border)",
          overflow: "hidden",
          background: "#1e293b",
          zIndex: 0,
        }}
      />

      {/* ── Zone summary table ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {summaryRows.map(({ zone, sensor, style }) => (
          <div
            key={zone.id}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "7px 12px", borderRadius: 7,
              background: zone.id === currentZone ? "var(--orange-dim)" : "var(--surface-2)",
              border: `1px solid ${zone.id === currentZone ? "rgba(249,115,22,0.3)" : "var(--border)"}`,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: zone.id === currentZone ? "var(--orange)" : "var(--text)" }}>
              Zone {zone.label} – {zone.name}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {sensor && (
                <span style={{ fontSize: 11, color: "var(--muted-2)", fontFamily: "monospace" }}>
                  pH {sensor.ph?.toFixed(1)} · {sensor.contamination?.toFixed(0)}%
                </span>
              )}
              <span style={{
                fontSize: 10, fontWeight: 700, color: style.textColor,
                padding: "2px 7px", borderRadius: 4,
                background: `${style.fillColor}22`,
                border: `1px solid ${style.fillColor}55`,
              }}>
                {style.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
