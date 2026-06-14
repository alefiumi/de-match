/**
 * Deploy MockUSDC + DeMatchStaking to Base Sepolia
 *
 * Usage:
 *   cd contracts
 *   cp .env.example .env          # fill in DEPLOYER_PRIVATE_KEY
 *   npm install
 *   npm run deploy:sepolia
 *
 * After deployment, copy the printed addresses into:
 *   ../src/lib/web3/contracts.ts
 */

import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("\n═══════════════════════════════════════════════");
  console.log("  De-Match Protocol — Contract Deployment");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Network:  ${network.name} (chainId: ${network.chainId})`);
  console.log(`  Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance:  ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    throw new Error(
      "Deployer has 0 ETH. Get Base Sepolia ETH from https://sepoliafaucet.com or https://faucet.quicknode.com/base/sepolia"
    );
  }

  // ── 1. Deploy MockUSDC ──────────────────────────────────────────────────
  console.log("\n[1/3] Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy(deployer.address);
  await mockUSDC.waitForDeployment();
  const usdcAddress = await mockUSDC.getAddress();
  console.log(`      ✓ MockUSDC deployed to: ${usdcAddress}`);

  // ── 2. Deploy DeMatchStaking ────────────────────────────────────────────
  console.log("\n[2/3] Deploying DeMatchStaking...");
  const DeMatchStaking = await ethers.getContractFactory("DeMatchStaking");
  const staking = await DeMatchStaking.deploy(usdcAddress, deployer.address);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log(`      ✓ DeMatchStaking deployed to: ${stakingAddress}`);

  // ── 3. Verify on Basescan (optional — needs BASESCAN_API_KEY) ───────────
  if (process.env.BASESCAN_API_KEY && network.chainId === 84532n) {
    console.log("\n[3/3] Waiting 5 blocks before verification...");
    // Wait a few seconds for Basescan to index the contracts
    await new Promise((r) => setTimeout(r, 15_000));

    try {
      const { run } = await import("hardhat");

      await run("verify:verify", {
        address: usdcAddress,
        constructorArguments: [deployer.address],
      });
      console.log("      ✓ MockUSDC verified on Basescan");

      await run("verify:verify", {
        address: stakingAddress,
        constructorArguments: [usdcAddress, deployer.address],
      });
      console.log("      ✓ DeMatchStaking verified on Basescan");
    } catch (e) {
      console.warn("      ⚠ Verification failed (non-fatal):", e);
    }
  } else {
    console.log("\n[3/3] Skipping Basescan verification (no API key or wrong network).");
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════");
  console.log("  ✅ Deployment complete!");
  console.log("═══════════════════════════════════════════════");
  console.log("\n  Copy these values into src/lib/web3/contracts.ts:\n");
  console.log(`  MOCK_USDC_ADDRESS    = "${usdcAddress}"`);
  console.log(`  STAKING_ADDRESS      = "${stakingAddress}"`);
  console.log(`  CHAIN_ID             = 84532  // Base Sepolia`);
  console.log("\n  Basescan links:");
  console.log(`  MockUSDC:   https://sepolia.basescan.org/address/${usdcAddress}`);
  console.log(`  Staking:    https://sepolia.basescan.org/address/${stakingAddress}`);
  console.log("\n  Next steps:");
  console.log("  1. Update src/lib/web3/contracts.ts with the addresses above");
  console.log("  2. Get test ETH: https://faucet.quicknode.com/base/sepolia");
  console.log("  3. Call faucet() on MockUSDC to get test mUSDC tokens");
  console.log("     (or use the faucet button in the UI)\n");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
