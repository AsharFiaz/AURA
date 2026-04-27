// frontend/src/components/marketplace/RecommendedNFTs.jsx
//
// Personalized NFT recommendations for the marketplace.
// Uses the same OCEAN engine as the home feed, filtered to NFT-minted memories
// not owned by the current user.
//
// Hydrates on-chain prices in parallel with the chosen Memory docs so each
// card knows whether it's currently listed.

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { ethers } from "ethers";
import api from "../../utils/api";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../config/blockchain";

const RecommendedNFTs = ({
    NFTCard,            // pass your existing NFTCard component
    currentUserAccount,
    onRefresh,          // parent's refresh callback (so we can re-pull when listings change)
    limit = 12,
}) => {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [personalized, setPersonalized] = useState(false);

    // ── Hydrate on-chain prices for a list of minted memories ──────────────
    const hydratePrices = useCallback(async (mintedMemories) => {
        if (!window.ethereum || mintedMemories.length === 0) return mintedMemories;

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

            return await Promise.all(
                mintedMemories.map(async (m) => {
                    try {
                        const price = await contract.tokenPrice(m.nftTokenId);
                        return { ...m, nftPrice: price };
                    } catch {
                        return { ...m, nftPrice: 0n };
                    }
                })
            );
        } catch {
            // No wallet or RPC failed — return without prices
            return mintedMemories.map(m => ({ ...m, nftPrice: 0n }));
        }
    }, []);

    // ── Fetch recommendations from backend, then hydrate prices ────────────
    const fetchRecommendations = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/memories/marketplace-recommend?limit=${limit}`);
            if (!res.data.success) {
                setMemories([]);
                return;
            }

            const fetched = res.data.memories || [];
            setPersonalized(!!res.data.personalized);

            const withPrices = await hydratePrices(fetched);
            setMemories(withPrices);
        } catch (err) {
            console.error("[RecommendedNFTs] fetch failed:", err);
            setMemories([]);
        } finally {
            setLoading(false);
        }
    }, [limit, hydratePrices]);

    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    // Bubble parent refreshes (e.g., after a buy) up so prices stay fresh
    const handleRefresh = useCallback(() => {
        fetchRecommendations();
        if (onRefresh) onRefresh();
    }, [fetchRecommendations, onRefresh]);

    // ── Loading state ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">For You</h2>
                </div>
                <div className="rounded-2xl p-8 flex items-center justify-center gap-3"
                    style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span className="text-slate-500 text-sm">Curating NFTs based on your personality…</span>
                </div>
            </section>
        );
    }

    // ── Empty state — silent (don't show empty section above the main grid) ─
    if (memories.length === 0) return null;

    // ── Render section ─────────────────────────────────────────────────────
    return (
        <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                        For You
                    </h2>
                    {personalized && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium
                                         bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
                            personalized
                        </span>
                    )}
                </div>
                <span className="text-slate-600 text-xs">{memories.length} matched</span>
            </div>

            {!personalized && (
                <p className="text-slate-500 text-xs mb-4">
                    Complete your personality profile to unlock NFTs matched to your traits.
                </p>
            )}

            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
                }}
            >
                {memories.map((memory) => (
                    <NFTCard
                        key={memory._id}
                        memory={memory}
                        currentUserAccount={currentUserAccount}
                        onRefresh={handleRefresh}
                    />
                ))}
            </motion.div>
        </section>
    );
};

export default RecommendedNFTs;