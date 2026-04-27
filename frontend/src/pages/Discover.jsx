import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { showSuccess, showError } from "../utils/toast";
import { UserCardSkeleton } from "../components/common/LoadingSkeleton";
import AnimatedBackdrop from "../components/common/AnimatedBackdrop";
import BombasticSidebar from "../components/common/BombasticSidebar";
import CommandBar from "../components/common/CommandBar";
import MobileTopBar from "../components/common/MobileTopBar";
import MobileBottomNav from "../components/common/MobileBottomNav";
import {
  Users, UserPlus, UserCheck, Search, Compass, Sparkles,
} from "lucide-react";

// ─── Map dominant OCEAN trait → ring color (same as Home) ────────────────────
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
const TRAIT_AVATAR_GRADIENT = {
  O: "linear-gradient(135deg, #a78bfa, #7c3aed)",
  C: "linear-gradient(135deg, #818cf8, #4f46e5)",
  E: "linear-gradient(135deg, #fbbf24, #d97706)",
  A: "linear-gradient(135deg, #6ee7b7, #059669)",
  N: "linear-gradient(135deg, #f87171, #b91c1c)",
};

// ─── Discover ─────────────────────────────────────────────────────────────────
const Discover = () => {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingStatus, setFollowingStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen text-white relative">
      <AnimatedBackdrop />

      <CommandBar recentActivityCount={suggestedUsers.length} isLive={!loading} />
      <MobileTopBar title="Discover" icon={Compass} showBack={false} />

      <div className="flex relative">
        <BombasticSidebar />

        <main className="flex-1 min-w-0">
          {/* Page header */}
          <motion.div
            className="sticky top-[42px] z-40 px-6 py-4 flex items-center justify-between"
            style={{
              background: "rgba(10,10,20,0.85)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(167,139,250,0.1)",
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                  <Compass className="w-5 h-5 text-indigo-400" />
                </motion.div>
                <span className="bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-transparent">
                  Discover People
                </span>
              </h1>
              <p className="text-slate-600 text-xs mt-0.5">Find and connect with the AURA community</p>
            </div>
            <motion.div
              className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer"
              style={{
                background: "rgba(19,19,42,0.8)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(167,139,250,0.15)",
              }}
              whileHover={{ scale: 1.03, borderColor: "rgba(167,139,250,0.3)" }}
              onClick={() => navigate("/search")}
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600 text-sm hidden sm:block">Search people…</span>
            </motion.div>
          </motion.div>

          <div className="px-6 py-6 pb-24 lg:pb-8">
            <motion.div
              className="flex items-center gap-2 mb-5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Users className="w-4 h-4 text-indigo-400" />
              </motion.div>
              <span className="text-white font-semibold text-sm">Suggested for you</span>
              <span className="text-slate-600 text-xs ml-1">
                {!loading && `· ${suggestedUsers.length} people`}
              </span>
            </motion.div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <UserCardSkeleton />
                  </motion.div>
                ))}
              </div>
            ) : suggestedUsers.length === 0 ? (
              <motion.div
                className="text-center py-20 rounded-2xl"
                style={{
                  background: "rgba(19,19,42,0.6)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(167,139,250,0.1)",
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative"
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
                  <Users className="w-8 h-8 text-indigo-400" />
                </motion.div>
                <p className="text-white font-semibold mb-1">No suggestions right now</p>
                <p className="text-slate-600 text-sm">Check back later for new people to follow</p>
              </motion.div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                initial="hidden"
                animate="visible"
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
              >
                {suggestedUsers.map((u) => {
                  const isFollowing = followingStatus[u.id] || false;
                  const dominant = getDominantTrait(u.personality);
                  const ringStyle = TRAIT_RING_COLORS[dominant];
                  const avatarBg = TRAIT_AVATAR_GRADIENT[dominant];
                  const hasPersonality = u.personality && TRAIT_KEYS.some(k => typeof u.personality[k] === "number");

                  return (
                    <motion.div
                      key={u.id}
                      className="rounded-2xl p-5 cursor-pointer transition-all relative overflow-hidden"
                      style={{
                        background: "rgba(19,19,42,0.7)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(167,139,250,0.1)",
                      }}
                      variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                      whileHover={{
                        scale: 1.02,
                        borderColor: "rgba(167,139,250,0.4)",
                        boxShadow: "0 0 32px rgba(124,58,237,0.2)",
                      }}
                      onClick={() => navigate(`/user/${u.id}`)}
                    >
                      {/* Shimmer on hover */}
                      <motion.div
                        className="absolute inset-0 opacity-0 pointer-events-none"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.05), transparent)" }}
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
                      />

                      <div className="flex flex-col items-center text-center mb-4 relative">
                        <motion.div
                          className="w-16 h-16 rounded-full p-[2px] mb-3"
                          style={{ background: hasPersonality ? ringStyle : "rgba(100,116,139,0.4)" }}
                          animate={{ rotate: hasPersonality ? 360 : 0 }}
                          transition={{ duration: 20, repeat: hasPersonality ? Infinity : 0, ease: "linear" }}
                        >
                          <div
                            className="w-full h-full rounded-full overflow-hidden flex items-center justify-center text-white text-xl font-bold"
                            style={{ background: u.profilePicture ? "transparent" : avatarBg }}
                          >
                            {u.profilePicture
                              ? <img src={u.profilePicture} alt={u.username} className="w-full h-full object-cover" />
                              : u.username?.charAt(0).toUpperCase() || "U"}
                          </div>
                        </motion.div>
                        <h3 className="text-white font-semibold text-sm mb-0.5">{u.username}</h3>
                        <p className="text-slate-600 text-xs">{u.followerCount || 0} followers</p>
                      </div>

                      <motion.button
                        onClick={e => isFollowing ? handleUnfollow(u.id, e) : handleFollow(u.id, e)}
                        className="w-full py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 relative overflow-hidden"
                        style={isFollowing
                          ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }
                          : { background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }
                        }
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {!isFollowing && (
                          <motion.div
                            className="absolute inset-0"
                            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }}
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                          />
                        )}
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

      <MobileBottomNav />
    </div>
  );
};

export default Discover;