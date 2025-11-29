import { memo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const LikeButton = memo(({ likesCount, isLiked, onLike, memoryId }) => {
  // Local state for instant UI updates
  const [localLikesCount, setLocalLikesCount] = useState(likesCount || 0);
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);

  // Sync with props when they change (from server response)
  useEffect(() => {
    setLocalLikesCount(likesCount || 0);
    setLocalIsLiked(isLiked);
  }, [likesCount, isLiked]);

  const handleClick = () => {
    // Optimistic local update
    const newLiked = !localIsLiked;
    setLocalIsLiked(newLiked);
    setLocalLikesCount((prev) => (newLiked ? prev + 1 : Math.max(prev - 1, 0)));

    // Call parent handler (which does API call)
    onLike(memoryId);
  };

  return (
    <motion.button
      onClick={handleClick}
      className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Heart
        className={`w-5 h-5 ${
          localIsLiked ? "fill-red-400 text-red-400" : ""
        }`}
      />
      <span className="text-sm">{localLikesCount}</span>
    </motion.button>
  );
}, (prevProps, nextProps) => {
  // Only re-render if memoryId changes (different memory)
  return prevProps.memoryId === nextProps.memoryId;
});

LikeButton.displayName = "LikeButton";

export default LikeButton;

