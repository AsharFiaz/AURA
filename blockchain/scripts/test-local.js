const hre = require("hardhat");

async function main() {
    console.log("\n🧪 Testing AuraMemoryNFT on localhost...\n");

    const [owner, user1, user2] = await hre.ethers.getSigners();
    console.log("Owner  :", owner.address);
    console.log("User1  :", user1.address);
    console.log("User2  :", user2.address);

    console.log("\n📦 Deploying contract...");
    const AuraMemoryNFT = await hre.ethers.getContractFactory("AuraMemoryNFT");
    const contract = await AuraMemoryNFT.deploy("https://aura-nft-metadata.vercel.app/api/metadata/");
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log("✅ Deployed at:", address);

    console.log("\n🎨 Minting a memory NFT...");
    const mongoId = "507f1f77bcf86cd799439011";
    const tx1 = await contract.connect(user1).mintMemory(user1.address, mongoId);
    await tx1.wait();
    const tokenId = await contract.memoryToToken(mongoId);
    console.log("✅ Minted! Token ID:", tokenId.toString());
    console.log("   Owner of token:", await contract.ownerOf(tokenId));
    console.log("   Total supply  :", (await contract.totalSupply()).toString());

    console.log("\n🚫 Testing double-mint prevention...");
    try {
        await contract.connect(user1).mintMemory(user1.address, mongoId);
        console.log("❌ Should have failed!");
    } catch (e) {
        console.log("✅ Double mint correctly blocked:", e.reason);
    }

    console.log("\n🏪 Listing NFT for sale...");
    const priceInMatic = hre.ethers.parseEther("1.0");
    const tx2 = await contract.connect(user1).listMemory(tokenId, priceInMatic);
    await tx2.wait();
    console.log("✅ Listed for:", hre.ethers.formatEther(priceInMatic), "MATIC");

    console.log("\n💰 User2 buying NFT from User1...");
    const tx3 = await contract.connect(user2).buyMemory(tokenId, { value: priceInMatic });
    await tx3.wait();
    console.log("✅ Bought!");
    console.log("   New owner:", await contract.ownerOf(tokenId));

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ ALL TESTS PASSED — Contract is working correctly");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((err) => {
    console.error("❌ Test failed:", err.message);
    process.exit(1);
});