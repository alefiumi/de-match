import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Hex color → "r,g,b" for use in rgba() */
export function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

/** Generate a random mock blockchain tx hash */
export function mockTxHash(): string {
  const hex = [...Array(12)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
  return `0x${hex}…`;
}

/** Generate random mock block number */
export function mockBlockNum(): string {
  return (Math.floor(Math.random() * 90_000) + 10_000).toLocaleString();
}

/** Generate random mock gas price */
export function mockGasPrice(): string {
  return (Math.random() * 12 + 4).toFixed(2);
}

/** Generate a simulated wallet address */
export function mockWalletAddress(): string {
  return "0x7A" + Math.random().toString(16).slice(2, 6).toUpperCase() + "…3fB2";
}
