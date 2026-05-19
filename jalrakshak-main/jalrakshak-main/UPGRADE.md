# JalRakshak v3 — Upgrade Guide

## What changed from v2 → v3

### 1. Real ML Prediction  (`server/routes/predict.js` + `server/ml/`)

**v2:** Pure if/else rules.
**v3:** Multinomial logistic regression trained on 12,480 synthetic CPCB
Brahmaputra Basin water quality samples. Weights are exported to `model.json`
and loaded at startup — no Python runtime needed in production.

- `server/ml/train.py`   — full scikit-learn training pipeline (run once)
- `server/ml/model.json` — exported weights (intercepts + coefficients)
- `server/routes/predict.js` — softmax inference in pure JS
- New endpoint: `GET /api/predict/model-info` — exposes model provenance for judges
- Response now includes `probabilities`, `confidence`, `feature_importances`, `reasons`

### 2. JWT Authentication  (`server/middleware/auth.js`, `server/routes/auth.js`)

**v2:** Any client could POST to `/api/alerts/send`.
**v3:** Two-role system — public (read-only) and health officials (write).

- `POST /api/auth/register` — create official account
- `POST /api/auth/login`    — returns JWT (7-day expiry)
- `GET  /api/auth/me`       — verify token, returns user
- Alert POST/DELETE routes now require `Authorization: Bearer <token>`
- Demo account seeded automatically: `official@jalrakshak.in` / `demo1234`

### 3. Real Rainfall Data  (`server/routes/sensor.js`)

**v2:** Hardcoded rainfall value with random noise.
**v3:** Fetches live precipitation from Open-Meteo (Guwahati) — free, no API key.

- Cached for 30 minutes to avoid hammering the API
- Falls back to simulated value if Open-Meteo is unreachable
- Every API response includes `rainfallSource: "openmeteo" | "simulated"`
- Frontend shows a "🛰 Live IMD" badge when source is real

### 4. Historical Sensor Storage  (`server/models/SensorReading.js`)

**v2:** No time-series storage — every page load showed a snapshot.
**v3:** Every sensor reading is persisted to MongoDB with a 7-day TTL.

- `GET /api/sensors/history?zone=zone-a&hours=24` — returns up to 500 readings
- Dashboard shows 24h sparklines (pH, turbidity, contamination) via Recharts
- Compound index `{ zone, createdAt }` keeps queries fast

### 5. IoT Device Metadata  (`server/routes/sensor.js`)

**v2:** No device info.
**v3:** Every reading includes simulated IoT device metadata:

- Device ID, model, GPS coordinates
- Signal strength (dBm), battery level
- Last calibration timestamp
- Visible on the dashboard "IoT Device" card

### 6. Multilingual Chatbot  (`server/routes/gemini.js`, `client/src/components/ResidentChatbot.jsx`)

**v2:** Gemini only used for generating camp data.
**v3:** Full resident chatbot — floating widget on the dashboard.

- Supports English, Hindi, Assamese (auto-detected)
- Injects live zone sensor data as context
- Multi-turn conversation (last 8 turns sent as history)
- Suggested prompts in all 3 languages
- `POST /api/gemini/chat`

### 7. PWA + Offline Support  (`client/vite.config.js`)

**v2:** No offline capability.
**v3:** Full Progressive Web App via `vite-plugin-pwa` (Workbox).

Caching strategy per resource type:
| Resource | Strategy | TTL |
|---|---|---|
| Build assets (JS/CSS/HTML) | Precache | Forever (versioned) |
| OSM map tiles | CacheFirst | 30 days |
| `/api/sensors` | NetworkFirst | 6 hours fallback |
| `/api/alerts` | NetworkFirst | 12 hours fallback |
| `/api/predict` | NetworkFirst | 6 hours fallback |
| Hospital/camp data | StaleWhileRevalidate | 24 hours |

- `OfflineBanner` component shows stale-data warning when offline
- "Reconnected" flash when connectivity restores
- Installable on Android/iOS from the browser

### 8. Frontend Auth  (`client/src/context/AuthContext.jsx`, `client/src/pages/LoginPage.jsx`)

- `AuthContext` — JWT persisted in localStorage, auto-validated on mount
- `LoginPage` — sign in or register; demo credentials pre-filled
- Dashboard alert button only visible to logged-in officials
- `"Official Login →"` link for public users

---

## Setup

```bash
# Backend
cd server
cp .env.example .env          # fill in GEMINI_API_KEY, MONGODB_URI
npm install
npm run dev

# Frontend
cd client
npm install
npm run dev

# (Optional) Re-train the ML model
cd server
pip install scikit-learn numpy pandas
python ml/train.py            # writes new model.json
```

## New environment variables

| Variable | Required | Notes |
|---|---|---|
| `JWT_SECRET` | Yes | Long random string |
| `MONGODB_URI` | Yes | Local or Atlas |
| `GEMINI_API_KEY` | For chatbot | Google AI Studio |
| `TWILIO_*` | For SMS | Optional |
| `SMS_TEST_RECIPIENTS` | For SMS | Comma-separated |
