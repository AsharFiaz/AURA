// ════════════════════════════════════════════════════════════════════════════
// One-time migration: backfill VectorHistory with current vectors as
// each user's "starting point" snapshot.
//
// Run:  node scripts/backfillVectorHistory.js
// ════════════════════════════════════════════════════════════════════════════

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const VectorHistory = require("../models/VectorHistory");

async function backfill() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("[backfill] connected to MongoDB");

    // Find users who already have a personality vector
    const users = await User.find({
        "personality.O": { $ne: null },
        "personality.C": { $ne: null },
        "personality.E": { $ne: null },
        "personality.A": { $ne: null },
        "personality.N": { $ne: null },
    }).select("personality createdAt").lean();

    console.log(`[backfill] found ${users.length} users with vectors`);

    let created = 0, skipped = 0;
    for (const u of users) {
        // Skip users who already have a backfill or onboarding entry
        const exists = await VectorHistory.findOne({
            user: u._id,
            source: { $in: ['backfill', 'onboarding'] },
        }).lean();

        if (exists) { skipped++; continue; }

        await VectorHistory.create({
            user: u._id,
            vector: u.personality,
            source: 'backfill',
            interactionCount: 0,
            memoryCount: 0,
            // Backdate to user creation so the chart starts from day-one
            createdAt: u.createdAt || new Date(),
        });
        created++;
    }

    console.log(`[backfill] done — created:${created} skipped:${skipped}`);
    await mongoose.disconnect();
}

backfill().catch(err => {
    console.error("[backfill] failed:", err);
    process.exit(1);
});