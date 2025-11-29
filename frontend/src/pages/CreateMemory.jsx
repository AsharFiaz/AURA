import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { showInfo } from "../utils/toast";
import { ImagePlus, Sparkles, ArrowLeft, CheckCircle2, X } from "lucide-react";

const CreateMemory = () => {
  const [caption, setCaption] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const emotions = [
    "Supportive",
    "Stressed",
    "Calm",
    "Inspiring",
    "Curious",
    "Playful",
    "Reflective",
  ];

  const getEmotionColor = (emotion) => {
    const colors = {
      Supportive: "bg-green-500/20 text-green-300 border-green-500/50",
      Stressed: "bg-red-500/20 text-red-300 border-red-500/50",
      Calm: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      Inspiring: "bg-purple-500/20 text-purple-300 border-purple-500/50",
      Curious: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
      Playful: "bg-pink-500/20 text-pink-300 border-pink-500/50",
      Reflective: "bg-indigo-500/20 text-indigo-300 border-indigo-500/50",
    };
    return (
      colors[emotion] || "bg-slate-500/20 text-slate-300 border-slate-500/50"
    );
  };

  const getSelectedEmotionStyle = (emotion) => {
    const selectedColors = {
      Supportive: "border-green-400 shadow-green-500/50",
      Stressed: "border-red-400 shadow-red-500/50",
      Calm: "border-blue-400 shadow-blue-500/50",
      Inspiring: "border-purple-400 shadow-purple-500/50",
      Curious: "border-yellow-400 shadow-yellow-500/50",
      Playful: "border-pink-400 shadow-pink-500/50",
      Reflective: "border-indigo-400 shadow-indigo-500/50",
    };
    return selectedColors[emotion] || "border-slate-400 shadow-slate-500/50";
  };

  const toggleEmotion = (emotion) => {
    if (selectedEmotions.includes(emotion)) {
      setSelectedEmotions(selectedEmotions.filter((e) => e !== emotion));
    } else {
      if (selectedEmotions.length < 3) {
        setSelectedEmotions([...selectedEmotions, emotion]);
      }
    }
  };

  const handleAISuggest = () => {
    // Placeholder - show toast
    showInfo("AI feature coming soon! ✨");
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPG, PNG, or GIF)");
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError("");
    setImageFile(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview); // Clean up object URL
    }
    setImageFile(null);
    setImagePreview(null);
    setError("");
  };

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handlePreview = () => {
    if (!caption.trim()) {
      setError("Please enter a caption");
      return;
    }
    setShowPreview(true);
  };

  const handlePublish = async () => {
    if (!caption.trim()) {
      setError("Please enter a caption");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let imageUrl = null;

      // If image file exists, upload it first
      if (imageFile) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append("image", imageFile);

        try {
          const uploadResponse = await api.post("/memories/upload", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          if (uploadResponse.data.success) {
            imageUrl =
              uploadResponse.data.imageUrl || uploadResponse.data.secureUrl;
          } else {
            throw new Error("Failed to upload image");
          }
        } catch (uploadErr) {
          setError(
            uploadErr.response?.data?.message ||
              "Failed to upload image. Please try again."
          );
          setUploadingImage(false);
          setLoading(false);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      // Create memory with image URL
      const response = await api.post("/memories", {
        caption: caption.trim(),
        emotions: selectedEmotions,
        visibility,
        image: imageUrl,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create memory. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mb-4 flex justify-center"
          >
            <CheckCircle2 className="w-20 h-20 text-green-400" />
          </motion.div>
          <motion.h2
            className="text-3xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Memory Created!
          </motion.h2>
          <motion.p
            className="text-slate-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Redirecting to home...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Navbar */}
      <motion.nav
        className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 px-4 py-3"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <motion.button
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>

          {/* AURA Logo */}
          <motion.h1
            onClick={() => navigate("/")}
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            AURA
          </motion.h1>

          {/* Empty div for spacing */}
          <div className="w-6"></div>
        </div>
      </motion.nav>

      {/* Main Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 md:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Caption Textarea */}
          <div className="mb-6">
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => {
                setCaption(e.target.value);
                setError("");
              }}
              placeholder="Share your inspiring moment..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              rows={5}
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-400">
                {caption.length}/500 characters
              </p>
              <motion.button
                onClick={handleAISuggest}
                className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-4 h-4" />
                AI Suggest Caption
              </motion.button>
            </div>
          </div>

          {/* Emotion Selector */}
          <div className="mb-6">
            <label className="block text-slate-300 text-sm font-medium mb-3">
              How are you feeling? (Select up to 3)
            </label>
            <div className="flex flex-wrap gap-2">
              {emotions.map((emotion) => {
                const isSelected = selectedEmotions.includes(emotion);
                return (
                  <motion.button
                    key={emotion}
                    type="button"
                    onClick={() => toggleEmotion(emotion)}
                    disabled={!isSelected && selectedEmotions.length >= 3}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${
                      isSelected
                        ? `${getEmotionColor(
                            emotion
                          )} ${getSelectedEmotionStyle(
                            emotion
                          )} border-2 shadow-lg`
                        : `${getEmotionColor(
                            emotion
                          )} opacity-60 hover:opacity-100`
                    } ${
                      !isSelected && selectedEmotions.length >= 3
                        ? "cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                    whileHover={
                      !isSelected && selectedEmotions.length < 3
                        ? { scale: 1.05 }
                        : {}
                    }
                    whileTap={
                      !isSelected && selectedEmotions.length < 3
                        ? { scale: 0.95 }
                        : {}
                    }
                  >
                    {emotion}
                  </motion.button>
                );
              })}
            </div>
            {selectedEmotions.length > 0 && (
              <p className="text-xs text-slate-400 mt-2">
                Selected {selectedEmotions.length}/3
              </p>
            )}
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Image (Optional)
            </label>

            {imagePreview ? (
              <motion.div
                className="relative w-full rounded-lg overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover"
                />
                <motion.button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center text-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </motion.div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <motion.label
                  htmlFor="image-upload"
                  className="w-full h-48 bg-white/5 border border-white/10 rounded-lg flex flex-col items-center justify-center border-dashed cursor-pointer hover:bg-white/10 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ImagePlus className="w-12 h-12 text-slate-400 mb-2" />
                  <p className="text-slate-300 text-sm font-medium mb-1">
                    Click to upload image
                  </p>
                  <p className="text-slate-400 text-xs">
                    JPG, PNG, or GIF (max 5MB)
                  </p>
                </motion.label>
              </div>
            )}

            {uploadingImage && (
              <motion.div
                className="mt-3 flex items-center gap-2 text-purple-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span className="text-sm">Uploading image...</span>
              </motion.div>
            )}
          </div>

          {/* Visibility Selector */}
          <div className="mb-6">
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="public" className="bg-slate-800">
                Public
              </option>
              <option value="friends" className="bg-slate-800">
                Friends
              </option>
              <option value="private" className="bg-slate-800">
                Private
              </option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {error}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <motion.button
              onClick={handlePreview}
              className="flex-1 py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Preview
            </motion.button>
            <motion.button
              onClick={handlePublish}
              disabled={loading || uploadingImage || !caption.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:from-purple-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={
                !loading && !uploadingImage && caption.trim()
                  ? { scale: 1.02 }
                  : {}
              }
              whileTap={
                !loading && !uploadingImage && caption.trim()
                  ? { scale: 0.98 }
                  : {}
              }
            >
              {uploadingImage
                ? "Uploading Image..."
                : loading
                ? "Publishing..."
                : "Publish"}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/20"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {user?.username || "You"}
                  </p>
                  <p className="text-slate-400 text-xs">Now</p>
                </div>
              </div>

              {imagePreview && (
                <motion.div
                  className="mb-4 rounded-lg overflow-hidden"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                </motion.div>
              )}

              <p className="text-slate-200 mb-4">{caption}</p>

              {selectedEmotions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedEmotions.map((emotion, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-1 rounded-full text-xs border ${getEmotionColor(
                        emotion
                      )}`}
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    handlePublish();
                  }}
                  className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-colors"
                >
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
