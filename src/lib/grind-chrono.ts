/** Grind session draft + timer state (local + cloud via useCloudStorage). */
export const CHRONO_KEY = "bdo_grind_chrono_v2";

export type ChronoDraft = {
  qty: Record<string, string>;
  character: string;
  dropRate: string;
  minutes: string;
  running: boolean;
  startedAt: number | null;
  accumulatedMs: number;
};

export type ChronoStore = {
  lastSpotId: string | null;
  bySpot: Record<string, ChronoDraft>;
};

export function emptyDraft(): ChronoDraft {
  return {
    qty: {},
    character: "",
    dropRate: "",
    minutes: "",
    running: false,
    startedAt: null,
    accumulatedMs: 0,
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
  };
}
