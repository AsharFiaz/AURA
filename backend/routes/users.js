const express = require("express");
const User = require("../models/User");
const Memory = require("../models/Memory");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// GET /api/users/me - Get current authenticated user's data
// GET /api/users/me - Get current authenticated user's data
router.get("/me", auth, async (req, res) => {
  try {
    // Find user by ID, exclude password
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return user with followers and following arrays (as IDs)
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      personality: user.personality || { O: null, C: null, E: null, A: null, N: null },
      createdAt: user.createdAt,
      followers: user.followers || [],
      following: user.following || [],
      role: user.role || "user",
      profilePicture: user.profilePicture || null,
    };

    res.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// PUT /api/users/profile - Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { username, personality, profilePicture } = req.body;

    // Find user by ID
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update allowed fields only (NOT email or password)
    if (username !== undefined) {
      user.username = username;
    }
    if (personality !== undefined) {
      user.personality = personality;
    }
    // Allow setting profilePicture to null to remove it
    if (profilePicture !== undefined) {
      // If setting to null, delete old picture from Cloudinary
      if (profilePicture === null && user.profilePicture) {
        try {
          const publicId = user.profilePicture.split("/").slice(-2).join("/").split(".")[0];
          await cloudinary.uploader.destroy(`aura-profile-pictures/${publicId}`);
        } catch (error) {
          console.error("Error deleting old profile picture:", error);
          // Continue even if deletion fails
        }
      }
      user.profilePicture = profilePicture;
    }

    // Save updated user
    const updatedUser = await user.save();

    // Return user data without password
    const userResponse = {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      personality: updatedUser.personality || { O: null, C: null, E: null, A: null, N: null },
      createdAt: updatedUser.createdAt,
      profilePicture: updatedUser.profilePicture || null,
      followers: updatedUser.followers || [],
      following: updatedUser.following || [],
      role: updatedUser.role || "user",
    };

    res.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    // Handle validation errors
    if (error.code === 11000) {
      // Duplicate key error (username already exists)
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/users/search?q=query - Search for users
router.get("/search", auth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.json({
        success: true,
        users: [],
      });
    }

    // Find users by username containing the query (case-insensitive)
    // Exclude the current user
    const users = await User.find({
      username: { $regex: q, $options: "i" },
      _id: { $ne: req.user.id },
    })
      .select("-password")
      .limit(20)
      .lean();

    // Format response with follower count
    const searchResults = users.map((user) => ({
      id: user._id,
      username: user.username,
      email: user.email,
      followerCount: user.followers?.length || 0,
    }));

    res.json({
      success: true,
      users: searchResults,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST /api/users/profile-picture - Upload profile picture
router.post("/profile-picture", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file uploaded",
      });
    }

    // Convert buffer to base64 string for Cloudinary
    const base64String = req.file.buffer.toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${base64String}`;

    // Upload to Cloudinary with circular crop for profile pictures
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: "aura-profile-pictures",
      resource_type: "image",
      transformation: [
        {
          width: 400,
          height: 400,
          crop: "fill",
          gravity: "face",
          radius: "max",
        },
        {
          quality: "auto:good",
          fetch_format: "auto",
        },
      ],
    });

    // Update user's profile picture
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete old profile picture from Cloudinary if exists
    if (user.profilePicture) {
      try {
        const publicId = user.profilePicture.split("/").slice(-2).join("/").split(".")[0];
        await cloudinary.uploader.destroy(`aura-profile-pictures/${publicId}`);
      } catch (error) {
        console.error("Error deleting old profile picture:", error);
        // Continue even if deletion fails
      }
    }

    user.profilePicture = uploadResult.secure_url;
    await user.save();

    res.json({
      success: true,
      profilePicture: uploadResult.secure_url,
      message: "Profile picture updated successfully",
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload profile picture",
    });
  }
});

// GET /api/users/:userId - Get user profile by ID
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user by ID, exclude password
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Count user's memories
    const memoryCount = await Memory.countDocuments({ user: userId });

    // Return user data with memory count
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      personality: user.personality || { O: null, C: null, E: null, A: null, N: null },
      createdAt: user.createdAt,
      memoryCount,
      followers: user.followers || [],
      following: user.following || [],
      profilePicture: user.profilePicture || null,
    };

    res.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/users/me/report — personal stats report
// Add this block just before module.exports = router;
router.get("/me/report", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // All user's memories
    const memories = await Memory.find({ user: userId }).lean();

    // Basic counts
    const totalMemories = memories.length;
    const totalLikes = memories.reduce((s, m) => s + (m.likes?.length || 0), 0);
    const totalComments = memories.reduce((s, m) => s + (m.comments?.length || 0), 0);

    // Emotion tag frequency
    const emotionMap = {};
    memories.forEach(m => {
      (m.emotions || []).forEach(e => {
        const key = e.trim();
        if (key) emotionMap[key] = (emotionMap[key] || 0) + 1;
      });
    });
    const topEmotions = Object.entries(emotionMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([emotion, count]) => ({ emotion, count }));

    const now = new Date();
    const memoriesByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const count = memories.filter(m => {
        const d = new Date(m.createdAt);
        return d >= monthStart && d <= monthEnd;
      }).length;
      memoriesByMonth.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        count,
      });
    }

    // Most liked memory
    const topMemory = memories.length
      ? memories.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))[0]
      : null;

    res.json({
      success: true,
      report: {
        totalMemories,
        totalLikes,
        totalComments,
        topEmotions,
        memoriesByMonth,
        topMemory: topMemory ? {
          id: topMemory._id,
          caption: topMemory.caption,
          image: topMemory.image || null,
          likesCount: topMemory.likes?.length || 0,
        } : null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
