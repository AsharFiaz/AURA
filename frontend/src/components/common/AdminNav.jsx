import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LogOut, ShieldCheck, ArrowLeft } from "lucide-react";

const AdminNav = ({ title, icon: Icon, showBack = false }) => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const handleLogout = () => { logout(); navigate("/login"); };

    return (
        <nav className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
            style={{
                background: "rgba(10,10,20,0.8)",
                backdropFilter: "blur(20px)",
                borderBottom: "1px solid rgba(167,139,250,0.15)",
            }}>
            <div className="flex items-center gap-4">
                {showBack && (
                    <motion.button
                        onClick={() => navigate("/admin/dashboard")}
                        className="p-2 rounded-xl transition-colors"
                        style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.15)" }}
                        whileHover={{ scale: 1.05, background: "rgba(167,139,250,0.15)", borderColor: "rgba(167,139,250,0.3)" }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <ArrowLeft className="w-4 h-4 text-white" />
                    </motion.button>
                )}

                <motion.div
                    className="flex items-center gap-3 cursor-pointer select-none"
                    onClick={() => navigate("/admin/dashboard")}
                    whileHover={{ scale: 1.02 }}
                >
                    <motion.div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
                        animate={{ boxShadow: ["0 0 12px rgba(124,58,237,0.3)", "0 0 24px rgba(124,58,237,0.6)", "0 0 12px rgba(124,58,237,0.3)"] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <ShieldCheck className="w-4 h-4 text-white" />
                    </motion.div>
                    <div className="flex items-baseline gap-2">
                        <motion.span
                            className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent"
                            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            style={{ backgroundSize: "200% 200%" }}
                        >
                            AURA
                        </motion.span>
                        <span className="text-slate-500 text-xs font-medium uppercase tracking-widest hidden sm:inline">Admin</span>
                    </div>
                </motion.div>

                {title && (
                    <motion.div
                        className="flex items-center gap-2 ml-2 pl-4"
                        style={{ borderLeft: "1px solid rgba(167,139,250,0.15)" }}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    >
                        {Icon && <Icon className="w-4 h-4 text-violet-400" />}
                        <h1 className="text-sm font-semibold bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-transparent whitespace-nowrap">
                            {title}
                        </h1>
                    </motion.div>
                )}
            </div>

            <motion.button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 hover:text-red-300 text-sm font-medium transition-all"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                whileHover={{ scale: 1.04, borderColor: "rgba(239,68,68,0.5)", boxShadow: "0 0 16px rgba(239,68,68,0.2)" }}
                whileTap={{ scale: 0.97 }}
            >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
            </motion.button>
        </nav>
    );
};

export default AdminNav;