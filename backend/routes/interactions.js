const express = require('express');
const Interaction = require('../models/Interaction');
const Memory = require('../models/Memory');
const auth = require('../middleware/auth');
const { updateUserVector } = require('../services/vectorUpdate');

const router = express.Router();

const VALID_TYPES = ['view', 'like', 'comment', 'bookmark', 'profile_visit', 'expand'];

/**
 * POST /api/interactions/batch
 * Body: { events: [{ memoryId, type, dwellSeconds? }, ...] }
 *
 * Frontend buffers interactions and flushes them in batches.
 * Self-interactions are filtered server-side (defense in depth).
 */
router.post('/batch', auth, async (req, res) => {
    try {
        const { events } = req.body;
        if (!Array.isArray(events) || events.length === 0) {
            return res.json({ success: true, recorded: 0 });
        }

        // Cap batch size to prevent abuse
        const safeEvents = events.slice(0, 200);

        // Validate types & collect memory IDs
        const memoryIds = new Set();
        const validEvents = [];
        for (const ev of safeEvents) {
            if (!ev?.memoryId || !VALID_TYPES.includes(ev.type)) continue;
            memoryIds.add(ev.memoryId);
            validEvents.push(ev);
        }
        if (validEvents.length === 0) return res.json({ success: true, recorded: 0 });

        // Bulk-fetch memories so we can: (a) skip self-interactions, (b) snapshot OCEAN vector
        const memories = await Memory.find({ _id: { $in: Array.from(memoryIds) } })
            .select('user oceanVector')
            .lean();

        const memoryMap = new Map(memories.map(m => [m._id.toString(), m]));
        const userIdStr = req.user.id.toString();

        const docs = [];
        for (const ev of validEvents) {
            const mem = memoryMap.get(ev.memoryId);
            if (!mem) continue;                                   // memory deleted
            if (mem.user.toString() === userIdStr) continue;      // self-interaction

            docs.push({
                user: req.user.id,
                memory: ev.memoryId,
                type: ev.type,
                dwellSeconds: ev.type === 'view' ? Math.min(Math.max(ev.dwellSeconds || 0, 0), 60) : 0,
                memoryVector: mem.oceanVector || {},
                applied: false,
            });
        }

        if (docs.length === 0) return res.json({ success: true, recorded: 0 });

        await Interaction.insertMany(docs, { ordered: false });
        res.json({ success: true, recorded: docs.length });
    } catch (err) {
        console.error('[interactions/batch] error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/interactions/flush
 * Triggers an immediate vector update for the current user.
 * Called by the frontend on logout.
 *
 * Returns quickly — the actual recompute is short for one user.
 */
router.post('/flush', auth, async (req, res) => {
    try {
        const result = await updateUserVector(req.user.id);
        res.json({ success: true, result });
    } catch (err) {
        console.error('[interactions/flush] error:', err.message);
        // Don't fail the logout flow even if this errors
        res.json({ success: false, message: err.message });
    }
});

module.exports = router;