const express = require("express");
const passport = require("passport");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const router = express.Router();

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password, username, interests, emotions } = req.body;

    // Check if user already exists by email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      username,
      interests: interests || [],
      emotions: emotions || [],
    });

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    // Return success response
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        interests: user.interests,
        emotions: user.emotions,
        role: user.role || "user",
        profilePicture: user.profilePicture || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists - IMPORTANT: select password field
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    // Return success response
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        interests: user.interests,
        emotions: user.emotions,
        role: user.role || "user",
        profilePicture: user.profilePicture || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
});

// POST /api/auth/admin-login - Admin login route
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Define admin credentials (email, password, username)
    const adminCredentials = [
      { email: "admin@aura.com", password: "admin123", username: "admin" },
      { email: "ashar@gmail.com", password: "123456", username: "ashar" },
    ];

    // Find matching admin credential
    const adminCred = adminCredentials.find((cred) => cred.email === email);

    // Check if it's a valid admin email
    if (!adminCred) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    // Check password matches
    if (password !== adminCred.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    // Find or create admin user
    let adminUser = await User.findOne({ email: email }).select("+password");

    if (!adminUser) {
      // Create admin user if doesn't exist
      adminUser = await User.create({
        email: adminCred.email,
        password: adminCred.password,
        username: adminCred.username,
        interests: [],
        emotions: [],
        role: "admin",
      });
    } else {
      // Ensure existing user has admin role
      if (adminUser.role !== "admin") {
        adminUser.role = "admin";
        await adminUser.save();
      }

      // Verify password
      const isPasswordValid = await adminUser.matchPassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid admin credentials",
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    // Return success response with admin flag
    res.status(200).json({
      success: true,
      token,
      user: {
        id: adminUser._id,
        email: adminUser.email,
        username: adminUser.username,
        interests: adminUser.interests,
        emotions: adminUser.emotions,
        role: "admin",
        isAdmin: true,
        profilePicture: adminUser.profilePicture || null,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during admin login",
      error: error.message,
    });
  }
});

// GET /api/auth/google - Initiate Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// GET /api/auth/google/callback - Handle Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {
      const user = req.user;

      // Generate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&success=true`);
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(
        `${frontendUrl}/auth/callback?success=false&error=${encodeURIComponent(
          error.message
        )}`
      );
    }
  }
);

module.exports = router;
