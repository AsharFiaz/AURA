import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import api from "../utils/api";
import InfiniteScroll from "react-infinite-scroll-component";
import { MemoryCardSkeleton } from "../components/common/LoadingSkeleton";
import MemoryCard from "../components/common/MemoryCard";
import CommentModal from "../components/common/CommentModal";
import OrbField from "../components/common/orbfield/OrbField";
import { showSuccess, showError } from "../utils/toast";
import { useInteractionTracking } from "../hooks/useInteractionTracking";
import {
  Plus, Grid, Globe, Search, Bell, User, Home as HomeIcon,
  ShoppingBag, Mail, Image as ImageIcon, Smile, BarChart3,
  Compass, Heart, Bookmark,
  LogOut, Hash, Flame, Star, Activity, Zap, Sparkles, WifiOff,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getEmotionColor = (emotion) => {
  const m = {
    Supportive: "bg-green-500/20 text-green-300 border-green-500/50",
    Stressed: "bg-red-500/20 text-red-300 border-red-500/50",
    Calm: "bg-blue-500/20 text-blue-300 border-blue-500/50",
    Inspiring: "bg-violet-500/20 text-violet-300 border-violet-500/50",
    Curious: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
    Playful: "bg-pink-500/20 text-pink-300 border-pink-500/50",
    Reflective: "bg-indigo-500/20 text-indigo-300 border-indigo-500/50",
  };
  return m[emotion] || "bg-slate-500/20 text-slate-300 border-slate-500/50";
};

const formatTime = (dateString) => {
  const d = new Date(dateString), now = new Date(), diff = now - d;
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), dy = Math.floor(diff / 86400000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (dy < 7) return `${dy}d ago`;
  return d.toLocaleDateString();
};

// ─── OCEAN math: compute resonance between user and a memory ─────────────────
const TRAIT_KEYS = ["O", "C", "E", "A", "N"];

const oceanDistance = (a, b) => {
  if (!a || !b) return 1; // max distance if missing
  let sum = 0, count = 0;
  for (const k of TRAIT_KEYS) {
    if (typeof a[k] === "number" && typeof b[k] === "number") {
      const d = a[k] - b[k];
      sum += d * d;
      count++;
    }
  }
  if (count === 0) return 1;
  return Math.sqrt(sum / count); // 0 = identical, ~1 = opposite
};

const computeFeedResonance = (userPersonality, memories) => {
  if (!userPersonality || !memories?.length) return null;
  const valid = memories.filter(m => m.oceanVector && TRAIT_KEYS.some(k => typeof m.oceanVector[k] === "number"));
  if (!valid.length) return null;
  const avgDist = valid.reduce((s, m) => s + oceanDistance(userPersonality, m.oceanVector), 0) / valid.length;
  // Map distance [0,1] → resonance score [100,0]
  return Math.round(Math.max(0, Math.min(100, (1 - avgDist) * 100)));
};

const getDominantTrait = (personality) => {
  if (!personality) return "O";
  let best = "O", val = -1;
  for (const k of TRAIT_KEYS) {
    if (typeof personality[k] === "number" && personality[k] > val) {
      val = personality[k];
      best = k;
    }
  }
  return best;
};

const TRAIT_RING_COLORS = {
  O: "conic-gradient(#a78bfa, #c4b5fd, #7c3aed, #a78bfa)",
  C: "conic-gradient(#6366f1, #818cf8, #4f46e5, #6366f1)",
  E: "conic-gradient(#f59e0b, #fbbf24, #d97706, #f59e0b)",
  A: "conic-gradient(#34d399, #6ee7b7, #059669, #34d399)",
  N: "conic-gradient(#ef4444, #f87171, #b91c1c, #ef4444)",
};

const TRAIT_AVATAR_GRADIENT = {
  O: "linear-gradient(135deg, #a78bfa, #7c3aed)",
  C: "linear-gradient(135deg, #818cf8, #4f46e5)",
  E: "linear-gradient(135deg, #fbbf24, #d97706)",
  A: "linear-gradient(135deg, #6ee7b7, #059669)",
  N: "linear-gradient(135deg, #f87171, #b91c1c)",
};

// ─── Animated Background ─────────────────────────────────────────────────────
const AnimatedBackdrop = memo(() => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" style={{ background: "#050510" }}>
      <motion.div
        className="absolute -inset-[20%] opacity-40"
        animate={{
          background: [
            "radial-gradient(circle at 20% 30%, rgba(124,58,237,0.35) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(236,72,153,0.25) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(59,130,246,0.2) 0%, transparent 60%)",
            "radial-gradient(circle at 70% 20%, rgba(124,58,237,0.35) 0%, transparent 50%), radial-gradient(circle at 30% 80%, rgba(236,72,153,0.25) 0%, transparent 50%), radial-gradient(circle at 60% 40%, rgba(59,130,246,0.2) 0%, transparent 60%)",
            "radial-gradient(circle at 40% 70%, rgba(124,58,237,0.35) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(236,72,153,0.25) 0%, transparent 50%), radial-gradient(circle at 30% 50%, rgba(59,130,246,0.2) 0%, transparent 60%)",
            "radial-gradient(circle at 20% 30%, rgba(124,58,237,0.35) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(236,72,153,0.25) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(59,130,246,0.2) 0%, transparent 60%)",
          ],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            width: 200 + i * 50,
            height: 200 + i * 50,
            background: i % 2 === 0
              ? "radial-gradient(circle, rgba(167,139,250,0.15), transparent)"
              : "radial-gradient(circle, rgba(236,72,153,0.12), transparent)",
            left: `${(i * 17) % 100}%`,
            top: `${(i * 23) % 100}%`,
          }}
          animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.2, 0.9, 1] }}
          transition={{ duration: 15 + i * 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
        />
      ))}
      <svg className="absolute inset-0 w-full h-full opacity-50" preserveAspectRatio="none">
        {[...Array(80)].map((_, i) => {
          const x = (i * 137) % 100, y = (i * 219) % 100, size = (i % 3) * 0.5 + 0.5;
          return (
            <motion.circle key={i} cx={`${x}%`} cy={`${y}%`} r={size} fill="#fff"
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: (i % 10) * 0.3 }} />
          );
        })}
      </svg>
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(167,139,250,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.5) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }} />
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(5,5,16,0.85) 100%)" }} />
    </div>
  );
});
AnimatedBackdrop.displayName = "AnimatedBackdrop";

