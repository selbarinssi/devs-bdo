// src/data/world-bosses.ts
export type BossId =
  | "kzarka"
  | "karanda"
  | "nouver"
  | "kutum"
  | "garmoth"
  | "vell"
  | "quint"
  | "muraka"
  | "offin"
  | "uturi"
  | "sangoon"
  | "bulgasal"
  | "golden_pig";

export const BOSS_META: Record<
  BossId,
  { name: string; short: string; color: string; icon: string }
> = {
  kzarka: {
    name: "Kzarka",
    short: "Kzarka",
    color: "#f87171",
    // Prefer hosting these in /public/bosses/ yourself for reliability
    icon: "https://bdocodex.com/items/ui_artwork/ic_04082.webp",
  },
  karanda: {
    name: "Karanda",
    short: "Karanda",
    color: "#c084fc",
    icon: "https://bdocodex.com/items/ui_artwork/ic_04370.webp",
  },
  nouver: {
    name: "Nouver",
    short: "Nouver",
    color: "#fbbf24",
    icon: "https://bdocodex.com/items/ui_artwork/ic_04920.webp",
  },
  kutum: {
    name: "Ancient Kutum",
    short: "Kutum",
    color: "#34d399",
    icon: "https://bdocodex.com/items/ui_artwork/collected_study.webp",
  },
  garmoth: {
    name: "Garmoth",
    short: "Garmoth",
    color: "#fb7185",
    icon: "/bosses/garmoth.jpeg", // replace if wrong
  },
  vell: {
    name: "Vell",
    short: "Vell",
    color: "#67e8f9",
    icon: "/bosses/vell.jpeg",
  },
  quint: {
    name: "Quint",
    short: "Quint",
    color: "#a78bfa",
    icon: "https://bdocodex.com/items/ui_artwork/ic_05056.webp",
  },
  muraka: {
    name: "Muraka",
    short: "Muraka",
    color: "#f472b6",
    icon: "https://bdocodex.com/items/ui_artwork/ic_05057.webp",
  },
  offin: {
    name: "Offin",
    short: "Offin",
    color: "#94a3b8",
    icon: "https://bdocodex.com/items/ui_artwork/ic_04110.webp",
  },
  uturi: {
    name: "Uturi",
    short: "Uturi",
    color: "#22d3ee",
    icon: "/bosses/uturi.jpeg",
  },
  sangoon: {
    name: "Sangoon",
    short: "Sangoon",
    color: "#f59e0b",
    icon: "/bosses/sangoon.jpeg",
  },
  bulgasal: {
    name: "Bulgasal",
    short: "Bulgasal",
    color: "#ef4444",
    icon: "/bosses/bulgasal.jpeg",
  },
  golden_pig: {
    name: "Golden Pig King",
    short: "Pig",
    color: "#facc15",
    icon: "/bosses/goldenpig.jpeg",
  },
};

/** Normalize API names → our BossId */
export function normalizeBossName(raw: string): BossId | null {
  const n = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (n.includes("kzarka")) return "kzarka";
  if (n.includes("karanda")) return "karanda";
  if (n.includes("nouver")) return "nouver";
  if (n.includes("kutum")) return "kutum";
  if (n.includes("garmoth")) return "garmoth";
  if (n.includes("vell")) return "vell";
  if (n.includes("quint")) return "quint";
  if (n.includes("muraka")) return "muraka";
  if (n.includes("offin")) return "offin";
  if (n.includes("uturi")) return "uturi";
  if (n.includes("sangoon") || n.includes("san-gun") || n.includes("sanguun")) return "sangoon";
  if (n.includes("bulgasal") || n.includes("pulgasari")) return "bulgasal";
  if (n.includes("pig") || n.includes("golden")) return "golden_pig";
  return null;
}
