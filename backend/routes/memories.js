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
// Returns personality-ranked memories first, then fills with chronological.
router.get("/feed", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalMemories = await Memory.countDocuments({ visibility: "public" });

    // Fetch user personality to power recommendations
    const user = await User.findById(req.user.id).select("personality").lean();
    const p = user?.personality;
    const hasPersonality = p && Object.values(p).some(v => v !== null);

    let orderedMemories;

    if (hasPersonality) {
      // ── Personality-ranked path ──────────────────────────────────────────
      const recommendedIds = await getRecommendedMemoryIds(p);

      // Fetch ALL public memories for this page window (broader fetch so we
      // can re-order without making N queries)
      const allPublic = await Memory.find({ visibility: "public" })
        .populate("user", "username email profilePicture")
        .populate("comments.user", "username email _id profilePicture")
        .sort({ createdAt: -1 })
        .lean();

      // Split into recommended vs rest, preserving recommendation order
      const idSet = new Set(recommendedIds);
      const recommended = recommendedIds
        .map(id => allPublic.find(m => m._id.toString() === id))
        .filter(Boolean);
      const rest = allPublic.filter(m => !idSet.has(m._id.toString()));

      orderedMemories = [...recommended, ...rest].slice(skip, skip + limit);
    } else {
      // ── Fallback: plain chronological ────────────────────────────────────
      orderedMemories = await Memory.find({ visibility: "public" })
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
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const isOwn = req.user.id.toString() === userId;
    const query = isOwn ? { user: userId } : { user: userId, visibility: "public" };

    const memories = await Memory.find(query)
      .populate("user", "username email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, memories: addLikesCount(memories) });
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

module.exports = router;