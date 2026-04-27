const axios = require("axios");
const FormData = require("form-data");
const Memory = require("../models/Memory");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Send memory content to FastAPI for OCEAN analysis.
 * Called in the background after a memory is saved.
 */
async function analyzeMemory({ memoryId, caption, imageBuffer, imageMime, videoBuffer, videoMime }) {
    try {
        const form = new FormData();
        form.append("memory_id", memoryId);
        if (caption) form.append("text", caption);
        if (imageBuffer) form.append("image", imageBuffer, { filename: "image.jpg", contentType: imageMime || "image/jpeg" });
        if (videoBuffer) form.append("video", videoBuffer, { filename: "video.mp4", contentType: videoMime || "video/mp4" });

        const res = await axios.post(`${AI_SERVICE_URL}/analyze`, form, {
            headers: form.getHeaders(),
            timeout: 120_000,
        });

        return res.data;
    } catch (err) {
        console.error("[aiService] analyzeMemory failed:", err.message);
        return null;
    }
}

/**
 * Get recommended memory IDs for a user based on their OCEAN vector.
 * Used by home feed.
 */
async function getRecommendedMemoryIds(personality) {
    try {
        const res = await axios.post(
            `${AI_SERVICE_URL}/recommend`,
            {
                openness: personality.O,
                conscientiousness: personality.C,
                extraversion: personality.E,
                agreeableness: personality.A,
                neuroticism: personality.N,
            },
            { timeout: 15_000 }
        );

        return (res.data.recommendations || [])
            .map(r => r.memory_id)
            .filter(Boolean);
    } catch (err) {
        console.error("[aiService] getRecommendedMemoryIds failed:", err.message);
        return [];
    }
}

/**
 * Get marketplace recommendations — same engine as home feed,
 * but filtered to:
 *   1. NFT-minted memories only (nftTokenId != null)
 *   2. Excludes the viewer's own memories
 *   3. Returns full Memory documents (populated user)
 *
 * @param {object} personality   - { O, C, E, A, N }
 * @param {string} viewerId      - current user's _id (excluded from results)
 * @param {number} limit         - how many to return (default 20)
 * @returns {Promise<Array>}     - ranked array of populated Memory docs
 */
async function getMarketplaceRecommendations(personality, viewerId, limit = 20) {
    try {
        // 1. Ask the same engine for ranked memory IDs.
        //    We request more than we need because filtering will drop some.
        const rankedIds = await getRecommendedMemoryIds(personality);
        if (rankedIds.length === 0) return [];

        // 2. Pull the matching memories from Mongo with NFT filter applied
        const candidates = await Memory.find({
            _id: { $in: rankedIds },
            nftTokenId: { $ne: null },           // condition 1: must be minted
            user: { $ne: viewerId },             // condition 3: not viewer's own
            visibility: { $in: ["public", "friends"] },  // private memories never enter marketplace
        })
            .populate("user", "username email profilePicture")
            .lean();

        // 3. Mongo's $in doesn't preserve order — restore the engine's ranking
        const orderMap = new Map(rankedIds.map((id, idx) => [id, idx]));
        candidates.sort((a, b) => {
            const aRank = orderMap.get(a._id.toString()) ?? Infinity;
            const bRank = orderMap.get(b._id.toString()) ?? Infinity;
            return aRank - bRank;
        });

        return candidates.slice(0, limit);
    } catch (err) {
        console.error("[aiService] getMarketplaceRecommendations failed:", err.message);
        return [];
    }
}

module.exports = {
    analyzeMemory,
    getRecommendedMemoryIds,
    getMarketplaceRecommendations,
};