import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ethers } from "ethers";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { useMarketplace } from "../hooks/useMarketplace";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config/blockchain";
import api from "../utils/api";
import ConnectWallet from "../components/blockchain/ConnectWallet";
import {
  Search, Filter, TrendingUp, Sparkles,
  Home as HomeIcon, Bell, User as UserIcon,
  Compass, ShoppingBag, Mail, Bookmark,
  LogOut, Plus, Tag, X, Loader2, AlertCircle,
  CheckCircle2, ExternalLink,
} from "lucide-react";

// ─── Sidebar (same as existing) ───────────────────────────────────────────────
const Sidebar = ({ user, logout, navigate, location }) => {
  const navLinks = [
    { icon: HomeIcon, label: "Home", path: "/" },
    { icon: Compass, label: "Discover", path: "/discover" },
    { icon: ShoppingBag, label: "Marketplace", path: "/marketplace" },
    { icon: Mail, label: "Messages", path: "/messages" },
    { icon: Bell, label: "Notifications", path: "/notifications", badge: true },
    { icon: Bookmark, label: "Bookmarks", path: "/bookmarks" },
    { icon: UserIcon, label: "Profile", path: "/profile" },
  ];
  return (
    <aside className="hidden lg:flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-hidden transition-all duration-300 ease-in-out group/sidebar"
      style={{ width: "72px", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      onMouseEnter={e => { e.currentTarget.style.width = "240px"; }}
      onMouseLeave={e => { e.currentTarget.style.width = "72px"; }}>
      <div className="px-4 py-6 flex items-center overflow-hidden" style={{ minHeight: "72px" }}>
        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent flex-shrink-0 w-8 text-center">A</span>
        <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-100">URA</span>
      </div>
      <nav className="flex flex-col gap-0.5 flex-1 px-2">
        {navLinks.map(item => (
          <button key={item.path} onClick={() => navigate(item.path)}
            className={`flex items-center rounded-xl transition-all duration-150 group/item relative ${location.pathname === item.path ? "text-white bg-white/10" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            style={{ minHeight: "48px", padding: "0 14px" }}>
            <item.icon className={`w-6 h-6 flex-shrink-0 transition-colors ${location.pathname === item.path ? "text-indigo-400" : "group-hover/item:text-indigo-400"}`} />
            <span className="ml-4 text-[15px] font-medium whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75 flex-1 text-left">{item.label}</span>
            {item.badge && <span className="absolute top-3 left-8 w-2 h-2 rounded-full bg-red-500" />}
          </button>
        ))}
      </nav>
      <div className="px-2 mt-2">
        <button onClick={() => navigate("/create")}
          className="w-full flex items-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-indigo-900/40 overflow-hidden"
          style={{ minHeight: "44px", padding: "0 14px" }}>
          <Plus className="w-5 h-5 flex-shrink-0" />
          <span className="ml-4 whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">Create Memory</span>
        </button>
      </div>
      <div className="mx-2 mt-3 mb-4 flex items-center rounded-xl hover:bg-white/5 transition-colors cursor-pointer group/user overflow-hidden"
        style={{ minHeight: "56px", padding: "0 10px" }} onClick={() => navigate("/profile")}>
        <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          {user?.profilePicture ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" /> : (user?.username?.charAt(0).toUpperCase() || "U")}
        </div>
        <div className="ml-3 flex-1 min-w-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">
          <p className="text-white text-xs font-semibold truncate">{user?.username}</p>
          <p className="text-slate-600 text-xs truncate">{user?.email}</p>
        </div>
        <button onClick={e => { e.stopPropagation(); logout(); navigate("/login"); }}
          className="ml-2 p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover/sidebar:opacity-100 group-hover/user:opacity-100">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

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
      <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="w-full max-w-sm rounded-2xl p-6"
          style={{ background: "#0d0d1a", border: "1px solid rgba(99,102,241,0.25)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
          onClick={e => e.stopPropagation()}>

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-400" />
              <h2 className="text-white font-bold text-lg">List for Sale</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
          </div>

          {success ? (
            <motion.div className="text-center py-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-white font-bold text-lg mb-1">Listed Successfully!</p>
              <p className="text-slate-400 text-sm mb-4">Token #{tokenId} is now on the marketplace</p>
              <motion.button onClick={onClose} className="px-6 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>Done</motion.button>
            </motion.div>
          ) : (
            <>
              <div className="rounded-xl p-3 mb-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-slate-300 text-sm line-clamp-2">{memory.caption}</p>
                {memory.image && <img src={memory.image} alt="" className="w-full h-24 object-cover rounded-lg mt-2" />}
                <p className="text-indigo-400 text-xs mt-2">Token #{tokenId}</p>
              </div>

              <div className="mb-5">
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Price (ETH)</label>
                <input type="number" step="0.001" min="0.001" placeholder="e.g. 0.5"
                  value={price} onChange={e => setPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none"
                  style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.07)" }}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"} />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl text-red-300 text-sm mb-4"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{error}</span>
                </div>
              )}

              <motion.button onClick={handleList} disabled={loading || !price}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 20px rgba(79,70,229,0.35)" }}
                whileHover={!loading ? { scale: 1.02 } : {}} whileTap={!loading ? { scale: 0.98 } : {}}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Listing… confirm in MetaMask</> : <><Tag className="w-4 h-4" /> List for Sale</>}
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
      <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="w-full max-w-sm rounded-2xl p-6"
          style={{ background: "#0d0d1a", border: "1px solid rgba(99,102,241,0.25)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
          onClick={e => e.stopPropagation()}>

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
              <h2 className="text-white font-bold text-lg">Buy NFT</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
          </div>

          {success ? (
            <motion.div className="text-center py-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-white font-bold text-lg mb-1">Purchase Successful!</p>
              <p className="text-slate-400 text-sm mb-4">Token #{tokenId} is now in your wallet</p>
              <motion.button onClick={onClose} className="px-6 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>Done</motion.button>
            </motion.div>
          ) : (
            <>
              <div className="rounded-xl p-3 mb-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-slate-300 text-sm line-clamp-2">{memory.caption}</p>
                {memory.image && <img src={memory.image} alt="" className="w-full h-24 object-cover rounded-lg mt-2" />}
              </div>

              <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Price</span>
                  <span className="text-white font-bold text-xl">{priceEth} ETH</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-slate-600 text-xs">Token #{tokenId}</span>
                  <span className="text-slate-600 text-xs">Hardhat Local</span>
                </div>
              </div>

              {!account && (
                <div className="mb-4 flex justify-center"><ConnectWallet /></div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl text-red-300 text-sm mb-4"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{error}</span>
                </div>
              )}

              {account && (
                <motion.button onClick={handleBuy} disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 20px rgba(79,70,229,0.35)" }}
                  whileHover={!loading ? { scale: 1.02 } : {}} whileTap={!loading ? { scale: 0.98 } : {}}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Buying… confirm in MetaMask</> : <><ShoppingBag className="w-4 h-4" /> Buy for {priceEth} ETH</>}
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
const NFTCard = ({ memory, currentUserAccount, onRefresh }) => {
  const { user } = useAuth();
  const { cancelListing, loading } = useMarketplace();
  const [listModal, setListModal] = useState(false);
  const [buyModal, setBuyModal] = useState(false);

  const tokenId = memory.nftTokenId;
  const priceWei = memory.nftPrice || 0n;
  const priceEth = priceWei > 0n ? ethers.formatEther(priceWei) : null;
  const isListed = priceWei > 0n;
  const isOwner = String(memory.user?._id || memory.user?.id) === String(user?.id);

  const handleCancel = async () => {
    const result = await cancelListing(tokenId);
    if (result) onRefresh();
  };

  return (
    <>
      <motion.div className="rounded-2xl overflow-hidden group"
        style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}
        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
        whileHover={{ scale: 1.02, borderColor: "rgba(99,102,241,0.3)" }}>

        {/* Image */}
        <div className="w-full h-44 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,rgba(79,70,229,0.15),rgba(124,58,237,0.1))" }}>
          {memory.image ? (
            <img src={memory.image} alt="Memory" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <Sparkles className="w-10 h-10 text-indigo-400/50 mb-2" />
              <p className="text-slate-600 text-xs">Memory NFT</p>
            </div>
          )}
          {/* Price badge */}
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-white text-xs font-bold"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}>
            {isListed ? `${priceEth} ETH` : "Not listed"}
          </div>
          {/* NFT badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-indigo-300"
            style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)" }}>
            <Sparkles className="w-3 h-3" /> #{tokenId}
          </div>
        </div>

        {/* Content */}
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
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {memory.user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="text-slate-500 text-xs">{memory.user?.username || "Unknown"}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {isOwner ? (
              isListed ? (
                <motion.button onClick={handleCancel} disabled={loading}
                  className="flex-1 py-2 rounded-xl text-red-300 text-xs font-semibold transition-all disabled:opacity-50"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  {loading ? "Cancelling…" : "Cancel Listing"}
                </motion.button>
              ) : (
                <motion.button onClick={() => setListModal(true)}
                  className="flex-1 py-2 rounded-xl text-white text-xs font-semibold"
                  style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Tag className="w-3 h-3 inline mr-1" />List for Sale
                </motion.button>
              )
            ) : (
              isListed ? (
                <motion.button onClick={() => setBuyModal(true)}
                  className="flex-1 py-2 rounded-xl text-white text-xs font-semibold"
                  style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  Buy {priceEth} ETH
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
  const [nftMemories, setNftMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [stats, setStats] = useState({ totalMemories: 0, totalLikes: 0, activeSellers: 0, floorPrice: 0, volume24h: 0 });
  const { user, logout } = useAuth();
  const { account } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchNFTs = useCallback(async () => {
    try {
      setLoading(true);
      const r = await api.get("/memories/feed?limit=50");
      if (!r.data.success) return;

      const allMemories = r.data.memories;

      // Filter only minted NFTs
      const minted = allMemories.filter(m => m.nftTokenId);

      if (minted.length === 0) { setNftMemories([]); return; }

      // Fetch on-chain prices for all minted NFTs
      if (!window.ethereum) { setNftMemories(minted); return; }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const withPrices = await Promise.all(
        minted.map(async (m) => {
          try {
            const price = await contract.tokenPrice(m.nftTokenId);
            return { ...m, nftPrice: price };
          } catch {
            return { ...m, nftPrice: 0n };
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
    <div className="min-h-screen text-white" style={{ background: "#0d0d1a" }}>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">AURA</span>
        <ConnectWallet compact />
      </div>

      <div className="flex">
        <Sidebar user={user} logout={logout} navigate={navigate} location={location} />

        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="sticky top-0 z-40 px-6 py-4"
            style={{ background: "#0d0d1a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-indigo-400" />Marketplace
                </h1>
                <p className="text-slate-600 text-xs mt-0.5">Buy and sell memory NFTs</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                    <input type="text" placeholder="Search NFTs…" value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none w-48"
                      style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.07)" }}
                      onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.4)"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"} />
                  </div>
                  <select value={filter} onChange={e => setFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl text-slate-300 text-sm focus:outline-none cursor-pointer"
                    style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {["All", "Listed", "Not Listed"].map(v => <option key={v} value={v} style={{ background: "#13132a" }}>{v}</option>)}
                  </select>
                </div>
                <ConnectWallet compact />
              </div>
            </div>
          </div>

          <div className="px-6 py-6 pb-24 lg:pb-8 space-y-6">

            {/* Stats */}
            <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              {[
                { label: "Total NFTs", value: nftMemories.length },
                { label: "Listed", value: listedCount },
                { label: "Not Listed", value: notListedCount },
                { label: "Total Memories", value: stats.totalMemories },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-2xl p-4"
                  style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="text-slate-600 text-xs mb-1">{label}</p>
                  <p className="text-xl font-bold text-white">{value}</p>
                </div>
              ))}
            </motion.div>

            {/* No wallet warning */}
            {!account && (
              <motion.div className="rounded-2xl p-5 flex items-center gap-4"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Sparkles className="w-8 h-8 text-indigo-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">Connect your wallet to buy and sell NFTs</p>
                  <p className="text-slate-500 text-xs mt-0.5">You need MetaMask connected to Hardhat Local to interact with the marketplace.</p>
                </div>
                <ConnectWallet />
              </motion.div>
            )}

            {/* NFT Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                  {filter === "All" ? "All NFTs" : filter}
                </h2>
                {!loading && <span className="text-slate-600 text-xs">{filtered.length} items</span>}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden animate-pulse"
                      style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="w-full h-44 bg-slate-800" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-slate-800 rounded w-3/4" />
                        <div className="h-3 bg-slate-800 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 rounded-2xl"
                  style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <Sparkles className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm mb-1">
                    {nftMemories.length === 0 ? "No NFTs minted yet" : "No NFTs match your filter"}
                  </p>
                  {nftMemories.length === 0 && (
                    <p className="text-slate-700 text-xs">Go to your feed and mint a memory as NFT first</p>
                  )}
                </div>
              ) : (
                <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                  initial="hidden" animate="visible"
                  variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}>
                  {filtered.map((memory) => (
                    <NFTCard key={memory._id} memory={memory}
                      currentUserAccount={account} onRefresh={fetchNFTs} />
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-white/[0.05] px-2 py-2 z-50"
        style={{ background: "#0d0d1a" }}>
        <div className="flex items-center justify-around max-w-sm mx-auto">
          {[
            { icon: HomeIcon, path: "/" },
            { icon: Search, path: "/search" },
            { icon: Plus, path: "/create", fab: true },
            { icon: Bell, path: "/notifications" },
            { icon: UserIcon, path: "/profile" },
          ].map(({ icon: Icon, path, fab }) => (
            <button key={path} onClick={() => navigate(path)}
              className={fab
                ? "w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg"
                : `p-2.5 rounded-xl transition-colors ${location.pathname === path ? "text-indigo-400 bg-indigo-400/10" : "text-slate-500 hover:text-white"}`}>
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Marketplace;