// ─── Top Command Bar — NOW DYNAMIC ───────────────────────────────────────────
const CommandBar = memo(({ user, recentActivityCount, isLive, onNavigate }) => {
  const { account, balance, chainId, isCorrectNetwork, connectWallet, switchToMumbai } = useWallet();
  const [pulse, setPulse] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const i = setInterval(() => setPulse((p) => (p + 1) % 6), 400);
    return () => clearInterval(i);
  }, []);

  const shortAddr = account ? `${account.slice(0, 6)}…${account.slice(-4)}` : "Not connected";
  const networkLabel = chainId === 31337 ? "31337" : chainId === 80002 ? "amoy" : chainId === 80001 ? "mumbai" : chainId ? String(chainId) : "—";

  // ── Click handlers ────────────────────────────────────────────────────────
  const handleSignalClick = () => {
    // Refresh the page data — quick way to flip back to "live" if idle
    window.location.reload();
  };

  const handleActivityClick = () => {
    // Jump to discover where activity is happening
    onNavigate("/discover");
  };

  const handleChainClick = async () => {
    if (!account) {
      await connectWallet();
    } else if (!isCorrectNetwork) {
      await switchToMumbai();
    } else {
      onNavigate("/wallet-test");
    }
  };

  const handleWalletClick = async () => {
    if (!account) {
      await connectWallet();
      return;
    }
    // Copy address to clipboard
    try {
      await navigator.clipboard.writeText(account);
      showSuccess("Wallet address copied!");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError("Could not copy address");
    }
  };

  const handleAvatarClick = () => onNavigate("/profile");
  const handleLogoClick = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <motion.div
      className="hidden lg:flex items-center justify-between px-6 py-2.5 sticky top-0 z-50"
      style={{
        background: "rgba(10,10,20,0.7)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(167,139,250,0.1)",
      }}
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-slate-500">

        {/* Logo — scrolls to top */}
        <motion.button
          onClick={handleLogoClick}
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors mr-2"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          title="Scroll to top"
        >
          <motion.span
            className="text-sm font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent"
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{ backgroundSize: "200% 200%" }}
          >
            AURA
          </motion.span>
        </motion.button>

        {/* Signal — click to refresh */}
        <motion.button
          onClick={handleSignalClick}
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors group"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          title={isLive ? "Data fresh — click to refresh" : "Click to refresh data"}
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: isLive ? "#34d399" : "#f59e0b" }}
            animate={{
              boxShadow: isLive
                ? ["0 0 0px #34d399", "0 0 8px #34d399", "0 0 0px #34d399"]
                : ["0 0 0px #f59e0b", "0 0 8px #f59e0b", "0 0 0px #f59e0b"]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="group-hover:text-slate-300 transition-colors">{isLive ? "signal · stable" : "signal · idle"}</span>
        </motion.button>

        {/* Activity — click to go to discover */}
        <motion.button
          onClick={handleActivityClick}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors group"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          title={`${recentActivityCount} memories in last hour — click to discover`}
        >
          {[7, 12, 5, 14, 9, 11].map((h, i) => {
            const intensity = Math.min(1, recentActivityCount / 10);
            return (
              <motion.span
                key={i}
                className="block w-[2px] rounded-full"
                style={{
                  height: h * (0.5 + intensity * 0.5),
                  background: pulse === i ? "#a78bfa" : `rgba(167,139,250,${0.2 + intensity * 0.3})`,
                }}
                animate={{ scaleY: pulse === i ? 1.3 : 1 }}
                transition={{ duration: 0.2 }}
              />
            );
          })}
          <span className="ml-2 group-hover:text-slate-300 transition-colors">activity · {recentActivityCount}/hr</span>
        </motion.button>

        {/* Chain — click to connect wallet, switch network, or go to wallet page */}
        <motion.button
          onClick={handleChainClick}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors group ${!isCorrectNetwork && account ? "text-amber-400" : "text-slate-600"
            }`}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          title={
            !account ? "Connect wallet"
              : !isCorrectNetwork ? "Wrong network — click to switch"
                : "View wallet details"
          }
        >
          <span className="group-hover:text-slate-300 transition-colors">chain · {networkLabel}{!isCorrectNetwork && account ? " ⚠" : ""}</span>
        </motion.button>
      </div>

      <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase">

        {/* Wallet info — click to copy address or connect */}
        <motion.button
          onClick={handleWalletClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors group"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          title={account ? "Click to copy address" : "Connect wallet"}
        >
          <div className="text-right">
            <div className={`font-mono ${account ? "text-slate-300" : "text-indigo-400"} group-hover:text-white transition-colors`}>
              {copied ? "Copied!" : shortAddr}
            </div>
            <div className="text-slate-600 group-hover:text-slate-400 transition-colors">
              {account && balance !== null ? `${balance} ${chainId === 31337 ? "ETH" : "MATIC"}` : "Click to link"}
            </div>
          </div>
        </motion.button>

        {/* Avatar — click to go to profile */}
        <motion.button
          onClick={handleAvatarClick}
          className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-semibold"
          style={{ background: "linear-gradient(135deg, #ec4899, #7c3aed)" }}
          whileHover={{ scale: 1.15, rotate: 360, boxShadow: "0 0 16px rgba(167,139,250,0.6)" }}
          whileTap={{ scale: 0.95 }}
          transition={{ rotate: { duration: 0.6 } }}
          title="Go to profile"
        >
          {user?.profilePicture
            ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
            : (user?.username?.charAt(0).toUpperCase() || "U")}
        </motion.button>
      </div>
    </motion.div>
  );
});
CommandBar.displayName = "CommandBar";

// ─── Live Activity Pulse — driven by memory creation timestamps ──────────────
const ResonancePulse = memo(({ memories }) => {
  // Build a 40-bar histogram of memory creation activity over the last 24 hours
  const buckets = useMemo(() => {
    const now = Date.now();
    const windowMs = 24 * 60 * 60 * 1000; // 24h
    const numBuckets = 40;
    const bucketMs = windowMs / numBuckets;
    const arr = new Array(numBuckets).fill(0);
    (memories || []).forEach(m => {
      if (!m.createdAt) return;
      const t = new Date(m.createdAt).getTime();
      const age = now - t;
      if (age < 0 || age > windowMs) return;
      const idx = Math.min(numBuckets - 1, Math.floor((windowMs - age) / bucketMs));
      arr[idx]++;
    });
    const max = Math.max(1, ...arr);
    return arr.map(v => v / max); // normalize 0..1
  }, [memories]);

  return (
    <div className="flex items-center gap-[2px] h-6" title="Activity over last 24h">
      {buckets.map((v, i) => (
        <span key={i}
          className="block w-[2px] rounded-full transition-all duration-300"
          style={{
            height: `${Math.max(2, v * 20)}px`,
            background: i < 28 ? "rgba(167,139,250,0.7)" : "rgba(236,72,153,0.5)",
          }} />
      ))}
    </div>
  );
});
ResonancePulse.displayName = "ResonancePulse";

// ─── OCEAN Mini Console — fully dynamic ──────────────────────────────────────
const OceanMiniConsole = memo(({ user, resonanceScore, resonanceDelta, isLive }) => {
  const traits = useMemo(() => {
    const p = user?.personality || {};
    const safe = (v) => typeof v === "number" ? v : null;
    return [
      { key: "O", label: "OPENNESS", value: safe(p.O), color: "#a78bfa", textColor: "#c4b5fd" },
      { key: "C", label: "CONSCIENTIOUS", value: safe(p.C), color: "#6366f1", textColor: "#a5b4fc" },
      { key: "E", label: "EXTRAVERSION", value: safe(p.E), color: "#f59e0b", textColor: "#fbbf24" },
      { key: "A", label: "AGREEABLENESS", value: safe(p.A), color: "#34d399", textColor: "#6ee7b7" },
      { key: "N", label: "NEUROTICISM", value: safe(p.N), color: "#ef4444", textColor: "#fca5a5" },
    ];
  }, [user?.personality]);

  const hasPersonality = traits.some(t => t.value !== null);

  const pentagon = useMemo(() => {
    const cx = 100, cy = 100, r = 70;
    return traits.map((t, i) => {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const v = t.value ?? 0;
      return {
        ...t,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: cx + Math.cos(angle) * r * v,
        vy: cy + Math.sin(angle) * r * v,
      };
    });
  }, [traits]);

  const polygonPoints = pentagon.map((p) => `${p.vx},${p.vy}`).join(" ");
  const gridPoints = (radius) => traits.map((_, i) => {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return `${100 + Math.cos(a) * radius},${100 + Math.sin(a) * radius}`;
  }).join(" ");

  const segmentsFilled = resonanceScore !== null ? Math.round(resonanceScore / 10) : 0;

  return (
    <motion.div
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: "linear-gradient(180deg, rgba(19,19,42,0.9), rgba(13,13,26,0.95))",
        border: "1px solid rgba(167,139,250,0.15)",
        boxShadow: "0 0 40px rgba(124,58,237,0.1)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <div className="text-[9px] text-slate-600 tracking-[3px] uppercase mb-0.5">your signature</div>
          <div className="text-white font-bold text-sm flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            OCEAN Console
          </div>
        </div>
        {isLive ? (
          <motion.div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full"
            style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[9px] text-green-300 font-semibold tracking-wider">LIVE</span>
          </motion.div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full"
            style={{ background: "rgba(100,116,139,0.1)", border: "1px solid rgba(100,116,139,0.2)" }}>
            <WifiOff className="w-2.5 h-2.5 text-slate-500" />
            <span className="text-[9px] text-slate-500 font-semibold tracking-wider">IDLE</span>
          </div>
        )}
      </div>

      <div className="px-4 py-2 relative">
        {!hasPersonality && (
          <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
            <div className="text-center">
              <p className="text-slate-400 text-xs mb-2">No personality data yet</p>
              <p className="text-slate-600 text-[10px]">Take the onboarding quiz to populate</p>
            </div>
          </div>
        )}
        <svg viewBox="0 0 200 200" className={`w-full ${!hasPersonality ? "opacity-20" : ""}`}>
          <defs>
            <radialGradient id="oceanFill" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(167,139,250,0.5)" />
              <stop offset="100%" stopColor="rgba(124,58,237,0.15)" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <polygon points={gridPoints(70)} fill="none" stroke="rgba(167,139,250,0.08)" strokeWidth="0.5" />
          <polygon points={gridPoints(47)} fill="none" stroke="rgba(167,139,250,0.06)" strokeWidth="0.5" />
          <polygon points={gridPoints(24)} fill="none" stroke="rgba(167,139,250,0.04)" strokeWidth="0.5" />
          {pentagon.map((p, i) => (
            <line key={i} x1="100" y1="100" x2={p.x} y2={p.y} stroke="rgba(167,139,250,0.06)" strokeWidth="0.5" />
          ))}
          {hasPersonality && (
            <motion.polygon
              points={polygonPoints}
              fill="url(#oceanFill)"
              stroke="#a78bfa"
              strokeWidth="1.5"
              filter="url(#glow)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          )}
          {hasPersonality && pentagon.map((p, i) => (
            <motion.circle key={i} cx={p.vx} cy={p.vy} r="3" fill={p.color}
              animate={{ r: [3, 4, 3] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }} />
          ))}
          {pentagon.map((p) => {
            const dx = p.x - 100, dy = p.y - 100;
            const len = Math.sqrt(dx * dx + dy * dy);
            const lx = 100 + (dx / len) * 88, ly = 100 + (dy / len) * 88;
            return (
              <text key={p.key} x={lx} y={ly + 3} textAnchor="middle"
                fontSize="11" fontWeight="700" fill={p.color}>{p.key}</text>
            );
          })}
        </svg>
      </div>

      <div className="px-4 pb-4 space-y-2">
        {traits.map((t, i) => (
          <motion.div key={t.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.05 }}>
            <div className="flex justify-between mb-1">
              <span className="text-[9px] tracking-wider font-semibold" style={{ color: t.textColor }}>{t.label}</span>
              <span className="text-[9px] text-white font-mono font-semibold">
                {t.value !== null ? t.value.toFixed(2) : "—"}
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <motion.div className="h-full rounded-full"
                style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }}
                initial={{ width: 0 }}
                animate={{ width: `${(t.value ?? 0) * 100}%` }}
                transition={{ duration: 1, delay: 0.5 + i * 0.08, ease: "easeOut" }} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mx-4 mb-4 p-3 rounded-xl"
        style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.12)" }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] tracking-[2px] uppercase text-slate-500 font-semibold">Feed Resonance</span>
          {resonanceDelta !== null && (
            <span className={`text-[9px] font-semibold ${resonanceDelta >= 0 ? "text-green-400" : "text-red-400"}`}>
              {resonanceDelta >= 0 ? "+" : ""}{resonanceDelta}% vs avg
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1.5 mb-2">
          {resonanceScore !== null ? (
            <>
              <motion.span className="text-2xl font-bold text-white leading-none"
                key={resonanceScore}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}>
                {resonanceScore}
              </motion.span>
              <span className="text-xs text-slate-600">/ 100</span>
            </>
          ) : (
            <span className="text-xs text-slate-600">Awaiting personality + memories</span>
          )}
        </div>
        <div className="flex gap-1">
          {[...Array(10)].map((_, i) => (
            <motion.span key={i} className="flex-1 h-[3px] rounded-full"
              style={{ background: i < segmentsFilled ? "#a78bfa" : "rgba(255,255,255,0.08)" }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.9 + i * 0.04 }} />
          ))}
        </div>
      </div>
    </motion.div>
  );
});
OceanMiniConsole.displayName = "OceanMiniConsole";

// ─── Create Bar ──────────────────────────────────────────────────────────────
const CreateBar = memo(({ user, onNavigate }) => (
  <motion.div
    className="rounded-2xl p-4 mb-1 relative overflow-hidden"
    style={{
      background: "linear-gradient(135deg, rgba(19,19,42,0.95), rgba(13,13,26,0.95))",
      border: "1px solid rgba(167,139,250,0.12)",
    }}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    whileHover={{ borderColor: "rgba(167,139,250,0.3)" }}
  >
    <motion.div className="absolute inset-0 opacity-0 pointer-events-none"
      style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.1), transparent)" }}
      animate={{ x: ["-100%", "100%"], opacity: [0, 0.5, 0] }}
      transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }} />

    <div className="flex items-center gap-3 mb-3 relative">
      <motion.div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
        whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(167,139,250,0.5)" }}
        transition={{ type: "spring", stiffness: 300 }}>
        {user?.profilePicture
          ? <img src={user.profilePicture} alt={user.username} className="w-full h-full object-cover" />
          : (user?.username?.charAt(0).toUpperCase() || "U")}
      </motion.div>
      <motion.button onClick={() => onNavigate("/create")}
        className="flex-1 text-left px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 transition-all text-sm relative overflow-hidden group"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        whileHover={{ borderColor: "rgba(167,139,250,0.3)" }}>
        <motion.span className="relative z-10"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}>
          What's resonating with you today?
        </motion.span>
      </motion.button>
    </div>
    <div className="flex items-center gap-0 pt-2 relative" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      {[
        { icon: ImageIcon, label: "Photo", color: "text-blue-400", hover: "hover:bg-blue-500/10 hover:text-blue-300" },
        { icon: Smile, label: "Emotion", color: "text-yellow-400", hover: "hover:bg-yellow-500/10 hover:text-yellow-300" },
        { icon: BarChart3, label: "Video", color: "text-green-400", hover: "hover:bg-green-500/10 hover:text-green-300" },
      ].map(({ icon: Icon, label, color, hover }, idx) => (
        <motion.button key={label} onClick={() => onNavigate("/create")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-slate-500 transition-all text-xs font-medium ${hover}`}
          whileHover={{ y: -2 }}
          whileTap={{ y: 0, scale: 0.97 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + idx * 0.05 }}>
          <Icon className={`w-4 h-4 ${color}`} />{label}
        </motion.button>
      ))}
    </div>
  </motion.div>
));
CreateBar.displayName = "CreateBar";

