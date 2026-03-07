import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

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

const LABELS = ["Very inaccurate", "Moderately inaccurate", "Neither", "Moderately accurate", "Very accurate"];

const TRAIT_INFO = {
    O: { label: "Openness", color: "from-violet-500 to-purple-600" },
    C: { label: "Conscientiousness", color: "from-blue-500 to-blue-600" },
    E: { label: "Extraversion", color: "from-yellow-500 to-orange-500" },
    A: { label: "Agreeableness", color: "from-green-500 to-emerald-600" },
    N: { label: "Neuroticism", color: "from-red-500 to-pink-600" },
};

function computeOCEAN(answers) {
    const sums = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    const counts = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    QUESTIONS.forEach((q) => {
        const raw = answers[q.id];
        if (!raw) return;
        let val = parseInt(raw);
        if (q.keyed === "minus") val = 6 - val;
        sums[q.domain] += val;
        counts[q.domain] += 1;
    });
    const result = {};
    for (const d in sums) {
        if (!counts[d]) { result[d] = null; continue; }
        const mean = sums[d] / counts[d];
        result[d] = Math.round(((mean - 1) / 4) * 1000) / 1000;
    }
    return result;
}

const PersonalityOnboarding = () => {
    const [answers, setAnswers] = useState({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();

    const answered = Object.keys(answers).length;
    const allAnswered = answered === QUESTIONS.length;
    const progress = Math.round((answered / QUESTIONS.length) * 100);

    const handleAnswer = (qId, val) =>
        setAnswers((prev) => ({ ...prev, [qId]: val }));

    const handleSubmit = async () => {
        if (!allAnswered) {
            setError("Please answer all 20 questions before continuing.");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const personality = computeOCEAN(answers);
            const response = await api.put("/users/profile", { personality });
            if (response.data.success) {
                await refreshUser(); // sync updated user into AuthContext
                navigate("/");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <motion.div
                className="w-full max-w-2xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
                    {/* Header */}
                    <h1 className="text-4xl font-bold text-center mb-1 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                        AURA
                    </h1>
                    <h2 className="text-xl font-semibold text-white text-center mb-1">
                        Welcome, {user?.username}! 👋
                    </h2>
                    <p className="text-slate-400 text-sm text-center mb-6">
                        One last step — answer these 20 questions to build your personality profile.
                    </p>

                    {/* Progress */}
                    <div className="mb-6">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>{answered} / {QUESTIONS.length} answered</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>

                    {/* Trait legend */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {Object.entries(TRAIT_INFO).map(([key, val]) => (
                            <span key={key} className={`px-2 py-1 rounded-full text-xs text-white bg-gradient-to-r ${val.color}`}>
                                {key} · {val.label}
                            </span>
                        ))}
                    </div>

                    {error && (
                        <motion.div
                            className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Questions */}
                    <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                        {QUESTIONS.map((q, i) => {
                            const trait = TRAIT_INFO[q.domain];
                            return (
                                <motion.div
                                    key={q.id}
                                    className="bg-white/5 rounded-xl p-4 border border-white/10"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br ${trait.color}`}>
                                            {i + 1}
                                        </span>
                                        <p className="text-slate-200 text-sm leading-relaxed">{q.text}</p>
                                    </div>
                                    <div className="grid grid-cols-5 gap-1">
                                        {LABELS.map((label, idx) => {
                                            const val = String(idx + 1);
                                            const selected = answers[q.id] === val;
                                            return (
                                                <motion.button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleAnswer(q.id, val)}
                                                    className={`py-2 px-1 rounded-lg text-xs font-medium border transition-all text-center leading-tight ${selected
                                                            ? `bg-gradient-to-br ${trait.color} border-transparent text-white`
                                                            : "bg-white/5 border-white/10 text-slate-400 hover:border-purple-500/50 hover:text-white"
                                                        }`}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    {label}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Submit */}
                    <motion.button
                        onClick={handleSubmit}
                        disabled={loading || !allAnswered}
                        className="mt-6 w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={!loading && allAnswered ? { scale: 1.02 } : {}}
                        whileTap={!loading && allAnswered ? { scale: 0.98 } : {}}
                    >
                        {loading ? "Saving your profile..." : `Enter AURA (${answered}/${QUESTIONS.length})`}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default PersonalityOnboarding;