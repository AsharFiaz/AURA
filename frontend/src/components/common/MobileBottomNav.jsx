import { motion } from "framer-motion";
import { memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Plus, Bell, User as UserIcon, Home as HomeIcon, Search,
} from "lucide-react";

/**
 * Shared mobile bottom navigation — appears on mobile screens only.
 * Same look across all pages.
 */
const MobileBottomNav = memo(() => {
    const navigate = useNavigate();
    const location = useLocation();

    const items = [
        { icon: HomeIcon, path: "/" },
        { icon: Search, path: "/search" },
        { icon: Plus, path: "/create", fab: true },
        { icon: Bell, path: "/notifications" },
        { icon: UserIcon, path: "/profile" },
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 px-2 py-2 z-50"
            style={{
                background: "rgba(10,10,20,0.85)",
                backdropFilter: "blur(20px)",
                borderTop: "1px solid rgba(167,139,250,0.1)",
            }}>
            <div className="flex items-center justify-around max-w-sm mx-auto">
                {items.map(({ icon: Icon, path, fab }) => (
                    <motion.button
                        key={path}
                        onClick={() => navigate(path)}
                        whileTap={{ scale: 0.9 }}
                        className={fab
                            ? "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg relative overflow-hidden"
                            : `p-2.5 rounded-xl transition-colors ${location.pathname === path ? "text-indigo-400 bg-indigo-400/10" : "text-slate-500 hover:text-white"}`
                        }
                        style={fab ? { background: "linear-gradient(135deg, #ec4899, #7c3aed)", boxShadow: "0 4px 20px rgba(124,58,237,0.5)" } : {}}
                    >
                        {fab && (
                            <motion.div
                                className="absolute inset-0"
                                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
                                animate={{ x: ["-100%", "100%"] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        )}
                        <Icon className={`${fab ? "w-6 h-6" : "w-5 h-5"} relative`} />
                    </motion.button>
                ))}
            </div>
        </nav>
    );
});
MobileBottomNav.displayName = "MobileBottomNav";

export default MobileBottomNav;