/**
 * blockchain.js — Central config for blockchain integration.
 * Place at: frontend/src/config/blockchain.js
 */

export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const NETWORK = {
    chainId: 31337,  // Hardhat localhost (change to 80002 for Amoy when ready)
    name: "Hardhat Local",
    explorerUrl: "",
    openseaUrl: "",
};

// ABI matches the current lean contract exactly
export const CONTRACT_ABI = [
    "function mintMemory(address to, string mongoId) returns (uint256)",
    "function listMemory(uint256 tokenId, uint256 price)",
    "function cancelListing(uint256 tokenId)",
    "function buyMemory(uint256 tokenId) payable",
    "function memoryToToken(string) view returns (uint256)",
    "function tokenMongoId(uint256) view returns (string)",
    "function tokenPrice(uint256) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function balanceOf(address owner) view returns (uint256)",
    "function setBaseURI(string baseURI)",
    "function withdraw()",
    "function owner() view returns (address)",
    "event MemoryMinted(uint256 indexed tokenId, address indexed minter, string mongoId)",
    "event MemoryListed(uint256 indexed tokenId, uint256 price)",
    "event MemorySold(uint256 indexed tokenId, address indexed buyer, uint256 price)",
];