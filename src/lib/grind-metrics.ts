import type { LootRarity, LootRow, SessionRow } from "@/lib/supabase";
import { effectiveUnitSilver } from "@/lib/utils";
import { normalizeRarity } from "@/components/grind-loot-meta";

/** Rares+ are lottery; common/uncommon count as stable "trash" signal. */
export function isTrashLoot(rarity: string | null | undefined): boolean {
  const r = normalizeRarity(rarity);
  return r === "common" || r === "uncommon";
}

export function isRareLoot(rarity: string | null | undefined): boolean {
  return !isTrashLoot(rarity);
}

export type LineValue = {
  loot: LootRow;
  qty: number;
  unitEff: number;
  lineValue: number;
  trash: boolean;
};

export function valueLines(
  loots: LootRow[],
  qty: Record<string, number | string>,
): LineValue[] {
  return loots.map((loot) => {
    const q = Number(qty[loot.id] ?? 0) || 0;
    const unitEff = effectiveUnitSilver(Number(loot.unit_price) || 0, loot.kind);
    return {
      loot,
      qty: q,
      unitEff,
      lineValue: q * unitEff,
      trash: isTrashLoot(loot.rarity),
    };
  });
}

export function sumPullValue(lines: LineValue[]) {
  let total = 0;
  let trash = 0;
  let rare = 0;
  for (const l of lines) {
    total += l.lineValue;
    if (l.trash) trash += l.lineValue;
    else rare += l.lineValue;
  }
  return { total, trash, rare };
}

export function silverPerHour(total: number, minutes: number): number {
  if (!(minutes > 0) || !(total > 0)) return 0;
  return total / (minutes / 60);
}

export function percentile(sortedAsc: number[], p: number): number {
  if (!sortedAsc.length) return 0;
  if (sortedAsc.length === 1) return sortedAsc[0];
  const idx = (sortedAsc.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  const t = idx - lo;
  return sortedAsc[lo] * (1 - t) + sortedAsc[hi] * t;
}

export type SpotStats = {
  count: number;
  medianSph: number;
  p25: number;
  p75: number;
  bestSph: number;
  avgSph: number;
  totalHours: number;
  totalSilver: number;
};

export function computeSpotStats(sessions: SessionRow[]): SpotStats {
  const sphs = sessions
    .map((s) => Number(s.silver_per_hour) || 0)
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  const totalSilver = sessions.reduce((a, s) => a + (Number(s.total_value) || 0), 0);
  const totalMins = sessions.reduce((a, s) => a + (Number(s.minutes) || 0), 0);
  const avgSph =
    sphs.length > 0 ? sphs.reduce((a, b) => a + b, 0) / sphs.length : 0;
  return {
    count: sessions.length,
    medianSph: percentile(sphs, 0.5),
    p25: percentile(sphs, 0.25),
    p75: percentile(sphs, 0.75),
    bestSph: sphs.length ? sphs[sphs.length - 1] : 0,
    avgSph,
    totalHours: totalMins / 60,
    totalSilver,
  };
}

export function classifyPull(trash: number, rare: number, total: number): "trash-heavy" | "rare-spike" | "balanced" | "empty" {
  if (total <= 0) return "empty";
  const rareShare = rare / total;
  if (rareShare >= 0.35) return "rare-spike";
  if (rareShare <= 0.12) return "trash-heavy";
  return "balanced";
}

export function pullInsight(opts: {
  liveSph: number;
  stats: SpotStats;
  trash: number;
  rare: number;
  total: number;
  minutes: number;
}): string {
  const { liveSph, stats, trash, rare, total, minutes } = opts;
  if (total <= 0) return "Log trash and sellables — the board is waiting.";
  if (minutes < 3) return "Warming up — silver/h stabilizes after a few minutes.";

  const kind = classifyPull(trash, rare, total);
  const vsMed =
    stats.medianSph > 0 ? ((liveSph - stats.medianSph) / stats.medianSph) * 100 : null;

  if (kind === "rare-spike") {
    return "Rares are carrying this pull — don't overfit the next hour to this spike.";
  }
  if (vsMed != null && vsMed >= 8) {
    return `On pace above your median (+${vsMed.toFixed(0)}%). Keep the line clean.`;
  }
  if (vsMed != null && vsMed <= -10 && stats.count >= 3) {
    return `Trash pace is soft vs your median (${vsMed.toFixed(0)}%). Check density or consider a switch.`;
  }
  if (kind === "trash-heavy") {
    return "Stable trash print — this is the signal that matters for spot quality.";
  }
  return "Balanced pull — trash foundation with some lottery on top.";
}

export function topContributors(lines: LineValue[], n = 3): LineValue[] {
  return [...lines]
    .filter((l) => l.lineValue > 0)
    .sort((a, b) => b.lineValue - a.lineValue)
    .slice(0, n);
}

/** Board sort: value contribution first, then rarity tier, then name. */
export function sortBoardLoots(
  loots: LootRow[],
  qty: Record<string, number | string>,
): LootRow[] {
  const lines = valueLines(loots, qty);
  const byId = new Map(lines.map((l) => [l.loot.id, l]));
  return [...loots].sort((a, b) => {
    const la = byId.get(a.id)!;
    const lb = byId.get(b.id)!;
    if (la.lineValue !== lb.lineValue) return lb.lineValue - la.lineValue;
    // Active items (any qty) before zero
    if ((la.qty > 0) !== (lb.qty > 0)) return la.qty > 0 ? -1 : 1;
    // Trash money items slightly before ultra-rares when equal zero
    if (la.trash !== lb.trash) return la.trash ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function rarityWeight(r: LootRarity): number {
  switch (r) {
    case "legendary":
      return 5;
    case "epic":
      return 4;
    case "rare":
      return 3;
    case "uncommon":
      return 2;
    default:
      return 1;
  }
}
