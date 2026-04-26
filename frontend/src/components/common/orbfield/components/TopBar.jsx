import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Pause, Play, RotateCcw } from "lucide-react";

const TopBar = ({ memoriesCount, driftActive, onToggleDrift, onResetCamera, onExit }) => {
    return (
        <div className="absolute top-0 left-0 right-0 px-6 py-5 flex items-center justify-between pointer-events-none z-50">
            {/* Exit button */}
            <motion.button
                onClick={onExit}
                className="pointer-events-auto group flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all"
                style={{
                    background: "rgba(15,15,30,0.7)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(165,180,252,0.2)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.03, x: -2 }}
                whileTap={{ scale: 0.97 }}
            >
                <ArrowLeft className="w-4 h-4 text-indigo-300 group-hover:-translate-x-0.5 transition-all" />
                <span className="text-[12px] font-semibold text-indigo-200 tracking-wide">Exit Galaxy</span>
            </motion.button>

            {/* Title */}
            <motion.div
                className="pointer-events-none flex flex-col items-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="flex items-center gap-2 mb-0.5">
                    <Sparkles className="w-3 h-3 text-indigo-300" />
                    <span
                        className="text-[10px] font-bold tracking-[0.3em] uppercase"
                        style={{
                            background: "linear-gradient(90deg,#a5b4fc,#c4b5fd,#f0abfc,#fbcfe8)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        Orb Field
                    </span>
                    <Sparkles className="w-3 h-3 text-pink-300" />
                </div>
                <p className="text-slate-400 text-xs italic" style={{ fontFamily: "Georgia, serif" }}>
                    {memoriesCount} memories drifting in space
                </p>
            </motion.div>

            {/* Right side controls */}
            <motion.div
                className="pointer-events-auto flex items-center gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
            >
                <button
                    onClick={onToggleDrift}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all hover:scale-105"
                    style={{
                        background: "rgba(15,15,30,0.7)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(165,180,252,0.2)",
                        color: driftActive ? "#a5b4fc" : "#64748b",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                    }}
                >
                    {driftActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {driftActive ? "Drifting" : "Paused"}
                </button>
                <button
                    onClick={onResetCamera}
                    className="p-2 rounded-xl transition-all hover:scale-105"
                    style={{
                        background: "rgba(15,15,30,0.7)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(165,180,252,0.2)",
                        color: "#a5b4fc",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                    }}
                    title="Reset view"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                </button>
            </motion.div>
        </div>
    );
};

export default TopBar;