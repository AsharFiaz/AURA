/**
 * WalletTestPage.jsx
 * 
 * A standalone test page to verify wallet connection is working.
 * Add route: <Route path="/wallet-test" element={<WalletTestPage />} />
 * Then visit http://localhost:3000/wallet-test
 * 
 * Remove this page once you've confirmed everything works.
 */

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, Wallet, ExternalLink } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import ConnectWallet from "../components/blockchain/ConnectWallet";

const Check = ({ ok, label }) => (
    <div className="flex items-center gap-3 py-2.5 px-4 rounded-xl"
        style={{ background: ok ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)", border: `1px solid ${ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
        {ok
            ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
        <span className={`text-sm ${ok ? "text-green-300" : "text-red-300"}`}>{label}</span>
    </div>
);

const WalletTestPage = () => {
    const { account, balance, chainId, isCorrectNetwork, provider, signer } = useWallet();

    const checks = [
        { ok: !!window.ethereum, label: "MetaMask detected in browser" },
        { ok: !!account, label: `Wallet connected (${account ? account.slice(0, 10) + "…" : "not connected"})` },
        { ok: isCorrectNetwork, label: `Correct network — Mumbai Testnet (need chain 80001 or 80002, current: ${chainId ?? "N/A"})` },
        { ok: !!provider, label: "ethers.js BrowserProvider initialized" },
        { ok: !!signer, label: "Signer available (can sign transactions)" },
        { ok: balance !== null, label: `Balance readable: ${balance ?? "N/A"} MATIC` },
    ];

    const allPassed = checks.every((c) => c.ok);

    return (
        <div className="min-h-screen text-white flex flex-col items-center justify-center p-6"
            style={{ background: "#0d0d1a" }}>

            <motion.div
                className="w-full max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 32px rgba(99,102,241,0.3)" }}>
                        <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">Wallet Connection Test</h1>
                    <p className="text-slate-500 text-sm">Step 1 of the blockchain integration</p>
                </div>

                {/* Connect button */}
                <div className="flex justify-center mb-8">
                    <ConnectWallet />
                </div>

                {/* Checklist */}
                <div
                    className="rounded-2xl p-5 mb-6"
                    style={{ background: "#13132a", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                    <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">
                        Integration Checks
                    </h2>
                    <div className="space-y-2">
                        {checks.map((c, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.07 }}
                            >
                                <Check ok={c.ok} label={c.label} />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Result banner */}
                {account && (
                    <motion.div
                        className="rounded-2xl p-5 mb-6 text-center"
                        style={{
                            background: allPassed ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
                            border: `1px solid ${allPassed ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
                        }}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        {allPassed ? (
                            <>
                                <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                <p className="text-green-300 font-semibold">All checks passed!</p>
                                <p className="text-slate-500 text-xs mt-1">
                                    Wallet is connected and ready for Step 2 — Smart Contract deployment.
                                </p>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                                <p className="text-yellow-300 font-semibold">Some checks need attention</p>
                                <p className="text-slate-500 text-xs mt-1">
                                    Fix the failing checks above before proceeding.
                                </p>
                            </>
                        )}
                    </motion.div>
                )}

                {/* Raw debug info */}
                {account && (
                    <div
                        className="rounded-xl p-4 font-mono text-xs text-slate-500"
                        style={{ background: "#0a0a14", border: "1px solid rgba(255,255,255,0.04)" }}
                    >
                        <p className="text-slate-400 font-semibold mb-2">Debug Info</p>
                        <p>account: <span className="text-indigo-400">{account}</span></p>
                        <p>chainId: <span className="text-indigo-400">{chainId}</span></p>
                        <p>balance: <span className="text-indigo-400">{balance} MATIC</span></p>
                        <p>isCorrectNetwork: <span className={isCorrectNetwork ? "text-green-400" : "text-red-400"}>{String(isCorrectNetwork)}</span></p>
                        <p>provider: <span className="text-indigo-400">{provider ? "BrowserProvider ✓" : "null"}</span></p>
                        <p>signer: <span className="text-indigo-400">{signer ? "JsonRpcSigner ✓" : "null"}</span></p>
                    </div>
                )}

                {/* Next steps */}
                <div className="mt-6 p-4 rounded-xl"
                    style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
                    <p className="text-indigo-400 text-xs font-semibold mb-2">NEXT STEPS</p>
                    <ol className="text-slate-500 text-xs space-y-1 list-decimal list-inside">
                        <li>Get free test MATIC from{" "}
                            <a href="https://faucet.polygon.technology/" target="_blank" rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1">
                                polygon faucet <ExternalLink className="w-3 h-3" />
                            </a>
                        </li>
                        <li>Once all checks are green → proceed to Step 2 (Smart Contract)</li>
                    </ol>
                </div>
            </motion.div>
        </div>
    );
};

export default WalletTestPage;
