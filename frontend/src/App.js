import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
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
import AdminDashboard from "./pages/AdminDashboard";
import AllUsers from "./pages/admin/AllUsers";
import AllMemories from "./pages/admin/AllMemories";
import AllNFTs from "./pages/admin/AllNFTs";
import LikesAnalytics from "./pages/admin/LikesAnalytics";

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Loading...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

// Admin Route Component - Only accessible to admins
function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Loading...
      </div>
    );
  }

  // Check if user is authenticated and is admin
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="bottom-right"
        containerStyle={{
          bottom: 80, // Move up 80px from bottom to clear footer
        }}
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
            iconTheme: {
              primary: "#ffffff",
              secondary: "#7c3aed",
            },
            style: {
              background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
            },
          },
          error: {
            iconTheme: {
              primary: "#f87171",
              secondary: "#1f2937",
            },
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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreateMemory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace"
            element={
              <ProtectedRoute>
                <Marketplace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/discover"
            element={
              <ProtectedRoute>
                <Discover />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/:userId"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookmarks"
            element={
              <ProtectedRoute>
                <Bookmarks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AllUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/memories"
            element={
              <AdminRoute>
                <AllMemories />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/nfts"
            element={
              <AdminRoute>
                <AllNFTs />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/likes"
            element={
              <AdminRoute>
                <LikesAnalytics />
              </AdminRoute>
            }
          />
          {/* Redirect /admin to /admin/dashboard */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
