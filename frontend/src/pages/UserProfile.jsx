import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { showSuccess, showError } from "../utils/toast";
import {
  ProfileSkeleton,
  MemoryCardSkeleton,
} from "../components/common/LoadingSkeleton";
import {
  Mail,
  Heart,
  Grid,
  ArrowLeft,
  UserPlus,
  UserCheck,
  User as UserIcon,
  Home as HomeIcon,
  Search,
  Bell,
} from "lucide-react";

const UserProfile = () => {
  const { userId } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [memories, setMemories] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMemories, setLoadingMemories] = useState(true);
  const [activeTab, setActiveTab] = useState("memories");
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserMemories();
      checkFollowingStatus();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${userId}`);
      if (response.data.success) {
        setProfileUser(response.data.user);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserMemories = async () => {
    try {
      setLoadingMemories(true);
      const response = await api.get(`/memories/user/${userId}`);
      if (response.data.success) {
        setMemories(response.data.memories);
      }
    } catch (error) {
      console.error("Error fetching user memories:", error);
    } finally {
      setLoadingMemories(false);
    }
  };

  const checkFollowingStatus = async () => {
    try {
      const response = await api.get(`/follow/check/${userId}`);
      if (response.data.success) {
        setIsFollowing(response.data.isFollowing);
      }
    } catch (error) {
      console.error("Error checking following status:", error);
    }
  };

  const handleFollow = async () => {
    // Optimistic update
    setIsFollowing(true);

    try {
      const response = await api.post(`/follow/${userId}`);
      if (response.data.success) {
        // Refresh user data to update following count
        if (refreshUser) {
          refreshUser();
        }
        // Refresh profile user to update follower count
        fetchUserProfile();
        showSuccess(
          `You're now following ${profileUser?.username || "this user"}! ✨`
        );
      } else {
        // Revert on error
        setIsFollowing(false);
        showError("Failed to follow user. Please try again.");
      }
    } catch (error) {
      console.error("Error following user:", error);
      // Revert on error
      setIsFollowing(false);
      showError(
        error.response?.data?.message ||
          "Failed to follow user. Please try again."
      );
    }
  };

  const handleUnfollow = async () => {
    // Optimistic update
    setIsFollowing(false);

    try {
      const response = await api.delete(`/follow/${userId}`);
      if (response.data.success) {
        // Refresh user data to update following count
        if (refreshUser) {
          refreshUser();
        }
        // Refresh profile user to update follower count
        fetchUserProfile();
        showSuccess(
          `You've unfollowed ${profileUser?.username || "this user"}`
        );
      } else {
        // Revert on error
        setIsFollowing(true);
        showError("Failed to unfollow user. Please try again.");
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      // Revert on error
      setIsFollowing(true);
      showError(
        error.response?.data?.message ||
          "Failed to unfollow user. Please try again."
      );
    }
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      Supportive: "bg-green-500/20 text-green-300 border-green-500/50",
      Stressed: "bg-red-500/20 text-red-300 border-red-500/50",
      Calm: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      Inspiring: "bg-purple-500/20 text-purple-300 border-purple-500/50",
      Curious: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
      Playful: "bg-pink-500/20 text-pink-300 border-pink-500/50",
      Reflective: "bg-indigo-500/20 text-indigo-300 border-indigo-500/50",
    };
    return (
      colors[emotion] || "bg-slate-500/20 text-slate-300 border-slate-500/50"
    );
  };

  const getMemberSince = () => {
    if (!profileUser?.createdAt) return "Recently";
    const date = new Date(profileUser.createdAt);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const totalLikes = memories.reduce(
    (sum, memory) => sum + (memory.likesCount || 0),
    0
  );
  const followersCount = Array.isArray(profileUser?.followers)
    ? profileUser.followers.length
    : 0;
  const followingCount = Array.isArray(profileUser?.following)
    ? profileUser.following.length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">User not found</p>
          <button
            onClick={() => navigate("/")}
            className="text-purple-400 hover:text-purple-300"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
      {/* Top Navbar */}
      <motion.nav
        className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 px-4 py-3"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => navigate(-1)}
              className="text-slate-400 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
            <h1 className="text-xl font-semibold text-white truncate">
              {profileUser.username}
            </h1>
          </div>
          <motion.button
            onClick={() => navigate("/")}
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            AURA
          </motion.button>
        </div>
      </motion.nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div
          className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 md:p-8 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {profileUser.profilePicture ? (
                <img
                  src={profileUser.profilePicture}
                  alt={profileUser.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                profileUser.username?.charAt(0).toUpperCase() || "U"
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">
                {profileUser.username}
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-2 text-slate-400 mb-2">
                <Mail className="w-4 h-4" />
                <span>{profileUser.email}</span>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Member since {getMemberSince()}
              </p>
              {user && user.id !== userId && (
                <motion.button
                  onClick={isFollowing ? handleUnfollow : handleFollow}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
                    isFollowing
                      ? "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                      : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Memories</p>
            <p className="text-2xl font-bold text-white">{memories.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Likes</p>
            <p className="text-2xl font-bold text-white">{totalLikes}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Followers</p>
            <p className="text-2xl font-bold text-white">{followersCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Following</p>
            <p className="text-2xl font-bold text-white">{followingCount}</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          <motion.button
            onClick={() => setActiveTab("memories")}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === "memories"
                ? "text-purple-400"
                : "text-slate-400 hover:text-white"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5" />
              Memories
            </div>
            {activeTab === "memories" && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400"
                layoutId="activeTab"
              />
            )}
          </motion.button>
          <motion.button
            onClick={() => setActiveTab("about")}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === "about"
                ? "text-purple-400"
                : "text-slate-400 hover:text-white"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              About
            </div>
            {activeTab === "about" && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400"
                layoutId="activeTab"
              />
            )}
          </motion.button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "memories" && (
            <motion.div
              key="memories"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {loadingMemories ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, index) => (
                    <MemoryCardSkeleton key={index} />
                  ))}
                </div>
              ) : memories.length === 0 ? (
                <div className="text-center py-12">
                  <Grid className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">No memories yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {memories.map((memory, index) => (
                    <motion.div
                      key={memory._id}
                      className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <p className="text-white font-medium mb-2 line-clamp-2">
                        {memory.caption}
                      </p>
                      {memory.emotions && memory.emotions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {memory.emotions.slice(0, 2).map((emotion, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-1 rounded-full text-xs border ${getEmotionColor(
                                emotion
                              )}`}
                            >
                              {emotion}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Heart className="w-4 h-4" />
                        <span>{memory.likesCount || 0}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "about" && (
            <motion.div
              key="about"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Interests</h3>
              {profileUser.interests && profileUser.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-6">
                  {profileUser.interests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-purple-500/20 text-purple-300 border border-purple-500/50 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 mb-6">No interests added yet</p>
              )}

              <h3 className="text-xl font-bold text-white mb-4">Emotions</h3>
              {profileUser.emotions && profileUser.emotions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profileUser.emotions.map((emotion, idx) => (
                    <span
                      key={idx}
                      className={`px-4 py-2 rounded-full text-sm border ${getEmotionColor(
                        emotion
                      )}`}
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400">No emotions selected yet</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Nav */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-lg border-t border-white/10 px-4 py-3 z-50"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
      >
        <div className="flex items-center justify-around max-w-7xl mx-auto">
          <motion.button
            className="text-purple-400"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/")}
          >
            <HomeIcon className="w-6 h-6" />
          </motion.button>
          <motion.button
            className="text-slate-400 hover:text-white transition-colors"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/search")}
          >
            <Search className="w-6 h-6" />
          </motion.button>
          <motion.button
            className="text-slate-400 hover:text-white transition-colors"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bell className="w-6 h-6" />
          </motion.button>
          <motion.button
            className="text-slate-400 hover:text-white transition-colors"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/profile")}
          >
            <UserIcon className="w-6 h-6" />
          </motion.button>
        </div>
      </motion.nav>
    </div>
  );
};

export default UserProfile;
