import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { Mail, Lock, User, ChevronRight, ChevronLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";

// ─── OCEAN data ───────────────────────────────────────────────────────────────
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
  { short: "Strongly\nNo", full: "Very inaccurate" },
  { short: "Mostly\nNo", full: "Moderately inaccurate" },
  { short: "Neutral", full: "Neither" },
  { short: "Mostly\nYes", full: "Moderately accurate" },
  { short: "Strongly\nYes", full: "Very accurate" },
];

const TRAIT_INFO = {
  O: { label: "Openness", color: "from-violet-500 to-purple-600", text: "text-violet-300", dot: "bg-violet-400", bg: "rgba(139,92,246,0.15)" },
  C: { label: "Conscientiousness", color: "from-blue-500 to-blue-600", text: "text-blue-300", dot: "bg-blue-400", bg: "rgba(59,130,246,0.15)" },
  E: { label: "Extraversion", color: "from-yellow-500 to-orange-500", text: "text-yellow-300", dot: "bg-yellow-400", bg: "rgba(234,179,8,0.15)" },
  A: { label: "Agreeableness", color: "from-green-500 to-emerald-600", text: "text-green-300", dot: "bg-green-400", bg: "rgba(16,185,129,0.15)" },
  N: { label: "Neuroticism", color: "from-red-500 to-pink-600", text: "text-red-300", dot: "bg-red-400", bg: "rgba(239,68,68,0.15)" },
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

// ─── Input field ──────────────────────────────────────────────────────────────
const Field = ({ icon: Icon, label, type, value, onChange, placeholder, required, suffix }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label className="block text-slate-500 text-xs font-medium mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4 pointer-events-none" />
        <input
          type={isPassword && show ? "text" : type}
          value={value} onChange={onChange} required={required} placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl text-white text-sm placeholder-slate-700 focus:outline-none transition-all"
          style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.07)" }}
          onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Signup ───────────────────────────────────────────────────────────────────
const Signup = () => {
  const [step, setStep] = useState(1);
  const [quizPage, setQuizPage] = useState(0);
  const [formData, setFormData] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const answered = Object.keys(answers).length;
  const allAnswered = answered === QUESTIONS.length;
  const progress = Math.round((answered / QUESTIONS.length) * 100);

  const pageQuestions = QUESTIONS.slice(quizPage * PAGE_SIZE, (quizPage + 1) * PAGE_SIZE);
  const pageAnswered = pageQuestions.every(q => answers[q.id]);
  const isLastPage = quizPage === TOTAL_PAGES - 1;

  const handleStep1 = e => {
    e.preventDefault(); setError("");
    if (formData.password !== formData.confirmPassword) { setError("Passwords do not match."); return; }
    if (formData.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setStep(2);
  };

  const handleAnswer = (qId, val) => setAnswers(p => ({ ...p, [qId]: val }));

  const handleQuizNext = () => {
    if (!pageAnswered) { setError("Please answer all questions on this page."); return; }
    setError("");
    if (isLastPage) { handleSubmit(); return; }
    setQuizPage(p => p + 1);
  };

  const handleSubmit = async () => {
    if (!allAnswered) { setError("Please answer all 20 questions."); return; }
    setError(""); setLoading(true);
    try {
      const personality = computeOCEAN(answers);
      const response = await api.post("/auth/signup", {
        email: formData.email, password: formData.password,
        username: formData.username, personality,
      });
      if (response.data.success) { login(response.data.token, response.data.user); navigate("/"); }
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex text-white" style={{ background: "#0d0d1a" }}>

      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-[40%] p-12 relative overflow-hidden"
        style={{ background: "#0a0a1a", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(99,102,241,0.12),transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-52 h-52 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(139,92,246,0.08),transparent 70%)" }} />

        <span className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">AURA</span>

        <div>
          {step === 1 ? (
            <>
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 font-medium">Join AURA</p>
              <h2 className="text-3xl font-bold text-white leading-tight mb-4">
                Your story,<br />
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">beautifully told.</span>
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                Create your account and let AI surface memories that truly resonate with your personality.
              </p>
              <div className="flex flex-col gap-2.5">
                {[
                  { icon: "✦", label: "OCEAN Personality AI" },
                  { icon: "✦", label: "Vector-powered feed" },
                  { icon: "✦", label: "NFT Memory minting" },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-2.5">
                    <span className="text-indigo-400 text-xs">{f.icon}</span>
                    <span className="text-slate-400 text-sm">{f.label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 font-medium">OCEAN Model</p>
              <h2 className="text-3xl font-bold text-white leading-tight mb-4">
                Build your<br />
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">personality profile.</span>
              </h2>
              <div className="flex flex-col gap-3 mt-4">
                {Object.entries(TRAIT_INFO).map(([key, t]) => {
                  const domainQs = QUESTIONS.filter(q => q.domain === key);
                  const pct = Math.round((domainQs.filter(q => answers[q.id]).length / domainQs.length) * 100);
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${t.dot}`} />
                          <span className={`text-xs font-medium ${t.text}`}>{key} · {t.label}</span>
                        </div>
                        <span className="text-slate-600 text-xs">{pct}%</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <motion.div className={`h-full rounded-full bg-gradient-to-r ${t.color}`}
                          animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                  <span>{answered}/{QUESTIONS.length} answered</span><span>{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: step >= s ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "rgba(255,255,255,0.08)",
                  color: step >= s ? "#fff" : "#475569",
                }}>
                {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
              </div>
              <span className={`text-xs ${step >= s ? "text-slate-300" : "text-slate-600"}`}>
                {s === 1 ? "Account" : "Personality"}
              </span>
              {s < 2 && <ChevronRight className="w-3 h-3 text-slate-700" />}
            </div>
          ))}
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Step dots — top bar */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {/* Mobile logo */}
          <span className="lg:hidden text-lg font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">AURA</span>

          {step === 2 && (
            <div className="flex items-center gap-1.5 lg:ml-0 ml-auto">
              {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
                <div key={i} className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === quizPage ? "24px" : "8px",
                    background: i <= quizPage ? "linear-gradient(90deg,#4f46e5,#7c3aed)" : "rgba(255,255,255,0.1)",
                  }} />
              ))}
              <span className="text-slate-600 text-xs ml-2">Page {quizPage + 1}/{TOTAL_PAGES}</span>
            </div>
          )}
          {step === 1 && <div className="lg:hidden" />}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          <AnimatePresence mode="wait">

            {/* ── Step 1 ── */}
            {step === 1 && (
              <motion.div key="step1" className="flex items-center justify-center min-h-full px-6 py-10"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <div className="w-full max-w-sm">
                  <div className="mb-7">
                    <h1 className="text-xl font-bold text-white mb-1">Create your account</h1>
                    <p className="text-slate-600 text-sm">Step 1 of 2 — Basic info</p>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div className="mb-4 px-4 py-3 rounded-xl text-red-300 text-sm"
                        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleStep1} className="space-y-4">
                    <Field icon={User} label="Username" type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="Choose a username" required />
                    <Field icon={Mail} label="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="you@example.com" required />
                    <Field icon={Lock} label="Password" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="At least 6 characters" required />
                    <Field icon={Lock} label="Confirm Password" type="password" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="Repeat your password" required />

                    <motion.button type="submit"
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all mt-2"
                      style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 20px rgba(79,70,229,0.3)" }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Next: Personality Quiz <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </form>

                  <p className="mt-5 text-center text-slate-600 text-xs">
                    Already have an account?{" "}
                    <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Log In</Link>
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <motion.div key="step2" className="flex flex-col h-full"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>

                {/* Questions area */}
                <div className="flex-1 px-6 py-5 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                  {/* Mobile progress */}
                  <div className="lg:hidden mb-4">
                    <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                      <span>{answered}/{QUESTIONS.length} answered</span><span>{progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                        animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div key={quizPage} className="space-y-4"
                      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                      {pageQuestions.map((q, i) => {
                        const trait = TRAIT_INFO[q.domain];
                        const selected = answers[q.id];
                        return (
                          <motion.div key={q.id} className="rounded-2xl p-4 transition-all"
                            style={{
                              background: selected ? trait.bg : "#13132a",
                              border: selected ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.05)",
                            }}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}>
                            <div className="flex items-start gap-3 mb-4">
                              <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br ${trait.color}`}>
                                {quizPage * PAGE_SIZE + i + 1}
                              </span>
                              <p className="text-slate-200 text-sm leading-relaxed pt-0.5">{q.text}</p>
                              {selected && <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${trait.text}`} />}
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
                                      border: isSelected ? `1px solid rgba(255,255,255,0.15)` : "1px solid rgba(255,255,255,0.07)",
                                    }}
                                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                                    {isSelected ? (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${trait.color}`} />
                                        <span className={`text-[10px] font-semibold ${trait.text} whitespace-pre-line leading-tight`}>{label.short}</span>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-600 whitespace-pre-line leading-tight">{label.short}</span>
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

                {/* Footer nav */}
                <div className="flex-shrink-0 px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <AnimatePresence>
                    {error && (
                      <motion.p className="text-red-400 text-xs mb-3 text-center"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { if (quizPage === 0) { setStep(1); setError(""); } else { setQuizPage(p => p - 1); setError(""); } }}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>

                    <motion.button onClick={handleQuizNext} disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50"
                      style={{
                        background: pageAnswered ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "rgba(99,102,241,0.2)",
                        boxShadow: pageAnswered ? "0 4px 20px rgba(79,70,229,0.3)" : "none",
                      }}
                      whileHover={pageAnswered && !loading ? { scale: 1.02 } : {}}
                      whileTap={pageAnswered && !loading ? { scale: 0.98 } : {}}>
                      {loading ? (
                        <><motion.div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                          Creating your AURA…</>
                      ) : isLastPage ? (
                        <><CheckCircle2 className="w-4 h-4" /> Complete Signup</>
                      ) : (
                        <>Next <ChevronRight className="w-4 h-4" /></>
                      )}
                    </motion.button>
                  </div>

                  <p className="text-slate-700 text-xs text-center mt-3">
                    {answered}/{QUESTIONS.length} answered · Page {quizPage + 1}/{TOTAL_PAGES}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Signup;