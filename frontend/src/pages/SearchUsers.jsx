import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { UserCardSkeleton } from '../components/common/LoadingSkeleton';
import {
  Search as SearchIcon, Home as HomeIcon, Bell,
  User as UserIcon, Users, Plus, Compass,
  ShoppingBag, Mail, Bookmark, LogOut,
  TrendingUp, Clock, X,
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
            className={`flex items-center rounded-xl transition-all duration-150 group/item relative ${location.pathname === item.path ? "text-white bg-white/10" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
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

// ─── Recent searches stored in memory ────────────────────────────────────────
const MAX_RECENT = 5;

const SearchUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [focused, setFocused] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchQuery.trim()) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => performSearch(searchQuery), 300);
    } else {
      setSearchResults([]);
    }
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery]);

  // Auto-focus on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  const performSearch = async (query) => {
    try {
      setLoading(true);
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      if (response.data.success) setSearchResults(response.data.users);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (result) => {
    // Save to recent
    setRecentSearches(prev => {
      const filtered = prev.filter(r => r.id !== result.id);
      return [result, ...filtered].slice(0, MAX_RECENT);
    });
    navigate(`/user/${result.id}`);
  };

  const removeRecent = (e, id) => {
    e.stopPropagation();
    setRecentSearches(prev => prev.filter(r => r.id !== id));
  };

  const clearQuery = () => { setSearchQuery(''); inputRef.current?.focus(); };

  const isEmpty = !searchQuery.trim();

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

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Sticky search header */}
          <div className="sticky top-0 z-40 px-6 py-4"
            style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="max-w-2xl mx-auto lg:mx-0">
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search people in AURA…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 150)}
                  className="w-full pl-12 pr-10 py-3 rounded-2xl text-white text-sm placeholder-slate-600 focus:outline-none transition-all"
                  style={{
                    background: "#13132a",
                    border: focused
                      ? "1px solid rgba(99,102,241,0.5)"
                      : "1px solid rgba(255,255,255,0.07)",
                  }}
                />
                {/* Clear button */}
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button onClick={clearQuery}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto lg:mx-0 px-6 py-5 pb-24 lg:pb-8">
            <AnimatePresence mode="wait">

              {/* Empty state */}
              {isEmpty && (
                <motion.div key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                  {/* Recent searches */}
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
                      <div className="space-y-2">
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

                  {/* Discover prompt */}
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ background: "rgba(99,102,241,0.1)" }}>
                      <SearchIcon className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h2 className="text-white font-bold mb-1">Find people on AURA</h2>
                    <p className="text-slate-600 text-sm">Search by username to discover and connect</p>
                    <button onClick={() => navigate("/discover")}
                      className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-indigo-400 text-sm font-medium transition-all"
                      style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                      <TrendingUp className="w-4 h-4" /> Explore suggestions
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Loading */}
              {!isEmpty && loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-3">
                  {[...Array(5)].map((_, i) => <UserCardSkeleton key={i} />)}
                </motion.div>
              )}

              {/* No results */}
              {!isEmpty && !loading && searchResults.length === 0 && (
                <motion.div key="noresults" className="text-center py-16"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(255,255,255,0.04)" }}>
                    <Users className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-white font-semibold mb-1">No results found</p>
                  <p className="text-slate-600 text-sm">
                    No one found for "<span className="text-slate-400">{searchQuery}</span>"
                  </p>
                </motion.div>
              )}

              {/* Results */}
              {!isEmpty && !loading && searchResults.length > 0 && (
                <motion.div key="results"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span className="text-white font-semibold text-sm">
                      {searchResults.length} {searchResults.length === 1 ? "result" : "results"}
                    </span>
                    <span className="text-slate-600 text-xs">for "{searchQuery}"</span>
                  </div>

                  <div className="space-y-2">
                    {searchResults.map((result, i) => (
                      <motion.div key={result.id}
                        className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all group"
                        style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        whileHover={{ borderColor: "rgba(99,102,241,0.3)", scale: 1.01 }}
                        onClick={() => handleViewProfile(result)}
                      >
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                          style={{ boxShadow: "0 0 16px rgba(99,102,241,0.2)" }}>
                          {result.username?.charAt(0).toUpperCase() || 'U'}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm truncate">{result.username}</h3>
                          <p className="text-slate-600 text-xs mt-0.5">
                            {result.followerCount} {result.followerCount === 1 ? 'follower' : 'followers'}
                          </p>
                        </div>

                        {/* View button */}
                        <motion.button
                          onClick={e => { e.stopPropagation(); handleViewProfile(result); }}
                          className="px-4 py-1.5 rounded-xl text-indigo-400 text-xs font-semibold transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                          style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          View
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
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