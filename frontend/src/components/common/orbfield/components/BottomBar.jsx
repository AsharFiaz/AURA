import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { OCEAN_COLORS, hexToCss } from "../utils/ocean";

const BottomBar = () => {
    return (
        <div className="absolute bottom-0 left-0 right-0 px-6 py-5 flex items-end justify-between pointer-events-none">
            {/* Controls hint */}
            <motion.div
                className="flex items-center gap-3 text-[11px] text-slate-400 px-4 py-2 rounded-full"
                style={{
                    background: "rgba(15,15,30,0.65)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <span className="flex items-center gap-1.5">
                    <kbd
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                        style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#a5b4fc",
                        }}
                    >
                        drag
                    </kbd>
                    orbit · fling
                </span>
                <span className="text-slate-700">·</span>
                <span className="flex items-center gap-1.5">
                    <kbd
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                        style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#a5b4fc",
                        }}
                    >
                        scroll
                    </kbd>
                    zoom
                </span>
                <span className="text-slate-700">·</span>
                <span className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-pink-400" />
                    <span className="text-pink-300">click to detonate</span>
                </span>
            </motion.div>

            {/* Legend */}
            <motion.div
                className="px-4 py-3 rounded-2xl"
                style={{
                    background: "rgba(15,15,30,0.65)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <p className="text-[8px] uppercase tracking-[0.2em] text-slate-500 mb-2 font-bold">
                    Personality · Color · Shape
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                    {Object.entries(OCEAN_COLORS).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-2 text-[11px]">
                            <div
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{
                                    background: hexToCss(v.hex),
                                    boxShadow: `0 0 12px ${hexToCss(v.hex)}, 0 0 4px ${hexToCss(v.hex)}`,
                                }}
                            />
                            <span className="text-slate-300 font-medium">{v.label}</span>
                            <span className="text-slate-600 text-[9px] uppercase tracking-wider ml-auto">
                                {v.shape}
                            </span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default BottomBar;