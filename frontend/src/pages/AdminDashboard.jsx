import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  FileText,
  ShoppingBag,
  TrendingUp,
  Activity,
  LogOut,
  Eye,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { showError, showSuccess } from "../utils/toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMemories: 0,
    totalNFTs: 0,
    totalLikes: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentMemories, setRecentMemories] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [memoryActivityData, setMemoryActivityData] = useState([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

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

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      if (usersRes.data.success) {
        setRecentUsers(usersRes.data.users);
      }

      if (memoriesRes.data.success) {
        setRecentMemories(memoriesRes.data.memories);
      }

      if (userGrowthRes.data.success) {
        setUserGrowthData(userGrowthRes.data.data);
      }

      if (memoryActivityRes.data.success) {
        setMemoryActivityData(memoryActivityRes.data.data);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      showError("Failed to load admin data");
      // If unauthorized, redirect to home
      if (error.response?.status === 403 || error.response?.status === 401) {
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDeleteMemory = async (memoryId) => {
    if (!window.confirm("Are you sure you want to delete this memory?")) {
      return;
    }

    try {
      const response = await api.delete(`/admin/memories/${memoryId}`);
      if (response.data.success) {
        showSuccess("Memory deleted successfully");
        fetchAdminData(); // Refresh data
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
    });
  };

  // Calculate max values for chart scaling
  const maxUserGrowth = userGrowthData.length > 0 
    ? Math.max(...userGrowthData.map(d => d.count), 1) 
    : 1;
  const maxMemoryActivity = memoryActivityData.length > 0 
    ? Math.max(...memoryActivityData.map(d => d.count), 1) 
    : 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          className="text-white text-xl"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Loading admin dashboard...
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
          <motion.h1
            onClick={() => navigate("/admin/dashboard")}
            className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent cursor-pointer select-none"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            AURA Admin
          </motion.h1>
          <motion.button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </motion.button>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <motion.div
            onClick={() => navigate("/admin/users")}
            className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 cursor-pointer hover:bg-white/15 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-slate-400 text-sm mb-1">Total Users</h3>
            <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
          </motion.div>

          {/* Total Memories */}
          <motion.div
            onClick={() => navigate("/admin/memories")}
            className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 cursor-pointer hover:bg-white/15 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-slate-400 text-sm mb-1">Total Memories</h3>
            <p className="text-3xl font-bold text-white">
              {stats.totalMemories}
            </p>
          </motion.div>

          {/* Total NFTs Listed */}
          <motion.div
            onClick={() => navigate("/admin/nfts")}
            className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 cursor-pointer hover:bg-white/15 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-slate-400 text-sm mb-1">Total NFTs Listed</h3>
            <p className="text-3xl font-bold text-white">{stats.totalNFTs}</p>
          </motion.div>

          {/* Total Likes */}
          <motion.div
            onClick={() => navigate("/admin/likes")}
            className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 cursor-pointer hover:bg-white/15 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-slate-400 text-sm mb-1">Total Likes</h3>
            <p className="text-3xl font-bold text-white">{stats.totalLikes}</p>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth Chart */}
          <motion.div
            onClick={() => navigate("/admin/users")}
            className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 cursor-pointer hover:bg-white/15 transition-colors"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              User Growth
            </h3>
            <p className="text-slate-400 text-sm mb-6">New users per month</p>
            {userGrowthData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400">
                No data available
              </div>
            ) : (
              <>
                <div className="h-64 flex items-end justify-between gap-2">
                  {userGrowthData.map((data, index) => (
                    <motion.div
                      key={index}
                      className="flex-1 flex flex-col items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                    >
                      <motion.div
                        className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg flex items-end justify-center pb-2 min-h-[20px]"
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max((data.count / maxUserGrowth) * 100, 5)}%` }}
                        transition={{ delay: 0.6 + index * 0.05, duration: 0.5 }}
                      >
                        <span className="text-xs text-white font-medium">{data.count}</span>
                      </motion.div>
                      <span className="text-xs text-slate-400 mt-2 transform -rotate-45 origin-left whitespace-nowrap">
                        {data.month.split(' ')[0]}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 text-xs text-slate-400 text-center">
                  Last 12 months
                </div>
              </>
            )}
          </motion.div>

          {/* Memory Activity Chart */}
          <motion.div
            onClick={() => navigate("/admin/memories")}
            className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 cursor-pointer hover:bg-white/15 transition-colors"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Memory Activity
            </h3>
            <p className="text-slate-400 text-sm mb-6">Posts per day (last 7 days)</p>
            {memoryActivityData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400">
                No data available
              </div>
            ) : (
              <div className="h-64 flex items-end justify-between gap-2">
                {memoryActivityData.map((data, index) => (
                  <motion.div
                    key={index}
                    className="flex flex-col items-center flex-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <motion.div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg flex items-end justify-center pb-2 mb-2 min-h-[20px]"
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max((data.count / maxMemoryActivity) * 100, 5)}%` }}
                      transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                    >
                      <span className="text-xs text-white font-medium">
                        {data.count}
                      </span>
                    </motion.div>
                    <span className="text-xs text-slate-400">
                      {data.day}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users Table */}
          <motion.div
            className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Recent Users
              </h3>
              <motion.button
                onClick={() => navigate("/admin/users")}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View All →
              </motion.button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 text-slate-400 text-sm font-medium">
                      User
                    </th>
                    <th className="text-left py-3 px-2 text-slate-400 text-sm font-medium">
                      Email
                    </th>
                    <th className="text-left py-3 px-2 text-slate-400 text-sm font-medium">
                      Joined
                    </th>
                    <th className="text-left py-3 px-2 text-slate-400 text-sm font-medium">
                      Memories
                    </th>
                    <th className="text-left py-3 px-2 text-slate-400 text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    recentUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-2">
                          <motion.div 
                            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => navigate(`/user/${user.id}`)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                              {user.username?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <span className="text-white text-sm font-medium">
                              {user.username}
                            </span>
                          </motion.div>
                        </td>
                        <td className="py-3 px-2 text-slate-400 text-sm">
                          {user.email}
                        </td>
                        <td className="py-3 px-2 text-slate-400 text-sm">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="py-3 px-2 text-slate-400 text-sm">
                          {user.memoriesCount || 0}
                        </td>
                        <td className="py-3 px-2">
                          <motion.button
                            onClick={() => navigate(`/user/${user.id}`)}
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Eye className="w-4 h-4" />
                          </motion.button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Recent Memories Table */}
          <motion.div
            className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Recent Memories
              </h3>
              <motion.button
                onClick={() => navigate("/admin/memories")}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View All →
              </motion.button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 text-slate-400 text-sm font-medium">
                      User
                    </th>
                    <th className="text-left py-3 px-2 text-slate-400 text-sm font-medium">
                      Caption
                    </th>
                    <th className="text-left py-3 px-2 text-slate-400 text-sm font-medium">
                      Likes
                    </th>
                    <th className="text-left py-3 px-2 text-slate-400 text-sm font-medium">
                      Created
                    </th>
                    <th className="text-left py-3 px-2 text-slate-400 text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentMemories.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-400">
                        No memories found
                      </td>
                    </tr>
                  ) : (
                    recentMemories.map((memory) => (
                      <tr
                        key={memory._id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-2">
                          <motion.div 
                            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => navigate(`/user/${memory.user?._id || memory.user?.id}`)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                              {memory.user?.username?.charAt(0).toUpperCase() ||
                                "U"}
                            </div>
                            <span className="text-white text-sm">
                              {memory.user?.username || "Unknown"}
                            </span>
                          </motion.div>
                        </td>
                        <td className="py-3 px-2">
                          <p className="text-slate-300 text-sm max-w-[200px] truncate">
                            {memory.caption || "No caption"}
                          </p>
                          {memory.emotions && memory.emotions.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {memory.emotions.slice(0, 2).map((emotion, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full"
                                >
                                  {emotion}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2 text-slate-400 text-sm">
                          {memory.likesCount || memory.likes?.length || 0}
                        </td>
                        <td className="py-3 px-2 text-slate-400 text-sm">
                          {formatDate(memory.createdAt)}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <motion.button
                              onClick={() => navigate(`/`)} // Navigate to feed, could add memory ID to scroll to it
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Eye className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDeleteMemory(memory._id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
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

