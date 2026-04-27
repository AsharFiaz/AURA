import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import {
  Users, Search, Mail, Calendar, FileText,
  ChevronLeft, ChevronRight, ShieldCheck,
} from "lucide-react";
import { showError } from "../../utils/toast";
import AnimatedBackdrop from "../../components/common/AnimatedBackdrop";
import AdminNav from "../../components/common/AdminNav";

const AllUsers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1, limit: 20, total: 0, pages: 1, hasMore: false,
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { fetchUsers(); }, [page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users?page=${page}&limit=20`);
      if (response.data.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showError("Failed to load users");
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

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackdrop />
        <motion.div className="flex flex-col items-center gap-3 relative"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="relative w-12 h-12">
            <motion.div className="absolute inset-0 rounded-full border-4 border-t-transparent border-indigo-500"
              animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
          </div>
          <span className="text-slate-400 text-sm">Loading users…</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative">
      <AnimatedBackdrop />

      <AdminNav title="All Users" icon={Users} showBack />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 relative">

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search users by username or email…"
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

        {/* Stats card */}
        <motion.div className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: "rgba(19,19,42,0.7)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(167,139,250,0.1)",
          }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

          <motion.div
            className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-violet-400"
            animate={{ boxShadow: ["0 0 0px #a78bfa", "0 0 12px #a78bfa", "0 0 0px #a78bfa"] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <div className="flex items-center gap-3">
            <motion.div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"
              animate={{ boxShadow: ["0 0 16px rgba(167,139,250,0.3)", "0 0 32px rgba(167,139,250,0.5)", "0 0 16px rgba(167,139,250,0.3)"] }}
              transition={{ duration: 2.5, repeat: Infinity }}>
              <Users className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-slate-500 text-xs uppercase tracking-widest mb-0.5">Total Users</h3>
              <motion.p className="text-3xl font-bold text-white"
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}>
                {pagination.total}
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(19,19,42,0.7)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(167,139,250,0.1)",
          }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: "rgba(167,139,250,0.05)" }}>
                <tr>
                  {["User", "Email", "Joined", "Memories", "Role"].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-500 text-sm">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        className="hover:bg-violet-500/5 transition-colors"
                        style={{ borderTop: "1px solid rgba(167,139,250,0.05)" }}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <motion.div
                            className="flex items-center cursor-pointer"
                            onClick={() => navigate(`/user/${user.id}`)}
                            whileHover={{ x: 2 }}
                          >
                            <motion.div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold"
                              whileHover={{ scale: 1.1, boxShadow: "0 0 16px rgba(167,139,250,0.5)" }}>
                              {user.username.charAt(0).toUpperCase()}
                            </motion.div>
                            <span className="ml-3 text-white font-medium text-sm">{user.username}</span>
                          </motion.div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-slate-400 text-sm">
                            <Mail className="w-4 h-4 mr-2 text-slate-600" />
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-sm">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-slate-600" />
                            {formatDate(user.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-sm">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-slate-600" />
                            {user.memoriesCount || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.role === "admin" ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                              style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa" }}>
                              <ShieldCheck className="w-3 h-3" /> admin
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{ background: "rgba(100,116,139,0.15)", border: "1px solid rgba(100,116,139,0.3)", color: "#94a3b8" }}>
                              user
                            </span>
                          )}
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

export default AllUsers;