const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const { protect, JWT_SECRET } = require("../middleware/auth");

const TOKEN_EXPIRY = "7d";

function signToken(id) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// ── POST /api/auth/register ────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { name, email, password, zone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }
  try {
    if (await User.findOne({ email })) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const user  = await User.create({ name, email, password, zone: zone || "all" });
    const token = signToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (!user.active) {
      return res.status(401).json({ error: "Account deactivated — contact admin" });
    }
    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────────
router.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
