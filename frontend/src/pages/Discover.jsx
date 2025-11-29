import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { showSuccess, showError } from "../utils/toast";
import { UserCardSkeleton } from "../components/common/LoadingSkeleton";
import {
  Users,
  UserPlus,
  UserCheck,
  ArrowLeft,
  Search,
  Home as HomeIcon,
  Bell,
  User as UserIcon,
} from "lucide-react";

const Discover = () => {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingStatus, setFollowingStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await api.get("/follow/suggestions");
      if (response.data.success) {
        setSuggestedUsers(response.data.suggestions);
        // Check following statuses after fetching suggestions
        checkFollowingStatuses(response.data.suggestions);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowingStatuses = async (users) => {
    try {
      const statuses = {};
      for (const suggestedUser of users) {
        const response = await api.get(`/follow/check/${suggestedUser.id}`);
        if (response.data.success) {
          statuses[suggestedUser.id] = response.data.isFollowing;
        }
      }
      setFollowingStatus(statuses);
    } catch (error) {
      console.error("Error checking following statuses:", error);
    }
  };

  const handleFollow = async (userId, e) => {
    e.stopPropagation();

    setFollowingStatus((prev) => ({
      ...prev,
      [userId]: true,
    }));

    try {
      const response = await api.post(`/follow/${userId}`);
      if (response.data.success) {
        await refreshUser();
        showSuccess("You're now following this user! ✨");
      } else {
        setFollowingStatus((prev) => ({
          ...prev,
          [userId]: false,
        }));
        showError("Failed to follow user. Please try again.");
      }
    } catch (error) {
      console.error("Error following user:", error);
      setFollowingStatus((prev) => ({
        ...prev,
        [userId]: false,
      }));
      showError(
        error.response?.data?.message ||
          "Failed to follow user. Please try again."
      );
    }
  };

  const handleUnfollow = async (userId, e) => {
    e.stopPropagation();

    setFollowingStatus((prev) => ({
      ...prev,
      [userId]: false,
    }));

    try {
      const response = await api.delete(`/follow/${userId}`);
      if (response.data.success) {
        await refreshUser();
        showSuccess("You've unfollowed this user");
      } else {
        setFollowingStatus((prev) => ({
          ...prev,
          [userId]: true,
        }));
        showError("Failed to unfollow user. Please try again.");
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      setFollowingStatus((prev) => ({
        ...prev,
        [userId]: true,
      }));
      showError(
        error.response?.data?.message ||
          "Failed to unfollow user. Please try again."
      );
    }
  };
  const handleViewProfile = (userId) => {
    navigate(`/user/${userId}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
      {/* Top Navbar */}
      <motion.nav
        className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 px-4 py-3"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => navigate(-1)}
              className="text-slate-400 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
            <h1 className="text-xl font-semibold text-white">
              Discover People
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Suggested for You</h2>
          </div>
          <p className="text-slate-400 text-sm">
            Discover amazing people in the AURA community
          </p>
        </motion.div>

        {/* Suggested Users Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <UserCardSkeleton key={index} />
            ))}
          </div>
        ) : suggestedUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No suggestions available</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {suggestedUsers.map((suggestedUser, index) => {
              const isFollowing = followingStatus[suggestedUser.id] || false;

              return (
                <motion.div
                  key={suggestedUser.id}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 cursor-pointer group"
                  variants={cardVariants}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 0 30px rgba(168, 85, 247, 0.3)",
                  }}
                  transition={{ duration: 0.3 }}
                  onClick={() => handleViewProfile(suggestedUser.id)}
                >
                  {/* Avatar */}
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg">
                      {suggestedUser.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">
                      {suggestedUser.username}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {suggestedUser.followerCount || 0} followers
                    </p>
                  </div>

                  {/* Follow Button */}
                  <motion.button
                    onClick={(e) => {
                      if (isFollowing) {
                        handleUnfollow(suggestedUser.id, e);
                      } else {
                        handleFollow(suggestedUser.id, e);
                      }
                    }}
                    className={`w-full py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
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
                </motion.div>
              );
            })}
          </motion.div>
        )}
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

export default Discover;
