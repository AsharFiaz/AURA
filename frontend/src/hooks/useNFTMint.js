import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config/blockchain";

export const useNFTMint = () => {
    const { signer, account, isCorrectNetwork } = useWallet();
    const [minting, setMinting] = useState(false);
    const [mintedId, setMintedId] = useState(null);
    const [error, setError] = useState(null);
    const [txHash, setTxHash] = useState(null);

    const mintMemory = useCallback(async (memory, authUser) => {
        setError(null); setMintedId(null); setTxHash(null);

        if (!account || !signer) { setError("Please connect your wallet first."); return null; }
        if (!isCorrectNetwork) { setError("Please switch to the correct network in MetaMask."); return null; }

        const memoryOwnerId = memory.user?._id || memory.user?.id || memory.user;
        const currentUserId = authUser?.id || authUser?._id;
        if (String(memoryOwnerId) !== String(currentUserId)) { setError("You can only mint your own memories as NFTs."); return null; }
        if (memory.nftTokenId) { setError("This memory has already been minted as an NFT."); return null; }

        const mongoId = memory._id || memory.id;
        if (!mongoId) { setError("Memory ID not found."); return null; }

        setMinting(true);
        try {
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            const code = await signer.provider.getCode(CONTRACT_ADDRESS);
            console.log("=== DEBUG ===");
            console.log("chainId:", (await signer.provider.getNetwork()).chainId.toString());
            console.log("CONTRACT_ADDRESS:", CONTRACT_ADDRESS);
            console.log("bytecode:", code);
            if (code === "0x") {
                setError("No contract found at " + CONTRACT_ADDRESS + " — redeploy first.");
                setMinting(false);
                return null;
            }

            const existingToken = await contract.memoryToToken(mongoId);
            if (existingToken > 0n) { setError("Already minted on-chain."); setMinting(false); return null; }

            const tx = await contract.mintMemory(account, mongoId);
            setTxHash(tx.hash);
            const receipt = await tx.wait();

            const event = receipt.logs
                .map(log => { try { return contract.interface.parseLog(log); } catch { return null; } })
                .find(e => e?.name === "MemoryMinted");

            const tokenId = event ? Number(event.args.tokenId) : null;
            setMintedId(tokenId);
            return { tokenId, txHash: tx.hash };
        } catch (err) {
            if (err.code === 4001) setError("Transaction rejected in MetaMask.");
            else if (err.message?.includes("Already minted")) setError("This memory is already minted as an NFT.");
            else setError(err.reason || err.message || "Minting failed.");
            return null;
        } finally { setMinting(false); }
    }, [account, signer, isCorrectNetwork]);

    const reset = useCallback(() => { setError(null); setMintedId(null); setTxHash(null); }, []);
    return { mintMemory, minting, mintedId, txHash, error, reset };
};