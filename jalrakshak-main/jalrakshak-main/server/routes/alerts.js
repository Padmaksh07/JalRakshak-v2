/**
 * /api/alerts  —  v3
 *
 * Changes over v2:
 *  • POST /send and POST /sos now require JWT (health officials only)
 *  • GET endpoints remain public (residents can always read alerts)
 *  • SSE stream preserved
 */

const express = require("express");
const router  = express.Router();
const Alert   = require("../models/Alert");
const { protect } = require("../middleware/auth");

// ── Twilio (optional) ─────────────────────────────────────────────────────────
let twilioClient = null;
try {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && !TWILIO_ACCOUNT_SID.startsWith("ACxxx")) {
    const twilio = require("twilio");
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log("✅  Twilio SMS client initialised");
  } else {
    console.log("⚠️  Twilio creds not set — SMS will be simulated");
  }
} catch (e) {
  console.warn("⚠️  Twilio unavailable:", e.message);
}

// ── SSE clients ───────────────────────────────────────────────────────────────
let sseClients = [];
function broadcastEvent(data) {
  sseClients.forEach(c => c.res.write(`data: ${JSON.stringify(data)}\n\n`));
}

// ── Language templates ────────────────────────────────────────────────────────
const templates = {
  en: {
    high:   (zone, disease) => `High ${disease} risk in ${zone}. Avoid tap water. Use bottled/boiled water only.`,
    medium: (zone)          => `Moderate contamination risk in ${zone}. Boil all drinking water before use.`,
    low:    (zone)          => `Routine advisory for ${zone}. Monitor water quality.`,
  },
  hi: {
    high:   (zone, disease) => `${zone} में ${disease} का उच्च जोखिम। तत्काल सुरक्षित पेयजल का उपयोग करें।`,
    medium: (zone)          => `${zone} में जल प्रदूषण का मध्यम जोखिम। पीने से पहले पानी उबालें।`,
    low:    (zone)          => `${zone} में जल गुणवत्ता सामान्य है। सावधानी बरतें।`,
  },
  as: {
    high:   (zone, disease) => `${zone}ত ${disease}ৰ উচ্চ বিপদ আছে। তৎক্ষণাত নিৰাপদ পানীয় জল ব্যৱহাৰ কৰক।`,
    medium: (zone)          => `${zone}ত জল প্ৰদূষণৰ মধ্যম বিপদ আছে। পান কৰাৰ আগতে পানী উতলাওক।`,
    low:    (zone)          => `${zone}ত জলৰ মান স্বাভাৱিক। সতৰ্ক থাকক।`,
  },
};

function buildMessages(zone, severity, disease = "Waterborne") {
  const en = severity === "high"   ? templates.en.high(zone, disease)
           : severity === "medium" ? templates.en.medium(zone)
           :                        templates.en.low(zone);
  const hi = severity === "high"   ? templates.hi.high(zone, disease)
           : severity === "medium" ? templates.hi.medium(zone)
           :                        templates.hi.low(zone);
  const as_ = severity === "high"  ? templates.as.high(zone, disease)
           : severity === "medium" ? templates.as.medium(zone)
           :                        templates.as.low(zone);
  return { message: en, hindiMessage: hi, assameseMessage: as_ };
}

async function dispatchSms(text) {
  const numbers = (process.env.SMS_TEST_RECIPIENTS || "").split(",").map(n => n.trim()).filter(Boolean);
  if (!twilioClient || numbers.length === 0) return { count: 0, simulated: true };
  const results = await Promise.allSettled(
    numbers.map(to => twilioClient.messages.create({ body: text, from: process.env.TWILIO_FROM_NUMBER, to }))
  );
  return { count: results.filter(r => r.status === "fulfilled").length, simulated: false };
}

// ── GET /api/alerts  (public) ─────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(50);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/alerts/stream  (public SSE) ──────────────────────────────────────
router.get("/stream", (req, res) => {
  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" });
  res.write("data: {\"type\":\"connected\"}\n\n");
  const client = { id: Date.now(), res };
  sseClients.push(client);
  req.on("close", () => { sseClients = sseClients.filter(c => c.id !== client.id); });
});

// ── POST /api/alerts/send  (🔒 officials only) ────────────────────────────────
router.post("/send", protect, async (req, res) => {
  const { zone, severity, disease } = req.body;
  if (!zone || !severity) return res.status(400).json({ error: "zone and severity are required" });

  const msgs = buildMessages(zone, severity, disease);
  const sms  = await dispatchSms(msgs.message);

  const alert = await Alert.create({
    ...msgs,
    zone, severity,
    disease: disease || null,
    sent:    true,
    smsCount:  sms.count,
    simulated: sms.simulated,
    sentBy:    req.user._id,
  });

  broadcastEvent({ type: "new_alert", alert });
  res.status(201).json({ alert, smsSent: sms.count, simulated: sms.simulated });
});

// ── POST /api/alerts/sos  (🔒 officials only) ─────────────────────────────────
router.post("/sos", protect, async (req, res) => {
  const { zone, message } = req.body;
  if (!zone) return res.status(400).json({ error: "zone is required" });

  const text = message || `🚨 SOS — CRITICAL water contamination in ${zone}. Evacuate immediately.`;
  const sms  = await dispatchSms(text);

  const alert = await Alert.create({
    zone, severity: "critical",
    message: text, hindiMessage: text, assameseMessage: text,
    sent: true, smsCount: sms.count, simulated: sms.simulated,
    sentBy: req.user._id,
  });

  broadcastEvent({ type: "sos", alert });
  res.status(201).json({ alert, smsSent: sms.count, simulated: sms.simulated });
});

// ── DELETE /api/alerts/:id  (🔒 officials only) ───────────────────────────────
router.delete("/:id", protect, async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
