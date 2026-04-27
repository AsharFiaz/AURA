import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AnimatedBackdrop from "../components/common/AnimatedBackdrop";
import BombasticSidebar from "../components/common/BombasticSidebar";
import CommandBar from "../components/common/CommandBar";
import MobileTopBar from "../components/common/MobileTopBar";
import MobileBottomNav from "../components/common/MobileBottomNav";
import { Brain, Sparkles, ArrowRight } from "lucide-react";

const TRAIT_INFO = {
    O: {
        label: "Openness", short: "O", color: "#a78bfa",
        track: "rgba(167,139,250,0.15)", glow: "rgba(167,139,250,0.5)",
        desc: "Curiosity & creativity",
        high: "You're highly curious, imaginative, and open to new ideas and experiences.",
        low: "You prefer routine, practicality, and familiar environments over novelty.",
    },
    C: {
        label: "Conscientiousness", short: "C", color: "#818cf8",
        track: "rgba(129,140,248,0.15)", glow: "rgba(129,140,248,0.5)",
        desc: "Discipline & planning",
        high: "You're organized, dependable, and goal-oriented with strong self-discipline.",
        low: "You tend to be flexible and spontaneous, preferring freedom over rigid structure.",
    },
    E: {
        label: "Extraversion", short: "E", color: "#fbbf24",
        track: "rgba(251,191,36,0.15)", glow: "rgba(251,191,36,0.5)",
        desc: "Social energy & assertiveness",
        high: "You're energized by social interaction, outgoing, and expressive.",
        low: "You recharge through solitude and prefer deeper one-on-one connections.",
    },
    A: {
        label: "Agreeableness", short: "A", color: "#34d399",
        track: "rgba(52,211,153,0.15)", glow: "rgba(52,211,153,0.5)",
        desc: "Empathy & cooperation",
        high: "You're compassionate, cooperative, and highly attuned to others' feelings.",
        low: "You're direct, competitive, and prioritize logic over emotional considerations.",
    },
    N: {
        label: "Neuroticism", short: "N", color: "#f87171",
        track: "rgba(248,113,113,0.15)", glow: "rgba(248,113,113,0.5)",
        desc: "Emotional sensitivity",
        high: "You experience emotions intensely and may be more sensitive to stress.",
        low: "You're emotionally stable, calm under pressure, and resilient.",
    },
};

const BigRing = ({ score, traitKey, delay = 0 }) => {
    const trait = TRAIT_INFO[traitKey];
    const pct = score !== null && score !== undefined ? Math.round(score * 100) : null;
    const size = 110;
    const stroke = 9;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = pct !== null ? (pct / 100) * circ : 0;
    const filterId = `glow-${traitKey}`;

    return (
        <motion.div
            className="rounded-2xl p-5 flex flex-col items-center gap-3 relative overflow-hidden"
            style={{
                background: "rgba(19,19,42,0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(167,139,250,0.1)",
            }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            whileHover={{
                borderColor: `${trait.color}66`,
                scale: 1.02,
                boxShadow: `0 0 24px ${trait.color}33`,
            }}
        >
            {/* Pulsing corner dot */}
            <motion.div
                className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full"
                style={{ background: trait.color }}
                animate={{ boxShadow: [`0 0 0px ${trait.color}`, `0 0 12px ${trait.color}`, `0 0 0px ${trait.color}`] }}
                transition={{ duration: 2, repeat: Infinity }}
            />

            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                    <defs>
                        <filter id={filterId}>
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <circle cx={size / 2} cy={size / 2} r={r}
                        fill="none" stroke={trait.track} strokeWidth={stroke} />
                    {pct !== null && (
                        <motion.circle cx={size / 2} cy={size / 2} r={r}
                            fill="none" stroke={trait.color} strokeWidth={stroke}
                            strokeLinecap="round"
                            strokeDasharray={circ}
                            filter={`url(#${filterId})`}
                            initial={{ strokeDashoffset: circ }}
                            animate={{ strokeDashoffset: circ - dash }}
                            transition={{ duration: 1.2, delay: delay + 0.3, ease: "easeOut" }}
                        />
                    )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span className="text-white font-bold text-xl"
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ delay: delay + 0.5, type: "spring", stiffness: 200 }}>
                        {pct !== null ? `${pct}%` : "—"}
                    </motion.span>
                    <span className="text-xs font-bold" style={{ color: trait.color }}>{traitKey}</span>
                </div>
            </div>

            <div className="text-center">
                <p className="text-white text-sm font-semibold">{trait.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{trait.desc}</p>
            </div>

            <p className="text-slate-400 text-xs text-center leading-relaxed">
                {pct !== null ? (pct >= 50 ? trait.high : trait.low) : "Not enough data yet."}
            </p>

            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div className="h-full rounded-full"
                    style={{ background: trait.color, boxShadow: `0 0 8px ${trait.color}` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct ?? 0}%` }}
                    transition={{ duration: 1.2, delay: delay + 0.3, ease: "easeOut" }}
                />
            </div>
        </motion.div>
    );
};

const PersonalityPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const p = user?.personality;
    const hasData = p && Object.values(p).some(v => v !== null);

    const sorted = hasData
        ? Object.entries(p).filter(([, v]) => v !== null).sort((a, b) => b[1] - a[1])
        : [];

    const dominant = sorted[0]?.[0];
    const weakest = sorted[sorted.length - 1]?.[0];

    return (
        <div className="min-h-screen text-white relative">
            <AnimatedBackdrop />

            <MobileTopBar title="Personality Report" icon={Brain} />

            <div className="flex relative">
                <BombasticSidebar />

                <main className="flex-1 min-w-0">
                    <CommandBar isLive={true} />

                    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 pb-24 lg:pb-8 space-y-6">

                        <motion.div className="hidden lg:flex items-center gap-3 mb-2"
                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                            <motion.div
                                animate={{ rotate: [0, 8, -8, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <Brain className="w-5 h-5 text-violet-400" />
                            </motion.div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-transparent">
                                Personality Report
                            </h1>
                            <span className="text-xs text-slate-500 uppercase tracking-widest ml-1">OCEAN Profile</span>
                        </motion.div>

                        {!hasData ? (
                            <motion.div className="text-center py-20 rounded-2xl relative overflow-hidden"
                                style={{
                                    background: "rgba(19,19,42,0.7)",
                                    backdropFilter: "blur(10px)",
                                    border: "1px solid rgba(167,139,250,0.1)",
                                }}
                                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                                <motion.div
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                    className="inline-block mb-4"
                                >
                                    <Brain className="w-12 h-12 text-violet-500/50 mx-auto" />
                                </motion.div>
                                <p className="text-white font-semibold mb-2">No personality data yet</p>
                                <p className="text-slate-500 text-sm mb-6">Take the quiz so AURA can build your profile</p>
                                <motion.button onClick={() => navigate("/onboarding")}
                                    className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold relative overflow-hidden"
                                    style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 20px rgba(79,70,229,0.4)" }}
                                    whileHover={{ scale: 1.05, boxShadow: "0 4px 32px rgba(124,58,237,0.6)" }}
                                    whileTap={{ scale: 0.97 }}>
                                    <motion.div
                                        className="absolute inset-0"
                                        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
                                        animate={{ x: ["-100%", "100%"] }}
                                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                                    />
                                    <span className="relative">Take the Quiz</span>
                                </motion.button>
                            </motion.div>
                        ) : (
                            <>
                                <motion.div className="rounded-2xl p-5 relative overflow-hidden"
                                    style={{
                                        background: "linear-gradient(135deg,rgba(79,70,229,0.2),rgba(124,58,237,0.15),rgba(236,72,153,0.1))",
                                        backdropFilter: "blur(10px)",
                                        border: "1px solid rgba(167,139,250,0.25)",
                                    }}
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

                                    <motion.div
                                        className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-violet-400"
                                        animate={{ boxShadow: ["0 0 0px #a78bfa", "0 0 12px #a78bfa", "0 0 0px #a78bfa"] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />

                                    <div className="flex items-start gap-4">
                                        <motion.div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.3)" }}
                                            animate={{ boxShadow: ["0 0 12px rgba(167,139,250,0.3)", "0 0 24px rgba(167,139,250,0.6)", "0 0 12px rgba(167,139,250,0.3)"] }}
                                            transition={{ duration: 2.5, repeat: Infinity }}>
                                            <Sparkles className="w-6 h-6 text-violet-300" />
                                        </motion.div>
                                        <div>
                                            <p className="text-white font-bold text-sm mb-1">Your Personality Summary</p>
                                            <p className="text-slate-300 text-xs leading-relaxed">
                                                Your strongest trait is{" "}
                                                <span className="font-semibold" style={{ color: TRAIT_INFO[dominant]?.color }}>
                                                    {TRAIT_INFO[dominant]?.label}
                                                </span>
                                                {weakest && dominant !== weakest && (
                                                    <> while <span className="font-semibold" style={{ color: TRAIT_INFO[weakest]?.color }}>
                                                        {TRAIT_INFO[weakest]?.label}
                                                    </span> is your lowest scoring trait.</>
                                                )}{" "}
                                                These scores are derived from your memories by AURA's AI and update as you post more.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.keys(TRAIT_INFO).map((key, i) => (
                                        <BigRing key={key} traitKey={key} score={p[key]} delay={i * 0.1} />
                                    ))}
                                </div>

                                <motion.div className="rounded-2xl p-5 flex items-center justify-between"
                                    style={{
                                        background: "rgba(19,19,42,0.7)",
                                        backdropFilter: "blur(10px)",
                                        border: "1px solid rgba(167,139,250,0.1)",
                                    }}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                                    whileHover={{ borderColor: "rgba(167,139,250,0.3)" }}>
                                    <div>
                                        <p className="text-white text-sm font-semibold">Update your personality</p>
                                        <p className="text-slate-500 text-xs mt-0.5">Retake the quiz to refresh your scores</p>
                                    </div>
                                    <motion.button onClick={() => navigate("/onboarding")}
                                        className="px-4 py-2 rounded-xl text-white text-xs font-semibold flex-shrink-0 transition-all flex items-center gap-1.5"
                                        style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(167,139,250,0.4)" }}
                                        whileHover={{ scale: 1.05, background: "rgba(124,58,237,0.3)", boxShadow: "0 0 16px rgba(124,58,237,0.4)" }}
                                        whileTap={{ scale: 0.97 }}>
                                        Retake Quiz <ArrowRight className="w-3 h-3" />
                                    </motion.button>
                                </motion.div>
                            </>
                        )}
                    </div>
                </main>
            </div>

            <MobileBottomNav />
        </div>
    );
};

export default PersonalityPage;