/**
 * Contract addresses on Base Sepolia.
 * After running `npm run deploy:sepolia` inside /contracts,
 * paste the printed addresses here.
 */

import { baseSepolia } from "wagmi/chains";

// ── Network ──────────────────────────────────────────────────────────────────
export const CHAIN_ID = baseSepolia.id; // 84532

// ── Addresses ────────────────────────────────────────────────────────────────
export const MOCK_USDC_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;
export const STAKING_ADDRESS   = "0x0000000000000000000000000000000000000000" as `0x${string}`;

/** @deprecated Use named exports above */
export const CONTRACT_ADDRESSES = {
  MOCK_USDC: MOCK_USDC_ADDRESS,
  STAKING:   STAKING_ADDRESS,
} as const;

// ── Agent IDs (matches Solidity enum order) ───────────────────────────────────
export const AGENT_IDS: Record<string, number> = {
  Claude:  0,
  ChatGPT: 1,
  Copilot: 2,
  Gemini:  3,
};

export type AgentIdValue = 0 | 1 | 2 | 3;

/** @deprecated Use AGENT_IDS */
export const AGENT_ID = AGENT_IDS;

// ── Stake amount: 10 mUSDC (6 decimals) ─────────────────────────────────────
export const STAKE_AMOUNT = BigInt(10 * 10 ** 6);

// ── MockUSDC ABI ─────────────────────────────────────────────────────────────
export const MOCK_USDC_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "pure",
    inputs:  [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "faucet",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [],
    outputs: [],
  },
  {
    name: "lastFaucetCall",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// ── DeMatchStaking ABI ───────────────────────────────────────────────────────
export const STAKING_ABI = [
  {
    name: "MIN_STAKE",
    type: "function",
    stateMutability: "view",
    inputs:  [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "stake",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint8"   },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [{ name: "stakeIndex", type: "uint256" }],
  },
  {
    name: "hasActiveStake",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "staker",  type: "address" },
      { name: "agentId", type: "uint8"   },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "stakeCount",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "staker", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalStaked",
    type: "function",
    stateMutability: "view",
    inputs:  [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
