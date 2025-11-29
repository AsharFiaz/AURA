import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { showError, showSuccess } from "../../utils/toast";
import {
  FileText,
  ArrowLeft,
  Search,
  Calendar,
  Heart,
  Eye,
  Trash2,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const AllMemories = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [memories, setMemories] = useState([]);
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
    fetchMemories();
  }, [page]);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/memories?page=${page}&limit=20`);
      if (response.data.success) {
        setMemories(response.data.memories);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching memories:", error);
      showError("Failed to load memories");
      if (error.response?.status === 403 || error.response?.status === 401) {
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMemory = async (memoryId) => {
    if (!window.confirm("Are you sure you want to delete this memory?")) {
      return;
    }

    try {
      const response = await api.delete(`/admin/memories/${memoryId}`);
      if (response.data.success) {
        showSuccess("Memory deleted successfully");
        fetchMemories(); // Refresh list
      }
    } catch (error) {
      console.error("Error deleting memory:", error);
      showError("Failed to delete memory");
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

  const filteredMemories = memories.filter((memory) =>
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
          Loading memories...
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
              All Memories
            </h1>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
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

        {/* Stats Card */}
        <motion.div
          className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-slate-400 text-sm">Total Memories</h3>
              <p className="text-3xl font-bold text-white">{pagination.total}</p>
            </div>
          </div>
        </motion.div>

        {/* Memories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {filteredMemories.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              No memories found
            </div>
          ) : (
            filteredMemories.map((memory, index) => (
              <motion.div
                key={memory._id || memory.id}
                className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Memory Image */}
                {memory.image && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={memory.image}
                      alt={memory.caption || "Memory"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Memory Content */}
                <div className="p-4">
                  {/* User Info */}
                  <motion.div 
                    className="flex items-center gap-3 mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate(`/user/${memory.user?._id || memory.user?.id}`)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                      {memory.user?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="text-white text-sm font-medium">
                      {memory.user?.username || "Unknown"}
                    </span>
                  </motion.div>

                  {/* Caption */}
                  <p className="text-slate-300 text-sm mb-3 line-clamp-2">
                    {memory.caption || "No caption"}
                  </p>

                  {/* Emotions */}
                  {memory.emotions && memory.emotions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {memory.emotions.slice(0, 3).map((emotion, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/50"
                        >
                          {emotion}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{memory.likesCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(memory.createdAt).split(",")[0]}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                    <motion.button
                      onClick={() => navigate(`/user/${memory.user?._id || memory.user?.id}`)}
                      className="flex-1 px-3 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </motion.button>
                    <motion.button
                      onClick={() => handleDeleteMemory(memory._id || memory.id)}
                      className="px-3 py-2 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
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

export default AllMemories;

