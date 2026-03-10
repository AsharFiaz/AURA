import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { showSuccess, showError } from "../utils/toast";
import { UserCardSkeleton } from "../components/common/LoadingSkeleton";
import {
  Users, UserPlus, UserCheck, Search, Plus,
  Home as HomeIcon, Bell, User as UserIcon,
  Compass, ShoppingBag, Mail, Bookmark, LogOut,
} from "lucide-react";

// ─── Shared Sidebar ───────────────────────────────────────────────────────────
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

// ─── Discover ─────────────────────────────────────────────────────────────────
const Discover = () => {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingStatus, setFollowingStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { fetchSuggestions(); }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await api.get("/follow/suggestions");
      if (response.data.success) {
        setSuggestedUsers(response.data.suggestions);
        checkFollowingStatuses(response.data.suggestions);
      }
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowingStatuses = async (users) => {
    try {
      const statuses = {};
      for (const u of users) {
        const r = await api.get(`/follow/check/${u.id}`);
        if (r.data.success) statuses[u.id] = r.data.isFollowing;
      }
      setFollowingStatus(statuses);
    } catch (err) {
      console.error("Error checking following statuses:", err);
    }
  };

  const handleFollow = async (userId, e) => {
    e.stopPropagation();
    setFollowingStatus(p => ({ ...p, [userId]: true }));
    try {
      const r = await api.post(`/follow/${userId}`);
      if (r.data.success) { await refreshUser(); showSuccess("You're now following this user! ✨"); }
      else { setFollowingStatus(p => ({ ...p, [userId]: false })); showError("Failed to follow user."); }
    } catch (err) {
      setFollowingStatus(p => ({ ...p, [userId]: false }));
      showError(err.response?.data?.message || "Failed to follow user.");
    }
  };

  const handleUnfollow = async (userId, e) => {
    e.stopPropagation();
    setFollowingStatus(p => ({ ...p, [userId]: false }));
    try {
      const r = await api.delete(`/follow/${userId}`);
      if (r.data.success) { await refreshUser(); showSuccess("You've unfollowed this user"); }
      else { setFollowingStatus(p => ({ ...p, [userId]: true })); showError("Failed to unfollow user."); }
    } catch (err) {
      setFollowingStatus(p => ({ ...p, [userId]: true }));
      showError(err.response?.data?.message || "Failed to unfollow user.");
    }
  };

  return (
    <div className="min-h-screen text-white" style={{ background: "#0d0d1a" }}>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">AURA</span>
        <button onClick={() => navigate("/search")} className="p-2 text-slate-400 hover:text-white">
          <Search className="w-5 h-5" />
        </button>
      </div>

      <div className="flex">
        <Sidebar user={user} logout={logout} navigate={navigate} location={location} />

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between"
            style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400" />
                Discover People
              </h1>
              <p className="text-slate-600 text-xs mt-0.5">Find and connect with the AURA community</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer"
              style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
              onClick={() => navigate("/search")}>
              <Search className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600 text-sm hidden sm:block">Search people…</span>
            </div>
          </div>

          <div className="px-6 py-6 pb-24 lg:pb-8">
            {/* Section label */}
            <div className="flex items-center gap-2 mb-5">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-white font-semibold text-sm">Suggested for you</span>
              <span className="text-slate-600 text-xs ml-1">
                {!loading && `· ${suggestedUsers.length} people`}
              </span>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <UserCardSkeleton key={i} />)}
              </div>
            ) : suggestedUsers.length === 0 ? (
              <div className="text-center py-20 rounded-2xl" style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(99,102,241,0.1)" }}>
                  <Users className="w-8 h-8 text-indigo-400" />
                </div>
                <p className="text-white font-semibold mb-1">No suggestions right now</p>
                <p className="text-slate-600 text-sm">Check back later for new people to follow</p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                initial="hidden"
                animate="visible"
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
              >
                {suggestedUsers.map((u) => {
                  const isFollowing = followingStatus[u.id] || false;
                  return (
                    <motion.div
                      key={u.id}
                      className="rounded-2xl p-5 cursor-pointer transition-all"
                      style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
                      variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                      whileHover={{ scale: 1.02, borderColor: "rgba(99,102,241,0.3)" }}
                      onClick={() => navigate(`/user/${u.id}`)}
                    >
                      {/* Avatar + info */}
                      <div className="flex flex-col items-center text-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold mb-3 shadow-lg"
                          style={{ boxShadow: "0 0 20px rgba(99,102,241,0.25)" }}>
                          {u.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <h3 className="text-white font-semibold text-sm mb-0.5">{u.username}</h3>
                        <p className="text-slate-600 text-xs">{u.followerCount || 0} followers</p>
                      </div>

                      {/* Follow / Following button */}
                      <motion.button
                        onClick={e => isFollowing ? handleUnfollow(u.id, e) : handleFollow(u.id, e)}
                        className="w-full py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                        style={isFollowing
                          ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }
                          : { background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff" }
                        }
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {isFollowing
                          ? <><UserCheck className="w-4 h-4" /> Following</>
                          : <><UserPlus className="w-4 h-4" /> Follow</>
                        }
                      </motion.button>
                    </motion.div>
                  );
                })}
              </motion.div>
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

export default Discover;