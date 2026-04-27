// frontend/src/components/marketplace/MyNFTs.jsx
//
// "My NFTs" tab — shows three sections:
//   1. Minted by me   — memories the user originally minted, regardless of who owns them now
//   2. Owned (bought) — NFTs the user purchased from other users on-chain
//   3. Listed for sale — currently active listings owned by the user
//
// All three sections need on-chain data (ownerOf, tokenPrice) which only the
// connected wallet can read. Without a wallet we show a connect prompt.

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ethers } from "ethers";
import { Sparkles, Loader2, Wallet, Tag, ShoppingBag, Grid, Coins } from "lucide-react";
import { useWallet } from "../../context/WalletContext";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../config/blockchain";
import ConnectWallet from "../blockchain/ConnectWallet";

const SECTIONS = [
    { id: "minted", label: "Minted by me", icon: Sparkles, color: "#a78bfa" },
    { id: "owned", label: "Owned", icon: ShoppingBag, color: "#34d399" },
    { id: "listed", label: "Listed", icon: Tag, color: "#fbbf24" },
];

const MyNFTs = ({ NFTCard, onRefresh }) => {
    const { account, isCorrectNetwork } = useWallet();
    const { user } = useAuth();

    const [section, setSection] = useState("minted");
    const [loading, setLoading] = useState(false);
    const [minted, setMinted] = useState([]);   // I minted these
    const [owned, setOwned] = useState([]);     // I bought these from others
    const [listed, setListed] = useState([]);   // currently for sale by me

    // ── Load NFTs from backend + cross-reference with on-chain data ────────
    const loadNFTs = useCallback(async () => {
        if (!account || !isCorrectNetwork) {
            setMinted([]); setOwned([]); setListed([]);
            return;
        }

        try {
            setLoading(true);
            const res = await api.get("/memories/my-nfts");
            if (!res.data.success) return;

            const myMongoId = String(user?.id || user?._id);
            const accountLower = account.toLowerCase();

            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

            // ── 1. "Minted by me" — straight from backend (memories I created) ──
            // Hydrate with current on-chain owner + price so we know if they sold it.
            const mintedHydrated = await Promise.all(
                res.data.minted.map(async (m) => {
                    try {
                        const [owner, price] = await Promise.all([
                            contract.ownerOf(m.nftTokenId),
                            contract.tokenPrice(m.nftTokenId),
                        ]);
                        return {
                            ...m,
                            nftPrice: price,
                            currentOwner: owner.toLowerCase(),
                            stillOwned: owner.toLowerCase() === accountLower,
                        };
                    } catch {
                        return { ...m, nftPrice: 0n, currentOwner: null, stillOwned: false };
                    }
                })
            );
            setMinted(mintedHydrated);

            // ── 2. "Owned (bought)" — minted by others, owned by me on-chain ──
            const otherUsersMinted = res.data.all.filter(
                m => String(m.user?._id || m.user) !== myMongoId
            );

            const ownedChecks = await Promise.all(
                otherUsersMinted.map(async (m) => {
                    try {
                        const [owner, price] = await Promise.all([
                            contract.ownerOf(m.nftTokenId),
                            contract.tokenPrice(m.nftTokenId),
                        ]);
                        if (owner.toLowerCase() !== accountLower) return null;
                        return { ...m, nftPrice: price, currentOwner: owner.toLowerCase() };
                    } catch {
                        return null;
                    }
                })
            );
            setOwned(ownedChecks.filter(Boolean));

            // ── 3. "Listed for sale" — anything I own (minted or bought) that is listed ──
            const allMine = [
                ...mintedHydrated.filter(m => m.stillOwned),
                ...ownedChecks.filter(Boolean),
            ];
            setListed(allMine.filter(m => m.nftPrice && m.nftPrice > 0n));

        } catch (err) {
            console.error("[MyNFTs] failed to load:", err);
        } finally {
            setLoading(false);
        }
    }, [account, isCorrectNetwork, user?.id, user?._id]);

    useEffect(() => { loadNFTs(); }, [loadNFTs]);

    const handleRefresh = useCallback(() => {
        loadNFTs();
        if (onRefresh) onRefresh();
    }, [loadNFTs, onRefresh]);

    // ── No wallet — show connect prompt ─────────────────────────────────────
    if (!account) {
        return (
            <motion.div
                className="rounded-2xl p-12 text-center relative overflow-hidden"
                style={{
                    background: "rgba(19,19,42,0.7)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(99,102,241,0.2)",
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <motion.div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.08), transparent)" }}
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 4, repeat: Infinity, repeatDelay: 1 }}
                />
                <motion.div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative"
                    style={{ background: "rgba(99,102,241,0.1)" }}
                    animate={{
                        boxShadow: [
                            "0 0 16px rgba(124,58,237,0.2)",
                            "0 0 32px rgba(124,58,237,0.4)",
                            "0 0 16px rgba(124,58,237,0.2)",
                        ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <Wallet className="w-7 h-7 text-indigo-400" />
                </motion.div>
                <p className="text-white font-semibold mb-1">Connect your wallet</p>
                <p className="text-slate-500 text-sm mb-5">
                    See your minted NFTs, NFTs you've bought, and your active listings.
                </p>
                <div className="inline-block">
                    <ConnectWallet />
                </div>
            </motion.div>
        );
    }

    // ── Wrong network ───────────────────────────────────────────────────────
    if (!isCorrectNetwork) {
        return (
            <motion.div
                className="rounded-2xl p-10 text-center"
                style={{
                    background: "rgba(245,158,11,0.05)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(245,158,11,0.25)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <p className="text-amber-300 font-semibold mb-2">⚠ Wrong network</p>
                <p className="text-slate-500 text-sm mb-4">Switch to Hardhat Local to view your NFTs.</p>
                <ConnectWallet />
            </motion.div>
        );
    }

    const currentList = section === "minted" ? minted
        : section === "owned" ? owned
            : listed;

    const counts = {
        minted: minted.length,
        owned: owned.length,
        listed: listed.length,
    };

    return (
        <div>
            {/* Section tabs */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {SECTIONS.map(s => {
                    const active = section === s.id;
                    const Icon = s.icon;
                    return (
                        <motion.button
                            key={s.id}
                            onClick={() => setSection(s.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all flex-shrink-0"
                            style={{
                                background: active
                                    ? `${s.color}15`
                                    : "rgba(19,19,42,0.7)",
                                border: active
                                    ? `1px solid ${s.color}50`
                                    : "1px solid rgba(167,139,250,0.1)",
                                color: active ? s.color : "#94a3b8",
                                boxShadow: active ? `0 0 16px ${s.color}30` : "none",
                            }}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{s.label}</span>
                            <span
                                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                                style={{
                                    background: active ? `${s.color}25` : "rgba(255,255,255,0.05)",
                                    color: active ? s.color : "#64748b",
                                }}
                            >
                                {counts[s.id]}
                            </span>
                        </motion.button>
                    );
                })}
                <motion.button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="ml-auto px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                    style={{
                        background: "rgba(19,19,42,0.7)",
                        border: "1px solid rgba(167,139,250,0.1)",
                    }}
                    whileHover={!loading ? { scale: 1.04 } : {}}
                    whileTap={!loading ? { scale: 0.96 } : {}}
                >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Refresh"}
                </motion.button>
            </div>

            {/* Section explainer */}
            <p className="text-slate-500 text-xs mb-4">
                {section === "minted" && "NFTs you originally minted from your memories. If you sold one, it's still listed here but marked as no longer owned."}
                {section === "owned" && "NFTs you purchased from other users."}
                {section === "listed" && "Your NFTs that are currently for sale on the marketplace."}
            </p>

            {/* Content */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loading"
                        className="flex items-center justify-center gap-3 py-16"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                        <span className="text-slate-500 text-sm">Loading your NFTs from chain…</span>
                    </motion.div>
                ) : currentList.length === 0 ? (
                    <motion.div
                        key={`empty-${section}`}
                        className="text-center py-16 rounded-2xl"
                        style={{
                            background: "rgba(19,19,42,0.6)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(167,139,250,0.1)",
                        }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                            style={{ background: "rgba(99,102,241,0.08)" }}
                            animate={{
                                boxShadow: [
                                    "0 0 12px rgba(124,58,237,0.15)",
                                    "0 0 24px rgba(124,58,237,0.3)",
                                    "0 0 12px rgba(124,58,237,0.15)",
                                ],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            {section === "minted" && <Sparkles className="w-6 h-6 text-indigo-400" />}
                            {section === "owned" && <ShoppingBag className="w-6 h-6 text-green-400" />}
                            {section === "listed" && <Tag className="w-6 h-6 text-amber-400" />}
                        </motion.div>
                        <p className="text-slate-300 text-sm font-semibold mb-1">
                            {section === "minted" && "You haven't minted any NFTs yet"}
                            {section === "owned" && "You haven't bought any NFTs"}
                            {section === "listed" && "No active listings"}
                        </p>
                        <p className="text-slate-600 text-xs">
                            {section === "minted" && "Go to your profile and mint your first memory as an NFT."}
                            {section === "owned" && "Browse the marketplace to buy NFTs from other users."}
                            {section === "listed" && "List one of your NFTs for sale to see it here."}
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key={`grid-${section}`}
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0 }}
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
                        }}
                    >
                        {currentList.map((memory) => (
                            <div key={memory._id} className="relative">
                                {/* "Sold" overlay tag for minted-but-no-longer-owned items */}
                                {section === "minted" && memory.stillOwned === false && (
                                    <div
                                        className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"
                                        style={{
                                            background: "rgba(0,0,0,0.7)",
                                            backdropFilter: "blur(8px)",
                                            border: "1px solid rgba(148,163,184,0.4)",
                                            color: "#cbd5e1",
                                        }}
                                    >
                                        <Coins className="w-2.5 h-2.5" />
                                        Sold
                                    </div>
                                )}
                                <NFTCard
                                    memory={memory}
                                    onRefresh={handleRefresh}
                                />
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyNFTs;