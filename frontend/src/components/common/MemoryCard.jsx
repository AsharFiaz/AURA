import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LikeButton from "./LikeButton";

const MemoryCard = memo(
  ({ memory, index, onLike, onCommentClick, formatTime, getEmotionColor, isLiked }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

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

    console.log("Memory video:", memory._id, memory.video);
    return (
      <motion.div
        className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        {/* User Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
            {memory.user?.profilePicture ? (
              <img src={memory.user.profilePicture} alt={memory.user?.username || "User"} className="w-full h-full object-cover" />
            ) : (
              memory.user?.username?.charAt(0).toUpperCase() || "U"
            )}
          </div>
          <div className="flex-1">
            <motion.p onClick={handleUserClick} className="text-white font-medium cursor-pointer hover:text-purple-400 transition-colors" whileHover={{ scale: 1.02 }}>
              {memory.user?.username || "Unknown"}
            </motion.p>
            <p className="text-slate-400 text-xs">{formatTime(memory.createdAt)}</p>
          </div>
        </div>

        {/* Caption */}
        <p className="text-slate-200 mb-3">{memory.caption}</p>

        {/* Emotion Tags */}
        {memory.emotions && memory.emotions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {memory.emotions.map((emotion, idx) => (
              <span key={idx} className={`px-2 py-1 rounded-full text-xs border ${getEmotionColor(emotion)}`}>
                {emotion}
              </span>
            ))}
          </div>
        )}

        {/* Image */}
        {memory.image && (
          <div className="mb-3 rounded-lg overflow-hidden">
            <img src={memory.image} alt="Memory" className="w-full max-h-[400px] object-cover" />
          </div>
        )}

        {/* Video */}
        {memory.video && (
          <div className="mb-3 rounded-lg overflow-hidden">
            <video
              src={memory.video}
              controls
              className="w-full max-h-[400px] rounded-lg"
              preload="metadata"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 pt-3 border-t border-white/10">
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
    return true;
  }
);

MemoryCard.displayName = "MemoryCard";
export default MemoryCard;