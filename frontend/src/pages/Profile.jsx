import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { showError, showSuccess } from "../utils/toast";
import { MemoryCardSkeleton } from "../components/common/LoadingSkeleton";
import AnimatedBackdrop from "../components/common/AnimatedBackdrop";
import BombasticSidebar from "../components/common/BombasticSidebar";
import CommandBar from "../components/common/CommandBar";
import MobileTopBar from "../components/common/MobileTopBar";
import MobileBottomNav from "../components/common/MobileBottomNav";
import {
  Edit2, LogOut, Mail, User as UserIcon, Heart, Grid,
  Sparkles, Trash2, Camera, X, BarChart2, Brain,
} from "lucide-react";

const TRAIT_INFO = {
  O: { label: "Openness", short: "O", color: "#a78bfa", track: "rgba(167,139,250,0.15)", desc: "Curiosity & creativity" },
  C: { label: "Conscientiousness", short: "C", color: "#818cf8", track: "rgba(129,140,248,0.15)", desc: "Discipline & planning" },
  E: { label: "Extraversion", short: "E", color: "#fbbf24", track: "rgba(251,191,36,0.15)", desc: "Social energy & assertiveness" },
  A: { label: "Agreeableness", short: "A", color: "#34d399", track: "rgba(52,211,153,0.15)", desc: "Empathy & cooperation" },
  N: { label: "Neuroticism", short: "N", color: "#f87171", track: "rgba(248,113,113,0.15)", desc: "Emotional sensitivity" },
};

