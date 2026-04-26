import { motion, AnimatePresence } from "framer-motion";
import { Move3d } from "lucide-react";

export const OnboardingHint = ({ visible }) => (
    <AnimatePresence>
        {visible && (
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
            >
                <div
                    className="px-6 py-4 rounded-2xl flex flex-col items-center gap-2"
                    style={{
                        background: "rgba(8,8,20,0.85)",
                        backdropFilter: "blur(24px)",
                        border: "1px solid rgba(165,180,252,0.25)",
                        boxShadow: "0 16px 40px rgba(0,0,0,0.5), 0 0 60px rgba(99,102,241,0.15)",
                    }}
                >
                    <Move3d className="w-5 h-5 text-indigo-300" />
                    <p className="text-white text-sm font-medium">
                        Drag empty space to orbit · Drag an orb to fling it
                    </p>
                    <p className="text-slate-500 text-xs">Click any orb to ignite it</p>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

export const FlashOverlay = ({ visible, color = "white" }) => (
    <AnimatePresence>
        {visible && (
            <motion.div
                className="absolute inset-0 pointer-events-none z-[60]"
                style={{ background: color }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
            />
        )}
    </AnimatePresence>
);

export const Vignette = () => (
    <div
        className="absolute inset-0 pointer-events-none"
        style={{
            background: "radial-gradient(ellipse 80% 60% at center, transparent 0%, rgba(0,0,0,0.5) 100%)",
        }}
    />
);

export const Scanlines = () => (
    <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
        style={{
            backgroundImage:
                "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(255,255,255,0.4) 2px, rgba(255,255,255,0.4) 3px)",
        }}
    />
);