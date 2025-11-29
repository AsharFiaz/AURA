const express = require("express");
const Memory = require("../models/Memory");
const User = require("../models/User");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// GET /api/memories/trending-hashtags - Get trending hashtags (public data, no auth required)
router.get("/trending-hashtags", async (req, res) => {
  try {
    // Get all public memories
    const memories = await Memory.find({ visibility: "public" })
      .select("caption")
      .lean();

    // Extract hashtags from captions
    const hashtagCounts = {};
    memories.forEach((memory) => {
      if (memory.caption) {
        const hashtags = memory.caption.match(/#\w+/g) || [];
        hashtags.forEach((tag) => {
          const normalizedTag = tag.toLowerCase();
          hashtagCounts[normalizedTag] = (hashtagCounts[normalizedTag] || 0) + 1;
        });
      }
    });

    // Sort by count and get top 5
    const trending = Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({
        tag: tag.charAt(0).toUpperCase() + tag.slice(1),
        posts: count > 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString(),
        count,
      }));

    res.json({
      success: true,
      hashtags: trending,
    });
  } catch (error) {
    console.error("Error fetching trending hashtags:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/memories/stats - Get marketplace statistics
router.get("/stats", auth, async (req, res) => {
  try {
    // Total count of all public memories
    const totalMemories = await Memory.countDocuments({ visibility: "public" });

    // Get all public memories to calculate total likes
    const allMemories = await Memory.find({ visibility: "public" }).lean();
    const totalLikes = allMemories.reduce((sum, memory) => {
      return sum + (memory.likes?.length || 0);
    }, 0);

    // Count unique users who created memories
    const activeSellers = await Memory.distinct("user", {
      visibility: "public",
    }).then((users) => users.length);

    // Hardcoded floor price for now
    const floorPrice = 0.1;

    // Mock volume calculation: total memories * average price (0.25 AURA average)
    const averagePrice = 0.25;
    const volume24h = totalMemories * averagePrice;

    res.json({
      success: true,
      stats: {
        totalMemories,
        totalLikes,
        activeSellers,
        floorPrice,
        volume24h: Math.round(volume24h * 100) / 100, // Round to 2 decimal places
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST /api/memories/upload - Upload image to Cloudinary
router.post("/upload", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file uploaded. Please select an image file.",
      });
    }

    console.log("📤 Starting Cloudinary upload...");
    console.log("File details:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // Convert buffer to base64 string for Cloudinary
    const base64String = req.file.buffer.toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${base64String}`;

    // Upload to Cloudinary with optimized transformations for social posts
    // Standard aspect ratio (1:1 square or 4:5 portrait) - max 800px width/height
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: "aura-memories",
      resource_type: "image",
      transformation: [
        {
          width: 800,
          height: 800,
          crop: "limit", // Maintain aspect ratio, don't crop
          quality: "auto:good", // Optimize quality for smaller file size
          fetch_format: "auto", // Auto-convert to WebP when possible
          dpr: "auto", // Auto-adjust for device pixel ratio
        },
      ],
    });

    // Extract the secure URL
    const imageUrl = uploadResult.secure_url || uploadResult.url;

    if (!imageUrl) {
      console.error("❌ No URL in Cloudinary response:", uploadResult);
      return res.status(500).json({
        success: false,
        message: "Failed to get image URL from Cloudinary response.",
      });
    }

    console.log("✅ Image uploaded successfully:", imageUrl);

    res.json({
      success: true,
      imageUrl: imageUrl,
      secureUrl: imageUrl,
    });
  } catch (error) {
    console.error("❌ Upload error details:", error);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);

    // Check for specific Cloudinary errors
    if (error.http_code === 401 || error.message?.includes("401")) {
      return res.status(500).json({
        success: false,
        message:
          "Cloudinary authentication failed. Please check your CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env",
      });
    }

    if (error.http_code === 400 || error.message?.includes("Invalid")) {
      return res.status(500).json({
        success: false,
        message:
          "Cloudinary configuration error. Please check your CLOUDINARY_CLOUD_NAME in .env",
      });
    }

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Error uploading image to Cloudinary. Please try again.",
    });
  }
});

// GET /api/memories/feed - Get all public memories with pagination
router.get("/feed", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count of public memories
    const totalMemories = await Memory.countDocuments({ visibility: "public" });

    // Fetch memories with pagination
    const memories = await Memory.find({ visibility: "public" })
      .populate("user", "username email profilePicture")
      .populate("comments.user", "username email _id profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Add likesCount to each memory (since virtuals don't work with lean())
    const memoriesWithLikesCount = memories.map((memory) => ({
      ...memory,
      likesCount: memory.likes.length,
    }));

    // Check if there are more memories
    const hasMore = skip + memories.length < totalMemories;

    res.json({
      success: true,
      memories: memoriesWithLikesCount,
      hasMore,
      page,
      limit,
      total: totalMemories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// POST /api/memories - Create new memory
router.post("/", auth, async (req, res) => {
  try {
    const { caption, image, emotions, visibility } = req.body;

    const memory = new Memory({
      user: req.user.id,
      caption,
      image: image || null,
      emotions: emotions || [],
      visibility: visibility || "public",
    });

    const savedMemory = await memory.save();
    await savedMemory.populate("user", "username email");

    res.status(201).json({
      success: true,
      memory: savedMemory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST /api/memories/:id/like - Toggle like on a memory
router.post("/:id/like", auth, async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Memory not found",
      });
    }

    const userId = req.user.id;
    const isLiked = memory.likes.includes(userId);

    if (isLiked) {
      // Remove like
      memory.likes = memory.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // Add like
      memory.likes.push(userId);
    }

    const updatedMemory = await memory.save();
    await updatedMemory.populate("user", "username email");

    res.json({
      success: true,
      memory: updatedMemory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST /api/memories/:id/comment - Add comment to memory
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const memory = await Memory.findById(req.params.id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Memory not found",
      });
    }

    memory.comments.push({
      user: req.user.id,
      text: text.trim(),
    });

    const updatedMemory = await memory.save();
    await updatedMemory.populate("user", "username email");
    await updatedMemory.populate("comments.user", "username email");

    res.json({
      success: true,
      memory: updatedMemory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/memories/user/:userId - Get all memories by specific user
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const isOwnProfile = req.user.id.toString() === userId;

    // Build query based on visibility
    let query = { user: userId };

    // If not own profile, only show public memories
    if (!isOwnProfile) {
      query.visibility = "public";
    }

    const memories = await Memory.find(query)
      .populate("user", "username email")
      .sort({ createdAt: -1 })
      .lean();

    // Add likesCount to each memory
    const memoriesWithLikesCount = memories.map((memory) => ({
      ...memory,
      likesCount: memory.likes.length,
    }));

    res.json({
      success: true,
      memories: memoriesWithLikesCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// DELETE /api/memories/:id - Delete a memory
router.delete("/:id", auth, async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Memory not found",
      });
    }

    // Check if user is the owner
    if (memory.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this memory",
      });
    }

    // Delete the memory
    await Memory.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Memory deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
