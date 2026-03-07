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

            // Check if personality quiz has been completed
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.div
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="text-slate-300 text-lg">Completing authentication...</p>
        <p className="text-slate-400 text-sm mt-2">Please wait</p>
      </motion.div>
    </div>
  );
};

export default AuthCallback;