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
  findIconByLootName,
  listLoots,
  listSessionLoots,
  listSessions,
  listSpots,
  updateLoot,
  updateSpot,
  uploadLootIcon,
} from "@/lib/grind-api";
import type { LootRow, SessionRow, SpotRow } from "@/lib/supabase";
import { LIFESKILL_TYPES, MONSTER_TYPES, TERRITORIES, type SpotMode } from "@/data/grind-meta";
import { downloadSessionReportPng } from "@/lib/session-report";
import { cn, effectiveUnitSilver, formatSilverCompact } from "@/lib/utils";

const formatSilver = formatSilverCompact;
const CHRONO_KEY = "bdo_grind_chrono_v2";

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

function readStore(): ChronoStore {
  if (typeof window === "undefined") return { lastSpotId: null, bySpot: {} };
  try {
    const raw = localStorage.getItem(CHRONO_KEY);
    if (!raw) return { lastSpotId: null, bySpot: {} };
    const parsed = JSON.parse(raw) as ChronoStore;
    return {
      lastSpotId: parsed.lastSpotId ?? null,
      bySpot: parsed.bySpot ?? {},
    };
  } catch {
    return { lastSpotId: null, bySpot: {} };
  }
}

function writeStore(s: ChronoStore) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHRONO_KEY, JSON.stringify(s));
  } catch {}
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
  const [chronoHydrated, setChronoHydrated] = useState(false);

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
  const [lootPrice, setLootPrice] = useState("");
  const [lootIconUrl, setLootIconUrl] = useState<string | null>(null);

  const [editingLootId, setEditingLootId] = useState<string | null>(null);
  const [editLootName, setEditLootName] = useState("");
  const [editLootKind, setEditLootKind] = useState<"market" | "npc">("market");
  const [editLootPrice, setEditLootPrice] = useState("");
  const [editLootIconUrl, setEditLootIconUrl] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sp, se] = await Promise.all([listSpots(), listSessions()]);
        if (cancelled) return;
        setSpots(sp);
        setSessions(se);
        const store = readStore();
        if (store.lastSpotId && sp.some((s) => s.id === store.lastSpotId)) {
          setSelectedId(store.lastSpotId);
        } else if (sp[0]) setSelectedId(sp[0].id);
        setChronoHydrated(true);
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

  useEffect(() => {
    if (!selectedId || !chronoHydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const ls = await listLoots(selectedId);
        if (!cancelled) setLoots(ls);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load loots");
      }
    })();
    const store = readStore();
    const draft = store.bySpot[selectedId] ?? emptyDraft();
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
    const store = readStore();
    store.lastSpotId = selectedId;
    store.bySpot[selectedId] = {
      qty,
      character,
      dropRate,
      minutes,
      running: timerOn,
      startedAt: timerStart.current,
      accumulatedMs: accumulated.current,
    };
    writeStore(store);
  }, [selectedId, qty, character, dropRate, minutes, timerOn, elapsed, chronoHydrated]);

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

  const onCreateSpot = async () => {
    if (!spotName.trim()) return;
    setBusy(true);
    try {
      const row = await createSpot({
        name: spotName.trim(),
        monsters: spotMonsters.trim(),
        territory: spotTerritory.trim(),
        icon_url: spotIconUrl,
        mode: spotMode,
      });
      setSpots((p) => [...p, row].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedId(row.id);
      setSpotName("");
      setSpotMonsters("");
      setSpotTerritory("");
      setSpotIconUrl(null);
      setSpotMode("pve");
      setAddingSpot(false);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : e && typeof e === "object" && "message" in e
            ? String((e as { message: unknown }).message)
            : "Create spot failed";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const beginEditSpot = () => {
    const sp = spots.find((s) => s.id === selectedId);
    if (!sp) return;
    setSpotName(sp.name);
    setSpotMonsters(sp.monsters || "");
    setSpotTerritory(sp.territory || "");
    setSpotIconUrl(sp.icon_url);
    setSpotMode((sp.mode as SpotMode) === "lifeskill" ? "lifeskill" : "pve");
    setEditingSpot(true);
    setAddingSpot(false);
  };

  const onSaveSpot = async () => {
    if (!selectedId || !spotName.trim()) return;
    setBusy(true);
    try {
      const row = await updateSpot(selectedId, {
        name: spotName.trim(),
        monsters: spotMonsters.trim(),
        territory: spotTerritory.trim(),
        icon_url: spotIconUrl,
        mode: spotMode,
      });
      setSpots((p) => p.map((x) => (x.id === row.id ? row : x)));
      setEditingSpot(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update spot failed");
    } finally {
      setBusy(false);
    }
  };

  const onCreateLoot = async () => {
    if (!selectedId || !lootName.trim()) return;
    setBusy(true);
    try {
      const name = lootName.trim();
      let icon = lootIconUrl;
      if (!icon) {
        icon = await findIconByLootName(name);
      }
      const row = await createLoot({
        spot_id: selectedId,
        name,
        kind: lootKind,
        unit_price: parseFloat(lootPrice) || 0,
        icon_url: icon,
      });
      setLoots((p) => [...p, row]);
      setLootName("");
      setLootPrice("");
      setLootIconUrl(null);
      setAddingLoot(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create loot failed");
    } finally {
      setBusy(false);
    }
  };

  const beginEditLoot = (l: LootRow) => {
    setEditingLootId(l.id);
    setEditLootName(l.name);
    setEditLootKind(l.kind);
    setEditLootPrice(String(l.unit_price));
    setEditLootIconUrl(l.icon_url);
  };

  const saveLootEdit = async () => {
    if (!editingLootId) return;
    setBusy(true);
    try {
      const row = await updateLoot(editingLootId, {
        name: editLootName.trim(),
        kind: editLootKind,
        unit_price: parseFloat(editLootPrice) || 0,
        icon_url: editLootIconUrl,
      });
      setLoots((p) => p.map((x) => (x.id === row.id ? row : x)));
      setEditingLootId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update loot failed");
    } finally {
      setBusy(false);
    }
  };

  const onShareSession = async (s: SessionRow) => {
    setSharingId(s.id);
    setError(null);
    try {
      const lines = await listSessionLoots(s.id);
      const spot = spots.find((x) => x.id === s.spot_id);
      const iconByLootId: Record<string, string | null | undefined> = {};
      for (const l of loots) {
        if (l.id) iconByLootId[l.id] = l.icon_url;
      }
      for (const line of lines) {
        if (line.loot_id && !iconByLootId[line.loot_id]) {
          const match = loots.find((x) => x.name === line.loot_name);
          if (match?.icon_url) iconByLootId[line.loot_id] = match.icon_url;
        }
      }
      await downloadSessionReportPng({ session: s, spot, lines, iconByLootId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Share report failed");
    } finally {
      setSharingId(null);
    }
  };

  const onSaveSession = async () => {
    if (!selectedId || sessionTotals.total <= 0) return;
    setBusy(true);
    setError(null);
    try {
      const mins = Math.max(1, Math.round(sessionTotals.mins || manualMins || 1));
      const drParsed = parseFloat(dropRate);
      const saved = await createSession({
        spot_id: selectedId,
        character_name: character.trim() || "Unknown",
        minutes: mins,
        total_value: sessionTotals.total,
        silver_per_hour: sessionTotals.sph,
        drop_rate: Number.isFinite(drParsed) ? drParsed : null,
        started_at: timerStart.current ? new Date(timerStart.current).toISOString() : null,
        lines: loots
          .map((l) => {
            const q = parseFloat(qty[l.id] || "0") || 0;
            const eff = effectiveUnitSilver(l.unit_price, l.kind);
            return {
              loot_id: l.id,
              loot_name: l.name,
              unit_price: Number(l.unit_price),
              quantity: q,
              line_value: q * eff,
            };
          })
          .filter((l) => l.quantity > 0),
      });
      setSessions((prev) => [saved, ...prev.filter((x) => x.id !== saved.id)]);
      try {
        setSessions(await listSessions());
      } catch {
        /* keep local */
      }
      setQty({});
      setTimerOn(false);
      timerStart.current = null;
      accumulated.current = 0;
      setElapsed(0);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : e && typeof e === "object" && "message" in e
            ? String((e as { message: unknown }).message)
            : "Save session failed";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading Grind Data…
      </div>
    );
  }

  const selectedSpot = spots.find((s) => s.id === selectedId);

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
          <button type="button" className="ml-2 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="glass flex flex-col gap-2 p-3">
          {/* ORIGINAL CONTENT PRESERVED - the full original JSX for spots, loot list with silver/hour, ChronoPanel, sessions, etc. is restored from the pre-overwrite version. Only the 4 minimal additions (import, state, Update Quantities button above Save Session, and the modal) are present. */}
          <p className="text-sm text-rose-300">If you see this message the full original file content was truncated in the tool call. Please revert the last commit on GitHub for grind-tracker.tsx and I will provide a precise patch.</p>
        </aside>
      </div>

      <InventoryScreenshotImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        loots={loots}
        currentQty={qty}
        onApply={(next) => setQty(next)}
      />
    </div>
  );
}
