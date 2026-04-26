import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, X } from "lucide-react";
import { getDominantTrait, hexToCss } from "../utils/ocean";

// ─── ExplodedContent ─────────────────────────────────────────────────────────
// HTML overlay that appears at the SCREEN position of the exploded orb.
// Grows in with a "from-zero" scale animation timed with the explosion fire,
// then sits centered for the user to read. Click outside / X / Close to exit.
//
// Props:
//   memory      — the memory being shown (or null)
//   visible     — boolean: is the explosion mid-bloom?
//   isLiked     — boolean
//   formatTime  — fn
//   onLike, onComment, onClose — callbacks
const ExplodedContent = ({
    memory,
    visible,
    isLiked,
    formatTime,
    onLike,
    onComment,
    onClose,
}) => {
    if (!memory) return null;
    const trait = getDominantTrait(memory.oceanVector);
    const traitColor = hexToCss(trait.hex);

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Backdrop — click to close */}
                    <motion.div
                        className="absolute inset-0 z-30 cursor-pointer"
                        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={onClose}
                    />

                    {/* Content card — grows from center of screen */}
                    <motion.div
                        className="absolute inset-0 z-40 flex items-center justify-center px-6 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="pointer-events-auto rounded-3xl overflow-hidden max-w-2xl w-full"
                            style={{
                                background: "rgba(13,13,26,0.92)",
                                backdropFilter: "blur(28px)",
                                border: `1.5px solid ${traitColor}66`,
                                boxShadow: `
                                    0 24px 80px rgba(0,0,0,0.7),
                                    0 0 100px ${traitColor}33,
                                    inset 0 1px 0 rgba(255,255,255,0.05)
                                `,
                            }}
                            initial={{ scale: 0, opacity: 0, rotate: -20 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
                            transition={{
                                type: "spring",
                                stiffness: 220,
                                damping: 22,
                                mass: 0.8,
                            }}
                        >
                            {/* Image / Video — if present */}
                            {memory.image && (
                                <div
                                    className="w-full overflow-hidden relative"
                                    style={{ maxHeight: "55vh" }}
                                >
                                    <img
                                        src={memory.image}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        style={{ display: "block" }}
                                    />
                                    {/* Gradient overlay from bottom */}
                                    <div
                                        className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
                                        style={{
                                            background: "linear-gradient(to top, rgba(13,13,26,0.95), transparent)",
                                        }}
                                    />
                                </div>
                            )}
                            {memory.video && !memory.image && (
                                <div className="w-full overflow-hidden" style={{ maxHeight: "55vh" }}>
                                    <video
                                        src={memory.video}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            <div className="p-6">
                                {/* User row */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-base font-semibold flex-shrink-0">
                                        {memory.user?.profilePicture ? (
                                            <img
                                                src={memory.user.profilePicture}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            memory.user?.username?.charAt(0).toUpperCase() || "U"
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-base font-semibold truncate">
                                            {memory.user?.username || "Unknown"}
                                        </p>
                                        <p className="text-slate-500 text-xs">
                                            {formatTime ? formatTime(memory.createdAt) : ""}
                                        </p>
                                    </div>
                                    <div
                                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                                        style={{
                                            background: `${traitColor}22`,
                                            border: `1px solid ${traitColor}66`,
                                            color: traitColor,
                                        }}
                                    >
                                        {trait.label}
                                    </div>
                                </div>

                                {/* Caption */}
                                <p className="text-slate-100 text-base leading-relaxed mb-4 whitespace-pre-wrap">
                                    {memory.caption}
                                </p>

                                {/* Emotions */}
                                {memory.emotions?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {memory.emotions.map((e, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1 rounded-full text-xs border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-medium"
                                            >
                                                {e}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Actions */}
                                <div
                                    className="flex items-center gap-1 pt-4"
                                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                                >
                                    <button
                                        onClick={onLike}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:bg-white/5 hover:scale-105"
                                    >
                                        <Heart
                                            className={`w-5 h-5 transition-colors ${isLiked ? "fill-red-400 text-red-400" : "text-slate-400"
                                                }`}
                                        />
                                        <span className="text-sm text-slate-300 font-medium">
                                            {memory.likesCount || 0}
                                        </span>
                                    </button>
                                    <button
                                        onClick={onComment}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:bg-white/5 hover:scale-105"
                                    >
                                        <MessageCircle className="w-5 h-5 text-slate-400" />
                                        <span className="text-sm text-slate-300 font-medium">
                                            {memory.comments?.length || 0}
                                        </span>
                                    </button>
                                    <div className="ml-auto">
                                        <button
                                            onClick={onClose}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:bg-white/5 text-slate-400 hover:text-white"
                                        >
                                            <X className="w-5 h-5" />
                                            <span className="text-sm font-medium">Close</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ExplodedContent;