import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { showInfo } from "../utils/toast";
import {
  ImagePlus, Video, Sparkles, ArrowLeft, CheckCircle2, X,
  Home as HomeIcon, Compass, ShoppingBag, Mail, Bell,
  Bookmark, User, Plus, LogOut, Globe, Lock, Users,
} from "lucide-react";

// ─── Sidebar (same collapsed/expand as Home) ──────────────────────────────────
const Sidebar = ({ user, logout, navigate, location }) => {
  const navLinks = [
    { icon: HomeIcon, label: "Home", path: "/" },
    { icon: Compass, label: "Discover", path: "/discover" },
    { icon: ShoppingBag, label: "Marketplace", path: "/marketplace" },
    { icon: Mail, label: "Messages", path: "/messages" },
    { icon: Bell, label: "Notifications", path: "/notifications", badge: true },
    { icon: Bookmark, label: "Bookmarks", path: "/bookmarks" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <aside
      className="hidden lg:flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-hidden transition-all duration-300 ease-in-out group/sidebar"
      style={{ width: "72px", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      onMouseEnter={e => { e.currentTarget.style.width = "240px"; }}
      onMouseLeave={e => { e.currentTarget.style.width = "72px"; }}
    >
      {/* Logo */}
      <div className="px-4 py-6 flex items-center overflow-hidden" style={{ minHeight: "72px" }}>
        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent flex-shrink-0 w-8 text-center">A</span>
        <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-100">URA</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1 px-2">
        {navLinks.map(item => (
          <button key={item.path} onClick={() => navigate(item.path)}
            className={`flex items-center rounded-xl transition-all duration-150 group/item relative ${location.pathname === item.path ? "text-white bg-white/10" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            style={{ minHeight: "48px", padding: "0 14px" }}
          >
            <item.icon className={`w-6 h-6 flex-shrink-0 transition-colors ${location.pathname === item.path ? "text-indigo-400" : "group-hover/item:text-indigo-400"}`} />
            <span className="ml-4 text-[15px] font-medium whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75 flex-1 text-left">{item.label}</span>
            {item.badge && <span className="absolute top-3 left-8 w-2 h-2 rounded-full bg-red-500" />}
          </button>
        ))}
      </nav>

      {/* Create — active state */}
      <div className="px-2 mt-2">
        <button className="w-full flex items-center text-white font-semibold rounded-xl transition-all text-sm shadow-lg overflow-hidden ring-2 ring-indigo-400"
          style={{ minHeight: "44px", padding: "0 14px", background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
          <Plus className="w-5 h-5 flex-shrink-0" />
          <span className="ml-4 whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">Create Memory</span>
        </button>
      </div>

      {/* User */}
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

// ─── Visibility option ────────────────────────────────────────────────────────
const VISIBILITY_OPTIONS = [
  { value: "public", icon: Globe, label: "Public", desc: "Everyone can see" },
  { value: "friends", icon: Users, label: "Friends", desc: "Only followers" },
  { value: "private", icon: Lock, label: "Private", desc: "Only you" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
const CreateMemory = () => {
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [imagePreview, videoPreview]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/gif"].includes(file.type)) { setError("Please select a valid image (JPG, PNG, GIF)"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image size must be less than 5MB"); return; }
    setError("");
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file); setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["video/mp4", "video/webm", "video/ogg", "video/quicktime"].includes(file.type)) { setError("Please select a valid video (MP4, WebM, MOV)"); return; }
    if (file.size > 50 * 1024 * 1024) { setError("Video size must be less than 50MB"); return; }
    setError("");
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(file); setVideoPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleRemoveImage = () => { if (imagePreview) URL.revokeObjectURL(imagePreview); setImageFile(null); setImagePreview(null); };
  const handleRemoveVideo = () => { if (videoPreview) URL.revokeObjectURL(videoPreview); setVideoFile(null); setVideoPreview(null); };
  const handlePreview = () => { if (!caption.trim()) { setError("Please enter a caption"); return; } setShowPreview(true); };

  const uploadFile = async (file, type) => {
    const formData = new FormData();
    formData.append(type === "video" ? "video" : "image", file);
    const res = await api.post(type === "video" ? "/memories/upload-video" : "/memories/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (!res.data.success) throw new Error(`Failed to upload ${type}`);
    return res.data.mediaUrl || res.data.imageUrl || res.data.secureUrl;
  };

  const handlePublish = async () => {
    if (!caption.trim()) { setError("Please enter a caption"); return; }
    setLoading(true); setError("");
    try {
      let imageUrl = null, videoUrl = null;
      setUploadingMedia(true);
      if (imageFile) { try { imageUrl = await uploadFile(imageFile, "image"); } catch (err) { setError(err.response?.data?.message || "Failed to upload image."); setUploadingMedia(false); setLoading(false); return; } }
      if (videoFile) { try { videoUrl = await uploadFile(videoFile, "video"); } catch (err) { setError(err.response?.data?.message || "Failed to upload video."); setUploadingMedia(false); setLoading(false); return; } }
      setUploadingMedia(false);
      const response = await api.post("/memories", { caption: caption.trim(), visibility, image: imageUrl, video: videoUrl });
      if (response.data.success) { setSuccess(true); setTimeout(() => navigate("/"), 2000); }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create memory. Please try again.");
    } finally { setLoading(false); setUploadingMedia(false); }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0d1a" }}>
        <motion.div className="text-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", duration: 0.5 }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="mb-5 flex justify-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(74,222,128,0.1)", border: "2px solid rgba(74,222,128,0.3)" }}>
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
          </motion.div>
          <motion.h2 className="text-2xl font-bold text-white mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            Memory Created!
          </motion.h2>
          <motion.p className="text-slate-500 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            Redirecting to home…
          </motion.p>
        </motion.div>
      </div>
    );
  }

  const canPublish = !loading && !uploadingMedia && caption.trim();

  return (
    <div className="min-h-screen text-white" style={{ background: "#0d0d1a" }}>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center gap-3 px-4 py-3"
        style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
          Create Memory
        </span>
      </div>

      <div className="flex">
        <Sidebar user={user} logout={logout} navigate={navigate} location={location} />

        {/* ── Main content ───────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          {/* Desktop header */}
          <div className="hidden lg:flex items-center gap-3 px-6 py-4 sticky top-0 z-40"
            style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-white">Create Memory</h1>
          </div>

          <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 pb-24 lg:pb-8">
            <motion.div className="rounded-2xl p-6" style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

              {/* User row */}
              <div className="flex items-center gap-3 mb-5 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {user?.profilePicture ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" /> : (user?.username?.charAt(0).toUpperCase() || "U")}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{user?.username || "You"}</p>
                  <p className="text-slate-600 text-xs">Sharing a new memory</p>
                </div>
              </div>

              {/* Caption */}
              <div className="mb-5">
                <textarea
                  value={caption}
                  onChange={e => { setCaption(e.target.value); setError(""); }}
                  placeholder="What's on your mind? Share your inspiring moment…"
                  className="w-full text-white placeholder-slate-600 text-sm leading-relaxed focus:outline-none resize-none bg-transparent"
                  rows={4}
                  maxLength={500}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-slate-700 text-xs">{caption.length}/500</span>
                  <button onClick={() => showInfo("AI feature coming soon! ✨")}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-indigo-500/10">
                    <Sparkles className="w-3.5 h-3.5" /> AI Suggest
                  </button>
                </div>
              </div>

              {/* Media uploads */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {/* Image */}
                <div>
                  {imagePreview ? (
                    <motion.div className="relative rounded-xl overflow-hidden h-36" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button onClick={handleRemoveImage}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white transition-colors"
                        style={{ background: "rgba(0,0,0,0.7)" }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 text-xs text-white font-medium"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}>
                        Photo added
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif" onChange={handleImageSelect} className="hidden" id="image-upload" />
                      <label htmlFor="image-upload" className="flex flex-col items-center justify-center h-36 rounded-xl cursor-pointer transition-all group/img"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: "rgba(99,102,241,0.1)" }}>
                          <ImagePlus className="w-5 h-5 text-indigo-400" />
                        </div>
                        <p className="text-slate-400 text-xs font-medium">Add Photo</p>
                        <p className="text-slate-600 text-[10px] mt-0.5">JPG, PNG, GIF · 5MB</p>
                      </label>
                    </>
                  )}
                </div>

                {/* Video */}
                <div>
                  {videoPreview ? (
                    <motion.div className="relative rounded-xl overflow-hidden h-36" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                      <video src={videoPreview} className="w-full h-full object-cover" />
                      <button onClick={handleRemoveVideo}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white"
                        style={{ background: "rgba(0,0,0,0.7)" }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 text-xs text-white font-medium"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}>
                        Video added
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" onChange={handleVideoSelect} className="hidden" id="video-upload" />
                      <label htmlFor="video-upload" className="flex flex-col items-center justify-center h-36 rounded-xl cursor-pointer transition-all"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: "rgba(139,92,246,0.1)" }}>
                          <Video className="w-5 h-5 text-violet-400" />
                        </div>
                        <p className="text-slate-400 text-xs font-medium">Add Video</p>
                        <p className="text-slate-600 text-[10px] mt-0.5">MP4, WebM, MOV · 50MB</p>
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Upload progress */}
              <AnimatePresence>
                {uploadingMedia && (
                  <motion.div className="flex items-center gap-2.5 mb-4 px-4 py-3 rounded-xl text-indigo-300 text-sm"
                    style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <motion.div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full flex-shrink-0"
                      animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                    Uploading media, please wait…
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Visibility selector */}
              <div className="mb-5">
                <p className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-wide">Visibility</p>
                <div className="flex gap-2">
                  {VISIBILITY_OPTIONS.map(({ value, icon: Icon, label, desc }) => (
                    <button key={value} onClick={() => setVisibility(value)}
                      className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all text-center"
                      style={{
                        background: visibility === value ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                        border: visibility === value ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <Icon className={`w-4 h-4 ${visibility === value ? "text-indigo-400" : "text-slate-600"}`} />
                      <span className={`text-xs font-medium ${visibility === value ? "text-white" : "text-slate-500"}`}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div className="mb-4 flex items-center gap-2.5 px-4 py-3 rounded-xl text-red-300 text-sm"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <X className="w-4 h-4 flex-shrink-0" />{error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <button onClick={handlePreview}
                  className="flex-1 py-2.5 rounded-xl text-slate-300 hover:text-white text-sm font-medium transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Preview
                </button>
                <motion.button onClick={handlePublish} disabled={!canPublish}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: canPublish ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "rgba(99,102,241,0.3)" }}
                  whileHover={canPublish ? { scale: 1.02 } : {}} whileTap={canPublish ? { scale: 0.98 } : {}}>
                  {uploadingMedia ? "Uploading…" : loading ? "Publishing…" : "Publish"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.85)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPreview(false)}>
            <motion.div className="max-w-md w-full rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
              style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.08)" }}
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-semibold text-sm">Preview</p>
                <button onClick={() => setShowPreview(false)} className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Post preview */}
              <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm">
                    {user?.profilePicture ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" /> : (user?.username?.charAt(0).toUpperCase() || "U")}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{user?.username || "You"}</p>
                    <p className="text-slate-600 text-xs">Now · {visibility}</p>
                  </div>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed mb-3">{caption}</p>
                {imagePreview && (
                  <div className="rounded-xl overflow-hidden mb-2">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover" />
                  </div>
                )}
                {videoPreview && (
                  <div className="rounded-xl overflow-hidden">
                    <video src={videoPreview} controls className="w-full max-h-48 rounded-xl" />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowPreview(false)}
                  className="flex-1 py-2.5 rounded-xl text-slate-300 text-sm font-medium transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Edit
                </button>
                <button onClick={() => { setShowPreview(false); handlePublish(); }}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
                  style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                  Publish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateMemory;