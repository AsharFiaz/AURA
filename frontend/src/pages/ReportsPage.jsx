import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Cell,
} from "recharts";
import {
    BarChart2, Heart, MessageCircle,
    Image, Users, Sparkles, TrendingUp,
} from "lucide-react";
import AnimatedBackdrop from "../components/common/AnimatedBackdrop";
import BombasticSidebar from "../components/common/BombasticSidebar";
import CommandBar from "../components/common/CommandBar";
import MobileTopBar from "../components/common/MobileTopBar";
import MobileBottomNav from "../components/common/MobileBottomNav";

const EMOTION_COLORS = [
    "#a78bfa", "#818cf8", "#fbbf24", "#34d399",
    "#f87171", "#f472b6", "#22d3ee", "#fb923c",
];

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
    <motion.div
        className="rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden"
        style={{
            background: "rgba(19,19,42,0.7)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(167,139,250,0.1)",
        }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        whileHover={{ scale: 1.02, borderColor: `${color}66`, boxShadow: `0 0 20px ${color}22` }}
    >
        <motion.div
            className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full"
            style={{ background: color }}
            animate={{ boxShadow: [`0 0 0px ${color}`, `0 0 12px ${color}`, `0 0 0px ${color}`] }}
            transition={{ duration: 2, repeat: Infinity, delay }}
        />
        <motion.div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}18`, border: `1px solid ${color}33` }}
            whileHover={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 0.5 }}
        >
            <Icon className="w-5 h-5" style={{ color }} />
        </motion.div>
        <div>
            <p className="text-slate-500 text-xs mb-0.5 uppercase tracking-widest">{label}</p>
            <motion.p className="text-white text-2xl font-bold"
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}>
                {value ?? "—"}
            </motion.p>
        </div>
    </motion.div>
);

const CustomTooltip = ({ active, payload, dataKey = "emotion" }) => {
    if (!active || !payload?.length) return null;
    const v = payload[0].value;
    return (
        <div className="px-3 py-2 rounded-xl text-xs text-white"
            style={{
                background: "rgba(19,19,42,0.95)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(167,139,250,0.3)",
                boxShadow: "0 4px 20px rgba(124,58,237,0.2)",
            }}>
            <p className="font-semibold">{payload[0].payload[dataKey]}</p>
            <p className="text-slate-400">{v} {v === 1 ? "memory" : "memories"}</p>
        </div>
    );
};

const ReportsPage = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

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
        { icon: Image, label: "Memories Posted", value: report.totalMemories, color: "#a78bfa" },
        { icon: Heart, label: "Total Likes", value: report.totalLikes, color: "#f87171" },
        { icon: MessageCircle, label: "Total Comments", value: report.totalComments, color: "#818cf8" },
        {
            icon: Users, label: "Total Followers",
            value: user?.followers?.length || 0,
            color: "#34d399"
        },
    ] : [];

    return (
        <div className="min-h-screen text-white relative">
            <AnimatedBackdrop />

            <MobileTopBar title="My Report" icon={BarChart2} />

            <div className="flex relative">
                <BombasticSidebar />

                <main className="flex-1 min-w-0">
                    <CommandBar isLive={!loading} />

                    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 pb-24 lg:pb-8 space-y-6">

                        <motion.div className="hidden lg:flex items-center gap-3 mb-2"
                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                            <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                                <BarChart2 className="w-5 h-5 text-indigo-400" />
                            </motion.div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-transparent">
                                My Report
                            </h1>
                            <span className="text-xs text-slate-500 uppercase tracking-widest ml-1">Activity Stats</span>
                        </motion.div>

                        {loading ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[...Array(4)].map((_, i) => (
                                        <motion.div key={i} className="h-24 rounded-2xl"
                                            style={{
                                                background: "rgba(19,19,42,0.4)",
                                                border: "1px solid rgba(167,139,250,0.05)",
                                            }}
                                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                                        />
                                    ))}
                                </div>
                                <motion.div className="h-64 rounded-2xl"
                                    style={{
                                        background: "rgba(19,19,42,0.4)",
                                        border: "1px solid rgba(167,139,250,0.05)",
                                    }}
                                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            </div>
                        ) : !report ? (
                            <div className="text-center py-20 rounded-2xl"
                                style={{
                                    background: "rgba(19,19,42,0.7)",
                                    backdropFilter: "blur(10px)",
                                    border: "1px solid rgba(167,139,250,0.1)",
                                }}>
                                <BarChart2 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm">Could not load report. Try again later.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {statCards.map((s, i) => (
                                        <StatCard key={s.label} {...s} delay={i * 0.07} />
                                    ))}
                                </div>

                                <motion.div className="rounded-2xl p-6 relative overflow-hidden"
                                    style={{
                                        background: "rgba(19,19,42,0.7)",
                                        backdropFilter: "blur(10px)",
                                        border: "1px solid rgba(167,139,250,0.1)",
                                    }}
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>

                                    <motion.div
                                        className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-violet-400"
                                        animate={{ boxShadow: ["0 0 0px #a78bfa", "0 0 12px #a78bfa", "0 0 0px #a78bfa"] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />

                                    <div className="flex items-center gap-2 mb-5">
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                                            <Sparkles className="w-4 h-4 text-violet-400" />
                                        </motion.div>
                                        <h2 className="text-white font-bold text-sm">Most Used Emotion Tags</h2>
                                    </div>
                                    {report.topEmotions?.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={report.topEmotions} barCategoryGap="30%">
                                                <XAxis dataKey="emotion" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                                                <Tooltip content={<CustomTooltip dataKey="emotion" />} cursor={{ fill: "rgba(167,139,250,0.05)" }} />
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

                                <motion.div className="rounded-2xl p-6 relative overflow-hidden"
                                    style={{
                                        background: "rgba(19,19,42,0.7)",
                                        backdropFilter: "blur(10px)",
                                        border: "1px solid rgba(167,139,250,0.1)",
                                    }}
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>

                                    <motion.div
                                        className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full"
                                        style={{ background: "#34d399" }}
                                        animate={{ boxShadow: ["0 0 0px #34d399", "0 0 12px #34d399", "0 0 0px #34d399"] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />

                                    <div className="flex items-center gap-2 mb-5">
                                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                                        <h2 className="text-white font-bold text-sm">Memories Posted — Last 6 Months</h2>
                                    </div>
                                    {report.memoriesByMonth?.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={180}>
                                            <BarChart data={report.memoriesByMonth} barCategoryGap="35%">
                                                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                                                <Tooltip content={<CustomTooltip dataKey="month" />} cursor={{ fill: "rgba(52,211,153,0.05)" }} />
                                                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#34d399" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p className="text-slate-600 text-sm text-center py-8">No memories data yet.</p>
                                    )}
                                </motion.div>

                                {report.topMemory && (
                                    <motion.div className="rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden"
                                        style={{
                                            background: "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(19,19,42,0.7))",
                                            backdropFilter: "blur(10px)",
                                            border: "1px solid rgba(251,191,36,0.2)",
                                        }}
                                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                        whileHover={{ scale: 1.01, borderColor: "rgba(251,191,36,0.4)" }}>

                                        <motion.div
                                            className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full"
                                            style={{ background: "#fbbf24" }}
                                            animate={{ boxShadow: ["0 0 0px #fbbf24", "0 0 12px #fbbf24", "0 0 0px #fbbf24"] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />

                                        {report.topMemory.image && (
                                            <motion.div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
                                                whileHover={{ scale: 1.08 }}>
                                                <img src={report.topMemory.image} alt="" className="w-full h-full object-cover" />
                                            </motion.div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                                                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                                </motion.div>
                                                <span className="text-amber-300 text-xs font-semibold uppercase tracking-widest">Most Liked Memory</span>
                                            </div>
                                            <p className="text-white text-sm font-medium line-clamp-2">{report.topMemory.caption}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-red-400 flex-shrink-0">
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            >
                                                <Heart className="w-4 h-4 fill-red-400" />
                                            </motion.div>
                                            <span className="text-white font-bold text-sm">{report.topMemory.likesCount}</span>
                                        </div>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>

            <MobileBottomNav />
        </div>
    );
};

export default ReportsPage;