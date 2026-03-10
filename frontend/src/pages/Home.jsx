import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import InfiniteScroll from "react-infinite-scroll-component";
import { MemoryCardSkeleton } from "../components/common/LoadingSkeleton";
import MemoryCard from "../components/common/MemoryCard";
import CommentModal from "../components/common/CommentModal";
import { showSuccess, showError } from "../utils/toast";
import {
  Plus, Grid, Globe, Search, Bell, User, Home as HomeIcon,
  ShoppingBag, Mail, Image as ImageIcon, Smile, BarChart3,
  Compass, UserPlus, UserCheck, Heart, Bookmark,
  LogOut, Hash, Flame, Star, TrendingUp, Settings,
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

// ─── GalaxyView ──────────────────────────────────────────────────────────────
const CreateBar = memo(({ user, onNavigate }) => (
  <div className="rounded-2xl p-4 mb-1" style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
        {user?.profilePicture
          ? <img src={user.profilePicture} alt={user.username} className="w-full h-full object-cover" />
          : (user?.username?.charAt(0).toUpperCase() || "U")}
      </div>
      <button
        onClick={() => onNavigate("/create")}
        className="flex-1 text-left px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 transition-all text-sm"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        What's on your mind?
      </button>
    </div>
    <div className="flex items-center gap-0 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      {[
        { icon: ImageIcon, label: "Photo", color: "text-blue-400", hover: "hover:bg-blue-500/10 hover:text-blue-300" },
        { icon: Smile, label: "Emotion", color: "text-yellow-400", hover: "hover:bg-yellow-500/10 hover:text-yellow-300" },
        { icon: BarChart3, label: "Poll", color: "text-green-400", hover: "hover:bg-green-500/10 hover:text-green-300" },
      ].map(({ icon: Icon, label, color, hover }) => (
        <button key={label} onClick={() => onNavigate("/create")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-slate-500 transition-all text-xs font-medium ${hover}`}>
          <Icon className={`w-4 h-4 ${color}`} />{label}
        </button>
      ))}
    </div>
  </div>
));
CreateBar.displayName = "CreateBar";

// ─── GalaxyView ──────────────────────────────────────────────────────────────
const ECOLS = {
  Supportive: "#10b981", Stressed: "#ef4444", Calm: "#3b82f6",
  Inspiring: "#8b5cf6", Curious: "#eab308", Playful: "#ec4899", Reflective: "#6366f1",
};
const GalaxyView = memo(({ memories, onMemoryClick }) => {
  const [hov, setHov] = useState(null);
  return (
    <div className="relative w-full h-[calc(100vh-160px)] overflow-hidden rounded-2xl border border-white/8">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950">
        {[...Array(60)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width: `${(i % 3) + 1}px`, height: `${(i % 3) + 1}px`, left: `${(i * 37.3) % 100}%`, top: `${(i * 53.7) % 100}%`, opacity: (i % 7) * 0.08 + 0.05 }} />
        ))}
        <div className="relative w-full h-full">
          {memories.map((m, i) => {
            const angle = (i / Math.max(memories.length, 1)) * Math.PI * 2;
            const r = 160, x = Math.cos(angle) * r, y = Math.sin(angle) * r;
            const col = ECOLS[m.emotions?.[0]] || "#6366f1";
            return (
              <motion.div key={m._id} className="absolute cursor-pointer"
                style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, transform: "translate(-50%,-50%)" }}
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.25 }} onHoverStart={() => setHov(m._id)} onHoverEnd={() => setHov(null)}
                onClick={() => onMemoryClick(m)}>
                <div className="w-11 h-11 rounded-full" style={{ background: `radial-gradient(circle,${col},${col}cc)`, boxShadow: `0 0 18px ${col}70` }} />
                {hov === m._id && (
                  <motion.div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-slate-900/95 text-white text-xs px-3 py-1.5 rounded-xl whitespace-nowrap border border-white/10 z-10"
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                    {m.caption?.substring(0, 32)}{m.caption?.length > 32 ? "…" : ""}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-600 text-xs tracking-wide">Full 3D planets coming soon</p>
      </div>
    </div>
  );
});
GalaxyView.displayName = "GalaxyView";

// ─── Home ─────────────────────────────────────────────────────────────────────
const Home = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [viewMode, setViewMode] = useState("2d");
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

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

  // Init
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const [feedRes, suggestRes, hashRes] = await Promise.all([
          api.get("/memories/feed?page=1&limit=10"),
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
    try {
      const res = await api.get(`/memories/feed?page=${np}&limit=10`);
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
      }
    } catch (e) { console.error(e); fetchedPages.current.delete(np); }
    finally { fetchingRef.current = false; }
  }, [hasMore, user?.id]);

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
    <div className="min-h-screen text-white" style={{ background: "#0d0d1a" }}>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3" style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">AURA</span>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/search")} className="p-2 text-slate-400 hover:text-white"><Search className="w-5 h-5" /></button>
          <button onClick={() => navigate("/profile")} className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold">
            {user?.profilePicture ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" /> : (user?.username?.charAt(0).toUpperCase() || "U")}
          </button>
        </div>
      </div>

      <div className="max-w-[1340px] mx-auto flex">

        {/* ── Left sidebar ─────────────────────────────────────────────────── */}
        {/* ── Left sidebar — collapsed (icons only) → expands on hover ────── */}
        <aside
          className="hidden lg:flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-hidden transition-all duration-300 ease-in-out group/sidebar"
          style={{
            width: "72px",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            marginLeft: "0",
          }}
          onMouseEnter={e => { e.currentTarget.style.width = "240px"; }}
          onMouseLeave={e => { e.currentTarget.style.width = "72px"; }}
        >
          {/* Logo — icon collapses to "A", expands to "AURA" */}
          <div className="px-4 py-6 flex items-center overflow-hidden" style={{ minHeight: "72px" }}>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent flex-shrink-0 w-8 text-center">
              A
            </span>
            <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-100">
              URA
            </span>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-0.5 flex-1 px-2">
            {navLinks.map(item => (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className={`flex items-center rounded-xl transition-all duration-150 group/item relative ${item.active
                  ? "text-white bg-white/10"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                style={{ minHeight: "48px", padding: "0 14px" }}
              >
                {/* Icon — always visible */}
                <item.icon className={`w-6 h-6 flex-shrink-0 transition-colors ${item.active ? "text-indigo-400" : "group-hover/item:text-indigo-400"}`} />

                {/* Label — fades in on sidebar expand */}
                <span className="ml-4 text-[15px] font-medium whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75 flex-1 text-left">
                  {item.label}
                </span>

                {/* Badge */}
                {item.badge && (
                  <span className="absolute top-3 left-8 w-2 h-2 rounded-full bg-red-500 group-hover/sidebar:relative group-hover/sidebar:top-0 group-hover/sidebar:left-0 group-hover/sidebar:ml-auto" />
                )}
              </button>
            ))}
          </nav>

          {/* Create button */}
          <div className="px-2 mt-2">
            <button
              onClick={() => navigate("/create")}
              className="w-full flex items-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-indigo-900/40 overflow-hidden"
              style={{ minHeight: "44px", padding: "0 14px" }}
            >
              <Plus className="w-5 h-5 flex-shrink-0" />
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">
                Create Memory
              </span>
            </button>
          </div>

          {/* User card */}
          <div
            className="mx-2 mt-3 mb-4 flex items-center rounded-xl hover:bg-white/5 transition-colors cursor-pointer group/user overflow-hidden"
            style={{ minHeight: "56px", padding: "0 10px" }}
            onClick={() => navigate("/profile")}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {user?.profilePicture
                ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                : (user?.username?.charAt(0).toUpperCase() || "U")}
            </div>
            <div className="ml-3 flex-1 min-w-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">
              <p className="text-white text-xs font-semibold truncate">{user?.username}</p>
              <p className="text-slate-600 text-xs truncate">{user?.email}</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); logout(); navigate("/login"); }}
              className="ml-2 p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover/sidebar:opacity-100 group-hover/user:opacity-100 transition-opacity duration-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* ── Feed ──────────────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 border-r border-white/[0.06]">
          {/* Feed header */}
          <div className="sticky top-0 z-40 px-6 py-3 flex items-center justify-between border-b border-white/[0.06]" style={{ background: "#0d0d1a" }}>
            <h2 className="text-base font-bold text-white">
              {viewMode === "2d" ? "Home" : "Galaxy View"}
            </h2>
            <div className="flex items-center gap-1 p-1 rounded-xl border border-white/8" style={{ background: "#161628" }}>
              {[{ k: "2d", label: "Feed", icon: Grid }, { k: "3d", label: "Galaxy", icon: Globe }].map(({ k, label, icon: Icon }) => (
                <button key={k} onClick={() => setViewMode(k)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === k ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}>
                  <Icon className="w-3.5 h-3.5" /><span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 pb-24 lg:pb-6">
            <AnimatePresence mode="wait">
              {viewMode === "2d" ? (
                <motion.div key="2d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <CreateBar user={user} onNavigate={go} />

                  {/* Divider */}
                  <div className="my-4" style={{ height: "1px", background: "rgba(255,255,255,0.04)" }} />

                  {loading ? (
                    <div className="space-y-0 divide-y divide-white/8">
                      {[...Array(3)].map((_, i) => <div key={i} className="py-4"><MemoryCardSkeleton /></div>)}
                    </div>
                  ) : memories.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                        <HomeIcon className="w-8 h-8 text-indigo-400" />
                      </div>
                      <p className="text-white font-semibold mb-1">No memories yet</p>
                      <p className="text-slate-500 text-sm mb-5">Be the first to share something!</p>
                      <button onClick={() => navigate("/create")}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all">
                        Create Memory
                      </button>
                    </div>
                  ) : (
                    <InfiniteScroll dataLength={memories.length} next={loadMore} hasMore={hasMore}
                      loader={<div className="space-y-4 mt-4">{[...Array(2)].map((_, i) => <MemoryCardSkeleton key={i} />)}</div>}
                      endMessage={<p className="text-center text-slate-600 text-sm py-10">You're all caught up ✦</p>}
                      scrollThreshold={0.85} style={{ overflow: "visible" }}>
                      <div className="space-y-4">
                        {memories.map((memory, index) => (
                          <MemoryCard key={memory._id} memory={memory} index={index}
                            onLike={handleLike} onCommentClick={handleOpenComments}
                            formatTime={formatTime} getEmotionColor={getEmotionColor} isLiked={isLiked} />
                        ))}
                      </div>
                    </InfiniteScroll>
                  )}
                </motion.div>
              ) : (
                <motion.div key="3d" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <GalaxyView memories={memories} onMemoryClick={setSelectedMemory} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* ── Right sidebar ─────────────────────────────────────────────────── */}
        <aside className="hidden xl:flex flex-col w-[340px] flex-shrink-0 px-5 py-6 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
            <input readOnly onClick={() => navigate("/search")} placeholder="Search"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-slate-300 placeholder-slate-600 text-sm cursor-pointer focus:outline-none transition-colors"
              style={{ background: "#13132a", border: "1px solid rgba(99,102,241,0.15)" }} />
          </div>

          {/* Suggested */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <span className="text-white font-bold text-sm">Suggested for you</span>
              <button onClick={() => navigate("/discover")} className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold transition-colors">See all</button>
            </div>
            {suggestedUsers.length === 0 ? (
              <p className="px-4 pb-4 text-slate-600 text-xs">No suggestions right now</p>
            ) : (
              <div className="pb-3">
                {suggestedUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors">
                    <button onClick={() => navigate(`/user/${u.id}`)}
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 hover:opacity-80 transition-opacity">
                      {u.username?.charAt(0).toUpperCase()}
                    </button>
                    <button onClick={() => navigate(`/user/${u.id}`)} className="flex-1 min-w-0 text-left">
                      <p className="text-white text-xs font-semibold truncate">{u.username}</p>
                      <p className="text-slate-600 text-xs">Suggested for you</p>
                    </button>
                    <button onClick={e => handleFollow(u.id, e)} disabled={!!followingStatus[u.id]}
                      className={`text-xs font-bold transition-colors ${followingStatus[u.id] ? "text-slate-600 cursor-not-allowed" : "text-indigo-400 hover:text-indigo-300"}`}>
                      {followingStatus[u.id] ? "Following" : "Follow"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trending hashtags */}
          {trendingHashtags.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-white font-bold text-sm">Trending</span>
              </div>
              <div className="pb-3">
                {trendingHashtags.map((h, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-slate-300 text-sm font-medium">{h.tag}</span>
                    </div>
                    <span className="text-slate-600 text-xs">{h.posts} posts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Memories */}
          {trendingMemories.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-bold text-sm">Top Memories</span>
              </div>
              <div className="pb-3">
                {trendingMemories.map(m => (
                  <button key={m._id} onClick={() => setSelectedMemory(m)}
                    className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors text-left">
                    {m.image && <img src={m.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">{m.caption}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-slate-600 text-xs">{m.user?.username}</span>
                        <span className="text-slate-700 text-xs flex items-center gap-0.5"><Heart className="w-3 h-3" />{m.likesCount || 0}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-700 px-1 mt-1">
            {["About", "Privacy", "Terms", "Help"].map(l => (
              <button key={l} className="hover:text-slate-500 transition-colors">{l}</button>
            ))}
            <span className="w-full text-slate-800 mt-1">© 2026 AURA</span>
          </div>
        </aside>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-white/8 px-2 py-2 z-50" style={{ background: "#0d0d1a" }}>
        <div className="flex items-center justify-around max-w-sm mx-auto">
          {[
            { icon: HomeIcon, path: "/" },
            { icon: Search, path: "/search" },
            { icon: Plus, path: "/create", fab: true },
            { icon: Bell, path: "/notifications" },
            { icon: User, path: "/profile" },
          ].map(({ icon: Icon, path, fab }) => (
            <button key={path} onClick={() => navigate(path)}
              className={fab
                ? "w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/50"
                : `p-2.5 rounded-xl transition-colors ${location.pathname === path ? "text-indigo-400 bg-indigo-400/10" : "text-slate-500 hover:text-white"}`}>
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </nav>

      {/* Memory detail modal */}
      <AnimatePresence>
        {selectedMemory && (
          <motion.div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMemory(null)}>
            <motion.div className="rounded-2xl p-6 max-w-md w-full border border-white/10"
              style={{ background: "#161628" }}
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}>
              <h3 className="text-white font-bold mb-2">{selectedMemory.user?.username || "Unknown"}</h3>
              <p className="text-slate-300 mb-4 text-sm leading-relaxed">{selectedMemory.caption}</p>
              {selectedMemory.emotions?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedMemory.emotions.map((e, i) => (
                    <span key={i} className={`px-2.5 py-0.5 rounded-full text-xs border ${getEmotionColor(e)}`}>{e}</span>
                  ))}
                </div>
              )}
              <button onClick={() => setSelectedMemory(null)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors text-sm font-semibold">
                Close
              </button>
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