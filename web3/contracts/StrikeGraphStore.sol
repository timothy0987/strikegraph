// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StrikeGraphStore {
    // Treasury address for StrikeGraph
    address payable public constant TREASURY = payable(0x7cBfF11440099DB224d2B54d12e1116eB565C8FE);

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

    // Events
    event PlayerVariantPurchased(address indexed buyer, uint256 indexed tierId, uint256 amountPaid);

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
}
