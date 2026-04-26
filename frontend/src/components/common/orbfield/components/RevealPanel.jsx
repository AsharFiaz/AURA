import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, X } from "lucide-react";
import { getDominantTrait, hexToCss } from "../utils/ocean";

const RevealPanel = ({ memory, visible, isLiked, formatTime, onLike, onComment, onClose }) => {
    if (!memory || !visible) return null;
    const trait = getDominantTrait(memory.oceanVector);

    return (
        <AnimatePresence>
            <motion.div
                className="absolute bottom-0 left-0 right-0 z-40 pointer-events-none flex justify-center px-6 pb-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                <div
                    className="pointer-events-auto max-w-xl w-full px-6 py-4 rounded-2xl"
                    style={{
                        background: "rgba(8,8,20,0.85)",
                        backdropFilter: "blur(28px)",
                        border: "1px solid rgba(165,180,252,0.25)",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 80px rgba(99,102,241,0.2)",
                    }}
                >
                    {/* User row */}
                    <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                            {memory.user?.profilePicture ? (
                                <img src={memory.user.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                                memory.user?.username?.charAt(0).toUpperCase() || "U"
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">
                                {memory.user?.username || "Unknown"}
                            </p>
                            <p className="text-slate-500 text-[11px]">
                                {formatTime ? formatTime(memory.createdAt) : ""}
                            </p>
                        </div>
                        <div
                            className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider"
                            style={{
                                background: `${hexToCss(trait.hex)}22`,
                                border: `1px solid ${hexToCss(trait.hex)}66`,
                                color: hexToCss(trait.hex),
                            }}
                        >
                            {trait.label}
                        </div>
                    </div>

                    {/* Caption */}
                    <p className="text-slate-200 text-sm leading-relaxed mb-3">
                        {memory.caption}
                    </p>

                    {/* Emotions */}
                    {memory.emotions?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {memory.emotions.map((e, i) => (
                                <span
                                    key={i}
                                    className="px-2.5 py-1 rounded-full text-[10px] border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-medium"
                                >
                                    {e}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div
                        className="flex items-center gap-1 pt-3"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                    >
                        <button
                            onClick={onLike}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:bg-white/5 hover:scale-105"
                        >
                            <Heart className={`w-4 h-4 transition-colors ${isLiked ? "fill-red-400 text-red-400" : "text-slate-400"}`} />
                            <span className="text-xs text-slate-300 font-medium">{memory.likesCount || 0}</span>
                        </button>
                        <button
                            onClick={onComment}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:bg-white/5 hover:scale-105"
                        >
                            <MessageCircle className="w-4 h-4 text-slate-400" />
                            <span className="text-xs text-slate-300 font-medium">{memory.comments?.length || 0}</span>
                        </button>
                        <div className="ml-auto">
                            <button
                                onClick={onClose}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:bg-white/5 text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                                <span className="text-xs font-medium">Close</span>
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RevealPanel;