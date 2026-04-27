import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, ExternalLink, Wallet } from "lucide-react";
import { useNFTMint } from "../../hooks/useNFTMint";
import { useWallet } from "../../context/WalletContext";
import { useAuth } from "../../context/AuthContext";
import { showSuccess, showError } from "../../utils/toast";

/**
 * MintNFTButton
 * Drop into any memory card the user owns. Shows:
 *   - "Mint as NFT" button for unminted memories
 *   - "Minted #123" badge for already-minted memories
 *   - Disabled state with tooltip when wallet isn't connected
 *
 * Props:
 *   - memory      : the Memory document (must include _id, user, nftTokenId)
 *   - onMinted    : callback(updatedFields) — called with { nftTokenId, nftTxHash, nftMintedAt }
 *                   so the parent can update its local memory list without re-fetching
 *   - size        : "sm" (compact, default) | "md"
 */
const MintNFTButton = ({ memory, onMinted, size = "sm" }) => {
    const { account, isCorrectNetwork, connectWallet, switchToMumbai } = useWallet();
    const { user } = useAuth();
    const { mintMemory, minting, error, reset } = useNFTMint();
    const [showConfirm, setShowConfirm] = useState(false);
    const [justMinted, setJustMinted] = useState(null); // { tokenId, txHash }

    const isMinted = !!memory.nftTokenId || !!justMinted;
    const tokenId = justMinted?.tokenId ?? memory.nftTokenId;

    // ── Already minted — show badge ─────────────────────────────────────────
    if (isMinted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`inline-flex items-center gap-1.5 rounded-lg font-semibold ${size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
                    }`}
                style={{
                    background: "rgba(74,222,128,0.1)",
                    border: "1px solid rgba(74,222,128,0.3)",
                    color: "#86efac",
                }}
                title={`Token ID #${tokenId}`}
            >
                <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                    <Sparkles className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
                </motion.div>
                <span>NFT #{tokenId}</span>
            </motion.div>
        );
    }

    // ── Mint click handler ──────────────────────────────────────────────────
    const handleMint = async () => {
        reset();
        if (!account) {
            await connectWallet();
            return;
        }
        if (!isCorrectNetwork) {
            await switchToMumbai();
            return;
        }
        setShowConfirm(true);
    };

    const handleConfirmMint = async () => {
        const result = await mintMemory(memory, user);
        if (result?.tokenId) {
            setJustMinted(result);
            setShowConfirm(false);
            showSuccess(`Minted as NFT #${result.tokenId}! 🎉`);
            if (onMinted) {
                onMinted({
                    nftTokenId: result.tokenId,
                    nftTxHash: result.txHash,
                    nftMintedAt: new Date().toISOString(),
                });
            }
        } else if (error) {
            showError(error);
        }
    };

    // ── Wallet not connected — show prompt ──────────────────────────────────
    if (!account) {
        return (
            <motion.button
                onClick={handleMint}
                className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition-all ${size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
                    }`}
                style={{
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.25)",
                    color: "#a5b4fc",
                }}
                whileHover={{ scale: 1.04, borderColor: "rgba(99,102,241,0.5)" }}
                whileTap={{ scale: 0.96 }}
                title="Connect wallet to mint"
            >
                <Wallet className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
                <span>Connect to Mint</span>
            </motion.button>
        );
    }

    // ── Wrong network ───────────────────────────────────────────────────────
    if (!isCorrectNetwork) {
        return (
            <motion.button
                onClick={() => switchToMumbai()}
                className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition-all ${size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
                    }`}
                style={{
                    background: "rgba(245,158,11,0.1)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    color: "#fcd34d",
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                title="Switch network to mint"
            >
                <AlertCircle className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
                <span>Wrong Network</span>
            </motion.button>
        );
    }

    // ── Mint button ─────────────────────────────────────────────────────────
    return (
        <>
            <motion.button
                onClick={handleMint}
                disabled={minting}
                className={`inline-flex items-center gap-1.5 rounded-lg font-semibold text-white transition-all relative overflow-hidden disabled:opacity-60 ${size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
                    }`}
                style={{
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    boxShadow: "0 2px 12px rgba(124,58,237,0.3)",
                }}
                whileHover={!minting ? { scale: 1.05, boxShadow: "0 4px 20px rgba(124,58,237,0.5)" } : {}}
                whileTap={!minting ? { scale: 0.95 } : {}}
            >
                {!minting && (
                    <motion.div
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)" }}
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
                    />
                )}
                <span className="relative flex items-center gap-1.5">
                    {minting ? (
                        <>
                            <Loader2 className={size === "sm" ? "w-3 h-3 animate-spin" : "w-3.5 h-3.5 animate-spin"} />
                            <span>Minting…</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
                            <span>Mint as NFT</span>
                        </>
                    )}
                </span>
            </motion.button>

            {/* Confirm modal */}
            <AnimatePresence>
                {showConfirm && (
                    <MintConfirmModal
                        memory={memory}
                        minting={minting}
                        error={error}
                        onConfirm={handleConfirmMint}
                        onClose={() => { setShowConfirm(false); reset(); }}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

// ─── Confirm modal ────────────────────────────────────────────────────────────
// Rendered via React Portal directly into document.body so that no ancestor's
// transform / overflow-hidden / backdrop-filter can trap the fixed positioning.
// Without the portal, parent cards with `overflow: hidden` + `transform: scale`
// create a containing block that pins `position: fixed` to the card itself,
// which is what was making the modal render squashed inside the memory card.
const MintConfirmModal = ({ memory, minting, error, onConfirm, onClose }) => {
    const modalContent = (
        <motion.div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{
                background: "rgba(0,0,0,0.85)",
                backdropFilter: "blur(8px)",
                zIndex: 9999,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!minting ? onClose : undefined}
        >
            <motion.div
                className="w-full max-w-sm rounded-2xl p-6 relative overflow-hidden"
                style={{
                    background: "linear-gradient(135deg, rgba(22,22,40,0.95), rgba(13,13,26,0.95))",
                    border: "1px solid rgba(167,139,250,0.25)",
                    boxShadow: "0 0 60px rgba(124,58,237,0.3)",
                }}
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                onClick={e => e.stopPropagation()}
            >
                <motion.div
                    className="absolute inset-0 opacity-50 pointer-events-none"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.08), transparent)" }}
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                />

                <div className="flex items-center gap-2 mb-4 relative">
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    >
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                    </motion.div>
                    <h2 className="text-white font-bold text-lg">Mint as NFT</h2>
                </div>

                <p className="text-slate-400 text-sm mb-4 relative">
                    This will permanently mint your memory as an NFT on the blockchain.
                    Only you'll own it until you decide to list it for sale.
                </p>

                {/* Memory preview */}
                <div className="rounded-xl p-3 mb-5 relative"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                    {memory.image && (
                        <img src={memory.image} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
                    )}
                    <p className="text-slate-300 text-sm line-clamp-2">{memory.caption}</p>
                </div>

                {error && (
                    <motion.div
                        className="flex items-start gap-2 p-3 rounded-xl text-red-300 text-sm mb-4"
                        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </motion.div>
                )}

                <div className="flex gap-2 relative">
                    <motion.button
                        onClick={onClose}
                        disabled={minting}
                        className="flex-1 py-2.5 rounded-xl text-slate-300 text-sm font-medium transition-all disabled:opacity-50"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                        whileHover={!minting ? { scale: 1.02 } : {}}
                        whileTap={!minting ? { scale: 0.98 } : {}}
                    >
                        Cancel
                    </motion.button>
                    <motion.button
                        onClick={onConfirm}
                        disabled={minting}
                        className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold relative overflow-hidden disabled:opacity-60"
                        style={{
                            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                            boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
                        }}
                        whileHover={!minting ? { scale: 1.02, boxShadow: "0 4px 24px rgba(124,58,237,0.5)" } : {}}
                        whileTap={!minting ? { scale: 0.98 } : {}}
                    >
                        <span className="relative flex items-center justify-center gap-2">
                            {minting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Confirm in MetaMask…
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Mint NFT
                                </>
                            )}
                        </span>
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );

    // Mount the modal at document.body so it escapes any parent that creates
    // a containing block (transform, overflow-hidden, backdrop-filter, etc).
    return createPortal(modalContent, document.body);
};

export default MintNFTButton;