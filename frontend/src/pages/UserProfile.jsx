import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { showSuccess, showError } from "../utils/toast";
import { ProfileSkeleton, MemoryCardSkeleton } from "../components/common/LoadingSkeleton";
import LockedMemoryCard from "../components/common/LockedMemoryCard";
import {
  Mail, Heart, Grid, UserPlus, UserCheck,
  User as UserIcon, Home as HomeIcon, Search, Bell,
  Compass, ShoppingBag, Bookmark, LogOut, Plus, ArrowLeft,
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
            className={`flex items-center rounded-xl transition-all duration-150 group/item relative ${location.pathname === item.path ? "text-white bg-white/10" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            style={{ minHeight: "48px", padding: "0 14px" }}>
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

// ─── Emotion colour ───────────────────────────────────────────────────────────
const getEmotionColor = e => {
  const m = {
    Supportive: "bg-green-500/20 text-green-300 border-green-500/50",
    Stressed: "bg-red-500/20 text-red-300 border-red-500/50",
    Calm: "bg-blue-500/20 text-blue-300 border-blue-500/50",
    Inspiring: "bg-violet-500/20 text-violet-300 border-violet-500/50",
    Curious: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
    Playful: "bg-pink-500/20 text-pink-300 border-pink-500/50",
    Reflective: "bg-indigo-500/20 text-indigo-300 border-indigo-500/50",
  };
  return m[e] || "bg-slate-500/20 text-slate-300 border-slate-500/50";
};

// ─── UserProfile ──────────────────────────────────────────────────────────────
const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, refreshUser } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [memories, setMemories] = useState([]);
  const [lockedCount, setLockedCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMemories, setLoadingMemories] = useState(true);
  const [activeTab, setActiveTab] = useState("memories");

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserMemories();
      checkFollowingStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchUserProfile = async () => {
    try { setLoading(true); const r = await api.get(`/users/${userId}`); if (r.data.success) setProfileUser(r.data.user); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchUserMemories = async () => {
    try {
      setLoadingMemories(true);
      const r = await api.get(`/memories/user/${userId}`);
      if (r.data.success) {
        setMemories(r.data.memories);
        setLockedCount(r.data.lockedCount || 0);
      }
    } catch (e) { console.error(e); } finally { setLoadingMemories(false); }
  };

  const checkFollowingStatus = async () => {
    try { const r = await api.get(`/follow/check/${userId}`); if (r.data.success) setIsFollowing(r.data.isFollowing); }
    catch (e) { console.error(e); }
  };

  const handleFollow = async () => {
    setIsFollowing(true);
    try {
      const r = await api.post(`/follow/${userId}`);
      if (r.data.success) {
        refreshUser?.();
        fetchUserProfile();
        // Re-fetch memories — following now unlocks "followers only" memories
        fetchUserMemories();
        showSuccess(`Following ${profileUser?.username}! ✨`);
      } else { setIsFollowing(false); showError("Failed to follow."); }
    } catch (e) { setIsFollowing(false); showError(e.response?.data?.message || "Failed to follow."); }
  };

  const handleUnfollow = async () => {
    setIsFollowing(false);
    try {
      const r = await api.delete(`/follow/${userId}`);
      if (r.data.success) {
        refreshUser?.();
        fetchUserProfile();
        // Re-fetch memories — unfollow hides "followers only" memories again
        fetchUserMemories();
        showSuccess(`Unfollowed ${profileUser?.username}`);
      } else { setIsFollowing(true); showError("Failed to unfollow."); }
    } catch (e) { setIsFollowing(true); showError(e.response?.data?.message || "Failed to unfollow."); }
  };

  const getMemberSince = () => {
    if (!profileUser?.createdAt) return "Recently";
    return new Date(profileUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const totalLikes = memories.reduce((s, m) => s + (m.likesCount || 0), 0);
  const followersCount = Array.isArray(profileUser?.followers) ? profileUser.followers.length : 0;
  const followingCount = Array.isArray(profileUser?.following) ? profileUser.following.length : 0;
  const isOwnProfile = user?.id === userId;

  if (loading) return (
    <div className="min-h-screen text-white" style={{ background: "#0d0d1a" }}>
      <div className="flex">
        <Sidebar user={user} logout={logout} navigate={navigate} location={location} />
        <main className="flex-1 min-w-0 px-6 py-8"><ProfileSkeleton /></main>
      </div>
    </div>
  );

  if (!profileUser) return (
    <div className="min-h-screen flex items-center justify-center text-white" style={{ background: "#0d0d1a" }}>
      <div className="text-center">
        <p className="text-slate-500 mb-4">User not found</p>
        <button onClick={() => navigate("/")} className="text-indigo-400 hover:text-indigo-300 text-sm">Go to Home</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-white" style={{ background: "#0d0d1a" }}>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center gap-3 px-4 py-3"
        style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={() => navigate(-1)} className="p-2 text-slate-500 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-white truncate">{profileUser.username}</span>
      </div>

      <div className="flex">
        <Sidebar user={user} logout={logout} navigate={navigate} location={location} />

        <main className="flex-1 min-w-0">
          {/* Sticky header */}
          <div className="sticky top-0 z-40 px-6 py-3 flex items-center gap-3"
            style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <button onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {profileUser.profilePicture
                  ? <img src={profileUser.profilePicture} alt="" className="w-full h-full object-cover" />
                  : profileUser.username?.charAt(0).toUpperCase()}
              </div>
              <h1 className="text-sm font-bold text-white">{profileUser.username}</h1>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 lg:px-6 py-5 pb-24 lg:pb-8 space-y-4">

            {/* Profile hero card */}
            <motion.div className="rounded-2xl overflow-hidden"
              style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="h-28 relative overflow-hidden"
                style={{ background: "linear-gradient(135deg,rgba(79,70,229,0.5),rgba(124,58,237,0.4),rgba(16,185,129,0.2))" }}>
                <div className="absolute -top-4 -left-4 w-40 h-40 rounded-full"
                  style={{ background: "radial-gradient(circle,rgba(99,102,241,0.4),transparent 70%)" }} />
                <div className="absolute top-2 right-10 w-24 h-24 rounded-full"
                  style={{ background: "radial-gradient(circle,rgba(139,92,246,0.3),transparent 70%)" }} />
                <div className="absolute bottom-0 left-1/2 w-32 h-16 rounded-full"
                  style={{ background: "radial-gradient(circle,rgba(16,185,129,0.2),transparent 70%)" }} />
              </div>
              <div className="px-5 pb-5">
                <div className="flex items-end justify-between -mt-10 mb-3">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                    style={{ boxShadow: "0 0 0 4px #13132a, 0 0 24px rgba(99,102,241,0.35)" }}>
                    {profileUser.profilePicture
                      ? <img src={profileUser.profilePicture} alt={profileUser.username} className="w-full h-full object-cover" />
                      : profileUser.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                  {user && !isOwnProfile && (
                    <motion.button onClick={isFollowing ? handleUnfollow : handleFollow}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={isFollowing
                        ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }
                        : { background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", boxShadow: "0 4px 16px rgba(79,70,229,0.3)" }}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      {isFollowing ? <><UserCheck className="w-4 h-4" />Following</> : <><UserPlus className="w-4 h-4" />Follow</>}
                    </motion.button>
                  )}
                  {isOwnProfile && (
                    <button onClick={() => navigate("/profile")}
                      className="px-5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      Edit Profile
                    </button>
                  )}
                </div>
                <h1 className="text-lg font-bold text-white mb-0.5">{profileUser.username}</h1>
                <div className="flex items-center gap-1.5 text-slate-600 text-xs mb-0.5">
                  <Mail className="w-3 h-3" /><span>{profileUser.email}</span>
                </div>
                <p className="text-slate-700 text-xs">Joined {getMemberSince()}</p>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              {[
                { label: "Memories", value: memories.length + lockedCount },
                { label: "Likes", value: totalLikes },
                { label: "Followers", value: followersCount },
                { label: "Following", value: followingCount },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-4 text-center"
                  style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="text-slate-600 text-xs mb-1">{s.label}</p>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                </div>
              ))}
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {[
                { id: "memories", icon: <Grid className="w-4 h-4" />, label: "Memories" },
                { id: "about", icon: <UserIcon className="w-4 h-4" />, label: "About" },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? "text-indigo-400" : "text-slate-500 hover:text-white"}`}>
                  {tab.icon}{tab.label}
                  {activeTab === tab.id && (
                    <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-indigo-400" layoutId="userProfileTab" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === "memories" && (
                <motion.div key="memories"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                  {loadingMemories ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...Array(6)].map((_, i) => <MemoryCardSkeleton key={i} />)}
                    </div>
                  ) : memories.length === 0 && lockedCount === 0 ? (
                    <div className="text-center py-16 rounded-2xl"
                      style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <Grid className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">No memories yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Visible memories */}
                      {memories.map((memory, i) => (
                        <motion.div key={memory._id} className="rounded-2xl p-4 transition-all"
                          style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
                          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={{ borderColor: "rgba(99,102,241,0.3)", scale: 1.01 }}>
                          {memory.image && (
                            <div className="mb-3 rounded-xl overflow-hidden h-36">
                              <img src={memory.image} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <p className="text-slate-200 text-sm font-medium line-clamp-2 mb-2.5">{memory.caption}</p>
                          {memory.emotions?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2.5">
                              {memory.emotions.slice(0, 2).map((e, idx) => (
                                <span key={idx} className={`px-2 py-0.5 rounded-full text-xs border ${getEmotionColor(e)}`}>{e}</span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-slate-600 text-xs pt-2"
                            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                            <Heart className="w-3.5 h-3.5" /><span>{memory.likesCount || 0}</span>
                          </div>
                        </motion.div>
                      ))}

                      {/* Locked placeholders for private memories */}
                      {[...Array(lockedCount)].map((_, i) => (
                        <LockedMemoryCard key={`locked-${i}`} index={memories.length + i} />
                      ))}
                    </div>
                  )}

                  {/* Hint shown to non-followers when there are locked cards */}
                  {!isOwnProfile && lockedCount > 0 && !isFollowing && (
                    <motion.p className="text-center text-slate-600 text-xs mt-4"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                      {lockedCount} private {lockedCount === 1 ? "memory is" : "memories are"} hidden —{" "}
                      <button className="text-indigo-400 hover:text-indigo-300 transition-colors"
                        onClick={handleFollow}>follow to unlock followers-only content</button>
                    </motion.p>
                  )}
                </motion.div>
              )}

              {activeTab === "about" && (
                <motion.div key="about"
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                  <div className="rounded-2xl p-6 space-y-5"
                    style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wide mb-3">Interests</h3>
                      {profileUser.interests?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profileUser.interests.map((interest, idx) => (
                            <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium text-indigo-300"
                              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
                              {interest}
                            </span>
                          ))}
                        </div>
                      ) : <p className="text-slate-600 text-sm">No interests added yet</p>}
                    </div>
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px" }}>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wide mb-3">Emotions</h3>
                      {profileUser.emotions?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profileUser.emotions.map((e, idx) => (
                            <span key={idx} className={`px-3 py-1 rounded-full text-xs border ${getEmotionColor(e)}`}>{e}</span>
                          ))}
                        </div>
                      ) : <p className="text-slate-600 text-sm">No emotions selected yet</p>}
                    </div>
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

export default UserProfile;