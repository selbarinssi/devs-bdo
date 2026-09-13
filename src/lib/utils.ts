import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/** Compact silver for tight UI (e.g. 1.25B, 840.5M, 12.4K). */
export function formatSilverCompact(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const a = Math.abs(n);
  if (a >= 1_000_000_000) {
    const v = a / 1_000_000_000;
    return `${sign}${v >= 10 ? v.toFixed(1) : v.toFixed(2)}B`;
  }
  if (a >= 1_000_000) {
    const v = a / 1_000_000;
    return `${sign}${v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)}M`;
  }
  if (a >= 100_000) {
    return `${sign}${Math.round(a / 1_000)}K`;
  }
  return `${sign}${formatNumber(Math.round(a))}`;
}

/** Market tax: you recover this fraction of listed price (NPC = 100%). */
export const MARKET_SILVER_RECOVERY = 0.85475;

/** Effective silver per unit after market tax when kind is market. */
export function effectiveUnitSilver(unitPrice: number, kind: "market" | "npc" | string): number {
  const p = Number(unitPrice) || 0;
  if (kind === "npc") return p;
  return p * MARKET_SILVER_RECOVERY;
}
