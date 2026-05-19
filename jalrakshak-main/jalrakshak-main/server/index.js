require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const mongoose = require("mongoose");

const sensorRoutes  = require("./routes/sensor");
const predictRoutes = require("./routes/predict");
const alertsRoutes  = require("./routes/alerts");
const geminiRoutes  = require("./routes/gemini");
const reportsRoutes = require("./routes/reports");
const authRoutes    = require("./routes/auth");      // ← NEW

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api/auth",    authRoutes);        // ← NEW  (register / login / me)
app.use("/api/sensors", sensorRoutes);
app.use("/api/predict", predictRoutes);
app.use("/api/alerts",  alertsRoutes);
app.use("/api/gemini",  geminiRoutes);
app.use("/api/reports", reportsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  const states = ["disconnected","connected","connecting","disconnecting"];
  res.json({
    status:    "ok",
    service:   "JalRakshak API",
    version:   "3.0.0",
    db:        states[mongoose.connection.readyState] || "unknown",
    timestamp: new Date().toISOString(),
    features:  ["ml-predict","jwt-auth","historical-sensors","real-rainfall","chatbot","pwa","pdf-reports"],
  });
});

// ── MongoDB ────────────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/jalrakshak";

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log(`✅  MongoDB connected → ${MONGODB_URI}`);
    seedIfEmpty();
  })
  .catch(err => {
    console.warn(`⚠️  MongoDB failed: ${err.message}`);
    console.warn("    Alerts/history will not persist. Set MONGODB_URI in .env\n");
  });

app.listen(PORT, () => {
  console.log(`\n🌊 JalRakshak API v3 → http://localhost:${PORT}`);
  console.log(`   Auth:     POST /api/auth/register  /api/auth/login`);
  console.log(`   Sensors:  GET  /api/sensors  /api/sensors/history?zone=zone-a&hours=24`);
  console.log(`   Predict:  POST /api/predict  GET /api/predict/model-info`);
  console.log(`   Chatbot:  POST /api/gemini/chat`);
  console.log(`   Reports:  GET  /api/reports/pdf?days=7\n`);
});

// ── Seed ───────────────────────────────────────────────────────────────────────
async function seedIfEmpty() {
  const Alert = require("./models/Alert");
  if (await Alert.countDocuments() > 0) return;

  await Alert.insertMany([
    {
      zone: "Zone A – Riverside Colony", severity: "high", disease: "Cholera",
      message: "High Cholera risk in Zone A – Riverside Colony. Avoid tap water.",
      hindiMessage: "Zone A में Cholera का उच्च जोखिम। तत्काल सुरक्षित पेयजल का उपयोग करें।",
      assameseMessage: "Zone A – Riverside Colonyত Choleraৰ উচ্চ বিপদ আছে। তৎক্ষণাত নিৰাপদ পানীয় জল ব্যৱহাৰ কৰক।",
      sent: true, smsCount: 0, simulated: true,
    },
    {
      zone: "Zone B – East Flood Plain", severity: "medium",
      message: "Moderate contamination in Zone B. Boil all drinking water.",
      hindiMessage: "Zone B में जल प्रदूषण का मध्यम जोखिम। पीने से पहले पानी उबालें।",
      assameseMessage: "Zone B – East Flood Plainত জল প্ৰদূষণৰ মধ্যম বিপদ আছে। পান কৰাৰ আগতে পানী উতলাওক।",
      sent: true, smsCount: 0, simulated: true,
    },
  ]);

  // Seed a demo official account
  const User = require("./models/User");
  if (await User.countDocuments() === 0) {
    await User.create({ name: "Demo Official", email: "official@jalrakshak.in", password: "demo1234", role: "official" });
    console.log("🌱  Demo account: official@jalrakshak.in / demo1234");
  }

  console.log("🌱  Seeded initial alerts and demo user");
}
