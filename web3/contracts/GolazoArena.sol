// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title GolazoArena
 * @notice Penalty-kick game on X1 EcoChain.
 *
 *  Fairness — commit / reveal:
 *   1. commitShot(): the player stakes X1T and submits keccak256(zone, salt, player).
 *      Their chosen corner is hidden.
 *   2. revealShot(): the player reveals zone + salt. The keeper's dive is derived
 *      on-chain from blockhash(commitBlock + 1) — a value that did not exist when
 *      the player committed and can never change afterwards — mixed with the
 *      player address and their (hidden) commitment. The contract then decides
 *      GOAL / SAVED and pays out. No server, no oracle, no client-asserted result.
 *
 *  Player variants are real ERC-721s ("Golazo Player", GOLP) with fully on-chain
 *  metadata + art. A higher tier makes the keeper cover fewer corners.
 */
contract GolazoArena is ERC721Enumerable {
    using Strings for uint256;

    address public immutable owner;
    address payable public constant TREASURY =
        payable(0x7cBfF11440099DB224d2B54d12e1116eB565C8FE);

    // ----- economy -----
    uint256 public constant MIN_STAKE = 0.5 ether;
    uint256 public constant PRICE_STRIKER = 5 ether;
    uint256 public constant PRICE_SNIPER = 10 ether;
    uint256 public constant PRICE_LEGEND = 25 ether;

    // ----- match -----
    uint8 public constant ZONES = 6;            // 2 rows (low/high) x 3 cols (L/C/R)
    uint256 public constant REVEAL_WINDOW = 240; // blocks (~12 min @ ~3s) — under the 256 blockhash horizon

    // keeper covers K corners; fewer as the player's tier rises -> better odds
    // index by highest tier owned: 0 = Base, 1 = Striker, 2 = Sniper, 3 = Legend
    function keeperCover(uint8 tier) public pure returns (uint8) {
        if (tier >= 3) return 1;
        if (tier == 2) return 2;
        return 3; // Base + Striker: a provably fair 50 / 50
    }

    struct Match {
        uint128 stake;
        uint64 commitBlock;
        bytes32 commitment;
    }
    mapping(address => Match) public matches;

    // ----- variant NFTs -----
    uint256 private _nextTokenId = 1;
    mapping(uint256 => uint8) public tierOf; // tokenId => 1..3

    // ----- events -----
    event ShotCommitted(address indexed player, uint256 stake, uint256 commitBlock);
    event ShotResolved(
        address indexed player,
        uint8 shotZone,
        uint8 keeperMask,
        bool goal,
        uint256 payout
    );
    event CommitExpired(address indexed player, uint256 stakeForfeited);
    event VariantMinted(address indexed buyer, uint256 indexed tokenId, uint8 tier, uint256 pricePaid);
    event LiquidityFunded(address indexed from, uint256 amount);
    event LiquidityWithdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() ERC721("Golazo Player", "GOLP") {
        owner = msg.sender;
    }

    // --------------------------------------------------------------------- //
    //  Liquidity                                                           //
    // --------------------------------------------------------------------- //
    function fundContract() external payable onlyOwner {
        emit LiquidityFunded(msg.sender, msg.value);
    }

    receive() external payable {}

    function withdrawLiquidity(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "insufficient balance");
        (bool ok, ) = owner.call{value: amount}("");
        require(ok, "withdraw failed");
        emit LiquidityWithdrawn(owner, amount);
    }

    // --------------------------------------------------------------------- //
    //  Commit / reveal penalty                                            //
    // --------------------------------------------------------------------- //

    /// @param commitment keccak256(abi.encodePacked(uint8 zone, bytes32 salt, address player))
    function commitShot(bytes32 commitment) external payable {
        require(msg.value >= MIN_STAKE, "stake below minimum");
        require(commitment != bytes32(0), "empty commitment");

        Match memory prev = matches[msg.sender];
        if (prev.commitBlock != 0) {
            // Self-heal: an unrevealed match past its window is swept to treasury
            require(block.number > prev.commitBlock + REVEAL_WINDOW, "match in progress");
            delete matches[msg.sender];
            (bool swept, ) = TREASURY.call{value: prev.stake}("");
            require(swept, "sweep failed");
            emit CommitExpired(msg.sender, prev.stake);
        }

        matches[msg.sender] = Match({
            stake: uint128(msg.value),
            commitBlock: uint64(block.number),
            commitment: commitment
        });
        emit ShotCommitted(msg.sender, msg.value, block.number);
    }

    /// Corners the keeper covers this match, as a bitmask over [0, ZONES).
    function _keeperMask(bytes32 seed, uint8 k) internal pure returns (uint8 mask) {
        uint8[6] memory z = [0, 1, 2, 3, 4, 5];
        for (uint8 i = 0; i < k; i++) {
            uint8 j = i + uint8(uint256(keccak256(abi.encodePacked(seed, i))) % (ZONES - i));
            (z[i], z[j]) = (z[j], z[i]);
            mask |= uint8(1 << z[i]);
        }
    }

    function revealShot(uint8 shotZone, bytes32 salt) external returns (bool goal) {
        Match memory m = matches[msg.sender];
        require(m.commitBlock != 0, "no active match");
        require(block.number > m.commitBlock + 1, "reveal too early");
        require(block.number <= m.commitBlock + REVEAL_WINDOW, "reveal window closed");
        require(shotZone < ZONES, "bad zone");
        require(
            keccak256(abi.encodePacked(shotZone, salt, msg.sender)) == m.commitment,
            "reveal does not match commit"
        );

        bytes32 bh = blockhash(m.commitBlock + 1);
        require(bh != bytes32(0), "seed unavailable");

        bytes32 seed = keccak256(abi.encodePacked(bh, msg.sender, m.commitment));
        uint8 mask = _keeperMask(seed, keeperCover(highestTier(msg.sender)));
        goal = (mask & uint8(1 << shotZone)) == 0;

        uint256 stake = m.stake;
        delete matches[msg.sender];

        uint256 payout = 0;
        if (goal) {
            payout = stake * 2;
            require(address(this).balance >= payout, "insufficient liquidity");
            (bool ok, ) = msg.sender.call{value: payout}("");
            require(ok, "payout failed");
        } else {
            (bool ok, ) = TREASURY.call{value: stake}("");
            require(ok, "treasury transfer failed");
        }
        emit ShotResolved(msg.sender, shotZone, mask, goal, payout);
    }

    /// Anyone can sweep a stake whose reveal window has closed (stake -> treasury).
    function expireCommit(address player) external {
        Match memory m = matches[player];
        require(m.commitBlock != 0, "no active match");
        require(block.number > m.commitBlock + REVEAL_WINDOW, "still revealable");

        uint256 stake = m.stake;
        delete matches[player];
        (bool ok, ) = TREASURY.call{value: stake}("");
        require(ok, "treasury transfer failed");
        emit CommitExpired(player, stake);
    }

    // --------------------------------------------------------------------- //
    //  Variant NFTs                                                        //
    // --------------------------------------------------------------------- //
    function priceOf(uint8 tier) public pure returns (uint256) {
        if (tier == 1) return PRICE_STRIKER;
        if (tier == 2) return PRICE_SNIPER;
        if (tier == 3) return PRICE_LEGEND;
        revert("bad tier");
    }

    function buyPlayerVariant(uint8 tier) external payable returns (uint256 tokenId) {
        uint256 price = priceOf(tier);
        require(msg.value >= price, "insufficient X1T");

        (bool ok, ) = TREASURY.call{value: msg.value}("");
        require(ok, "treasury transfer failed");

        tokenId = _nextTokenId++;
        tierOf[tokenId] = tier;
        _safeMint(msg.sender, tokenId);
        emit VariantMinted(msg.sender, tokenId, tier, msg.value);
    }

    /// Highest tier the address currently holds (0 = Base / none).
    function highestTier(address player) public view returns (uint8 best) {
        uint256 n = balanceOf(player);
        for (uint256 i = 0; i < n; i++) {
            uint8 t = tierOf[tokenOfOwnerByIndex(player, i)];
            if (t > best) best = t;
        }
    }

    // --------------------------------------------------------------------- //
    //  On-chain metadata + art                                             //
    // --------------------------------------------------------------------- //
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        uint8 t = tierOf[tokenId];
        string memory tierName = t == 1 ? "Striker" : t == 2 ? "Sniper" : "Legend";
        string memory col = t == 1 ? "#FF0033" : t == 2 ? "#00FF33" : "#FFD700";

        string memory svg = string(
            abi.encodePacked(
                "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'>",
                "<rect width='400' height='400' fill='#0a0f14'/>",
                "<circle cx='200' cy='160' r='84' fill='none' stroke='", col, "' stroke-width='7'/>",
                "<circle cx='200' cy='160' r='14' fill='", col, "'/>",
                "<text x='200' y='290' text-anchor='middle' font-family='monospace' font-weight='bold' font-size='40' fill='", col, "'>", tierName, "</text>",
                "<text x='200' y='330' text-anchor='middle' font-family='monospace' font-size='15' fill='#8a8f98'>GOLAZO PLAYER #", tokenId.toString(), "</text>",
                "</svg>"
            )
        );

        string memory json = string(
            abi.encodePacked(
                '{"name":"Golazo ', tierName, " #", tokenId.toString(),
                '","description":"A Golazo player variant on X1 EcoChain. Higher tiers make the keeper cover fewer corners.",',
                '"attributes":[{"trait_type":"Tier","value":"', tierName, '"},{"trait_type":"Tier Level","value":', uint256(t).toString(), "}],",
                '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '"}'
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }
}
