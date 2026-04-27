import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import AnimatedBackdrop from "../components/common/AnimatedBackdrop";
import { ChevronRight, ChevronLeft, CheckCircle2, Sparkles, Brain } from "lucide-react";

const QUESTIONS = [
    { id: "1", text: "Enjoy engaging with complex ideas and advanced vocabulary", keyed: "plus", domain: "O" },
    { id: "2", text: "Plan tasks carefully and complete them efficiently", keyed: "plus", domain: "C" },
    { id: "3", text: "Energize social situations through active participation", keyed: "plus", domain: "E" },
    { id: "4", text: "Demonstrate empathy toward the feelings of others", keyed: "plus", domain: "A" },
    { id: "5", text: "Frequently feel concerned or uneasy about future events", keyed: "plus", domain: "N" },
    { id: "6", text: "Struggle to grasp abstract or theoretical concepts", keyed: "minus", domain: "O" },
    { id: "7", text: "Have difficulty maintaining order and organization", keyed: "minus", domain: "C" },
    { id: "8", text: "Prefer minimal verbal interaction in group settings", keyed: "minus", domain: "E" },
    { id: "9", text: "Remain emotionally detached from the problems of others", keyed: "minus", domain: "A" },
    { id: "10", text: "Maintain emotional calm even under pressure", keyed: "minus", domain: "N" },
    { id: "11", text: "Generate original ideas and think creatively", keyed: "plus", domain: "O" },
    { id: "12", text: "Attend closely to details and avoid careless mistakes", keyed: "plus", domain: "C" },
    { id: "13", text: "Feel confident and at ease when interacting with others", keyed: "plus", domain: "E" },
    { id: "14", text: "Willingly invest time and effort to support others", keyed: "plus", domain: "A" },
    { id: "15", text: "Experience emotional stress in demanding situations", keyed: "plus", domain: "N" },
    { id: "16", text: "Lack imaginative or innovative thinking", keyed: "minus", domain: "O" },
    { id: "17", text: "Frequently misplace items or neglect responsibilities", keyed: "minus", domain: "C" },
    { id: "18", text: "Avoid drawing attention to myself in social environments", keyed: "minus", domain: "E" },
    { id: "19", text: "Use harsh or insensitive language toward others", keyed: "minus", domain: "A" },
    { id: "20", text: "Rarely experience feelings of sadness or emotional distress", keyed: "minus", domain: "N" },
];

const LABELS = [
    { short: "Strongly\nNo" }, { short: "Mostly\nNo" }, { short: "Neutral" }, { short: "Mostly\nYes" }, { short: "Strongly\nYes" },
];

const TRAIT_INFO = {
    O: { label: "Openness", color: "from-violet-500 to-purple-600", text: "text-violet-300", dot: "bg-violet-400", bg: "rgba(167,139,250,0.15)" },
    C: { label: "Conscientiousness", color: "from-indigo-500 to-blue-600", text: "text-indigo-300", dot: "bg-indigo-400", bg: "rgba(129,140,248,0.15)" },
    E: { label: "Extraversion", color: "from-amber-500 to-orange-500", text: "text-amber-300", dot: "bg-amber-400", bg: "rgba(251,191,36,0.15)" },
    A: { label: "Agreeableness", color: "from-emerald-500 to-green-600", text: "text-emerald-300", dot: "bg-emerald-400", bg: "rgba(52,211,153,0.15)" },
    N: { label: "Neuroticism", color: "from-red-500 to-pink-600", text: "text-red-300", dot: "bg-red-400", bg: "rgba(248,113,113,0.15)" },
};

const PAGE_SIZE = 4;
const TOTAL_PAGES = Math.ceil(QUESTIONS.length / PAGE_SIZE);

function computeOCEAN(answers) {
    const sums = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    const counts = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    QUESTIONS.forEach(q => {
        const raw = answers[q.id]; if (!raw) return;
        let val = parseInt(raw);
        if (q.keyed === "minus") val = 6 - val;
        sums[q.domain] += val; counts[q.domain]++;
    });
    const result = {};
    for (const d in sums) {
        if (!counts[d]) { result[d] = null; continue; }
        result[d] = Math.round(((sums[d] / counts[d] - 1) / 4) * 1000) / 1000;
    }
    return result;
}

const PersonalityOnboarding = () => {
    const [answers, setAnswers] = useState({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const { refreshUser } = useAuth();
    const navigate = useNavigate();

    const answered = Object.keys(answers).length;
    const allAnswered = answered === QUESTIONS.length;
    const progress = Math.round((answered / QUESTIONS.length) * 100);
    const pageQuestions = QUESTIONS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const pageAnswered = pageQuestions.every(q => answers[q.id]);
    const isLastPage = page === TOTAL_PAGES - 1;

    const handleAnswer = (qId, val) => setAnswers(prev => ({ ...prev, [qId]: val }));

    const handleNext = () => {
        if (!pageAnswered) { setError("Please answer all questions on this page."); return; }
        setError("");
        if (isLastPage) { handleSubmit(); return; }
        setPage(p => p + 1);
    };

    const handleSubmit = async () => {
        if (!allAnswered) { setError("Please answer all 20 questions."); return; }
        setError(""); setLoading(true);
        try {
            const personality = computeOCEAN(answers);
            const response = await api.put("/users/profile", { personality });
            if (response.data.success) { await refreshUser(); navigate("/"); }
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex text-white relative">
            <AnimatedBackdrop />

            {/* Left panel */}
            <div className="hidden lg:flex flex-col justify-between w-[38%] p-12 relative overflow-hidden"
                style={{ borderRight: "1px solid rgba(167,139,250,0.1)", background: "rgba(10,10,20,0.4)", backdropFilter: "blur(10px)" }}>

                <motion.div className="flex items-center gap-3"
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <motion.div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
                        animate={{ boxShadow: ["0 0 20px rgba(124,58,237,0.3)", "0 0 40px rgba(124,58,237,0.6)", "0 0 20px rgba(124,58,237,0.3)"] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Brain className="w-5 h-5 text-white" />
                    </motion.div>
                    <span className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">AURA</span>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                    <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 font-medium">OCEAN Model</p>
                    <h2 className="text-3xl font-bold text-white leading-tight mb-5">
                        Build your<br />
                        <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">personality profile.</span>
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">
                        20 quick questions based on the Big Five personality model. Your answers help AURA surface memories that resonate with who you are.
                    </p>

                    <div className="flex flex-col gap-2.5">
                        {Object.entries(TRAIT_INFO).map(([key, t]) => {
                            const domainQs = QUESTIONS.filter(q => q.domain === key);
                            const domainAnswered = domainQs.filter(q => answers[q.id]).length;
                            const pct = Math.round((domainAnswered / domainQs.length) * 100);
                            return (
                                <div key={key} className="flex items-center gap-3">
                                    <motion.div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.dot}`}
                                        animate={pct > 0 ? { boxShadow: [`0 0 0px currentColor`, `0 0 8px currentColor`, `0 0 0px currentColor`] } : {}}
                                        transition={{ duration: 2, repeat: Infinity }} />
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className={`text-xs font-medium ${t.text}`}>{key} · {t.label}</span>
                                            <span className="text-slate-600 text-xs">{pct}%</span>
                                        </div>
                                        <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                            <motion.div className={`h-full rounded-full bg-gradient-to-r ${t.color}`}
                                                animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                <div>
                    <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                        <span>{answered} of {QUESTIONS.length} answered</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500"
                            animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
                    </div>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                    style={{ borderBottom: "1px solid rgba(167,139,250,0.1)", background: "rgba(10,10,20,0.4)", backdropFilter: "blur(10px)" }}>
                    <span className="lg:hidden text-lg font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">AURA</span>

                    <div className="flex items-center gap-1.5 lg:ml-0 ml-auto">
                        {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
                            <motion.div key={i} className="h-1.5 rounded-full transition-all duration-300"
                                style={{
                                    width: i === page ? "24px" : "8px",
                                    background: i <= page ? "linear-gradient(90deg,#4f46e5,#7c3aed)" : "rgba(255,255,255,0.1)",
                                    boxShadow: i === page ? "0 0 8px rgba(124,58,237,0.6)" : "none",
                                }} />
                        ))}
                    </div>

                    <span className="text-slate-500 text-xs ml-3">Step {page + 1} of {TOTAL_PAGES}</span>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6" style={{ scrollbarWidth: "none" }}>
                    <div className="lg:hidden mb-5">
                        <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                            <span>{answered}/{QUESTIONS.length} answered</span><span>{progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500"
                                animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div key={page} className="space-y-4"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                            {pageQuestions.map((q, i) => {
                                const trait = TRAIT_INFO[q.domain];
                                const selected = answers[q.id];
                                return (
                                    <motion.div key={q.id}
                                        className="rounded-2xl p-4 transition-all relative overflow-hidden"
                                        style={{
                                            background: selected ? trait.bg : "rgba(19,19,42,0.7)",
                                            backdropFilter: "blur(10px)",
                                            border: selected ? "1px solid rgba(167,139,250,0.3)" : "1px solid rgba(167,139,250,0.1)",
                                            boxShadow: selected ? "0 0 16px rgba(124,58,237,0.15)" : "none",
                                        }}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                    >
                                        <div className="flex items-start gap-3 mb-4">
                                            <motion.span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br ${trait.color}`}
                                                whileHover={{ scale: 1.1 }}>
                                                {page * PAGE_SIZE + i + 1}
                                            </motion.span>
                                            <p className="text-slate-200 text-sm leading-relaxed pt-0.5">{q.text}</p>
                                            {selected && (
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                                                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${trait.text}`} />
                                                </motion.div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-5 gap-1.5">
                                            {LABELS.map((label, idx) => {
                                                const val = String(idx + 1);
                                                const isSelected = selected === val;
                                                return (
                                                    <motion.button key={idx} type="button"
                                                        onClick={() => handleAnswer(q.id, val)}
                                                        className="py-2.5 px-1 rounded-xl text-center transition-all"
                                                        style={{
                                                            background: isSelected ? trait.bg : "rgba(255,255,255,0.04)",
                                                            border: isSelected ? "1px solid rgba(167,139,250,0.4)" : "1px solid rgba(255,255,255,0.07)",
                                                        }}
                                                        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
                                                    >
                                                        {isSelected ? (
                                                            <div className="flex flex-col items-center gap-0.5">
                                                                <motion.div className={`w-2 h-2 rounded-full bg-gradient-to-br ${trait.color}`}
                                                                    initial={{ scale: 0 }} animate={{ scale: 1 }} />
                                                                <span className={`text-[10px] font-semibold ${trait.text} whitespace-pre-line leading-tight`}>{label.short}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-500 whitespace-pre-line leading-tight">{label.short}</span>
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="flex-shrink-0 px-6 py-4"
                    style={{ borderTop: "1px solid rgba(167,139,250,0.1)", background: "rgba(10,10,20,0.4)", backdropFilter: "blur(10px)" }}>
                    <AnimatePresence>
                        {error && (
                            <motion.p className="text-red-400 text-xs mb-3 text-center"
                                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center gap-3">
                        <motion.button onClick={() => { setPage(p => p - 1); setError(""); }}
                            disabled={page === 0}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(167,139,250,0.1)" }}
                            whileHover={page > 0 ? { x: -2, borderColor: "rgba(167,139,250,0.3)" } : {}}
                            whileTap={page > 0 ? { scale: 0.97 } : {}}>
                            <ChevronLeft className="w-4 h-4" /> Back
                        </motion.button>

                        <motion.button onClick={handleNext}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 relative overflow-hidden"
                            style={{
                                background: pageAnswered ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "rgba(99,102,241,0.25)",
                                boxShadow: pageAnswered ? "0 4px 20px rgba(79,70,229,0.4)" : "none",
                            }}
                            whileHover={pageAnswered && !loading ? { scale: 1.02, boxShadow: "0 4px 32px rgba(124,58,237,0.6)" } : {}}
                            whileTap={pageAnswered && !loading ? { scale: 0.98 } : {}}
                        >
                            {pageAnswered && !loading && (
                                <motion.div
                                    className="absolute inset-0"
                                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
                                    animate={{ x: ["-100%", "100%"] }}
                                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                                />
                            )}
                            <span className="relative flex items-center gap-2">
                                {loading ? (
                                    <><motion.div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                        animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                                        Saving…</>
                                ) : isLastPage ? (
                                    <><Sparkles className="w-4 h-4" /> Enter AURA</>
                                ) : (
                                    <>Next <ChevronRight className="w-4 h-4" /></>
                                )}
                            </span>
                        </motion.button>
                    </div>

                    <p className="text-slate-700 text-xs text-center mt-3">
                        {answered}/{QUESTIONS.length} answered · Page {page + 1}/{TOTAL_PAGES}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PersonalityOnboarding;