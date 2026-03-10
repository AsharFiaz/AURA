import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LikeButton from "./LikeButton";
import OceanPatternCanvas from "./OceanPatternCanvas";

// ─── Derive a card theme from the OCEAN vector ────────────────────────────────
// Finds the dominant trait and maps it to a subtle accent color.
// Falls back to the default indigo if no vector is present.
const OCEAN_THEMES = {
  O: {
    // Openness — violet/purple (curiosity, creativity)
    border: "rgba(139,92,246,0.35)",
    glow: "rgba(139,92,246,0.08)",
    accent: "#8b5cf6",
    badge: "bg-violet-500/10 text-violet-300 border-violet-500/25",
  },
  C: {
    // Conscientiousness — blue (structure, planning)
    border: "rgba(59,130,246,0.35)",
    glow: "rgba(59,130,246,0.08)",
    accent: "#3b82f6",
    badge: "bg-blue-500/10 text-blue-300 border-blue-500/25",
  },
  E: {
    // Extraversion — amber/orange (energy, social)
    border: "rgba(245,158,11,0.35)",
    glow: "rgba(245,158,11,0.08)",
    accent: "#f59e0b",
    badge: "bg-yellow-500/10 text-yellow-300 border-yellow-500/25",
  },
  A: {
    // Agreeableness — green (empathy, warmth)
    border: "rgba(16,185,129,0.35)",
    glow: "rgba(16,185,129,0.08)",
    accent: "#10b981",
    badge: "bg-green-500/10 text-green-300 border-green-500/25",
  },
  N: {
    // Neuroticism — red/pink (emotional intensity)
    border: "rgba(239,68,68,0.35)",
    glow: "rgba(239,68,68,0.08)",
    accent: "#ef4444",
    badge: "bg-red-500/10 text-red-300 border-red-500/25",
  },
  default: {
    border: "rgba(255,255,255,0.08)",
    glow: "transparent",
    accent: "#6366f1",
    badge: "bg-indigo-500/10 text-indigo-300 border-indigo-500/25",
  },
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

// ─── MemoryCard ───────────────────────────────────────────────────────────────
const MemoryCard = memo(
  ({ memory, index, onLike, onCommentClick, formatTime, getEmotionColor: getEmotionColorProp, isLiked }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Use passed-in helper or fall back to local one
    const emotionColor = getEmotionColorProp || getEmotionColor;

    // Derive theme from this memory's OCEAN vector
    const theme = getOceanTheme(memory.oceanVector);
    const hasMedia = memory.image || memory.video;

    const handleCommentClick = useCallback(() => {
      onCommentClick(memory);
    }, [onCommentClick, memory]);

    const handleUserClick = useCallback((e) => {
      e.stopPropagation();
      const memoryUserId = memory.user?._id || memory.user?.id;
      if (memoryUserId && memoryUserId !== user?.id) {
        navigate(`/user/${memoryUserId}`);
      } else if (memoryUserId === user?.id) {
        navigate("/profile");
      }
    }, [memory, user, navigate]);

    return (
      <motion.div
        className="backdrop-blur-lg rounded-2xl border p-4 transition-all"
        style={{
          background: hasMedia
            ? `linear-gradient(135deg, #0f172a 0%, ${theme.glow} 100%)`
            : `linear-gradient(135deg, #0f172a 0%, ${theme.accent}18 60%, ${theme.accent}08 100%)`,
          borderColor: theme.border,
          boxShadow: memory.oceanVector
            ? `0 0 0 1px ${theme.border}, 0 4px 24px ${theme.glow}`
            : "none",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ borderColor: theme.accent + "66", scale: 1.005 }}
      >
        {/* User Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-semibold flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${theme.accent}99, ${theme.accent}55)` }}>
            {memory.user?.profilePicture ? (
              <img src={memory.user.profilePicture} alt={memory.user?.username || "User"} className="w-full h-full object-cover" />
            ) : (
              memory.user?.username?.charAt(0).toUpperCase() || "U"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <motion.p
              onClick={handleUserClick}
              className="text-white font-medium cursor-pointer hover:text-slate-300 transition-colors truncate"
              whileHover={{ scale: 1.02 }}>
              {memory.user?.username || "Unknown"}
            </motion.p>
            <p className="text-slate-400 text-xs">{formatTime(memory.createdAt)}</p>
          </div>

          {/* Dominant trait badge — shown only when vector exists */}
          {memory.oceanVector && (() => {
            const entries = Object.entries(memory.oceanVector).filter(([, v]) => v !== null && v !== undefined);
            if (!entries.length) return null;
            const [key] = entries.sort((a, b) => b[1] - a[1])[0];
            const labels = { O: "Openness", C: "Conscientiousness", E: "Extraversion", A: "Agreeableness", N: "Neuroticism" };
            return (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${theme.badge}`}>
                {key} · {Math.round(memory.oceanVector[key] * 100)}%
              </span>
            );
          })()}
        </div>

        {/* Caption */}
        <p className="text-slate-200 mb-3">{memory.caption}</p>

        {/* Emotion Tags */}
        {memory.emotions && memory.emotions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {memory.emotions.map((emotion, idx) => (
              <span key={idx} className={`px-2 py-1 rounded-full text-xs border ${emotionColor(emotion)}`}>
                {emotion}
              </span>
            ))}
          </div>
        )}

        {/* Image */}
        {memory.image && (
          <div className="mb-3 rounded-xl overflow-hidden">
            <img src={memory.image} alt="Memory" className="w-full max-h-[400px] object-cover" />
          </div>
        )}

        {/* Video */}
        {memory.video && (
          <div className="mb-3 rounded-xl overflow-hidden">
            <video
              src={memory.video}
              controls
              className="w-full max-h-[400px] rounded-xl"
              preload="metadata"
            />
          </div>
        )}

        {/* Procedural pattern — text-only memories with an OCEAN vector */}
        {!memory.image && !memory.video && memory.oceanVector && (
          <OceanPatternCanvas
            oceanVector={memory.oceanVector}
            height={180}
            className="mb-3"
          />
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 pt-3"
          style={{ borderTop: `1px solid ${theme.border}` }}>
          <LikeButton
            likesCount={memory.likesCount || 0}
            isLiked={isLiked(memory)}
            onLike={onLike}
            memoryId={memory._id}
          />
          <button onClick={handleCommentClick} className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{memory.comments?.length || 0}</span>
          </button>
          <button className="flex items-center gap-2 text-slate-400 hover:text-purple-400 transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
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
    if (prev.index !== next.index) return false;
    // Re-render if ocean vector arrives after initial load
    if (JSON.stringify(prev.memory.oceanVector) !== JSON.stringify(next.memory.oceanVector)) return false;
    return true;
  }
);

MemoryCard.displayName = "MemoryCard";
export default MemoryCard;