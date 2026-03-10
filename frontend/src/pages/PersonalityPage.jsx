import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    Brain, ArrowLeft, Sparkles,
    Home as HomeIcon, Compass, ShoppingBag, Mail,
    Bell, Bookmark, User as UserIcon, Plus, LogOut,
} from "lucide-react";

const TRAIT_INFO = {
    O: {
        label: "Openness",
        short: "O",
        color: "#8b5cf6",
        track: "rgba(139,92,246,0.15)",
        desc: "Curiosity & creativity",
        high: "You're highly curious, imaginative, and open to new ideas and experiences.",
        low: "You prefer routine, practicality, and familiar environments over novelty.",
    },
    C: {
        label: "Conscientiousness",
        short: "C",
        color: "#3b82f6",
        track: "rgba(59,130,246,0.15)",
        desc: "Discipline & planning",
        high: "You're organized, dependable, and goal-oriented with strong self-discipline.",
        low: "You tend to be flexible and spontaneous, preferring freedom over rigid structure.",
    },
    E: {
        label: "Extraversion",
        short: "E",
        color: "#f59e0b",
        track: "rgba(245,158,11,0.15)",
        desc: "Social energy & assertiveness",
        high: "You're energized by social interaction, outgoing, and expressive.",
        low: "You recharge through solitude and prefer deeper one-on-one connections.",
    },
    A: {
        label: "Agreeableness",
        short: "A",
        color: "#10b981",
        track: "rgba(16,185,129,0.15)",
        desc: "Empathy & cooperation",
        high: "You're compassionate, cooperative, and highly attuned to others' feelings.",
        low: "You're direct, competitive, and prioritize logic over emotional considerations.",
    },
    N: {
        label: "Neuroticism",
        short: "N",
        color: "#ef4444",
        track: "rgba(239,68,68,0.15)",
        desc: "Emotional sensitivity",
        high: "You experience emotions intensely and may be more sensitive to stress.",
        low: "You're emotionally stable, calm under pressure, and resilient.",
    },
};

