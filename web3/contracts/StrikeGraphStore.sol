// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StrikeGraphStore {
    // Treasury address for StrikeGraph
    address payable public constant TREASURY = payable(0x7cBfF11440099DB224d2B54d12e1116eB565C8FE);

    // Contract Owner (to protect admin actions)
    address public owner;

    // Player Tiers:
    // 0 = Base (Free, everyone owns it)
    // 1 = Striker
    // 2 = Sniper
    // 3 = Legend

    // HBAR prices (represented in 18-decimal EVM native currency equivalents)
    uint256 public constant PRICE_STRIKER = 50 ether; // 50 HBAR
    uint256 public constant PRICE_SNIPER = 100 ether; // 100 HBAR
    uint256 public constant PRICE_LEGEND = 500 ether; // 500 HBAR

    // Track owned player tier per address
    mapping(address => uint256) public ownedTiers;

    // Track active stakes for the P2E game loop
    mapping(address => uint256) public activeStakes;

    // Events
    event PlayerVariantPurchased(address indexed buyer, uint256 indexed tierId, uint256 amountPaid);
    event Staked(address indexed player, uint256 amount);
    event GameResolved(address indexed player, bool won, uint256 amount);
    event LiquidityWithdrawn(address indexed owner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Deposit funds into the contract to maintain payout liquidity.
     */
    function fundContract() external payable onlyOwner {}

    /**
     * @notice Withdraw House funds from the contract balance (only contract owner).
     */
    function withdrawLiquidity(uint256 _amount) external onlyOwner {
        require(address(this).balance >= _amount, "Insufficient contract balance");

        (bool success, ) = owner.call{value: _amount}("");
        require(success, "Withdraw transfer failed");

        emit LiquidityWithdrawn(owner, _amount);
    }

    /**
     * @notice Purchase a player variant tier.
     * @param _tierId The ID of the tier to purchase (1 = Striker, 2 = Sniper, 3 = Legend).
     */
    function buyPlayerVariant(uint256 _tierId) external payable {
        uint256 price;

        if (_tierId == 1) {
            price = PRICE_STRIKER;
        } else if (_tierId == 2) {
            price = PRICE_SNIPER;
        } else if (_tierId == 3) {
            price = PRICE_LEGEND;
        } else {
            revert("Invalid tier ID");
        }

        // Check if value sent matches or exceeds the price
        require(msg.value >= price, "Insufficient HBAR payment");

        // Instantly forward the funds to the Treasury address
        (bool success, ) = TREASURY.call{value: msg.value}("");
        require(success, "Treasury transfer failed");

        // Record the ownership update
        ownedTiers[msg.sender] = _tierId;

        emit PlayerVariantPurchased(msg.sender, _tierId, msg.value);
    }

    /**
     * @notice Stake HBAR before playing (must be exactly 5 or 50 HBAR).
     */
    function stake() external payable {
        require(msg.value >= 5 ether, "Minimum stake is 5 HBAR");
        require(activeStakes[msg.sender] == 0, "Already have an active stake");

        activeStakes[msg.sender] = msg.value;

        emit Staked(msg.sender, msg.value);
    }

    /**
     * @notice Resolve the active stake.
     * @param won True if the user scored, false if they missed.
     */
    function resolveGame(bool won) external {
        uint256 stakedAmount = activeStakes[msg.sender];
        require(stakedAmount > 0, "No active stake found");

        // Reset stake before transfer to prevent reentrancy issues
        activeStakes[msg.sender] = 0;

        if (won) {
            uint256 payout = stakedAmount * 2;
            require(address(this).balance >= payout, "Contract has insufficient balance for payout");
            (bool success, ) = msg.sender.call{value: payout}("");
            require(success, "Payout transfer failed");
            emit GameResolved(msg.sender, true, payout);
        } else {
            (bool success, ) = TREASURY.call{value: stakedAmount}("");
            require(success, "Treasury transfer failed");
            emit GameResolved(msg.sender, false, stakedAmount);
        }
    }
}
