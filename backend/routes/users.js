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
      interests: user.interests,
      emotions: user.emotions,
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
    const { username, interests, emotions, profilePicture } = req.body;

    // Validate interests array (max 3)
    if (interests && Array.isArray(interests)) {
      if (interests.length > 3) {
        return res.status(400).json({
          success: false,
          message: "Interests array cannot have more than 3 items",
        });
      }
    }

    // Validate emotions array (max 3)
    if (emotions && Array.isArray(emotions)) {
      if (emotions.length > 3) {
        return res.status(400).json({
          success: false,
          message: "Emotions array cannot have more than 3 items",
        });
      }
    }

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
    if (interests !== undefined) {
      user.interests = interests;
    }
    if (emotions !== undefined) {
      user.emotions = emotions;
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
      interests: updatedUser.interests,
      emotions: updatedUser.emotions,
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
      interests: user.interests,
      emotions: user.emotions,
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

module.exports = router;
