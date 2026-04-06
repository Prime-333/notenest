const User = require("../models/User.model");

const isAdmin = async (req, res, next) => {
  try {
    const { userId: clerkId } = req.auth();

    if (!clerkId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    req.adminUser = user;

    next();

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = isAdmin;