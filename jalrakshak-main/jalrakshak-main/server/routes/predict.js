/**
 * /api/predict  —  ML-powered risk prediction
 *
 * Runs softmax inference on pre-trained logistic regression weights
 * (see ml/model.json + ml/train.py for the training pipeline).
 *
 * Features → feature engineering → dot product → softmax → class + probabilities
 */

const express = require("express");
const router  = express.Router();
const path    = require("path");

// ── Load weights once at startup ──────────────────────────────────────────────
const MODEL = require(path.join(__dirname, "../ml/model.json"));
const { intercepts, coefficients, classes, feature_importances } = MODEL;

// ── Softmax helper ─────────────────────────────────────────────────────────────
function softmax(logits) {
  const max  = Math.max(...logits);          // numerical stability
  const exps = logits.map(l => Math.exp(l - max));
  const sum  = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

// ── Feature engineering ────────────────────────────────────────────────────────
function engineerFeatures({ ph, turbidity, contamination, rainfall }) {
  const ph_deviation_norm     = Math.abs(ph - 7.0) / 2.0;
  const turbidity_norm        = turbidity / 100;
  const contamination_norm    = contamination / 100;
  const rainfall_norm         = rainfall / 200;
  const cont_rain_interaction = contamination_norm * rainfall_norm;

  return [
    ph_deviation_norm,
    turbidity_norm,
    contamination_norm,
    rainfall_norm,
    cont_rain_interaction,
  ];
}

// ── Inference ──────────────────────────────────────────────────────────────────
function predict(rawInputs) {
  const features = engineerFeatures(rawInputs);
  const n = features.length;

  // Compute logit for each class: logit_k = intercept_k + W_k · x
  const logits = intercepts.map((b, k) => {
    const w = coefficients[k];
    let dot = b;
    for (let i = 0; i < n; i++) dot += w[i] * features[i];
    return dot;
  });

  const probabilities = softmax(logits);
  const predIdx       = probabilities.indexOf(Math.max(...probabilities));
  const level         = classes[predIdx];

  // ── Human-readable meta ────────────────────────────────────────────────────
  const meta = buildMeta(rawInputs, level, probabilities);

  return {
    // Core prediction
    level,
    confidence: +(probabilities[predIdx] * 100).toFixed(1),
    probabilities: {
      LOW:      +(probabilities[0] * 100).toFixed(1),
      MEDIUM:   +(probabilities[1] * 100).toFixed(1),
      HIGH:     +(probabilities[2] * 100).toFixed(1),
      CRITICAL: +(probabilities[3] * 100).toFixed(1),
    },

    // UI helpers
    score:    predIdx,         // 0-3 for legacy chart compat
    maxScore: 3,
    color:    meta.color,
    icon:     meta.icon,

    // Explainability
    diseases:       meta.diseases,
    reasons:        meta.reasons,
    recommendation: meta.recommendation,

    // Model provenance
    model: {
      type:    MODEL.model_type,
      version: MODEL.version,
      trained_on: MODEL.trained_on,
      validation_accuracy: MODEL.validation_accuracy,
    },
    feature_importances,
    timestamp: new Date().toISOString(),
  };
}

// ── Explainability layer ───────────────────────────────────────────────────────
const DISEASE_MAP = {
  ph_low:      ["Cholera", "Dysentery"],
  ph_high:     ["Gastroenteritis"],
  turbidity:   ["Typhoid", "Hepatitis A"],
  contamination_high: ["Cholera", "Leptospirosis"],
  contamination_med:  ["Diarrheal illness"],
  rainfall:    ["Waterborne pathogens from runoff"],
};

function buildMeta({ ph, turbidity, contamination, rainfall }, level, probs) {
  const reasons   = [];
  const diseaseSet = new Set();

  if (ph < 6.0) {
    reasons.push(`Critical pH (${ph}) — severe acidic contamination`);
    DISEASE_MAP.ph_low.forEach(d => diseaseSet.add(d));
  } else if (ph < 6.5) {
    reasons.push(`Low pH (${ph}) — acidification from flood runoff`);
    diseaseSet.add("Gastroenteritis");
  } else if (ph > 8.5) {
    reasons.push(`Elevated pH (${ph}) — alkaline contamination detected`);
    DISEASE_MAP.ph_high.forEach(d => diseaseSet.add(d));
  }

  if (turbidity > 70) {
    reasons.push(`Extreme turbidity (${turbidity} NTU) — disinfection blocked`);
    DISEASE_MAP.turbidity.forEach(d => diseaseSet.add(d));
  } else if (turbidity > 40) {
    reasons.push(`High turbidity (${turbidity} NTU) — heavy sediment load`);
    diseaseSet.add("Diarrhea");
  } else if (turbidity > 20) {
    reasons.push(`Moderate turbidity (${turbidity} NTU) — monitor closely`);
  }

  if (contamination > 75) {
    reasons.push(`Contamination index (${contamination}%) far exceeds WHO limits`);
    DISEASE_MAP.contamination_high.forEach(d => diseaseSet.add(d));
  } else if (contamination > 45) {
    reasons.push(`Elevated contamination (${contamination}%) — moderate risk`);
    DISEASE_MAP.contamination_med.forEach(d => diseaseSet.add(d));
  } else if (contamination > 20) {
    reasons.push(`Low contamination (${contamination}%) — watchable range`);
  }

  if (rainfall > 120) {
    reasons.push(`Heavy rainfall (${rainfall} mm) — high pathogen runoff load`);
  } else if (rainfall > 80) {
    reasons.push(`Moderate rainfall (${rainfall} mm) — elevated flood-borne risk`);
  }

  // Confidence context
  const secondProb = [...probs].sort((a, b) => b - a)[1] * 100;
  if (secondProb > 25) {
    reasons.push(`Model confidence is moderate — borderline conditions detected`);
  }

  const colorMap = { LOW: "#16A34A", MEDIUM: "#D97706", HIGH: "#EA580C", CRITICAL: "#DC2626" };
  const iconMap  = { LOW: "shield-check", MEDIUM: "alert-circle", HIGH: "alert-triangle", CRITICAL: "skull" };
  const recMap   = {
    LOW:      "Continue routine monitoring. Water quality is within acceptable limits.",
    MEDIUM:   "Issue boil-water advisory. Increase testing frequency to every 2 hours.",
    HIGH:     "Issue public health advisory. Distribute water purification tablets immediately.",
    CRITICAL: "Immediate evacuation and medical intervention required. Do not use local water.",
  };

  return {
    color:          colorMap[level],
    icon:           iconMap[level],
    diseases:       [...diseaseSet],
    reasons:        reasons.length ? reasons : ["All parameters within acceptable ranges"],
    recommendation: recMap[level],
  };
}

// ── Zone defaults (same as before, for the GET /zone/:id shortcut) ─────────────
const ZONE_DEFAULTS = {
  "zone-a": { ph: 5.8, turbidity: 72, contamination: 81, rainfall: 142 },
  "zone-b": { ph: 6.1, turbidity: 58, contamination: 63, rainfall: 118 },
  "zone-c": { ph: 6.4, turbidity: 44, contamination: 47, rainfall: 95  },
  "zone-d": { ph: 7.1, turbidity: 18, contamination: 22, rainfall: 62  },
};

// ── Routes ─────────────────────────────────────────────────────────────────────
router.post("/", (req, res) => {
  const { ph, turbidity, contamination, rainfall } = req.body;
  if ([ph, turbidity, contamination, rainfall].some(v => v === undefined)) {
    return res.status(400).json({ error: "Missing sensor parameters" });
  }
  const result = predict({ ph, turbidity, contamination, rainfall });
  res.json(result);
});

router.get("/zone/:zoneId", (req, res) => {
  const data = ZONE_DEFAULTS[req.params.zoneId] || ZONE_DEFAULTS["zone-a"];
  const result = predict(data);
  res.json({ zoneId: req.params.zoneId, ...result });
});

// Model metadata endpoint — lets judges inspect the model
router.get("/model-info", (req, res) => {
  res.json({
    type:                MODEL.model_type,
    version:             MODEL.version,
    trained_on:          MODEL.trained_on,
    training_samples:    MODEL.training_samples,
    training_accuracy:   MODEL.training_accuracy,
    validation_accuracy: MODEL.validation_accuracy,
    features:            MODEL.feature_names,
    classes:             MODEL.classes,
    feature_importances: MODEL.feature_importances,
  });
});

module.exports = router;
