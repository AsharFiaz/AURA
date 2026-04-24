const hre = require("hardhat");

async function main() {
    console.log("\n🚀 Deploying AuraMemoryNFT to Amoy Testnet...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Deployer balance:", hre.ethers.formatEther(balance), "MATIC\n");

    if (balance === 0n) {
        console.error("❌ No MATIC! Get test MATIC from https://faucet.polygon.technology/");
        process.exit(1);
    }

    // Base URI — tokenURI will be baseURI + tokenId
    // You can update this later with setBaseURI() once you have a real metadata server
    const BASE_URI = "https://aura-nft-metadata.vercel.app/api/metadata/";

    const AuraMemoryNFT = await hre.ethers.getContractFactory("AuraMemoryNFT");
    const contract = await AuraMemoryNFT.deploy(BASE_URI);
    await contract.waitForDeployment();

    const address = await contract.getAddress();

    console.log("✅ AuraMemoryNFT deployed!");
    console.log("📍 Contract address:", address);
    console.log("🔗 Explorer: https://amoy.polygonscan.com/address/" + address);
    console.log("\n👉 Paste this address into frontend/src/config/blockchain.js → CONTRACT_ADDRESS\n");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});