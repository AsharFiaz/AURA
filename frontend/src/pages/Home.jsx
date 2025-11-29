import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import InfiniteScroll from "react-infinite-scroll-component";
import { MemoryCardSkeleton } from "../components/common/LoadingSkeleton";
import MemoryCard from "../components/common/MemoryCard";
import CommentModal from "../components/common/CommentModal";
import { showSuccess, showError } from "../utils/toast";
import {
  Plus,
  Grid,
  Globe,
  Search,
  Bell,
  User,
  Home as HomeIcon,
  ShoppingBag,
  MessageCircle,
  Mail,
  Image as ImageIcon,
  Smile,
  BarChart3,
  Hash,
  Compass,
  UserPlus,
  UserCheck,
  TrendingUp,
  Heart,
  Bookmark,
} from "lucide-react";

// Helper functions moved outside component to prevent recreation
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

const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const Home = () => {
  const [viewMode, setViewMode] = useState("2d");
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedMemoryForComment, setSelectedMemoryForComment] =
    useState(null);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [trendingMemories, setTrendingMemories] = useState([]);
  const [followingStatus, setFollowingStatus] = useState({});
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [trendingHashtags, setTrendingHashtags] = useState([]);

  const fetchTrendingHashtags = async () => {
    try {
      const response = await api.get("/memories/trending-hashtags");
      if (response.data.success) {
        setTrendingHashtags(response.data.hashtags || []);
      }
    } catch (error) {
      console.error("Error fetching trending hashtags:", error);
      // Fallback to empty array if error
      setTrendingHashtags([]);
    }
  };

  useEffect(() => {
    fetchMemories(1, true);
    fetchSuggestedUsers();
    fetchTrendingMemories();
    fetchTrendingHashtags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Check if current route matches for active nav item
  const isActiveRoute = useCallback(
    (path) => {
      return location.pathname === path;
    },
    [location.pathname]
  );

  const fetchMemories = useCallback(async (pageNum = 1, isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await api.get(`/memories/feed?page=${pageNum}&limit=10`);

      if (response.data.success) {
        if (isInitial) {
          setMemories(response.data.memories || []);
        } else {
          setMemories((prev) => [...prev, ...(response.data.memories || [])]);
        }
        setHasMore(response.data.hasMore || false);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching memories:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      const response = await api.get("/follow/suggestions");
      if (response.data.success) {
        const users = response.data.suggestions.slice(0, 5); // Top 5
        setSuggestedUsers(users);
        checkFollowingStatuses(users);
      }
    } catch (error) {
      console.error("Error fetching suggested users:", error);
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

  const fetchTrendingMemories = async () => {
    try {
      const response = await api.get("/memories/feed?page=1&limit=20");
      if (response.data.success) {
        // Sort by likes count and get top 3
        const sorted = (response.data.memories || [])
          .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
          .slice(0, 3);
        setTrendingMemories(sorted);
      }
    } catch (error) {
      console.error("Error fetching trending memories:", error);
    }
  };

  const handleFollow = async (userId, e) => {
    e.stopPropagation();
    setFollowingStatus((prev) => ({ ...prev, [userId]: true }));

    try {
      const response = await api.post(`/follow/${userId}`);
      if (response.data.success) {
        await refreshUser();
        showSuccess("You're now following this user! ✨");
      } else {
        setFollowingStatus((prev) => ({ ...prev, [userId]: false }));
        showError("Failed to follow user. Please try again.");
      }
    } catch (error) {
      setFollowingStatus((prev) => ({ ...prev, [userId]: false }));
      showError(
        error.response?.data?.message ||
          "Failed to follow user. Please try again."
      );
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      fetchMemories(nextPage, false);
    }
  }, [page, hasMore, loadingMore, fetchMemories]);

  const handleLike = useCallback(
    async (memoryId) => {
      if (!user?.id) return;

      try {
        const response = await api.post(`/memories/${memoryId}/like`);
        if (response.data.success) {
          setMemories((prev) =>
            prev.map((m) => (m._id === memoryId ? response.data.memory : m))
          );
        }
      } catch (error) {
        console.error("Error liking memory:", error);
      }
    },
    [user?.id]
  );

  const isLiked = useCallback(
    (memory) => {
      if (!user || !memory.likes) return false;
      return memory.likes.some((like) => like.toString() === user.id);
    },
    [user]
  );

  const handleOpenComments = useCallback((memory) => {
    setSelectedMemoryForComment(memory);
    setCommentModalOpen(true);
  }, []);

  const handleCommentAdded = useCallback((updatedMemory) => {
    setMemories((prev) =>
      prev.map((m) => (m._id === updatedMemory._id ? updatedMemory : m))
    );
    setSelectedMemoryForComment(updatedMemory);
  }, []);

  const handleCloseCommentModal = useCallback(() => {
    setCommentModalOpen(false);
    setSelectedMemoryForComment(null);
  }, []);


  // 2D Feed View
  const FeedView = () => (
    <div className="pb-20">
      {/* Create a Post Card */}
      <motion.div
        className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user?.username || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              user?.username?.charAt(0).toUpperCase() || "U"
            )}
          </div>
          <motion.button
            onClick={() => navigate("/create")}
            className="flex-1 text-left px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            What's inspiring you today?
          </motion.button>
        </div>
        <div className="flex items-center justify-around pt-3 border-t border-white/10">
          <motion.button
            onClick={() => navigate("/create")}
            className="flex items-center gap-2 text-slate-400 hover:text-purple-400 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-sm">Photo</span>
          </motion.button>
          <motion.button
            onClick={() => navigate("/create")}
            className="flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Smile className="w-5 h-5" />
            <span className="text-sm">Emotion</span>
          </motion.button>
          <motion.button
            onClick={() => navigate("/create")}
            className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-sm">Poll</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Memory Cards with Infinite Scroll */}
      <div className="px-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <MemoryCardSkeleton key={index} />
            ))}
          </div>
        ) : memories.length === 0 ? (
          <div className="text-center text-slate-400 py-8">No memories yet</div>
        ) : (
          <InfiniteScroll
            dataLength={memories.length}
            next={loadMore}
            hasMore={hasMore}
            loader={
              <div className="space-y-4 mt-4">
                {[...Array(3)].map((_, index) => (
                  <MemoryCardSkeleton key={`skeleton-${index}`} />
                ))}
              </div>
            }
            endMessage={
              memories.length > 0 ? (
                <div className="text-center text-slate-400 py-8">
                  <p>You've reached the end! 🎉</p>
                </div>
              ) : null
            }
            scrollThreshold={0.9}
            style={{ overflow: "visible" }}
          >
            <div className="space-y-4">
              {memories.map((memory, index) => (
                <MemoryCard
                  key={memory._id}
                  memory={memory}
                  index={index}
                  onLike={handleLike}
                  onCommentClick={handleOpenComments}
                  formatTime={formatTime}
                  getEmotionColor={getEmotionColor}
                  isLiked={isLiked}
                />
              ))}
            </div>
          </InfiniteScroll>
        )}
      </div>
    </div>
  );

  // Emotion colors for galaxy view
  const emotionColors = useMemo(
    () => ({
      Supportive: "#10b981",
      Stressed: "#ef4444",
      Calm: "#3b82f6",
      Inspiring: "#a855f7",
      Curious: "#eab308",
      Playful: "#ec4899",
      Reflective: "#6366f1",
    }),
    []
  );

  const handleMemoryClick = useCallback((memory) => {
    setSelectedMemory(memory);
  }, []);

  // 3D Galaxy View
  const GalaxyView = () => {
    const [hoveredMemory, setHoveredMemory] = useState(null);

    return (
      <div className="relative w-full h-[calc(100vh-200px)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
          <div className="absolute inset-0">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: Math.random(),
                }}
              />
            ))}
          </div>

          <div className="relative w-full h-full">
            {memories.map((memory, index) => {
              const angle = (index / memories.length) * Math.PI * 2;
              const radius = 150;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const primaryEmotion = memory.emotions?.[0] || "Calm";
              const color = emotionColors[primaryEmotion] || "#64748b";

              return (
                <motion.div
                  key={memory._id}
                  className="absolute cursor-pointer"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: "translate(-50%, -50%)",
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.2 }}
                  onHoverStart={() => setHoveredMemory(memory)}
                  onHoverEnd={() => setHoveredMemory(null)}
                  onClick={() => handleMemoryClick(memory)}
                >
                  <div
                    className="w-12 h-12 rounded-full shadow-lg"
                    style={{
                      background: `radial-gradient(circle, ${color}, ${color}dd)`,
                      boxShadow: `0 0 20px ${color}80`,
                    }}
                  />
                  {hoveredMemory?._id === memory._id && (
                    <motion.div
                      className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-slate-800/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap border border-white/20"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {memory.caption.substring(0, 30)}...
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-slate-400 text-sm">
            Full 3D planets coming soon!
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex max-w-7xl mx-auto">
        {/* LEFT SIDEBAR - Desktop Only */}
        <aside className="hidden lg:block w-[250px] sticky top-0 h-screen overflow-y-auto scrollbar-hide">
          <div className="p-4 space-y-6">
            {/* AURA Logo */}
            <motion.h1
              onClick={() => navigate("/")}
              className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              AURA
            </motion.h1>

            {/* Navigation Menu */}
            <nav className="space-y-1">
              <motion.button
                onClick={() => navigate("/")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActiveRoute("/")
                    ? "bg-purple-600 text-white"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <HomeIcon className="w-5 h-5" />
                <span className="font-medium">Home</span>
              </motion.button>

              <motion.button
                onClick={() => navigate("/discover")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActiveRoute("/discover")
                    ? "bg-purple-600 text-white"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Compass className="w-5 h-5" />
                <span className="font-medium">Discover</span>
              </motion.button>

              <motion.button
                onClick={() => navigate("/marketplace")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActiveRoute("/marketplace")
                    ? "bg-purple-600 text-white"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="font-medium">Marketplace</span>
              </motion.button>

              <motion.button
                onClick={() => navigate("/messages")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActiveRoute("/messages")
                    ? "bg-purple-600 text-white"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Mail className="w-5 h-5" />
                <span className="font-medium">Messages</span>
              </motion.button>

              <motion.button
                onClick={() => navigate("/notifications")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative ${
                  isActiveRoute("/notifications")
                    ? "bg-purple-600 text-white"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Bell className="w-5 h-5" />
                <span className="font-medium">Notifications</span>
                <span className="ml-auto relative">
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </span>
              </motion.button>

              <motion.button
                onClick={() => navigate("/bookmarks")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActiveRoute("/bookmarks")
                    ? "bg-purple-600 text-white"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Bookmark className="w-5 h-5" />
                <span className="font-medium">Bookmarks</span>
              </motion.button>

              <motion.button
                onClick={() => navigate("/profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActiveRoute("/profile")
                    ? "bg-purple-600 text-white"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Profile</span>
              </motion.button>
            </nav>

            {/* Create Memory Button */}
            <motion.button
              onClick={() => navigate("/create")}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:from-purple-500 hover:to-blue-500 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5" />
              Create Memory
            </motion.button>

            {/* Trending Hashtags */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending
              </h3>
              <div className="space-y-2">
                {trendingHashtags.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-2">
                    No trending hashtags yet
                  </p>
                ) : (
                  trendingHashtags.map((hashtag, index) => (
                    <motion.button
                      key={index}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-purple-400 font-medium text-sm">
                          {hashtag.tag}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {hashtag.posts}
                        </span>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN FEED - Center */}
        <main className="flex-1 min-w-0">
          {/* Top Navbar - Mobile & Desktop */}
          <motion.nav
            className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 px-4 py-3"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
          >
            <div className="flex items-center justify-between">
              {/* AURA Logo - Mobile Only */}
              <motion.h1
                onClick={() => navigate("/")}
                className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent cursor-pointer lg:hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                AURA
              </motion.h1>

              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 ml-auto">
                <motion.button
                  onClick={() => setViewMode("2d")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    viewMode === "2d"
                      ? "bg-purple-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Grid className="w-4 h-4" />
                  <span className="hidden sm:inline">Feed View</span>
                </motion.button>
                <motion.button
                  onClick={() => setViewMode("3d")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    viewMode === "3d"
                      ? "bg-purple-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">Galaxy</span>
                </motion.button>
                <motion.button
                  onClick={() => navigate("/marketplace")}
                  className="px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 text-slate-400 hover:text-white lg:hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ShoppingBag className="w-4 h-4" />
                </motion.button>
              </div>

              {/* User Profile */}
              <motion.button
                className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold ml-2"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/profile")}
              >
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user?.username || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.username?.charAt(0).toUpperCase() || "U"
                )}
              </motion.button>
            </div>
          </motion.nav>

          {/* Main Content */}
          <div className="max-w-2xl mx-auto px-4 lg:px-0">
            <AnimatePresence mode="wait">
              {viewMode === "2d" ? (
                <motion.div
                  key="2d"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <FeedView />
                </motion.div>
              ) : (
                <motion.div
                  key="3d"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <GalaxyView />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* RIGHT SIDEBAR - Desktop Only */}
        <aside className="hidden lg:block w-[350px] sticky top-0 h-screen overflow-y-auto scrollbar-hide">
          <div className="p-4 space-y-6">
            {/* Suggested Users Widget */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Suggested for you</h3>
                <motion.button
                  onClick={() => navigate("/discover")}
                  className="text-purple-400 text-sm hover:text-purple-300 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  See All
                </motion.button>
              </div>
              <div className="space-y-3">
                {suggestedUsers.map((suggestedUser) => (
                  <motion.div
                    key={suggestedUser.id}
                    className="flex items-center justify-between"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <motion.button
                      onClick={() => navigate(`/user/${suggestedUser.id}`)}
                      className="flex items-center gap-2 flex-1 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                        {suggestedUser.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="text-left">
                        <p className="text-white text-sm font-medium">
                          {suggestedUser.username}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {suggestedUser.followerCount || 0} followers
                        </p>
                      </div>
                    </motion.button>
                    <motion.button
                      onClick={(e) => handleFollow(suggestedUser.id, e)}
                      disabled={followingStatus[suggestedUser.id]}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        followingStatus[suggestedUser.id]
                          ? "bg-white/10 text-slate-400 cursor-not-allowed"
                          : "bg-purple-600 text-white hover:bg-purple-500"
                      }`}
                      whileHover={
                        !followingStatus[suggestedUser.id]
                          ? { scale: 1.05 }
                          : {}
                      }
                      whileTap={
                        !followingStatus[suggestedUser.id]
                          ? { scale: 0.95 }
                          : {}
                      }
                    >
                      {followingStatus[suggestedUser.id] ? (
                        <UserCheck className="w-4 h-4" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                    </motion.button>
                  </motion.div>
                ))}
                {suggestedUsers.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-4">
                    No suggestions available
                  </p>
                )}
              </div>
            </div>

            {/* Trending Memories Widget */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending Memories
              </h3>
              <div className="space-y-3">
                {trendingMemories.map((memory, index) => (
                  <motion.div
                    key={memory._id}
                    onClick={() => setSelectedMemory(memory)}
                    className="cursor-pointer p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <p className="text-white text-sm line-clamp-2 mb-2">
                      {memory.caption}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{memory.user?.username || "Unknown"}</span>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>{memory.likesCount || 0}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {trendingMemories.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-4">
                    No trending memories
                  </p>
                )}
              </div>
            </div>

            {/* Footer Links */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                <motion.button
                  whileHover={{ scale: 1.05, color: "#a78bfa" }}
                  className="hover:text-purple-400 transition-colors"
                >
                  About
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, color: "#a78bfa" }}
                  className="hover:text-purple-400 transition-colors"
                >
                  Privacy
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, color: "#a78bfa" }}
                  className="hover:text-purple-400 transition-colors"
                >
                  Terms
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, color: "#a78bfa" }}
                  className="hover:text-purple-400 transition-colors"
                >
                  Help
                </motion.button>
              </div>
              <p className="text-slate-500 text-xs mt-4">
                © 2024 AURA. All rights reserved.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Nav - Mobile Only */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-lg border-t border-white/10 px-4 py-3 z-50 lg:hidden"
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
            onClick={() => navigate("/create")}
          >
            <Plus className="w-6 h-6" />
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
            <User className="w-6 h-6" />
          </motion.button>
        </div>
      </motion.nav>

      {/* Floating Create Button - Hidden on Desktop, Visible on Mobile */}
      <motion.button
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg z-50 flex items-center justify-center lg:hidden"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        onClick={() => navigate("/create")}
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Memory Detail Modal */}
      <AnimatePresence>
        {selectedMemory && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMemory(null)}
          >
            <motion.div
              className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/20"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-white font-bold mb-2">
                {selectedMemory.user?.username || "Unknown"}
              </h3>
              <p className="text-slate-300 mb-4">{selectedMemory.caption}</p>
              {selectedMemory.emotions &&
                selectedMemory.emotions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedMemory.emotions.map((emotion, idx) => (
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
              <button
                onClick={() => setSelectedMemory(null)}
                className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Modal */}
      <CommentModal
        isOpen={commentModalOpen}
        memory={selectedMemoryForComment}
        onClose={handleCloseCommentModal}
        onCommentAdded={handleCommentAdded}
        formatTime={formatTime}
      />
    </div>
  );
};

export default Home;
