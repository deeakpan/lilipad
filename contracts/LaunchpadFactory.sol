// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./LaunchpadCollection.sol";

/**
 * @title LaunchpadFactory
 * @notice Deploys and tracks NFT collection contracts with launch fees and platform logic.
 */
contract LaunchpadFactory is Ownable {
    // Fixed launch fee in wei (e.g., $5 in native token)
    uint256 public launchFee;
    // Platform fee percent (e.g., 5% = 500, 2 decimals)
    uint256 public platformFeeBps; // 500 = 5%
    // All deployed collections
    address[] public collections;
    // Vanity URL mapping (lowercase, min 4 chars)
    mapping(string => address) public vanityToCollection;
    address public withdrawManager;

    event CollectionDeployed(address indexed collection, address indexed owner, string vanity);

    constructor(uint256 _initialLaunchFee, uint256 _platformFeeBps, address _withdrawManager) {
        launchFee = _initialLaunchFee;
        platformFeeBps = _platformFeeBps;
        withdrawManager = _withdrawManager;
    }

    function setLaunchFee(uint256 _fee) external onlyOwner {
        launchFee = _fee;
    }

    function setPlatformFeeBps(uint256 _bps) external onlyOwner {
        require(_bps <= 10000, "Too high");
        platformFeeBps = _bps;
    }

    modifier onlyWithdrawer() {
        require(msg.sender == owner() || msg.sender == withdrawManager, "Not authorized");
        _;
    }

    /**
     * @notice Deploy a new NFT collection contract.
     * @param name Collection name
     * @param symbol Collection symbol
     * @param baseURI Metadata base URI
     * @param collectionURI Collection-level metadata URI
     * @param maxSupply Max supply
     * @param mintPrice Mint price per NFT
     * @param royaltyBps Royalty percent (e.g., 500 = 5%)
     * @param royaltyRecipient Royalty recipient
     * @param mintStart Mint window start (timestamp)
     * @param mintEnd Mint window end (timestamp)
     * @param vanity Vanity URL (min 4 chars, unique, lowercase)
     */
    function deployCollection(
        string memory name,
        string memory symbol,
        string memory baseURI,
        string memory collectionURI,
        uint256 maxSupply,
        uint256 mintPrice,
        uint96 royaltyBps,
        address royaltyRecipient,
        uint256 mintStart,
        uint256 mintEnd,
        string memory vanity
    ) external payable returns (address) {
        require(bytes(vanity).length >= 4, "Vanity too short");
        require(vanityToCollection[vanity] == address(0), "Vanity taken");
        require(mintEnd > mintStart, "Invalid window");
        require(maxSupply > 0, "No supply");
        require(royaltyBps <= 5000, "Royalty too high"); // max 50%
        require(royaltyRecipient != address(0), "Royalty recipient");

        uint256 totalPlatformFee = launchFee + (maxSupply * mintPrice * platformFeeBps) / 10000;
        require(msg.value >= totalPlatformFee, "Insufficient launch fee");
        // No fee forwarding, accumulate in contract

        LaunchpadCollection collection = new LaunchpadCollection(
            name,
            symbol,
            baseURI,
            collectionURI,
            maxSupply,
            mintPrice,
            royaltyBps,
            royaltyRecipient,
            mintStart,
            mintEnd,
            msg.sender
        );
        collections.push(address(collection));
        vanityToCollection[vanity] = address(collection);
        emit CollectionDeployed(address(collection), msg.sender, vanity);
        return address(collection);
    }

    function getCollections() external view returns (address[] memory) {
        return collections;
    }

    // Owner can withdraw all accumulated fees
    function withdraw() external onlyWithdrawer {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        (bool sent, ) = owner().call{value: balance}("");
        require(sent, "Withdraw failed");
    }
} 