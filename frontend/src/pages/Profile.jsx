import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { showError, showSuccess } from "../utils/toast";
import { MemoryCardSkeleton } from "../components/common/LoadingSkeleton";
import {
  Edit2,
  LogOut,
  Mail,
  User as UserIcon,
  Heart,
  Grid,
  ArrowLeft,
  Sparkles,
  Trash2,
  Camera,
  X,
} from "lucide-react";

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

  // Edit form state
  const [editUsername, setEditUsername] = useState(user?.username || "");
  const [editInterests, setEditInterests] = useState(user?.interests || []);
  const [editEmotions, setEditEmotions] = useState(user?.emotions || []);

  const interestOptions = [
    "Self-care",
    "Study Tips",
    "Mental Health",
    "Motivation",
    "Parenting",
    "Career",
    "Fitness",
    "Art & Creativity",
  ];

  const emotionOptions = [
    "Supportive",
    "Stressed",
    "Calm",
    "Inspiring",
    "Curious",
    "Playful",
    "Reflective",
  ];
  useEffect(() => {
    if (user) {
      setEditUsername(user.username || "");
      setEditInterests(user.interests || []);
      setEditEmotions(user.emotions || []);
      fetchUserMemories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Changed dependency to user.id instead of user

  useEffect(() => {
    if (user) {
      setEditUsername(user.username || "");
      setEditInterests(user.interests || []);
      setEditEmotions(user.emotions || []);
      fetchUserMemories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchUserMemories = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await api.get(`/memories/user/${user.id}`);
      if (response.data.success) {
        setMemories(response.data.memories);
      }
    } catch (error) {
      console.error("Error fetching user memories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleInterest = (interest) => {
    if (editInterests.includes(interest)) {
      setEditInterests(editInterests.filter((i) => i !== interest));
    } else {
      if (editInterests.length < 3) {
        setEditInterests([...editInterests, interest]);
      }
    }
  };

  const toggleEmotion = (emotion) => {
    if (editEmotions.includes(emotion)) {
      setEditEmotions(editEmotions.filter((e) => e !== emotion));
    } else {
      if (editEmotions.length < 3) {
        setEditEmotions([...editEmotions, emotion]);
      }
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Call real backend API to update profile
      const response = await api.put("/users/profile", {
        username: editUsername,
        interests: editInterests,
        emotions: editEmotions,
      });

      if (response.data.success) {
        // Update context with new user data
        if (token) {
          login(token, response.data.user);
        }
        setEditMode(false);
        showSuccess("Profile updated successfully! ✨");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      showError(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditUsername(user?.username || "");
    setEditInterests(user?.interests || []);
    setEditEmotions(user?.emotions || []);
    setEditMode(false);
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError("Image size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showError("Please select an image file");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfilePicturePreview(event.target.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post("/users/profile-picture", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        showSuccess("Profile picture updated successfully! ✨");
        // Refresh user data
        await refreshUser();
        setProfilePicturePreview(null);
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      showError(
        error.response?.data?.message || "Failed to upload profile picture"
      );
      setProfilePicturePreview(null);
    } finally {
      setUploadingPicture(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!window.confirm("Are you sure you want to remove your profile picture?")) {
      return;
    }

    setUploadingPicture(true);
    try {
      const response = await api.put("/users/profile", {
        profilePicture: null,
      });

      if (response.data.success) {
        showSuccess("Profile picture removed successfully");
        await refreshUser();
        setProfilePicturePreview(null);
      }
    } catch (error) {
      console.error("Error removing profile picture:", error);
      showError(
        error.response?.data?.message || "Failed to remove profile picture"
      );
    } finally {
      setUploadingPicture(false);
    }
  };
  const handleDeleteMemory = async (memoryId) => {
    try {
      const response = await api.delete(`/memories/${memoryId}`);
      if (response.data.success) {
        // Remove from local state
        setMemories((prev) => prev.filter((m) => m._id !== memoryId));
        showSuccess("Memory deleted successfully 🗑️");
      } else {
        showError("Failed to delete memory. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting memory:", error);
      showError(error.response?.data?.message || "Failed to delete memory");
    }
  };

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

  const getMemberSince = () => {
    if (!user?.createdAt) return "Recently";
    const date = new Date(user.createdAt);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const totalLikes = memories.reduce(
    (sum, memory) => sum + (memory.likesCount || 0),
    0
  );

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
      {/* Top Navbar */}
      <motion.nav
        className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 px-4 py-3"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <motion.button
            onClick={() => navigate("/")}
            className="text-slate-400 hover:text-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>

          {/* AURA Logo - Added Here */}
          <motion.h1
            onClick={() => navigate("/")}
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            AURA
          </motion.h1>

          <motion.button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </motion.button>
        </div>
      </motion.nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div
          className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 md:p-8 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              <motion.div
                className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {profilePicturePreview || user.profilePicture ? (
                  <>
                    <img
                      src={profilePicturePreview || user.profilePicture}
                      alt={user.username}
                      className="w-full h-full object-cover cursor-pointer relative z-0"
                      onClick={() => setShowPictureModal(true)}
                    />
                    {/* Upload Overlay - Shows camera icon on hover, doesn't block image clicks */}
                    <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 flex items-center justify-center">
                      <label
                        htmlFor="profile-picture-upload"
                        className="cursor-pointer pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Camera className="w-6 h-6 text-white" />
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    {user.username?.charAt(0).toUpperCase() || "U"}
                    {/* Upload Overlay for when no picture */}
                    <label
                      htmlFor="profile-picture-upload"
                      className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center z-10"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </label>
                  </>
                )}
              </motion.div>
              <input
                id="profile-picture-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePictureUpload}
                disabled={uploadingPicture}
              />
              {/* Remove Picture Button */}
              {user.profilePicture && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveProfilePicture();
                  }}
                  disabled={uploadingPicture}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg z-10"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
              {uploadingPicture && (
                <div className="absolute inset-0 rounded-full bg-black/80 flex items-center justify-center z-20">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">
                {user.username}
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-2 text-slate-400 mb-2">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Member since {getMemberSince()}
              </p>
              <motion.button
                onClick={() => setEditMode(!editMode)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Edit2 className="w-4 h-4" />
                {editMode ? "Cancel Edit" : "Edit Profile"}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Memories</p>
            <p className="text-2xl font-bold text-white">{memories.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Likes</p>
            <p className="text-2xl font-bold text-white">{totalLikes}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Followers</p>
            <p className="text-2xl font-bold text-white">
              {user.followers?.length || 0}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Following</p>
            <p className="text-2xl font-bold text-white">
              {user.following?.length || 0}
            </p>
          </div>
        </motion.div>

        {/* Edit Mode */}
        <AnimatePresence>
          {editMode && (
            <motion.div
              className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-bold text-white mb-4">
                Edit Profile
              </h2>

              {/* Username */}
              <div className="mb-4">
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Email (disabled) */}
              <div className="mb-4">
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Interests */}
              <div className="mb-4">
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Interests (Select up to 3)
                </label>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map((interest) => {
                    const isSelected = editInterests.includes(interest);
                    return (
                      <motion.button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        disabled={!isSelected && editInterests.length >= 3}
                        className={`px-4 py-2 rounded-full text-sm border transition-all ${
                          isSelected
                            ? "bg-purple-500/20 text-purple-300 border-purple-500 shadow-lg"
                            : "bg-white/5 text-slate-400 border-white/10"
                        } ${
                          !isSelected && editInterests.length >= 3
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-white/10"
                        }`}
                        whileHover={
                          !isSelected && editInterests.length < 3
                            ? { scale: 1.05 }
                            : {}
                        }
                        whileTap={
                          !isSelected && editInterests.length < 3
                            ? { scale: 0.95 }
                            : {}
                        }
                      >
                        {interest}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Emotions */}
              <div className="mb-6">
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Emotions (Select up to 3)
                </label>
                <div className="flex flex-wrap gap-2">
                  {emotionOptions.map((emotion) => {
                    const isSelected = editEmotions.includes(emotion);
                    return (
                      <motion.button
                        key={emotion}
                        type="button"
                        onClick={() => toggleEmotion(emotion)}
                        disabled={!isSelected && editEmotions.length >= 3}
                        className={`px-4 py-2 rounded-full text-sm border transition-all ${getEmotionColor(
                          emotion
                        )} ${isSelected ? "border-2 shadow-lg" : ""} ${
                          !isSelected && editEmotions.length >= 3
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        whileHover={
                          !isSelected && editEmotions.length < 3
                            ? { scale: 1.05 }
                            : {}
                        }
                        whileTap={
                          !isSelected && editEmotions.length < 3
                            ? { scale: 0.95 }
                            : {}
                        }
                      >
                        {emotion}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <motion.button
                  onClick={handleCancel}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-lg font-semibold hover:bg-white/10 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={!saving ? { scale: 1.02 } : {}}
                  whileTap={!saving ? { scale: 0.98 } : {}}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          <motion.button
            onClick={() => setActiveTab("memories")}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === "memories"
                ? "text-purple-400"
                : "text-slate-400 hover:text-white"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5" />
              My Memories
            </div>
            {activeTab === "memories" && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400"
                layoutId="activeTab"
              />
            )}
          </motion.button>
          <motion.button
            onClick={() => setActiveTab("about")}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === "about"
                ? "text-purple-400"
                : "text-slate-400 hover:text-white"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              About
            </div>
            {activeTab === "about" && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400"
                layoutId="activeTab"
              />
            )}
          </motion.button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "memories" && (
            <motion.div
              key="memories"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, index) => (
                    <MemoryCardSkeleton key={index} />
                  ))}
                </div>
              ) : memories.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">No memories yet</p>
                  <motion.button
                    onClick={() => navigate("/create")}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-500 hover:to-blue-500 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Create Your First Memory
                  </motion.button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {memories.map((memory, index) => (
                    <motion.div
                      key={memory._id}
                      className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <p className="text-white font-medium mb-2 line-clamp-2">
                        {memory.caption}
                      </p>
                      {memory.emotions && memory.emotions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {memory.emotions.slice(0, 2).map((emotion, idx) => (
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Heart className="w-4 h-4" />
                          <span>{memory.likesCount || 0}</span>
                        </div>
                        <motion.button
                          onClick={() => handleDeleteMemory(memory._id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-2"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "about" && (
            <motion.div
              key="about"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Interests</h3>
              {user.interests && user.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-6">
                  {user.interests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-purple-500/20 text-purple-300 border border-purple-500/50 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 mb-6">No interests added yet</p>
              )}

              <h3 className="text-xl font-bold text-white mb-4">Emotions</h3>
              {user.emotions && user.emotions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.emotions.map((emotion, idx) => (
                    <span
                      key={idx}
                      className={`px-4 py-2 rounded-full text-sm border ${getEmotionColor(
                        emotion
                      )}`}
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400">No emotions selected yet</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile Picture Modal */}
      <AnimatePresence>
        {showPictureModal && (profilePicturePreview || user.profilePicture) && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPictureModal(false)}
          >
            <motion.div
              className="relative max-w-4xl max-h-[90vh] p-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                onClick={() => setShowPictureModal(false)}
                className="absolute -top-2 -right-2 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors z-10 shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
              <img
                src={profilePicturePreview || user.profilePicture}
                alt={user.username}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
              <div className="mt-4 text-center">
                <p className="text-white text-lg font-semibold">{user.username}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
