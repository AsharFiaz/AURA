const express = require("express");
const Memory = require("../models/Memory");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/memories/:id/nft
 * Called from frontend after successful on-chain mint.
 * Saves tokenId + txHash to the Memory document in MongoDB.
 */
router.post("/:id/nft", auth, async (req, res) => {
    try {
        const { tokenId, txHash } = req.body;

        if (!tokenId) {
            return res.status(400).json({ success: false, message: "tokenId is required" });
        }

        const memory = await Memory.findById(req.params.id);
        if (!memory) {
            return res.status(404).json({ success: false, message: "Memory not found" });
        }

        // Only the owner can save NFT data
        if (memory.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        memory.nftTokenId = tokenId;
        memory.nftTxHash = txHash || null;
        memory.nftMintedAt = new Date();
        await memory.save();

        res.json({ success: true, memory });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;