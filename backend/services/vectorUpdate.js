const Interaction = require('../models/Interaction');
const User = require('../models/User');

// ── Tuning constants ────────────────────────────────────────────────────────
const ALPHA = 0.85;   // memory coefficient (preserves identity)
const BETA = 0.15;   // engagement coefficient (alpha + beta = 1)

const W_VIEW = 0.10;
const W_LIKE = 0.25;
const W_COMMENT = 0.45;
const W_OTHER = 0.20;   // shared by bookmark + profile_visit + expand

// View dwell threshold — 3 seconds = fully viewed
const VIEW_FULL_DWELL = 3.0;

// ── Engagement score for a single (user, memory) bucket ─────────────────────
/**
 * Combines all interaction types for one memory into a single E_i ∈ [0, 1].
 *
 * @param {Array} interactions  All Interaction rows for ONE memory by ONE user
 * @returns {number}            E_i in [0, 1]
 */
function computeEngagement(interactions) {
    let fView = 0, fLike = 0, fComment = 0, fOther = 0;

    for (const it of interactions) {
        switch (it.type) {
            case 'view': {
                // Take MAX dwell across multiple view events on the same post
                const norm = Math.min((it.dwellSeconds || 0) / VIEW_FULL_DWELL, 1);
                if (norm > fView) fView = norm;
                break;
            }
            case 'like':
                fLike = 1;
                break;
            case 'comment':
                fComment = 1;
                break;
            case 'bookmark':
            case 'profile_visit':
            case 'expand':
                // Any of these fire → "other" bucket activates
                fOther = 1;
                break;
            default:
                break;
        }
    }

    const E =
        W_VIEW * fView +
        W_LIKE * fLike +
        W_COMMENT * fComment +
        W_OTHER * fOther;

    // Clamp defensively — weights sum to 1.0 so this should never exceed 1
    return Math.min(Math.max(E, 0), 1);
}

// ── Main update function ────────────────────────────────────────────────────
/**
 * Pulls all unapplied interactions for a user, applies the formula,
 * writes the new personality vector back to User, and marks rows applied.
 *
 * @param {string} userId
 * @returns {Promise<{updated: boolean, reason?: string, oldVector?: object, newVector?: object, interactionCount?: number}>}
 */
async function updateUserVector(userId) {
    // 1. Fetch user with current vector
    const user = await User.findById(userId).select('personality').lean();
    if (!user) return { updated: false, reason: 'user_not_found' };

    const p = user.personality || {};
    const hasVector = ['O', 'C', 'E', 'A', 'N'].every(k => typeof p[k] === 'number');
    if (!hasVector) {
        // User hasn't completed onboarding — skip; no base vector to evolve
        return { updated: false, reason: 'no_base_vector' };
    }

    // 2. Pull all unapplied interactions (excluding self-interactions defensively
    //    — they should already be filtered at write-time, but double-check here)
    const interactions = await Interaction.find({
        user: userId,
        applied: false,
    })
        .populate({ path: 'memory', select: 'user' })
        .lean();

    // Filter out self-interactions (memory authored by the same user)
    const externalInteractions = interactions.filter(it => {
        const memOwner = it.memory?.user?.toString();
        return memOwner && memOwner !== userId.toString();
    });

    if (externalInteractions.length === 0) {
        // Mark any self-interactions applied so they don't accumulate forever
        const idsToMark = interactions.map(it => it._id);
        if (idsToMark.length > 0) {
            await Interaction.updateMany({ _id: { $in: idsToMark } }, { applied: true });
        }
        return { updated: false, reason: 'no_engagement' };
    }

    // 3. Group interactions by memory ID
    const buckets = {};
    for (const it of externalInteractions) {
        const memId = it.memory._id.toString();
        if (!buckets[memId]) buckets[memId] = { interactions: [], vector: null };
        buckets[memId].interactions.push(it);
        // First valid memoryVector wins (they should all be identical for the same memory)
        if (!buckets[memId].vector && it.memoryVector) {
            const mv = it.memoryVector;
            const valid = ['O', 'C', 'E', 'A', 'N'].every(k => typeof mv[k] === 'number');
            if (valid) buckets[memId].vector = mv;
        }
    }

    // 4. Compute weighted sum across memories
    const traits = ['O', 'C', 'E', 'A', 'N'];
    const weightedSum = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    let totalE = 0;

    for (const memId in buckets) {
        const bucket = buckets[memId];
        if (!bucket.vector) continue;  // memory had no OCEAN vector yet — skip

        const E_i = computeEngagement(bucket.interactions);
        if (E_i <= 0) continue;

        for (const k of traits) {
            weightedSum[k] += E_i * bucket.vector[k];
        }
        totalE += E_i;
    }

    if (totalE === 0) {
        // All buckets had zero engagement or missing vectors — nothing to do
        const idsToMark = externalInteractions.map(it => it._id);
        await Interaction.updateMany({ _id: { $in: idsToMark } }, { applied: true });
        return { updated: false, reason: 'zero_engagement' };
    }

    // 5. Apply the formula:  U_{t+1} = α·U_t  +  β · (Σ E_i V_i / Σ E_i)
    const oldVector = { O: p.O, C: p.C, E: p.E, A: p.A, N: p.N };
    const newVector = {};
    for (const k of traits) {
        const contentInfluence = weightedSum[k] / totalE;
        const updated = ALPHA * oldVector[k] + BETA * contentInfluence;
        // Clamp into [0, 1] just in case of floating-point drift
        newVector[k] = Math.min(Math.max(updated, 0), 1);
    }

    // 6. Persist new vector + mark all interactions applied
    await User.findByIdAndUpdate(userId, { personality: newVector });

    const allIds = interactions.map(it => it._id);  // include self-interactions in the mark
    await Interaction.updateMany({ _id: { $in: allIds } }, { applied: true });

    return {
        updated: true,
        oldVector,
        newVector,
        interactionCount: externalInteractions.length,
        memoryCount: Object.keys(buckets).length,
    };
}

// ── Bulk update (for daily cron) ────────────────────────────────────────────
/**
 * Find every user with at least one unapplied interaction and update each.
 * Logs results; never throws (so cron doesn't crash on one bad user).
 */
async function updateAllPendingUsers() {
    const userIds = await Interaction.distinct('user', { applied: false });
    console.log(`[vectorUpdate] daily run — ${userIds.length} users with pending interactions`);

    let updated = 0, skipped = 0, failed = 0;
    for (const uid of userIds) {
        try {
            const res = await updateUserVector(uid);
            if (res.updated) updated++;
            else skipped++;
        } catch (err) {
            failed++;
            console.error(`[vectorUpdate] failed for user ${uid}:`, err.message);
        }
    }

    console.log(`[vectorUpdate] done — updated:${updated} skipped:${skipped} failed:${failed}`);
    return { total: userIds.length, updated, skipped, failed };
}

module.exports = {
    updateUserVector,
    updateAllPendingUsers,
    computeEngagement,  // exported for testing
    constants: { ALPHA, BETA, W_VIEW, W_LIKE, W_COMMENT, W_OTHER, VIEW_FULL_DWELL },
};