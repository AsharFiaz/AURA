// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title AuraMemoryNFT
 * @dev Minimal ERC-721 — no URIStorage, no Ownable, no Counters.
 *      tokenURI is built from a base URL + tokenId (cheapest possible).
 */
contract AuraMemoryNFT is ERC721 {

    address public owner;
    uint256 private _nextTokenId = 1;
    string  private _baseTokenURI;

    // Only store what we absolutely need on-chain
    mapping(uint256 => string)  public tokenMongoId;   // tokenId → mongoId
    mapping(string  => uint256) public memoryToToken;  // mongoId → tokenId
    mapping(uint256 => uint256) public tokenPrice;     // 0 = not listed

    event MemoryMinted(uint256 indexed tokenId, address indexed minter, string mongoId);
    event MemoryListed(uint256 indexed tokenId, uint256 price);
    event MemorySold(uint256 indexed tokenId, address indexed buyer, uint256 price);

    constructor(string memory baseURI) ERC721("AURA Memory NFT", "AURA") {
        owner        = msg.sender;
        _baseTokenURI = baseURI;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // tokenURI = baseURI + tokenId  (e.g. "https://aura.app/nft/metadata/42")
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function mintMemory(
        address to,
        string calldata mongoId
    ) external returns (uint256) {
        require(bytes(mongoId).length > 0, "No mongoId");
        require(memoryToToken[mongoId] == 0, "Already minted");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        tokenMongoId[tokenId]   = mongoId;
        memoryToToken[mongoId]  = tokenId;

        emit MemoryMinted(tokenId, to, mongoId);
        return tokenId;
    }

    function listMemory(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(price > 0, "Price = 0");
        tokenPrice[tokenId] = price;
        emit MemoryListed(tokenId, price);
    }

    function cancelListing(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        tokenPrice[tokenId] = 0;
    }

    function buyMemory(uint256 tokenId) external payable {
        uint256 price = tokenPrice[tokenId];
        require(price > 0, "Not listed");
        require(msg.value >= price, "Low payment");

        address seller = ownerOf(tokenId);
        require(seller != msg.sender, "Own NFT");

        tokenPrice[tokenId] = 0;
        _transfer(seller, msg.sender, tokenId);
        payable(seller).transfer(price);
        if (msg.value > price) payable(msg.sender).transfer(msg.value - price);

        emit MemorySold(tokenId, msg.sender, price);
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
