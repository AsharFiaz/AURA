import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  Users, FileText, ShoppingBag, TrendingUp,
  Activity, Eye, Trash2, ArrowUpRight,
} from "lucide-react";
import { showError, showSuccess } from "../utils/toast";
import AnimatedBackdrop from "../components/common/AnimatedBackdrop";
import AdminNav from "../components/common/AdminNav";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalMemories: 0, totalNFTs: 0, totalLikes: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentMemories, setRecentMemories] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [memoryActivityData, setMemoryActivityData] = useState([]);

  useEffect(() => { fetchAdminData(); }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, memoriesRes, userGrowthRes, memoryActivityRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users?limit=10"),
        api.get("/admin/memories?limit=10"),
        api.get("/admin/analytics/user-growth"),
        api.get("/admin/analytics/memory-activity"),
      ]);
      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (usersRes.data.success) setRecentUsers(usersRes.data.users);
      if (memoriesRes.data.success) setRecentMemories(memoriesRes.data.memories);
      if (userGrowthRes.data.success) setUserGrowthData(userGrowthRes.data.data);
      if (memoryActivityRes.data.success) setMemoryActivityData(memoryActivityRes.data.data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      showError("Failed to load admin data");
      if (error.response?.status === 403 || error.response?.status === 401) navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleDeleteMemory = async (memoryId) => {
    if (!window.confirm("Are you sure you want to delete this memory?")) return;
    try {
      const response = await api.delete(`/admin/memories/${memoryId}`);
      if (response.data.success) { showSuccess("Memory deleted successfully"); fetchAdminData(); }
    } catch (error) {
      console.error("Error deleting memory:", error);
      showError("Failed to delete memory");
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

  const maxUserGrowth = userGrowthData.length > 0 ? Math.max(...userGrowthData.map(d => d.count), 1) : 1;
  const maxMemoryActivity = memoryActivityData.length > 0 ? Math.max(...memoryActivityData.map(d => d.count), 1) : 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackdrop />
        <motion.div className="flex flex-col items-center gap-3 relative"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="relative w-12 h-12">
            <motion.div className="absolute inset-0 rounded-full border-4 border-t-transparent border-indigo-500"
              animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
            <div className="absolute inset-2 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(167,139,250,0.3), transparent)" }} />
          </div>
          <span className="text-slate-400 text-sm">Loading admin dashboard…</span>
        </motion.div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "#a78bfa", gradient: "from-violet-500 to-purple-600", path: "/admin/users" },
    { label: "Total Memories", value: stats.totalMemories, icon: FileText, color: "#818cf8", gradient: "from-indigo-500 to-blue-600", path: "/admin/memories" },
    { label: "Total NFTs", value: stats.totalNFTs, icon: ShoppingBag, color: "#f472b6", gradient: "from-pink-500 to-rose-600", path: "/admin/nfts" },
    { label: "Total Likes", value: stats.totalLikes, icon: Activity, color: "#34d399", gradient: "from-emerald-500 to-green-600", path: "/admin/likes" },
  ];

  return (
    <div className="min-h-screen text-white relative">
      <AnimatedBackdrop />

      <AdminNav />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 relative">

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, gradient, path }, i) => (
            <motion.div key={label} onClick={() => navigate(path)}
              className="rounded-2xl p-5 cursor-pointer relative overflow-hidden group"
              style={{
                background: "rgba(19,19,42,0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(167,139,250,0.1)",
              }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.02, borderColor: `${color}66`, boxShadow: `0 0 24px ${color}33` }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full"
                style={{ background: color }}
                animate={{ boxShadow: [`0 0 0px ${color}`, `0 0 12px ${color}`, `0 0 0px ${color}`] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
              />

              <motion.div
                className="absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-0 group-hover:opacity-30 transition-opacity"
                style={{ background: `radial-gradient(circle, ${color}, transparent)` }}
              />

              <motion.div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 relative`}
                whileHover={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 0.5 }}>
                <Icon className="w-5 h-5 text-white" />
              </motion.div>
              <p className="text-slate-500 text-xs mb-1 uppercase tracking-widest">{label}</p>
              <motion.p className="text-3xl font-bold text-white"
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.08 + 0.2, type: "spring", stiffness: 200 }}>
                {value}
              </motion.p>

              <ArrowUpRight className="absolute bottom-4 right-4 w-3.5 h-3.5 text-slate-600 group-hover:text-white transition-colors" />
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <motion.div onClick={() => navigate("/admin/users")}
            className="rounded-2xl p-6 cursor-pointer relative overflow-hidden"
            style={{
              background: "rgba(19,19,42,0.7)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(167,139,250,0.1)",
            }}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
            whileHover={{ scale: 1.01, borderColor: "rgba(167,139,250,0.3)" }}
            whileTap={{ scale: 0.99 }}
          >
            <motion.div
              className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-indigo-400"
              animate={{ boxShadow: ["0 0 0px #818cf8", "0 0 12px #818cf8", "0 0 0px #818cf8"] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h3 className="text-white font-semibold text-sm">User Growth</h3>
            </div>
            <p className="text-slate-500 text-xs mb-5 uppercase tracking-widest">New users per month</p>
            {userGrowthData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-600 text-sm">No data available</div>
            ) : (
              <>
                <div className="h-48 flex items-end justify-between gap-1.5">
                  {userGrowthData.map((data, i) => (
                    <motion.div key={i} className="flex-1 flex flex-col items-center"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.04 }}>
                      <motion.div
                        className="w-full rounded-t-md flex items-end justify-center pb-1 min-h-[6px] relative overflow-hidden"
                        style={{
                          background: "linear-gradient(to top, #4f46e5, #a78bfa)",
                          boxShadow: "0 0 12px rgba(167,139,250,0.3)",
                        }}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max((data.count / maxUserGrowth) * 100, 4)}%` }}
                        transition={{ delay: 0.4 + i * 0.04, duration: 0.5 }}
                      >
                        {data.count > 0 && <span className="text-[10px] text-white font-medium relative z-10">{data.count}</span>}
                      </motion.div>
                      <span className="text-[10px] text-slate-600 mt-1.5 -rotate-45 origin-left whitespace-nowrap">
                        {data.month.split(" ")[0]}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <p className="text-center text-slate-700 text-xs mt-4 uppercase tracking-widest">Last 12 months</p>
              </>
            )}
          </motion.div>

          <motion.div onClick={() => navigate("/admin/memories")}
            className="rounded-2xl p-6 cursor-pointer relative overflow-hidden"
            style={{
              background: "rgba(19,19,42,0.7)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(167,139,250,0.1)",
            }}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.01, borderColor: "rgba(167,139,250,0.3)" }}
            whileTap={{ scale: 0.99 }}
          >
            <motion.div
              className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-violet-400"
              animate={{ boxShadow: ["0 0 0px #a78bfa", "0 0 12px #a78bfa", "0 0 0px #a78bfa"] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-violet-400" />
              <h3 className="text-white font-semibold text-sm">Memory Activity</h3>
            </div>
            <p className="text-slate-500 text-xs mb-5 uppercase tracking-widest">Posts per day (last 7 days)</p>
            {memoryActivityData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-600 text-sm">No data available</div>
            ) : (
              <div className="h-48 flex items-end justify-between gap-2">
                {memoryActivityData.map((data, i) => (
                  <motion.div key={i} className="flex flex-col items-center flex-1"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.08 }}>
                    <motion.div
                      className="w-full rounded-t-md flex items-end justify-center pb-1 mb-2 min-h-[6px]"
                      style={{
                        background: "linear-gradient(to top, #7c3aed, #f472b6)",
                        boxShadow: "0 0 12px rgba(236,72,153,0.3)",
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max((data.count / maxMemoryActivity) * 100, 4)}%` }}
                      transition={{ delay: 0.5 + i * 0.08, duration: 0.5 }}
                    >
                      {data.count > 0 && <span className="text-[10px] text-white font-medium">{data.count}</span>}
                    </motion.div>
                    <span className="text-[10px] text-slate-600">{data.day}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <motion.div className="rounded-2xl overflow-hidden relative"
            style={{
              background: "rgba(19,19,42,0.7)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(167,139,250,0.1)",
            }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid rgba(167,139,250,0.1)" }}>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h3 className="text-white font-semibold text-sm">Recent Users</h3>
              </div>
              <motion.button onClick={() => navigate("/admin/users")}
                className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1"
                whileHover={{ x: 2 }}>
                View All <ArrowUpRight className="w-3 h-3" />
              </motion.button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(167,139,250,0.05)" }}>
                    {["User", "Email", "Joined", "Memories", ""].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-slate-600 text-xs font-medium uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-10 text-slate-600 text-sm">No users found</td></tr>
                  ) : recentUsers.map((user, idx) => (
                    <motion.tr key={user.id}
                      className="transition-colors hover:bg-violet-500/5"
                      style={{ borderBottom: "1px solid rgba(167,139,250,0.04)" }}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + idx * 0.04 }}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate(`/user/${user.id}`)}>
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {user.username?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <span className="text-white text-xs font-medium">{user.username}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{user.email}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">{formatDate(user.createdAt)}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{user.memoriesCount || 0}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => navigate(`/user/${user.id}`)}
                          className="text-indigo-400 hover:text-indigo-300">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div className="rounded-2xl overflow-hidden relative"
            style={{
              background: "rgba(19,19,42,0.7)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(167,139,250,0.1)",
            }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid rgba(167,139,250,0.1)" }}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-400" />
                <h3 className="text-white font-semibold text-sm">Recent Memories</h3>
              </div>
              <motion.button onClick={() => navigate("/admin/memories")}
                className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1"
                whileHover={{ x: 2 }}>
                View All <ArrowUpRight className="w-3 h-3" />
              </motion.button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(167,139,250,0.05)" }}>
                    {["User", "Caption", "Likes", "Created", ""].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-slate-600 text-xs font-medium uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentMemories.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-10 text-slate-600 text-sm">No memories found</td></tr>
                  ) : recentMemories.map((memory, idx) => (
                    <motion.tr key={memory._id}
                      className="transition-colors hover:bg-violet-500/5"
                      style={{ borderBottom: "1px solid rgba(167,139,250,0.04)" }}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + idx * 0.04 }}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate(`/user/${memory.user?._id || memory.user?.id}`)}>
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {memory.user?.username?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <span className="text-white text-xs font-medium">{memory.user?.username || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-400 text-xs max-w-[140px] truncate">{memory.caption || "No caption"}</p>
                        {memory.emotions?.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {memory.emotions.slice(0, 2).map((e, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full text-violet-300"
                                style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.2)" }}>{e}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{memory.likesCount || memory.likes?.length || 0}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">{formatDate(memory.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigate("/")}
                            className="text-indigo-400 hover:text-indigo-300">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteMemory(memory._id)}
                            className="text-red-500 hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;