import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { showSuccess, showError } from '../utils/toast';
import { UserCardSkeleton } from '../components/common/LoadingSkeleton';
import AnimatedBackdrop from '../components/common/AnimatedBackdrop';
import BombasticSidebar from '../components/common/BombasticSidebar';
import CommandBar from '../components/common/CommandBar';
import MobileTopBar from '../components/common/MobileTopBar';
import MobileBottomNav from '../components/common/MobileBottomNav';
import {
  Search as SearchIcon, Users,
  TrendingUp, Clock, X, Heart, MessageCircle,
  Hash, UserPlus, UserCheck,
} from 'lucide-react';

// Emotion color helper
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

// Memory result card
const MemoryResultCard = ({ memory, navigate, idx }) => (
  <motion.div
    className="rounded-2xl overflow-hidden cursor-pointer group"
    style={{
      background: "rgba(19,19,42,0.7)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(167,139,250,0.1)",
    }}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: idx * 0.05 }}
    whileHover={{
      scale: 1.02,
      borderColor: "rgba(167,139,250,0.35)",
      boxShadow: "0 0 24px rgba(124,58,237,0.2)",
    }}
    onClick={() => navigate(`/user/${memory.user?._id || memory.user?.id}`)}
  >
    {memory.image && (
      <div className="h-40 overflow-hidden">
        <img src={memory.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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

const MAX_RECENT = 5;

const SearchUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('people');
  const [userResults, setUserResults] = useState([]);
  const [memoryResults, setMemoryResults] = useState([]);
  const [followingStatus, setFollowingStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [focused, setFocused] = useState(false);

  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchQuery.trim()) {
      setUserResults([]); setMemoryResults([]); setSearched(false); return;
    }
    searchTimeoutRef.current = setTimeout(() => performSearch(searchQuery), 300);
    return () => clearTimeout(searchTimeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (foundUsers.length === 0 && foundMemories.length > 0) setActiveTab('memories');
      else setActiveTab('people');

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
    <div className="min-h-screen text-white relative">
      <AnimatedBackdrop />

      <CommandBar recentActivityCount={userResults.length + memoryResults.length} isLive={!loading} />
      <MobileTopBar title="Search" icon={SearchIcon} />

      <div className="flex relative">
        <BombasticSidebar />

        <main className="flex-1 min-w-0">
          {/* Sticky search header */}
          <motion.div
            className="sticky top-[42px] z-40 px-6 py-4"
            style={{
              background: "rgba(10,10,20,0.85)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(167,139,250,0.1)",
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none z-10" />
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
                  background: "rgba(19,19,42,0.8)",
                  backdropFilter: "blur(10px)",
                  border: focused ? "1px solid rgba(167,139,250,0.5)" : "1px solid rgba(167,139,250,0.15)",
                  boxShadow: focused ? "0 0 24px rgba(124,58,237,0.2)" : "none",
                }}
              />
              {loading && (
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent pointer-events-none"
                  style={{ right: "0.875rem" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              )}
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

            <AnimatePresence>
              {searched && hasResults && (
                <motion.div className="flex gap-2 mt-3"
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {tabs.map(tab => (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-colors z-10 ${activeTab === tab.id ? "text-white" : "text-slate-500 hover:text-white"
                        }`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {activeTab === tab.id && (
                        <motion.div
                          className="absolute inset-0 rounded-xl -z-10"
                          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 16px rgba(124,58,237,0.4)" }}
                          layoutId="searchTabIndicator"
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        />
                      )}
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-white/20" : "bg-white/5 text-slate-600"
                        }`}>{tab.count}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="px-6 py-5 pb-24 lg:pb-8">
            <AnimatePresence mode="wait">
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
                        {recentSearches.map((r, i) => (
                          <motion.div key={r.id}
                            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group"
                            style={{
                              background: "rgba(19,19,42,0.6)",
                              backdropFilter: "blur(10px)",
                              border: "1px solid rgba(167,139,250,0.08)",
                            }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ borderColor: "rgba(167,139,250,0.3)", x: 2 }}
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
                  <motion.div className="text-center py-16" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <motion.div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ background: "rgba(99,102,241,0.1)" }}
                      animate={{
                        boxShadow: [
                          "0 0 20px rgba(124,58,237,0.2)",
                          "0 0 40px rgba(124,58,237,0.4)",
                          "0 0 20px rgba(124,58,237,0.2)",
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <SearchIcon className="w-8 h-8 text-indigo-400" />
                    </motion.div>
                    <h2 className="text-white font-bold mb-1">Search AURA</h2>
                    <p className="text-slate-600 text-sm">Find people, memories, or #hashtags</p>
                    <motion.button
                      onClick={() => navigate("/discover")}
                      className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-indigo-400 text-sm font-medium transition-all"
                      style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
                      whileHover={{ scale: 1.05, borderColor: "rgba(99,102,241,0.4)" }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <TrendingUp className="w-4 h-4" /> Explore suggestions
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}

              {!isEmpty && loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <motion.div key={i} animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}>
                      <UserCardSkeleton />
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {!isEmpty && !loading && searched && !hasResults && (
                <motion.div key="noresults" className="text-center py-16"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(255,255,255,0.04)" }}>
                    <Users className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-white font-semibold mb-1">No results found</p>
                  <p className="text-slate-600 text-sm">Nothing matched "<span className="text-slate-400">{searchQuery}</span>"</p>
                </motion.div>
              )}

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
                            style={{
                              background: "rgba(19,19,42,0.7)",
                              backdropFilter: "blur(10px)",
                              border: "1px solid rgba(167,139,250,0.1)",
                            }}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            whileHover={{ borderColor: "rgba(167,139,250,0.3)", scale: 1.01, x: 4 }}
                            onClick={() => handleViewProfile(result)}
                          >
                            <motion.div
                              className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                              whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(124,58,237,0.5)" }}
                              style={{ boxShadow: "0 0 16px rgba(99,102,241,0.2)" }}
                            >
                              {result.username?.charAt(0).toUpperCase() || 'U'}
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-semibold text-sm truncate">{result.username}</h3>
                              <p className="text-slate-600 text-xs mt-0.5">
                                {result.followerCount} {result.followerCount === 1 ? 'follower' : 'followers'}
                              </p>
                            </div>
                            <motion.button
                              onClick={e => { e.stopPropagation(); followingStatus[result.id] ? handleUnfollow(result.id) : handleFollow(result.id); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-shrink-0"
                              style={followingStatus[result.id]
                                ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }
                                : { background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}
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

      <MobileBottomNav />
    </div>
  );
};

export default SearchUsers;