/**
 * /api/sensors  —  v3
 *
 * Changes over v2:
 *  • Fetches real rainfall from Open-Meteo (Guwahati) — no API key needed
 *  • Adds IoT-style device metadata to every reading
 *  • Persists every reading to MongoDB (SensorReading model)
 *  • GET /api/sensors/history?zone=zone-a&hours=24  — historical data for charts
 */

const express       = require("express");
const router        = express.Router();
const SensorReading = require("../models/SensorReading");

// ── Open-Meteo config (Guwahati, Assam) ───────────────────────────────────────
const GUWAHATI_LAT = 26.18;
const GUWAHATI_LON = 91.74;
const OPENMETEO_URL =
  `https://api.open-meteo.com/v1/forecast` +
  `?latitude=${GUWAHATI_LAT}&longitude=${GUWAHATI_LON}` +
  `&current=precipitation,rain&timezone=Asia%2FKolkata` +
  `&forecast_days=1`;

// ── Rainfall cache (refresh every 30 min) ─────────────────────────────────────
let rainfallCache = { value: 62, source: "simulated", fetchedAt: 0 };

async function getRealRainfall() {
  const CACHE_TTL = 30 * 60 * 1000;    // 30 minutes
  if (Date.now() - rainfallCache.fetchedAt < CACHE_TTL) {
    return rainfallCache;
  }
  try {
    const res  = await fetch(OPENMETEO_URL, { signal: AbortSignal.timeout(6000) });
    const data = await res.json();
    const mm   = (data.current?.precipitation ?? data.current?.rain ?? 0) * 10; // scale to mm/day
    rainfallCache = { value: Math.round(mm * 10) / 10, source: "openmeteo", fetchedAt: Date.now() };
    console.log(`🌧  Open-Meteo rainfall: ${rainfallCache.value} mm (Guwahati)`);
  } catch (err) {
    console.warn("⚠️  Open-Meteo fetch failed — using last cached rainfall:", err.message);
    rainfallCache.fetchedAt = Date.now(); // avoid hammering on failure
  }
  return rainfallCache;
}

// ── Simulated IoT device registry ─────────────────────────────────────────────
const DEVICES = {
  "zone-a": { id: "JR-DEVICE-001", model: "AquaSense Pro v2", lat: 26.1745, lon: 91.7362 },
  "zone-b": { id: "JR-DEVICE-002", model: "AquaSense Pro v2", lat: 26.1832, lon: 91.7501 },
  "zone-c": { id: "JR-DEVICE-003", model: "AquaSense Lite v3", lat: 26.1681, lon: 91.7289 },
  "zone-d": { id: "JR-DEVICE-004", model: "AquaSense Lite v3", lat: 26.1920, lon: 91.7190 },
};

// ── Base sensor values per zone ────────────────────────────────────────────────
// These simulate persistent contamination that doesn't fluctuate wildly
const ZONE_BASE = {
  "zone-a": { ph: 5.8, turbidity: 72, contamination: 81, dissolvedO2: 3.1, temperature: 28.4, ecoli: 820 },
  "zone-b": { ph: 6.1, turbidity: 58, contamination: 63, dissolvedO2: 4.2, temperature: 27.8, ecoli: 540 },
  "zone-c": { ph: 6.4, turbidity: 44, contamination: 47, dissolvedO2: 5.8, temperature: 27.1, ecoli: 290 },
  "zone-d": { ph: 7.1, turbidity: 18, contamination: 22, dissolvedO2: 7.4, temperature: 26.5, ecoli: 85  },
};

// ── Realistic noise helper ─────────────────────────────────────────────────────
// Adds bounded Gaussian noise (±range) to simulate sensor drift
function jitter(base, range, min = 0, max = 100) {
  const noise = (Math.random() - 0.5) * 2 * range;
  return Math.max(min, Math.min(max, +(base + noise).toFixed(2)));
}

