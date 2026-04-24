import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { ethers } from "ethers";

const WalletContext = createContext();

// Mumbai Testnet chain config
const MUMBAI_CHAIN = {
    chainId: "0x13882", // 80002 in hex (Polygon Amoy - latest Mumbai replacement)
    chainName: "Polygon Amoy Testnet",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    rpcUrls: ["https://rpc-amoy.polygon.technology/"],
    blockExplorerUrls: ["https://amoy.polygonscan.com/"],
};

// Fallback: original Mumbai (80001) - try this if Amoy doesn't work
const MUMBAI_CHAIN_OLD = {
    chainId: "0x13881",
    chainName: "Polygon Mumbai Testnet",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
    blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
};

export const WalletProvider = ({ children }) => {
    const [account, setAccount] = useState(null);         // wallet address
    const [balance, setBalance] = useState(null);         // MATIC balance
    const [provider, setProvider] = useState(null);       // ethers provider
    const [signer, setSigner] = useState(null);           // ethers signer
    const [chainId, setChainId] = useState(null);         // current chain
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState(null);

    const EXPECTED_CHAIN_ID = 31337; // Hardhat Local

    // ── Fetch balance ────────────────────────────────────────────────────────────
    const fetchBalance = useCallback(async (addr, prov) => {
        try {
            const bal = await prov.getBalance(addr);
            setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
        } catch {
            setBalance("0.0000");
        }
    }, []);

    // ── Switch / add Mumbai network ──────────────────────────────────────────────
    const switchToMumbai = useCallback(async () => {
        if (!window.ethereum) return;
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0x7A69" }], // 31337 in hex
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId: "0x7A69",
                        chainName: "Hardhat Local",
                        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                        rpcUrls: ["http://127.0.0.1:8545"],
                    }],
                });
            }
        }
    }, []);

    // ── Setup provider & signer ──────────────────────────────────────────────────
    const setupProvider = useCallback(async (addr) => {
        const prov = new ethers.BrowserProvider(window.ethereum);
        const sign = await prov.getSigner();
        const network = await prov.getNetwork();
        const cId = Number(network.chainId);

        setProvider(prov);
        setSigner(sign);
        setChainId(cId);
        setIsCorrectNetwork(cId === 31337);
        await fetchBalance(addr, prov);
    }, [fetchBalance]);

    // ── Connect wallet ───────────────────────────────────────────────────────────
    const connectWallet = useCallback(async () => {
        setError(null);

        if (!window.ethereum) {
            setError("MetaMask not found. Please install it from metamask.io");
            return;
        }

        setConnecting(true);
        try {
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });

            if (accounts.length > 0) {
                const addr = accounts[0];
                setAccount(addr);

                // Switch network FIRST before setting up provider
                const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
                const currentChain = parseInt(chainIdHex, 16);
                if (currentChain !== 31337) {
                    await switchToMumbai();
                    // Wait for MetaMask to actually switch
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                // NOW setup provider after network is correct
                await setupProvider(addr);

                localStorage.setItem("walletConnected", "true");
            }
        } catch (err) {
            if (err.code === 4001) {
                setError("Connection rejected. Please approve the MetaMask request.");
            } else {
                setError(err.message || "Failed to connect wallet.");
            }
        } finally {
            setConnecting(false);
        }
    }, [setupProvider, switchToMumbai]);

    // ── Disconnect wallet ────────────────────────────────────────────────────────
    const disconnectWallet = useCallback(() => {
        setAccount(null);
        setBalance(null);
        setProvider(null);
        setSigner(null);
        setChainId(null);
        setIsCorrectNetwork(false);
        setError(null);
        localStorage.removeItem("walletConnected");
    }, []);

    // ── Auto-reconnect on page load ──────────────────────────────────────────────
    useEffect(() => {
        const autoReconnect = async () => {
            if (!window.ethereum) return;
            if (localStorage.getItem("walletConnected") !== "true") return;

            try {
                const accounts = await window.ethereum.request({ method: "eth_accounts" });
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    await setupProvider(accounts[0]);
                }
            } catch {
                localStorage.removeItem("walletConnected");
            }
        };
        autoReconnect();
    }, [setupProvider]);

    // ── Listen for MetaMask events ───────────────────────────────────────────────
    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = async (accounts) => {
            if (accounts.length === 0) {
                disconnectWallet();
            } else {
                setAccount(accounts[0]);
                await setupProvider(accounts[0]);
            }
        };

        const handleChainChanged = (chainIdHex) => {
            const cId = parseInt(chainIdHex, 16);
            setChainId(cId);
            setIsCorrectNetwork(cId === 31337);
            // Reload provider on chain change
            if (account) setupProvider(account);
        };

        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);

        return () => {
            window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
            window.ethereum.removeListener("chainChanged", handleChainChanged);
        };
    }, [account, disconnectWallet, setupProvider]);

    // ── Format address for display ───────────────────────────────────────────────
    const shortAddress = account
        ? `${account.slice(0, 6)}…${account.slice(-4)}`
        : null;

    return (
        <WalletContext.Provider
            value={{
                account,
                shortAddress,
                balance,
                provider,
                signer,
                chainId,
                isCorrectNetwork,
                connecting,
                error,
                connectWallet,
                disconnectWallet,
                switchToMumbai,
                fetchBalance,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) throw new Error("useWallet must be used within a WalletProvider");
    return context;
};
