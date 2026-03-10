const express = require("express");
const Memory = require("../models/Memory");
const User = require("../models/User");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");
const multer = require("multer");
const axios = require("axios");
const { analyzeMemory, getRecommendedMemoryIds } = require("../services/aiService");

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) cb(null, true);
    else cb(new Error("Only video files are allowed!"), false);
  },
});

const router = express.Router();

// ─── helpers ────────────────────────────────────────────────────────────────

function addLikesCount(memories) {
  return memories.map(m => ({
    ...m,
    likesCount: m.likes.length,
    image: m.image || null,
    video: m.video || null,
  }));
}

// ─── GET /api/memories/trending-hashtags ────────────────────────────────────
router.get("/trending-hashtags", async (req, res) => {
  try {
    const memories = await Memory.find({ visibility: "public" }).select("caption").lean();
    const hashtagCounts = {};
    memories.forEach(m => {
      (m.caption?.match(/#\w+/g) || []).forEach(tag => {
        const t = tag.toLowerCase();
        hashtagCounts[t] = (hashtagCounts[t] || 0) + 1;
      });
    });
    const trending = Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({
        tag: tag.charAt(0).toUpperCase() + tag.slice(1),
        posts: count > 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString(),
        count,
      }));
    res.json({ success: true, hashtags: trending });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/memories/stats ─────────────────────────────────────────────────
router.get("/stats", auth, async (req, res) => {
  try {
    const totalMemories = await Memory.countDocuments({ visibility: "public" });
    const allMemories = await Memory.find({ visibility: "public" }).lean();
    const totalLikes = allMemories.reduce((s, m) => s + (m.likes?.length || 0), 0);
    const activeSellers = await Memory.distinct("user", { visibility: "public" }).then(u => u.length);
    const floorPrice = 0.1;
    const volume24h = Math.round(totalMemories * 0.25 * 100) / 100;
    res.json({ success: true, stats: { totalMemories, totalLikes, activeSellers, floorPrice, volume24h } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/memories/upload (image) ───────────────────────────────────────
router.post("/upload", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image file uploaded." });
    const base64 = req.file.buffer.toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${base64}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "aura-memories",
      resource_type: "image",
      transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto:good", fetch_format: "auto" }],
    });
    const imageUrl = result.secure_url || result.url;
    if (!imageUrl) return res.status(500).json({ success: false, message: "Failed to get image URL." });
    res.json({ success: true, imageUrl, secureUrl: imageUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/memories/upload-video ─────────────────────────────────────────
router.post("/upload-video", auth, videoUpload.single("video"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No video file uploaded." });
    const base64 = req.file.buffer.toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${base64}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "aura-videos",
      resource_type: "video",
      transformation: [{ quality: "auto", fetch_format: "mp4" }],
    });
    const mediaUrl = result.secure_url || result.url;
    if (!mediaUrl) return res.status(500).json({ success: false, message: "Failed to get video URL." });
    res.json({ success: true, mediaUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/memories/feed ───────────────────────────────────────────────────
// Replace your existing /feed route with this one
router.get("/feed", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const viewerId = req.user.id.toString();

    // Get viewer personality + find authors who have viewer in their followers
    const [viewer, authorsWhoAllowViewer] = await Promise.all([
      User.findById(viewerId).select("personality").lean(),
      User.find({ followers: viewerId }).select("_id").lean(),
    ]);

    const allowedAuthorIds = authorsWhoAllowViewer.map(u => u._id.toString());

    const p = viewer?.personality;
    const hasPersonality = p && Object.values(p).some(v => v !== null);

    // Show a memory if:
    // - visibility = 'public'  → everyone sees it
    // - visibility = 'friends' → only if viewer is in the author's followers list
    // - visibility = 'private' → only the author themselves (never shown to others)
    const visibilityFilter = {
      $or: [
        { visibility: "public" },
        { visibility: "friends", user: { $in: allowedAuthorIds } },
        { visibility: "private", user: viewerId },  // only own private memories
      ],
    };

    const totalMemories = await Memory.countDocuments(visibilityFilter);

    let orderedMemories;

    if (hasPersonality) {
      const recommendedIds = await getRecommendedMemoryIds(p);

      const allVisible = await Memory.find(visibilityFilter)
        .populate("user", "username email profilePicture")
        .populate("comments.user", "username email _id profilePicture")
        .sort({ createdAt: -1 })
        .lean();

      const idSet = new Set(recommendedIds);
      const recommended = recommendedIds
        .map(id => allVisible.find(m => m._id.toString() === id))
        .filter(Boolean);
      const rest = allVisible.filter(m => !idSet.has(m._id.toString()));

      orderedMemories = [...recommended, ...rest].slice(skip, skip + limit);
    } else {
      orderedMemories = await Memory.find(visibilityFilter)
        .populate("user", "username email profilePicture")
        .populate("comments.user", "username email _id profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    }

    res.json({
      success: true,
      memories: addLikesCount(orderedMemories),
      hasMore: skip + orderedMemories.length < totalMemories,
      page,
      limit,
      total: totalMemories,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/memories ───────────────────────────────────────────────────────
router.post("/", auth, async (req, res) => {
  try {
    const { caption, image, video, emotions, visibility } = req.body;

    const memory = new Memory({
      user: req.user.id,
      caption,
      image: image || null,
      video: video || null,
      emotions: emotions || [],
      visibility: visibility || "public",
    });

    const saved = await memory.save();
    await saved.populate("user", "username email");

    // ── Fire-and-forget AI analysis ──────────────────────────────────────
    // We don't await this — user gets an instant response.
    // The analysis runs in the background and stores the vector in Qdrant.
    if (caption || image || video) {
      setImmediate(async () => {
        try {
          // For image/video we only have the Cloudinary URL at this point,
          // not the raw buffer. Fetch the bytes so FastAPI can analyse them.
          let imageBuffer, imageMime, videoBuffer, videoMime;

          if (image) {
            const imgRes = await axios.get(image, { responseType: "arraybuffer", timeout: 30_000 });
            imageBuffer = Buffer.from(imgRes.data);
            imageMime = imgRes.headers["content-type"] || "image/jpeg";
          }
          if (video) {
            const vidRes = await axios.get(video, { responseType: "arraybuffer", timeout: 60_000 });
            videoBuffer = Buffer.from(vidRes.data);
            videoMime = vidRes.headers["content-type"] || "video/mp4";
          }

          await analyzeMemory({
            memoryId: saved._id.toString(),
            caption,
            imageBuffer,
            imageMime,
            videoBuffer,
            videoMime,
          });
        } catch (bgErr) {
          console.error("[bg analysis] failed for memory", saved._id, bgErr.message);
        }
      });
    }

    res.status(201).json({ success: true, memory: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/memories/:id/like ─────────────────────────────────────────────
router.post("/:id/like", auth, async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id);
    if (!memory) return res.status(404).json({ success: false, message: "Memory not found" });

    const uid = req.user.id;
    if (memory.likes.includes(uid)) {
      memory.likes = memory.likes.filter(id => id.toString() !== uid.toString());
    } else {
      memory.likes.push(uid);
    }
    const updated = await memory.save();
    await updated.populate("user", "username email");
    res.json({ success: true, memory: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/memories/:id/comment ──────────────────────────────────────────
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: "Comment text is required" });

    const memory = await Memory.findById(req.params.id);
    if (!memory) return res.status(404).json({ success: false, message: "Memory not found" });

    memory.comments.push({ user: req.user.id, text: text.trim() });
    const updated = await memory.save();
    await updated.populate("user", "username email");
    await updated.populate("comments.user", "username email");
    res.json({ success: true, memory: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/memories/user/:userId ──────────────────────────────────────────
// Replace your existing user/:userId route with this one
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user.id.toString();
    const isOwn = viewerId === userId;

    let query;
    if (isOwn) {
      // Owner sees all their own memories including private
      query = { user: userId };
    } else {
      // Check if viewer follows the author (viewer is in author's followers list)
      const author = await User.findById(userId).select("followers").lean();
      const isFollower = (author?.followers || []).map(id => id.toString()).includes(viewerId);

      if (isFollower) {
        // Followers see public + friends only, never private
        query = { user: userId, visibility: { $in: ["public", "friends"] } };
      } else {
        // Strangers see public only
        query = { user: userId, visibility: "public" };
      }
    }

    const visibleMemories = await Memory.find(query)
      .populate("user", "username email profilePicture")
      .sort({ createdAt: -1 })
      .lean();

    // Count private memories so frontend can show locked placeholders
    const lockedCount = isOwn
      ? 0
      : await Memory.countDocuments({ user: userId, visibility: "private" });

    res.json({
      success: true,
      memories: addLikesCount(visibleMemories),
      lockedCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/memories/:id ────────────────────────────────────────────────
router.delete("/:id", auth, async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id);
    if (!memory) return res.status(404).json({ success: false, message: "Memory not found" });
    if (memory.user.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorized" });

    await Memory.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Memory deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/memories/search?q=query ────────────────────────────────────────
router.get("/search", auth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.json({ success: true, memories: [] });
    }

    const raw = q.trim();

    // Build $or conditions:
    // 1. caption contains the raw query (handles keywords + hashtags)
    // 2. user's username — resolved via a separate User lookup
    const matchingUsers = await User.find({
      username: { $regex: raw, $options: "i" },
    }).select("_id").lean();

    const userIds = matchingUsers.map(u => u._id);

    const memories = await Memory.find({
      visibility: "public",
      $or: [
        { caption: { $regex: raw, $options: "i" } },   // keyword + hashtag match
        { emotions: { $regex: raw, $options: "i" } },  // emotion tag match
        ...(userIds.length ? [{ user: { $in: userIds } }] : []),
      ],
    })
      .populate("user", "username email profilePicture")
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json({
      success: true,
      memories: memories.map(m => ({
        ...m,
        likesCount: m.likes?.length || 0,
        image: m.image || null,
        video: m.video || null,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PATCH /api/memories/:id/ocean ───────────────────────────────────────────
// Called by FastAPI after analysis to store the OCEAN vector on the memory.
// No auth middleware — this is an internal service-to-service call protected
// by a shared secret header instead.
router.patch("/:id/ocean", async (req, res) => {
  try {
    // Verify internal secret so only FastAPI can call this
    const secret = req.headers["x-internal-secret"];
    if (secret !== process.env.INTERNAL_SECRET) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { O, C, E, A, N } = req.body;
    if ([O, C, E, A, N].some(v => v === undefined)) {
      return res.status(400).json({ success: false, message: "All 5 OCEAN scores required" });
    }

    const memory = await Memory.findByIdAndUpdate(
      req.params.id,
      { oceanVector: { O, C, E, A, N } },
      { new: true }
    );

    if (!memory) return res.status(404).json({ success: false, message: "Memory not found" });

    res.json({ success: true, oceanVector: memory.oceanVector });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;