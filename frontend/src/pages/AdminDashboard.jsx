import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  Users, FileText, ShoppingBag, TrendingUp,
  Activity, LogOut, Eye, Trash2,
} from "lucide-react";
import { showError, showSuccess } from "../utils/toast";

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0d1a" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading admin dashboard…</span>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "from-indigo-500 to-indigo-600", path: "/admin/users" },
    { label: "Total Memories", value: stats.totalMemories, icon: FileText, color: "from-violet-500 to-violet-600", path: "/admin/memories" },
    { label: "Total NFTs", value: stats.totalNFTs, icon: ShoppingBag, color: "from-purple-500 to-purple-600", path: "/admin/nfts" },
    { label: "Total Likes", value: stats.totalLikes, icon: Activity, color: "from-blue-500 to-blue-600", path: "/admin/likes" },
  ];

  return (
    <div className="min-h-screen text-white" style={{ background: "#0d0d1a" }}>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span
          onClick={() => navigate("/admin/dashboard")}
          className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent cursor-pointer select-none"
        >
          AURA <span className="text-slate-500 text-lg font-medium">Admin</span>
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, path }, i) => (
            <motion.div key={label} onClick={() => navigate(path)}
              className="rounded-2xl p-5 cursor-pointer transition-all"
              style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-slate-500 text-xs mb-1">{label}</p>
              <p className="text-3xl font-bold text-white">{value}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* User Growth */}
          <motion.div onClick={() => navigate("/admin/users")}
            className="rounded-2xl p-6 cursor-pointer transition-all"
            style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h3 className="text-white font-semibold text-sm">User Growth</h3>
            </div>
            <p className="text-slate-600 text-xs mb-5">New users per month</p>
            {userGrowthData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-600 text-sm">No data available</div>
            ) : (
              <>
                <div className="h-48 flex items-end justify-between gap-1.5">
                  {userGrowthData.map((data, i) => (
                    <motion.div key={i} className="flex-1 flex flex-col items-center"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.04 }}>
                      <motion.div
                        className="w-full rounded-t-md flex items-end justify-center pb-1 min-h-[6px]"
                        style={{ background: "linear-gradient(to top, #4f46e5, #818cf8)" }}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max((data.count / maxUserGrowth) * 100, 4)}%` }}
                        transition={{ delay: 0.4 + i * 0.04, duration: 0.5 }}
                      >
                        {data.count > 0 && <span className="text-[10px] text-white font-medium">{data.count}</span>}
                      </motion.div>
                      <span className="text-[10px] text-slate-600 mt-1.5 -rotate-45 origin-left whitespace-nowrap">
                        {data.month.split(" ")[0]}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <p className="text-center text-slate-700 text-xs mt-4">Last 12 months</p>
              </>
            )}
          </motion.div>

          {/* Memory Activity */}
          <motion.div onClick={() => navigate("/admin/memories")}
            className="rounded-2xl p-6 cursor-pointer transition-all"
            style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-violet-400" />
              <h3 className="text-white font-semibold text-sm">Memory Activity</h3>
            </div>
            <p className="text-slate-600 text-xs mb-5">Posts per day (last 7 days)</p>
            {memoryActivityData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-600 text-sm">No data available</div>
            ) : (
              <div className="h-48 flex items-end justify-between gap-2">
                {memoryActivityData.map((data, i) => (
                  <motion.div key={i} className="flex flex-col items-center flex-1"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.08 }}>
                    <motion.div
                      className="w-full rounded-t-md flex items-end justify-center pb-1 mb-2 min-h-[6px]"
                      style={{ background: "linear-gradient(to top, #7c3aed, #a78bfa)" }}
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

          {/* Recent Users */}
          <motion.div className="rounded-2xl overflow-hidden"
            style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h3 className="text-white font-semibold text-sm">Recent Users</h3>
              </div>
              <button onClick={() => navigate("/admin/users")}
                className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold transition-colors">
                View All →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {["User", "Email", "Joined", "Memories", ""].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-slate-600 text-xs font-medium uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-10 text-slate-600 text-sm">No users found</td></tr>
                  ) : recentUsers.map(user => (
                    <tr key={user.id} className="transition-colors hover:bg-white/[0.03]"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
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
                          className="text-indigo-400 hover:text-indigo-300 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Recent Memories */}
          <motion.div className="rounded-2xl overflow-hidden"
            style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-400" />
                <h3 className="text-white font-semibold text-sm">Recent Memories</h3>
              </div>
              <button onClick={() => navigate("/admin/memories")}
                className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold transition-colors">
                View All →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {["User", "Caption", "Likes", "Created", ""].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-slate-600 text-xs font-medium uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentMemories.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-10 text-slate-600 text-sm">No memories found</td></tr>
                  ) : recentMemories.map(memory => (
                    <tr key={memory._id} className="transition-colors hover:bg-white/[0.03]"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
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
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full text-indigo-300"
                                style={{ background: "rgba(99,102,241,0.15)" }}>{e}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{memory.likesCount || memory.likes?.length || 0}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">{formatDate(memory.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigate("/")}
                            className="text-indigo-400 hover:text-indigo-300 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteMemory(memory._id)}
                            className="text-red-500 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
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