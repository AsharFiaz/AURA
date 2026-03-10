import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { showError, showSuccess } from "../utils/toast";
import { MemoryCardSkeleton } from "../components/common/LoadingSkeleton";
import {
  Edit2, LogOut, Mail, User as UserIcon, Heart, Grid,
  Sparkles, Trash2, Camera, X, Plus, Bell, BarChart2,
  Home as HomeIcon, Compass, ShoppingBag, Bookmark, Brain,
} from "lucide-react";

const TRAIT_INFO = {
  O: { label: "Openness", short: "O", color: "#8b5cf6", track: "rgba(139,92,246,0.15)", desc: "Curiosity & creativity" },
  C: { label: "Conscientiousness", short: "C", color: "#3b82f6", track: "rgba(59,130,246,0.15)", desc: "Discipline & planning" },
  E: { label: "Extraversion", short: "E", color: "#f59e0b", track: "rgba(245,158,11,0.15)", desc: "Social energy & assertiveness" },
  A: { label: "Agreeableness", short: "A", color: "#10b981", track: "rgba(16,185,129,0.15)", desc: "Empathy & cooperation" },
  N: { label: "Neuroticism", short: "N", color: "#ef4444", track: "rgba(239,68,68,0.15)", desc: "Emotional sensitivity" },
};

