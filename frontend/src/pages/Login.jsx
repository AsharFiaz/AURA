import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { Mail, Lock, ShieldCheck, ArrowLeft } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleOAuthCallback = async (token) => {
    setOauthLoading(true);
    try {
      localStorage.setItem("token", token);
      const response = await api.get("/users/me");
      if (response.data.success && response.data.user) {
        login(token, response.data.user);
        setSearchParams({});
        navigate("/");
      } else {
        setError("Failed to fetch user data. Please try again.");
        localStorage.removeItem("token");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete authentication. Please try again.");
      localStorage.removeItem("token");
      setSearchParams({});
    } finally {
      setOauthLoading(false);
    }
  };

  useEffect(() => {
    const token = searchParams.get("token");
    const success = searchParams.get("success");
    const errorParam = searchParams.get("error");
    if (token && success === "true") {
      handleOAuthCallback(token);
    } else if (success === "false" || errorParam) {
      setError(errorParam ? decodeURIComponent(errorParam) : "OAuth authentication failed. Please try again.");
      setSearchParams({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const endpoint = isAdminMode ? "/auth/admin-login" : "/auth/login";
      const response = await api.post(endpoint, { email, password });
      if (response.data.success) {
        const userData = {
          ...response.data.user,
          role: response.data.user.role === "admin" || response.data.user.isAdmin ? "admin" : "user",
        };
        login(response.data.token, userData);
        if (userData.role === "admin" || userData.isAdmin) navigate("/admin/dashboard");
        else navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // OAuth loading screen
  if (oauthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0d1a" }}>
        <motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="relative w-14 h-14">
            <motion.div className="absolute inset-0 rounded-full border-4 border-t-transparent border-indigo-500"
              animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
          </div>
          <p className="text-slate-400 text-sm">Completing authentication…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#0d0d1a" }}>

      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ background: "#0a0a1a", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)" }} />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)" }} />

        {/* Logo */}
        <span className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
          AURA
        </span>

        {/* Center quote */}
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Your memories,<br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">beautifully preserved.</span>
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Share your moments, connect with people who resonate with your story, and let AI surface what matters most.
          </p>
        </div>

        {/* Bottom badges */}
        <div className="flex items-center gap-3">
          {["OCEAN AI", "Vector Search", "NFT Memories"].map(b => (
            <span key={b} className="text-xs px-3 py-1.5 rounded-full text-indigo-300"
              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div className="w-full max-w-sm"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <span className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">AURA</span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <AnimatePresence mode="wait">
              {isAdminMode ? (
                <motion.div key="admin" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <div className="flex items-center gap-2.5 mb-1">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    <h1 className="text-xl font-bold text-white">Admin Login</h1>
                  </div>
                  <p className="text-slate-600 text-sm">Manage the AURA platform</p>
                </motion.div>
              ) : (
                <motion.div key="user" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
                  <p className="text-slate-600 text-sm">Log in to continue your journey</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl text-red-300 text-sm"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-white text-sm placeholder-slate-700 focus:outline-none transition-all"
                  style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.07)" }}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-white text-sm placeholder-slate-700 focus:outline-none transition-all"
                  style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.07)" }}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"}
                />
              </div>
            </div>

            {/* Submit */}
            <motion.button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 20px rgba(79,70,229,0.3)" }}
              whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }}>
              {loading ? "Logging in…" : "Log In"}
            </motion.button>
          </form>

          {/* Divider + social — user mode only */}
          {!isAdminMode && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                <span className="text-slate-700 text-xs">or continue with</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>

              <div className="space-y-3">
                {/* Google */}
                <motion.button type="button" disabled={oauthLoading}
                  onClick={() => { const u = process.env.REACT_APP_API_URL || "http://localhost:5001/api"; window.location.href = `${u}/auth/google`; }}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                  style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.07)" }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {oauthLoading ? "Authenticating…" : "Continue with Google"}
                </motion.button>

                {/* Wallet */}
                <motion.button type="button"
                  className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-all flex items-center justify-center gap-2.5"
                  style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.07)" }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                    <path d="M12 6c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 10c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z" />
                  </svg>
                  Connect Wallet
                </motion.button>
              </div>
            </>
          )}

          {/* Footer links */}
          <div className="mt-6 text-center space-y-3">
            {!isAdminMode && (
              <p className="text-slate-600 text-xs">
                Don't have an account?{" "}
                <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                  Sign Up
                </Link>
              </p>
            )}
            <button
              onClick={() => { setIsAdminMode(!isAdminMode); setError(""); setEmail(""); setPassword(""); }}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 text-xs font-medium transition-colors mx-auto"
            >
              {isAdminMode ? <><ArrowLeft className="w-3 h-3" /> Back to User Login</> : <><ShieldCheck className="w-3 h-3" /> Admin Login</>}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;