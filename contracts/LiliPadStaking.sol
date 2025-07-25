// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LiliPadStaking is Ownable {
    IERC20 public immutable liliToken;

    enum Tier { None, Sprout, Hopper, Guardian }

    struct StakeInfo {
        uint256 amount;
        uint256 unlockTime;
        Tier tier;
        bool active;
        uint256 stakeTime;
    }

    struct StakeHistory {
        uint256 amount;
        uint256 unlockTime;
        Tier tier;
        uint256 stakeTime;
        uint256 unstakeTime;
        bool wasActive;
    }

    // Current active stakes per user
    mapping(address => mapping(Tier => StakeInfo)) public activeStakes;
    // Stake history per user
    mapping(address => StakeHistory[]) public stakeHistory;
    // Track total staked per user
    mapping(address => uint256) public totalStaked;

    // Tier requirements
    uint256 public constant SPROUT_AMOUNT = 20000 * 1e18;
    uint256 public constant HOPPER_AMOUNT = 30000 * 1e18;
    uint256 public constant GUARDIAN_AMOUNT = 50000 * 1e18;
    uint256 public constant SPROUT_DAYS = 5 minutes; // For testing, Sprout is 5 minutes
    uint256 public constant HOPPER_DAYS = 50 days;
    uint256 public constant GUARDIAN_DAYS = 60 days;

    // Discount percentages (in basis points, 10000 = 100%)
    uint256 public constant SPROUT_DISCOUNT = 3333; // 33.33%
    uint256 public constant HOPPER_DISCOUNT = 4000; // 40%
    uint256 public constant GUARDIAN_DISCOUNT = 6000; // 60%

    event Staked(address indexed user, uint256 amount, Tier tier, uint256 unlockTime, uint256 stakeTime);
    event Unstaked(address indexed user, uint256 amount, Tier tier, uint256 unstakeTime);

    constructor(address _liliToken) {
        require(_liliToken != address(0), "Invalid token");
        liliToken = IERC20(_liliToken);
    }

    function stake(Tier tier) external {
        require(tier != Tier.None, "Invalid tier");
        require(!activeStakes[msg.sender][tier].active, "Already staked this tier");
        
        uint256 amount;
        uint256 lockPeriod;
        if (tier == Tier.Sprout) {
            amount = SPROUT_AMOUNT;
            lockPeriod = SPROUT_DAYS;
        } else if (tier == Tier.Hopper) {
            amount = HOPPER_AMOUNT;
            lockPeriod = HOPPER_DAYS;
        } else if (tier == Tier.Guardian) {
            amount = GUARDIAN_AMOUNT;
            lockPeriod = GUARDIAN_DAYS;
        } else {
            revert("Invalid tier");
        }
        
        require(liliToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        uint256 stakeTime = block.timestamp;
        activeStakes[msg.sender][tier] = StakeInfo({
            amount: amount,
            unlockTime: stakeTime + lockPeriod,
            tier: tier,
            active: true,
            stakeTime: stakeTime
        });
        
        totalStaked[msg.sender] += amount;
        emit Staked(msg.sender, amount, tier, stakeTime + lockPeriod, stakeTime);
    }

    function unstake(Tier tier) external {
        require(tier != Tier.None, "Invalid tier");
        StakeInfo storage info = activeStakes[msg.sender][tier];
        require(info.active, "No active stake for this tier");
        require(block.timestamp >= info.unlockTime, "Stake still locked");
        
        uint256 amount = info.amount;
        uint256 unstakeTime = block.timestamp;
        
        // Add to history
        stakeHistory[msg.sender].push(StakeHistory({
            amount: amount,
            unlockTime: info.unlockTime,
            tier: info.tier,
            stakeTime: info.stakeTime,
            unstakeTime: unstakeTime,
            wasActive: true
        }));
        
        // Clear active stake
        delete activeStakes[msg.sender][tier];
        totalStaked[msg.sender] -= amount;
        
        require(liliToken.transfer(msg.sender, amount), "Unstake transfer failed");
        emit Unstaked(msg.sender, amount, tier, unstakeTime);
    }

    function getUserTier(address user) external view returns (Tier tier, bool eligible) {
        (tier, ) = getHighestActiveTier(user);
        eligible = tier != Tier.None;
        return (tier, eligible);
    }

    // For factory contract: check if user is eligible for benefits (at least Sprout tier and still locked)
    function isEligible(address user) external view returns (bool) {
        (Tier tier, ) = getHighestActiveTier(user);
        return tier != Tier.None;
    }

    // For factory contract: get user's highest tier and discount percentage
    function getUserDiscount(address user) external view returns (Tier tier, uint256 discountBps) {
        (tier, ) = getHighestActiveTier(user);
        if (tier == Tier.None) {
            return (Tier.None, 0);
        }
        
        if (tier == Tier.Sprout) {
            discountBps = SPROUT_DISCOUNT;
        } else if (tier == Tier.Hopper) {
            discountBps = HOPPER_DISCOUNT;
        } else if (tier == Tier.Guardian) {
            discountBps = GUARDIAN_DISCOUNT;
        } else {
            discountBps = 0;
        }
    }

    // Get highest active tier for a user
    function getHighestActiveTier(address user) public view returns (Tier tier, uint256 unlockTime) {
        // Check Guardian first (highest tier)
        StakeInfo memory guardianStake = activeStakes[user][Tier.Guardian];
        if (guardianStake.active && block.timestamp < guardianStake.unlockTime) {
            return (Tier.Guardian, guardianStake.unlockTime);
        }
        
        // Check Hopper
        StakeInfo memory hopperStake = activeStakes[user][Tier.Hopper];
        if (hopperStake.active && block.timestamp < hopperStake.unlockTime) {
            return (Tier.Hopper, hopperStake.unlockTime);
        }
        
        // Check Sprout
        StakeInfo memory sproutStake = activeStakes[user][Tier.Sprout];
        if (sproutStake.active && block.timestamp < sproutStake.unlockTime) {
            return (Tier.Sprout, sproutStake.unlockTime);
        }
        
        return (Tier.None, 0);
    }

    // Get all active stakes for a user
    function getActiveStakes(address user) external view returns (StakeInfo[] memory) {
        uint256 count = 0;
        if (activeStakes[user][Tier.Sprout].active) count++;
        if (activeStakes[user][Tier.Hopper].active) count++;
        if (activeStakes[user][Tier.Guardian].active) count++;
        
        StakeInfo[] memory stakes = new StakeInfo[](count);
        uint256 index = 0;
        
        if (activeStakes[user][Tier.Sprout].active) {
            stakes[index] = activeStakes[user][Tier.Sprout];
            index++;
        }
        if (activeStakes[user][Tier.Hopper].active) {
            stakes[index] = activeStakes[user][Tier.Hopper];
            index++;
        }
        if (activeStakes[user][Tier.Guardian].active) {
            stakes[index] = activeStakes[user][Tier.Guardian];
            index++;
        }
        
        return stakes;
    }

    // Get stake history for a user
    function getStakeHistory(address user) external view returns (StakeHistory[] memory) {
        return stakeHistory[user];
    }

    // Get stake history count for a user
    function getStakeHistoryCount(address user) external view returns (uint256) {
        return stakeHistory[user].length;
    }
} 