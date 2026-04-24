import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, AlertTriangle, Loader2, CheckCheck } from "lucide-react";
import { useWallet } from "../../context/WalletContext";

const ConnectWallet = ({ compact = false }) => {
    const {
        account,
        shortAddress,
        balance,
        chainId,
        isCorrectNetwork,
        connecting,
        error,
        connectWallet,
        disconnectWallet,
        switchToMumbai,
    } = useWallet();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const copyAddress = () => {
        navigator.clipboard.writeText(account);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const explorerUrl = ``;

    // ── Not connected ──────────────────────────────────────────────────────────
    if (!account) {
        return (
            <div className="flex flex-col gap-2">
                <motion.button
                    onClick={connectWallet}
                    disabled={connecting}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                        background: connecting
                            ? "rgba(99,102,241,0.4)"
                            : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                        boxShadow: connecting ? "none" : "0 4px 20px rgba(79,70,229,0.35)",
                        border: "1px solid rgba(99,102,241,0.3)",
                    }}
                    whileHover={!connecting ? { scale: 1.03 } : {}}
                    whileTap={!connecting ? { scale: 0.97 } : {}}
                >
                    {connecting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Connecting…</span>
                        </>
                    ) : (
                        <>
                            <Wallet className="w-4 h-4" />
                            <span>Connect Wallet</span>
                        </>
                    )}
                </motion.button>

                {/* Error message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs text-red-300"
                            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // ── Wrong network warning ──────────────────────────────────────────────────
    if (!isCorrectNetwork) {
        return (
            <div className="flex flex-col gap-2">
                <motion.button
                    onClick={switchToMumbai}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-white"
                    style={{
                        background: "linear-gradient(135deg, #b45309, #dc2626)",
                        border: "1px solid rgba(220,38,38,0.4)",
                        boxShadow: "0 4px 16px rgba(220,38,38,0.25)",
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Switch to Mumbai</span>
                </motion.button>
                <p className="text-xs text-slate-500 text-center">
                    Wrong network (Chain ID: {chainId})
                </p>
            </div>
        );
    }

    // ── Connected ──────────────────────────────────────────────────────────────
    return (
        <div className="relative">
            <motion.button
                onClick={() => setDropdownOpen((p) => !p)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.25)",
                    color: "#a5b4fc",
                }}
                whileHover={{ scale: 1.02, borderColor: "rgba(99,102,241,0.5)" }}
                whileTap={{ scale: 0.98 }}
            >
                {/* Status dot */}
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400" />
                </span>

                {/* Address + balance */}
                <span className="text-white font-mono text-xs">{shortAddress}</span>
                {!compact && (
                    <span className="text-indigo-300 text-xs">{balance} MATIC</span>
                )}
                <ChevronDown
                    className={`w-3.5 h-3.5 text-indigo-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                />
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
                {dropdownOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setDropdownOpen(false)}
                        />

                        <motion.div
                            className="absolute right-0 top-full mt-2 w-64 rounded-2xl overflow-hidden z-50"
                            style={{
                                background: "#0d0d1a",
                                border: "1px solid rgba(99,102,241,0.2)",
                                boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)",
                            }}
                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                        >
                            {/* Header */}
                            <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <div className="flex items-center gap-3 mb-3">
                                    {/* Wallet avatar */}
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
                                    >
                                        <Wallet className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-semibold">Connected</p>
                                        <p className="text-indigo-400 text-xs">Hardhat Local</p>
                                    </div>
                                </div>

                                {/* Address */}
                                <div
                                    className="flex items-center justify-between px-3 py-2 rounded-lg"
                                    style={{ background: "rgba(255,255,255,0.04)" }}
                                >
                                    <span className="text-slate-300 font-mono text-xs">{shortAddress}</span>
                                    <div className="flex gap-1">
                                        <motion.button
                                            onClick={copyAddress}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                                            whileTap={{ scale: 0.9 }}
                                            title="Copy address"
                                        >
                                            {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        </motion.button>
                                        <a
                                            href={explorerUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                                            title="View on explorer"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Balance */}
                            <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <p className="text-slate-500 text-xs mb-1">Balance</p>
                                <p className="text-white text-2xl font-bold">
                                    {balance}
                                    <span className="text-indigo-400 text-sm font-medium ml-1">MATIC</span>
                                </p>
                                <p className="text-slate-600 text-xs mt-1">Polygon Amoy Testnet</p>
                            </div>

                            {/* Network info */}
                            <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 text-xs">Network</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-green-400" />
                                        <span className="text-green-400 text-xs font-medium">Hardhat Local</span>
                                    </div>
                                </div>
                            </div>

                            {/* Faucet link */}
                            <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <p className="text-xs text-slate-500">
                                    Using Hardhat Local — 10,000 test ETH available
                                </p>
                            </div>

                            {/* Disconnect */}
                            <div className="p-2">
                                <motion.button
                                    onClick={() => { disconnectWallet(); setDropdownOpen(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all"
                                    whileHover={{ x: 2 }}
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Disconnect</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ConnectWallet;
