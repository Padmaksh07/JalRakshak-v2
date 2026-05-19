const jwt  = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "jalrakshak-dev-secret-change-in-prod";

/**
 * protect  — require a valid JWT on the route
 *
 * Reads:  Authorization: Bearer <token>
 * Sets:   req.user = { id, name, email, role, zone }
 */
async function protect(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authorised — provide a Bearer token" });
  }

  try {
    const token   = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user    = await User.findById(decoded.id).select("-password");
    if (!user || !user.active) {
      return res.status(401).json({ error: "Account not found or deactivated" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * requireAdmin  — use after protect()
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

module.exports = { protect, requireAdmin, JWT_SECRET };
