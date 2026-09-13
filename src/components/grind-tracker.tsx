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
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">Spots</p>
            <button
              type="button"
              onClick={() => {
                setAddingSpot((v) => !v);
                setEditingSpot(false);
                setSpotName("");
                setSpotMonsters("");
                setSpotTerritory("");
                setSpotIconUrl(null);
                setSpotMode("pve");
              }}
              className="btn-ghost h-7 px-2 text-[0.65rem]"
            >
              <Plus className="size-3" /> Add Spot
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={spotQuery} onChange={(e) => setSpotQuery(e.target.value)} placeholder="Search Spots…" className="h-8 pl-8 text-xs" />
          </div>
          <select className="field-select h-8 w-full text-xs" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r === "all" ? "All Regions" : r}
              </option>
            ))}
          </select>

          {addingSpot && (
            <div className="mb-1 flex flex-col gap-1.5 rounded-lg bg-white/5 p-2">
              <Input value={spotName} onChange={(e) => setSpotName(e.target.value)} placeholder="Name" className="h-8 text-xs" />
              <div className="grid grid-cols-2 gap-1">
                <button type="button" onClick={() => setSpotMode("pve")} className={cn("h-8 rounded-md text-[0.65rem] font-semibold ring-1 transition", spotMode === "pve" ? "bg-cyan-400/15 text-cyan-200 ring-cyan-400/40" : "bg-white/5 text-muted-foreground ring-white/10")}>
                  Monsters
                </button>
                <button type="button" onClick={() => setSpotMode("lifeskill")} className={cn("h-8 rounded-md text-[0.65rem] font-semibold ring-1 transition", spotMode === "lifeskill" ? "bg-emerald-400/15 text-emerald-200 ring-emerald-400/40" : "bg-white/5 text-muted-foreground ring-white/10")}>
                  Lifeskill
                </button>
              </div>
              <select className="field-select h-8 w-full text-xs" value={spotTerritory} onChange={(e) => setSpotTerritory(e.target.value)}>
                <option value="">Region…</option>
                {TERRITORIES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <select className="field-select h-8 w-full text-xs" value={spotMonsters} onChange={(e) => setSpotMonsters(e.target.value)}>
                <option value="">{spotMode === "lifeskill" ? "Lifeskill type…" : "Monster type…"}</option>
                {(spotMode === "lifeskill" ? LIFESKILL_TYPES : MONSTER_TYPES).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button type="button" onClick={async () => setSpotIconUrl(await pickIconFile())} className="btn-ghost flex h-8 items-center justify-center gap-1.5 text-[0.65rem]">
                <ImagePlus className="size-3.5" />
                {spotIconUrl ? "Change Icon" : "Add Icon"}
              </button>
              {spotIconUrl && <img src={spotIconUrl} alt="" className="mx-auto size-10 rounded object-contain" />}
              <button type="button" onClick={onCreateSpot} disabled={busy} className="btn-primary h-8 text-[0.65rem]">Create</button>
            </div>
          )}

          <div className="flex max-h-[55vh] flex-col gap-3 overflow-auto">
            {spotsByRegion.map(([terr, list]) => (
              <div key={terr}>
                <div className="mb-1 flex items-center gap-1.5 px-1">
                  <MapPin className="size-3 text-cyan-400/80" />
                  <span className="text-[0.6rem] font-bold uppercase tracking-wider text-cyan-300/80">{terr}</span>
                </div>
                <ul className="flex flex-col gap-1">
                  {list.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(s.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition",
                          selectedId === s.id ? "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/30" : "hover:bg-white/5 text-foreground",
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          {s.icon_url ? (
                            <img src={s.icon_url} alt="" className="size-8 shrink-0 rounded object-contain" />
                          ) : (
                            <span className="flex size-8 shrink-0 items-center justify-center rounded bg-white/5 text-[0.65rem] font-bold text-cyan-300">{s.name[0]?.toUpperCase()}</span>
                          )}
                          <span className="truncate font-medium">{s.name}</span>
                        </span>
                        <button
                          type="button"
                          className="ml-1 text-muted-foreground hover:text-rose-400"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await deleteSpot(s.id);
                            setSpots((p) => p.filter((x) => x.id !== s.id));
                            if (selectedId === s.id) setSelectedId(null);
                          }}
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {filteredSpots.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">No Spots Match</p>
            )}
          </div>
        </aside>

        <div className="flex flex-col gap-3">
          {!selectedId ? (
            <p className="glass py-16 text-center text-sm text-muted-foreground">Select Or Add A Spot</p>
          ) : (
            <>
              <div className="glass flex flex-wrap items-center justify-between gap-2 p-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  {selectedSpot?.icon_url ? (
                    <img src={selectedSpot.icon_url} alt="" className="size-10 rounded object-contain" />
                  ) : (
                    <span className="flex size-10 items-center justify-center rounded bg-white/5 text-sm font-bold text-cyan-300">{selectedSpot?.name[0]?.toUpperCase()}</span>
                  )}
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold sm:text-lg">{selectedSpot?.name}</h3>
                    <p className="truncate text-xs text-muted-foreground sm:text-sm">
                      {selectedSpot?.monsters}
                      {selectedSpot?.territory ? ` · ${selectedSpot.territory}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {avgSph > 0 && (
                    <span className="metric-pill bg-emerald-400/10 text-sm text-emerald-300">Avg {formatSilver(avgSph)}/h</span>
                  )}
                  <button type="button" onClick={beginEditSpot} className="btn-ghost h-8 px-2.5 text-xs">
                    <Pencil className="size-3.5" /> Edit Spot
                  </button>
                </div>
              </div>

              {editingSpot && (
                <div className="glass grid gap-2 p-3 sm:grid-cols-2">
                  <Input value={spotName} onChange={(e) => setSpotName(e.target.value)} placeholder="Name" className="h-9 text-sm sm:col-span-2" />
                  <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                    <button type="button" onClick={() => setSpotMode("pve")} className={cn("h-9 rounded-md text-xs font-semibold ring-1 transition", spotMode === "pve" ? "bg-cyan-400/15 text-cyan-200 ring-cyan-400/40" : "bg-white/5 text-muted-foreground ring-white/10")}>Monsters</button>
                    <button type="button" onClick={() => setSpotMode("lifeskill")} className={cn("h-9 rounded-md text-xs font-semibold ring-1 transition", spotMode === "lifeskill" ? "bg-emerald-400/15 text-emerald-200 ring-emerald-400/40" : "bg-white/5 text-muted-foreground ring-white/10")}>Lifeskill</button>
                  </div>
                  <select className="field-select h-9 w-full text-sm" value={spotTerritory} onChange={(e) => setSpotTerritory(e.target.value)}>
                    <option value="">Region…</option>
                    {TERRITORIES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <select className="field-select h-9 w-full text-sm" value={spotMonsters} onChange={(e) => setSpotMonsters(e.target.value)}>
                    <option value="">{spotMode === "lifeskill" ? "Lifeskill type…" : "Monster type…"}</option>
                    {(spotMode === "lifeskill" ? LIFESKILL_TYPES : MONSTER_TYPES).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <button type="button" onClick={async () => setSpotIconUrl(await pickIconFile())} className="btn-ghost flex h-9 items-center justify-center gap-1.5 text-xs">
                    <ImagePlus className="size-4" />
                    {spotIconUrl ? "Change Icon" : "Add Icon"}
                  </button>
                  {spotIconUrl && <img src={spotIconUrl} alt="" className="size-10 justify-self-start rounded object-contain" />}
                  <div className="flex gap-2 sm:col-span-2">
                    <button type="button" onClick={onSaveSpot} disabled={busy} className="btn-primary h-9 flex-1 text-sm">Save Spot</button>
                    <button type="button" onClick={() => setEditingSpot(false)} className="btn-ghost h-9 px-3 text-sm">Cancel</button>
                  </div>
                </div>
              )}

              <ChronoPanel
                hh={hh}
                mm={mm}
                ss={ss}
                timerOn={timerOn}
                total={sessionTotals.total}
                sph={sessionTotals.sph}
                character={character}
                dropRate={dropRate}
                minutes={minutes}
                onToggle={toggleTimer}
                onReset={resetTimer}
                onCharacter={setCharacter}
                onDropRate={setDropRate}
                onMinutes={setMinutes}
              />

              <div className="glass p-3 sm:p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">Loot</p>
                  <button type="button" onClick={() => setAddingLoot((v) => !v)} className="btn-ghost h-8 px-2.5 text-xs">
                    <Plus className="size-3.5" /> Add
                  </button>
                </div>

                {loots.length > 0 && (
                  <div className="mb-1.5 grid grid-cols-[minmax(0,1fr)_4.25rem_5.25rem_4rem_5.25rem_4.5rem] items-center gap-1.5 px-2 text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground sm:grid-cols-[minmax(0,1fr)_5rem_6rem_4.5rem_6rem_5rem] sm:gap-2">
                    <span>Item</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right">Total</span>
                    <span className="text-right">%</span>
                    <span className="text-right">/h</span>
                    <span />
                  </div>
                )}

                {addingLoot && (
                  <div className="mb-2 grid grid-cols-2 gap-1.5 rounded-lg bg-white/5 p-2 sm:grid-cols-5">
                    <Input value={lootName} onChange={(e) => setLootName(e.target.value)} placeholder="Item" className="h-9 text-sm" />
                    <select className="field-select h-9 text-sm" value={lootKind} onChange={(e) => setLootKind(e.target.value as "market" | "npc")}>
                      <option value="market">Market</option>
                      <option value="npc">NPC</option>
                    </select>
                    <Input type="number" value={lootPrice} onChange={(e) => setLootPrice(e.target.value)} placeholder="Price" className="h-9 text-sm" />
                    <button type="button" onClick={async () => setLootIconUrl(await pickIconFile())} className="btn-ghost flex h-9 items-center justify-center gap-1 text-xs">
                      <ImagePlus className="size-4" /> Icon
                    </button>
                    <button type="button" onClick={onCreateLoot} disabled={busy} className="btn-primary h-9 text-xs">Add</button>
                  </div>
                )}

                <ul className="flex flex-col gap-1.5">
                  {loots.map((l) => {
                    const q = parseFloat(qty[l.id] || "0") || 0;
                    const lineVal = q * effectiveUnitSilver(l.unit_price, l.kind);
                    const lineSph = sessionTotals.mins > 0 ? lineVal / (sessionTotals.mins / 60) : 0;
                    const editing = editingLootId === l.id;
                    return (
                      <li key={l.id} className="rounded-xl bg-white/[0.03] px-2.5 py-2">
                        {editing ? (
                          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                            <Input value={editLootName} onChange={(e) => setEditLootName(e.target.value)} className="h-9 text-sm" />
                            <select className="field-select h-9 text-sm" value={editLootKind} onChange={(e) => setEditLootKind(e.target.value as "market" | "npc")}>
                              <option value="market">Market</option>
                              <option value="npc">NPC</option>
                            </select>
                            <Input type="number" value={editLootPrice} onChange={(e) => setEditLootPrice(e.target.value)} className="h-9 text-sm" />
                            <button type="button" onClick={async () => setEditLootIconUrl(await pickIconFile())} className="btn-ghost flex h-9 items-center justify-center gap-1 text-xs">
                              <ImagePlus className="size-4" /> Icon
                            </button>
                            <div className="flex gap-1">
                              <button type="button" onClick={saveLootEdit} disabled={busy} className="btn-primary h-9 flex-1 text-xs">Save</button>
                              <button type="button" onClick={() => setEditingLootId(null)} className="btn-ghost h-9 px-2"><X className="size-3.5" /></button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-[minmax(0,1fr)_4.25rem_5.25rem_4rem_5.25rem_4.5rem] items-center gap-1.5 sm:grid-cols-[minmax(0,1fr)_5rem_6rem_4.5rem_6rem_5rem] sm:gap-2">
                            <div className="flex min-w-0 items-center gap-2.5">
                              {l.icon_url ? (
                                <img src={l.icon_url} alt="" className="size-9 shrink-0 rounded object-contain sm:size-10" />
                              ) : (
                                <span className="flex size-9 shrink-0 items-center justify-center rounded bg-white/5 text-xs font-bold text-cyan-300 sm:size-10">{l.name[0]?.toUpperCase()}</span>
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground sm:text-[0.95rem]">{l.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{formatSilver(Number(l.unit_price))} · {l.kind === "market" ? "Market" : "NPC"}</p>
                              </div>
                            </div>
                            <div className="flex justify-center">
                              <Input type="number" min={0} value={qty[l.id] || ""} onChange={(e) => setQty((prev) => ({ ...prev, [l.id]: e.target.value }))} placeholder="0" className="h-9 w-full max-w-[5rem] text-center text-sm font-semibold" />
                            </div>
                            <span className="text-right font-mono text-sm font-bold tabular-nums text-cyan-300 sm:text-base">{formatSilver(lineVal)}</span>
                            <span className="text-right font-mono text-sm font-bold tabular-nums text-amber-300/95 sm:text-base">{sessionTotals.total > 0 ? `${((lineVal / sessionTotals.total) * 100).toFixed(1)}%` : "—"}</span>
                            <span className="text-right font-mono text-sm font-bold tabular-nums text-emerald-300 sm:text-base">{formatSilver(lineSph)}</span>
                            <div className="flex items-center justify-end gap-0.5">
                              <button type="button" onClick={() => beginEditLoot(l)} className="flex size-8 items-center justify-center rounded text-muted-foreground hover:text-cyan-300">
                                <Pencil className="size-3.5" strokeWidth={1.75} />
                              </button>
                              <button type="button" onClick={async () => { await deleteLoot(l.id); if (selectedId) setLoots(await listLoots(selectedId)); }} className="flex size-8 items-center justify-center rounded text-muted-foreground hover:text-rose-400">
                                <Trash2 className="size-3.5" strokeWidth={1.75} />
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                  {loots.length === 0 && (
                    <li className="px-2 py-4 text-center text-sm text-muted-foreground">No Loot Yet. Add Items Above.</li>
                  )}
                </ul>
                {loots.length > 0 && (
  <button
    type="button"
    onClick={() => setImportOpen(true)}
    className="btn-ghost mt-3 h-10 w-full text-xs"
  >
    <ImagePlus className="size-3.5" /> Update Quantities
  </button>
)}
<button type="button" onClick={onSaveSession} disabled={busy || sessionTotals.total <= 0} className="btn-primary mt-2 h-11 w-full text-sm">
  Save Session
</button>
              </div>

              <div className="glass p-3 sm:p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-300/90">Sessions</h3>
                {spotSessions.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No Sessions For This Spot Yet.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {spotSessions.map((s) => {
                      const savedLabel = (() => {
                        try {
                          return new Date(s.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                        } catch {
                          return s.created_at;
                        }
                      })();
                      return (
                        <li key={s.id} className="rounded-xl bg-white/[0.03] px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                <p className="truncate text-sm font-semibold text-foreground">{s.character_name}</p>
                                <span className="text-[0.7rem] text-muted-foreground">{savedLabel}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground ring-1 ring-white/10">{s.minutes} min</span>
                                <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 font-mono text-[0.7rem] font-semibold text-cyan-300 ring-1 ring-cyan-400/20">{formatSilver(Number(s.total_value))}</span>
                                <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-mono text-[0.7rem] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">{formatSilver(Number(s.silver_per_hour))}/h</span>
                                {s.drop_rate != null && Number.isFinite(Number(s.drop_rate)) && (
                                  <span className="rounded-full bg-amber-400/10 px-2 py-0.5 font-mono text-[0.7rem] font-semibold text-amber-200 ring-1 ring-amber-400/25">DR {Number(s.drop_rate)}%</span>
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-0.5">
                              <button type="button" title="Share Report PNG" disabled={sharingId === s.id} onClick={() => onShareSession(s)} className="flex size-8 items-center justify-center rounded text-muted-foreground hover:text-cyan-300 disabled:opacity-50">
                                {sharingId === s.id ? <Loader2 className="size-3.5 animate-spin" /> : <Share2 className="size-3.5" strokeWidth={1.75} />}
                              </button>
                              <button type="button" title="Delete Session" onClick={async () => { await deleteSession(s.id); setSessions((p) => p.filter((x) => x.id !== s.id)); }} className="flex size-8 items-center justify-center rounded text-muted-foreground hover:text-rose-400">
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
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
