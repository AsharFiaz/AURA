import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AnimatedBackdrop from "../components/common/AnimatedBackdrop";
import BombasticSidebar from "../components/common/BombasticSidebar";
import CommandBar from "../components/common/CommandBar";
import MobileTopBar from "../components/common/MobileTopBar";
import MobileBottomNav from "../components/common/MobileBottomNav";
import { Bookmark, Sparkles, Construction } from "lucide-react";

const Bookmarks = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white relative">
      <AnimatedBackdrop />

      <CommandBar isLive={true} />
      <MobileTopBar title="Bookmarks" icon={Bookmark} />

      <div className="flex relative">
        <BombasticSidebar />

        <main className="flex-1 min-w-0">
          {/* Page header */}
          <motion.div
            className="sticky top-[42px] z-40 px-6 py-4 flex items-center gap-2"
            style={{
              background: "rgba(10,10,20,0.85)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(167,139,250,0.1)",
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              animate={{ y: [0, -3, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Bookmark className="w-5 h-5 text-pink-400" />
            </motion.div>
            <h1 className="text-base font-bold bg-gradient-to-r from-white via-pink-200 to-rose-300 bg-clip-text text-transparent">
              Bookmarks
            </h1>
          </motion.div>

          <div className="flex items-center justify-center px-4 py-16 min-h-[calc(100vh-200px)]">
            <motion.div
              className="w-full max-w-md text-center rounded-3xl p-12 relative overflow-hidden"
              style={{
                background: "rgba(19,19,42,0.7)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(236,72,153,0.15)",
                boxShadow: "0 0 60px rgba(236,72,153,0.1)",
              }}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Animated shimmer */}
              <motion.div
                className="absolute inset-0 opacity-50 pointer-events-none"
                style={{ background: "linear-gradient(90deg, transparent, rgba(236,72,153,0.08), transparent)" }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 1 }}
              />

              {/* Floating sparkles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{ left: `${20 + (i * 13) % 60}%`, top: `${15 + (i * 17) % 70}%` }}
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.3, 0.8, 0.3],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
                >
                  <Sparkles className="w-3 h-3 text-pink-400" />
                </motion.div>
              ))}

              <motion.div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 relative"
                style={{ background: "linear-gradient(135deg,#ec4899,#7c3aed)" }}
                animate={{
                  boxShadow: [
                    "0 0 32px rgba(236,72,153,0.3)",
                    "0 0 64px rgba(124,58,237,0.5)",
                    "0 0 32px rgba(236,72,153,0.3)",
                  ],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  boxShadow: { duration: 2, repeat: Infinity },
                  rotate: { duration: 6, repeat: Infinity },
                }}
              >
                <Bookmark className="w-12 h-12 text-white" />
                <motion.div
                  className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Construction className="w-3.5 h-3.5 text-white" />
                </motion.div>
              </motion.div>

              <motion.h2
                className="text-2xl font-bold text-white mb-3 relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Bookmarks Coming Soon
              </motion.h2>
              <motion.p
                className="text-slate-400 text-sm leading-relaxed mb-8 relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Save your favorite memories and easily
                <br />
                access them later. Coming soon.
              </motion.p>

              <motion.button
                onClick={() => navigate("/")}
                className="px-8 py-3 text-white text-sm font-semibold rounded-xl transition-all relative overflow-hidden inline-flex items-center gap-2"
                style={{
                  background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                  boxShadow: "0 4px 20px rgba(79,70,229,0.4)",
                }}
                whileHover={{ scale: 1.05, boxShadow: "0 4px 32px rgba(124,58,237,0.6)" }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                />
                <span className="relative">Back to Home</span>
              </motion.button>
            </motion.div>
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default Bookmarks;