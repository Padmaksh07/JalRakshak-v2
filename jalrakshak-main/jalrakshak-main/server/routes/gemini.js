/**
 * /api/gemini  —  v3
 *
 * New endpoint: POST /api/gemini/chat
 *  — multilingual resident chatbot powered by Gemini
 *  — injects live zone sensor data as context
 *  — auto-detects language and replies in kind
 */

const express = require("express");
const router  = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ── Haversine ──────────────────────────────────────────────────────────────────
function distKm(lat1, lon1, lat2, lon2) {
  const R = 6371, dL = (lat2 - lat1) * Math.PI / 180, dO = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dL/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dO/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Emergency info (unchanged from v2) ────────────────────────────────────────
const fallback = (lat, lng) => ({
  hospitals: [
    { id: "H1", name: "District Civil Hospital",  distance: "1.2 km", beds: 120, emergency: true,  lat: lat+0.005, lng: lng+0.003, status: "OPEN" },
    { id: "H2", name: "Primary Health Centre",    distance: "0.6 km", beds: 30,  emergency: false, lat: lat-0.002, lng: lng-0.004, status: "OPEN" },
    { id: "H3", name: "Relief Medical Unit",      distance: "1.7 km", beds: 50,  emergency: true,  lat: lat+0.008, lng: lng-0.008, status: "ACTIVE" },
  ],
  camps: [
    { id: "RC-01", name: "Govt. School Relief Camp",   area: "Local Zone", distance: "0.8 km", capacity: 350, available: 142, supplies: ["Water Packets","Food Rations","Medicines"] },
    { id: "RC-02", name: "Community Hall Shelter",     area: "Local Zone", distance: "1.4 km", capacity: 200, available: 61,  supplies: ["Water Packets","Baby Food"] },
  ],
});

router.post("/emergency-info", async (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: "lat and lng required" });

  const apiKey = process.env.GEMINI_API_KEY;
  let hospitals = [];

  // Try Overpass for real hospitals
  try {
    const q = `[out:json][timeout:10];(node["amenity"="hospital"](around:8000,${lat},${lng});way["amenity"="hospital"](around:8000,${lat},${lng}););out center;`;
    const r = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);
    const d = await r.json();
    hospitals = (d.elements || []).map((el, i) => {
      const hLat = el.lat || el.center?.lat, hLng = el.lon || el.center?.lon;
      return { id: `H${i+1}`, name: el.tags?.name || "Local Hospital", distance: `${distKm(lat,lng,hLat,hLng).toFixed(1)} km`, beds: el.tags?.capacity ? +el.tags.capacity : 50, emergency: el.tags?.emergency === "yes", lat: hLat, lng: hLng, status: "OPEN" };
    }).sort((a,b) => parseFloat(a.distance) - parseFloat(b.distance)).slice(0,5);
  } catch {}

  if (hospitals.length === 0) hospitals = fallback(lat, lng).hospitals;

  if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
    return res.json({ hospitals, camps: fallback(lat, lng).camps });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are an emergency disaster response system for Assam flood zones. The user is at lat:${lat}, lon:${lng}. Generate 2-3 realistic disaster relief camps. Output ONLY raw JSON: {"camps":[{"id":"String","name":"String","area":"String","distance":"String","capacity":Number,"available":Number,"supplies":["String"]}]}`;
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim().replace(/^```json|^```|```$/g, "").trim();
    const data = JSON.parse(text);
    res.json({ hospitals, camps: data.camps || fallback(lat, lng).camps });
  } catch {
    res.json({ hospitals, camps: fallback(lat, lng).camps });
  }
});

// ── POST /api/gemini/chat  — Multilingual resident chatbot ────────────────────
router.post("/chat", async (req, res) => {
  const { message, zoneData, history = [] } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
    return res.json({
      reply: "Chatbot unavailable — GEMINI_API_KEY not configured. Please add your key to server/.env",
      language: "en",
    });
  }

  // Build sensor context string if zone data is available
  const sensorCtx = zoneData
    ? `Current sensor readings for ${zoneData.zone || "this zone"}:
- pH: ${zoneData.ph} (safe: 6.5–8.5)
- Turbidity: ${zoneData.turbidity} NTU (safe: <25)
- Contamination index: ${zoneData.contamination}% (safe: <30%)
- Rainfall: ${zoneData.rainfall} mm
- Risk level: ${zoneData.riskLevel || "unknown"}`
    : "No live sensor data available for this session.";

  const systemPrompt = `You are JalRakshak AI, a water safety assistant for flood-affected communities in Assam, India.

Your role:
- Answer questions about water safety, disease prevention, and flood relief in simple, clear language
- Detect the language of the user's message and ALWAYS reply in the SAME language
- Supported languages: English, Hindi (हिंदी), Assamese (অসমীয়া)
- Be concise — keep replies under 120 words
- Never make up medical diagnoses — advise visiting a doctor for health concerns
- If the user seems to be in danger, always recommend calling emergency services (112 in India)

Live water quality context for this session:
${sensorCtx}

When answering, use the live readings above to give specific, accurate advice.
If asked "is it safe to drink water?", refer to the contamination and turbidity values.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build conversation history for multi-turn
    const contents = [
      ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: "user", parts: [{ text: message }] },
    ];

    const result = await model.generateContent({
      systemInstruction: systemPrompt,
      contents,
      generationConfig: { maxOutputTokens: 300, temperature: 0.4 },
    });

    const reply = result.response.text().trim();
    res.json({ reply });
  } catch (err) {
    console.error("Gemini chat error:", err.message);
    res.status(500).json({ error: "Chatbot temporarily unavailable", details: err.message });
  }
});

module.exports = router;
