import { motion } from "framer-motion";
import { memo, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    Plus, Bell, User as UserIcon, Home as HomeIcon,
    Compass, ShoppingBag, Mail, Bookmark, LogOut,
} from "lucide-react";

/**
 * Shared bombastic sidebar — same animated styling as the Home page.
 * Used by all secondary pages so the visual identity is consistent.
 */
const BombasticSidebar = memo(() => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navLinks = useMemo(() => [
        { icon: HomeIcon, label: "Home", path: "/", active: isActive("/") },
        { icon: Compass, label: "Discover", path: "/discover", active: isActive("/discover") },
        { icon: ShoppingBag, label: "Marketplace", path: "/marketplace", active: isActive("/marketplace") },
        { icon: Mail, label: "Messages", path: "/messages", active: isActive("/messages") },
        { icon: Bell, label: "Notifications", path: "/notifications", active: isActive("/notifications"), badge: true },
        { icon: Bookmark, label: "Bookmarks", path: "/bookmarks", active: isActive("/bookmarks") },
        { icon: UserIcon, label: "Profile", path: "/profile", active: isActive("/profile") },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [location.pathname]);

    return (
        <aside
            className="hidden lg:flex flex-col flex-shrink-0 sticky top-0 overflow-hidden transition-all duration-300 ease-in-out group/sidebar"
            style={{
                width: "72px",
                height: "100vh",
                borderRight: "1px solid rgba(167,139,250,0.1)",
                background: "rgba(10,10,20,0.4)",
                backdropFilter: "blur(20px)",
            }}
            onMouseEnter={e => { e.currentTarget.style.width = "240px"; }}
            onMouseLeave={e => { e.currentTarget.style.width = "72px"; }}
        >
            <div className="px-4 py-5 flex items-center overflow-hidden" style={{ minHeight: "60px" }}>
                <motion.div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 relative cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    animate={{ boxShadow: ["0 0 20px rgba(124,58,237,0.3)", "0 0 30px rgba(124,58,237,0.6)", "0 0 20px rgba(124,58,237,0.3)"] }}
                    transition={{ boxShadow: { duration: 2, repeat: Infinity }, rotate: { duration: 0.4 } }}
                    onClick={() => navigate("/")}
                >
                    <span className="text-white font-bold text-sm">A</span>
                </motion.div>
                <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-100">URA</span>
            </div>

            <nav className="flex flex-col gap-1 flex-1 px-2">
                {navLinks.map((item, idx) => (
                    <motion.button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`flex items-center rounded-xl transition-all duration-150 group/item relative overflow-hidden ${item.active ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                        style={{
                            minHeight: "44px",
                            padding: "0 14px",
                            background: item.active ? "linear-gradient(90deg, rgba(124,58,237,0.2), rgba(167,139,250,0.05))" : "transparent",
                        }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        whileHover={{ x: 2 }}
                    >
                        {item.active && (
                            <motion.span
                                className="absolute left-0 top-1/2 w-[3px] h-6 rounded-full"
                                style={{ background: "#a78bfa", transform: "translateY(-50%)", boxShadow: "0 0 8px #a78bfa" }}
                                layoutId="activeIndicator"
                            />
                        )}
                        <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${item.active ? "text-indigo-400" : "group-hover/item:text-indigo-400"}`} />
                        <span className="ml-4 text-[14px] font-medium whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75 flex-1 text-left">
                            {item.label}
                        </span>
                        {item.badge && (
                            <motion.span
                                className="absolute top-3 left-8 w-2 h-2 rounded-full bg-red-500 group-hover/sidebar:relative group-hover/sidebar:top-0 group-hover/sidebar:left-0 group-hover/sidebar:ml-auto"
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                        )}
                    </motion.button>
                ))}
            </nav>

            <div className="px-2 mt-2">
                <motion.button
                    onClick={() => navigate("/create")}
                    className="w-full flex items-center text-white font-semibold rounded-xl overflow-hidden relative"
                    style={{
                        minHeight: "44px",
                        padding: "0 14px",
                        background: "linear-gradient(135deg, #ec4899 0%, #7c3aed 50%, #4f46e5 100%)",
                        boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
                    }}
                    whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(124,58,237,0.6)" }}
                    whileTap={{ scale: 0.98 }}
                >
                    <motion.div
                        className="absolute inset-0 opacity-0"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
                        animate={{ x: ["-100%", "100%"], opacity: [0, 0.5, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                    />
                    <Plus className="w-5 h-5 flex-shrink-0 relative" />
                    <span className="ml-4 whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75 text-sm relative">Create Memory</span>
                </motion.button>
            </div>

            <div
                className="mx-2 mt-3 mb-4 flex items-center rounded-xl hover:bg-white/5 transition-colors cursor-pointer group/user overflow-hidden"
                style={{ minHeight: "52px", padding: "0 10px" }}
                onClick={() => navigate("/profile")}
            >
                <motion.div
                    className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 relative"
                    whileHover={{ scale: 1.1 }}
                >
                    {user?.profilePicture
                        ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                        : (user?.username?.charAt(0).toUpperCase() || "U")}
                    <motion.span
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#0d0d1a]"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </motion.div>
                <div className="ml-3 flex-1 min-w-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">
                    <p className="text-white text-xs font-semibold truncate">{user?.username}</p>
                    <p className="text-slate-600 text-xs truncate">{user?.email}</p>
                </div>
                <button
                    onClick={e => { e.stopPropagation(); logout(); navigate("/login"); }}
                    className="ml-2 p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover/sidebar:opacity-100"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </aside>
    );
});
BombasticSidebar.displayName = "BombasticSidebar";

export default BombasticSidebar;