const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "notenest-admin-super-secret-2024";

/**
 * Verifies the standalone admin JWT issued by /admin/login
 * Does NOT depend on Clerk — works independently.
 */
const verifyAdminToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No admin token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: err.name === "TokenExpiredError" ? "Admin session expired. Please log in again." : "Invalid admin token",
      });
    }

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    // Verify user still exists and is still admin in DB
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "Admin user not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin privileges revoked" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Admin account has been deactivated" });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = verifyAdminToken;
