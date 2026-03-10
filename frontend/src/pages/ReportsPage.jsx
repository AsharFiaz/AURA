import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Cell,
} from "recharts";
import {
    BarChart2, ArrowLeft, Heart, MessageCircle,
    Image, Users, Sparkles, TrendingUp,
    Home as HomeIcon, Compass, ShoppingBag, Mail,
    Bell, Bookmark, User as UserIcon, Plus, LogOut,
} from "lucide-react";

// ─── Emotion colours (consistent with rest of app) ────────────────────────────
const EMOTION_COLORS = [
    "#8b5cf6", "#3b82f6", "#f59e0b",
    "#10b981", "#ef4444", "#ec4899",
    "#06b6d4", "#f97316",
];

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

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, delay }) => (
    <motion.div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
    >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
            <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
            <p className="text-slate-500 text-xs mb-0.5">{label}</p>
            <p className="text-white text-2xl font-bold">{value ?? "—"}</p>
        </div>
    </motion.div>
);

// ─── Custom tooltip for bar chart ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="px-3 py-2 rounded-xl text-xs text-white"
            style={{ background: "#1e1e3a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="font-semibold">{payload[0].payload.emotion}</p>
            <p className="text-slate-400">{payload[0].value} {payload[0].value === 1 ? "memory" : "memories"}</p>
        </div>
    );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const ReportsPage = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => { fetchReport(); }, []);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const r = await api.get("/users/me/report");
            if (r.data.success) setReport(r.data.report);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const statCards = report ? [
        { icon: Image, label: "Memories Posted", value: report.totalMemories, color: "#8b5cf6" },
        { icon: Heart, label: "Total Likes", value: report.totalLikes, color: "#ef4444" },
        { icon: MessageCircle, label: "Total Comments", value: report.totalComments, color: "#3b82f6" },
        {
            icon: Users, label: "Total Followers",
            value: user?.followers?.length || 0,
            color: "#10b981"
        },
    ] : [];

    return (
        <div className="min-h-screen text-white" style={{ background: "#0d0d1a" }}>

            {/* Mobile top bar */}
            <div className="lg:hidden sticky top-0 z-50 flex items-center gap-3 px-4 py-3"
                style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <button onClick={() => navigate(-1)} className="p-2 text-slate-500 hover:text-white">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                    My Report
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
                        <BarChart2 className="w-4 h-4 text-indigo-400" />
                        <h1 className="text-base font-bold text-white">My Report</h1>
                    </div>

                    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 pb-24 lg:pb-8 space-y-6">

                        {loading ? (
                            /* Skeleton */
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="h-24 rounded-2xl animate-pulse"
                                            style={{ background: "#13132a" }} />
                                    ))}
                                </div>
                                <div className="h-64 rounded-2xl animate-pulse" style={{ background: "#13132a" }} />
                            </div>
                        ) : !report ? (
                            <div className="text-center py-20 rounded-2xl"
                                style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <BarChart2 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm">Could not load report. Try again later.</p>
                            </div>
                        ) : (
                            <>
                                {/* ── Stat cards ── */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {statCards.map((s, i) => (
                                        <StatCard key={s.label} {...s} delay={i * 0.07} />
                                    ))}
                                </div>

                                {/* ── Emotion tags bar chart ── */}
                                <motion.div className="rounded-2xl p-6"
                                    style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                    <div className="flex items-center gap-2 mb-5">
                                        <Sparkles className="w-4 h-4 text-indigo-400" />
                                        <h2 className="text-white font-bold text-sm">Most Used Emotion Tags</h2>
                                    </div>
                                    {report.topEmotions?.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={report.topEmotions} barCategoryGap="30%">
                                                <XAxis dataKey="emotion" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                                                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                                    {report.topEmotions.map((_, i) => (
                                                        <Cell key={i} fill={EMOTION_COLORS[i % EMOTION_COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p className="text-slate-600 text-sm text-center py-10">
                                            No emotion tags on your memories yet.
                                        </p>
                                    )}
                                </motion.div>

                                {/* ── Memories by month ── */}
                                <motion.div className="rounded-2xl p-6"
                                    style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                                    <div className="flex items-center gap-2 mb-5">
                                        <TrendingUp className="w-4 h-4 text-green-400" />
                                        <h2 className="text-white font-bold text-sm">Memories Posted — Last 6 Months</h2>
                                    </div>
                                    {report.memoriesByMonth?.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={180}>
                                            <BarChart data={report.memoriesByMonth} barCategoryGap="35%">
                                                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                                                <Tooltip content={({ active, payload }) => {
                                                    if (!active || !payload?.length) return null;
                                                    return (
                                                        <div className="px-3 py-2 rounded-xl text-xs text-white"
                                                            style={{ background: "#1e1e3a", border: "1px solid rgba(255,255,255,0.1)" }}>
                                                            <p className="font-semibold">{payload[0].payload.month}</p>
                                                            <p className="text-slate-400">{payload[0].value} {payload[0].value === 1 ? "memory" : "memories"}</p>
                                                        </div>
                                                    );
                                                }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                                                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#10b981" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p className="text-slate-600 text-sm text-center py-8">No memories data yet.</p>
                                    )}
                                </motion.div>

                                {/* ── Top memory ── */}
                                {report.topMemory && (
                                    <motion.div className="rounded-2xl p-5 flex items-center gap-4"
                                        style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
                                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                                        {report.topMemory.image && (
                                            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                                <img src={report.topMemory.image} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                                                <span className="text-yellow-400 text-xs font-semibold">Most Liked Memory</span>
                                            </div>
                                            <p className="text-white text-sm font-medium line-clamp-2">{report.topMemory.caption}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-red-400 flex-shrink-0">
                                            <Heart className="w-4 h-4 fill-red-400" />
                                            <span className="text-white font-bold text-sm">{report.topMemory.likesCount}</span>
                                        </div>
                                    </motion.div>
                                )}
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

export default ReportsPage;