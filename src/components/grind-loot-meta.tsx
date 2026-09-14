import type { LootRarity, LootRow } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const RARITY_ORDER: LootRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

export const RARITY_LABEL: Record<LootRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

export const RARITY_TAG_CLASS: Record<LootRarity, string> = {
  common: "bg-zinc-500/20 text-zinc-300 ring-zinc-400/30",
  uncommon: "bg-emerald-500/20 text-emerald-300 ring-emerald-400/35",
  rare: "bg-sky-500/20 text-sky-300 ring-sky-400/35",
  epic: "bg-amber-500/20 text-amber-200 ring-amber-400/40",
  legendary: "bg-rose-500/20 text-rose-300 ring-rose-400/40",
};

export function normalizeRarity(r: string | null | undefined): LootRarity {
  if (r === "uncommon" || r === "rare" || r === "epic" || r === "legendary") return r;
  return "common";
}

export function sortLootsByRarity(list: LootRow[]): LootRow[] {
  return [...list].sort((a, b) => {
    const ra = RARITY_ORDER.indexOf(normalizeRarity(a.rarity));
    const rb = RARITY_ORDER.indexOf(normalizeRarity(b.rarity));
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });
}

export function LootMetaTags({ kind, rarity }: { kind: "market" | "npc"; rarity?: string | null }) {
  const r = normalizeRarity(rarity);
  return (
    <>
      <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground ring-1 ring-white/10">
        {kind === "market" ? "Market" : "NPC"}
      </span>
      <span className={cn("rounded-md px-1.5 py-0.5 text-[0.65rem] font-semibold ring-1", RARITY_TAG_CLASS[r])}>
        {RARITY_LABEL[r]}
      </span>
    </>
  );
}
