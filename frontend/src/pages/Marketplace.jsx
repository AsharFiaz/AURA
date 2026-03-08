import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { showInfo } from "../utils/toast";
import { MemoryCardSkeleton } from "../components/common/LoadingSkeleton";
import {
  Search, Filter, TrendingUp, Sparkles,
  Home as HomeIcon, Bell, User as UserIcon,
  Compass, ShoppingBag, Mail, Bookmark,
  LogOut, Plus,
} from "lucide-react";

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

// ─── Marketplace ──────────────────────────────────────────────────────────────
const Marketplace = () => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Popular");
  const [stats, setStats] = useState({ totalMemories: 0, totalLikes: 0, activeSellers: 0, floorPrice: 0.15, volume24h: 0 });
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { fetchMemories(); fetchStats(); }, []);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const r = await api.get("/memories/feed");
      if (r.data.success) setMemories(r.data.memories);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const r = await api.get("/memories/stats");
      if (r.data.success) setStats(r.data.stats);
    } catch (e) { console.error(e); }
  };

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

  const getRandomPrice = (i) => [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5][i % 9];
  const handleBuy = () => showInfo("Blockchain integration coming soon! 🔗");
  const handleBid = () => showInfo("Bidding feature coming soon! 💰");

  const filteredMemories = memories.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.caption?.toLowerCase().includes(q) ||
      m.user?.username?.toLowerCase().includes(q) ||
      m.emotions?.some(e => e.toLowerCase().includes(q));
  });

  const statItems = [
    { label: "Floor Price", value: `${stats.floorPrice} AURA` },
    { label: "Volume (24h)", value: `${stats.volume24h} AURA` },
    { label: "Active Sellers", value: stats.activeSellers },
    { label: "Total Items", value: stats.totalMemories },
  ];

  return (
    <div className="min-h-screen text-white" style={{ background: "#0d0d1a" }}>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">AURA</span>
        <button onClick={() => navigate("/search")} className="p-2 text-slate-400 hover:text-white"><Search className="w-5 h-5" /></button>
      </div>

      <div className="flex">
        <Sidebar user={user} logout={logout} navigate={navigate} location={location} />

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Page header */}
          <div className="sticky top-0 z-40 px-6 py-4"
            style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-base font-bold text-white">Marketplace</h1>
                <p className="text-slate-600 text-xs mt-0.5">Discover and collect inspiring memories as NFTs</p>
              </div>
              {/* Search + filters inline */}
              <div className="hidden md:flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                  <input type="text" placeholder="Search memories…" value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none w-52 transition-all"
                    style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.07)" }}
                    onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.4)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"}
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-3.5 h-3.5 pointer-events-none" />
                  <select value={filter} onChange={e => setFilter(e.target.value)}
                    className="pl-8 pr-3 py-2 rounded-xl text-slate-300 text-sm focus:outline-none appearance-none cursor-pointer"
                    style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {["All", "Featured", "New"].map(v => <option key={v} value={v} style={{ background: "#13132a" }}>{v}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-3.5 h-3.5 pointer-events-none" />
                  <select value={sort} onChange={e => setSort(e.target.value)}
                    className="pl-8 pr-3 py-2 rounded-xl text-slate-300 text-sm focus:outline-none appearance-none cursor-pointer"
                    style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {["Popular", "Price", "Recent"].map(v => <option key={v} value={v} style={{ background: "#13132a" }}>{v}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 pb-24 lg:pb-8 space-y-6">

            {/* Mobile search */}
            <div className="md:hidden flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                <input type="text" placeholder="Search memories…" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none"
                  style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.07)" }} />
              </div>
            </div>

            {/* Stats */}
            <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              {statItems.map(({ label, value }) => (
                <div key={label} className="rounded-2xl p-4"
                  style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="text-slate-600 text-xs mb-1">{label}</p>
                  <p className="text-xl font-bold text-white">{value}</p>
                </div>
              ))}
            </motion.div>

            {/* Featured drop */}
            <motion.div className="rounded-2xl p-6 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.2), rgba(124,58,237,0.15))", border: "1px solid rgba(99,102,241,0.25)" }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              {/* Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)" }} />
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-indigo-300 text-xs font-semibold uppercase tracking-wide">Featured Drop</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Aurora Memory — Limited Edition</h2>
              <p className="text-slate-400 text-sm mb-4 max-w-md">A collection of the most inspiring moments from the AURA community</p>
              <motion.button
                className="px-5 py-2 text-white text-sm font-semibold rounded-xl transition-all"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 16px rgba(79,70,229,0.3)" }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                Explore Collection
              </motion.button>
            </motion.div>

            {/* Collections */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="text-sm font-bold text-white mb-3 uppercase tracking-wide text-slate-400">Collections</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { title: "Luminous Stories", desc: "Stories that light up the darkness and inspire hope", count: 12 },
                  { title: "Kindness Streaks", desc: "Acts of kindness that create ripples of positivity", count: 8 },
                ].map(c => (
                  <motion.div key={c.title} className="rounded-2xl p-5 cursor-pointer transition-all"
                    style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
                    whileHover={{ scale: 1.02, borderColor: "rgba(99,102,241,0.3)" }}>
                    <h3 className="text-white font-semibold mb-1 text-sm">{c.title}</h3>
                    <p className="text-slate-500 text-xs mb-3">{c.desc}</p>
                    <span className="text-xs font-semibold text-indigo-400">{c.count} items</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* All memories grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">All Memories</h2>
                {!loading && (
                  <span className="text-slate-600 text-xs">{filteredMemories.length} items</span>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => <MemoryCardSkeleton key={i} />)}
                </div>
              ) : filteredMemories.length === 0 ? (
                <div className="text-center py-16 rounded-2xl"
                  style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <Sparkles className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No memories found</p>
                </div>
              ) : (
                <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                  initial="hidden" animate="visible"
                  variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}>
                  {filteredMemories.map((memory, i) => (
                    <motion.div key={memory._id}
                      className="rounded-2xl overflow-hidden cursor-pointer group"
                      style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
                      variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                      whileHover={{ scale: 1.02, borderColor: "rgba(99,102,241,0.3)" }}>

                      {/* Image */}
                      <div className="w-full h-44 relative overflow-hidden"
                        style={{ background: "linear-gradient(135deg,rgba(79,70,229,0.15),rgba(124,58,237,0.1))" }}>
                        {memory.image ? (
                          <img src={memory.image} alt="Memory" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full">
                            <Sparkles className="w-10 h-10 text-indigo-400/50 mb-2" />
                            <p className="text-slate-600 text-xs">Memory NFT</p>
                          </div>
                        )}
                        {/* Price badge */}
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-white text-xs font-bold"
                          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}>
                          {getRandomPrice(i)} AURA
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <p className="text-white text-sm font-medium line-clamp-2 mb-2.5">{memory.caption}</p>

                        {memory.emotions?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {memory.emotions.slice(0, 2).map((e, idx) => (
                              <span key={idx} className={`px-2 py-0.5 rounded-full text-xs border ${getEmotionColor(e)}`}>{e}</span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px" }}>
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {memory.user?.username?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <span className="text-slate-500 text-xs">{memory.user?.username || "Unknown"}</span>
                        </div>

                        <div className="flex gap-2">
                          <motion.button onClick={handleBuy} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            className="flex-1 py-2 rounded-xl text-white text-xs font-semibold transition-all"
                            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                            Buy
                          </motion.button>
                          <motion.button onClick={handleBid} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            className="flex-1 py-2 rounded-xl text-slate-300 hover:text-white text-xs font-semibold transition-all"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            Bid
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-white/[0.05] px-2 py-2 z-50"
        style={{ background: "#0d0d1a" }}>
        <div className="flex items-center justify-around max-w-sm mx-auto">
          {[
            { icon: HomeIcon, path: "/" },
            { icon: Search, path: "/search" },
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

export default Marketplace;