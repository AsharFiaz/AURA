import { motion } from "framer-motion";
import { memo } from "react";

const AnimatedBackdrop = memo(() => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" style={{ background: "#050510" }}>
            <motion.div
                className="absolute -inset-[20%] opacity-40"
                animate={{
                    background: [
                        "radial-gradient(circle at 20% 30%, rgba(124,58,237,0.35) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(236,72,153,0.25) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(59,130,246,0.2) 0%, transparent 60%)",
                        "radial-gradient(circle at 70% 20%, rgba(124,58,237,0.35) 0%, transparent 50%), radial-gradient(circle at 30% 80%, rgba(236,72,153,0.25) 0%, transparent 50%), radial-gradient(circle at 60% 40%, rgba(59,130,246,0.2) 0%, transparent 60%)",
                        "radial-gradient(circle at 40% 70%, rgba(124,58,237,0.35) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(236,72,153,0.25) 0%, transparent 50%), radial-gradient(circle at 30% 50%, rgba(59,130,246,0.2) 0%, transparent 60%)",
                        "radial-gradient(circle at 20% 30%, rgba(124,58,237,0.35) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(236,72,153,0.25) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(59,130,246,0.2) 0%, transparent 60%)",
                    ],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full blur-3xl"
                    style={{
                        width: 200 + i * 50,
                        height: 200 + i * 50,
                        background: i % 2 === 0
                            ? "radial-gradient(circle, rgba(167,139,250,0.15), transparent)"
                            : "radial-gradient(circle, rgba(236,72,153,0.12), transparent)",
                        left: `${(i * 17) % 100}%`,
                        top: `${(i * 23) % 100}%`,
                    }}
                    animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.2, 0.9, 1] }}
                    transition={{ duration: 15 + i * 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                />
            ))}
            <svg className="absolute inset-0 w-full h-full opacity-50" preserveAspectRatio="none">
                {[...Array(80)].map((_, i) => {
                    const x = (i * 137) % 100, y = (i * 219) % 100, size = (i % 3) * 0.5 + 0.5;
                    return (
                        <motion.circle key={i} cx={`${x}%`} cy={`${y}%`} r={size} fill="#fff"
                            animate={{ opacity: [0.2, 0.8, 0.2] }}
                            transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: (i % 10) * 0.3 }} />
                    );
                })}
            </svg>
            <div className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage: "linear-gradient(rgba(167,139,250,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.5) 1px, transparent 1px)",
                    backgroundSize: "50px 50px",
                }} />
            <div className="absolute inset-0"
                style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(5,5,16,0.85) 100%)" }} />
        </div>
    );
});
AnimatedBackdrop.displayName = "AnimatedBackdrop";

export default AnimatedBackdrop;