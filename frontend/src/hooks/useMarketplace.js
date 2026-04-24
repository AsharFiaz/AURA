import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config/blockchain";

/**
 * useMarketplace
 * Handles listing, cancelling, and buying NFTs on-chain.
 */
export const useMarketplace = () => {
    const { signer, account, isCorrectNetwork } = useWallet();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [txHash, setTxHash] = useState(null);

    const getContract = useCallback(() => {
        if (!signer) return null;
        return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    }, [signer]);

    // ── List NFT for sale ──────────────────────────────────────────────────────
    const listNFT = useCallback(async (tokenId, priceInEth) => {
        setError(null); setTxHash(null);
        if (!account || !signer) { setError("Connect your wallet first."); return null; }
        if (!isCorrectNetwork) { setError("Switch to Hardhat Local network."); return null; }

        setLoading(true);
        try {
            const contract = getContract();
            const price = ethers.parseEther(priceInEth.toString());
            const tx = await contract.listMemory(tokenId, price);
            setTxHash(tx.hash);
            await tx.wait();
            console.log("[Marketplace] Listed token", tokenId, "for", priceInEth, "ETH");
            return { txHash: tx.hash };
        } catch (err) {
            if (err.code === 4001) setError("Transaction rejected.");
            else setError(err.reason || err.message || "Listing failed.");
            return null;
        } finally { setLoading(false); }
    }, [account, signer, isCorrectNetwork, getContract]);

    // ── Cancel listing ─────────────────────────────────────────────────────────
    const cancelListing = useCallback(async (tokenId) => {
        setError(null); setTxHash(null);
        if (!account || !signer) { setError("Connect your wallet first."); return null; }

        setLoading(true);
        try {
            const contract = getContract();
            const tx = await contract.cancelListing(tokenId);
            setTxHash(tx.hash);
            await tx.wait();
            return { txHash: tx.hash };
        } catch (err) {
            if (err.code === 4001) setError("Transaction rejected.");
            else setError(err.reason || err.message || "Cancel failed.");
            return null;
        } finally { setLoading(false); }
    }, [account, signer, getContract]);

    // ── Buy NFT ────────────────────────────────────────────────────────────────
    const buyNFT = useCallback(async (tokenId, priceInEth) => {
        setError(null); setTxHash(null);
        if (!account || !signer) { setError("Connect your wallet first."); return null; }
        if (!isCorrectNetwork) { setError("Switch to Hardhat Local network."); return null; }

        setLoading(true);
        try {
            const contract = getContract();
            const value = ethers.parseEther(priceInEth.toString());
            const tx = await contract.buyMemory(tokenId, { value });
            setTxHash(tx.hash);
            await tx.wait();
            console.log("[Marketplace] Bought token", tokenId);
            return { txHash: tx.hash };
        } catch (err) {
            if (err.code === 4001) setError("Transaction rejected.");
            else if (err.message?.includes("Not listed")) setError("This NFT is no longer for sale.");
            else if (err.message?.includes("Own NFT")) setError("You already own this NFT.");
            else setError(err.reason || err.message || "Purchase failed.");
            return null;
        } finally { setLoading(false); }
    }, [account, signer, isCorrectNetwork, getContract]);

    // ── Read on-chain price for a tokenId ─────────────────────────────────────
    const getTokenPrice = useCallback(async (tokenId) => {
        try {
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS, CONTRACT_ABI,
                new ethers.BrowserProvider(window.ethereum)
            );
            const price = await contract.tokenPrice(tokenId);
            return price;
        } catch { return 0n; }
    }, []);

    const reset = useCallback(() => { setError(null); setTxHash(null); }, []);

    return { listNFT, cancelListing, buyNFT, getTokenPrice, loading, error, txHash, reset };
};