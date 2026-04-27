import { motion } from "framer-motion";
import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

/**
 * Shared mobile top bar for secondary pages.
 * Shows a back arrow + page title + an optional right-side action.
 */
const MobileTopBar = memo(({ title, icon: Icon, showBack = true, rightAction }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div
            className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3"
            style={{
                background: "rgba(10,10,20,0.85)",
                backdropFilter: "blur(20px)",
                borderBottom: "1px solid rgba(167,139,250,0.1)",
            }}
        >
            <div className="flex items-center gap-3 min-w-0">
                {showBack && (
                    <motion.button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        whileTap={{ scale: 0.9 }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </motion.button>
                )}
                <div className="flex items-center gap-2 min-w-0">
                    {Icon && <Icon className="w-5 h-5 text-indigo-400 flex-shrink-0" />}
                    <motion.span
                        className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent truncate"
                        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        style={{ backgroundSize: "200% 200%" }}
                    >
                        {title}
                    </motion.span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {rightAction || (
                    <>
                        <button onClick={() => navigate("/search")} className="p-2 text-slate-400 hover:text-white">
                            <Search className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => navigate("/profile")}
                            className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold"
                        >
                            {user?.profilePicture
                                ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                                : (user?.username?.charAt(0).toUpperCase() || "U")}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
});
MobileTopBar.displayName = "MobileTopBar";

export default MobileTopBar;