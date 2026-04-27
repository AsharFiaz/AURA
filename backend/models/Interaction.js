const mongoose = require('mongoose');

/**
 * Interaction — one row per engagement event on the Home feed.
 *
 * Used to feed the dynamic OCEAN vector update (see services/vectorUpdate.js).
 *
 * `applied: false` rows are pending ingestion. Set to true once the user
 * vector has been recomputed using this interaction. This prevents the
 * 24-hour cron and the logout trigger from double-counting events.
 */
const interactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    memory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Memory',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ['view', 'like', 'comment', 'bookmark', 'profile_visit', 'expand'],
        required: true,
    },
    // For 'view' interactions only — measured in seconds, capped at 3 (= full view)
    dwellSeconds: { type: Number, default: 0 },

    // Snapshot of the memory's OCEAN vector at the time of interaction.
    // Stored so future memory edits don't retroactively corrupt the user's history.
    memoryVector: {
        O: { type: Number, default: null },
        C: { type: Number, default: null },
        E: { type: Number, default: null },
        A: { type: Number, default: null },
        N: { type: Number, default: null },
    },

    // Has this interaction been folded into the user's vector yet?
    applied: { type: Boolean, default: false, index: true },

    createdAt: { type: Date, default: Date.now, index: true },
});

// Compound index — fast lookup of unapplied rows for a user
interactionSchema.index({ user: 1, applied: 1 });

// Optional TTL — purge applied interactions after 90 days to keep collection lean
interactionSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 60 * 60 * 24 * 90, partialFilterExpression: { applied: true } }
);

module.exports = mongoose.model('Interaction', interactionSchema);