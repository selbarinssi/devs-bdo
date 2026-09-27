/** Active pull + board prefs (local + cloud via useCloudStorage). */
export const CHRONO_KEY = "bdo_grind_pull_v3";
/** Legacy key — migrated once on load. */
export const CHRONO_KEY_LEGACY = "bdo_grind_chrono_v2";

export type PullDraft = {
  /** lootId → quantity */
  qty: Record<string, number>;
  pilot: string;
  dropRate: string;
  /** manual minutes override when timer not used */
  minutes: string;
  agris: boolean;
  /** lootId → hotkey digit 1-9 */
  hotkeys: Record<string, string>;
  favoriteLootIds: string[];
  running: boolean;
  startedAt: number | null;
  accumulatedMs: number;
  /** rolling silver/h samples for pulse sparkline */
  pulse: { t: number; sph: number }[];
};

export type PullStore = {
  lastSpotId: string | null;
  lastPilot: string;
  pilots: string[];
  favoriteSpotIds: string[];
  bySpot: Record<string, PullDraft>;
};

export function emptyDraft(): PullDraft {
  return {
    qty: {},
    pilot: "",
    dropRate: "",
    minutes: "",
    agris: false,
    hotkeys: {},
    favoriteLootIds: [],
    running: false,
    startedAt: null,
    accumulatedMs: 0,
    pulse: [],
  };
}

export function emptyStore(): PullStore {
  return {
    lastSpotId: null,
    lastPilot: "",
    pilots: [],
    favoriteSpotIds: [],
    bySpot: {},
  };
}

/** Migrate v2 chrono drafts into pull store shape. */
export function migrateLegacyStore(raw: unknown): PullStore | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if ("bySpot" in o && "pilots" in o) return null; // already v3-ish
  const bySpotIn = (o.bySpot ?? {}) as Record<string, Record<string, unknown>>;
  const bySpot: Record<string, PullDraft> = {};
  for (const [id, d] of Object.entries(bySpotIn)) {
    const qtyRaw = (d.qty ?? {}) as Record<string, string | number>;
    const qty: Record<string, number> = {};
    for (const [k, v] of Object.entries(qtyRaw)) {
      const n = Number(v);
      if (n > 0) qty[k] = n;
    }
    bySpot[id] = {
      ...emptyDraft(),
      qty,
      pilot: String(d.character ?? ""),
      dropRate: String(d.dropRate ?? ""),
      minutes: String(d.minutes ?? ""),
      agris: d.agris === "on" || Number(d.agris) > 0,
      running: Boolean(d.running),
      startedAt: typeof d.startedAt === "number" ? d.startedAt : null,
      accumulatedMs: Number(d.accumulatedMs) || 0,
    };
  }
  return {
    lastSpotId: (o.lastSpotId as string) ?? null,
    lastPilot: "",
    pilots: [],
    favoriteSpotIds: [],
    bySpot,
  };
}

export function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return {
    hh: String(h).padStart(2, "0"),
    mm: String(m).padStart(2, "0"),
    ss: String(s).padStart(2, "0"),
    mins: total / 60,
    totalSec: total,
  };
}

export function bumpQty(
  qty: Record<string, number>,
  lootId: string,
  delta: number,
): Record<string, number> {
  const next = { ...qty };
  const v = Math.max(0, (next[lootId] || 0) + delta);
  if (v <= 0) delete next[lootId];
  else next[lootId] = v;
  return next;
}

export function setQtyValue(
  qty: Record<string, number>,
  lootId: string,
  value: number,
): Record<string, number> {
  const next = { ...qty };
  if (!Number.isFinite(value) || value <= 0) delete next[lootId];
  else next[lootId] = Math.floor(value);
  return next;
}