// ─── Story Rail — rings tinted by each user's dominant OCEAN trait ──────────
const StoryRail = memo(({ suggestedUsers, navigate }) => (
  <motion.div className="flex gap-3 mt-6 mb-4 pt-4 pb-4 overflow-x-auto"
    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", scrollbarWidth: "none" }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.2 }}>
    <motion.button onClick={() => navigate("/create")}
      className="flex flex-col items-center gap-1.5 flex-shrink-0"
      whileHover={{ y: -3 }}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: "rgba(13,13,26,0.6)", border: "2px dashed rgba(167,139,250,0.5)" }}>
        <Plus className="w-5 h-5 text-indigo-400" />
      </div>
      <span className="text-[10px] text-slate-500">You</span>
    </motion.button>
    {suggestedUsers.slice(0, 6).map((u, i) => {
      const dominant = getDominantTrait(u.personality);
      const ringStyle = TRAIT_RING_COLORS[dominant];
      const avatarBg = TRAIT_AVATAR_GRADIENT[dominant];
      const hasPersonality = u.personality && TRAIT_KEYS.some(k => typeof u.personality[k] === "number");
      return (
        <motion.button key={u.id} onClick={() => navigate(`/user/${u.id}`)}
          className="flex flex-col items-center gap-1.5 flex-shrink-0"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 + i * 0.05 }}
          whileHover={{ y: -3, scale: 1.05 }}
          title={hasPersonality ? `Dominant trait: ${dominant}` : "No personality yet"}>
          <motion.div className="w-14 h-14 rounded-full p-[2px]"
            style={{ background: hasPersonality ? ringStyle : "rgba(100,116,139,0.4)" }}
            animate={{ rotate: hasPersonality ? 360 : 0 }}
            transition={{ duration: 20, repeat: hasPersonality ? Infinity : 0, ease: "linear" }}>
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-semibold"
              style={{ background: u.profilePicture ? "transparent" : avatarBg }}>
              {u.profilePicture
                ? <img src={u.profilePicture} alt={u.username} className="w-full h-full object-cover" />
                : u.username?.charAt(0).toUpperCase()}
            </div>
          </motion.div>
          <span className="text-[10px] text-slate-400 max-w-[60px] truncate">{u.username}</span>
        </motion.button>
      );
    })}
  </motion.div>
));
StoryRail.displayName = "StoryRail";

