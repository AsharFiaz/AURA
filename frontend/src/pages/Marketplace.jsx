import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { showInfo } from "../utils/toast";
import { MemoryCardSkeleton } from "../components/common/LoadingSkeleton";
import {
  Search,
  Filter,
  TrendingUp,
  Sparkles,
  Home as HomeIcon,
  Bell,
  User,
} from "lucide-react";

const Marketplace = () => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Popular");
  const navigate = useNavigate();

  useEffect(() => {
    fetchMemories();
    fetchStats();
  }, []);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const response = await api.get("/memories/feed");
      if (response.data.success) {
        setMemories(response.data.memories);
      }
    } catch (error) {
      console.error("Error fetching memories:", error);
    } finally {
      setLoading(false);
    }
  };

  const [stats, setStats] = useState({
    totalMemories: 0,
    totalLikes: 0,
    activeSellers: 0,
    floorPrice: 0.15,
    volume24h: 0,
  });

  const fetchStats = async () => {
    try {
      const response = await api.get("/memories/stats");
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
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

  const getRandomPrice = (index) => {
    // Generate consistent price based on index
    const prices = [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5];
    return prices[index % prices.length];
  };

  const handleBuy = () => {
    showInfo("Blockchain integration coming soon! 🔗");
  };

  const handleBid = () => {
    showInfo("Bidding feature coming soon! 💰");
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

  {
    /* Filter memories based on search query */
  }
  const filteredMemories = memories.filter((memory) => {
    if (!searchQuery) return true; // If no search, show all

    const searchLower = searchQuery.toLowerCase();
    const captionMatch = memory.caption.toLowerCase().includes(searchLower);
    const usernameMatch = memory.user?.username
      ?.toLowerCase()
      .includes(searchLower);
    const emotionMatch = memory.emotions?.some((e) =>
      e.toLowerCase().includes(searchLower)
    );

    return captionMatch || usernameMatch || emotionMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
      {/* Top Navbar */}
      <motion.nav
        className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 px-4 py-3"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <motion.h1
            onClick={() => navigate("/")}
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            AURA
          </motion.h1>
          <motion.button
            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/")}
          >
            <HomeIcon className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Title Section */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            AURA Marketplace
          </h1>
          <p className="text-slate-400">
            Discover and collect inspiring memories as NFTs
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          className="flex flex-col md:flex-row gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none cursor-pointer"
            >
              <option value="All" className="bg-slate-800">
                All
              </option>
              <option value="Featured" className="bg-slate-800">
                Featured
              </option>
              <option value="New" className="bg-slate-800">
                New
              </option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none cursor-pointer"
            >
              <option value="Popular" className="bg-slate-800">
                Popular
              </option>
              <option value="Price" className="bg-slate-800">
                Price
              </option>
              <option value="Recent" className="bg-slate-800">
                Recent
              </option>
            </select>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
            <p className="text-slate-400 text-sm mb-1">Floor Price</p>
            <p className="text-2xl font-bold text-white">
              {stats.floorPrice} AURA
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
            <p className="text-slate-400 text-sm mb-1">Volume (24h)</p>
            <p className="text-2xl font-bold text-white">
              {stats.volume24h} AURA
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
            <p className="text-slate-400 text-sm mb-1">Active Sellers</p>
            <p className="text-2xl font-bold text-white">
              {stats.activeSellers}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
            <p className="text-slate-400 text-sm mb-1">Total Items</p>
            <p className="text-2xl font-bold text-white">
              {stats.totalMemories}
            </p>
          </div>
        </motion.div>

        {/* Featured Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-lg rounded-2xl border border-purple-500/30 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Featured Drop</h2>
            </div>
            <h3 className="text-xl text-purple-300 mb-2">
              Aurora Memory - Limited Edition
            </h3>
            <p className="text-slate-300 mb-4">
              A collection of the most inspiring moments from the AURA community
            </p>
            <motion.button
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-500 hover:to-blue-500 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Explore Collection
            </motion.button>
          </div>
        </motion.div>

        {/* Collections Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-4">Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6"
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="text-xl font-semibold text-white mb-2">
                Luminous Stories
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Stories that light up the darkness and inspire hope
              </p>
              <p className="text-purple-400 font-semibold">12 items</p>
            </motion.div>
            <motion.div
              className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6"
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="text-xl font-semibold text-white mb-2">
                Kindness Streaks
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Acts of kindness that create ripples of positivity
              </p>
              <p className="text-purple-400 font-semibold">8 items</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Marketplace Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">All Memories</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <MemoryCardSkeleton key={index} />
              ))}
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              No memories available
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredMemories.map((memory, index) => (
                <motion.div
                  key={memory._id}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden group cursor-pointer"
                  variants={cardVariants}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 30px rgba(168, 85, 247, 0.4)",
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Card Image Placeholder */}
                  <div className="w-full h-48 bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center relative overflow-hidden">
                    {memory.image ? (
                      <img
                        src={memory.image}
                        alt="Memory"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">Memory NFT</p>
                      </div>
                    )}
                    {/* Price Badge */}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
                      <p className="text-white font-bold text-sm">
                        {getRandomPrice(index)} AURA
                      </p>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    {/* Caption */}
                    <p className="text-white font-medium mb-3 line-clamp-2">
                      {memory.caption}
                    </p>

                    {/* Emotion Tags */}
                    {memory.emotions && memory.emotions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
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

                    {/* Creator Info */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                        {memory.user?.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <p className="text-slate-400 text-sm">
                        {memory.user?.username || "Unknown"}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <motion.button
                        onClick={handleBuy}
                        className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-500 hover:to-blue-500 transition-all text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Buy
                      </motion.button>
                      <motion.button
                        onClick={handleBid}
                        className="flex-1 py-2 bg-white/5 border border-white/10 text-white rounded-lg font-semibold hover:bg-white/10 transition-all text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
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
            className="text-purple-400"
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
            <User className="w-6 h-6" />
          </motion.button>
        </div>
      </motion.nav>
    </div>
  );
};

export default Marketplace;
