import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { useMarketplace } from "../hooks/useMarketplace";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config/blockchain";
import api from "../utils/api";
import ConnectWallet from "../components/blockchain/ConnectWallet";
import RecommendedNFTs from "../components/marketplace/RecommendedNFTs";
import MyNFTs from "../components/marketplace/MyNFTs";
import AnimatedBackdrop from "../components/common/AnimatedBackdrop";
import BombasticSidebar from "../components/common/BombasticSidebar";
import CommandBar from "../components/common/CommandBar";
import MobileTopBar from "../components/common/MobileTopBar";
import MobileBottomNav from "../components/common/MobileBottomNav";
import {
  Search, Sparkles, ShoppingBag, Tag, X, Loader2,
  AlertCircle, CheckCircle2, Compass, Wallet,
} from "lucide-react";

// ─── List Modal ───────────────────────────────────────────────────────────────
const ListModal = ({ memory, tokenId, onClose, onSuccess }) => {
  const [price, setPrice] = useState("");
  const { listNFT, loading, error } = useMarketplace();
  const [success, setSuccess] = useState(false);

  const handleList = async () => {
    if (!price || isNaN(price) || parseFloat(price) <= 0) return;
    const result = await listNFT(tokenId, price);
    if (result) { setSuccess(true); onSuccess(); }
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="w-full max-w-sm rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(22,22,40,0.95), rgba(13,13,26,0.95))",
            border: "1px solid rgba(167,139,250,0.25)",
            boxShadow: "0 0 60px rgba(124,58,237,0.3)",
          }}
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}>
          <motion.div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.08), transparent)" }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          />

          <div className="flex items-center justify-between mb-5 relative">
            <div className="flex items-center gap-2">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                <Tag className="w-5 h-5 text-indigo-400" />
              </motion.div>
              <h2 className="text-white font-bold text-lg">List for Sale</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {success ? (
            <motion.div className="text-center py-4 relative" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <motion.div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 relative"
                style={{ background: "rgba(74,222,128,0.1)", border: "2px solid rgba(74,222,128,0.3)" }}
                animate={{
                  boxShadow: [
                    "0 0 24px rgba(74,222,128,0.3)",
                    "0 0 48px rgba(74,222,128,0.6)",
                    "0 0 24px rgba(74,222,128,0.3)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </motion.div>
              <p className="text-white font-bold text-lg mb-1">Listed Successfully!</p>
              <p className="text-slate-400 text-sm mb-4">Token #{tokenId} is now on the marketplace</p>
              <motion.button onClick={onClose} className="px-6 py-2 rounded-xl text-white text-sm font-semibold relative overflow-hidden"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                Done
              </motion.button>
            </motion.div>
          ) : (
            <>
              <div className="rounded-xl p-3 mb-5 relative"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-slate-300 text-sm line-clamp-2">{memory.caption}</p>
                {memory.image && <img src={memory.image} alt="" className="w-full h-24 object-cover rounded-lg mt-2" />}
                <p className="text-indigo-400 text-xs mt-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Token #{tokenId}
                </p>
              </div>

              <div className="mb-5 relative">
                <label className="text-slate-400 text-xs font-medium mb-1.5 block uppercase tracking-widest">Price (ETH)</label>
                <input type="number" step="0.001" min="0.001" placeholder="e.g. 0.5"
                  value={price} onChange={e => setPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none transition-all"
                  style={{ background: "rgba(13,13,26,0.6)", border: "1px solid rgba(167,139,250,0.15)" }}
                  onFocus={e => { e.target.style.borderColor = "rgba(167,139,250,0.5)"; e.target.style.boxShadow = "0 0 16px rgba(124,58,237,0.2)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(167,139,250,0.15)"; e.target.style.boxShadow = "none"; }} />
              </div>

              {error && (
                <motion.div className="flex items-start gap-2 p-3 rounded-xl text-red-300 text-sm mb-4 relative"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{error}</span>
                </motion.div>
              )}

              <motion.button onClick={handleList} disabled={loading || !price}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 relative overflow-hidden"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 20px rgba(79,70,229,0.35)" }}
                whileHover={!loading ? { scale: 1.02, boxShadow: "0 4px 32px rgba(124,58,237,0.6)" } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}>
                {!loading && (
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Listing… confirm in MetaMask</>
                    : <><Tag className="w-4 h-4" /> List for Sale</>}
                </span>
              </motion.button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Buy Modal ────────────────────────────────────────────────────────────────
const BuyModal = ({ memory, tokenId, priceEth, onClose, onSuccess }) => {
  const { buyNFT, loading, error } = useMarketplace();
  const { account } = useWallet();
  const [success, setSuccess] = useState(false);

  const handleBuy = async () => {
    const result = await buyNFT(tokenId, priceEth);
    if (result) { setSuccess(true); onSuccess(); }
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="w-full max-w-sm rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(22,22,40,0.95), rgba(13,13,26,0.95))",
            border: "1px solid rgba(167,139,250,0.25)",
            boxShadow: "0 0 60px rgba(124,58,237,0.3)",
          }}
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}>

          <motion.div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.08), transparent)" }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          />

          <div className="flex items-center justify-between mb-5 relative">
            <div className="flex items-center gap-2">
              <motion.div animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <ShoppingBag className="w-5 h-5 text-indigo-400" />
              </motion.div>
              <h2 className="text-white font-bold text-lg">Buy NFT</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {success ? (
            <motion.div className="text-center py-4 relative" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <motion.div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 relative"
                style={{ background: "rgba(74,222,128,0.1)", border: "2px solid rgba(74,222,128,0.3)" }}
                animate={{
                  boxShadow: [
                    "0 0 24px rgba(74,222,128,0.3)",
                    "0 0 48px rgba(74,222,128,0.6)",
                    "0 0 24px rgba(74,222,128,0.3)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CheckCircle2 className="w-8 h-8 text-green-400" />
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{ left: "50%", top: "50%", transform: `rotate(${i * 60}deg) translateY(-40px)` }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
                    transition={{ duration: 1.5, delay: 0.3 + i * 0.1, repeat: Infinity, repeatDelay: 1 }}
                  >
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                  </motion.div>
                ))}
              </motion.div>
              <p className="text-white font-bold text-lg mb-1">Purchase Successful!</p>
              <p className="text-slate-400 text-sm mb-4">Token #{tokenId} is now in your wallet</p>
              <motion.button onClick={onClose} className="px-6 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>Done</motion.button>
            </motion.div>
          ) : (
            <>
              <div className="rounded-xl p-3 mb-5 relative"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-slate-300 text-sm line-clamp-2">{memory.caption}</p>
                {memory.image && <img src={memory.image} alt="" className="w-full h-24 object-cover rounded-lg mt-2" />}
              </div>

              <motion.div className="rounded-xl p-4 mb-5 relative overflow-hidden"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)" }}
                animate={{
                  boxShadow: [
                    "0 0 16px rgba(124,58,237,0.1)",
                    "0 0 32px rgba(124,58,237,0.3)",
                    "0 0 16px rgba(124,58,237,0.1)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm uppercase tracking-widest text-xs">Price</span>
                  <span className="text-white font-bold text-2xl">{priceEth} ETH</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-slate-600 text-xs">Token #{tokenId}</span>
                  <span className="text-slate-600 text-xs">Hardhat Local</span>
                </div>
              </motion.div>

              {!account && (
                <div className="mb-4 flex justify-center"><ConnectWallet /></div>
              )}

              {error && (
                <motion.div className="flex items-start gap-2 p-3 rounded-xl text-red-300 text-sm mb-4"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{error}</span>
                </motion.div>
              )}

              {account && (
                <motion.button onClick={handleBuy} disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 20px rgba(79,70,229,0.35)" }}
                  whileHover={!loading ? { scale: 1.02, boxShadow: "0 4px 32px rgba(124,58,237,0.6)" } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}>
                  {!loading && (
                    <motion.div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Buying… confirm in MetaMask</>
                      : <><ShoppingBag className="w-4 h-4" /> Buy for {priceEth} ETH</>}
                  </span>
                </motion.button>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── NFT Card ─────────────────────────────────────────────────────────────────
const NFTCard = ({ memory, onRefresh }) => {
  const { user } = useAuth();
  const { account } = useWallet();
  const { cancelListing, loading } = useMarketplace();
  const [listModal, setListModal] = useState(false);
  const [buyModal, setBuyModal] = useState(false);

  const tokenId = memory.nftTokenId;
  const priceWei = memory.nftPrice || 0n;
  const priceEth = priceWei > 0n ? ethers.formatEther(priceWei) : null;
  const isListed = priceWei > 0n;

  // Use on-chain owner if we have it (passed by MyNFTs), otherwise fall back
  // to the original minter. This means the action buttons reflect the *current*
  // owner of the NFT, not the original minter.
  const accountLower = account?.toLowerCase();
  const isCurrentOwner = memory.currentOwner
    ? memory.currentOwner === accountLower
    : String(memory.user?._id || memory.user?.id) === String(user?.id);

  const handleCancel = async () => {
    const result = await cancelListing(tokenId);
    if (result) onRefresh();
  };

  return (
    <>
      <motion.div className="rounded-2xl overflow-hidden group relative"
        style={{
          background: "rgba(19,19,42,0.7)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(167,139,250,0.1)",
        }}
        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
        whileHover={{
          scale: 1.02,
          borderColor: "rgba(167,139,250,0.4)",
          boxShadow: "0 0 32px rgba(124,58,237,0.2)",
        }}>

        <motion.div
          className="absolute inset-0 opacity-0 pointer-events-none z-10"
          style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.05), transparent)" }}
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
        />

        <div className="w-full h-44 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,rgba(79,70,229,0.15),rgba(124,58,237,0.1))" }}>
          {memory.image ? (
            <img src={memory.image} alt="Memory" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                <Sparkles className="w-10 h-10 text-indigo-400/50 mb-2" />
              </motion.div>
              <p className="text-slate-600 text-xs">Memory NFT</p>
            </div>
          )}
          <motion.div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-white text-xs font-bold"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", border: "1px solid rgba(167,139,250,0.2)" }}
            animate={isListed ? {
              boxShadow: [
                "0 0 0px rgba(124,58,237,0)",
                "0 0 12px rgba(124,58,237,0.5)",
                "0 0 0px rgba(124,58,237,0)",
              ],
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}>
            {isListed ? `${priceEth} ETH` : "Not listed"}
          </motion.div>
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-indigo-300"
            style={{ background: "rgba(99,102,241,0.2)", backdropFilter: "blur(8px)", border: "1px solid rgba(99,102,241,0.3)" }}>
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="w-3 h-3" />
            </motion.div>
            #{tokenId}
          </div>
        </div>

        <div className="p-4">
          <p className="text-white text-sm font-medium line-clamp-2 mb-2.5">{memory.caption}</p>

          {memory.emotions?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {memory.emotions.slice(0, 2).map((e, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-full text-xs border bg-slate-500/10 text-slate-300 border-slate-500/30">{e}</span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px" }}>
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {memory.user?.profilePicture
                ? <img src={memory.user.profilePicture} alt="" className="w-full h-full object-cover" />
                : memory.user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="text-slate-500 text-xs">{memory.user?.username || "Unknown"}</span>
          </div>

          <div className="flex gap-2">
            {isCurrentOwner ? (
              isListed ? (
                <motion.button onClick={handleCancel} disabled={loading}
                  className="flex-1 py-2 rounded-xl text-red-300 text-xs font-semibold transition-all disabled:opacity-50"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                  whileHover={{ scale: 1.03, borderColor: "rgba(239,68,68,0.4)" }}
                  whileTap={{ scale: 0.97 }}>
                  {loading ? "Cancelling…" : "Cancel Listing"}
                </motion.button>
              ) : (
                <motion.button onClick={() => setListModal(true)}
                  className="flex-1 py-2 rounded-xl text-white text-xs font-semibold relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}
                  whileHover={{ scale: 1.03, boxShadow: "0 4px 20px rgba(124,58,237,0.5)" }}
                  whileTap={{ scale: 0.97 }}>
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }}
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                  <span className="relative"><Tag className="w-3 h-3 inline mr-1" />List for Sale</span>
                </motion.button>
              )
            ) : (
              isListed ? (
                <motion.button onClick={() => setBuyModal(true)}
                  className="flex-1 py-2 rounded-xl text-white text-xs font-semibold relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}
                  whileHover={{ scale: 1.03, boxShadow: "0 4px 20px rgba(124,58,237,0.5)" }}
                  whileTap={{ scale: 0.97 }}>
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }}
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                  <span className="relative">Buy {priceEth} ETH</span>
                </motion.button>
              ) : (
                <div className="flex-1 py-2 rounded-xl text-slate-600 text-xs font-semibold text-center"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  Not for sale
                </div>
              )
            )}
          </div>
        </div>
      </motion.div>

      {listModal && <ListModal memory={memory} tokenId={tokenId} onClose={() => setListModal(false)} onSuccess={() => { setListModal(false); onRefresh(); }} />}
      {buyModal && <BuyModal memory={memory} tokenId={tokenId} priceEth={priceEth} onClose={() => setBuyModal(false)} onSuccess={() => { setBuyModal(false); onRefresh(); }} />}
    </>
  );
};

// ─── Marketplace ──────────────────────────────────────────────────────────────
const Marketplace = () => {
  const [view, setView] = useState("browse"); // "browse" | "mine"
  const [nftMemories, setNftMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [stats, setStats] = useState({ totalMemories: 0, totalLikes: 0, activeSellers: 0, floorPrice: 0, volume24h: 0 });
  const { account } = useWallet();
  const navigate = useNavigate();

  const fetchNFTs = useCallback(async () => {
    try {
      setLoading(true);
      const r = await api.get("/memories/feed?limit=50");
      if (!r.data.success) return;

      const allMemories = r.data.memories;
      const minted = allMemories.filter(m => m.nftTokenId);

      if (minted.length === 0) { setNftMemories([]); return; }

      if (!window.ethereum) { setNftMemories(minted); return; }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const withPrices = await Promise.all(
        minted.map(async (m) => {
          try {
            const [price, owner] = await Promise.all([
              contract.tokenPrice(m.nftTokenId),
              contract.ownerOf(m.nftTokenId).catch(() => null),
            ]);
            return {
              ...m,
              nftPrice: price,
              currentOwner: owner ? owner.toLowerCase() : null,
            };
          } catch {
            return { ...m, nftPrice: 0n, currentOwner: null };
          }
        })
      );

      setNftMemories(withPrices);
    } catch (e) {
      console.error("[Marketplace] fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const r = await api.get("/memories/stats");
      if (r.data.success) setStats(r.data.stats);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchNFTs(); fetchStats(); }, [fetchNFTs, fetchStats]);

  const filtered = nftMemories.filter(m => {
    if (filter === "Listed") return m.nftPrice > 0n;
    if (filter === "Not Listed") return !m.nftPrice || m.nftPrice === 0n;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return m.caption?.toLowerCase().includes(q) ||
        m.user?.username?.toLowerCase().includes(q) ||
        m.emotions?.some(e => e.toLowerCase().includes(q));
    }
    return true;
  });

  const listedCount = nftMemories.filter(m => m.nftPrice > 0n).length;
  const notListedCount = nftMemories.filter(m => !m.nftPrice || m.nftPrice === 0n).length;

  return (
    <div className="min-h-screen text-white relative">
      <AnimatedBackdrop />

      <CommandBar recentActivityCount={listedCount} isLive={!loading} />
      <MobileTopBar title="Marketplace" icon={ShoppingBag} showBack={false}
        rightAction={<ConnectWallet compact />} />

      <div className="flex relative">
        <BombasticSidebar />

        <main className="flex-1 min-w-0">
          {/* Header */}
          <motion.div
            className="sticky top-[42px] z-40 px-6 py-4"
            style={{
              background: "rgba(10,10,20,0.85)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(167,139,250,0.1)",
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-base font-bold text-white flex items-center gap-2">
                  <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                    <ShoppingBag className="w-5 h-5 text-indigo-400" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-transparent">
                    Marketplace
                  </span>
                </h1>
                <p className="text-slate-600 text-xs mt-0.5">Buy and sell memory NFTs</p>
              </div>
              <div className="flex items-center gap-3">
                {view === "browse" && (
                  <div className="hidden md:flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                      <input type="text" placeholder="Search NFTs…" value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none w-48 transition-all"
                        style={{
                          background: "rgba(19,19,42,0.8)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(167,139,250,0.15)",
                        }}
                        onFocus={e => { e.target.style.borderColor = "rgba(167,139,250,0.5)"; e.target.style.boxShadow = "0 0 16px rgba(124,58,237,0.15)"; }}
                        onBlur={e => { e.target.style.borderColor = "rgba(167,139,250,0.15)"; e.target.style.boxShadow = "none"; }} />
                    </div>
                    <select value={filter} onChange={e => setFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl text-slate-300 text-sm focus:outline-none cursor-pointer"
                      style={{
                        background: "rgba(19,19,42,0.8)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(167,139,250,0.15)",
                      }}>
                      {["All", "Listed", "Not Listed"].map(v => <option key={v} value={v} style={{ background: "#13132a" }}>{v}</option>)}
                    </select>
                  </div>
                )}
                <ConnectWallet compact />
              </div>
            </div>
          </motion.div>

          <div className="px-6 py-6 pb-24 lg:pb-8 space-y-6">

            {/* ── Browse / My NFTs tabs ──────────────────────────────────── */}
            <div className="flex gap-2 relative" style={{ borderBottom: "1px solid rgba(167,139,250,0.15)" }}>
              {[
                { id: "browse", label: "Browse", icon: Compass },
                { id: "mine", label: "My NFTs", icon: Wallet },
              ].map(tab => {
                const Icon = tab.icon;
                const active = view === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setView(tab.id)}
                    className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${active ? "text-indigo-400" : "text-slate-500 hover:text-white"
                      }`}
                    whileHover={{ y: -1 }}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {active && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                        style={{
                          background: "linear-gradient(90deg, #818cf8, #a78bfa, #818cf8)",
                          boxShadow: "0 0 8px rgba(167,139,250,0.6)",
                        }}
                        layoutId="marketplaceTab"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {view === "browse" ? (
                <motion.div
                  key="browse"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Stats */}
                  <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3"
                    initial="hidden" animate="visible"
                    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}>
                    {[
                      { label: "Total NFTs", value: nftMemories.length, color: "#a78bfa" },
                      { label: "Listed", value: listedCount, color: "#34d399" },
                      { label: "Not Listed", value: notListedCount, color: "#94a3b8" },
                      { label: "Total Memories", value: stats.totalMemories, color: "#f59e0b" },
                    ].map(({ label, value, color }) => (
                      <motion.div key={label}
                        className="rounded-2xl p-4 relative overflow-hidden"
                        style={{
                          background: "rgba(19,19,42,0.7)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(167,139,250,0.1)",
                        }}
                        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                        whileHover={{
                          scale: 1.03,
                          borderColor: "rgba(167,139,250,0.3)",
                          boxShadow: `0 0 24px ${color}30`,
                        }}>
                        <p className="text-slate-600 text-xs mb-1 uppercase tracking-widest">{label}</p>
                        <motion.p
                          className="text-2xl font-bold text-white"
                          initial={{ scale: 0.5 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        >
                          {value}
                        </motion.p>
                        <motion.span
                          className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full"
                          style={{ background: color }}
                          animate={{
                            boxShadow: [
                              `0 0 0px ${color}`,
                              `0 0 8px ${color}`,
                              `0 0 0px ${color}`,
                            ],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* No wallet warning */}
                  <AnimatePresence>
                    {!account && (
                      <motion.div className="rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden"
                        style={{
                          background: "rgba(99,102,241,0.08)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(99,102,241,0.25)",
                        }}
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <motion.div
                          className="absolute inset-0 opacity-30 pointer-events-none"
                          style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.1), transparent)" }}
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 4, repeat: Infinity, repeatDelay: 1 }}
                        />
                        <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                          <Sparkles className="w-8 h-8 text-indigo-400 flex-shrink-0" />
                        </motion.div>
                        <div className="flex-1 relative">
                          <p className="text-white font-semibold text-sm">Connect your wallet to buy and sell NFTs</p>
                          <p className="text-slate-500 text-xs mt-0.5">You need MetaMask connected to Hardhat Local to interact with the marketplace.</p>
                        </div>
                        <ConnectWallet />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Personalized recommendations */}
                  <RecommendedNFTs
                    NFTCard={NFTCard}
                    currentUserAccount={account}
                    onRefresh={fetchNFTs}
                    limit={6}
                  />

                  {/* All NFTs Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <motion.h2
                        className="text-sm font-bold uppercase tracking-widest flex items-center gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <motion.span
                          className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                          animate={{
                            boxShadow: [
                              "0 0 0px #a78bfa",
                              "0 0 8px #a78bfa",
                              "0 0 0px #a78bfa",
                            ],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span className="bg-gradient-to-r from-slate-300 to-slate-500 bg-clip-text text-transparent">
                          {filter === "All" ? "All NFTs" : filter}
                        </span>
                      </motion.h2>
                      {!loading && <span className="text-slate-600 text-xs">{filtered.length} items</span>}
                    </div>

                    {loading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                          <motion.div key={i}
                            className="rounded-2xl overflow-hidden"
                            style={{
                              background: "rgba(19,19,42,0.7)",
                              backdropFilter: "blur(10px)",
                              border: "1px solid rgba(167,139,250,0.1)",
                            }}
                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}>
                            <div className="w-full h-44 bg-slate-800/40" />
                            <div className="p-4 space-y-2">
                              <div className="h-4 bg-slate-800/40 rounded w-3/4" />
                              <div className="h-3 bg-slate-800/40 rounded w-1/2" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : filtered.length === 0 ? (
                      <motion.div className="text-center py-16 rounded-2xl relative overflow-hidden"
                        style={{
                          background: "rgba(19,19,42,0.6)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(167,139,250,0.1)",
                        }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}>
                        <motion.div
                          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 relative"
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
                          <Sparkles className="w-7 h-7 text-indigo-400" />
                        </motion.div>
                        <p className="text-slate-400 text-sm mb-1 font-semibold">
                          {nftMemories.length === 0 ? "No NFTs minted yet" : "No NFTs match your filter"}
                        </p>
                        {nftMemories.length === 0 && (
                          <p className="text-slate-600 text-xs">Go to your profile and mint a memory as NFT first</p>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                        initial="hidden" animate="visible"
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}>
                        {filtered.map((memory) => (
                          <NFTCard key={memory._id} memory={memory} onRefresh={fetchNFTs} />
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="mine"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <MyNFTs NFTCard={NFTCard} onRefresh={fetchNFTs} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default Marketplace;