// ─── Home ─────────────────────────────────────────────────────────────────────
const Home = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [viewMode, setViewMode] = useState("2d");
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);

  const pageRef = useRef(1);
  const fetchingRef = useRef(false);
  const fetchedPages = useRef(new Set());

  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [trendingMemories, setTrendingMemories] = useState([]);
  const [followingStatus, setFollowingStatus] = useState({});
  const [trendingHashtags, setTrendingHashtags] = useState([]);

  const [selectedMemory, setSelectedMemory] = useState(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedMemoryForComment, setSelectedMemoryForComment] = useState(null);

  const likedSetRef = useRef(new Set());
  const [likedVersion, setLikedVersion] = useState(0);

  const { trackView, trackEvent } = useInteractionTracking({
    enabled: !!user?.id,
    currentUserId: user?.id,
  });

  // Mouse parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMove = (e) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [mouseX, mouseY]);

  // ── Real metrics derived from memories ──
  const recentActivityCount = useMemo(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return memories.filter(m => m.createdAt && new Date(m.createdAt).getTime() > oneHourAgo).length;
  }, [memories]);

  const resonanceScore = useMemo(
    () => computeFeedResonance(user?.personality, memories),
    [user?.personality, memories]
  );

  // Resonance delta = how this user's resonance compares to a "neutral" baseline (50)
  // i.e. positive means their feed resonates with them more than average chance would predict
  const resonanceDelta = useMemo(() => {
    if (resonanceScore === null) return null;
    return resonanceScore - 50;
  }, [resonanceScore]);

  // "isLive" = data was loaded within the last 5 minutes
  const isLive = useMemo(() => {
    if (!lastLoadedAt) return false;
    return Date.now() - lastLoadedAt < 5 * 60 * 1000;
  }, [lastLoadedAt]);

  // ── Init ──
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const [feedRes, suggestRes, hashRes] = await Promise.all([
          api.get("/memories/feed?page=1&limit=15"),
          api.get("/follow/suggestions"),
          api.get("/memories/trending-hashtags"),
        ]);
        if (cancelled) return;
        if (feedRes.data.success) {
          const mems = feedRes.data.memories || [];
          setMemories(mems);
          setHasMore(feedRes.data.hasMore ?? false);
          fetchedPages.current.add(1);
          mems.forEach(m => { if (m.likes?.some(l => l.toString() === user?.id)) likedSetRef.current.add(m._id); });
          setLikedVersion(v => v + 1);
          setTrendingMemories([...mems].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0)).slice(0, 3));
          setLastLoadedAt(Date.now());
        }
        if (suggestRes.data.success) {
          const users = suggestRes.data.suggestions.slice(0, 5);
          setSuggestedUsers(users);
          const st = {};
          await Promise.all(users.map(async u => {
            try { const r = await api.get(`/follow/check/${u.id}`); if (r.data.success) st[u.id] = r.data.isFollowing; } catch { }
          }));
          if (!cancelled) setFollowingStatus(st);
        }
        if (hashRes.data.success) setTrendingHashtags(hashRes.data.hashtags || []);
      } catch (e) { console.error("[Home] init:", e); }
      finally { if (!cancelled) setLoading(false); }
    };
    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return;
    const np = pageRef.current + 1;
    if (fetchedPages.current.has(np)) return;
    fetchingRef.current = true; fetchedPages.current.add(np);
    setLoadingMore(true);
    try {
      const res = await api.get(`/memories/feed?page=${np}&limit=15`);
      if (res.data.success) {
        const fresh = res.data.memories || [];
        setMemories(prev => {
          const ids = new Set(prev.map(m => m._id));
          const dd = fresh.filter(m => !ids.has(m._id));
          dd.forEach(m => { if (m.likes?.some(l => l.toString() === user?.id)) likedSetRef.current.add(m._id); });
          if (dd.length) setLikedVersion(v => v + 1);
          return [...prev, ...dd];
        });
        setHasMore(res.data.hasMore ?? false);
        pageRef.current = np;
        setLastLoadedAt(Date.now());
      }
    } catch (e) { console.error(e); fetchedPages.current.delete(np); }
    finally { fetchingRef.current = false; setLoadingMore(false); }
  }, [hasMore, user?.id]);

  const loadPage = useCallback(async (pageNum) => {
    if (fetchingRef.current || pageNum < 1) return;
    fetchingRef.current = true;
    setLoadingMore(true);
    try {
      const res = await api.get(`/memories/feed?page=${pageNum}&limit=15`);
      if (res.data.success) {
        const fresh = res.data.memories || [];
        fresh.forEach(m => {
          if (m.likes?.some(l => l.toString() === user?.id)) likedSetRef.current.add(m._id);
        });
        setLikedVersion(v => v + 1);
        setMemories(fresh);
        setHasMore(res.data.hasMore ?? false);
        pageRef.current = pageNum;
        setLastLoadedAt(Date.now());
      }
    } catch (e) { console.error(e); }
    finally { fetchingRef.current = false; setLoadingMore(false); }
  }, [user?.id]);

  const handleLike = useCallback(async (memoryId) => {
    if (!user?.id) return;
    const was = likedSetRef.current.has(memoryId);
    if (was) likedSetRef.current.delete(memoryId); else likedSetRef.current.add(memoryId);
    setMemories(prev => prev.map(m => m._id !== memoryId ? m : { ...m, likesCount: was ? Math.max((m.likesCount || 0) - 1, 0) : (m.likesCount || 0) + 1 }));
    setLikedVersion(v => v + 1);
    try { await api.post(`/memories/${memoryId}/like`); }
    catch {
      if (was) likedSetRef.current.add(memoryId); else likedSetRef.current.delete(memoryId);
      setMemories(prev => prev.map(m => m._id !== memoryId ? m : { ...m, likesCount: was ? (m.likesCount || 0) + 1 : Math.max((m.likesCount || 0) - 1, 0) }));
      setLikedVersion(v => v + 1);
      showError("Failed to like.");
    }
  }, [user?.id]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isLiked = useCallback((memory) => likedSetRef.current.has(memory._id), [likedVersion]);

  const handleOpenComments = useCallback(m => { setSelectedMemoryForComment(m); setCommentModalOpen(true); }, []);
  const handleCommentAdded = useCallback(u => { setMemories(p => p.map(m => m._id === u._id ? { ...m, comments: u.comments } : m)); setSelectedMemoryForComment(u); }, []);
  const handleCloseComments = useCallback(() => { setCommentModalOpen(false); setSelectedMemoryForComment(null); }, []);

  const handleFollow = useCallback(async (userId, e) => {
    e.stopPropagation();
    setFollowingStatus(p => ({ ...p, [userId]: true }));
    try {
      const r = await api.post(`/follow/${userId}`);
      if (r.data.success) { await refreshUser(); showSuccess("Following! ✨"); }
      else { setFollowingStatus(p => ({ ...p, [userId]: false })); showError("Failed."); }
    } catch (err) { setFollowingStatus(p => ({ ...p, [userId]: false })); showError(err.response?.data?.message || "Failed."); }
  }, [refreshUser]);

  const go = useCallback(p => navigate(p), [navigate]);
  const isActive = useCallback(p => location.pathname === p, [location.pathname]);

  const navLinks = useMemo(() => [
    { icon: HomeIcon, label: "Home", path: "/", active: isActive("/") },
    { icon: Compass, label: "Discover", path: "/discover", active: isActive("/discover") },
    { icon: ShoppingBag, label: "Marketplace", path: "/marketplace", active: isActive("/marketplace") },
    { icon: Mail, label: "Messages", path: "/messages", active: isActive("/messages") },
    { icon: Bell, label: "Notifications", path: "/notifications", active: isActive("/notifications"), badge: true },
    { icon: Bookmark, label: "Bookmarks", path: "/bookmarks", active: isActive("/bookmarks") },
    { icon: User, label: "Profile", path: "/profile", active: isActive("/profile") },
  ], [isActive]);

  return (
    <div className="min-h-screen text-white relative">
      <AnimatedBackdrop />

      <motion.div className="fixed pointer-events-none -z-[5]"
        style={{
          width: 600, height: 600,
          left: "50%", top: "50%",
          x: useTransform(smoothX, [-0.5, 0.5], [-150, 150]),
          y: useTransform(smoothY, [-0.5, 0.5], [-150, 150]),
          marginLeft: -300, marginTop: -300,
          background: "radial-gradient(circle, rgba(124,58,237,0.08), transparent 70%)",
          filter: "blur(40px)",
        }} />

      {/* Top command bar — DYNAMIC */}
      <CommandBar user={user} recentActivityCount={recentActivityCount} isLive={isLive} onNavigate={go} />

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: "rgba(10,10,20,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(167,139,250,0.1)" }}>
        <motion.span
          className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 4, repeat: Infinity }}
          style={{ backgroundSize: "200% 200%" }}>
          AURA
        </motion.span>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/search")} className="p-2 text-slate-400 hover:text-white"><Search className="w-5 h-5" /></button>
          <button onClick={() => navigate("/profile")} className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold">
            {user?.profilePicture ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" /> : (user?.username?.charAt(0).toUpperCase() || "U")}
          </button>
        </div>
      </div>

      <div className="mx-auto flex relative">

        {/* ── Left sidebar ─── */}
        <aside
          className="hidden lg:flex flex-col flex-shrink-0 sticky top-[42px] overflow-hidden transition-all duration-300 ease-in-out group/sidebar"
          style={{
            width: "72px",
            height: "calc(100vh - 42px)",
            borderRight: "1px solid rgba(167,139,250,0.1)",
            background: "rgba(10,10,20,0.4)",
            backdropFilter: "blur(20px)",
          }}
          onMouseEnter={e => { e.currentTarget.style.width = "240px"; }}
          onMouseLeave={e => { e.currentTarget.style.width = "72px"; }}>
          <div className="px-4 py-5 flex items-center overflow-hidden" style={{ minHeight: "60px" }}>
            <motion.div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 relative"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              animate={{ boxShadow: ["0 0 20px rgba(124,58,237,0.3)", "0 0 30px rgba(124,58,237,0.6)", "0 0 20px rgba(124,58,237,0.3)"] }}
              transition={{ boxShadow: { duration: 2, repeat: Infinity }, rotate: { duration: 0.4 } }}>
              <span className="text-white font-bold text-sm">A</span>
            </motion.div>
            <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-100">URA</span>
          </div>

          <nav className="flex flex-col gap-1 flex-1 px-2">
            {navLinks.map((item, idx) => (
              <motion.button key={item.path} onClick={() => go(item.path)}
                className={`flex items-center rounded-xl transition-all duration-150 group/item relative overflow-hidden ${item.active ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                style={{
                  minHeight: "44px",
                  padding: "0 14px",
                  background: item.active ? "linear-gradient(90deg, rgba(124,58,237,0.2), rgba(167,139,250,0.05))" : "transparent",
                }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                whileHover={{ x: 2 }}>
                {item.active && (
                  <motion.span className="absolute left-0 top-1/2 w-[3px] h-6 rounded-full"
                    style={{ background: "#a78bfa", transform: "translateY(-50%)", boxShadow: "0 0 8px #a78bfa" }}
                    layoutId="activeIndicator" />
                )}
                <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${item.active ? "text-indigo-400" : "group-hover/item:text-indigo-400"}`} />
                <span className="ml-4 text-[14px] font-medium whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75 flex-1 text-left">
                  {item.label}
                </span>
                {item.badge && (
                  <motion.span className="absolute top-3 left-8 w-2 h-2 rounded-full bg-red-500 group-hover/sidebar:relative group-hover/sidebar:top-0 group-hover/sidebar:left-0 group-hover/sidebar:ml-auto"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }} />
                )}
              </motion.button>
            ))}
          </nav>

          <div className="px-2 mt-2">
            <motion.button onClick={() => navigate("/create")}
              className="w-full flex items-center text-white font-semibold rounded-xl overflow-hidden relative"
              style={{
                minHeight: "44px",
                padding: "0 14px",
                background: "linear-gradient(135deg, #ec4899 0%, #7c3aed 50%, #4f46e5 100%)",
                boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
              }}
              whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(124,58,237,0.6)" }}
              whileTap={{ scale: 0.98 }}>
              <motion.div className="absolute inset-0 opacity-0"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
                animate={{ x: ["-100%", "100%"], opacity: [0, 0.5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }} />
              <Plus className="w-5 h-5 flex-shrink-0 relative" />
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75 text-sm relative">Create Memory</span>
            </motion.button>
          </div>

          <div className="mx-2 mt-3 mb-4 flex items-center rounded-xl hover:bg-white/5 transition-colors cursor-pointer group/user overflow-hidden"
            style={{ minHeight: "52px", padding: "0 10px" }}
            onClick={() => navigate("/profile")}>
            <motion.div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 relative"
              whileHover={{ scale: 1.1 }}>
              {user?.profilePicture
                ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                : (user?.username?.charAt(0).toUpperCase() || "U")}
              <motion.span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#0d0d1a]"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }} />
            </motion.div>
            <div className="ml-3 flex-1 min-w-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">
              <p className="text-white text-xs font-semibold truncate">{user?.username}</p>
              <p className="text-slate-600 text-xs truncate">{user?.email}</p>
            </div>
            <button onClick={e => { e.stopPropagation(); logout(); navigate("/login"); }}
              className="ml-2 p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover/sidebar:opacity-100">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* ── Feed ─── */}
        <main className="flex-1 min-w-0">
          <motion.div className="sticky top-[42px] z-40 px-6 py-3 flex items-center justify-between"
            style={{ background: "rgba(10,10,20,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(167,139,250,0.1)" }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </motion.div>
                <span className="bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-transparent">
                  {viewMode === "2d" ? "Resonating with you" : "Galaxy View"}
                </span>
              </h2>
              <div className="hidden md:block">
                <ResonancePulse memories={memories} />
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl relative overflow-hidden"
              style={{ background: "rgba(19,19,42,0.8)", border: "1px solid rgba(167,139,250,0.15)" }}>
              {[{ k: "2d", label: "Feed", icon: Grid }, { k: "3d", label: "Galaxy", icon: Globe }].map(({ k, label, icon: Icon }) => (
                <motion.button key={k} onClick={() => setViewMode(k)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors z-10 ${viewMode === k ? "text-white" : "text-slate-400 hover:text-white"}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}>
                  {viewMode === k && (
                    <motion.div className="absolute inset-0 rounded-lg -z-10"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 20px rgba(124,58,237,0.5)" }}
                      layoutId="viewModeIndicator"
                      transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                  )}
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          <div className="px-6 py-4 pb-24 lg:pb-6">
            <AnimatePresence mode="wait">
              {viewMode === "2d" && (
                <motion.div key="2d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <CreateBar user={user} onNavigate={go} />

                  {!loading && suggestedUsers.length > 0 && (
                    <StoryRail suggestedUsers={suggestedUsers} navigate={navigate} />
                  )}

                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                          <MemoryCardSkeleton />
                        </motion.div>
                      ))}
                    </div>
                  ) : memories.length === 0 ? (
                    <motion.div className="text-center py-20" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                      <motion.div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4 relative"
                        animate={{ boxShadow: ["0 0 20px rgba(124,58,237,0.2)", "0 0 40px rgba(124,58,237,0.4)", "0 0 20px rgba(124,58,237,0.2)"] }}
                        transition={{ duration: 2, repeat: Infinity }}>
                        <HomeIcon className="w-10 h-10 text-indigo-400" />
                      </motion.div>
                      <p className="text-white font-semibold mb-1">No memories yet</p>
                      <p className="text-slate-500 text-sm mb-5">Be the first to share something!</p>
                      <motion.button onClick={() => navigate("/create")}
                        className="px-6 py-2.5 rounded-xl text-sm font-medium text-white relative overflow-hidden"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                        whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(124,58,237,0.5)" }}
                        whileTap={{ scale: 0.97 }}>
                        Create Memory
                      </motion.button>
                    </motion.div>
                  ) : (
                    <InfiniteScroll dataLength={memories.length} next={loadMore} hasMore={hasMore}
                      loader={
                        <div className="space-y-4 mt-4">
                          {[...Array(2)].map((_, i) => (
                            <motion.div key={i} animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
                              <MemoryCardSkeleton />
                            </motion.div>
                          ))}
                        </div>
                      }
                      endMessage={
                        <motion.div className="text-center py-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <motion.div className="inline-flex items-center gap-2 text-slate-500 text-sm"
                            animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            You're all caught up
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                          </motion.div>
                        </motion.div>
                      }
                      scrollThreshold={0.85} style={{ overflow: "visible" }}>
                      <div className="space-y-4">
                        {memories.map((memory, index) => (
                          <motion.div key={memory._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}>
                            <MemoryCard memory={memory} index={index} onLike={handleLike}
                              onCommentClick={handleOpenComments}
                              formatTime={formatTime}
                              getEmotionColor={getEmotionColor}
                              isLiked={isLiked}
                              trackView={trackView}
                              trackEvent={trackEvent} />
                          </motion.div>
                        ))}
                      </div>
                    </InfiniteScroll>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {viewMode === "3d" && (
              <>
                <OrbField memories={memories} currentUser={user} onLike={handleLike}
                  onCommentClick={handleOpenComments} isLiked={isLiked} formatTime={formatTime}
                  onExit={() => setViewMode("2d")} />

                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{
                    background: "rgba(15,15,30,0.85)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(165,180,252,0.3)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.2)",
                  }}>
                  <motion.button onClick={() => loadPage(pageRef.current - 1)}
                    disabled={loadingMore || pageRef.current <= 1}
                    className="px-4 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ color: "#a5b4fc" }}
                    whileHover={{ scale: pageRef.current > 1 && !loadingMore ? 1.05 : 1 }}
                    whileTap={{ scale: 0.97 }}>
                    ← Previous
                  </motion.button>
                  <span className="px-3 py-1 text-xs font-mono" style={{ color: "#64748b" }}>
                    {loadingMore ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        loading…
                      </span>
                    ) : `Page ${pageRef.current}`}
                  </span>
                  <motion.button onClick={() => loadPage(pageRef.current + 1)}
                    disabled={loadingMore || !hasMore}
                    className="px-4 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ color: "#a5b4fc" }}
                    whileHover={{ scale: hasMore && !loadingMore ? 1.05 : 1 }}
                    whileTap={{ scale: 0.97 }}>
                    Next →
                  </motion.button>
                </div>
              </>
            )}
          </div>
        </main>

        {/* ── Right sidebar ─── */}
        <aside className="hidden xl:flex flex-col w-[340px] flex-shrink-0 px-5 py-4 gap-4">
          <motion.div className="relative" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4 z-10" />
            <input readOnly onClick={() => navigate("/search")} placeholder="Search the universe…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-slate-300 placeholder-slate-600 text-sm cursor-pointer focus:outline-none transition-all"
              style={{ background: "rgba(19,19,42,0.8)", backdropFilter: "blur(10px)", border: "1px solid rgba(167,139,250,0.15)" }} />
          </motion.div>

          {/* OCEAN Console — DYNAMIC */}
          <OceanMiniConsole user={user} resonanceScore={resonanceScore} resonanceDelta={resonanceDelta} isLive={isLive} />

          <motion.div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(19,19,42,0.8)", backdropFilter: "blur(10px)", border: "1px solid rgba(167,139,250,0.1)" }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <span className="text-white font-bold text-sm flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                Suggested for you
              </span>
              <button onClick={() => navigate("/discover")} className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold transition-colors">See all</button>
            </div>
            {suggestedUsers.length === 0 ? (
              <p className="px-4 pb-4 text-slate-600 text-xs">No suggestions right now</p>
            ) : (
              <div className="pb-3">
                {suggestedUsers.map((u, idx) => (
                  <motion.div key={u.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors group"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + idx * 0.05 }}>
                    <motion.button onClick={() => navigate(`/user/${u.id}`)}
                      className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 relative"
                      style={{ background: u.profilePicture ? "transparent" : TRAIT_AVATAR_GRADIENT[getDominantTrait(u.personality)] }}
                      whileHover={{ scale: 1.15, boxShadow: "0 0 16px rgba(167,139,250,0.5)" }}>
                      {u.profilePicture
                        ? <img src={u.profilePicture} alt={u.username} className="w-full h-full object-cover" />
                        : u.username?.charAt(0).toUpperCase()}
                    </motion.button>
                    <button onClick={() => navigate(`/user/${u.id}`)} className="flex-1 min-w-0 text-left">
                      <p className="text-white text-xs font-semibold truncate">{u.username}</p>
                      <p className="text-slate-600 text-xs">{u.followerCount || 0} followers</p>
                    </button>
                    <motion.button onClick={e => handleFollow(u.id, e)} disabled={!!followingStatus[u.id]}
                      className={`text-xs font-bold transition-colors ${followingStatus[u.id] ? "text-slate-600 cursor-not-allowed" : "text-indigo-400 hover:text-indigo-300"}`}
                      whileHover={!followingStatus[u.id] ? { scale: 1.1 } : {}}
                      whileTap={!followingStatus[u.id] ? { scale: 0.95 } : {}}>
                      {followingStatus[u.id] ? "Following" : "Follow"}
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {trendingHashtags.length > 0 && (
            <motion.div className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(19,19,42,0.8)", backdropFilter: "blur(10px)", border: "1px solid rgba(167,139,250,0.1)" }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                  <Flame className="w-4 h-4 text-orange-400" />
                </motion.div>
                <span className="text-white font-bold text-sm">Trending</span>
              </div>
              <div className="pb-3">
                {trendingHashtags.map((h, i) => (
                  <motion.div key={i}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.04 }}
                    whileHover={{ x: 4 }}>
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-indigo-400 group-hover:text-pink-400 transition-colors" />
                      <span className="text-slate-300 text-sm font-medium">{h.tag}</span>
                    </div>
                    <span className="text-slate-600 text-xs">{h.posts} posts</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {trendingMemories.length > 0 && (
            <motion.div className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(19,19,42,0.8)", backdropFilter: "blur(10px)", border: "1px solid rgba(167,139,250,0.1)" }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
                  transition={{ scale: { duration: 1.5, repeat: Infinity }, rotate: { duration: 8, repeat: Infinity, ease: "linear" } }}>
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </motion.div>
                <span className="text-white font-bold text-sm">Top Memories</span>
              </div>
              <div className="pb-3">
                {trendingMemories.map((m, idx) => (
                  <motion.button key={m._id} onClick={() => setSelectedMemory(m)}
                    className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors text-left group"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + idx * 0.05 }}
                    whileHover={{ x: 4 }}>
                    {m.image && (
                      <motion.img src={m.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        whileHover={{ scale: 1.1 }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">{m.caption}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-slate-600 text-xs">{m.user?.username}</span>
                        <span className="text-slate-700 text-xs flex items-center gap-0.5"><Heart className="w-3 h-3" />{m.likesCount || 0}</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-700 px-1 mt-1">
            {["About", "Privacy", "Terms", "Help"].map(l => (
              <button key={l} className="hover:text-slate-500 transition-colors">{l}</button>
            ))}
            <span className="w-full text-slate-800 mt-1">© 2026 AURA</span>
          </div>
        </aside>
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 px-2 py-2 z-50"
        style={{ background: "rgba(10,10,20,0.85)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(167,139,250,0.1)" }}>
        <div className="flex items-center justify-around max-w-sm mx-auto">
          {[
            { icon: HomeIcon, path: "/" },
            { icon: Search, path: "/search" },
            { icon: Plus, path: "/create", fab: true },
            { icon: Bell, path: "/notifications" },
            { icon: User, path: "/profile" },
          ].map(({ icon: Icon, path, fab }) => (
            <motion.button key={path} onClick={() => navigate(path)}
              whileTap={{ scale: 0.9 }}
              className={fab
                ? "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg relative overflow-hidden"
                : `p-2.5 rounded-xl transition-colors ${location.pathname === path ? "text-indigo-400 bg-indigo-400/10" : "text-slate-500 hover:text-white"}`}
              style={fab ? { background: "linear-gradient(135deg, #ec4899, #7c3aed)", boxShadow: "0 4px 20px rgba(124,58,237,0.5)" } : {}}>
              {fab && (
                <motion.div className="absolute inset-0"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity }} />
              )}
              <Icon className={`${fab ? "w-6 h-6" : "w-5 h-5"} relative`} />
            </motion.button>
          ))}
        </div>
      </nav>

      <AnimatePresence>
        {selectedMemory && (
          <motion.div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMemory(null)}>
            <motion.div className="rounded-2xl p-6 max-w-md w-full relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(22,22,40,0.95), rgba(13,13,26,0.95))",
                border: "1px solid rgba(167,139,250,0.2)",
                boxShadow: "0 0 60px rgba(124,58,237,0.3)",
              }}
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}>
              <h3 className="text-white font-bold mb-2">{selectedMemory.user?.username || "Unknown"}</h3>
              <p className="text-slate-300 mb-4 text-sm leading-relaxed">{selectedMemory.caption}</p>
              {selectedMemory.emotions?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedMemory.emotions.map((e, i) => (
                    <motion.span key={i} className={`px-2.5 py-0.5 rounded-full text-xs border ${getEmotionColor(e)}`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + i * 0.05 }}>
                      {e}
                    </motion.span>
                  ))}
                </div>
              )}
              <motion.button onClick={() => setSelectedMemory(null)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CommentModal isOpen={commentModalOpen} memory={selectedMemoryForComment}
        onClose={handleCloseComments} onCommentAdded={handleCommentAdded} formatTime={formatTime} />
    </div>
  );
};

export default Home;