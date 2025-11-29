import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { showError } from "../../utils/toast";
import {
  Heart,
  ArrowLeft,
  Search,
  Calendar,
  TrendingUp,
  Eye,
  User,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";

const LikesAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [memories, setMemories] = useState([]);
  const [topLiked, setTopLiked] = useState([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
    hasMore: false,
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchLikesData();
  }, [page]);

  const fetchLikesData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/likes?page=${page}&limit=20`);
      if (response.data.success) {
        setMemories(response.data.memories);
        setTopLiked(response.data.topLiked || []);
        setTotalLikes(response.data.totalLikes || 0);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching likes analytics:", error);
      showError("Failed to load likes analytics");
      if (error.response?.status === 403 || error.response?.status === 401) {
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredMemories = memories.filter(
    (memory) =>
      memory.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && memories.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          className="text-white text-xl"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Loading likes analytics...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Navbar */}
      <motion.nav
        className="bg-slate-900/80 backdrop-blur-lg border-b border-white/10 px-6 py-4"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => navigate("/admin/dashboard")}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </motion.button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Likes Analytics
            </h1>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <motion.div
            className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-slate-400 text-sm">Total Likes</h3>
                <p className="text-3xl font-bold text-white">{totalLikes}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-slate-400 text-sm">Memories with Likes</h3>
                <p className="text-3xl font-bold text-white">
                  {pagination.total}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-slate-400 text-sm">Avg Likes/Memory</h3>
                <p className="text-3xl font-bold text-white">
                  {pagination.total > 0
                    ? Math.round((totalLikes / pagination.total) * 10) / 10
                    : 0}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Top Liked Memories */}
        {topLiked.length > 0 && (
          <motion.div
            className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              Top 10 Most Liked Memories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {topLiked.slice(0, 10).map((memory, index) => (
                <motion.div
                  key={memory._id || memory.id}
                  className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-yellow-500/50 transition-colors cursor-pointer"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  onClick={() =>
                    navigate(`/user/${memory.user?._id || memory.user?.id}`)
                  }
                  whileHover={{ scale: 1.05 }}
                >
                  {memory.image && (
                    <div className="relative h-24 mb-2 rounded-lg overflow-hidden">
                      <img
                        src={memory.image}
                        alt={memory.caption}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs font-medium">
                      #{index + 1}
                    </span>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Heart className="w-3 h-3 fill-current" />
                      <span className="text-xs font-semibold">
                        {memory.likesCount || 0}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search Bar */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search memories by caption or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
        </motion.div>

        {/* All Memories Sorted by Likes */}
        <motion.div
          className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">All Memories (Sorted by Likes)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Memory
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Likes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredMemories.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-8 text-center text-slate-400"
                    >
                      No memories found
                    </td>
                  </tr>
                ) : (
                  filteredMemories.map((memory, index) => (
                    <motion.tr
                      key={memory._id || memory.id}
                      className="hover:bg-white/5 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-purple-400 font-bold">
                            #{index + 1 + (page - 1) * pagination.limit}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {memory.image && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden">
                              <img
                                src={memory.image}
                                alt={memory.caption}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <p className="text-white text-sm max-w-xs truncate">
                            {memory.caption || "No caption"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <motion.div 
                          className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => navigate(`/user/${memory.user?._id || memory.user?.id}`)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                            {memory.user?.username?.charAt(0).toUpperCase() ||
                              "U"}
                          </div>
                          <span className="ml-2 text-white text-sm">
                            {memory.user?.username || "Unknown"}
                          </span>
                        </motion.div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-red-400">
                          <Heart className="w-5 h-5 fill-current" />
                          <span className="font-semibold">
                            {memory.likesCount || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-300 text-sm">
                        {formatDate(memory.createdAt).split(",")[0]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <motion.button
                          onClick={() =>
                            navigate(
                              `/user/${memory.user?._id || memory.user?.id}`
                            )
                          }
                          className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm flex items-center gap-1"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <motion.div
            className="flex items-center justify-between mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
            <span className="text-slate-300">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={!pagination.hasMore}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LikesAnalytics;

