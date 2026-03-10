import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { showSuccess, showError } from '../utils/toast';
import { UserCardSkeleton } from '../components/common/LoadingSkeleton';
import {
  Search as SearchIcon, Home as HomeIcon, Bell,
  User as UserIcon, Users, Plus, Compass,
  ShoppingBag, Mail, Bookmark, LogOut,
  TrendingUp, Clock, X, Heart, MessageCircle,
  Hash, UserPlus, UserCheck,
} from 'lucide-react';

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
            style={{ minHeight: "48px", padding: "0 14px" }}
          >
            <item.icon className={`w-6 h-6 flex-shrink-0 transition-colors ${location.pathname === item.path ? "text-indigo-400" : "group-hover/item:text-indigo-400"}`} />
            <span className="ml-4 text-[15px] font-medium whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75 flex-1 text-left">{item.label}</span>
            {item.badge && <span className="absolute top-3 left-8 w-2 h-2 rounded-full bg-red-500" />}
          </button>
        ))}
      </nav>
      <div className="px-2 mt-2">
        <button onClick={() => navigate("/create")}
          className="w-full flex items-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-indigo-900/40 overflow-hidden"
          style={{ minHeight: "44px", padding: "0 14px" }}>
          <Plus className="w-5 h-5 flex-shrink-0" />
          <span className="ml-4 whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">Create Memory</span>
        </button>
      </div>
      <div className="mx-2 mt-3 mb-4 flex items-center rounded-xl hover:bg-white/5 transition-colors cursor-pointer group/user overflow-hidden"
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

// ─── Emotion color helper ─────────────────────────────────────────────────────
const emotionColor = (e) => {
  const map = {
    happy: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
    sad: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    angry: "bg-red-500/10 text-red-300 border-red-500/30",
    excited: "bg-orange-500/10 text-orange-300 border-orange-500/30",
    nostalgic: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    peaceful: "bg-green-500/10 text-green-300 border-green-500/30",
  };
  return map[e?.toLowerCase()] || "bg-indigo-500/10 text-indigo-300 border-indigo-500/30";
};

// ─── Memory result card ───────────────────────────────────────────────────────
const MemoryResultCard = ({ memory, navigate, idx }) => (
  <motion.div
    className="rounded-2xl overflow-hidden cursor-pointer group"
    style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.06)" }}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: idx * 0.05 }}
    whileHover={{ scale: 1.015, borderColor: "rgba(99,102,241,0.35)" }}
    onClick={() => navigate(`/user/${memory.user?._id || memory.user?.id}`)}
  >
    {memory.image && (
      <div className="h-40 overflow-hidden">
        <img src={memory.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
    )}
    {memory.video && !memory.image && (
      <div className="h-40 bg-slate-800/60 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-indigo-600/80 flex items-center justify-center">
          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        </div>
      </div>
    )}
    <div className="p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold overflow-hidden flex-shrink-0">
          {memory.user?.profilePicture
            ? <img src={memory.user.profilePicture} alt="" className="w-full h-full object-cover" />
            : memory.user?.username?.charAt(0).toUpperCase()}
        </div>
        <span className="text-slate-400 text-xs font-medium truncate">{memory.user?.username || "Unknown"}</span>
      </div>
      <p className="text-white text-sm leading-snug line-clamp-2 mb-2">{memory.caption}</p>
      {memory.emotions?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {memory.emotions.slice(0, 2).map((em, i) => (
            <span key={i} className={`text-xs px-1.5 py-0.5 rounded-full border ${emotionColor(em)}`}>{em}</span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 text-slate-600 text-xs">
        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{memory.likesCount || 0}</span>
        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{memory.comments?.length || 0}</span>
      </div>
    </div>
  </motion.div>
);

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_RECENT = 5;

// ─── Main page ────────────────────────────────────────────────────────────────
const SearchUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('people'); // 'people' | 'memories'
  const [userResults, setUserResults] = useState([]);
  const [memoryResults, setMemoryResults] = useState([]);
  const [followingStatus, setFollowingStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [focused, setFocused] = useState(false);

  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-focus
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchQuery.trim()) {
      setUserResults([]); setMemoryResults([]); setSearched(false); return;
    }
    searchTimeoutRef.current = setTimeout(() => performSearch(searchQuery), 300);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery]);

  const performSearch = async (q) => {
    setLoading(true);
    setSearched(true);
    try {
      const [uRes, mRes] = await Promise.all([
        api.get(`/users/search?q=${encodeURIComponent(q)}`),
        api.get(`/memories/search?q=${encodeURIComponent(q)}`),
      ]);
      const foundUsers = uRes.data.success ? uRes.data.users : [];
      const foundMemories = mRes.data.success ? mRes.data.memories : [];
      setUserResults(foundUsers);
      setMemoryResults(foundMemories);

      // Auto-select tab with results, preferring people
      if (foundUsers.length === 0 && foundMemories.length > 0) setActiveTab('memories');
      else setActiveTab('people');

      // Batch-check follow statuses
      const statuses = {};
      await Promise.all(foundUsers.map(async (u) => {
        try {
          const r = await api.get(`/follow/check/${u.id}`);
          statuses[u.id] = r.data.isFollowing;
        } catch { statuses[u.id] = false; }
      }));
      setFollowingStatus(statuses);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (result) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(r => r.id !== result.id);
      return [result, ...filtered].slice(0, MAX_RECENT);
    });
    navigate(`/user/${result.id}`);
  };

  const handleFollow = async (userId) => {
    setFollowingStatus(p => ({ ...p, [userId]: true }));
    try {
      await api.post(`/follow/${userId}`);
      await refreshUser();
      showSuccess("Now following! ✨");
    } catch (err) {
      setFollowingStatus(p => ({ ...p, [userId]: false }));
      showError(err.response?.data?.message || "Failed to follow.");
    }
  };

  const handleUnfollow = async (userId) => {
    setFollowingStatus(p => ({ ...p, [userId]: false }));
    try {
      await api.delete(`/follow/${userId}`);
      await refreshUser();
      showSuccess("Unfollowed.");
    } catch (err) {
      setFollowingStatus(p => ({ ...p, [userId]: true }));
      showError(err.response?.data?.message || "Failed to unfollow.");
    }
  };

  const removeRecent = (e, id) => {
    e.stopPropagation();
    setRecentSearches(prev => prev.filter(r => r.id !== id));
  };

  const clearQuery = () => { setSearchQuery(''); inputRef.current?.focus(); };

  const isEmpty = !searchQuery.trim();
  const hasResults = userResults.length > 0 || memoryResults.length > 0;

  const tabs = [
    { id: 'people', label: 'People', count: userResults.length, icon: Users },
    { id: 'memories', label: 'Memories', count: memoryResults.length, icon: Hash },
  ];

  return (
    <div className="min-h-screen text-white" style={{ background: "#0d0d1a" }}>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center gap-3 px-4 py-3"
        style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <SearchIcon className="w-5 h-5 text-indigo-400" />
        <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">Search</span>
      </div>

      <div className="flex">
        <Sidebar user={user} logout={logout} navigate={navigate} location={location} />

        <main className="flex-1 min-w-0">
          {/* Sticky search header */}
          <div className="sticky top-0 z-40 px-6 py-4"
            style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div>
              {/* Input */}
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search people, memories, #hashtags…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 150)}
                  className="w-full pl-12 py-3 rounded-2xl text-white text-sm placeholder-slate-600 focus:outline-none transition-all"
                  style={{
                    paddingRight: "2.75rem",
                    background: "#13132a",
                    border: focused ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.07)",
                  }}
                />
                {/* Loading spinner */}
                {loading && (
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent pointer-events-none"
                    style={{ right: "0.875rem" }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                )}
                {/* Clear button */}
                <AnimatePresence>
                  {searchQuery && !loading && (
                    <motion.button
                      onClick={clearQuery}
                      className="absolute w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                      style={{ right: "0.9rem", top: "0.7rem", background: "rgba(255,255,255,0.1)" }}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                    >
                      <X className="w-3 h-3" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Tabs — shown only after a search with results */}
              <AnimatePresence>
                {searched && hasResults && (
                  <motion.div className="flex gap-2 mt-3"
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {tabs.map(tab => (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-white"
                          }`}
                        style={activeTab !== tab.id ? { background: "rgba(255,255,255,0.04)" } : {}}>
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-white/20" : "bg-white/5 text-slate-600"
                          }`}>{tab.count}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5 pb-24 lg:pb-8">
            <AnimatePresence mode="wait">

              {/* ── Idle / empty state ── */}
              {isEmpty && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {recentSearches.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span className="text-white font-semibold text-sm">Recent</span>
                        </div>
                        <button onClick={() => setRecentSearches([])}
                          className="text-indigo-400 hover:text-indigo-300 text-xs font-medium transition-colors">
                          Clear all
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {recentSearches.map(r => (
                          <motion.div key={r.id}
                            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}
                            whileHover={{ borderColor: "rgba(99,102,241,0.25)" }}
                            onClick={() => navigate(`/user/${r.id}`)}>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                              {r.username?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{r.username}</p>
                              <p className="text-slate-600 text-xs">{r.followerCount} followers</p>
                            </div>
                            <button onClick={e => removeRecent(e, r.id)}
                              className="p-1.5 text-slate-600 hover:text-slate-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ background: "rgba(99,102,241,0.1)" }}>
                      <SearchIcon className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h2 className="text-white font-bold mb-1">Search AURA</h2>
                    <p className="text-slate-600 text-sm">Find people, memories, or #hashtags</p>
                    <button onClick={() => navigate("/discover")}
                      className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-indigo-400 text-sm font-medium transition-all"
                      style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                      <TrendingUp className="w-4 h-4" /> Explore suggestions
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Loading skeletons ── */}
              {!isEmpty && loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {[...Array(4)].map((_, i) => <UserCardSkeleton key={i} />)}
                </motion.div>
              )}

              {/* ── No results ── */}
              {!isEmpty && !loading && searched && !hasResults && (
                <motion.div key="noresults" className="text-center py-16"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(255,255,255,0.04)" }}>
                    <Users className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-white font-semibold mb-1">No results found</p>
                  <p className="text-slate-600 text-sm">Nothing matched "<span className="text-slate-400">{searchQuery}</span>"</p>
                </motion.div>
              )}

              {/* ── People tab ── */}
              {!isEmpty && !loading && searched && activeTab === 'people' && (
                <motion.div key="people" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {userResults.length === 0 ? (
                    <div className="text-center py-10 text-slate-600 text-sm">
                      No people matched — try the <button className="text-indigo-400 underline" onClick={() => setActiveTab('memories')}>Memories tab</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <span className="text-white font-semibold text-sm">
                          {userResults.length} {userResults.length === 1 ? "result" : "results"}
                        </span>
                        <span className="text-slate-600 text-xs">for "{searchQuery}"</span>
                      </div>
                      <div className="space-y-2">
                        {userResults.map((result, i) => (
                          <motion.div key={result.id}
                            className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all group"
                            style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            whileHover={{ borderColor: "rgba(99,102,241,0.3)", scale: 1.01 }}
                            onClick={() => handleViewProfile(result)}
                          >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                              style={{ boxShadow: "0 0 16px rgba(99,102,241,0.2)" }}>
                              {result.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-semibold text-sm truncate">{result.username}</h3>
                              <p className="text-slate-600 text-xs mt-0.5">
                                {result.followerCount} {result.followerCount === 1 ? 'follower' : 'followers'}
                              </p>
                            </div>
                            {/* Follow / Unfollow button */}
                            <motion.button
                              onClick={e => { e.stopPropagation(); followingStatus[result.id] ? handleUnfollow(result.id) : handleFollow(result.id); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-shrink-0"
                              style={followingStatus[result.id]
                                ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }
                                : { background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff" }}
                              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              {followingStatus[result.id]
                                ? <><UserCheck className="w-3.5 h-3.5" /> Following</>
                                : <><UserPlus className="w-3.5 h-3.5" /> Follow</>}
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* ── Memories tab ── */}
              {!isEmpty && !loading && searched && activeTab === 'memories' && (
                <motion.div key="memories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {memoryResults.length === 0 ? (
                    <div className="text-center py-10 text-slate-600 text-sm">
                      No memories matched — try the <button className="text-indigo-400 underline" onClick={() => setActiveTab('people')}>People tab</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <Hash className="w-4 h-4 text-indigo-400" />
                        <span className="text-white font-semibold text-sm">
                          {memoryResults.length} {memoryResults.length === 1 ? "memory" : "memories"}
                        </span>
                        <span className="text-slate-600 text-xs">for "{searchQuery}"</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {memoryResults.map((m, i) => (
                          <MemoryResultCard key={m._id} memory={m} idx={i} navigate={navigate} />
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-white/[0.05] px-2 py-2 z-50"
        style={{ background: "#0d0d1a" }}>
        <div className="flex items-center justify-around max-w-sm mx-auto">
          {[
            { icon: HomeIcon, path: "/" },
            { icon: SearchIcon, path: "/search" },
            { icon: Plus, path: "/create", fab: true },
            { icon: Bell, path: "/notifications" },
            { icon: UserIcon, path: "/profile" },
          ].map(({ icon: Icon, path, fab }) => (
            <button key={path} onClick={() => navigate(path)}
              className={fab
                ? "w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg"
                : `p-2.5 rounded-xl transition-colors ${location.pathname === path ? "text-indigo-400 bg-indigo-400/10" : "text-slate-500 hover:text-white"}`
              }>
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default SearchUsers;