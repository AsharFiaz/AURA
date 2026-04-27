import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { showSuccess, showError } from "../utils/toast";
import { ProfileSkeleton, MemoryCardSkeleton } from "../components/common/LoadingSkeleton";
import LockedMemoryCard from "../components/common/LockedMemoryCard";
import AnimatedBackdrop from "../components/common/AnimatedBackdrop";
import BombasticSidebar from "../components/common/BombasticSidebar";
import CommandBar from "../components/common/CommandBar";
import MobileTopBar from "../components/common/MobileTopBar";
import MobileBottomNav from "../components/common/MobileBottomNav";
import {
  Mail, Heart, Grid, UserPlus, UserCheck,
  User as UserIcon, ArrowLeft, Sparkles,
} from "lucide-react";

// ─── Map dominant OCEAN trait → ring color (consistency with Home/Discover) ──
const TRAIT_KEYS = ["O", "C", "E", "A", "N"];
const getDominantTrait = (personality) => {
  if (!personality) return "O";
  let best = "O", val = -1;
  for (const k of TRAIT_KEYS) {
    if (typeof personality[k] === "number" && personality[k] > val) {
      val = personality[k]; best = k;
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

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

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
    <div className="min-h-screen text-white relative">
      <AnimatedBackdrop />
      <CommandBar isLive={false} />
      <MobileTopBar title="Profile" icon={UserIcon} />
      <div className="flex relative">
        <BombasticSidebar />
        <main className="flex-1 min-w-0 px-6 py-8"><ProfileSkeleton /></main>
      </div>
      <MobileBottomNav />
    </div>
  );

  if (!profileUser) return (
    <div className="min-h-screen flex items-center justify-center text-white relative">
      <AnimatedBackdrop />
      <motion.div className="text-center relative z-10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-slate-500 mb-4">User not found</p>
        <motion.button onClick={() => navigate("/")}
          className="text-indigo-400 hover:text-indigo-300 text-sm px-4 py-2 rounded-xl"
          style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
          whileHover={{ scale: 1.05 }}>
          Go to Home
        </motion.button>
      </motion.div>
    </div>
  );

  const dominant = getDominantTrait(profileUser.personality);
  const ringStyle = TRAIT_RING_COLORS[dominant];
  const hasPersonality = profileUser.personality && TRAIT_KEYS.some(k => typeof profileUser.personality[k] === "number");

  return (
    <div className="min-h-screen text-white relative">
      <AnimatedBackdrop />

      <CommandBar recentActivityCount={memories.length} isLive={!loadingMemories} />
      <MobileTopBar title={profileUser.username} icon={UserIcon} />

      <div className="flex relative">
        <BombasticSidebar />

        <main className="flex-1 min-w-0">
          {/* Sticky page header */}
          <motion.div
            className="sticky top-[42px] z-40 px-6 py-3 flex items-center gap-3"
            style={{
              background: "rgba(10,10,20,0.85)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(167,139,250,0.1)",
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {profileUser.profilePicture
                  ? <img src={profileUser.profilePicture} alt="" className="w-full h-full object-cover" />
                  : profileUser.username?.charAt(0).toUpperCase()}
              </div>
              <h1 className="text-sm font-bold bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-transparent">
                {profileUser.username}
              </h1>
            </div>
          </motion.div>

          <div className="max-w-4xl mx-auto px-4 lg:px-6 py-5 pb-24 lg:pb-8 space-y-4">

            {/* Profile hero card */}
            <motion.div className="rounded-2xl overflow-hidden relative"
              style={{
                background: "rgba(19,19,42,0.7)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(167,139,250,0.15)",
                boxShadow: "0 0 40px rgba(124,58,237,0.1)",
              }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

              {/* Animated banner */}
              <div className="h-32 relative overflow-hidden"
                style={{ background: "linear-gradient(135deg,rgba(79,70,229,0.5),rgba(124,58,237,0.4),rgba(16,185,129,0.2))" }}>
                <motion.div
                  className="absolute -top-4 -left-4 w-40 h-40 rounded-full"
                  style={{ background: "radial-gradient(circle,rgba(99,102,241,0.4),transparent 70%)" }}
                  animate={{ x: [0, 20, 0], y: [0, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute top-2 right-10 w-24 h-24 rounded-full"
                  style={{ background: "radial-gradient(circle,rgba(139,92,246,0.3),transparent 70%)" }}
                  animate={{ x: [0, -15, 0], y: [0, 15, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />
                <motion.div
                  className="absolute bottom-0 left-1/2 w-32 h-16 rounded-full"
                  style={{ background: "radial-gradient(circle,rgba(16,185,129,0.2),transparent 70%)" }}
                  animate={{ x: [0, 30, 0], scale: [1, 1.3, 1] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                />
                {/* Sparkles in banner */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{ left: `${15 + i * 18}%`, top: `${20 + (i % 2) * 50}%` }}
                    animate={{
                      y: [0, -8, 0],
                      opacity: [0.3, 0.8, 0.3],
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
                  >
                    <Sparkles className="w-3 h-3 text-white/60" />
                  </motion.div>
                ))}
              </div>

              <div className="px-5 pb-5">
                <div className="flex items-end justify-between -mt-12 mb-3">
                  <motion.div
                    className="rounded-full p-[3px] flex-shrink-0"
                    style={{ background: hasPersonality ? ringStyle : "rgba(100,116,139,0.4)" }}
                    animate={{ rotate: hasPersonality ? 360 : 0 }}
                    transition={{ duration: 20, repeat: hasPersonality ? Infinity : 0, ease: "linear" }}
                  >
                    <div
                      className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold"
                      style={{ boxShadow: "0 0 0 3px #0d0d1a, 0 0 24px rgba(99,102,241,0.35)" }}
                    >
                      {profileUser.profilePicture
                        ? <img src={profileUser.profilePicture} alt={profileUser.username} className="w-full h-full object-cover" />
                        : profileUser.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                  </motion.div>

                  {user && !isOwnProfile && (
                    <motion.button onClick={isFollowing ? handleUnfollow : handleFollow}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all relative overflow-hidden"
                      style={isFollowing
                        ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }
                        : { background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", boxShadow: "0 4px 16px rgba(79,70,229,0.3)" }}
                      whileHover={{ scale: 1.05, boxShadow: !isFollowing ? "0 4px 24px rgba(124,58,237,0.5)" : "" }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}>
                      {!isFollowing && (
                        <motion.div
                          className="absolute inset-0"
                          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }}
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        />
                      )}
                      <span className="relative flex items-center gap-2">
                        {isFollowing ? <><UserCheck className="w-4 h-4" />Following</> : <><UserPlus className="w-4 h-4" />Follow</>}
                      </span>
                    </motion.button>
                  )}
                  {isOwnProfile && (
                    <motion.button onClick={() => navigate("/profile")}
                      className="px-5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                      whileHover={{ scale: 1.03, borderColor: "rgba(167,139,250,0.3)" }}
                      whileTap={{ scale: 0.97 }}>
                      Edit Profile
                    </motion.button>
                  )}
                </div>
                <motion.h1
                  className="text-xl font-bold bg-gradient-to-r from-white via-indigo-100 to-violet-200 bg-clip-text text-transparent mb-0.5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}>
                  {profileUser.username}
                </motion.h1>
                <div className="flex items-center gap-1.5 text-slate-600 text-xs mb-0.5">
                  <Mail className="w-3 h-3" /><span>{profileUser.email}</span>
                </div>
                <p className="text-slate-700 text-xs">Joined {getMemberSince()}</p>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3"
              initial="hidden" animate="visible"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}>
              {[
                { label: "Memories", value: memories.length + lockedCount, color: "#a78bfa" },
                { label: "Likes", value: totalLikes, color: "#ec4899" },
                { label: "Followers", value: followersCount, color: "#34d399" },
                { label: "Following", value: followingCount, color: "#f59e0b" },
              ].map(s => (
                <motion.div key={s.label}
                  className="rounded-2xl p-4 text-center relative overflow-hidden"
                  style={{
                    background: "rgba(19,19,42,0.7)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(167,139,250,0.1)",
                  }}
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                  whileHover={{
                    scale: 1.04,
                    borderColor: "rgba(167,139,250,0.3)",
                    boxShadow: `0 0 24px ${s.color}30`,
                  }}>
                  <p className="text-slate-600 text-xs mb-1 uppercase tracking-widest">{s.label}</p>
                  <motion.p
                    className="text-2xl font-bold text-white"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                    {s.value}
                  </motion.p>
                  <motion.span
                    className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full"
                    style={{ background: s.color }}
                    animate={{
                      boxShadow: [
                        `0 0 0px ${s.color}`,
                        `0 0 8px ${s.color}`,
                        `0 0 0px ${s.color}`,
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1 relative" style={{ borderBottom: "1px solid rgba(167,139,250,0.15)" }}>
              {[
                { id: "memories", icon: <Grid className="w-4 h-4" />, label: "Memories" },
                { id: "about", icon: <UserIcon className="w-4 h-4" />, label: "About" },
              ].map(tab => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? "text-indigo-400" : "text-slate-500 hover:text-white"}`}
                  whileHover={{ y: -1 }}
                >
                  {tab.icon}{tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ background: "linear-gradient(90deg, #818cf8, #a78bfa, #818cf8)", boxShadow: "0 0 8px rgba(167,139,250,0.6)" }}
                      layoutId="userProfileTab"
                    />
                  )}
                </motion.button>
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
                      {[...Array(6)].map((_, i) => (
                        <motion.div key={i}
                          animate={{ opacity: [0.4, 0.7, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}>
                          <MemoryCardSkeleton />
                        </motion.div>
                      ))}
                    </div>
                  ) : memories.length === 0 && lockedCount === 0 ? (
                    <motion.div
                      className="text-center py-16 rounded-2xl relative overflow-hidden"
                      style={{
                        background: "rgba(19,19,42,0.6)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(167,139,250,0.1)",
                      }}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}>
                      <motion.div
                        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                        style={{ background: "rgba(99,102,241,0.1)" }}
                        animate={{
                          boxShadow: [
                            "0 0 16px rgba(124,58,237,0.2)",
                            "0 0 32px rgba(124,58,237,0.4)",
                            "0 0 16px rgba(124,58,237,0.2)",
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Grid className="w-6 h-6 text-indigo-400" />
                      </motion.div>
                      <p className="text-slate-500 text-sm">No memories yet</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      initial="hidden" animate="visible"
                      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }}>
                      {memories.map((memory) => (
                        <motion.div key={memory._id} className="rounded-2xl p-4 transition-all relative overflow-hidden group"
                          style={{
                            background: "rgba(19,19,42,0.7)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(167,139,250,0.1)",
                          }}
                          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                          whileHover={{
                            borderColor: "rgba(167,139,250,0.35)",
                            scale: 1.02,
                            boxShadow: "0 0 24px rgba(124,58,237,0.2)",
                          }}>
                          {memory.image && (
                            <div className="mb-3 rounded-xl overflow-hidden h-36">
                              <img src={memory.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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

                      {/* Locked placeholders */}
                      {[...Array(lockedCount)].map((_, i) => (
                        <motion.div
                          key={`locked-${i}`}
                          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
                          <LockedMemoryCard index={memories.length + i} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {!isOwnProfile && lockedCount > 0 && !isFollowing && (
                    <motion.p className="text-center text-slate-600 text-xs mt-4"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                      {lockedCount} private {lockedCount === 1 ? "memory is" : "memories are"} hidden —{" "}
                      <button className="text-indigo-400 hover:text-indigo-300 transition-colors underline"
                        onClick={handleFollow}>follow to unlock followers-only content</button>
                    </motion.p>
                  )}
                </motion.div>
              )}

              {activeTab === "about" && (
                <motion.div key="about"
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                  <motion.div className="rounded-2xl p-6 space-y-5 relative overflow-hidden"
                    style={{
                      background: "rgba(19,19,42,0.7)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(167,139,250,0.1)",
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                        <motion.span
                          className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                          animate={{
                            boxShadow: [
                              "0 0 0px #a78bfa",
                              "0 0 8px #a78bfa",
                              "0 0 0px #a78bfa",
                            ],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        Interests
                      </h3>
                      {profileUser.interests?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profileUser.interests.map((interest, idx) => (
                            <motion.span key={idx}
                              className="px-3 py-1 rounded-full text-xs font-medium text-indigo-300"
                              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.04 }}
                              whileHover={{ scale: 1.08, borderColor: "rgba(99,102,241,0.5)" }}>
                              {interest}
                            </motion.span>
                          ))}
                        </div>
                      ) : <p className="text-slate-600 text-sm">No interests added yet</p>}
                    </div>
                    <div style={{ borderTop: "1px solid rgba(167,139,250,0.1)", paddingTop: "16px" }}>
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                        <motion.span
                          className="w-1.5 h-1.5 rounded-full bg-pink-400"
                          animate={{
                            boxShadow: [
                              "0 0 0px #ec4899",
                              "0 0 8px #ec4899",
                              "0 0 0px #ec4899",
                            ],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        Emotions
                      </h3>
                      {profileUser.emotions?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profileUser.emotions.map((e, idx) => (
                            <motion.span key={idx}
                              className={`px-3 py-1 rounded-full text-xs border ${getEmotionColor(e)}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.04 }}
                              whileHover={{ scale: 1.08 }}>
                              {e}
                            </motion.span>
                          ))}
                        </div>
                      ) : <p className="text-slate-600 text-sm">No emotions selected yet</p>}
                    </div>
                  </motion.div>
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

export default UserProfile;