// ─── Large circle ring ────────────────────────────────────────────────────────
const BigRing = ({ score, traitKey, delay = 0 }) => {
    const trait = TRAIT_INFO[traitKey];
    const pct = score !== null && score !== undefined ? Math.round(score * 100) : null;
    const size = 110;
    const stroke = 9;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = pct !== null ? (pct / 100) * circ : 0;

    return (
        <motion.div
            className="rounded-2xl p-5 flex flex-col items-center gap-3"
            style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            whileHover={{ borderColor: `${trait.color}44`, scale: 1.02 }}
        >
            {/* Ring */}
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                    <circle cx={size / 2} cy={size / 2} r={r}
                        fill="none" stroke={trait.track} strokeWidth={stroke} />
                    {pct !== null && (
                        <motion.circle cx={size / 2} cy={size / 2} r={r}
                            fill="none" stroke={trait.color} strokeWidth={stroke}
                            strokeLinecap="round"
                            strokeDasharray={circ}
                            initial={{ strokeDashoffset: circ }}
                            animate={{ strokeDashoffset: circ - dash }}
                            transition={{ duration: 1.2, delay: delay + 0.3, ease: "easeOut" }}
                        />
                    )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-white font-bold text-xl">{pct !== null ? `${pct}%` : "—"}</span>
                    <span className="text-xs font-bold" style={{ color: trait.color }}>{traitKey}</span>
                </div>
            </div>

            {/* Label */}
            <div className="text-center">
                <p className="text-white text-sm font-semibold">{trait.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{trait.desc}</p>
            </div>

            {/* Description */}
            <p className="text-slate-400 text-xs text-center leading-relaxed">
                {pct !== null ? (pct >= 50 ? trait.high : trait.low) : "Not enough data yet."}
            </p>

            {/* Score bar */}
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div className="h-full rounded-full"
                    style={{ background: trait.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct ?? 0}%` }}
                    transition={{ duration: 1.2, delay: delay + 0.3, ease: "easeOut" }}
                />
            </div>
        </motion.div>
    );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ user, logout, navigate, location }) => {
    const navLinks = [
        { icon: HomeIcon, label: "Home", path: "/" },
        { icon: Compass, label: "Discover", path: "/discover" },
        { icon: ShoppingBag, label: "Marketplace", path: "/marketplace" },
        { icon: Mail, label: "Messages", path: "/messages" },
        { icon: Bell, label: "Notifications", path: "/notifications", badge: true },
        { icon: Bookmark, label: "Bookmarks", path: "/bookmarks" },
        { icon: UserIcon, label: "Profile", path: "/profile" },
    ];
    return (
        <aside
            className="hidden lg:flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-hidden transition-all duration-300 ease-in-out group/sidebar"
            style={{ width: "72px", borderRight: "1px solid rgba(255,255,255,0.06)" }}
            onMouseEnter={e => { e.currentTarget.style.width = "240px"; }}
            onMouseLeave={e => { e.currentTarget.style.width = "72px"; }}
        >
            <div className="px-4 py-6 flex items-center overflow-hidden" style={{ minHeight: "72px" }}>
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent flex-shrink-0 w-8 text-center">A</span>
                <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-100">URA</span>
            </div>
            <nav className="flex flex-col gap-0.5 flex-1 px-2">
                {navLinks.map(item => (
                    <button key={item.path} onClick={() => navigate(item.path)}
                        className={`flex items-center rounded-xl transition-all duration-150 group/item relative ${location.pathname === item.path ? "text-white bg-white/10" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                        style={{ minHeight: "48px", padding: "0 14px" }}>
                        <item.icon className={`w-6 h-6 flex-shrink-0 ${location.pathname === item.path ? "text-indigo-400" : "group-hover/item:text-indigo-400"}`} />
                        <span className="ml-4 text-[15px] font-medium whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75 flex-1 text-left">{item.label}</span>
                        {item.badge && <span className="absolute top-3 left-8 w-2 h-2 rounded-full bg-red-500" />}
                    </button>
                ))}
            </nav>
            <div className="px-2 mt-2">
                <button onClick={() => navigate("/create")}
                    className="w-full flex items-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-900/40 overflow-hidden"
                    style={{ minHeight: "44px", padding: "0 14px" }}>
                    <Plus className="w-5 h-5 flex-shrink-0" />
                    <span className="ml-4 whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">Create Memory</span>
                </button>
            </div>
            <div className="mx-2 mt-3 mb-4 flex items-center rounded-xl hover:bg-white/5 cursor-pointer group/user overflow-hidden"
                style={{ minHeight: "56px", padding: "0 10px" }} onClick={() => navigate("/profile")}>
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {user?.profilePicture ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" /> : (user?.username?.charAt(0).toUpperCase() || "U")}
                </div>
                <div className="ml-3 flex-1 min-w-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">
                    <p className="text-white text-xs font-semibold truncate">{user?.username}</p>
                    <p className="text-slate-600 text-xs truncate">{user?.email}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); logout(); navigate("/login"); }}
                    className="ml-2 p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover/sidebar:opacity-100 group-hover/user:opacity-100">
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </aside>
    );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const PersonalityPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const p = user?.personality;
    const hasData = p && Object.values(p).some(v => v !== null);

    // Sorted traits for summary
    const sorted = hasData
        ? Object.entries(p)
            .filter(([, v]) => v !== null)
            .sort((a, b) => b[1] - a[1])
        : [];

    const dominant = sorted[0]?.[0];
    const weakest = sorted[sorted.length - 1]?.[0];

    return (
        <div className="min-h-screen text-white" style={{ background: "#0d0d1a" }}>

            {/* Mobile top bar */}
            <div className="lg:hidden sticky top-0 z-50 flex items-center gap-3 px-4 py-3"
                style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <button onClick={() => navigate(-1)} className="p-2 text-slate-500 hover:text-white">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                    Personality Report
                </span>
            </div>

            <div className="flex">
                <Sidebar user={user} logout={logout} navigate={navigate} location={location} />

                <main className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="sticky top-0 z-40 px-6 py-4 flex items-center gap-3"
                        style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <button onClick={() => navigate(-1)}
                            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <Brain className="w-4 h-4 text-indigo-400" />
                        <h1 className="text-base font-bold text-white">Personality Report</h1>
                    </div>

                    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 pb-24 lg:pb-8 space-y-6">

                        {!hasData ? (
                            /* No data state */
                            <div className="text-center py-20 rounded-2xl"
                                style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <Brain className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                <p className="text-white font-semibold mb-2">No personality data yet</p>
                                <p className="text-slate-600 text-sm mb-6">Take the quiz or post more memories so AI can build your profile</p>
                                <button onClick={() => navigate("/onboarding")}
                                    className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
                                    style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                                    Take the Quiz
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Summary banner */}
                                <motion.div className="rounded-2xl p-5"
                                    style={{ background: "linear-gradient(135deg,rgba(79,70,229,0.2),rgba(124,58,237,0.15))", border: "1px solid rgba(99,102,241,0.2)" }}
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)" }}>
                                            <Sparkles className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm mb-1">Your Personality Summary</p>
                                            <p className="text-slate-400 text-xs leading-relaxed">
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

                                {/* 5 trait cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.keys(TRAIT_INFO).map((key, i) => (
                                        <BigRing key={key} traitKey={key} score={p[key]} delay={i * 0.1} />
                                    ))}
                                </div>

                                {/* Retake quiz */}
                                <motion.div className="rounded-2xl p-5 flex items-center justify-between"
                                    style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                                    <div>
                                        <p className="text-white text-sm font-semibold">Update your personality</p>
                                        <p className="text-slate-600 text-xs mt-0.5">Retake the quiz to refresh your scores</p>
                                    </div>
                                    <button onClick={() => navigate("/onboarding")}
                                        className="px-4 py-2 rounded-xl text-white text-xs font-semibold flex-shrink-0 transition-all"
                                        style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
                                        Retake Quiz
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </div>
                </main>
            </div>

            {/* Mobile bottom nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-white/[0.05] px-2 py-2 z-50"
                style={{ background: "#0d0d1a" }}>
                <div className="flex items-center justify-around max-w-sm mx-auto">
                    {[
                        { icon: HomeIcon, path: "/" },
                        { icon: () => <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>, path: "/search" },
                        { icon: Plus, path: "/create", fab: true },
                        { icon: Bell, path: "/notifications" },
                        { icon: UserIcon, path: "/profile" },
                    ].map(({ icon: Icon, path, fab }) => (
                        <button key={path} onClick={() => navigate(path)}
                            className={fab
                                ? "w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg"
                                : `p-2.5 rounded-xl transition-colors ${location.pathname === path ? "text-indigo-400 bg-indigo-400/10" : "text-slate-500 hover:text-white"}`}>
                            <Icon className="w-5 h-5" />
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default PersonalityPage;