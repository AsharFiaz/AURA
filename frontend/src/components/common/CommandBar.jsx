import { motion, AnimatePresence } from "framer-motion";
import { memo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Loader2 } from "lucide-react";
import { useWallet } from "../../context/WalletContext";
import { useAuth } from "../../context/AuthContext";
import { showSuccess, showError } from "../../utils/toast";

/**
 * Shared bombastic command bar — appears at the top of every page.
 * All sections are clickable and tied to real wallet/user data.
 */
const CommandBar = memo(({ recentActivityCount = 0, isLive = true }) => {
    const { user } = useAuth();
    const {
        account, balance, chainId, isCorrectNetwork,
        connectWallet, disconnectWallet, switchToMumbai, connecting,
    } = useWallet();
    const navigate = useNavigate();
    const [pulse, setPulse] = useState(0);
    const [copied, setCopied] = useState(false);
    const [walletMenuOpen, setWalletMenuOpen] = useState(false);

    useEffect(() => {
        const i = setInterval(() => setPulse((p) => (p + 1) % 6), 400);
        return () => clearInterval(i);
    }, []);

    const shortAddr = account ? `${account.slice(0, 6)}…${account.slice(-4)}` : null;
    const networkLabel = chainId === 31337 ? "31337" : chainId === 80002 ? "amoy" : chainId === 80001 ? "mumbai" : chainId ? String(chainId) : "—";

    const handleSignalClick = () => window.location.reload();
    const handleActivityClick = () => navigate("/discover");
    const handleChainClick = async () => {
        if (!account) await connectWallet();
        else if (!isCorrectNetwork) await switchToMumbai();
        else navigate("/wallet-test");
    };
    const handleCopyAddress = async () => {
        if (!account) return;
        try {
            await navigator.clipboard.writeText(account);
            showSuccess("Wallet address copied!");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            showError("Could not copy address");
        }
    };
    const handleAvatarClick = () => navigate("/profile");
    const handleLogoClick = () => window.scrollTo({ top: 0, behavior: "smooth" });

    return (
        <motion.div
            className="hidden lg:flex items-center justify-between px-6 py-2.5 sticky top-0 z-50"
            style={{
                background: "rgba(10,10,20,0.7)",
                backdropFilter: "blur(20px)",
                borderBottom: "1px solid rgba(167,139,250,0.1)",
            }}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-slate-500">
                <motion.button
                    onClick={handleLogoClick}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors mr-2"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    title="Scroll to top"
                >
                    <motion.span
                        className="text-sm font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent"
                        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        style={{ backgroundSize: "200% 200%" }}
                    >
                        AURA
                    </motion.span>
                </motion.button>

                <motion.button
                    onClick={handleSignalClick}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors group"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    title={isLive ? "Data fresh — click to refresh" : "Click to refresh data"}
                >
                    <motion.span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: isLive ? "#34d399" : "#f59e0b" }}
                        animate={{
                            boxShadow: isLive
                                ? ["0 0 0px #34d399", "0 0 8px #34d399", "0 0 0px #34d399"]
                                : ["0 0 0px #f59e0b", "0 0 8px #f59e0b", "0 0 0px #f59e0b"]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="group-hover:text-slate-300 transition-colors">{isLive ? "signal · stable" : "signal · idle"}</span>
                </motion.button>

                <motion.button
                    onClick={handleActivityClick}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors group"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    title={`${recentActivityCount} memories in last hour — click to discover`}
                >
                    {[7, 12, 5, 14, 9, 11].map((h, i) => {
                        const intensity = Math.min(1, recentActivityCount / 10);
                        return (
                            <motion.span
                                key={i}
                                className="block w-[2px] rounded-full"
                                style={{
                                    height: h * (0.5 + intensity * 0.5),
                                    background: pulse === i ? "#a78bfa" : `rgba(167,139,250,${0.2 + intensity * 0.3})`,
                                }}
                                animate={{ scaleY: pulse === i ? 1.3 : 1 }}
                                transition={{ duration: 0.2 }}
                            />
                        );
                    })}
                    <span className="ml-2 group-hover:text-slate-300 transition-colors">activity · {recentActivityCount}/hr</span>
                </motion.button>

                <motion.button
                    onClick={handleChainClick}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors group ${!isCorrectNetwork && account ? "text-amber-400" : "text-slate-600"
                        }`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    title={
                        !account ? "Connect wallet"
                            : !isCorrectNetwork ? "Wrong network — click to switch"
                                : "View wallet details"
                    }
                >
                    <span className="group-hover:text-slate-300 transition-colors">chain · {networkLabel}{!isCorrectNetwork && account ? " ⚠" : ""}</span>
                </motion.button>
            </div>

            <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase">

                {/* ── Wallet — disconnected state ────────────────────────────── */}
                {!account ? (
                    <motion.button
                        onClick={connectWallet}
                        disabled={connecting}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-white text-[11px] font-semibold transition-all relative overflow-hidden disabled:opacity-60"
                        style={{
                            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                            boxShadow: "0 2px 12px rgba(79,70,229,0.4)",
                            border: "1px solid rgba(167,139,250,0.3)",
                        }}
                        whileHover={!connecting ? { scale: 1.04, boxShadow: "0 2px 20px rgba(124,58,237,0.6)" } : {}}
                        whileTap={!connecting ? { scale: 0.96 } : {}}
                    >
                        {!connecting && (
                            <motion.div
                                className="absolute inset-0"
                                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
                                animate={{ x: ["-100%", "100%"] }}
                                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                            />
                        )}
                        <span className="relative flex items-center gap-1.5 normal-case tracking-normal">
                            {connecting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Connecting…
                                </>
                            ) : (
                                <>
                                    <Wallet className="w-3.5 h-3.5" />
                                    Connect Wallet
                                </>
                            )}
                        </span>
                    </motion.button>
                ) : !isCorrectNetwork ? (
                    /* ── Wallet — wrong network ─────────────────────────────── */
                    <motion.button
                        onClick={switchToMumbai}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-[11px] font-semibold relative overflow-hidden"
                        style={{
                            background: "linear-gradient(135deg, #b45309, #dc2626)",
                            boxShadow: "0 2px 12px rgba(220,38,38,0.3)",
                        }}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                    >
                        <span className="relative normal-case tracking-normal">⚠ Wrong Network</span>
                    </motion.button>
                ) : (
                    /* ── Wallet — connected state with dropdown ─────────────── */
                    <div className="relative">
                        <motion.button
                            onClick={() => setWalletMenuOpen(p => !p)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
                            style={{
                                background: "rgba(99,102,241,0.1)",
                                border: "1px solid rgba(99,102,241,0.25)",
                            }}
                            whileHover={{ scale: 1.03, borderColor: "rgba(99,102,241,0.5)" }}
                            whileTap={{ scale: 0.97 }}
                            title="Wallet menu"
                        >
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400" />
                            </span>
                            <div className="text-right">
                                <div className="font-mono text-slate-200 normal-case tracking-normal text-[11px]">
                                    {copied ? "Copied!" : shortAddr}
                                </div>
                                <div className="text-slate-500 normal-case tracking-normal text-[9px]">
                                    {balance !== null ? `${balance} ${chainId === 31337 ? "ETH" : "MATIC"}` : "—"}
                                </div>
                            </div>
                        </motion.button>

                        <AnimatePresence>
                            {walletMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setWalletMenuOpen(false)}
                                    />
                                    <motion.div
                                        className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden z-50"
                                        style={{
                                            background: "#0d0d1a",
                                            border: "1px solid rgba(99,102,241,0.2)",
                                            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                                        }}
                                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <div className="p-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Connected</p>
                                            <p className="text-white text-xs font-mono normal-case">{shortAddr}</p>
                                            <p className="text-indigo-400 text-xs mt-1 normal-case tracking-normal">
                                                {balance} {chainId === 31337 ? "ETH" : "MATIC"}
                                            </p>
                                        </div>
                                        <div className="p-1.5">
                                            <button
                                                onClick={() => { handleCopyAddress(); setWalletMenuOpen(false); }}
                                                className="w-full px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:bg-white/5 transition-colors normal-case tracking-normal"
                                            >
                                                Copy address
                                            </button>
                                            <button
                                                onClick={() => { navigate("/wallet-test"); setWalletMenuOpen(false); }}
                                                className="w-full px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:bg-white/5 transition-colors normal-case tracking-normal"
                                            >
                                                Wallet details
                                            </button>
                                            <button
                                                onClick={() => { disconnectWallet(); setWalletMenuOpen(false); }}
                                                className="w-full px-3 py-2 rounded-lg text-left text-xs text-red-400 hover:bg-red-400/10 transition-colors normal-case tracking-normal"
                                            >
                                                Disconnect
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                <motion.button
                    onClick={handleAvatarClick}
                    className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-semibold"
                    style={{ background: "linear-gradient(135deg, #ec4899, #7c3aed)" }}
                    whileHover={{ scale: 1.15, rotate: 360, boxShadow: "0 0 16px rgba(167,139,250,0.6)" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ rotate: { duration: 0.6 } }}
                    title="Go to profile"
                >
                    {user?.profilePicture
                        ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                        : (user?.username?.charAt(0).toUpperCase() || "U")}
                </motion.button>
            </div>
        </motion.div>
    );
});
CommandBar.displayName = "CommandBar";

export default CommandBar;