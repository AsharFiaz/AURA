const User = require("../models/User");

const adminAuth = async (req, res, next) => {
  try {
    // Check if user is authenticated (req.user should exist from auth middleware)
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Find user and check if they are admin
    const user = await User.findById(req.user.id).select("role");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    // User is admin, proceed
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying admin access",
    });
  }
};

module.exports = adminAuth;

