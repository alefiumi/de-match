"use client";

import { useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { baseSepolia } from "wagmi/chains";
import {
  CONTRACT_ADDRESSES,
  MOCK_USDC_ABI,
  STAKING_ABI,
  AGENT_ID,
  STAKE_AMOUNT,
} from "@/lib/web3/contracts";
import type { AgentName } from "@/types";

export type StakeStatus =
  | "idle"
  | "checking"
  | "needs_faucet"
  | "approving"
  | "approve_pending"
  | "staking"
  | "stake_pending"
  | "success"
  | "error";

export interface UseStakeReturn {
  status: StakeStatus;
  errorMsg: string | null;
  approveTxHash: `0x${string}` | undefined;
  stakeTxHash: `0x${string}` | undefined;
  hasActiveStake: boolean;
  usdcBalance: bigint;
  /** Call this to kick off the approve → stake flow */
  executeStake: (agentName: AgentName) => Promise<void>;
  /** Call this to claim free mUSDC from the faucet */
  claimFaucet: () => Promise<void>;
  reset: () => void;
}

export function useStake(): UseStakeReturn {
  const { address, chainId } = useAccount();

  const [status, setStatus]           = useState<StakeStatus>("idle");
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);
  const [approveTxHash, setApproveTx] = useState<`0x${string}` | undefined>();
  const [stakeTxHash, setStakeTx]     = useState<`0x${string}` | undefined>();
  const [pendingAgent, setPendingAgent] = useState<AgentName | null>(null);

  const { writeContractAsync } = useWriteContract();

  // ── Read: mUSDC balance ──────────────────────────────────────────────────
  const { data: usdcBalance = BigInt(0), refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.MOCK_USDC,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // ── Read: current allowance ──────────────────────────────────────────────
  const { data: currentAllowance = BigInt(0), refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.MOCK_USDC,
    abi: MOCK_USDC_ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACT_ADDRESSES.STAKING] : undefined,
    query: { enabled: !!address },
  });

  // ── Read: hasActiveStake ─────────────────────────────────────────────────
  const { data: hasActiveStake = false, refetch: refetchStake } = useReadContract({
    address: CONTRACT_ADDRESSES.STAKING,
    abi: STAKING_ABI,
    functionName: "hasActiveStake",
    args: address && pendingAgent != null
      ? [address, AGENT_ID[pendingAgent] as 0 | 1 | 2 | 3]
      : undefined,
    query: { enabled: !!address && pendingAgent != null },
  });

  // ── Wait for approve tx ──────────────────────────────────────────────────
  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({
    hash: approveTxHash,
    query: { enabled: !!approveTxHash },
  });

  // ── Main flow ─────────────────────────────────────────────────────────────
  async function executeStake(agentName: AgentName) {
    if (!address) {
      setErrorMsg("Connect your wallet first.");
      setStatus("error");
      return;
    }
    if (chainId !== baseSepolia.id) {
      setErrorMsg(`Please switch to Base Sepolia (chain ID ${baseSepolia.id}).`);
      setStatus("error");
      return;
    }

    setPendingAgent(agentName);
    setStatus("checking");
    setErrorMsg(null);
    setApproveTx(undefined);
    setStakeTx(undefined);

    try {
      // Re-read fresh values
      const [balResult, allowResult] = await Promise.all([
        refetchBalance(),
        refetchAllowance(),
      ]);
      const balance   = (balResult.data   as bigint) ?? BigInt(0);
      const allowance = (allowResult.data as bigint) ?? BigInt(0);

      if (balance < STAKE_AMOUNT) {
        setStatus("needs_faucet");
        return;
      }

      // Step 1: Approve (skip if already approved)
      if (allowance < STAKE_AMOUNT) {
        setStatus("approving");
        const approveTx = await writeContractAsync({
          address: CONTRACT_ADDRESSES.MOCK_USDC,
          abi: MOCK_USDC_ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESSES.STAKING, STAKE_AMOUNT],
        });
        setApproveTx(approveTx);
        setStatus("approve_pending");

        // Wait for approval to be mined
        await waitForReceipt(approveTx);
      }

      // Step 2: Stake
      setStatus("staking");
      const agentIdNum = AGENT_ID[agentName] as 0 | 1 | 2 | 3;
      const stakeTx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.STAKING,
        abi: STAKING_ABI,
        functionName: "stake",
        args: [agentIdNum, STAKE_AMOUNT],
      });
      setStakeTx(stakeTx);
      setStatus("stake_pending");

      await waitForReceipt(stakeTx);

      await refetchStake();
      setStatus("success");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Transaction failed.";
      // User rejected in wallet
      if (msg.includes("User rejected") || msg.includes("user rejected")) {
        setErrorMsg("Transaction cancelled.");
      } else {
        setErrorMsg(msg.slice(0, 120));
      }
      setStatus("error");
    }
  }

  // ── Faucet flow ──────────────────────────────────────────────────────────
  async function claimFaucet() {
    if (!address) return;
    setStatus("approving"); // reuse spinner
    setErrorMsg(null);
    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.MOCK_USDC,
        abi: MOCK_USDC_ABI,
        functionName: "faucet",
        args: [],
      });
      setStatus("approve_pending");
      await waitForReceipt(tx);
      await refetchBalance();
      setStatus("idle");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Faucet failed.";
      setErrorMsg(msg.includes("cooldown") ? "Faucet cooldown active (1h). Try again later." : msg.slice(0, 120));
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setErrorMsg(null);
    setApproveTx(undefined);
    setStakeTx(undefined);
    setPendingAgent(null);
  }

  return {
    status,
    errorMsg,
    approveTxHash,
    stakeTxHash,
    hasActiveStake: hasActiveStake as boolean,
    usdcBalance: usdcBalance as bigint,
    executeStake,
    claimFaucet,
    reset,
  };
}

// ── Helper: poll for tx receipt ──────────────────────────────────────────────
async function waitForReceipt(hash: `0x${string}`, timeoutMs = 60_000) {
  const { createPublicClient, http } = await import("viem");
  const { baseSepolia } = await import("wagmi/chains");

  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const receipt = await client.waitForTransactionReceipt({ hash, timeout: timeoutMs });
  if (receipt.status === "reverted") {
    throw new Error("Transaction reverted on-chain.");
  }
  return receipt;
}