// ── Simulate a current reading for a zone ─────────────────────────────────────
async function buildReading(zoneId) {
  const base     = ZONE_BASE[zoneId] || ZONE_BASE["zone-a"];
  const device   = DEVICES[zoneId]   || DEVICES["zone-a"];
  const rainfall = await getRealRainfall();

  const current = {
    ph:            jitter(base.ph,            0.15, 0, 14),
    turbidity:     jitter(base.turbidity,     3,    0, 200),
    contamination: jitter(base.contamination, 2,    0, 100),
    rainfall:      jitter(rainfall.value,     5,    0, 500),  // use real rainfall ± 5 mm noise
    dissolvedO2:   jitter(base.dissolvedO2,   0.2,  0, 14),
    temperature:   jitter(base.temperature,   0.3,  10, 45),
    ecoli:         jitter(base.ecoli,         20,   0, 2000),
    rainfallSource: rainfall.source,
  };

  // Previous reading (5 minutes ago) — slight mean reversion
  const previous = {
    ph:            jitter(base.ph,            0.12, 0, 14),
    turbidity:     jitter(base.turbidity,     2.5,  0, 200),
    contamination: jitter(base.contamination, 1.5,  0, 100),
    rainfall:      jitter(rainfall.value,     4,    0, 500),
    dissolvedO2:   jitter(base.dissolvedO2,   0.15, 0, 14),
    temperature:   jitter(base.temperature,   0.2,  10, 45),
    ecoli:         jitter(base.ecoli,         15,   0, 2000),
  };

  return { current, previous, device, rainfallSource: rainfall.source };
}

// ── Persist reading to MongoDB (non-blocking) ──────────────────────────────────
async function persistReading(zoneId, current, device, rainfallSource) {
  try {
    await SensorReading.create({
      zone:           zoneId,
      deviceId:       device.id,
      ph:             current.ph,
      turbidity:      current.turbidity,
      contamination:  current.contamination,
      rainfall:       current.rainfall,
      dissolvedO2:    current.dissolvedO2,
      temperature:    current.temperature,
      ecoli:          current.ecoli,
      signalStrength: Math.floor(Math.random() * 20) - 75,   // -75 to -55 dBm
      batteryLevel:   Math.floor(60 + Math.random() * 40),   // 60-100%
      rainfallSource,
    });
  } catch (err) {
    // Non-fatal — don't crash the response if DB is unavailable
    if (process.env.NODE_ENV !== "test") {
      console.warn("⚠️  SensorReading persist failed:", err.message);
    }
  }
}

// ── GET /api/sensors?zone=zone-a ──────────────────────────────────────────────
router.get("/", async (req, res) => {
  const zoneId = req.query.zone || "zone-a";
  if (!ZONE_BASE[zoneId]) {
    return res.status(400).json({ error: `Unknown zone: ${zoneId}` });
  }

  const { current, previous, device, rainfallSource } = await buildReading(zoneId);

  // Persist async — don't await so the response is fast
  persistReading(zoneId, current, device, rainfallSource);

  res.json({
    zone: zoneId,
    device: {
      id:        device.id,
      model:     device.model,
      lat:       device.lat,
      lon:       device.lon,
      signalStrength: Math.floor(Math.random() * 20) - 75,
      batteryLevel:   Math.floor(60 + Math.random() * 40),
      lastCalibrated: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 h ago
    },
    current,
    previous,
    rainfallSource,
    timestamp: new Date().toISOString(),
  });
});

// ── GET /api/sensors/all-zones ────────────────────────────────────────────────
router.get("/all-zones", async (req, res) => {
  const rainfall = await getRealRainfall();

  const zones = await Promise.all(
    Object.keys(ZONE_BASE).map(async (zoneId) => {
      const base   = ZONE_BASE[zoneId];
      const device = DEVICES[zoneId];
      const cur = {
        ph:            jitter(base.ph,            0.15, 0, 14),
        turbidity:     jitter(base.turbidity,     3,    0, 200),
        contamination: jitter(base.contamination, 2,    0, 100),
        rainfall:      jitter(rainfall.value,     5,    0, 500),
      };
      persistReading(zoneId, cur, device, rainfall.source);
      return { zoneId, ...cur, deviceId: device.id };
    })
  );

  res.json(zones);
});

// ── GET /api/sensors/history?zone=zone-a&hours=24 ─────────────────────────────
router.get("/history", async (req, res) => {
  const zoneId = req.query.zone  || "zone-a";
  const hours  = parseInt(req.query.hours || "24", 10);

  if (hours < 1 || hours > 168) {
    return res.status(400).json({ error: "hours must be between 1 and 168" });
  }

  try {
    const since    = new Date(Date.now() - hours * 60 * 60 * 1000);
    const readings = await SensorReading.find(
      { zone: zoneId, createdAt: { $gte: since } },
      { ph: 1, turbidity: 1, contamination: 1, rainfall: 1, createdAt: 1, _id: 0 }
    )
      .sort({ createdAt: 1 })
      .limit(500);          // cap at 500 points (~41 min at 5 s intervals)

    res.json({ zone: zoneId, hours, count: readings.length, readings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/sensors/rainfall-source ──────────────────────────────────────────
router.get("/rainfall-source", async (req, res) => {
  const rf = await getRealRainfall();
  res.json(rf);
});

module.exports = router;
