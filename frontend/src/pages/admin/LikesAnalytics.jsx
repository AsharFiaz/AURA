import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { showError } from "../../utils/toast";
import {
  Heart, Search, TrendingUp, Eye, Activity,
  ChevronLeft, ChevronRight, Trophy,
} from "lucide-react";
import AnimatedBackdrop from "../../components/common/AnimatedBackdrop";
import AdminNav from "../../components/common/AdminNav";

const LikesAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [memories, setMemories] = useState([]);
  const [topLiked, setTopLiked] = useState([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1, limit: 20, total: 0, pages: 1, hasMore: false,
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { fetchLikesData(); }, [page]);

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

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

  const filteredMemories = memories.filter(
    (memory) =>
      memory.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgLikes = pagination.total > 0
    ? Math.round((totalLikes / pagination.total) * 10) / 10
    : 0;

  if (loading && memories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackdrop />
        <motion.div className="flex flex-col items-center gap-3 relative"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="relative w-12 h-12">
            <motion.div className="absolute inset-0 rounded-full border-4 border-t-transparent border-red-500"
              animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
          </div>
          <span className="text-slate-400 text-sm">Loading likes analytics…</span>
        </motion.div>
      </div>
    );
  }

  const stats = [
    { label: "Total Likes", value: totalLikes, icon: Heart, color: "#f87171", gradient: "from-red-500 to-pink-500" },
    { label: "Memories with Likes", value: pagination.total, icon: Activity, color: "#34d399", gradient: "from-emerald-500 to-green-600" },
    { label: "Avg Likes/Memory", value: avgLikes, icon: TrendingUp, color: "#fbbf24", gradient: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="min-h-screen text-white relative">
      <AnimatedBackdrop />

      <AdminNav title="Likes Analytics" icon={Heart} showBack />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 relative">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label}
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: "rgba(19,19,42,0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(167,139,250,0.1)",
              }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02, borderColor: `${s.color}66`, boxShadow: `0 0 24px ${s.color}33` }}>

              <motion.div
                className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full"
                style={{ background: s.color }}
                animate={{ boxShadow: [`0 0 0px ${s.color}`, `0 0 12px ${s.color}`, `0 0 0px ${s.color}`] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
              />

              <div className="flex items-center gap-3">
                <motion.div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center`}
                  whileHover={{ rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 0.5 }}>
                  <s.icon className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-slate-500 text-xs uppercase tracking-widest mb-0.5">{s.label}</h3>
                  <motion.p className="text-3xl font-bold text-white"
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: i * 0.1 + 0.2 }}>
                    {s.value}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Top 10 */}
        {topLiked.length > 0 && (
          <motion.div className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: "rgba(19,19,42,0.7)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(251,191,36,0.2)",
            }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>

            <motion.div
              className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-amber-400"
              animate={{ boxShadow: ["0 0 0px #fbbf24", "0 0 12px #fbbf24", "0 0 0px #fbbf24"] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
                <Trophy className="w-5 h-5 text-amber-400" />
              </motion.div>
              Top 10 Most Liked Memories
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {topLiked.slice(0, 10).map((memory, index) => (
                <motion.div
                  key={memory._id || memory.id}
                  className="rounded-xl p-3 cursor-pointer relative overflow-hidden"
                  style={{
                    background: "rgba(19,19,42,0.6)",
                    border: index === 0
                      ? "1px solid rgba(251,191,36,0.4)"
                      : "1px solid rgba(167,139,250,0.1)",
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  onClick={() => navigate(`/user/${memory.user?._id || memory.user?.id}`)}
                  whileHover={{
                    scale: 1.05,
                    borderColor: "rgba(251,191,36,0.6)",
                    boxShadow: "0 0 20px rgba(251,191,36,0.2)",
                  }}
                >
                  {memory.image && (
                    <div className="relative h-24 mb-2 rounded-lg overflow-hidden">
                      <img
                        src={memory.image}
                        alt={memory.caption}
                        className="w-full h-full object-cover"
                      />
                      {index === 0 && (
                        <motion.div
                          className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-amber-900"
                          style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}
                          animate={{ y: [0, -2, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          #1
                        </motion.div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs font-bold" style={{ color: index === 0 ? "#fbbf24" : "#a78bfa" }}>
                      #{index + 1}
                    </span>
                    <div className="flex items-center gap-1" style={{ color: "#f87171" }}>
                      <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 }}>
                        <Heart className="w-3 h-3 fill-current" />
                      </motion.div>
                      <span className="text-xs font-semibold">{memory.likesCount || 0}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
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

        {/* Sorted table */}
        <motion.div className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(19,19,42,0.7)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(167,139,250,0.1)",
          }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>

          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(167,139,250,0.1)" }}>
            <h2 className="text-sm font-bold text-white">All Memories (Sorted by Likes)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: "rgba(167,139,250,0.05)" }}>
                <tr>
                  {["Rank", "Memory", "User", "Likes", "Created", "Actions"].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredMemories.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500 text-sm">
                        No memories found
                      </td>
                    </tr>
                  ) : (
                    filteredMemories.map((memory, index) => (
                      <motion.tr
                        key={memory._id || memory.id}
                        className="hover:bg-violet-500/5 transition-colors"
                        style={{ borderTop: "1px solid rgba(167,139,250,0.05)" }}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-violet-400">
                            #{index + 1 + (page - 1) * pagination.limit}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {memory.image && (
                              <motion.div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0"
                                whileHover={{ scale: 1.1 }}>
                                <img
                                  src={memory.image}
                                  alt={memory.caption}
                                  className="w-full h-full object-cover"
                                />
                              </motion.div>
                            )}
                            <p className="text-white text-sm max-w-xs truncate">
                              {memory.caption || "No caption"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <motion.div
                            className="flex items-center cursor-pointer"
                            onClick={() => navigate(`/user/${memory.user?._id || memory.user?.id}`)}
                            whileHover={{ x: 2 }}
                          >
                            <motion.div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold"
                              whileHover={{ scale: 1.1, boxShadow: "0 0 12px rgba(167,139,250,0.5)" }}>
                              {memory.user?.username?.charAt(0).toUpperCase() || "U"}
                            </motion.div>
                            <span className="ml-2 text-white text-sm">
                              {memory.user?.username || "Unknown"}
                            </span>
                          </motion.div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-red-400">
                            <Heart className="w-4 h-4 fill-current" />
                            <span className="font-semibold">{memory.likesCount || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-sm">
                          {formatDate(memory.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <motion.button
                            onClick={() => navigate(`/user/${memory.user?._id || memory.user?.id}`)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                            style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc" }}
                            whileHover={{ scale: 1.05, background: "rgba(99,102,241,0.25)" }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <motion.div className="flex items-center justify-between"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
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

export default LikesAnalytics;