// ─── Circular ring component ──────────────────────────────────────────────────
const CircleRing = ({ score, traitKey, size = 88, strokeWidth = 7, animate: doAnimate = true }) => {
  const trait = TRAIT_INFO[traitKey];
  const pct = score !== null && score !== undefined ? Math.round(score * 100) : null;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct !== null ? (pct / 100) * circ : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={trait.track} strokeWidth={strokeWidth} />
          {/* Progress */}
          {pct !== null && (
            <motion.circle cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={trait.color} strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: doAnimate ? circ - dash : circ - dash }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              style={{ strokeDashoffset: circ - dash }}
            />
          )}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {pct !== null ? (
            <span className="text-white font-bold" style={{ fontSize: size * 0.2 }}>{pct}%</span>
          ) : (
            <span className="text-slate-600" style={{ fontSize: size * 0.18 }}>—</span>
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-white text-xs font-semibold">{trait.label}</p>
        <p className="text-slate-600 text-[10px]">{trait.desc}</p>
      </div>
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ user, logout, navigate, location }) => {
  const navLinks = [
    { icon: HomeIcon, label: "Home", path: "/" },
    { icon: Compass, label: "Discover", path: "/discover" },
    { icon: ShoppingBag, label: "Marketplace", path: "/marketplace" },
    { icon: Mail, label: "Messages", path: "/messages" },
    { icon: Bell, label: "Notifications", path: "/notifications", badge: true },
    { icon: Bookmark, label: "Bookmarks", path: "/bookmarks" },
    { icon: UserIcon, label: "Profile", path: "/profile" },
  ];
  return (
    <aside
      className="hidden lg:flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-hidden transition-all duration-300 ease-in-out group/sidebar"
      style={{ width: "72px", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      onMouseEnter={e => { e.currentTarget.style.width = "240px"; }}
      onMouseLeave={e => { e.currentTarget.style.width = "72px"; }}
    >
      <div className="px-4 py-6 flex items-center overflow-hidden" style={{ minHeight: "72px" }}>
        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent flex-shrink-0 w-8 text-center">A</span>
        <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-100">URA</span>
      </div>
      <nav className="flex flex-col gap-0.5 flex-1 px-2">
        {navLinks.map(item => (
          <button key={item.path} onClick={() => navigate(item.path)}
            className={`flex items-center rounded-xl transition-all duration-150 group/item relative ${location.pathname === item.path ? "text-white bg-white/10" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            style={{ minHeight: "48px", padding: "0 14px" }}>
            <item.icon className={`w-6 h-6 flex-shrink-0 transition-colors ${location.pathname === item.path ? "text-indigo-400" : "group-hover/item:text-indigo-400"}`} />
            <span className="ml-4 text-[15px] font-medium whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75 flex-1 text-left">{item.label}</span>
            {item.badge && <span className="absolute top-3 left-8 w-2 h-2 rounded-full bg-red-500" />}
          </button>
        ))}
      </nav>
      <div className="px-2 mt-2">
        <button onClick={() => navigate("/create")}
          className="w-full flex items-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-indigo-900/40 overflow-hidden"
          style={{ minHeight: "44px", padding: "0 14px" }}>
          <Plus className="w-5 h-5 flex-shrink-0" />
          <span className="ml-4 whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">Create Memory</span>
        </button>
      </div>
      <div className="mx-2 mt-3 mb-4 flex items-center rounded-xl hover:bg-white/5 transition-colors cursor-pointer group/user overflow-hidden"
        style={{ minHeight: "56px", padding: "0 10px" }} onClick={() => navigate("/profile")}>
        <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          {user?.profilePicture ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" /> : (user?.username?.charAt(0).toUpperCase() || "U")}
        </div>
        <div className="ml-3 flex-1 min-w-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">
          <p className="text-white text-xs font-semibold truncate">{user?.username}</p>
          <p className="text-slate-600 text-xs truncate">{user?.email}</p>
        </div>
        <button onClick={e => { e.stopPropagation(); logout(); navigate("/login"); }}
          className="ml-2 p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover/sidebar:opacity-100 group-hover/user:opacity-100">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

// ─── Profile ──────────────────────────────────────────────────────────────────
const Profile = () => {
  const [activeTab, setActiveTab] = useState("memories");
  const [editMode, setEditMode] = useState(false);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [showPictureModal, setShowPictureModal] = useState(false);
  const { user, token, logout, login, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [editUsername, setEditUsername] = useState(user?.username || "");

  useEffect(() => {
    if (user) { setEditUsername(user.username || ""); fetchUserMemories(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchUserMemories = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const r = await api.get(`/memories/user/${user.id}`);
      if (r.data.success) setMemories(r.data.memories);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleLogout = () => { logout(); navigate("/login"); };
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const r = await api.put("/users/profile", { username: editUsername });
      if (r.data.success) { if (token) login(token, r.data.user); setEditMode(false); showSuccess("Profile updated! ✨"); }
    } catch (e) { showError(e.response?.data?.message || "Failed to update profile"); }
    finally { setSaving(false); }
  };
  const handleCancel = () => { setEditUsername(user?.username || ""); setEditMode(false); };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showError("Image size must be less than 5MB"); return; }
    if (!file.type.startsWith("image/")) { showError("Please select an image file"); return; }
    const reader = new FileReader();
    reader.onload = ev => setProfilePicturePreview(ev.target.result);
    reader.readAsDataURL(file);
    setUploadingPicture(true);
    try {
      const fd = new FormData(); fd.append("image", file);
      const r = await api.post("/users/profile-picture", fd, { headers: { "Content-Type": "multipart/form-data" } });
      if (r.data.success) { showSuccess("Profile picture updated! ✨"); await refreshUser(); setProfilePicturePreview(null); }
    } catch (e) { showError(e.response?.data?.message || "Failed to upload"); setProfilePicturePreview(null); }
    finally { setUploadingPicture(false); e.target.value = ""; }
  };

  const handleRemoveProfilePicture = async () => {
    if (!window.confirm("Remove your profile picture?")) return;
    setUploadingPicture(true);
    try {
      const r = await api.put("/users/profile", { profilePicture: null });
      if (r.data.success) { showSuccess("Profile picture removed"); await refreshUser(); setProfilePicturePreview(null); }
    } catch (e) { showError(e.response?.data?.message || "Failed to remove"); }
    finally { setUploadingPicture(false); }
  };

  const handleDeleteMemory = async (memoryId) => {
    try {
      const r = await api.delete(`/memories/${memoryId}`);
      if (r.data.success) { setMemories(p => p.filter(m => m._id !== memoryId)); showSuccess("Memory deleted 🗑️"); }
      else showError("Failed to delete memory.");
    } catch (e) { showError(e.response?.data?.message || "Failed to delete memory"); }
  };

  const getMemberSince = () => {
    if (!user?.createdAt) return "Recently";
    return new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const hasPersonality = user?.personality && Object.values(user.personality).some(v => v !== null);
  const totalLikes = memories.reduce((sum, m) => sum + (m.likesCount || 0), 0);

  if (!user) return null;

  const tabs = [
    { id: "memories", icon: <Grid className="w-4 h-4" />, label: "My Memories" },
    { id: "personality", icon: <Brain className="w-4 h-4" />, label: "Personality" },
    { id: "about", icon: <UserIcon className="w-4 h-4" />, label: "About" },
  ];

  return (
    <div className="min-h-screen text-white" style={{ background: "#0d0d1a" }}>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">AURA</span>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      <div className="flex">
        <Sidebar user={user} logout={logout} navigate={navigate} location={location} />

        <main className="flex-1 min-w-0">
          {/* Page header */}
          <div className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between"
            style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-indigo-400" />
              <h1 className="text-base font-bold text-white">Profile</h1>
            </div>
            <button onClick={handleLogout}
              className="hidden lg:flex items-center gap-2 text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>

          <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 pb-24 lg:pb-8 space-y-4">

            {/* Profile header */}
            <motion.div className="rounded-2xl p-6"
              style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Avatar */}
                <div className="relative group flex-shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg relative"
                    style={{ boxShadow: "0 0 32px rgba(99,102,241,0.25)" }}>
                    {profilePicturePreview || user.profilePicture ? (
                      <>
                        <img src={profilePicturePreview || user.profilePicture} alt={user.username}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setShowPictureModal(true)} />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <label htmlFor="profile-picture-upload" className="cursor-pointer" onClick={e => e.stopPropagation()}>
                            <Camera className="w-5 h-5 text-white" />
                          </label>
                        </div>
                      </>
                    ) : (
                      <>
                        {user.username?.charAt(0).toUpperCase() || "U"}
                        <label htmlFor="profile-picture-upload" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center rounded-full">
                          <Camera className="w-5 h-5 text-white" />
                        </label>
                      </>
                    )}
                  </div>
                  <input id="profile-picture-upload" type="file" accept="image/*" className="hidden" onChange={handleProfilePictureUpload} disabled={uploadingPicture} />
                  {user.profilePicture && (
                    <button onClick={e => { e.stopPropagation(); handleRemoveProfilePicture(); }} disabled={uploadingPicture}
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors z-10">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {uploadingPicture && (
                    <div className="absolute inset-0 rounded-full bg-black/80 flex items-center justify-center z-20">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-xl font-bold text-white mb-1">{user.username}</h1>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 text-xs mb-1">
                    <Mail className="w-3.5 h-3.5" /><span>{user.email}</span>
                  </div>
                  <p className="text-slate-600 text-xs mb-4">Member since {getMemberSince()}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setEditMode(!editMode)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-medium transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <Edit2 className="w-3.5 h-3.5" />
                      {editMode ? "Cancel Edit" : "Edit Profile"}
                    </button>
                    <button onClick={() => navigate("/reports")}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-medium transition-all"
                      style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
                      <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                      My Report
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              {[
                { label: "Memories", value: memories.length },
                { label: "Likes", value: totalLikes },
                { label: "Followers", value: user.followers?.length || 0 },
                { label: "Following", value: user.following?.length || 0 },
              ].map(stat => (
                <div key={stat.label} className="rounded-2xl p-4 text-center"
                  style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="text-slate-600 text-xs mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </motion.div>

            {/* Edit form */}
            <AnimatePresence>
              {editMode && (
                <motion.div className="rounded-2xl p-5"
                  style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                  <h2 className="text-sm font-bold text-white mb-4">Edit Profile</h2>
                  <div className="mb-4">
                    <label className="block text-slate-500 text-xs font-medium mb-1.5">Username</label>
                    <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-white text-sm focus:outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                    />
                  </div>
                  <div className="mb-5">
                    <label className="block text-slate-500 text-xs font-medium mb-1.5">Email</label>
                    <input type="email" value={user.email} disabled
                      className="w-full px-4 py-2.5 rounded-xl text-slate-700 text-sm cursor-not-allowed"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }} />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleCancel}
                      className="flex-1 py-2.5 rounded-xl text-slate-300 text-sm font-medium transition-all"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      Cancel
                    </button>
                    <button onClick={handleSaveChanges} disabled={saving}
                      className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabs */}
            <div className="flex gap-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? "text-indigo-400" : "text-slate-500 hover:text-white"}`}>
                  {tab.icon}{tab.label}
                  {activeTab === tab.id && (
                    <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-indigo-400" layoutId="profileTab" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">

              {/* ── Memories ── */}
              {activeTab === "memories" && (
                <motion.div key="memories" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...Array(6)].map((_, i) => <MemoryCardSkeleton key={i} />)}
                    </div>
                  ) : memories.length === 0 ? (
                    <div className="text-center py-16 rounded-2xl"
                      style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <Sparkles className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm mb-4">No memories yet</p>
                      <button onClick={() => navigate("/create")}
                        className="px-5 py-2 rounded-xl text-white text-sm font-medium transition-all"
                        style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                        Create Your First Memory
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {memories.map((memory, i) => (
                        <motion.div key={memory._id} className="rounded-2xl p-4 transition-all"
                          style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
                          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          whileHover={{ borderColor: "rgba(99,102,241,0.3)" }}>
                          {memory.image && (
                            <div className="mb-3 rounded-xl overflow-hidden h-36">
                              <img src={memory.image} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <p className="text-slate-200 text-sm font-medium line-clamp-2 mb-3">{memory.caption}</p>
                          <div className="flex items-center justify-between pt-2"
                            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                              <Heart className="w-3.5 h-3.5" /><span>{memory.likesCount || 0}</span>
                            </div>
                            <button onClick={() => handleDeleteMemory(memory._id)}
                              className="p-1.5 text-slate-700 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Personality tab ── */}
              {activeTab === "personality" && (
                <motion.div key="personality" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                  {hasPersonality ? (
                    <div className="rounded-2xl p-6"
                      style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-white font-bold text-sm">OCEAN Personality</h3>
                          <p className="text-slate-600 text-xs mt-0.5">Derived from your memories by AI</p>
                        </div>
                        <motion.button
                          onClick={() => navigate("/personality")}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                          style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 16px rgba(79,70,229,0.3)" }}
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Brain className="w-3.5 h-3.5" /> Full Report
                        </motion.button>
                      </div>

                      {/* Rings grid */}
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-6 justify-items-center">
                        {Object.keys(TRAIT_INFO).map(key => (
                          <CircleRing key={key} traitKey={key} score={user.personality[key]} />
                        ))}
                      </div>

                      {/* Dominant trait callout */}
                      {(() => {
                        const entries = Object.entries(user.personality).filter(([, v]) => v !== null);
                        if (!entries.length) return null;
                        const [topKey] = entries.sort((a, b) => b[1] - a[1])[0];
                        const trait = TRAIT_INFO[topKey];
                        return (
                          <motion.div className="mt-6 px-4 py-3 rounded-xl flex items-center gap-3"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: `${trait.color}22`, border: `1px solid ${trait.color}44` }}>
                              <Sparkles className="w-4 h-4" style={{ color: trait.color }} />
                            </div>
                            <div>
                              <p className="text-white text-xs font-semibold">
                                Dominant trait — {trait.label}
                              </p>
                              <p className="text-slate-600 text-xs">{trait.desc}</p>
                            </div>
                          </motion.div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-16 rounded-2xl"
                      style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <Brain className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-white font-semibold mb-1">No personality data yet</p>
                      <p className="text-slate-600 text-sm mb-5">Take the quiz or create more memories so AI can build your profile</p>
                      <button onClick={() => navigate("/onboarding")}
                        className="px-5 py-2 rounded-xl text-white text-sm font-medium"
                        style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                        Take the Quiz
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── About ── */}
              {activeTab === "about" && (
                <motion.div key="about" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                  <div className="rounded-2xl p-6" style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <h3 className="text-sm font-bold text-white mb-4">Account Info</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <span className="text-slate-500 text-xs">Username</span>
                        <span className="text-white text-xs font-medium">{user.username}</span>
                      </div>
                      <div className="flex items-center justify-between py-2"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <span className="text-slate-500 text-xs">Email</span>
                        <span className="text-white text-xs font-medium">{user.email}</span>
                      </div>
                      <div className="flex items-center justify-between py-2"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <span className="text-slate-500 text-xs">Member Since</span>
                        <span className="text-white text-xs font-medium">{getMemberSince()}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-slate-500 text-xs">Role</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}>
                          {user.role || "user"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-white/[0.05] px-2 py-2 z-50"
        style={{ background: "#0d0d1a" }}>
        <div className="flex items-center justify-around max-w-sm mx-auto">
          {[
            { icon: HomeIcon, path: "/" },
            { icon: () => <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>, path: "/search" },
            { icon: Plus, path: "/create", fab: true },
            { icon: Bell, path: "/notifications" },
            { icon: UserIcon, path: "/profile" },
          ].map(({ icon: Icon, path, fab }) => (
            <button key={path} onClick={() => navigate(path)}
              className={fab
                ? "w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg"
                : `p-2.5 rounded-xl transition-colors ${location.pathname === path ? "text-indigo-400 bg-indigo-400/10" : "text-slate-500 hover:text-white"}`
              }>
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </nav>

      {/* Profile picture modal */}
      <AnimatePresence>
        {showPictureModal && (profilePicturePreview || user.profilePicture) && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPictureModal(false)}>
            <motion.div className="relative max-w-lg w-full p-4"
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowPictureModal(false)}
                className="absolute -top-2 -right-2 w-9 h-9 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white z-10 shadow-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
              <img src={profilePicturePreview || user.profilePicture} alt={user.username}
                className="w-full object-contain rounded-2xl shadow-2xl" />
              <p className="mt-3 text-center text-white font-semibold text-sm">{user.username}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;