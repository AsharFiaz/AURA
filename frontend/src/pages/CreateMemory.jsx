import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { showInfo } from "../utils/toast";
import AnimatedBackdrop from "../components/common/AnimatedBackdrop";
import BombasticSidebar from "../components/common/BombasticSidebar";
import CommandBar from "../components/common/CommandBar";
import MobileTopBar from "../components/common/MobileTopBar";
import MobileBottomNav from "../components/common/MobileBottomNav";
import {
  ImagePlus, Video, Sparkles, ArrowLeft, CheckCircle2, X,
  Globe, Lock, Users, Plus,
} from "lucide-react";

const VISIBILITY_OPTIONS = [
  { value: "public", icon: Globe, label: "Public", desc: "Everyone can see" },
  { value: "friends", icon: Users, label: "Followers Only", desc: "Only followers" },
  { value: "private", icon: Lock, label: "Private", desc: "Only you" },
];

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

  const { user } = useAuth();
  const navigate = useNavigate();

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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackdrop />
        <motion.div className="text-center relative" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", duration: 0.5 }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="mb-5 flex justify-center">
            <motion.div
              className="w-24 h-24 rounded-full flex items-center justify-center relative"
              style={{ background: "rgba(74,222,128,0.1)", border: "2px solid rgba(74,222,128,0.3)" }}
              animate={{
                boxShadow: [
                  "0 0 32px rgba(74,222,128,0.3)",
                  "0 0 64px rgba(74,222,128,0.6)",
                  "0 0 32px rgba(74,222,128,0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <CheckCircle2 className="w-12 h-12 text-green-400" />
              {/* Burst sparkles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: `rotate(${i * 45}deg) translateY(-60px)`,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                  transition={{ duration: 1.5, delay: 0.3 + i * 0.1, repeat: Infinity, repeatDelay: 1 }}
                >
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          <motion.h2 className="text-3xl font-bold bg-gradient-to-r from-white via-green-200 to-green-400 bg-clip-text text-transparent mb-2"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            Memory Created!
          </motion.h2>
          <motion.p className="text-slate-400 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            Redirecting to home…
          </motion.p>
        </motion.div>
      </div>
    );
  }

  const canPublish = !loading && !uploadingMedia && caption.trim();

  return (
    <div className="min-h-screen text-white relative">
      <AnimatedBackdrop />

      <CommandBar isLive={true} />
      <MobileTopBar title="Create Memory" icon={Plus} />

      <div className="flex relative">
        <BombasticSidebar />

        <main className="flex-1 min-w-0">
          {/* Desktop header */}
          <motion.div
            className="hidden lg:flex items-center gap-3 px-6 py-4 sticky top-[42px] z-40"
            style={{
              background: "rgba(10,10,20,0.85)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(167,139,250,0.1)",
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.button onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <h1 className="text-base font-bold bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-transparent flex items-center gap-2">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </motion.div>
              Create Memory
            </h1>
          </motion.div>

          <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 pb-24 lg:pb-8">
            <motion.div
              className="rounded-3xl p-6 relative overflow-hidden"
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
                className="absolute inset-0 opacity-0 pointer-events-none"
                style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.08), transparent)" }}
                animate={{ x: ["-100%", "100%"], opacity: [0, 0.5, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
              />

              <div className="flex items-center gap-3 mb-5 pb-5 relative" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <motion.div
                  className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold flex-shrink-0"
                  whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(167,139,250,0.5)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {user?.profilePicture ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" /> : (user?.username?.charAt(0).toUpperCase() || "U")}
                </motion.div>
                <div>
                  <p className="text-white text-sm font-semibold">{user?.username || "You"}</p>
                  <p className="text-slate-500 text-xs">Sharing a new memory</p>
                </div>
              </div>

              <div className="mb-5 relative">
                <textarea
                  value={caption}
                  onChange={e => { setCaption(e.target.value); setError(""); }}
                  placeholder="What's resonating with you today? Share your moment…"
                  className="w-full text-white placeholder-slate-600 text-sm leading-relaxed focus:outline-none resize-none bg-transparent"
                  rows={4}
                  maxLength={500}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-slate-700 text-xs">{caption.length}/500</span>
                  <motion.button
                    onClick={() => showInfo("AI feature coming soon! ✨")}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-lg"
                    style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}
                    whileHover={{ scale: 1.05, borderColor: "rgba(99,102,241,0.4)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}>
                      <Sparkles className="w-3.5 h-3.5" />
                    </motion.div>
                    AI Suggest
                  </motion.button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5 relative">
                <div>
                  {imagePreview ? (
                    <motion.div className="relative rounded-xl overflow-hidden h-36"
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <motion.button onClick={handleRemoveImage}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white"
                        style={{ background: "rgba(0,0,0,0.7)" }}
                        whileHover={{ scale: 1.1, background: "rgba(239,68,68,0.8)" }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </motion.button>
                      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 text-xs text-white font-medium"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}>
                        Photo added
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif" onChange={handleImageSelect} className="hidden" id="image-upload" />
                      <motion.label htmlFor="image-upload"
                        className="flex flex-col items-center justify-center h-36 rounded-xl cursor-pointer transition-all"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(99,102,241,0.3)" }}
                        whileHover={{
                          background: "rgba(99,102,241,0.08)",
                          borderColor: "rgba(99,102,241,0.6)",
                          scale: 1.02,
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                          style={{ background: "rgba(99,102,241,0.15)" }}
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <ImagePlus className="w-5 h-5 text-indigo-400" />
                        </motion.div>
                        <p className="text-slate-400 text-xs font-medium">Add Photo</p>
                        <p className="text-slate-600 text-[10px] mt-0.5">JPG, PNG, GIF · 5MB</p>
                      </motion.label>
                    </>
                  )}
                </div>

                <div>
                  {videoPreview ? (
                    <motion.div className="relative rounded-xl overflow-hidden h-36"
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                      <video src={videoPreview} className="w-full h-full object-cover" />
                      <motion.button onClick={handleRemoveVideo}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white"
                        style={{ background: "rgba(0,0,0,0.7)" }}
                        whileHover={{ scale: 1.1, background: "rgba(239,68,68,0.8)" }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </motion.button>
                      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 text-xs text-white font-medium"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}>
                        Video added
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" onChange={handleVideoSelect} className="hidden" id="video-upload" />
                      <motion.label htmlFor="video-upload"
                        className="flex flex-col items-center justify-center h-36 rounded-xl cursor-pointer transition-all"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(139,92,246,0.3)" }}
                        whileHover={{
                          background: "rgba(139,92,246,0.08)",
                          borderColor: "rgba(139,92,246,0.6)",
                          scale: 1.02,
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                          style={{ background: "rgba(139,92,246,0.15)" }}
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        >
                          <Video className="w-5 h-5 text-violet-400" />
                        </motion.div>
                        <p className="text-slate-400 text-xs font-medium">Add Video</p>
                        <p className="text-slate-600 text-[10px] mt-0.5">MP4, WebM, MOV · 50MB</p>
                      </motion.label>
                    </>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {uploadingMedia && (
                  <motion.div className="flex items-center gap-2.5 mb-4 px-4 py-3 rounded-xl text-indigo-300 text-sm relative"
                    style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <motion.div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full flex-shrink-0"
                      animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                    Uploading media, please wait…
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mb-5 relative">
                <p className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-widest">Visibility</p>
                <div className="flex gap-2">
                  {VISIBILITY_OPTIONS.map(({ value, icon: Icon, label }) => (
                    <motion.button
                      key={value}
                      onClick={() => setVisibility(value)}
                      className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all text-center relative overflow-hidden"
                      style={{
                        background: visibility === value ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                        border: visibility === value ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.06)",
                        boxShadow: visibility === value ? "0 0 16px rgba(124,58,237,0.2)" : "none",
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className={`w-4 h-4 ${visibility === value ? "text-indigo-400" : "text-slate-600"}`} />
                      <span className={`text-xs font-medium ${visibility === value ? "text-white" : "text-slate-500"}`}>{label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div className="mb-4 flex items-center gap-2.5 px-4 py-3 rounded-xl text-red-300 text-sm relative"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <X className="w-4 h-4 flex-shrink-0" />{error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 pt-2 relative" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <motion.button onClick={handlePreview}
                  className="flex-1 py-2.5 rounded-xl text-slate-300 hover:text-white text-sm font-medium transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  whileHover={{ scale: 1.02, borderColor: "rgba(167,139,250,0.3)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  Preview
                </motion.button>
                <motion.button onClick={handlePublish} disabled={!canPublish}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden"
                  style={{
                    background: canPublish ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "rgba(99,102,241,0.3)",
                    boxShadow: canPublish ? "0 4px 20px rgba(124,58,237,0.4)" : "none",
                  }}
                  whileHover={canPublish ? { scale: 1.02, boxShadow: "0 4px 32px rgba(124,58,237,0.6)" } : {}}
                  whileTap={canPublish ? { scale: 0.98 } : {}}
                >
                  {canPublish && (
                    <motion.div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                    />
                  )}
                  <span className="relative">{uploadingMedia ? "Uploading…" : loading ? "Publishing…" : "Publish"}</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      <MobileBottomNav />

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPreview(false)}>
            <motion.div className="max-w-md w-full rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
              style={{
                background: "linear-gradient(135deg, rgba(22,22,40,0.95), rgba(13,13,26,0.95))",
                border: "1px solid rgba(167,139,250,0.2)",
                boxShadow: "0 0 60px rgba(124,58,237,0.3)",
              }}
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-semibold text-sm">Preview</p>
                <button onClick={() => setShowPreview(false)} className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

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
                <motion.button onClick={() => setShowPreview(false)}
                  className="flex-1 py-2.5 rounded-xl text-slate-300 text-sm font-medium transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  Edit
                </motion.button>
                <motion.button onClick={() => { setShowPreview(false); handlePublish(); }}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
                  style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 16px rgba(124,58,237,0.4)" }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  Publish
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateMemory;