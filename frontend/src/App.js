import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import PersonalityOnboarding from "./pages/PersonalityOnboarding";
import Home from "./pages/Home";
import CreateMemory from "./pages/CreateMemory";
import Marketplace from "./pages/Marketplace";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import UserProfile from "./pages/UserProfile";
import SearchUsers from "./pages/SearchUsers";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Bookmarks from "./pages/Bookmarks";
import PersonalityPage from "./pages/PersonalityPage";
import ReportsPage from "./pages/ReportsPage";
import AdminDashboard from "./pages/AdminDashboard";
import AllUsers from "./pages/admin/AllUsers";
import AllMemories from "./pages/admin/AllMemories";
import AllNFTs from "./pages/admin/AllNFTs";
import LikesAnalytics from "./pages/admin/LikesAnalytics";

// Shown while AuthContext is reading localStorage — prevents ANY child
// component from mounting and firing API calls before the token is known.
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-900">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-slate-400 text-sm">Loading AURA…</span>
    </div>
  </div>
);

// Blocks child from mounting until auth resolves, then checks login
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
}

// Same but also checks for admin role
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

// Redirects logged-in users away from /login and /signup
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) {
    return user.role === "admin" ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="bottom-right"
        containerStyle={{ bottom: 80 }}
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1f2937",
            color: "#ffffff",
            borderRadius: "12px",
            padding: "12px 16px",
            fontWeight: "500",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
          success: {
            iconTheme: { primary: "#ffffff", secondary: "#7c3aed" },
            style: {
              background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
            },
          },
          error: {
            iconTheme: { primary: "#f87171", secondary: "#1f2937" },
            style: {
              background: "#1f2937",
              color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
            },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* Public — redirect away if already logged in */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

          {/* OAuth callback — no guard needed */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected */}
          <Route path="/onboarding" element={<ProtectedRoute><PersonalityOnboarding /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><CreateMemory /></ProtectedRoute>} />
          <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
          <Route path="/user/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchUsers /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
          <Route path="/personality" element={<ProtectedRoute><PersonalityPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AllUsers /></AdminRoute>} />
          <Route path="/admin/memories" element={<AdminRoute><AllMemories /></AdminRoute>} />
          <Route path="/admin/nfts" element={<AdminRoute><AllNFTs /></AdminRoute>} />
          <Route path="/admin/likes" element={<AdminRoute><LikesAnalytics /></AdminRoute>} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;