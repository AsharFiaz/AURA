import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { Mail, Lock, User, ChevronRight, ChevronLeft } from "lucide-react";

// ─── OCEAN questions (20 items) ──────────────────────────────────────────────
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
  "Very inaccurate",
  "Moderately inaccurate",
  "Neither",
  "Moderately accurate",
  "Very accurate",
];

const TRAIT_INFO = {
  O: { label: "Openness", color: "from-violet-500 to-purple-600" },
  C: { label: "Conscientiousness", color: "from-blue-500 to-blue-600" },
  E: { label: "Extraversion", color: "from-yellow-500 to-orange-500" },
  A: { label: "Agreeableness", color: "from-green-500 to-emerald-600" },
  N: { label: "Neuroticism", color: "from-red-500 to-pink-600" },
};

// ─── Score helper ─────────────────────────────────────────────────────────────
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
    const mean = sums[d] / counts[d];          // 1.0 – 5.0
    result[d] = Math.round(((mean - 1) / 4) * 1000) / 1000; // 0.000 – 1.000
  }
  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────
const Signup = () => {
  const [step, setStep] = useState(1); // 1 = basic info, 2 = personality test
  const [formData, setFormData] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // ── Step 1 handlers ────────────────────────────────────────────────────────
  const handleStep1 = (e) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setStep(2);
  };

  // ── Step 2 handlers ────────────────────────────────────────────────────────
  const handleAnswer = (qId, val) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const allAnswered = QUESTIONS.every((q) => answers[q.id]);

  const handleSubmit = async () => {
    if (!allAnswered) {
      setError("Please answer all 20 questions before submitting.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const personality = computeOCEAN(answers);
      const response = await api.post("/auth/signup", {
        email: formData.email,
        password: formData.password,
        username: formData.username,
        personality,
      });
      if (response.data.success) {
        login(response.data.token, response.data.user);
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Progress bar for step 2 ─────────────────────────────────────────────────
  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / QUESTIONS.length) * 100);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <AnimatePresence mode="wait">

        {/* ──────────────── STEP 1: Basic Info ──────────────── */}
        {step === 1 && (
          <motion.div
            key="step1"
            className="w-full max-w-md"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
              <h1 className="text-5xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                AURA
              </h1>
              <p className="text-center text-slate-300 mb-8 text-sm">
                Create your account — Step 1 of 2
              </p>

              {error && (
                <motion.div
                  className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleStep1} className="space-y-5">
                {/* Username */}
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="Choose a username"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="At least 6 characters"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="Repeat your password"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Next: Personality Quiz <ChevronRight className="w-5 h-5" />
                </motion.button>
              </form>

              <p className="mt-6 text-center text-slate-400 text-sm">
                Already have an account?{" "}
                <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                  Log In
                </Link>
              </p>
            </div>
          </motion.div>
        )}

        {/* ──────────────── STEP 2: Personality Quiz ──────────────── */}
        {step === 2 && (
          <motion.div
            key="step2"
            className="w-full max-w-2xl"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.35 }}
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
              {/* Header */}
              <div className="flex items-center gap-3 mb-2">
                <motion.button
                  onClick={() => { setStep(1); setError(""); }}
                  className="text-slate-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft className="w-6 h-6" />
                </motion.button>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Personality Quiz
                </h2>
              </div>
              <p className="text-slate-400 text-sm mb-4 ml-9">
                Answer honestly — this builds your unique AURA personality profile.
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
                className="mt-6 w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={!loading && allAnswered ? { scale: 1.02 } : {}}
                whileTap={!loading && allAnswered ? { scale: 0.98 } : {}}
              >
                {loading ? "Creating your AURA..." : `Complete Signup (${answered}/${QUESTIONS.length})`}
              </motion.button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default Signup;