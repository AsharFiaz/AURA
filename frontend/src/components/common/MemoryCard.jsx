import { memo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Share2, Sparkles, CheckCircle2, Loader2, AlertCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWallet } from "../../context/WalletContext";
import { useNFTMint } from "../../hooks/useNFTMint";
import LikeButton from "./LikeButton";
import OceanPatternCanvas from "./OceanPatternCanvas";
import ConnectWallet from "../blockchain/ConnectWallet";

const OCEAN_THEMES = {
  O: { border: "rgba(139,92,246,0.35)", glow: "rgba(139,92,246,0.08)", accent: "#8b5cf6", badge: "bg-violet-500/10 text-violet-300 border-violet-500/25" },
  C: { border: "rgba(59,130,246,0.35)", glow: "rgba(59,130,246,0.08)", accent: "#3b82f6", badge: "bg-blue-500/10 text-blue-300 border-blue-500/25" },
  E: { border: "rgba(245,158,11,0.35)", glow: "rgba(245,158,11,0.08)", accent: "#f59e0b", badge: "bg-yellow-500/10 text-yellow-300 border-yellow-500/25" },
  A: { border: "rgba(16,185,129,0.35)", glow: "rgba(16,185,129,0.08)", accent: "#10b981", badge: "bg-green-500/10 text-green-300 border-green-500/25" },
  N: { border: "rgba(239,68,68,0.35)", glow: "rgba(239,68,68,0.08)", accent: "#ef4444", badge: "bg-red-500/10 text-red-300 border-red-500/25" },
  default: { border: "rgba(255,255,255,0.08)", glow: "transparent", accent: "#6366f1", badge: "bg-indigo-500/10 text-indigo-300 border-indigo-500/25" },
};

const getOceanTheme = (oceanVector) => {
  if (!oceanVector) return OCEAN_THEMES.default;
  const entries = Object.entries(oceanVector).filter(([, v]) => v !== null && v !== undefined);
  if (!entries.length) return OCEAN_THEMES.default;
  const dominant = entries.sort((a, b) => b[1] - a[1])[0][0];
  return OCEAN_THEMES[dominant] || OCEAN_THEMES.default;
};

const getEmotionColor = (emotion) => {
  const map = {
    happy: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
    sad: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    angry: "bg-red-500/10 text-red-300 border-red-500/30",
    excited: "bg-orange-500/10 text-orange-300 border-orange-500/30",
    nostalgic: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    peaceful: "bg-green-500/10 text-green-300 border-green-500/30",
  };
  return map[emotion?.toLowerCase()] || "bg-slate-500/10 text-slate-300 border-slate-500/30";
};

