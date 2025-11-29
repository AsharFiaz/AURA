const express = require("express");
const User = require("../models/User");
const Memory = require("../models/Memory");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// All admin routes require authentication AND admin role
// Use adminAuth middleware which checks both auth and admin role

// GET /api/admin/stats - Get admin statistics
router.get("/stats", auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMemories = await Memory.countDocuments();

    // Calculate total likes across all memories
    const memories = await Memory.find({}).lean();
    const totalLikes = memories.reduce(
      (sum, memory) => sum + (memory.likes?.length || 0),
      0
    );

    // For now, NFTs = public memories (will be actual NFTs later)
    const totalNFTs = await Memory.countDocuments({ visibility: "public" });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalMemories,
        totalNFTs,
        totalLikes,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/admin/analytics/user-growth - Get user growth data (last 12 months)
router.get("/analytics/user-growth", auth, adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const months = [];
    
    // Get data for last 12 months
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      const count = await User.countDocuments({
        createdAt: {
          $gte: monthStart,
          $lte: monthEnd,
        },
      });
      
      months.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        count,
      });
    }
    
    res.json({
      success: true,
      data: months,
    });
  } catch (error) {
    console.error("Error fetching user growth:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/admin/analytics/memory-activity - Get memory activity (last 7 days)
router.get("/analytics/memory-activity", auth, adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const days = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    // Get data for last 7 days
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      const count = await Memory.countDocuments({
        createdAt: {
          $gte: dayStart,
          $lte: dayEnd,
        },
      });
      
      days.push({
        day: dayNames[dayStart.getDay()],
        count,
      });
    }
    
    res.json({
      success: true,
      data: days,
    });
  } catch (error) {
    console.error("Error fetching memory activity:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/admin/users - Get all users with pagination
router.get("/users", auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments();
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get memory count for each user
    const usersWithMemoryCount = await Promise.all(
      users.map(async (user) => {
        const memoriesCount = await Memory.countDocuments({ user: user._id });
        return {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          role: user.role || "user",
          memoriesCount,
        };
      })
    );

    res.json({
      success: true,
      users: usersWithMemoryCount,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit),
        hasMore: skip + limit < totalUsers,
      },
    });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/admin/memories - Get all memories with pagination
router.get("/memories", auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const totalMemories = await Memory.countDocuments();
    const memories = await Memory.find({})
      .populate("user", "username email _id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Add likesCount to each memory
    const memoriesWithLikesCount = memories.map((memory) => ({
      ...memory,
      likesCount: memory.likes?.length || 0,
    }));

    res.json({
      success: true,
      memories: memoriesWithLikesCount,
      pagination: {
        page,
        limit,
        total: totalMemories,
        pages: Math.ceil(totalMemories / limit),
        hasMore: skip + limit < totalMemories,
      },
    });
  } catch (error) {
    console.error("Error fetching admin memories:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/admin/nfts - Get all NFTs (public memories) with pagination
router.get("/nfts", auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const totalNFTs = await Memory.countDocuments({ visibility: "public" });
    const nfts = await Memory.find({ visibility: "public" })
      .populate("user", "username email _id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Add likesCount to each NFT
    const nftsWithLikesCount = nfts.map((nft) => ({
      ...nft,
      likesCount: nft.likes?.length || 0,
    }));

    res.json({
      success: true,
      nfts: nftsWithLikesCount,
      pagination: {
        page,
        limit,
        total: totalNFTs,
        pages: Math.ceil(totalNFTs / limit),
        hasMore: skip + limit < totalNFTs,
      },
    });
  } catch (error) {
    console.error("Error fetching admin NFTs:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/admin/likes - Get likes analytics
router.get("/likes", auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get all memories sorted by likes count
    const allMemories = await Memory.find({})
      .populate("user", "username email _id")
      .lean();

    // Calculate total likes
    const totalLikes = allMemories.reduce(
      (sum, memory) => sum + (memory.likes?.length || 0),
      0
    );

    // Sort memories by likes count (descending)
    const memoriesWithLikes = allMemories
      .map((memory) => ({
        ...memory,
        likesCount: memory.likes?.length || 0,
      }))
      .sort((a, b) => b.likesCount - a.likesCount);

    // Paginate
    const paginatedMemories = memoriesWithLikes.slice(skip, skip + limit);
    const total = memoriesWithLikes.length;

    // Get top liked memories for analytics
    const topLiked = memoriesWithLikes.slice(0, 10);

    res.json({
      success: true,
      totalLikes,
      memories: paginatedMemories,
      topLiked,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching likes analytics:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// DELETE /api/admin/memories/:id - Delete memory as admin
router.delete("/memories/:id", auth, adminAuth, async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Memory not found",
      });
    }

    await Memory.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Memory deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting memory:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;

