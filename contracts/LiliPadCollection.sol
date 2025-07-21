// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

/**
 * @title LiliPadCollection
 * @notice ERC-721 NFT collection with batch minting, royalties, supply cap, mint window, and owner withdrawal logic.
 */
contract LiliPadCollection is ERC721Enumerable, Ownable, ReentrancyGuard, IERC2981 {
    using Strings for uint256;

    string public baseURI;
    string public collectionURI;
    uint256 public maxSupply;
    uint256 public mintPrice;
    uint96 public royaltyBps;
    address public royaltyRecipient;
    uint256 public mintStart;
    uint256 public mintEnd;
    uint256 public minted;
    bool public launched;

    // Track original minter if needed (optional)
    // mapping(uint256 => address) public minters;

    event Mint(address indexed minter, uint256 indexed tokenId);
    event Withdraw(address indexed to, uint256 amount);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        string memory _collectionURI,
        uint256 _maxSupply,
        uint256 _mintPrice,
        uint96 _royaltyBps,
        address _royaltyRecipient,
        uint256 _mintStart,
        uint256 _mintEnd,
        address _owner
    ) ERC721(_name, _symbol) {
        require(_maxSupply > 0, "No supply");
        require(_royaltyRecipient != address(0), "Royalty recipient");
        require(_mintEnd > _mintStart, "Invalid window");
        baseURI = _baseURI;
        collectionURI = _collectionURI;
        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
        royaltyBps = _royaltyBps;
        royaltyRecipient = _royaltyRecipient;
        mintStart = _mintStart;
        mintEnd = _mintEnd;
        _transferOwnership(_owner);
    }

    function mint(uint256 amount) external payable nonReentrant {
        require(block.timestamp >= mintStart && block.timestamp <= mintEnd, "Not in mint window");
        require(amount > 0, "Zero amount");
        require(minted + amount <= maxSupply, "Exceeds supply");
        require(msg.value >= mintPrice * amount, "Insufficient payment");
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = minted + 1;
            _safeMint(msg.sender, tokenId);
            // minters[tokenId] = msg.sender;
            emit Mint(msg.sender, tokenId);
            minted++;
        }
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Nonexistent token");
        return string(abi.encodePacked(baseURI, tokenId.toString(), ".json"));
    }

    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
    }

    function setCollectionURI(string memory _uri) external onlyOwner {
        collectionURI = _uri;
    }

    function withdraw() external onlyOwner nonReentrant {
        require(minted * 10 >= maxSupply, "10% not minted");
        uint256 bal = address(this).balance;
        require(bal > 0, "No balance");
        (bool sent, ) = owner().call{value: bal}("");
        require(sent, "Withdraw failed");
        emit Withdraw(owner(), bal);
    }

    // EIP-2981 royalty info
    function royaltyInfo(uint256, uint256 salePrice) external view override returns (address, uint256) {
        uint256 royaltyAmount = (salePrice * royaltyBps) / 10000;
        return (royaltyRecipient, royaltyAmount);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable, IERC165) returns (bool) {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }

    // Collection-level metadata URI (OpenSea, etc.)
    function contractURI() public view returns (string memory) {
        return collectionURI;
    }

    // Mint window info
    function mintWindow() public view returns (uint256, uint256) {
        return (mintStart, mintEnd);
    }

    // Max supply
    function maxSupplyValue() public view returns (uint256) {
        return maxSupply;
    }

    // Mint price
    function mintPriceValue() public view returns (uint256) {
        return mintPrice;
    }
} 