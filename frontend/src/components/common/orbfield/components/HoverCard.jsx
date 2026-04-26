import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Zap } from "lucide-react";

const HoverCard = ({ memory, position, formatTime, visible }) => {
    if (!visible || !memory) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="absolute pointer-events-none z-30"
                style={{
                    left: Math.min(position.x + 20, window.innerWidth - 320),
                    top: Math.max(position.y - 8, 8),
                    maxWidth: "300px",
                }}
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.15 }}
            >
                <div
                    className="px-4 py-3 rounded-2xl"
                    style={{
                        background: "rgba(8,8,20,0.92)",
                        backdropFilter: "blur(24px)",
                        border: "1px solid rgba(165,180,252,0.3)",
                        boxShadow: "0 16px 40px rgba(0,0,0,0.6), 0 0 32px rgba(99,102,241,0.2)",
                    }}
                >
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {memory.user?.profilePicture ? (
                                <img src={memory.user.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                                memory.user?.username?.charAt(0).toUpperCase() || "U"
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">
                                {memory.user?.username || "Unknown"}
                            </p>
                            <p className="text-slate-500 text-[10px]">
                                {formatTime ? formatTime(memory.createdAt) : ""}
                            </p>
                        </div>
                    </div>
                    <p className="text-slate-300 text-[12px] leading-snug line-clamp-2 mb-2">
                        {memory.caption}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {memory.likesCount || 0}
                        </span>
                        {memory.comments?.length > 0 && (
                            <span className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                {memory.comments.length}
                            </span>
                        )}
                        <span className="ml-auto text-pink-400 font-semibold flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" /> click to ignite
                        </span>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default HoverCard;