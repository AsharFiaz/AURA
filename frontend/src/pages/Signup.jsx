import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { Mail, Lock, User, ArrowRight, ArrowLeft, Camera, X } from "lucide-react";

const Signup = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [interests, setInterests] = useState([]);
  const [emotions, setEmotions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();
  const { login } = useAuth();

  // Handle OAuth callback
  const handleOAuthCallback = async (token) => {
    setOauthLoading(true);
    try {
      // Store token temporarily to fetch user data
      localStorage.setItem("token", token);

      // Fetch user data from backend
      const response = await api.get("/users/me");
      if (response.data.success && response.data.user) {
        const userData = response.data.user;
        login(token, userData);
        // Clean up URL
        setSearchParams({});
        navigate("/");
      } else {
        setError("Failed to fetch user data. Please try again.");
        localStorage.removeItem("token");
      }
    } catch (err) {
      console.error("OAuth callback error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to complete authentication. Please try again."
      );
      localStorage.removeItem("token");
      setSearchParams({});
    } finally {
      setOauthLoading(false);
    }
  };

  // Handle OAuth callback from URL params
  useEffect(() => {
    const token = searchParams.get("token");
    const success = searchParams.get("success");
    const errorParam = searchParams.get("error");

    if (token && success === "true") {
      handleOAuthCallback(token);
    } else if (success === "false" || errorParam) {
      setError(
        errorParam
          ? decodeURIComponent(errorParam)
          : "OAuth authentication failed. Please try again."
      );
      // Clean up URL
      setSearchParams({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  const toggleSelection = (item, list, setList) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else if (list.length < 3) {
      setList([...list, item]);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setProfilePicture(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfilePicturePreview(event.target.result);
    };
    reader.readAsDataURL(file);
    setError(""); // Clear any previous errors
  };

  const handleRemoveProfilePicture = () => {
    setProfilePicture(null);
    setProfilePicturePreview(null);
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/signup", {
        email,
        password,
        username,
        interests,
        emotions,
      });

      if (response.data.success && response.data.token) {
        // Save token to localStorage first so API requests can use it
        const token = response.data.token;
        localStorage.setItem("token", token);
        
        // Login to update context with user data (this also saves to localStorage)
        login(token, response.data.user);

        // Upload profile picture if selected (after token is set)
        if (profilePicture) {
          setUploadingPicture(true);
          try {
            // Ensure token is in localStorage before making authenticated request
            if (!localStorage.getItem("token")) {
              localStorage.setItem("token", token);
            }

            const formData = new FormData();
            formData.append("image", profilePicture);

            await api.post("/users/profile-picture", formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });

            // Refresh user data to get updated profile picture
            const userResponse = await api.get("/users/me");
            if (userResponse.data.success) {
              login(token, userResponse.data.user);
            }
          } catch (picError) {
            console.error("Error uploading profile picture:", picError);
            // Don't fail signup if picture upload fails - user can upload later
          } finally {
            setUploadingPicture(false);
          }
        }

        // Navigate to home (token is already saved)
        navigate("/");
      } else {
        setError(response.data?.message || "Signup failed. Please try again.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Signup failed. Please try again.";
      
      // If the error is about token, it means signup succeeded but something after failed
      if (errorMessage.includes("token") || errorMessage.includes("No token")) {
        setError("Signup successful but failed to complete setup. Please try logging in.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!email || !password || !username || !confirmPassword) {
        setError("Please fill in all fields");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }
    if (step === 2 && interests.length !== 3) {
      setError("Please select exactly 3 interests");
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const prevStep = () => {
    setError("");
    setStep(step - 1);
  };

  // Show loading overlay during OAuth processing
  if (oauthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-slate-300 text-lg">Completing authentication...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
        >
          {/* AURA Title */}
          <h1 className="text-5xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            AURA
          </h1>

          {/* Subtitle */}
          <p className="text-center text-slate-300 mb-2 text-sm">
            Create your account
          </p>

          {/* Progress Indicator */}
          <div className="flex justify-center items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step ? "w-8 bg-purple-500" : "w-2 bg-slate-600"
                }`}
              />
            ))}
            <span className="ml-2 text-slate-400 text-sm">Step {step}/3</span>
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

          {/* Multi-Step Form */}
          <AnimatePresence mode="wait">
  {step === 1 && (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Email */}
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-2">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            placeholder="your@email.com"
          />
        </div>
      </div>

      {/* Username */}
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-2">
          Username
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            placeholder="Choose a username"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            placeholder="Create a secure password"
          />
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            placeholder="Re-enter your password"
          />
        </div>
      </div>

      {/* Profile Picture (Optional) */}
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-2">
          Profile Picture <span className="text-slate-500 text-xs">(Optional)</span>
        </label>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
              {profilePicturePreview ? (
                <img
                  src={profilePicturePreview}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                username?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            {profilePicturePreview && (
              <motion.button
                onClick={handleRemoveProfilePicture}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </div>
          <label
            htmlFor="signup-profile-picture"
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:bg-white/10 transition-colors cursor-pointer text-center text-sm"
          >
            <Camera className="w-4 h-4 inline-block mr-2" />
            {profilePicturePreview ? "Change Picture" : "Upload Picture"}
          </label>
          <input
            id="signup-profile-picture"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfilePictureChange}
            disabled={uploadingPicture}
          />
        </div>
      </div>

      {/* Next Button */}
      <motion.button
        onClick={nextStep}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:from-purple-500 hover:to-blue-500 transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Next <ArrowRight className="w-5 h-5" />
      </motion.button>
    </motion.div>
  )}

  {step === 2 && (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Choose your interests
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          Select exactly 3 topics you're interested in
        </p>
        <p className="text-purple-400 text-sm mb-3">
          Selected: {interests.length}/3
        </p>

        <div className="grid grid-cols-2 gap-3">
          {interestOptions.map((interest) => (
            <motion.button
              key={interest}
              type="button"
              onClick={() =>
                toggleSelection(interest, interests, setInterests)
              }
              className={`p-3 rounded-lg border-2 transition-all ${
                interests.includes(interest)
                  ? "border-purple-500 bg-purple-500/20 text-white shadow-lg shadow-purple-500/50"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-purple-400/50"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {interest}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <motion.button
          type="button"
          onClick={prevStep}
          className="flex-1 py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </motion.button>

        <motion.button
          type="button"
          onClick={nextStep}
          className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:from-purple-500 hover:to-blue-500 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Next <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  )}

  {step === 3 && (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Tell us how you usually feel
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          Select exactly 3 emotions that describe you
        </p>
        <p className="text-purple-400 text-sm mb-3">
          Selected: {emotions.length}/3
        </p>

        <div className="grid grid-cols-2 gap-3">
          {emotionOptions.map((emotion) => (
            <motion.button
              key={emotion}
              type="button"
              onClick={() =>
                toggleSelection(emotion, emotions, setEmotions)
              }
              className={`p-3 rounded-lg border-2 transition-all ${
                emotions.includes(emotion)
                  ? "border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/50"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-blue-400/50"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {emotion}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <motion.button
          type="button"
          onClick={prevStep}
          className="flex-1 py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </motion.button>

        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={loading || emotions.length !== 3}
          className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading || uploadingPicture 
            ? uploadingPicture 
              ? "Uploading Picture..." 
              : "Creating Account..." 
            : "Create Account"}
        </motion.button>
      </div>
    </motion.div>
  )}
</AnimatePresence>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Log In
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
  
    </div>
  );
};

export default Signup;
