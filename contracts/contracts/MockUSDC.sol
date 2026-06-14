// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @notice A faucet-enabled ERC-20 token that mimics USDC (6 decimals)
 *         for use on Base Sepolia testnet.
 * @dev Anyone can call faucet() to receive test tokens.
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;

    /// @notice Amount dispensed per faucet call: 100 USDC
    uint256 public constant FAUCET_AMOUNT = 100 * 10 ** DECIMALS;

    /// @notice Cooldown between faucet calls per address (1 hour)
    uint256 public constant FAUCET_COOLDOWN = 1 hours;

    mapping(address => uint256) public lastFaucetCall;

    event FaucetDrip(address indexed recipient, uint256 amount);

    constructor(address initialOwner)
        ERC20("Mock USDC", "mUSDC")
        Ownable(initialOwner)
    {
        // Mint 1,000,000 mUSDC to deployer for initial liquidity
        _mint(initialOwner, 1_000_000 * 10 ** DECIMALS);
    }

    /// @notice Returns 6 (matching real USDC decimals)
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @notice Drips 100 mUSDC to the caller.
     *         Limited to once per hour per address.
     */
    function faucet() external {
        require(
            block.timestamp >= lastFaucetCall[msg.sender] + FAUCET_COOLDOWN,
            "MockUSDC: faucet cooldown active"
        );
        lastFaucetCall[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetDrip(msg.sender, FAUCET_AMOUNT);
    }

    /// @notice Owner can mint arbitrary amounts (for testing)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
