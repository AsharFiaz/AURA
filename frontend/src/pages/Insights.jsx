import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import {
    LineChart, Line, BarChart, Bar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis,
    Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import {
    Activity, Sparkles, TrendingUp, TrendingDown, Eye, Heart,
    MessageCircle, UserCircle, Bookmark as BookmarkIcon,
    Maximize2, Flame, Zap, Calendar, Users, ArrowUp, ArrowDown,
    Minus, Target,
} from "lucide-react";
import AnimatedBackdrop from "../components/common/AnimatedBackdrop";
import BombasticSidebar from "../components/common/BombasticSidebar";
import CommandBar from "../components/common/CommandBar";
import MobileTopBar from "../components/common/MobileTopBar";
import MobileBottomNav from "../components/common/MobileBottomNav";

// ─── Trait config ────────────────────────────────────────────────────────────
const TRAIT_INFO = {
    O: { label: "Openness", color: "#a78bfa", short: "O" },
    C: { label: "Conscientiousness", color: "#818cf8", short: "C" },
    E: { label: "Extraversion", color: "#fbbf24", short: "E" },
    A: { label: "Agreeableness", color: "#34d399", short: "A" },
    N: { label: "Neuroticism", color: "#f87171", short: "N" },
};

const TYPE_INFO = {
    view: { label: "Views", icon: Eye, color: "#94a3b8" },
    like: { label: "Likes", icon: Heart, color: "#f87171" },
    comment: { label: "Comments", icon: MessageCircle, color: "#818cf8" },
    profile_visit: { label: "Profile Visits", icon: UserCircle, color: "#34d399" },
    bookmark: { label: "Bookmarks", icon: BookmarkIcon, color: "#fbbf24" },
    expand: { label: "Expansions", icon: Maximize2, color: "#a78bfa" },
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Small UI primitives ─────────────────────────────────────────────────────
const Card = ({ children, className = "", style = {}, delay = 0, ...rest }) => (
    <motion.div
        className={`rounded-2xl relative overflow-hidden ${className}`}
        style={{
            background: "rgba(19,19,42,0.7)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(167,139,250,0.1)",
            ...style,
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        {...rest}
    >
        {children}
    </motion.div>
);

const PulseDot = ({ color = "#a78bfa", className = "" }) => (
    <motion.span
        className={`w-1.5 h-1.5 rounded-full ${className}`}
        style={{ background: color }}
        animate={{ boxShadow: [`0 0 0px ${color}`, `0 0 8px ${color}`, `0 0 0px ${color}`] }}
        transition={{ duration: 2, repeat: Infinity }}
    />
);

const SectionHeader = ({ icon: Icon, title, subtitle, color = "#a78bfa" }) => (
    <div className="flex items-center gap-2 mb-4">
        {Icon && (
            <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                <Icon className="w-4 h-4" style={{ color }} />
            </motion.div>
        )}
        <div>
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <PulseDot color={color} />
                {title}
            </h2>
            {subtitle && <p className="text-slate-600 text-xs mt-0.5">{subtitle}</p>}
        </div>
    </div>
);

// ─── Tooltips ────────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="px-3 py-2 rounded-xl text-xs"
            style={{
                background: "rgba(19,19,42,0.95)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(167,139,250,0.3)",
                boxShadow: "0 4px 20px rgba(124,58,237,0.2)",
            }}>
            {label && <p className="text-white font-semibold mb-1">{label}</p>}
            {payload.map((p, i) => (
                <p key={i} className="text-slate-300" style={{ color: p.color || p.fill }}>
                    {p.name || p.dataKey}: <span className="font-mono font-semibold">
                        {typeof p.value === "number" ? p.value.toFixed(3) : p.value}
                    </span>
                </p>
            ))}
        </div>
    );
};

// ─── Main page ───────────────────────────────────────────────────────────────
const Insights = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [range, setRange] = useState("month");
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const fetch = async () => {
            try {
                setLoading(true);
                setError(null);
                const r = await api.get(`/users/me/insights?range=${range}`);
                if (cancelled) return;
                if (r.data.success) setInsights(r.data.insights);
                else setError("Could not load insights");
            } catch (e) {
                if (!cancelled) setError(e.response?.data?.message || "Failed to load insights");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetch();
        return () => { cancelled = true; };
    }, [range]);

    // ── Derived data for charts ─────────────────────────────────────────────
    const evolutionChartData = useMemo(() => {
        if (!insights?.vectorEvolution) return [];
        return insights.vectorEvolution.map(h => ({
            date: new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            ts: new Date(h.date).getTime(),
            ...h.vector,
        }));
    }, [insights]);

    const radarChartData = useMemo(() => {
        if (!insights) return [];
        const onboarding = insights.vectorEvolution[0]?.vector || null;
        const current = insights.currentVector;
        return Object.keys(TRAIT_INFO).map(k => ({
            trait: TRAIT_INFO[k].label,
            shortKey: k,
            current: current?.[k] ?? 0,
            onboarding: onboarding?.[k] ?? 0,
        }));
    }, [insights]);

    const consumptionPieData = useMemo(() => {
        if (!insights?.traitConsumption) return [];
        return Object.entries(insights.traitConsumption)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => ({
                name: TRAIT_INFO[k].label,
                value: v,
                trait: k,
                color: TRAIT_INFO[k].color,
            }));
    }, [insights]);

    const engagementBarData = useMemo(() => {
        if (!insights?.byType) return [];
        return Object.entries(insights.byType)
            .filter(([, v]) => v > 0)
            .map(([type, count]) => ({
                type,
                label: TYPE_INFO[type]?.label || type,
                count,
                color: TYPE_INFO[type]?.color || "#94a3b8",
            }));
    }, [insights]);

    const driftBars = useMemo(() => {
        if (!insights?.driftSinceOnboarding) return [];
        return Object.entries(insights.driftSinceOnboarding).map(([k, v]) => ({
            trait: k,
            label: TRAIT_INFO[k].label,
            color: TRAIT_INFO[k].color,
            delta: v,
        }));
    }, [insights]);

    const heatmapMax = useMemo(() => {
        if (!insights?.hourlyHeatmap) return 0;
        return Math.max(0, ...insights.hourlyHeatmap.flat());
    }, [insights]);

    const totalInteractions = insights?.totalInteractions || 0;
    const isEmpty = !loading && totalInteractions === 0 && !insights?.currentVector;

    return (
        <div className="min-h-screen text-white relative">
            <AnimatedBackdrop />

            <MobileTopBar title="Insights" icon={Activity} />

            <div className="flex relative">
                <BombasticSidebar />

                <main className="flex-1 min-w-0">
                    <CommandBar isLive={!loading} />

                    <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6 pb-24 lg:pb-8 space-y-6">

                        {/* ── Page header ─────────────────────────────────── */}
                        <motion.div className="hidden lg:flex items-center justify-between"
                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="flex items-center gap-3">
                                <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                                    <Activity className="w-5 h-5 text-violet-400" />
                                </motion.div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-transparent">
                                    Insights
                                </h1>
                                <span className="text-xs text-slate-500 uppercase tracking-widest ml-1">Personality Monitor</span>
                            </div>

                            {/* Range tabs */}
                            <div className="flex items-center gap-1 p-1 rounded-xl"
                                style={{ background: "rgba(19,19,42,0.8)", border: "1px solid rgba(167,139,250,0.15)" }}>
                                {[
                                    { k: "week", label: "Week" },
                                    { k: "month", label: "Month" },
                                    { k: "all", label: "All Time" },
                                ].map(({ k, label }) => (
                                    <motion.button key={k} onClick={() => setRange(k)}
                                        className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-colors z-10 ${range === k ? "text-white" : "text-slate-400 hover:text-white"}`}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}>
                                        {range === k && (
                                            <motion.div className="absolute inset-0 rounded-lg -z-10"
                                                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 16px rgba(124,58,237,0.4)" }}
                                                layoutId="rangeIndicator"
                                                transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                                        )}
                                        {label}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>

                        {/* Mobile range selector */}
                        <div className="lg:hidden flex gap-1 p-1 rounded-xl"
                            style={{ background: "rgba(19,19,42,0.8)", border: "1px solid rgba(167,139,250,0.15)" }}>
                            {[
                                { k: "week", label: "Week" },
                                { k: "month", label: "Month" },
                                { k: "all", label: "All" },
                            ].map(({ k, label }) => (
                                <button key={k} onClick={() => setRange(k)}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${range === k ? "bg-violet-500/20 text-white" : "text-slate-400"}`}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* ── Loading skeleton ────────────────────────────── */}
                        {loading && (
                            <div className="space-y-4">
                                {[...Array(4)].map((_, i) => (
                                    <motion.div key={i} className="h-48 rounded-2xl"
                                        style={{ background: "rgba(19,19,42,0.4)", border: "1px solid rgba(167,139,250,0.05)" }}
                                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }} />
                                ))}
                            </div>
                        )}

                        {/* ── Empty / no personality state ───────────────── */}
                        {!loading && isEmpty && (
                            <Card className="text-center py-20">
                                <motion.div className="inline-block mb-4"
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}>
                                    <Activity className="w-12 h-12 text-violet-500/50" />
                                </motion.div>
                                <p className="text-white font-semibold mb-2">No insights yet</p>
                                <p className="text-slate-500 text-sm mb-6">
                                    Take the personality quiz and engage with your feed for a few days to unlock insights
                                </p>
                                <motion.button onClick={() => navigate("/onboarding")}
                                    className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold relative overflow-hidden"
                                    style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 20px rgba(79,70,229,0.4)" }}
                                    whileHover={{ scale: 1.05, boxShadow: "0 4px 32px rgba(124,58,237,0.6)" }}
                                    whileTap={{ scale: 0.97 }}>
                                    <motion.div className="absolute inset-0"
                                        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
                                        animate={{ x: ["-100%", "100%"] }}
                                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }} />
                                    <span className="relative">Take the Quiz</span>
                                </motion.button>
                            </Card>
                        )}

                        {/* ── Error ─────────────────────────────────────── */}
                        {!loading && error && (
                            <Card className="p-6 text-center">
                                <p className="text-red-300 text-sm">{error}</p>
                            </Card>
                        )}

                        {/* ── Main content ──────────────────────────────── */}
                        {!loading && insights && !isEmpty && (
                            <>

                                {/* ─── HERO: Archetype + Narrative ────────── */}
                                <motion.div
                                    className="rounded-2xl p-6 relative overflow-hidden"
                                    style={{
                                        background: "linear-gradient(135deg,rgba(79,70,229,0.2),rgba(124,58,237,0.15),rgba(236,72,153,0.1))",
                                        backdropFilter: "blur(10px)",
                                        border: "1px solid rgba(167,139,250,0.25)",
                                    }}
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

                                    <motion.div className="absolute inset-0 opacity-30 pointer-events-none"
                                        style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.06), transparent)" }}
                                        animate={{ x: ["-100%", "100%"] }}
                                        transition={{ duration: 5, repeat: Infinity, repeatDelay: 3 }} />

                                    <PulseDot color="#a78bfa" className="absolute top-3 right-3" />

                                    <div className="flex items-start gap-5 relative">
                                        <motion.div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.3)" }}
                                            animate={{ boxShadow: ["0 0 16px rgba(167,139,250,0.3)", "0 0 32px rgba(167,139,250,0.6)", "0 0 16px rgba(167,139,250,0.3)"] }}
                                            transition={{ duration: 2.5, repeat: Infinity }}>
                                            <Sparkles className="w-8 h-8 text-violet-300" />
                                        </motion.div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-violet-300 text-xs uppercase tracking-widest mb-1">You are currently</p>
                                            <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-indigo-100 to-violet-200 bg-clip-text text-transparent mb-2">
                                                The {insights.archetype.label}
                                            </h2>
                                            <p className="text-slate-300 text-sm leading-relaxed mb-3">{insights.archetype.desc}</p>
                                            <p className="text-slate-400 text-xs leading-relaxed border-l-2 pl-3"
                                                style={{ borderColor: "rgba(167,139,250,0.4)" }}>
                                                {insights.narrative}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* ─── Quick stats row ─────────────────────── */}
                                <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3"
                                    initial="hidden" animate="visible"
                                    variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}>
                                    {[
                                        { icon: Activity, label: "Interactions", value: totalInteractions, color: "#a78bfa" },
                                        {
                                            icon: Target, label: "Top Trait",
                                            value: insights.topTrait ? TRAIT_INFO[insights.topTrait].label : "—",
                                            color: insights.topTrait ? TRAIT_INFO[insights.topTrait].color : "#64748b",
                                        },
                                        {
                                            icon: Flame, label: "Streak",
                                            value: insights.streak ? `${insights.streak} day${insights.streak === 1 ? "" : "s"}` : "—",
                                            color: "#fbbf24",
                                        },
                                        {
                                            icon: Zap, label: "Alignment",
                                            value: insights.alignmentRatio !== null ? `${Math.round(insights.alignmentRatio * 100)}%` : "—",
                                            color: "#34d399",
                                        },
                                    ].map((s, i) => (
                                        <motion.div key={s.label}
                                            className="rounded-2xl p-4 relative overflow-hidden"
                                            style={{
                                                background: "rgba(19,19,42,0.7)",
                                                backdropFilter: "blur(10px)",
                                                border: "1px solid rgba(167,139,250,0.1)",
                                            }}
                                            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                                            whileHover={{ scale: 1.03, borderColor: `${s.color}66`, boxShadow: `0 0 24px ${s.color}30` }}>
                                            <PulseDot color={s.color} className="absolute top-3 right-3" />
                                            <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
                                            <p className="text-slate-500 text-xs uppercase tracking-widest mb-0.5">{s.label}</p>
                                            <p className="text-white text-xl font-bold">{s.value}</p>
                                        </motion.div>
                                    ))}
                                </motion.div>

                                {/* ─── Vector Evolution ───────────────────── */}
                                {evolutionChartData.length >= 2 && (
                                    <Card className="p-6" delay={0.1}>
                                        <PulseDot color="#a78bfa" className="absolute top-4 right-4" />
                                        <SectionHeader
                                            icon={TrendingUp}
                                            title="Vector Evolution"
                                            subtitle="How your traits have shifted over time"
                                            color="#a78bfa"
                                        />
                                        <ResponsiveContainer width="100%" height={240}>
                                            <LineChart data={evolutionChartData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                                                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <YAxis domain={[0, 1]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                                                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(167,139,250,0.2)" }} />
                                                {Object.keys(TRAIT_INFO).map(k => (
                                                    <Line key={k} type="monotone" dataKey={k} stroke={TRAIT_INFO[k].color}
                                                        strokeWidth={2} dot={{ r: 3, fill: TRAIT_INFO[k].color }}
                                                        activeDot={{ r: 5 }} name={TRAIT_INFO[k].label} />
                                                ))}
                                            </LineChart>
                                        </ResponsiveContainer>
                                        <div className="flex flex-wrap gap-3 mt-3 justify-center">
                                            {Object.keys(TRAIT_INFO).map(k => (
                                                <div key={k} className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full" style={{ background: TRAIT_INFO[k].color }} />
                                                    <span className="text-slate-500 text-[10px] uppercase tracking-wider">{TRAIT_INFO[k].label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}

                                {/* ─── Onboarding vs Now Radar ─────────────── */}
                                <Card className="p-6" delay={0.15}>
                                    <PulseDot color="#818cf8" className="absolute top-4 right-4" />
                                    <SectionHeader
                                        icon={Activity}
                                        title="Then vs. Now"
                                        subtitle="Your starting point compared to today"
                                        color="#818cf8"
                                    />
                                    <ResponsiveContainer width="100%" height={280}>
                                        <RadarChart data={radarChartData}>
                                            <PolarGrid stroke="rgba(167,139,250,0.15)" />
                                            <PolarAngleAxis dataKey="trait"
                                                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }} />
                                            <PolarRadiusAxis domain={[0, 1]}
                                                tick={{ fill: "#475569", fontSize: 9 }}
                                                axisLine={false} />
                                            <Radar name="Onboarding" dataKey="onboarding"
                                                stroke="#64748b" fill="#64748b" fillOpacity={0.2} strokeWidth={1.5} />
                                            <Radar name="Current" dataKey="current"
                                                stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.35} strokeWidth={2} />
                                            <Tooltip content={<ChartTooltip />} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                    <div className="flex justify-center gap-4 text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-3 h-3 rounded-full bg-slate-500" />
                                            <span className="text-slate-500">Onboarding</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-3 h-3 rounded-full bg-violet-400" />
                                            <span className="text-slate-300">Current</span>
                                        </div>
                                    </div>
                                </Card>

                                {/* ─── Drift bars ─────────────────────────── */}
                                {driftBars.some(d => d.delta !== 0) && (
                                    <Card className="p-6" delay={0.18}>
                                        <PulseDot color="#34d399" className="absolute top-4 right-4" />
                                        <SectionHeader
                                            icon={TrendingUp}
                                            title="Drift Since Onboarding"
                                            subtitle="How much each trait has shifted"
                                            color="#34d399"
                                        />
                                        <div className="space-y-3">
                                            {driftBars.map(d => {
                                                const pct = Math.abs(d.delta * 100);
                                                const dir = d.delta > 0.005 ? "up" : d.delta < -0.005 ? "down" : "flat";
                                                const Icon = dir === "up" ? ArrowUp : dir === "down" ? ArrowDown : Minus;
                                                return (
                                                    <div key={d.trait}>
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="text-slate-300 text-xs font-semibold">{d.label}</span>
                                                            <div className="flex items-center gap-1.5">
                                                                <Icon className="w-3 h-3" style={{
                                                                    color: dir === "up" ? "#34d399" : dir === "down" ? "#f87171" : "#64748b",
                                                                }} />
                                                                <span className="text-white text-xs font-mono font-semibold">
                                                                    {d.delta >= 0 ? "+" : ""}{(d.delta * 100).toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="h-1.5 rounded-full overflow-hidden relative"
                                                            style={{ background: "rgba(255,255,255,0.05)" }}>
                                                            {/* Center marker */}
                                                            <span className="absolute top-0 bottom-0 w-px"
                                                                style={{ left: "50%", background: "rgba(255,255,255,0.15)" }} />
                                                            <motion.div className="h-full absolute"
                                                                style={{
                                                                    background: d.color,
                                                                    boxShadow: `0 0 8px ${d.color}`,
                                                                    [d.delta >= 0 ? "left" : "right"]: "50%",
                                                                }}
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.min(pct * 2, 50)}%` }}
                                                                transition={{ duration: 1, ease: "easeOut" }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Card>
                                )}

                                {/* ─── Trait consumption + Engagement breakdown ─── */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                                    {/* Trait consumption */}
                                    {consumptionPieData.length > 0 && (
                                        <Card className="p-6" delay={0.2}>
                                            <PulseDot color="#a78bfa" className="absolute top-4 right-4" />
                                            <SectionHeader
                                                icon={Target}
                                                title="Traits You Consumed"
                                                subtitle="Personality of content you engaged with"
                                                color="#a78bfa"
                                            />
                                            <ResponsiveContainer width="100%" height={200}>
                                                <PieChart>
                                                    <Pie data={consumptionPieData} dataKey="value" nameKey="name"
                                                        cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                                        paddingAngle={3}>
                                                        {consumptionPieData.map((entry, i) => (
                                                            <Cell key={i} fill={entry.color} stroke="rgba(13,13,26,0.5)" strokeWidth={2} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<ChartTooltip />} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="space-y-1.5 mt-2">
                                                {consumptionPieData.map(d => (
                                                    <div key={d.name} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                                                            <span className="text-slate-300 text-xs">{d.name}</span>
                                                        </div>
                                                        <span className="text-white text-xs font-mono">{Math.round(d.value * 100)}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    )}

                                    {/* Engagement breakdown */}
                                    {engagementBarData.length > 0 && (
                                        <Card className="p-6" delay={0.22}>
                                            <PulseDot color="#34d399" className="absolute top-4 right-4" />
                                            <SectionHeader
                                                icon={Activity}
                                                title="Engagement Breakdown"
                                                subtitle={`Total: ${totalInteractions} interactions`}
                                                color="#34d399"
                                            />
                                            <div className="space-y-3">
                                                {engagementBarData.map((d, i) => {
                                                    const max = Math.max(...engagementBarData.map(x => x.count));
                                                    const Icon = TYPE_INFO[d.type]?.icon || Activity;
                                                    return (
                                                        <motion.div key={d.type}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.3 + i * 0.05 }}>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <div className="flex items-center gap-2">
                                                                    <Icon className="w-3.5 h-3.5" style={{ color: d.color }} />
                                                                    <span className="text-slate-300 text-xs">{d.label}</span>
                                                                </div>
                                                                <span className="text-white text-xs font-mono font-semibold">{d.count}</span>
                                                            </div>
                                                            <div className="h-1.5 rounded-full overflow-hidden"
                                                                style={{ background: "rgba(255,255,255,0.05)" }}>
                                                                <motion.div className="h-full rounded-full"
                                                                    style={{ background: d.color, boxShadow: `0 0 8px ${d.color}` }}
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${(d.count / max) * 100}%` }}
                                                                    transition={{ duration: 0.8, delay: 0.4 + i * 0.05 }} />
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </Card>
                                    )}
                                </div>

                                {/* ─── Activity Heatmap ───────────────────── */}
                                {heatmapMax > 0 && (
                                    <Card className="p-6" delay={0.25}>
                                        <PulseDot color="#fbbf24" className="absolute top-4 right-4" />
                                        <SectionHeader
                                            icon={Calendar}
                                            title="When You're Active"
                                            subtitle="Day-of-week × hour-of-day pattern"
                                            color="#fbbf24"
                                        />
                                        <div className="overflow-x-auto -mx-2 px-2">
                                            <div className="min-w-[600px]">
                                                {/* Hour labels */}
                                                <div className="flex items-center gap-[2px] mb-1 ml-10">
                                                    {Array.from({ length: 24 }).map((_, h) => (
                                                        <div key={h} className="flex-1 text-center text-[8px] text-slate-700">
                                                            {h % 6 === 0 ? `${h}h` : ""}
                                                        </div>
                                                    ))}
                                                </div>
                                                {insights.hourlyHeatmap.map((dayRow, day) => (
                                                    <div key={day} className="flex items-center gap-[2px] mb-[2px]">
                                                        <span className="w-8 text-[10px] text-slate-500 text-right pr-2">{DAY_NAMES[day]}</span>
                                                        {dayRow.map((count, hr) => {
                                                            const intensity = heatmapMax > 0 ? count / heatmapMax : 0;
                                                            return (
                                                                <motion.div
                                                                    key={hr}
                                                                    className="flex-1 h-5 rounded-sm"
                                                                    style={{
                                                                        background: count === 0
                                                                            ? "rgba(255,255,255,0.03)"
                                                                            : `rgba(167,139,250,${0.2 + intensity * 0.7})`,
                                                                        boxShadow: intensity > 0.5 ? `0 0 6px rgba(167,139,250,${intensity * 0.5})` : "none",
                                                                    }}
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    transition={{ delay: 0.3 + (day * 24 + hr) * 0.002 }}
                                                                    title={`${DAY_NAMES[day]} ${hr}:00 — ${count} interaction${count === 1 ? "" : "s"}`}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3 text-xs text-slate-600">
                                            <span>Less</span>
                                            <div className="flex gap-[2px]">
                                                {[0.05, 0.25, 0.5, 0.75, 1].map(v => (
                                                    <span key={v} className="w-3 h-3 rounded-sm"
                                                        style={{ background: `rgba(167,139,250,${0.2 + v * 0.7})` }} />
                                                ))}
                                            </div>
                                            <span>More</span>
                                        </div>
                                    </Card>
                                )}

                                {/* ─── Behavioral correlations ────────────── */}
                                {insights.correlations?.length > 0 && (
                                    <Card className="p-6" delay={0.28}>
                                        <PulseDot color="#ec4899" className="absolute top-4 right-4" />
                                        <SectionHeader
                                            icon={Zap}
                                            title="Your Behavioral Patterns"
                                            subtitle="What you do when content matches certain traits"
                                            color="#ec4899"
                                        />
                                        <div className="space-y-2">
                                            {insights.correlations.slice(0, 4).map((c, i) => {
                                                const traitColor = TRAIT_INFO[c.trait]?.color || "#a78bfa";
                                                return (
                                                    <motion.div key={`${c.trait}-${c.type}`}
                                                        className="rounded-xl p-3 flex items-start gap-3"
                                                        style={{
                                                            background: `${traitColor}10`,
                                                            border: `1px solid ${traitColor}25`,
                                                        }}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.35 + i * 0.05 }}>
                                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                                            style={{ background: `${traitColor}20`, color: traitColor }}>
                                                            {c.trait}
                                                        </div>
                                                        <p className="text-slate-300 text-xs leading-relaxed flex-1">{c.text}</p>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </Card>
                                )}

                                {/* ─── Influential authors ────────────────── */}
                                {insights.influentialAuthors?.length > 0 && (
                                    <Card className="p-6" delay={0.3}>
                                        <PulseDot color="#34d399" className="absolute top-4 right-4" />
                                        <SectionHeader
                                            icon={Users}
                                            title="Most Influential Voices"
                                            subtitle="Whose content has shaped you most this period"
                                            color="#34d399"
                                        />
                                        <div className="space-y-2">
                                            {insights.influentialAuthors.map((a, i) => {
                                                const max = insights.influentialAuthors[0].influenceScore || 1;
                                                const pct = (a.influenceScore / max) * 100;
                                                return (
                                                    <motion.button key={a.id}
                                                        onClick={() => navigate(`/user/${a.id}`)}
                                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left"
                                                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.35 + i * 0.05 }}
                                                        whileHover={{ scale: 1.01, borderColor: "rgba(167,139,250,0.25)" }}>
                                                        <div className="text-xs font-bold text-slate-600 w-5 text-center">#{i + 1}</div>
                                                        <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                                            {a.profilePicture
                                                                ? <img src={a.profilePicture} alt={a.username} className="w-full h-full object-cover" />
                                                                : a.username?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white text-xs font-semibold truncate">{a.username}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <div className="flex-1 h-1 rounded-full overflow-hidden"
                                                                    style={{ background: "rgba(255,255,255,0.05)" }}>
                                                                    <motion.div className="h-full"
                                                                        style={{ background: "linear-gradient(90deg, #a78bfa, #ec4899)" }}
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${pct}%` }}
                                                                        transition={{ duration: 0.8, delay: 0.4 + i * 0.05 }} />
                                                                </div>
                                                                <span className="text-slate-600 text-[10px] flex-shrink-0">
                                                                    {a.memoryCount} memor{a.memoryCount === 1 ? "y" : "ies"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </Card>
                                )}

                                {/* ─── Retake quiz CTA ────────────────────── */}
                                <motion.div className="rounded-2xl p-5 flex items-center justify-between"
                                    style={{
                                        background: "rgba(19,19,42,0.7)",
                                        backdropFilter: "blur(10px)",
                                        border: "1px solid rgba(167,139,250,0.1)",
                                    }}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                                    whileHover={{ borderColor: "rgba(167,139,250,0.3)" }}>
                                    <div>
                                        <p className="text-white text-sm font-semibold">Recalibrate your baseline</p>
                                        <p className="text-slate-500 text-xs mt-0.5">Retake the quiz to reset your starting point</p>
                                    </div>
                                    <motion.button onClick={() => navigate("/onboarding")}
                                        className="px-4 py-2 rounded-xl text-white text-xs font-semibold flex-shrink-0 flex items-center gap-1.5"
                                        style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(167,139,250,0.4)" }}
                                        whileHover={{ scale: 1.05, background: "rgba(124,58,237,0.3)", boxShadow: "0 0 16px rgba(124,58,237,0.4)" }}
                                        whileTap={{ scale: 0.97 }}>
                                        Retake Quiz
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

export default Insights;