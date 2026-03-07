import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { showInfo } from "../utils/toast";
import { ImagePlus, Video, Sparkles, ArrowLeft, CheckCircle2, X } from "lucide-react";

const CreateMemory = () => {
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [success, setSuccess] = useState(false);

  // Separate state for image and video
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [imagePreview, videoPreview]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image (JPG, PNG, GIF)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }
    setError("");
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid video (MP4, WebM, MOV)");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("Video size must be less than 50MB");
      return;
    }
    setError("");
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleRemoveVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handlePreview = () => {
    if (!caption.trim()) { setError("Please enter a caption"); return; }
    setShowPreview(true);
  };

  const uploadFile = async (file, type) => {
    const formData = new FormData();
    formData.append(type === "video" ? "video" : "image", file);
    const endpoint = type === "video" ? "/memories/upload-video" : "/memories/upload";
    const res = await api.post(endpoint, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (!res.data.success) throw new Error(`Failed to upload ${type}`);
    return res.data.mediaUrl || res.data.imageUrl || res.data.secureUrl;
  };

  const handlePublish = async () => {
    if (!caption.trim()) { setError("Please enter a caption"); return; }
    setLoading(true);
    setError("");

    try {
      let imageUrl = null;
      let videoUrl = null;

      setUploadingMedia(true);

      // Upload image if selected
      if (imageFile) {
        try {
          imageUrl = await uploadFile(imageFile, "image");
        } catch (err) {
          setError(err.response?.data?.message || "Failed to upload image.");
          setUploadingMedia(false);
          setLoading(false);
          return;
        }
      }

      // Upload video if selected
      if (videoFile) {
        try {
          videoUrl = await uploadFile(videoFile, "video");
        } catch (err) {
          setError(err.response?.data?.message || "Failed to upload video.");
          setUploadingMedia(false);
          setLoading(false);
          return;
        }
      }

      setUploadingMedia(false);

      const response = await api.post("/memories", {
        caption: caption.trim(),
        visibility,
        image: imageUrl,
        video: videoUrl,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => navigate("/"), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create memory. Please try again.");
    } finally {
      setLoading(false);
      setUploadingMedia(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div className="text-center" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.5 }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="mb-4 flex justify-center">
            <CheckCircle2 className="w-20 h-20 text-green-400" />
          </motion.div>
          <motion.h2 className="text-3xl font-bold text-white mb-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            Memory Created!
          </motion.h2>
          <motion.p className="text-slate-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            Redirecting to home...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navbar */}
      <motion.nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 px-4 py-3" initial={{ y: -100 }} animate={{ y: 0 }}>
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <motion.button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
          <motion.h1 onClick={() => navigate("/")} className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            AURA
          </motion.h1>
          <div className="w-6" />
        </div>
      </motion.nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 md:p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Caption */}
          <div className="mb-6">
            <label className="block text-slate-300 text-sm font-medium mb-2">Caption <span className="text-red-400">*</span></label>
            <textarea
              value={caption}
              onChange={(e) => { setCaption(e.target.value); setError(""); }}
              placeholder="Share your inspiring moment..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-400">{caption.length}/500</p>
              <motion.button onClick={() => showInfo("AI feature coming soon! ✨")} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Sparkles className="w-4 h-4" /> AI Suggest
              </motion.button>
            </div>
          </div>

          {/* Image Upload */}
          <div className="mb-4">
            <label className="block text-slate-300 text-sm font-medium mb-2 flex items-center gap-2">
              <ImagePlus className="w-4 h-4 text-purple-400" /> Photo <span className="text-slate-500 text-xs">(Optional)</span>
            </label>
            {imagePreview ? (
              <motion.div className="relative rounded-lg overflow-hidden" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover rounded-lg" />
                <motion.button onClick={handleRemoveImage} className="absolute top-2 right-2 w-8 h-8 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center text-white" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <X className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ) : (
              <>
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif" onChange={handleImageSelect} className="hidden" id="image-upload" />
                <motion.label htmlFor="image-upload" className="w-full h-32 bg-white/5 border border-white/10 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <ImagePlus className="w-8 h-8 text-slate-400 mb-1" />
                  <p className="text-slate-300 text-sm">Click to upload photo</p>
                  <p className="text-slate-500 text-xs">JPG, PNG, GIF — max 5MB</p>
                </motion.label>
              </>
            )}
          </div>

          {/* Video Upload */}
          <div className="mb-6">
            <label className="block text-slate-300 text-sm font-medium mb-2 flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-400" /> Video <span className="text-slate-500 text-xs">(Optional)</span>
            </label>
            {videoPreview ? (
              <motion.div className="relative rounded-lg overflow-hidden" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <video src={videoPreview} controls className="w-full max-h-64 rounded-lg" />
                <motion.button onClick={handleRemoveVideo} className="absolute top-2 right-2 w-8 h-8 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center text-white" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <X className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ) : (
              <>
                <input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" onChange={handleVideoSelect} className="hidden" id="video-upload" />
                <motion.label htmlFor="video-upload" className="w-full h-32 bg-white/5 border border-white/10 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Video className="w-8 h-8 text-slate-400 mb-1" />
                  <p className="text-slate-300 text-sm">Click to upload video</p>
                  <p className="text-slate-500 text-xs">MP4, WebM, MOV — max 50MB</p>
                </motion.label>
              </>
            )}
          </div>

          {/* Upload progress indicator */}
          {uploadingMedia && (
            <motion.div className="mb-4 flex items-center gap-2 text-purple-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
              <span className="text-sm">Uploading media, please wait...</span>
            </motion.div>
          )}

          {/* Visibility */}
          <div className="mb-6">
            <label className="block text-slate-300 text-sm font-medium mb-2">Visibility</label>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all">
              <option value="public" className="bg-slate-800">Public</option>
              <option value="friends" className="bg-slate-800">Friends</option>
              <option value="private" className="bg-slate-800">Private</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <motion.div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              {error}
            </motion.div>
          )}

          {/* Buttons */}
          <div className="flex gap-4">
            <motion.button onClick={handlePreview} className="flex-1 py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-lg hover:bg-white/10 transition-all" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              Preview
            </motion.button>
            <motion.button onClick={handlePublish} disabled={loading || uploadingMedia || !caption.trim()} className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed" whileHover={!loading && !uploadingMedia && caption.trim() ? { scale: 1.02 } : {}} whileTap={!loading && !uploadingMedia && caption.trim() ? { scale: 0.98 } : {}}>
              {uploadingMedia ? "Uploading..." : loading ? "Publishing..." : "Publish"}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPreview(false)}>
            <motion.div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/20 max-h-[90vh] overflow-y-auto" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                  {user?.profilePicture ? <img src={user.profilePicture} alt={user.username} className="w-full h-full object-cover rounded-full" /> : user?.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-white font-medium">{user?.username || "You"}</p>
                  <p className="text-slate-400 text-xs">Now · {visibility}</p>
                </div>
              </div>

              <p className="text-slate-200 mb-4">{caption}</p>

              {imagePreview && (
                <div className="mb-3 rounded-lg overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover" />
                </div>
              )}
              {videoPreview && (
                <div className="mb-3 rounded-lg overflow-hidden">
                  <video src={videoPreview} controls className="w-full max-h-48 rounded-lg" />
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowPreview(false)} className="flex-1 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors">
                  Close
                </button>
                <button onClick={() => { setShowPreview(false); handlePublish(); }} className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-colors">
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