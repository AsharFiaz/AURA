import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { motion } from "framer-motion";

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
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0d1a" }}>
      <motion.div
        className="flex flex-col items-center gap-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Spinner */}
        <div className="relative w-16 h-16">
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-t-transparent border-indigo-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          {/* Inner glow ring */}
          <div className="absolute inset-2 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15), transparent)" }} />
        </div>

        {/* AURA wordmark */}
        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
          AURA
        </span>

        {/* Status text */}
        <div className="text-center space-y-1">
          <p className="text-white text-sm font-medium">Completing authentication…</p>
          <p className="text-slate-600 text-xs">Please wait</p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthCallback;