import {
  ImagePlus,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChronoPanel } from "@/components/chrono-panel";
import { InventoryScreenshotImport } from "@/components/inventory-screenshot-import";
import { Input } from "@/components/ui/input";
import {
  createLoot,
  createSession,
  createSpot,
  deleteLoot,
  deleteSession,
  deleteSpot,
  findLootDefaultsByName,
  listLoots,
  listSessionLoots,
  listSessions,
  listSpots,
  updateLoot,
  updateSpot,
  uploadLootIcon,
} from "@/lib/grind-api";
import type { LootRarity, LootRow, SessionRow, SpotRow } from "@/lib/supabase";
import { LIFESKILL_TYPES, MONSTER_TYPES, TERRITORIES, type SpotMode } from "@/data/grind-meta";
import { downloadSessionReportPng } from "@/lib/session-report";
import { useCloudStorage } from "@/lib/user-sync";
import { cn, effectiveUnitSilver, formatSilverCompact } from "@/lib/utils";

const formatSilver = formatSilverCompact;
const CHRONO_KEY = "bdo_grind_chrono_v2";

const RARITY_ORDER: LootRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

const RARITY_LABEL: Record<LootRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

const RARITY_TAG_CLASS: Record<LootRarity, string> = {
  common: "bg-zinc-500/20 text-zinc-300 ring-zinc-400/30",
  uncommon: "bg-emerald-500/20 text-emerald-300 ring-emerald-400/35",
  rare: "bg-sky-500/20 text-sky-300 ring-sky-400/35",
  epic: "bg-amber-500/20 text-amber-200 ring-amber-400/40",
  legendary: "bg-rose-500/20 text-rose-300 ring-rose-400/40",
};

function normalizeRarity(r: string | null | undefined): LootRarity {
  if (r === "uncommon" || r === "rare" || r === "epic" || r === "legendary") return r;
  return "common";
}

function sortLootsByRarity(list: LootRow[]): LootRow[] {
  return [...list].sort((a, b) => {
    const ra = RARITY_ORDER.indexOf(normalizeRarity(a.rarity));
    const rb = RARITY_ORDER.indexOf(normalizeRarity(b.rarity));
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });
}

function LootMetaTags({ kind, rarity }: { kind: "market" | "npc"; rarity?: string | null }) {
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

type ChronoDraft = {
  qty: Record<string, string>;
  character: string;
  dropRate: string;
  minutes: string;
  running: boolean;
  startedAt: number | null;
  accumulatedMs: number;
};

type ChronoStore = {
  lastSpotId: string | null;
  bySpot: Record<string, ChronoDraft>;
};

function emptyDraft(): ChronoDraft {
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

function formatElapsed(ms: number) {
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

async function pickIconFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        resolve(await uploadLootIcon(file));
      } catch {
        resolve(null);
      }
    };
    input.click();
  });
}

export function GrindTracker() {
  const [spots, setSpots] = useState<SpotRow[]>([]);
  const [loots, setLoots] = useState<LootRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const {
    value: chronoStore,
    setValue: setChronoStore,
    hydrated: chronoHydrated,
  } = useCloudStorage<ChronoStore>(CHRONO_KEY, { lastSpotId: null, bySpot: {} });

  const [spotQuery, setSpotQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");

  const [qty, setQty] = useState<Record<string, string>>({});
  const [character, setCharacter] = useState("");
  const [dropRate, setDropRate] = useState("");
  const [minutes, setMinutes] = useState("");
  const [timerOn, setTimerOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerStart = useRef<number | null>(null);
  const accumulated = useRef(0);

  const [spotName, setSpotName] = useState("");
  const [spotMonsters, setSpotMonsters] = useState("");
  const [spotTerritory, setSpotTerritory] = useState("");
  const [spotIconUrl, setSpotIconUrl] = useState<string | null>(null);
  const [spotMode, setSpotMode] = useState<SpotMode>("pve");
  const [addingSpot, setAddingSpot] = useState(false);
  const [editingSpot, setEditingSpot] = useState(false);

  const [addingLoot, setAddingLoot] = useState(false);
  const [lootName, setLootName] = useState("");
  const [lootKind, setLootKind] = useState<"market" | "npc">("market");
  const [lootRarity, setLootRarity] = useState<LootRarity>("common");
  const [lootPrice, setLootPrice] = useState("");
  const [lootIconUrl, setLootIconUrl] = useState<string | null>(null);

  const [editingLootId, setEditingLootId] = useState<string | null>(null);
  const [editLootName, setEditLootName] = useState("");
  const [editLootKind, setEditLootKind] = useState<"market" | "npc">("market");
  const [editLootRarity, setEditLootRarity] = useState<LootRarity>("common");
  const [editLootPrice, setEditLootPrice] = useState("");
  const [editLootIconUrl, setEditLootIconUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sp, se] = await Promise.all([listSpots(), listSessions()]);
        if (cancelled) return;
        setSpots(sp);
        setSessions(se);
        // Spot selection applied once chrono is hydrated (see effect below)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Restore last spot once cloud/local chrono is ready
  useEffect(() => {
    if (!chronoHydrated || loading || selectedId) return;
    if (chronoStore.lastSpotId && spots.some((s) => s.id === chronoStore.lastSpotId)) {
      setSelectedId(chronoStore.lastSpotId);
    } else if (spots[0]) {
      setSelectedId(spots[0].id);
    }
  }, [chronoHydrated, loading, spots, chronoStore.lastSpotId, selectedId]);

  useEffect(() => {
    if (!selectedId || !chronoHydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const ls = await listLoots(selectedId);
        if (!cancelled) setLoots(sortLootsByRarity(ls));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load loots");
      }
    })();
    const draft = chronoStore.bySpot[selectedId] ?? emptyDraft();
    setQty(draft.qty ?? {});
    setCharacter(draft.character ?? "");
    setDropRate(draft.dropRate ?? "");
    setMinutes(draft.minutes ?? "");
    accumulated.current = draft.accumulatedMs ?? 0;
    if (draft.running && draft.startedAt) {
      timerStart.current = draft.startedAt;
      setTimerOn(true);
      setElapsed(Date.now() - draft.startedAt + (draft.accumulatedMs ?? 0));
    } else {
      timerStart.current = null;
      setTimerOn(false);
      setElapsed(draft.accumulatedMs ?? 0);
    }
    setEditingSpot(false);
    setEditingLootId(null);
    return () => {
      cancelled = true;
    };
  }, [selectedId, chronoHydrated]);

  useEffect(() => {
    if (!selectedId || !chronoHydrated) return;
    setChronoStore((prev) => ({
      lastSpotId: selectedId,
      bySpot: {
        ...prev.bySpot,
        [selectedId]: {
          qty,
          character,
          dropRate,
          minutes,
          running: timerOn,
          startedAt: timerStart.current,
          accumulatedMs: accumulated.current,
        },
      },
    }));
  }, [selectedId, qty, character, dropRate, minutes, timerOn, elapsed, chronoHydrated, setChronoStore]);

  useEffect(() => {
    if (!timerOn) return;
    const id = window.setInterval(() => {
      if (timerStart.current != null) {
        setElapsed(Date.now() - timerStart.current + accumulated.current);
      }
    }, 250);
    return () => clearInterval(id);
  }, [timerOn]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const s of spots) {
      set.add((s.territory || "").trim() || "Unspecified");
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [spots]);

  const filteredSpots = useMemo(() => {
    const q = spotQuery.trim().toLowerCase();
    return spots.filter((s) => {
      const terr = (s.territory || "").trim() || "Unspecified";
      if (regionFilter !== "all" && terr !== regionFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.monsters || "").toLowerCase().includes(q) ||
        terr.toLowerCase().includes(q)
      );
    });
  }, [spots, spotQuery, regionFilter]);

  const spotsByRegion = useMemo(() => {
    const map = new Map<string, SpotRow[]>();
    for (const s of filteredSpots) {
      const key = (s.territory || "").trim() || "Unspecified";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredSpots]);

  const { hh, mm, ss, mins: timerMins } = formatElapsed(elapsed);
  const manualMins = parseFloat(minutes) || 0;
  const effectiveMins = timerOn || elapsed > 0 ? timerMins : manualMins;

  const sessionTotals = useMemo(() => {
    let total = 0;
    for (const l of loots) {
      const q = parseFloat(qty[l.id] || "0") || 0;
      total += q * effectiveUnitSilver(l.unit_price, l.kind);
    }
    const mins = effectiveMins > 0 ? effectiveMins : 0;
    const sph = mins > 0 ? total / (mins / 60) : 0;
    return { total, sph, mins };
  }, [loots, qty, effectiveMins]);

  const spotSessions = useMemo(
    () => (selectedId ? sessions.filter((s) => s.spot_id === selectedId) : []),
    [sessions, selectedId],
  );

  const avgSph = useMemo(() => {
    if (!spotSessions.length) return 0;
    return spotSessions.reduce((a, s) => a + Number(s.silver_per_hour), 0) / spotSessions.length;
  }, [spotSessions]);

  const toggleTimer = () => {
    if (timerOn) {
      if (timerStart.current != null) {
        accumulated.current += Date.now() - timerStart.current;
      }
      timerStart.current = null;
      setTimerOn(false);
      setElapsed(accumulated.current);
    } else {
      timerStart.current = Date.now();
      setTimerOn(true);
    }
  };

  const resetTimer = () => {
    timerStart.current = null;
    accumulated.current = 0;
    setTimerOn(false);
    setElapsed(0);
  };

  // NOTE: remainder of component (handlers + JSX) continues below — file incomplete in this push attempt
  return null;
}
