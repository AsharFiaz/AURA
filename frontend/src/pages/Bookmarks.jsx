import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Bookmark, Home as HomeIcon, Bell, User as UserIcon,
  Compass, ShoppingBag, Mail, LogOut, Plus, Search,
} from "lucide-react";

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ user, logout, navigate, location }) => {
  const navLinks = [
    { icon: HomeIcon, label: "Home", path: "/" },
    { icon: Compass, label: "Discover", path: "/discover" },
    { icon: ShoppingBag, label: "Marketplace", path: "/marketplace" },
    { icon: Mail, label: "Messages", path: "/messages" },
    { icon: Bell, label: "Notifications", path: "/notifications", badge: true },
    { icon: Bookmark, label: "Bookmarks", path: "/bookmarks" },
    { icon: UserIcon, label: "Profile", path: "/profile" },
  ];
  return (
    <aside
      className="hidden lg:flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-hidden transition-all duration-300 ease-in-out group/sidebar"
      style={{ width: "72px", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      onMouseEnter={e => { e.currentTarget.style.width = "240px"; }}
      onMouseLeave={e => { e.currentTarget.style.width = "72px"; }}
    >
      <div className="px-4 py-6 flex items-center overflow-hidden" style={{ minHeight: "72px" }}>
        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent flex-shrink-0 w-8 text-center">A</span>
        <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-100">URA</span>
      </div>
      <nav className="flex flex-col gap-0.5 flex-1 px-2">
        {navLinks.map(item => (
          <button key={item.path} onClick={() => navigate(item.path)}
            className={`flex items-center rounded-xl transition-all duration-150 group/item relative ${location.pathname === item.path ? "text-white bg-white/10" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            style={{ minHeight: "48px", padding: "0 14px" }}
          >
            <item.icon className={`w-6 h-6 flex-shrink-0 transition-colors ${location.pathname === item.path ? "text-indigo-400" : "group-hover/item:text-indigo-400"}`} />
            <span className="ml-4 text-[15px] font-medium whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75 flex-1 text-left">{item.label}</span>
            {item.badge && <span className="absolute top-3 left-8 w-2 h-2 rounded-full bg-red-500" />}
          </button>
        ))}
      </nav>
      <div className="px-2 mt-2">
        <button onClick={() => navigate("/create")}
          className="w-full flex items-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-indigo-900/40 overflow-hidden"
          style={{ minHeight: "44px", padding: "0 14px" }}>
          <Plus className="w-5 h-5 flex-shrink-0" />
          <span className="ml-4 whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">Create Memory</span>
        </button>
      </div>
      <div className="mx-2 mt-3 mb-4 flex items-center rounded-xl hover:bg-white/5 transition-colors cursor-pointer group/user overflow-hidden"
        style={{ minHeight: "56px", padding: "0 10px" }} onClick={() => navigate("/profile")}>
        <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          {user?.profilePicture ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" /> : (user?.username?.charAt(0).toUpperCase() || "U")}
        </div>
        <div className="ml-3 flex-1 min-w-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">
          <p className="text-white text-xs font-semibold truncate">{user?.username}</p>
          <p className="text-slate-600 text-xs truncate">{user?.email}</p>
        </div>
        <button onClick={e => { e.stopPropagation(); logout(); navigate("/login"); }}
          className="ml-2 p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover/sidebar:opacity-100 group-hover/user:opacity-100">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

// ─── Bookmarks ────────────────────────────────────────────────────────────────
const Bookmarks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen text-white" style={{ background: "#0d0d1a" }}>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center gap-3 px-4 py-3"
        style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Bookmark className="w-5 h-5 text-indigo-400" />
        <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
          Bookmarks
        </span>
      </div>

      <div className="flex">
        <Sidebar user={user} logout={logout} navigate={navigate} location={location} />

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="sticky top-0 z-40 px-6 py-4 flex items-center gap-2"
            style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <Bookmark className="w-4 h-4 text-indigo-400" />
            <h1 className="text-base font-bold text-white">Bookmarks</h1>
          </div>

          {/* Content */}
          <div className="flex items-center justify-center px-4 py-16">
            <motion.div className="w-full max-w-md text-center rounded-2xl p-12"
              style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 32px rgba(79,70,229,0.3)" }}>
                <Bookmark className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-xl font-bold text-white mb-2">Bookmarks Coming Soon</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                Save your favorite memories and easily access them later. This feature is coming soon!
              </p>

              <motion.button onClick={() => navigate("/")}
                className="px-6 py-2.5 text-white text-sm font-semibold rounded-xl transition-all"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 16px rgba(79,70,229,0.3)" }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                Go to Home
              </motion.button>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-white/[0.05] px-2 py-2 z-50"
        style={{ background: "#0d0d1a" }}>
        <div className="flex items-center justify-around max-w-sm mx-auto">
          {[
            { icon: HomeIcon, path: "/" },
            { icon: Search, path: "/search" },
            { icon: Plus, path: "/create", fab: true },
            { icon: Bell, path: "/notifications" },
            { icon: UserIcon, path: "/profile" },
          ].map(({ icon: Icon, path, fab }) => (
            <button key={path} onClick={() => navigate(path)}
              className={fab
                ? "w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg"
                : `p-2.5 rounded-xl transition-colors ${location.pathname === path ? "text-indigo-400 bg-indigo-400/10" : "text-slate-500 hover:text-white"}`
              }>
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Bookmarks;