// ─── Circular ring with glow effect ──────────────────────────────────────────
const CircleRing = ({ score, traitKey, size = 88, strokeWidth = 7 }) => {
  const trait = TRAIT_INFO[traitKey];
  const pct = score !== null && score !== undefined ? Math.round(score * 100) : null;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct !== null ? (pct / 100) * circ : 0;

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <filter id={`glow-${traitKey}`}>
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={trait.track} strokeWidth={strokeWidth} />
          {pct !== null && (
            <motion.circle cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={trait.color} strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circ}
              filter={`url(#glow-${traitKey})`}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ - dash }}
              transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {pct !== null ? (
            <motion.span
              className="text-white font-bold"
              style={{ fontSize: size * 0.2 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {pct}%
            </motion.span>
          ) : (
            <span className="text-slate-600" style={{ fontSize: size * 0.18 }}>—</span>
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-white text-xs font-semibold">{trait.label}</p>
        <p className="text-slate-600 text-[10px]">{trait.desc}</p>
      </div>
    </motion.div>
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
    <div className="min-h-screen text-white relative">
      <AnimatedBackdrop />

      <CommandBar recentActivityCount={memories.length} isLive={!loading} />
      <MobileTopBar
        title="Profile"
        icon={UserIcon}
        showBack={false}
        rightAction={
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        }
      />

      <div className="flex relative">
        <BombasticSidebar />

        <main className="flex-1 min-w-0">
          {/* Sticky page header */}
          <motion.div
            className="sticky top-[42px] z-40 px-6 py-4 flex items-center justify-between"
            style={{
              background: "rgba(10,10,20,0.85)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(167,139,250,0.1)",
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <UserIcon className="w-5 h-5 text-indigo-400" />
              </motion.div>
              <h1 className="text-base font-bold bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-transparent">
                Profile
              </h1>
            </div>
            <motion.button
              onClick={handleLogout}
              className="hidden lg:flex items-center gap-2 text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)" }}
              whileHover={{ scale: 1.04, borderColor: "rgba(239,68,68,0.3)" }}
              whileTap={{ scale: 0.96 }}
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </motion.button>
          </motion.div>

          <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 pb-24 lg:pb-8 space-y-4">

            {/* Profile header card */}
            <motion.div
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: "rgba(19,19,42,0.7)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(167,139,250,0.15)",
                boxShadow: "0 0 40px rgba(124,58,237,0.1)",
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Animated edge shimmer */}
              <motion.div
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.06), transparent)" }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 5, repeat: Infinity, repeatDelay: 3 }}
              />

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative">
                {/* Avatar with rotating glow ring */}
                <div className="relative group flex-shrink-0">
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "conic-gradient(#a78bfa, #ec4899, #818cf8, #a78bfa)",
                      padding: "3px",
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-full h-full rounded-full bg-[#0d0d1a]" />
                  </motion.div>

                  <div
                    className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg relative"
                    style={{ boxShadow: "0 0 32px rgba(99,102,241,0.35)" }}
                  >
                    {profilePicturePreview || user.profilePicture ? (
                      <>
                        <img
                          src={profilePicturePreview || user.profilePicture}
                          alt={user.username}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setShowPictureModal(true)}
                        />
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

                  <input
                    id="profile-picture-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePictureUpload}
                    disabled={uploadingPicture}
                  />

                  {user.profilePicture && (
                    <motion.button
                      onClick={e => { e.stopPropagation(); handleRemoveProfilePicture(); }}
                      disabled={uploadingPicture}
                      className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors z-10"
                      whileHover={{ scale: 1.15, rotate: 90 }}
                      whileTap={{ scale: 0.85 }}
                      style={{ boxShadow: "0 0 16px rgba(239,68,68,0.4)" }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  )}

                  {uploadingPicture && (
                    <div className="absolute inset-0 rounded-full bg-black/80 flex items-center justify-center z-20">
                      <motion.div
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <motion.h1
                    className="text-2xl font-bold bg-gradient-to-r from-white via-indigo-100 to-violet-200 bg-clip-text text-transparent mb-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    {user.username}
                  </motion.h1>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 text-xs mb-1">
                    <Mail className="w-3.5 h-3.5" /><span>{user.email}</span>
                  </div>
                  <p className="text-slate-600 text-xs mb-4">Member since {getMemberSince()}</p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <motion.button
                      onClick={() => setEditMode(!editMode)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-medium transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                      whileHover={{ scale: 1.04, borderColor: "rgba(167,139,250,0.3)" }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      {editMode ? "Cancel Edit" : "Edit Profile"}
                    </motion.button>
                    <motion.button
                      onClick={() => navigate("/reports")}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-medium transition-all relative overflow-hidden"
                      style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}
                      whileHover={{ scale: 1.04, borderColor: "rgba(99,102,241,0.5)", boxShadow: "0 0 16px rgba(124,58,237,0.3)" }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                      My Report
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
              initial="hidden"
              animate="visible"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
            >
              {[
                { label: "Memories", value: memories.length, color: "#a78bfa" },
                { label: "Likes", value: totalLikes, color: "#ec4899" },
                { label: "Followers", value: user.followers?.length || 0, color: "#34d399" },
                { label: "Following", value: user.following?.length || 0, color: "#fbbf24" },
              ].map(stat => (
                <motion.div
                  key={stat.label}
                  className="rounded-2xl p-4 text-center relative overflow-hidden"
                  style={{
                    background: "rgba(19,19,42,0.7)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(167,139,250,0.1)",
                  }}
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                  whileHover={{
                    scale: 1.04,
                    borderColor: "rgba(167,139,250,0.3)",
                    boxShadow: `0 0 24px ${stat.color}30`,
                  }}
                >
                  <p className="text-slate-600 text-xs mb-1 uppercase tracking-widest">{stat.label}</p>
                  <motion.p
                    className="text-2xl font-bold text-white"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    {stat.value}
                  </motion.p>
                  <motion.span
                    className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full"
                    style={{ background: stat.color }}
                    animate={{
                      boxShadow: [
                        `0 0 0px ${stat.color}`,
                        `0 0 8px ${stat.color}`,
                        `0 0 0px ${stat.color}`,
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Edit form */}
            <AnimatePresence>
              {editMode && (
                <motion.div
                  className="rounded-2xl p-5 relative overflow-hidden"
                  style={{
                    background: "rgba(19,19,42,0.7)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(167,139,250,0.15)",
                  }}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                      animate={{ boxShadow: ["0 0 0px #a78bfa", "0 0 8px #a78bfa", "0 0 0px #a78bfa"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    Edit Profile
                  </h2>
                  <div className="mb-4">
                    <label className="block text-slate-500 text-xs font-medium mb-1.5 uppercase tracking-widest">Username</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={e => setEditUsername(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-white text-sm focus:outline-none transition-all"
                      style={{ background: "rgba(13,13,26,0.6)", border: "1px solid rgba(167,139,250,0.15)" }}
                      onFocus={e => { e.target.style.borderColor = "rgba(167,139,250,0.5)"; e.target.style.boxShadow = "0 0 16px rgba(124,58,237,0.2)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(167,139,250,0.15)"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                  <div className="mb-5">
                    <label className="block text-slate-500 text-xs font-medium mb-1.5 uppercase tracking-widest">Email</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl text-slate-700 text-sm cursor-not-allowed"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                    />
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      onClick={handleCancel}
                      className="flex-1 py-2.5 rounded-xl text-slate-300 text-sm font-medium transition-all"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                      whileHover={{ scale: 1.02, borderColor: "rgba(167,139,250,0.3)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleSaveChanges}
                      disabled={saving}
                      className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 relative overflow-hidden"
                      style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}
                      whileHover={!saving ? { scale: 1.02, boxShadow: "0 4px 24px rgba(124,58,237,0.5)" } : {}}
                      whileTap={!saving ? { scale: 0.98 } : {}}
                    >
                      {!saving && (
                        <motion.div
                          className="absolute inset-0"
                          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                        />
                      )}
                      <span className="relative">{saving ? "Saving…" : "Save Changes"}</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabs */}
            <div className="flex gap-1 relative" style={{ borderBottom: "1px solid rgba(167,139,250,0.15)" }}>
              {tabs.map(tab => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? "text-indigo-400" : "text-slate-500 hover:text-white"}`}
                  whileHover={{ y: -1 }}
                >
                  {tab.icon}{tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{
                        background: "linear-gradient(90deg, #818cf8, #a78bfa, #818cf8)",
                        boxShadow: "0 0 8px rgba(167,139,250,0.6)",
                      }}
                      layoutId="profileTab"
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">

              {/* ── Memories ── */}
              {activeTab === "memories" && (
                <motion.div
                  key="memories"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.4, 0.7, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                        >
                          <MemoryCardSkeleton />
                        </motion.div>
                      ))}
                    </div>
                  ) : memories.length === 0 ? (
                    <motion.div
                      className="text-center py-16 rounded-2xl relative overflow-hidden"
                      style={{
                        background: "rgba(19,19,42,0.6)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(167,139,250,0.1)",
                      }}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <motion.div
                        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                        style={{ background: "rgba(99,102,241,0.1)" }}
                        animate={{
                          boxShadow: [
                            "0 0 16px rgba(124,58,237,0.2)",
                            "0 0 32px rgba(124,58,237,0.4)",
                            "0 0 16px rgba(124,58,237,0.2)",
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                      </motion.div>
                      <p className="text-slate-400 text-sm mb-4 font-semibold">No memories yet</p>
                      <motion.button
                        onClick={() => navigate("/create")}
                        className="px-5 py-2 rounded-xl text-white text-sm font-medium relative overflow-hidden inline-flex items-center gap-2"
                        style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}
                        whileHover={{ scale: 1.05, boxShadow: "0 4px 24px rgba(124,58,237,0.5)" }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <motion.div
                          className="absolute inset-0"
                          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                        />
                        <span className="relative">Create Your First Memory</span>
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      initial="hidden"
                      animate="visible"
                      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
                    >
                      {memories.map((memory) => (
                        <motion.div
                          key={memory._id}
                          className="rounded-2xl p-4 transition-all relative overflow-hidden group"
                          style={{
                            background: "rgba(19,19,42,0.7)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(167,139,250,0.1)",
                          }}
                          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                          whileHover={{
                            borderColor: "rgba(167,139,250,0.35)",
                            scale: 1.02,
                            boxShadow: "0 0 24px rgba(124,58,237,0.2)",
                          }}
                        >
                          {memory.image && (
                            <div className="mb-3 rounded-xl overflow-hidden h-36">
                              <img
                                src={memory.image}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          )}
                          <p className="text-slate-200 text-sm font-medium line-clamp-2 mb-3">{memory.caption}</p>
                          <div
                            className="flex items-center justify-between pt-2"
                            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                          >
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                              <Heart className="w-3.5 h-3.5" /><span>{memory.likesCount || 0}</span>
                            </div>
                            <motion.button
                              onClick={() => handleDeleteMemory(memory._id)}
                              className="p-1.5 text-slate-700 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              whileHover={{ scale: 1.15, rotate: 5 }}
                              whileTap={{ scale: 0.85 }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* ── Personality ── */}
              {activeTab === "personality" && (
                <motion.div
                  key="personality"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {hasPersonality ? (
                    <motion.div
                      className="rounded-2xl p-6 relative overflow-hidden"
                      style={{
                        background: "rgba(19,19,42,0.7)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(167,139,250,0.15)",
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {/* Animated edge shimmer */}
                      <motion.div
                        className="absolute inset-0 opacity-30 pointer-events-none"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.06), transparent)" }}
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 5, repeat: Infinity, repeatDelay: 3 }}
                      />

                      {/* Header */}
                      <div className="flex items-center justify-between mb-6 relative">
                        <div>
                          <h3 className="text-white font-bold text-sm flex items-center gap-2">
                            <motion.span
                              className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                              animate={{ boxShadow: ["0 0 0px #a78bfa", "0 0 8px #a78bfa", "0 0 0px #a78bfa"] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            OCEAN Personality
                          </h3>
                          <p className="text-slate-600 text-xs mt-0.5">Derived from your memories by AI</p>
                        </div>
                        <motion.button
                          onClick={() => navigate("/personality")}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all relative overflow-hidden"
                          style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 16px rgba(79,70,229,0.3)" }}
                          whileHover={{ scale: 1.05, boxShadow: "0 4px 24px rgba(124,58,237,0.5)" }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <motion.div
                            className="absolute inset-0"
                            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                          />
                          <span className="relative flex items-center gap-2">
                            <Brain className="w-3.5 h-3.5" /> Full Report
                          </span>
                        </motion.button>
                      </div>

                      {/* Rings grid */}
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-6 justify-items-center relative">
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
                          <motion.div
                            className="mt-6 px-4 py-3 rounded-xl flex items-center gap-3 relative overflow-hidden"
                            style={{
                              background: `${trait.color}10`,
                              border: `1px solid ${trait.color}30`,
                            }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                          >
                            <motion.div
                              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: `${trait.color}22`, border: `1px solid ${trait.color}55` }}
                              animate={{
                                boxShadow: [
                                  `0 0 0px ${trait.color}`,
                                  `0 0 16px ${trait.color}80`,
                                  `0 0 0px ${trait.color}`,
                                ],
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Sparkles className="w-4 h-4" style={{ color: trait.color }} />
                            </motion.div>
                            <div>
                              <p className="text-white text-xs font-semibold">
                                Dominant trait — {trait.label}
                              </p>
                              <p className="text-slate-500 text-xs">{trait.desc}</p>
                            </div>
                          </motion.div>
                        );
                      })()}
                    </motion.div>
                  ) : (
                    <motion.div
                      className="text-center py-16 rounded-2xl relative overflow-hidden"
                      style={{
                        background: "rgba(19,19,42,0.6)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(167,139,250,0.1)",
                      }}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <motion.div
                        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                        style={{ background: "rgba(99,102,241,0.1)" }}
                        animate={{
                          boxShadow: [
                            "0 0 16px rgba(124,58,237,0.2)",
                            "0 0 32px rgba(124,58,237,0.4)",
                            "0 0 16px rgba(124,58,237,0.2)",
                          ],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          boxShadow: { duration: 2, repeat: Infinity },
                          rotate: { duration: 6, repeat: Infinity },
                        }}
                      >
                        <Brain className="w-6 h-6 text-indigo-400" />
                      </motion.div>
                      <p className="text-white font-semibold mb-1">No personality data yet</p>
                      <p className="text-slate-500 text-sm mb-5">Take the quiz or create more memories so AI can build your profile</p>
                      <motion.button
                        onClick={() => navigate("/onboarding")}
                        className="px-5 py-2 rounded-xl text-white text-sm font-medium relative overflow-hidden inline-block"
                        style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}
                        whileHover={{ scale: 1.05, boxShadow: "0 4px 24px rgba(124,58,237,0.5)" }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <motion.div
                          className="absolute inset-0"
                          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                        />
                        <span className="relative">Take the Quiz</span>
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* ── About ── */}
              {activeTab === "about" && (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="rounded-2xl p-6 relative overflow-hidden"
                    style={{
                      background: "rgba(19,19,42,0.7)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(167,139,250,0.15)",
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <motion.span
                        className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                        animate={{ boxShadow: ["0 0 0px #a78bfa", "0 0 8px #a78bfa", "0 0 0px #a78bfa"] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      Account Info
                    </h3>
                    <div className="space-y-1">
                      {[
                        { label: "Username", value: user.username },
                        { label: "Email", value: user.email },
                        { label: "Member Since", value: getMemberSince() },
                      ].map((row, i) => (
                        <motion.div
                          key={row.label}
                          className="flex items-center justify-between py-2.5"
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <span className="text-slate-500 text-xs uppercase tracking-widest">{row.label}</span>
                          <span className="text-white text-xs font-medium">{row.value}</span>
                        </motion.div>
                      ))}
                      <motion.div
                        className="flex items-center justify-between py-2.5"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                      >
                        <span className="text-slate-500 text-xs uppercase tracking-widest">Role</span>
                        <span
                          className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                          style={{
                            background: "rgba(99,102,241,0.15)",
                            color: "#a5b4fc",
                            border: "1px solid rgba(99,102,241,0.3)",
                          }}
                        >
                          {user.role || "user"}
                        </span>
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <MobileBottomNav />

      {/* Profile picture modal */}
      <AnimatePresence>
        {showPictureModal && (profilePicturePreview || user.profilePicture) && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPictureModal(false)}
          >
            <motion.div
              className="relative max-w-lg w-full p-4"
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              <motion.button
                onClick={() => setShowPictureModal(false)}
                className="absolute -top-2 -right-2 w-9 h-9 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white z-10 shadow-lg transition-colors"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                style={{ boxShadow: "0 0 16px rgba(239,68,68,0.4)" }}
              >
                <X className="w-4 h-4" />
              </motion.button>
              <img
                src={profilePicturePreview || user.profilePicture}
                alt={user.username}
                className="w-full object-contain rounded-2xl shadow-2xl"
                style={{ boxShadow: "0 0 60px rgba(124,58,237,0.3)" }}
              />
              <p className="mt-3 text-center text-white font-semibold text-sm">{user.username}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;