const mongoose = require('mongoose');

/**
 * VectorHistory — one row per meaningful change to a user's OCEAN vector.
 *
 * Written by services/vectorUpdate.js whenever the vector actually changes
 * (skipped on no-engagement and no-base-vector cases).
 *
 * Used to chart the user's personality drift over time on the Insights page.
 */
const vectorHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    vector: {
        O: { type: Number, required: true },
        C: { type: Number, required: true },
        E: { type: Number, required: true },
        A: { type: Number, required: true },
        N: { type: Number, required: true },
    },
    source: {
        type: String,
        enum: ['onboarding', 'logout', 'cron', 'backfill'],
        required: true,
    },
    interactionCount: { type: Number, default: 0 },
    memoryCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, index: true },
});

// Compound index — fast lookups of a single user's history in chronological order
vectorHistorySchema.index({ user: 1, createdAt: 1 });

module.exports = mongoose.model('VectorHistory', vectorHistorySchema);