// ─── Mint Modal ───────────────────────────────────────────────────────────────
const MintModal = ({ memory, onClose }) => {
  const { user } = useAuth();
  const { account } = useWallet();
  const { mintMemory, minting, mintedId, txHash, error } = useNFTMint();
  const isOwner = String(memory.user?._id || memory.user?.id) === String(user?.id);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-sm rounded-2xl p-6"
          style={{ background: "#0d0d1a", border: "1px solid rgba(99,102,241,0.25)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-white font-bold text-lg">Mint as NFT</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Memory preview */}
          <div className="rounded-xl p-3 mb-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-slate-300 text-sm line-clamp-2">{memory.caption}</p>
            {memory.image && <img src={memory.image} alt="" className="w-full h-24 object-cover rounded-lg mt-2" />}
          </div>

          {/* Success */}
          {mintedId && (
            <motion.div className="text-center py-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-white font-bold text-lg mb-1">Minted Successfully!</p>
              <p className="text-slate-400 text-sm mb-1">Token ID: <span className="text-indigo-400 font-mono">#{mintedId}</span></p>
              {txHash && <p className="text-slate-600 text-xs font-mono">{txHash.slice(0, 24)}…</p>}
              <motion.button onClick={onClose}
                className="mt-4 px-6 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                Done
              </motion.button>
            </motion.div>
          )}

          {/* No wallet */}
          {!mintedId && !account && (
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-4">Connect your wallet to mint this memory as an NFT.</p>
              <div className="flex justify-center"><ConnectWallet /></div>
            </div>
          )}

          {/* Not owner */}
          {!mintedId && account && !isOwner && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-amber-300 text-sm"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Only the memory owner can mint it as an NFT.</span>
            </div>
          )}

          {/* Ready to mint */}
          {!mintedId && account && isOwner && (
            <>
              <div className="space-y-2 mb-5 text-xs text-slate-500">
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /><span>Permanently recorded on-chain</span></div>
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /><span>NFT ownership goes to your wallet</span></div>
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /><span>Can be listed for sale on marketplace</span></div>
              </div>
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl text-red-300 text-sm mb-4"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{error}</span>
                </div>
              )}
              <motion.button onClick={() => mintMemory(memory, user)} disabled={minting}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 20px rgba(79,70,229,0.35)" }}
                whileHover={!minting ? { scale: 1.02 } : {}} whileTap={!minting ? { scale: 0.98 } : {}}>
                {minting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Minting… confirm in MetaMask</>
                  : <><Sparkles className="w-4 h-4" /> Mint as NFT</>}
              </motion.button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── MemoryCard ───────────────────────────────────────────────────────────────
const MemoryCard = memo(
  ({ memory, index, onLike, onCommentClick, formatTime, getEmotionColor: getEmotionColorProp, isLiked }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [mintModalOpen, setMintModalOpen] = useState(false);

    const emotionColor = getEmotionColorProp || getEmotionColor;
    const theme = getOceanTheme(memory.oceanVector);
    const hasMedia = memory.image || memory.video;
    const isOwner = String(memory.user?._id || memory.user?.id) === String(user?.id);
    const alreadyMinted = !!memory.nftTokenId;

    const handleCommentClick = useCallback(() => onCommentClick(memory), [onCommentClick, memory]);
    const handleUserClick = useCallback((e) => {
      e.stopPropagation();
      const memoryUserId = memory.user?._id || memory.user?.id;
      if (memoryUserId && memoryUserId !== user?.id) navigate(`/user/${memoryUserId}`);
      else if (memoryUserId === user?.id) navigate("/profile");
    }, [memory, user, navigate]);

    return (
      <>
        <motion.div
          className="backdrop-blur-lg rounded-2xl border p-4 transition-all"
          style={{
            background: hasMedia
              ? `linear-gradient(135deg, #0f172a 0%, ${theme.glow} 100%)`
              : `linear-gradient(135deg, #0f172a 0%, ${theme.accent}18 60%, ${theme.accent}08 100%)`,
            borderColor: theme.border,
            boxShadow: memory.oceanVector ? `0 0 0 1px ${theme.border}, 0 4px 24px ${theme.glow}` : "none",
          }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ borderColor: theme.accent + "66", scale: 1.005 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-semibold flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${theme.accent}99, ${theme.accent}55)` }}>
              {memory.user?.profilePicture
                ? <img src={memory.user.profilePicture} alt={memory.user?.username || "User"} className="w-full h-full object-cover" />
                : memory.user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <motion.p onClick={handleUserClick} className="text-white font-medium cursor-pointer hover:text-slate-300 transition-colors truncate" whileHover={{ scale: 1.02 }}>
                {memory.user?.username || "Unknown"}
              </motion.p>
              <p className="text-slate-400 text-xs">{formatTime(memory.createdAt)}</p>
            </div>
            {alreadyMinted && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 bg-indigo-500/10 text-indigo-300 border-indigo-500/25 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> NFT
              </span>
            )}
            {memory.oceanVector && (() => {
              const entries = Object.entries(memory.oceanVector).filter(([, v]) => v !== null && v !== undefined);
              if (!entries.length) return null;
              const [key] = entries.sort((a, b) => b[1] - a[1])[0];
              return (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${theme.badge}`}>
                  {key} · {Math.round(memory.oceanVector[key] * 100)}%
                </span>
              );
            })()}
          </div>

          <p className="text-slate-200 mb-3">{memory.caption}</p>

          {memory.emotions?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {memory.emotions.map((emotion, idx) => (
                <span key={idx} className={`px-2 py-1 rounded-full text-xs border ${emotionColor(emotion)}`}>{emotion}</span>
              ))}
            </div>
          )}

          {memory.image && <div className="mb-3 rounded-xl overflow-hidden"><img src={memory.image} alt="Memory" className="w-full max-h-[400px] object-cover" /></div>}
          {memory.video && <div className="mb-3 rounded-xl overflow-hidden"><video src={memory.video} controls className="w-full max-h-[400px] rounded-xl" preload="metadata" /></div>}
          {!memory.image && !memory.video && memory.oceanVector && <OceanPatternCanvas oceanVector={memory.oceanVector} height={180} className="mb-3" />}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-3" style={{ borderTop: `1px solid ${theme.border}` }}>
            <LikeButton likesCount={memory.likesCount || 0} isLiked={isLiked(memory)} onLike={onLike} memoryId={memory._id} />
            <button onClick={handleCommentClick} className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors">
              <MessageCircle className="w-5 h-5" /><span className="text-sm">{memory.comments?.length || 0}</span>
            </button>
            <button className="flex items-center gap-2 text-slate-400 hover:text-purple-400 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>

            {/* Mint NFT button — owner only, hidden if already minted */}
            {isOwner && !alreadyMinted && (
              <motion.button onClick={() => setMintModalOpen(true)}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 2px 12px rgba(79,70,229,0.3)" }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Sparkles className="w-3.5 h-3.5" /> Mint NFT
              </motion.button>
            )}
            {isOwner && alreadyMinted && (
              <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-400"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Minted
              </div>
            )}
          </div>
        </motion.div>

        {mintModalOpen && <MintModal memory={memory} onClose={() => setMintModalOpen(false)} />}
      </>
    );
  },
  (prev, next) => {
    if (prev.memory._id !== next.memory._id) return false;
    if (prev.memory.caption !== next.memory.caption) return false;
    if (prev.memory.image !== next.memory.image) return false;
    if (prev.memory.video !== next.memory.video) return false;
    if (prev.memory.createdAt !== next.memory.createdAt) return false;
    if (prev.memory.user?._id !== next.memory.user?._id) return false;
    if (prev.memory.user?.username !== next.memory.user?.username) return false;
    if ((prev.memory.comments?.length || 0) !== (next.memory.comments?.length || 0)) return false;
    if (prev.memory.nftTokenId !== next.memory.nftTokenId) return false;
    if (prev.index !== next.index) return false;
    if (JSON.stringify(prev.memory.oceanVector) !== JSON.stringify(next.memory.oceanVector)) return false;
    return true;
  }
);

MemoryCard.displayName = "MemoryCard";
export default MemoryCard;