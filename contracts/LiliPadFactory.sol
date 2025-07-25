// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./LiliPadCollection.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Interface for the staking contract
interface ILiliPadStaking {
    function isEligible(address user) external view returns (bool);
    function getUserDiscount(address user) external view returns (uint8 tier, uint256 discountBps);
}

/**
 * @title LiliPadFactory
 * @notice Deploys and tracks NFT collection contracts with launch fees and platform logic.
 */
contract LiliPadFactory is Ownable {
    // Fixed launch fee in wei (e.g., $5 in native token)
    uint256 public launchFee;
    // Platform fee percent (e.g., 5% = 500, 2 decimals)
    uint256 public platformFeeBps; // 500 = 5%
    // All deployed collections
    address[] public collections;
    // Vanity URL mapping (lowercase, min 4 chars)
    mapping(string => address) public vanityToCollection;
    address public withdrawManager;
    address public constant LILI_TOKEN = 0xaFD224042abbd3c51B82C9f43B681014c12649ca;
    // Staking contract address
    ILiliPadStaking public stakingContract;

    event CollectionDeployedMain(
        address indexed collection,
        address indexed owner,
        string vanity
    );
    event CollectionDeployedDetails(
        address indexed collection,
        string name,
        string symbol,
        string baseURI,
        string collectionURI,
        uint256 maxSupply,
        uint256 mintPrice,
        uint96 royaltyBps,
        address royaltyRecipient,
        uint256 mintStart,
        uint256 mintEnd,
        address customMintToken,
        uint256 customMintPrice,
        uint256 discountBps,
        uint256 finalFeePaid
    );

    constructor(uint256 _initialLaunchFee, uint256 _platformFeeBps, address _withdrawManager, address _stakingContract) {
        launchFee = _initialLaunchFee;
        platformFeeBps = _platformFeeBps;
        withdrawManager = _withdrawManager;
        stakingContract = ILiliPadStaking(_stakingContract);
    }

    function setLaunchFee(uint256 _fee) external onlyOwner {
        launchFee = _fee;
    }

    function setPlatformFeeBps(uint256 _bps) external onlyOwner {
        require(_bps <= 10000, "Too high");
        platformFeeBps = _bps;
    }

    function setStakingContract(address _stakingContract) external onlyOwner {
        stakingContract = ILiliPadStaking(_stakingContract);
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
     * @param customMintToken Custom ERC20 token for minting (optional)
     * @param customMintPrice Custom ERC20 mint price
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
        string memory vanity,
        address customMintToken,
        uint256 customMintPrice
    ) external payable returns (address) {
        require(bytes(vanity).length >= 4, "Vanity too short");
        require(vanityToCollection[vanity] == address(0), "Vanity taken");
        require(mintEnd > mintStart, "Invalid window");
        require(maxSupply > 0, "No supply");
        require(royaltyBps <= 5000, "Royalty too high"); // max 50%
        require(royaltyRecipient != address(0), "Royalty recipient");

        // Check staking eligibility and get tier-based discount
        bool eligibleForDiscount = stakingContract.isEligible(msg.sender);
        bool wantsCustomMint = customMintToken != address(0);
        if (wantsCustomMint) {
            require(eligibleForDiscount, "Need staked LILI for custom mint token");
        }
        
        uint256 discountBps = 0;
        uint256 fee = launchFee;
        if (eligibleForDiscount) {
            (, discountBps) = stakingContract.getUserDiscount(msg.sender);
            uint256 discountAmount = (launchFee * discountBps) / 10000;
            fee = launchFee - discountAmount;
        }
        
        uint256 totalPlatformFee = fee + (maxSupply * mintPrice * platformFeeBps) / 10000;
        require(msg.value >= totalPlatformFee, "Insufficient launch fee");

        LiliPadCollection collection = new LiliPadCollection(
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
            msg.sender,
            customMintToken,
            customMintPrice
        );
        collections.push(address(collection));
        vanityToCollection[vanity] = address(collection);
        emit CollectionDeployedMain(address(collection), msg.sender, vanity);
        emit CollectionDeployedDetails(
            address(collection),
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
            customMintToken,
            customMintPrice,
            discountBps,
            fee
        );
        return address(collection);
    }

    function getCollections() external view returns (address[] memory) {
        return collections;
    }

    // Owner can withdraw all accumulated fees
    function withdraw() external onlyWithdrawer {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        (bool sent, ) = msg.sender.call{value: balance}("");
        require(sent, "Withdraw failed");
    }
} 