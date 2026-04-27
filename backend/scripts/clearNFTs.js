// ════════════════════════════════════════════════════════════════════════════
// Clear stale NFT fields from MongoDB after a Hardhat node restart.
//
// Hardhat's local chain is ephemeral — restarting wipes all token state.
// MongoDB persists, so old nftTokenId values become orphans pointing at
// tokens that no longer exist on the new chain. This script clears them.
//
// Run after every Hardhat restart, BEFORE minting new NFTs:
//   cd backend
//   node scripts/clearNFTs.js
// ════════════════════════════════════════════════════════════════════════════

require("dotenv").config();
const mongoose = require("mongoose");
const Memory = require("../models/Memory");

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("[clearNFTs] Connected to MongoDB");

        // Show what we're about to clear
        const beforeCount = await Memory.countDocuments({ nftTokenId: { $ne: null } });
        if (beforeCount === 0) {
            console.log("[clearNFTs] No NFT data found — nothing to clear ✓");
            await mongoose.disconnect();
            return;
        }

        console.log(`[clearNFTs] Found ${beforeCount} memories with stale NFT data:`);
        const stale = await Memory.find({ nftTokenId: { $ne: null } })
            .select("caption nftTokenId")
            .limit(20)
            .lean();
        stale.forEach(m => {
            const caption = (m.caption || "").slice(0, 40);
            console.log(`  • Token #${m.nftTokenId} — "${caption}${m.caption?.length > 40 ? "…" : ""}"`);
        });
        if (beforeCount > 20) console.log(`  • ...and ${beforeCount - 20} more`);

        // Clear all NFT fields
        const result = await Memory.updateMany(
            { nftTokenId: { $ne: null } },
            { $set: { nftTokenId: null, nftTxHash: null, nftMintedAt: null } }
        );

        console.log(`\n[clearNFTs] ✓ Cleared NFT fields from ${result.modifiedCount} memories`);
        console.log("[clearNFTs] You can now mint fresh — the chain and DB are in sync.\n");

        await mongoose.disconnect();
    } catch (err) {
        console.error("[clearNFTs] Failed:", err.message);
        process.exit(1);
    }
})();