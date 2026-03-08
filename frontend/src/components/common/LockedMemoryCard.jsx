import { motion } from "framer-motion";
import { Lock } from "lucide-react";

const LockedMemoryCard = ({ index = 0 }) => (
    <motion.div
        className="rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center gap-3 select-none"
        style={{
            background: "repeating-linear-gradient(135deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 2px, transparent 2px, transparent 12px)",
            backgroundColor: "rgba(255,255,255,0.03)",
            minHeight: "160px",
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
    >
        <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
            <Lock className="w-4 h-4 text-slate-500" />
        </div>
        <p className="text-slate-600 text-sm font-medium">Private memory</p>
    </motion.div>
);

export default LockedMemoryCard;