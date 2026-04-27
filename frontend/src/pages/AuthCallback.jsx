import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { motion } from "framer-motion";
import AnimatedBackdrop from "../components/common/AnimatedBackdrop";

const AuthCallback = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const success = searchParams.get("success");
    const errorParam = searchParams.get("error");

    const handleCallback = async () => {
      if (token && success === "true") {
        try {
          localStorage.setItem("token", token);
          const response = await api.get("/users/me");
          if (response.data.success && response.data.user) {
            const userData = response.data.user;
            login(token, userData);
            setSearchParams({});
            const p = userData.personality;
            const needsQuiz = !p || Object.values(p).every((v) => v === null);
            navigate(needsQuiz ? "/onboarding" : "/");
          } else {
            localStorage.removeItem("token");
            navigate("/login?error=Failed to fetch user data");
          }
        } catch (err) {
          console.error("OAuth callback error:", err);
          localStorage.removeItem("token");
          const msg = err.response?.data?.message || "Failed to complete authentication. Please try again.";
          navigate(`/login?error=${encodeURIComponent(msg)}`);
        }
      } else if (success === "false" || errorParam) {
        const msg = errorParam
          ? decodeURIComponent(errorParam)
          : "OAuth authentication failed. Please try again.";
        navigate(`/login?error=${encodeURIComponent(msg)}`);
      } else {
        navigate("/login");
      }
    };

    handleCallback();
  }, [searchParams, setSearchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <AnimatedBackdrop />

      <motion.div
        className="flex flex-col items-center gap-5 relative"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Multi-layer spinner */}
        <div className="relative w-20 h-20">
          {/* Outer pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.3), transparent 70%)" }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
          {/* Spinner */}
          <motion.div
            className="absolute inset-2 rounded-full border-4 border-t-transparent"
            style={{ borderColor: "rgba(167,139,250,0.6) transparent rgba(167,139,250,0.6) rgba(167,139,250,0.6)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          {/* Counter-rotating inner ring */}
          <motion.div
            className="absolute inset-4 rounded-full border-2 border-b-transparent"
            style={{ borderColor: "rgba(236,72,153,0.5) rgba(236,72,153,0.5) transparent rgba(236,72,153,0.5)" }}
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          {/* Inner glow */}
          <div className="absolute inset-6 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(167,139,250,0.4), transparent)" }} />
        </div>

        {/* AURA wordmark */}
        <motion.span
          className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 4, repeat: Infinity }}
          style={{ backgroundSize: "200% 200%" }}
        >
          AURA
        </motion.span>

        {/* Status text */}
        <div className="text-center space-y-1">
          <motion.p
            className="text-white text-sm font-medium"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          >
            Completing authentication…
          </motion.p>
          <p className="text-slate-600 text-xs uppercase tracking-widest">Please wait</p>
        </div>

        {/* Animated dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
              animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthCallback;