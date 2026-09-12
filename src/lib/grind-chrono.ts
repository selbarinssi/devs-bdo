export type SpotChrono = {
  character: string;
  minutes: string;
  qty: Record<string, string>;
  timerOn: boolean;
  elapsed: number;
  anchorMs: number | null;
};

export type ChronoStore = {
  lastSpotId: string | null;
  bySpot: Record<string, SpotChrono>;
};

const CHRONO_KEY = "bdo_grind_chrono_v2";

export function emptySpotChrono(): SpotChrono {
  return { character: "", minutes: "60", qty: {}, timerOn: false, elapsed: 0, anchorMs: null };
}

export function readStore(): ChronoStore {
  if (typeof window === "undefined") return { lastSpotId: null, bySpot: {} };
  try {
    const raw = localStorage.getItem(CHRONO_KEY);
    if (!raw) return { lastSpotId: null, bySpot: {} };
    const p = JSON.parse(raw) as ChronoStore;
    return { lastSpotId: p.lastSpotId ?? null, bySpot: p.bySpot && typeof p.bySpot === "object" ? p.bySpot : {} };
  } catch {
    return { lastSpotId: null, bySpot: {} };
  }
}

export function writeStore(s: ChronoStore) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHRONO_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
