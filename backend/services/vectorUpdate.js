const Interaction = require('../models/Interaction');
const User = require('../models/User');
const VectorHistory = require('../models/VectorHistory');

// ── Tuning constants ────────────────────────────────────────────────────────
const ALPHA = 0.85;
const BETA = 0.15;

const W_VIEW = 0.10;
const W_LIKE = 0.25;
const W_COMMENT = 0.45;
const W_OTHER = 0.20;

const VIEW_FULL_DWELL = 3.0;

// ── Engagement score for a single (user, memory) bucket ─────────────────────
function computeEngagement(interactions) {
    let fView = 0, fLike = 0, fComment = 0, fOther = 0;

    for (const it of interactions) {
        switch (it.type) {
            case 'view': {
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

    return Math.min(Math.max(E, 0), 1);
}

// ── Main update function ────────────────────────────────────────────────────
/**
 * Pulls all unapplied interactions for a user, applies the formula,
 * writes the new personality vector back to User, marks rows applied, and
 * persists a VectorHistory snapshot.
 *
 * @param {string} userId
 * @param {string} source - 'logout' | 'cron'
 */
async function updateUserVector(userId, source = 'logout') {
    const user = await User.findById(userId).select('personality').lean();
    if (!user) return { updated: false, reason: 'user_not_found' };

    const p = user.personality || {};
    const hasVector = ['O', 'C', 'E', 'A', 'N'].every(k => typeof p[k] === 'number');
    if (!hasVector) {
        return { updated: false, reason: 'no_base_vector' };
    }

    const interactions = await Interaction.find({
        user: userId,
        applied: false,
    })
        .populate({ path: 'memory', select: 'user' })
        .lean();

    const externalInteractions = interactions.filter(it => {
        const memOwner = it.memory?.user?.toString();
        return memOwner && memOwner !== userId.toString();
    });

    if (externalInteractions.length === 0) {
        const idsToMark = interactions.map(it => it._id);
        if (idsToMark.length > 0) {
            await Interaction.updateMany({ _id: { $in: idsToMark } }, { applied: true });
        }
        return { updated: false, reason: 'no_engagement' };
    }

    // Group by memory ID
    const buckets = {};
    for (const it of externalInteractions) {
        const memId = it.memory._id.toString();
        if (!buckets[memId]) buckets[memId] = { interactions: [], vector: null };
        buckets[memId].interactions.push(it);
        if (!buckets[memId].vector && it.memoryVector) {
            const mv = it.memoryVector;
            const valid = ['O', 'C', 'E', 'A', 'N'].every(k => typeof mv[k] === 'number');
            if (valid) buckets[memId].vector = mv;
        }
    }

    // Weighted sum
    const traits = ['O', 'C', 'E', 'A', 'N'];
    const weightedSum = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    let totalE = 0;

    for (const memId in buckets) {
        const bucket = buckets[memId];
        if (!bucket.vector) continue;

        const E_i = computeEngagement(bucket.interactions);
        if (E_i <= 0) continue;

        for (const k of traits) {
            weightedSum[k] += E_i * bucket.vector[k];
        }
        totalE += E_i;
    }

    if (totalE === 0) {
        const idsToMark = externalInteractions.map(it => it._id);
        await Interaction.updateMany({ _id: { $in: idsToMark } }, { applied: true });
        return { updated: false, reason: 'zero_engagement' };
    }

    // Apply formula
    const oldVector = { O: p.O, C: p.C, E: p.E, A: p.A, N: p.N };
    const newVector = {};
    for (const k of traits) {
        const contentInfluence = weightedSum[k] / totalE;
        const updated = ALPHA * oldVector[k] + BETA * contentInfluence;
        newVector[k] = Math.min(Math.max(updated, 0), 1);
    }

    // Persist new vector
    await User.findByIdAndUpdate(userId, { personality: newVector });

    // Mark all interactions applied (including self-interactions)
    const allIds = interactions.map(it => it._id);
    await Interaction.updateMany({ _id: { $in: allIds } }, { applied: true });

    // ── NEW: snapshot the new vector to history ───────────────────────────
    try {
        await VectorHistory.create({
            user: userId,
            vector: newVector,
            source,
            interactionCount: externalInteractions.length,
            memoryCount: Object.keys(buckets).length,
        });
    } catch (err) {
        // Don't fail the update if history write fails — log it
        console.error('[vectorUpdate] history snapshot failed:', err.message);
    }

    return {
        updated: true,
        oldVector,
        newVector,
        interactionCount: externalInteractions.length,
        memoryCount: Object.keys(buckets).length,
    };
}

// ── Bulk update (for daily cron) ────────────────────────────────────────────
async function updateAllPendingUsers() {
    const userIds = await Interaction.distinct('user', { applied: false });
    console.log(`[vectorUpdate] daily run — ${userIds.length} users with pending interactions`);

    let updated = 0, skipped = 0, failed = 0;
    for (const uid of userIds) {
        try {
            const res = await updateUserVector(uid, 'cron');
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
    computeEngagement,
    constants: { ALPHA, BETA, W_VIEW, W_LIKE, W_COMMENT, W_OTHER, VIEW_FULL_DWELL },
};