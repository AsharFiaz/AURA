const express = require("express");
const passport = require("passport");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const router = express.Router();

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password, username, personality } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const user = await User.create({
      email,
      password,
      username,
      personality: personality || { O: null, C: null, E: null, A: null, N: null },
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        personality: user.personality,
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
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        personality: user.personality,
        role: user.role || "user",
        profilePicture: user.profilePicture || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error during login", error: error.message });
  }
});

// POST /api/auth/admin-login
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const adminCredentials = [
      { email: "admin@aura.com", password: "admin123", username: "admin" },
      { email: "ashar@gmail.com", password: "123456", username: "ashar" },
    ];

    const adminCred = adminCredentials.find((c) => c.email === email);
    if (!adminCred) {
      return res.status(401).json({ success: false, message: "Invalid admin credentials" });
    }
    if (password !== adminCred.password) {
      return res.status(401).json({ success: false, message: "Invalid admin credentials" });
    }

    let adminUser = await User.findOne({ email }).select("+password");
    if (!adminUser) {
      adminUser = await User.create({
        email: adminCred.email,
        password: adminCred.password,
        username: adminCred.username,
        personality: { O: null, C: null, E: null, A: null, N: null },
        role: "admin",
      });
    } else {
      if (adminUser.role !== "admin") {
        adminUser.role = "admin";
        await adminUser.save();
      }
      const isPasswordValid = await adminUser.matchPassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: "Invalid admin credentials" });
      }
    }

    const token = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: adminUser._id,
        email: adminUser.email,
        username: adminUser.username,
        personality: adminUser.personality,
        role: "admin",
        isAdmin: true,
        profilePicture: adminUser.profilePicture || null,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ success: false, message: "Server error during admin login", error: error.message });
  }
});

// GET /api/auth/google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// GET /api/auth/google/callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&success=true`);
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendUrl}/auth/callback?success=false&error=${encodeURIComponent(error.message)}`);
    }
  }
);

module.exports = router;