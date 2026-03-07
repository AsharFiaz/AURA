const axios = require("axios");
const FormData = require("form-data");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Send memory content to FastAPI for OCEAN analysis.
 * Called in the background after a memory is saved.
 *
 * @param {object} opts
 * @param {string}  opts.memoryId   - MongoDB _id of the memory
 * @param {string}  [opts.caption]  - text caption
 * @param {Buffer}  [opts.imageBuffer]
 * @param {string}  [opts.imageMime]
 * @param {Buffer}  [opts.videoBuffer]
 * @param {string}  [opts.videoMime]
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
            timeout: 120_000,   // 2 min — AI calls can be slow
        });

        return res.data;
    } catch (err) {
        // Non-blocking — log but don't crash the main flow
        console.error("[aiService] analyzeMemory failed:", err.message);
        return null;
    }
}

/**
 * Get recommended memory IDs for a user based on their OCEAN vector.
 *
 * @param {object} personality  - { O, C, E, A, N } from User model
 * @returns {string[]}          - ordered array of MongoDB memory _id strings
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

        // Filter out entries with no memory_id (old data without the field)
        return (res.data.recommendations || [])
            .map(r => r.memory_id)
            .filter(Boolean);
    } catch (err) {
        console.error("[aiService] getRecommendedMemoryIds failed:", err.message);
        return [];
    }
}

module.exports = { analyzeMemory, getRecommendedMemoryIds };