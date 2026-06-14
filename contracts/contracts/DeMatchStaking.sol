// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DeMatchStaking
 * @notice Users stake mUSDC to unlock access to an AI agent recommendation.
 *         The flow is:
 *           1. User calls MockUSDC.approve(stakingContract, amount)
 *           2. User calls DeMatchStaking.stake(agentId, amount)
 *           3. Contract pulls tokens via transferFrom and records the stake
 *           4. User can unstake after the lock period
 *
 * @dev Built for Base Sepolia testnet with MockUSDC.
 */
contract DeMatchStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Types ──────────────────────────────────────────────────────────────

    enum AgentId { Claude, ChatGPT, Copilot, Gemini }

    struct StakeRecord {
        AgentId agentId;
        uint256 amount;      // in mUSDC (6 decimals)
        uint256 stakedAt;
        bool    unlocked;    // has agent access been activated
        bool    withdrawn;
    }

    // ── Storage ────────────────────────────────────────────────────────────

    IERC20 public immutable usdc;

    /// @notice Minimum stake required to unlock an agent: 10 mUSDC
    uint256 public constant MIN_STAKE = 10 * 10 ** 6;

    /// @notice Lock duration before withdrawal is allowed: 7 days
    uint256 public constant LOCK_PERIOD = 7 days;

    /// @notice staker => array of stakes
    mapping(address => StakeRecord[]) private _stakes;

    /// @notice total staked per agent
    mapping(AgentId => uint256) public totalStakedPerAgent;

    uint256 public totalStaked;

    // ── Events ─────────────────────────────────────────────────────────────

    event Staked(
        address indexed staker,
        AgentId indexed agentId,
        uint256 amount,
        uint256 stakeIndex
    );

    event AgentUnlocked(
        address indexed staker,
        AgentId indexed agentId,
        uint256 stakeIndex
    );

    event Withdrawn(
        address indexed staker,
        uint256 amount,
        uint256 stakeIndex
    );

    // ── Constructor ────────────────────────────────────────────────────────

    constructor(address _usdc, address initialOwner)
        Ownable(initialOwner)
    {
        require(_usdc != address(0), "DeMatchStaking: zero address");
        usdc = IERC20(_usdc);
    }

    // ── Core logic ─────────────────────────────────────────────────────────

    /**
     * @notice Stake mUSDC to unlock an AI agent.
     * @param agentId  One of: 0=Claude, 1=ChatGPT, 2=Copilot, 3=Gemini
     * @param amount   Amount of mUSDC (with 6 decimals) to stake
     *
     * Requirements:
     *  - Caller must have called usdc.approve(address(this), amount) first
     *  - amount >= MIN_STAKE (10 mUSDC)
     */
    function stake(AgentId agentId, uint256 amount)
        external
        nonReentrant
        returns (uint256 stakeIndex)
    {
        require(amount >= MIN_STAKE, "DeMatchStaking: below minimum stake");

        // Pull tokens from caller (requires prior approve)
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        stakeIndex = _stakes[msg.sender].length;
        _stakes[msg.sender].push(StakeRecord({
            agentId:   agentId,
            amount:    amount,
            stakedAt:  block.timestamp,
            unlocked:  true,   // access granted immediately on stake
            withdrawn: false
        }));

        totalStakedPerAgent[agentId] += amount;
        totalStaked += amount;

        emit Staked(msg.sender, agentId, amount, stakeIndex);
        emit AgentUnlocked(msg.sender, agentId, stakeIndex);

        return stakeIndex;
    }

    /**
     * @notice Withdraw a stake after the lock period has elapsed.
     * @param stakeIndex  Index into the caller's stakes array
     */
    function withdraw(uint256 stakeIndex) external nonReentrant {
        StakeRecord storage s = _stakes[msg.sender][stakeIndex];

        require(!s.withdrawn, "DeMatchStaking: already withdrawn");
        require(
            block.timestamp >= s.stakedAt + LOCK_PERIOD,
            "DeMatchStaking: lock period active"
        );

        s.withdrawn = true;
        uint256 amount = s.amount;
        totalStakedPerAgent[s.agentId] -= amount;
        totalStaked -= amount;

        usdc.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount, stakeIndex);
    }

    // ── Views ───────────────────────────────────────────────────────────────

    /// @notice Returns all stakes for a given address
    function getStakes(address staker)
        external
        view
        returns (StakeRecord[] memory)
    {
        return _stakes[staker];
    }

    /// @notice Returns a single stake record
    function getStake(address staker, uint256 index)
        external
        view
        returns (StakeRecord memory)
    {
        return _stakes[staker][index];
    }

    /// @notice Returns the number of stakes for a given address
    function stakeCount(address staker) external view returns (uint256) {
        return _stakes[staker].length;
    }

    /**
     * @notice Returns true if the address has an active (non-withdrawn) stake
     *         for the given agent
     */
    function hasActiveStake(address staker, AgentId agentId)
        external
        view
        returns (bool)
    {
        StakeRecord[] storage stakes = _stakes[staker];
        for (uint256 i = 0; i < stakes.length; i++) {
            if (
                stakes[i].agentId == agentId &&
                stakes[i].unlocked &&
                !stakes[i].withdrawn
            ) {
                return true;
            }
        }
        return false;
    }

    // ── Owner ────────────────────────────────────────────────────────────────

    /// @notice Emergency withdrawal of any token accidentally sent to contract
    function rescueToken(address token, address to, uint256 amount)
        external
        onlyOwner
    {
        IERC20(token).safeTransfer(to, amount);
    }
}
