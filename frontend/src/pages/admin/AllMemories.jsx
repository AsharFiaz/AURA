import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { showError, showSuccess } from "../../utils/toast";
import {
  FileText, Search, Calendar, Heart, Eye, Trash2,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import AnimatedBackdrop from "../../components/common/AnimatedBackdrop";
import AdminNav from "../../components/common/AdminNav";

const AllMemories = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [memories, setMemories] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1, limit: 20, total: 0, pages: 1, hasMore: false,
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { fetchMemories(); }, [page]);

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
    if (!window.confirm("Are you sure you want to delete this memory?")) return;
    try {
      const response = await api.delete(`/admin/memories/${memoryId}`);
      if (response.data.success) { showSuccess("Memory deleted successfully"); fetchMemories(); }
    } catch (error) {
      console.error("Error deleting memory:", error);
      showError("Failed to delete memory");
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

  const filteredMemories = memories.filter((memory) =>
    memory.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    memory.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && memories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackdrop />
        <motion.div className="flex flex-col items-center gap-3 relative"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="relative w-12 h-12">
            <motion.div className="absolute inset-0 rounded-full border-4 border-t-transparent border-violet-500"
              animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
          </div>
          <span className="text-slate-400 text-sm">Loading memories…</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative">
      <AnimatedBackdrop />

      <AdminNav title="All Memories" icon={FileText} showBack />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 relative">

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search memories by caption or username…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none transition-all"
              style={{
                background: "rgba(19,19,42,0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(167,139,250,0.15)",
              }}
              onFocus={e => { e.target.style.borderColor = "rgba(167,139,250,0.5)"; e.target.style.boxShadow = "0 0 16px rgba(124,58,237,0.2)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(167,139,250,0.15)"; e.target.style.boxShadow = "none"; }}
            />
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: "rgba(19,19,42,0.7)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(167,139,250,0.1)",
          }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

          <motion.div
            className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-indigo-400"
            animate={{ boxShadow: ["0 0 0px #818cf8", "0 0 12px #818cf8", "0 0 0px #818cf8"] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <div className="flex items-center gap-3">
            <motion.div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center"
              animate={{ boxShadow: ["0 0 16px rgba(129,140,248,0.3)", "0 0 32px rgba(129,140,248,0.5)", "0 0 16px rgba(129,140,248,0.3)"] }}
              transition={{ duration: 2.5, repeat: Infinity }}>
              <FileText className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-slate-500 text-xs uppercase tracking-widest mb-0.5">Total Memories</h3>
              <motion.p className="text-3xl font-bold text-white"
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}>
                {pagination.total}
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredMemories.length === 0 ? (
              <div className="col-span-full text-center py-16 text-slate-500 text-sm rounded-2xl"
                style={{
                  background: "rgba(19,19,42,0.5)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(167,139,250,0.1)",
                }}>
                No memories found
              </div>
            ) : (
              filteredMemories.map((memory, index) => (
                <motion.div
                  key={memory._id || memory.id}
                  className="rounded-2xl overflow-hidden group relative"
                  style={{
                    background: "rgba(19,19,42,0.7)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(167,139,250,0.1)",
                  }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ y: -4, borderColor: "rgba(167,139,250,0.4)", boxShadow: "0 8px 32px rgba(124,58,237,0.2)" }}
                >
                  {memory.image && (
                    <div className="relative h-48 overflow-hidden">
                      <motion.img
                        src={memory.image}
                        alt={memory.caption || "Memory"}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.06 }}
                        transition={{ duration: 0.4 }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    </div>
                  )}

                  <div className="p-4">
                    <motion.div
                      className="flex items-center gap-3 mb-3 cursor-pointer"
                      onClick={() => navigate(`/user/${memory.user?._id || memory.user?.id}`)}
                      whileHover={{ x: 2 }}
                    >
                      <motion.div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold"
                        whileHover={{ scale: 1.1, boxShadow: "0 0 12px rgba(167,139,250,0.5)" }}>
                        {memory.user?.username?.charAt(0).toUpperCase() || "U"}
                      </motion.div>
                      <span className="text-white text-sm font-medium">
                        {memory.user?.username || "Unknown"}
                      </span>
                    </motion.div>

                    <p className="text-slate-300 text-sm mb-3 line-clamp-2">
                      {memory.caption || "No caption"}
                    </p>

                    {memory.emotions && memory.emotions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {memory.emotions.slice(0, 3).map((emotion, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs rounded-full text-violet-300"
                            style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.25)" }}
                          >
                            {emotion}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-500 text-xs mb-3">
                      <div className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        <span>{memory.likesCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(memory.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3"
                      style={{ borderTop: "1px solid rgba(167,139,250,0.1)" }}>
                      <motion.button
                        onClick={() => navigate(`/user/${memory.user?._id || memory.user?.id}`)}
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                        style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc" }}
                        whileHover={{ scale: 1.04, background: "rgba(99,102,241,0.25)" }}
                        whileTap={{ scale: 0.96 }}
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteMemory(memory._id || memory.id)}
                        className="px-3 py-2 rounded-lg transition-colors"
                        style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
                        whileHover={{ scale: 1.08, background: "rgba(239,68,68,0.2)" }}
                        whileTap={{ scale: 0.92 }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <motion.div className="flex items-center justify-between"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <motion.button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "rgba(19,19,42,0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(167,139,250,0.15)",
              }}
              whileHover={page > 1 ? { x: -2, borderColor: "rgba(167,139,250,0.4)" } : {}}
              whileTap={page > 1 ? { scale: 0.97 } : {}}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </motion.button>
            <span className="text-slate-400 text-sm">
              Page <span className="text-white font-semibold">{pagination.page}</span> of {pagination.pages}
            </span>
            <motion.button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={!pagination.hasMore}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "rgba(19,19,42,0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(167,139,250,0.15)",
              }}
              whileHover={pagination.hasMore ? { x: 2, borderColor: "rgba(167,139,250,0.4)" } : {}}
              whileTap={pagination.hasMore ? { scale: 0.97 } : {}}
            >
              Next <ChevronRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AllMemories;