"use client";

import { useState, useCallback } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useAccount,
} from "wagmi";
import { parseUnits } from "viem";
import {
  MOCK_USDC_ADDRESS,
  STAKING_ADDRESS,
  MOCK_USDC_ABI,
  STAKING_ABI,
  AGENT_IDS,
  type AgentIdValue,
} from "@/lib/web3/contracts";
import type { AgentName } from "@/types";

export type StakeStep =
  | "idle"
  | "approving"
  | "approve_pending"
  | "staking"
  | "stake_pending"
  | "success"
  | "error";

export interface UseStakeResult {
  step: StakeStep;
  approveTxHash: `0x${string}` | undefined;
  stakeTxHash:   `0x${string}` | undefined;
  error: string | null;
  execute: (agentName: AgentName, amountUsdc: string) => Promise<void>;
  reset: () => void;
}

const USDC_DECIMALS = 6;

export function useStake(): UseStakeResult {
  const { address } = useAccount();
  const [step, setStep]               = useState<StakeStep>("idle");
  const [error, setError]             = useState<string | null>(null);
  const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | undefined>();
  const [stakeTxHash, setStakeTxHash]     = useState<`0x${string}` | undefined>();
  const [pendingAgentId, setPendingAgentId] = useState<AgentIdValue>(0);
  const [pendingAmount,  setPendingAmount]  = useState<bigint>(0n);

  const { writeContractAsync } = useWriteContract();

  // Watch approval tx
  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({
    hash: approveTxHash,
    query: { enabled: !!approveTxHash && step === "approve_pending" },
  });

  // Watch stake tx
  const { isSuccess: stakeConfirmed } = useWaitForTransactionReceipt({
    hash: stakeTxHash,
    query: { enabled: !!stakeTxHash && step === "stake_pending" },
  });

  // Auto-advance: once approval confirmed → stake
  const runStake = useCallback(async (agentId: AgentIdValue, amount: bigint) => {
    setStep("staking");
    try {
      const hash = await writeContractAsync({
        address: STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: "stake",
        args: [agentId, amount],
      });
      setStakeTxHash(hash);
      setStep("stake_pending");
    } catch (e: unknown) {
      setError(formatError(e));
      setStep("error");
    }
  }, [writeContractAsync]);

  // Effect: approval confirmed → trigger stake
  // (We use useEffect-style logic inside execute to keep the hook simple)

  const execute = useCallback(async (agentName: AgentName, amountUsdc: string) => {
    if (!address) {
      setError("Connect your wallet first.");
      setStep("error");
      return;
    }

    const agentId = AGENT_IDS[agentName] as AgentIdValue;
    const amount  = parseUnits(amountUsdc, USDC_DECIMALS);

    setError(null);
    setPendingAgentId(agentId);
    setPendingAmount(amount);

    // ── Step 1: Approve ────────────────────────────────────────────────────
    setStep("approving");
    let approveHash: `0x${string}`;
    try {
      approveHash = await writeContractAsync({
        address: MOCK_USDC_ADDRESS,
        abi: MOCK_USDC_ABI,
        functionName: "approve",
        args: [STAKING_ADDRESS, amount],
      });
      setApproveTxHash(approveHash);
      setStep("approve_pending");
    } catch (e: unknown) {
      setError(formatError(e));
      setStep("error");
      return;
    }

    // ── Step 2: Wait for approval receipt inline ───────────────────────────
    // We poll directly rather than relying on wagmi's reactive hook
    // so the whole flow lives in one async function.
    try {
      await waitForReceipt(approveHash);
    } catch (e: unknown) {
      setError(formatError(e));
      setStep("error");
      return;
    }

    // ── Step 3: Stake ──────────────────────────────────────────────────────
    await runStake(agentId, amount);

    // Mark success once stake tx is sent (confirmation tracked via hook)
  }, [address, writeContractAsync, runStake]);

  // When stake_pending → watch for confirmation
  // (caller can observe `step === "success"` after stakeTxHash is confirmed)
  if (step === "stake_pending" && stakeConfirmed && stakeTxHash) {
    setStep("success");
  }

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setApproveTxHash(undefined);
    setStakeTxHash(undefined);
  }, []);

  return { step, approveTxHash, stakeTxHash, error, execute, reset };
}

// ── useBalance hook ──────────────────────────────────────────────────────────

export function useUsdcBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

// ── useFaucet hook ───────────────────────────────────────────────────────────

export function useFaucet() {
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();

  const drip = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const hash = await writeContractAsync({
        address: MOCK_USDC_ADDRESS,
        abi: MOCK_USDC_ABI,
        functionName: "faucet",
        args: [],
      });
      setTxHash(hash);
    } catch (e: unknown) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [writeContractAsync]);

  const { isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  return { drip, loading, error, txHash, isSuccess };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatError(e: unknown): string {
  if (e instanceof Error) {
    // Clean up common wagmi/viem error messages
    if (e.message.includes("User rejected"))    return "Transaction rejected in wallet.";
    if (e.message.includes("insufficient"))     return "Insufficient funds for gas.";
    if (e.message.includes("cooldown"))         return "Faucet cooldown active. Try again in 1 hour.";
    if (e.message.includes("below minimum"))    return "Amount is below the minimum stake (10 mUSDC).";
    return e.message.slice(0, 120);
  }
  return "Unknown error.";
}

/**
 * Polls the RPC until the transaction is mined.
 * Simple inline alternative to wagmi's useWaitForTransactionReceipt
 * for use inside an async function.
 */
async function waitForReceipt(hash: `0x${string}`): Promise<void> {
  // Dynamic import to avoid SSR issues
  const { createPublicClient, http } = await import("viem");
  const { baseSepolia } = await import("wagmi/chains");
  const client = createPublicClient({ chain: baseSepolia, transport: http() });
  await client.waitForTransactionReceipt({ hash });
}
