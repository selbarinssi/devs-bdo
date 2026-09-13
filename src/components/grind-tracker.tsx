import {
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChronoPanel } from "@/components/chrono-panel";
import { Input } from "@/components/ui/input";
import {
  createLoot,
  createSession,
  createSpot,
  deleteLoot,
  deleteSession,
  deleteSpot,
  listLoots,
  listSessions,
  listSpots,
  updateLoot,
} from "@/lib/grind-api";
import type { LootRow, SessionRow, SpotRow } from "@/lib/supabase";
import { cn, formatSilverCompact } from "@/lib/utils";

const formatSilver = formatSilverCompact;
const CHRONO_KEY = "bdo_grind_chrono_v2";

type ChronoDraft = {
  qty: Record<string, string>;
  character: string;
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

export function GrindTracker() {
  const [spots, setSpots] = useState<SpotRow[]>([]);
  const [loots, setLoots] = useState<LootRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chronoHydrated, setChronoHydrated] = useState(false);

  const [qty, setQty] = useState<Record<string, string>>({});
  const [character, setCharacter] = useState("");
  const [minutes, setMinutes] = useState("");
  const [timerOn, setTimerOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerStart = useRef<number | null>(null);
  const accumulated = useRef(0);

  const [spotName, setSpotName] = useState("");
  const [spotMonsters, setSpotMonsters] = useState("");
  const [spotTerritory, setSpotTerritory] = useState("");
  const [addingSpot, setAddingSpot] = useState(false);

  const [addingLoot, setAddingLoot] = useState(false);
  const [lootName, setLootName] = useState("");
  const [lootKind, setLootKind] = useState<"market" | "npc">("market");
  const [lootPrice, setLootPrice] = useState("");
  const [editingLootId, setEditingLootId] = useState<string | null>(null);
  const [editLootName, setEditLootName] = useState("");
  const [editLootKind, setEditLootKind] = useState<"market" | "npc">("market");
  const [editLootPrice, setEditLootPrice] = useState("");

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
      minutes,
      running: timerOn,
      startedAt: timerStart.current,
      accumulatedMs: accumulated.current,
    };
    writeStore(store);
  }, [selectedId, qty, character, minutes, timerOn, elapsed, chronoHydrated]);

  useEffect(() => {
    if (!timerOn) return;
    const id = window.setInterval(() => {
      if (timerStart.current != null) {
        setElapsed(Date.now() - timerStart.current + accumulated.current);
      }
    }, 250);
    return () => clearInterval(id);
  }, [timerOn]);

  const { hh, mm, ss, mins: timerMins } = formatElapsed(elapsed);
  const manualMins = parseFloat(minutes) || 0;
  const effectiveMins = timerOn || elapsed > 0 ? timerMins : manualMins;

  const sessionTotals = useMemo(() => {
    let total = 0;
    for (const l of loots) {
      const q = parseFloat(qty[l.id] || "0") || 0;
      total += q * Number(l.unit_price);
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
      });
      setSpots((p) => [...p, row].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedId(row.id);
      setSpotName("");
      setSpotMonsters("");
      setSpotTerritory("");
      setAddingSpot(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const onCreateLoot = async () => {
    if (!selectedId || !lootName.trim()) return;
    setBusy(true);
    try {
      const row = await createLoot({
        spot_id: selectedId,
        name: lootName.trim(),
        kind: lootKind,
        unit_price: parseFloat(lootPrice) || 0,
      });
      setLoots((p) => [...p, row]);
      setLootName("");
      setLootPrice("");
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
  };

  const saveLootEdit = async () => {
    if (!editingLootId) return;
    setBusy(true);
    try {
      const row = await updateLoot(editingLootId, {
        name: editLootName.trim(),
        kind: editLootKind,
        unit_price: parseFloat(editLootPrice) || 0,
      });
      setLoots((p) => p.map((x) => (x.id === row.id ? row : x)));
      setEditingLootId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update loot failed");
    } finally {
      setBusy(false);
    }
  };

  const onSaveSession = async () => {
    if (!selectedId || sessionTotals.total <= 0) return;
    setBusy(true);
    try {
      const mins = Math.max(1, Math.round(sessionTotals.mins || manualMins || 1));
      await createSession({
        spot_id: selectedId,
        character_name: character.trim() || "Unknown",
        minutes: mins,
        total_value: sessionTotals.total,
        silver_per_hour: sessionTotals.sph,
        started_at: timerStart.current ? new Date(timerStart.current).toISOString() : null,
        lines: loots
          .map((l) => {
            const q = parseFloat(qty[l.id] || "0") || 0;
            return {
              loot_id: l.id,
              loot_name: l.name,
              unit_price: Number(l.unit_price),
              quantity: q,
              line_value: q * Number(l.unit_price),
            };
          })
          .filter((l) => l.quantity > 0),
      });
      setSessions(await listSessions());
      setQty({});
      setTimerOn(false);
      timerStart.current = null;
      accumulated.current = 0;
      setElapsed(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save session failed");
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

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="glass flex flex-col gap-2 p-3">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">Spots</p>
            <button type="button" onClick={() => setAddingSpot((v) => !v)} className="btn-ghost h-7 px-2 text-[0.65rem]">
              <Plus className="size-3" /> Add Spot
            </button>
          </div>
          {addingSpot && (
            <div className="mb-2 flex flex-col gap-1.5 rounded-lg bg-white/5 p-2">
              <Input value={spotName} onChange={(e) => setSpotName(e.target.value)} placeholder="Name" className="h-8 text-xs" />
              <Input value={spotMonsters} onChange={(e) => setSpotMonsters(e.target.value)} placeholder="Monsters" className="h-8 text-xs" />
              <Input value={spotTerritory} onChange={(e) => setSpotTerritory(e.target.value)} placeholder="Territory" className="h-8 text-xs" />
              <button type="button" onClick={onCreateSpot} disabled={busy} className="btn-primary h-8 text-[0.65rem]">
                Create
              </button>
            </div>
          )}
          <ul className="flex max-h-[50vh] flex-col gap-1 overflow-auto">
            {spots.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition",
                    selectedId === s.id
                      ? "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/30"
                      : "hover:bg-white/5 text-foreground",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {s.icon_url ? (
                      <img src={s.icon_url} alt="" className="size-7 shrink-0 rounded object-contain" />
                    ) : (
                      <span className="flex size-7 shrink-0 items-center justify-center rounded bg-white/5 text-[0.6rem] font-bold text-cyan-300">
                        {s.name[0]?.toUpperCase()}
                      </span>
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
            {spots.length === 0 && (
              <li className="px-2 py-6 text-center text-xs text-muted-foreground">No Spots Yet</li>
            )}
          </ul>
        </aside>

        <div className="flex flex-col gap-3">
          {!selectedId ? (
            <p className="glass py-16 text-center text-sm text-muted-foreground">Select Or Add A Spot</p>
          ) : (
            <>
              <div className="glass flex flex-wrap items-center justify-between gap-2 p-3">
                <div className="flex items-center gap-2.5">
                  {selectedSpot?.icon_url ? (
                    <img src={selectedSpot.icon_url} alt="" className="size-9 rounded object-contain" />
                  ) : (
                    <span className="flex size-9 items-center justify-center rounded bg-white/5 text-sm font-bold text-cyan-300">
                      {selectedSpot?.name[0]?.toUpperCase()}
                    </span>
                  )}
                  <div>
                    <h3 className="text-base font-semibold">{selectedSpot?.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedSpot?.monsters}
                      {selectedSpot?.territory ? ` · ${selectedSpot.territory}` : ""}
                    </p>
                  </div>
                </div>
                {avgSph > 0 && (
                  <span className="metric-pill bg-emerald-400/10 text-emerald-300">
                    Avg {formatSilver(avgSph)}/h
                  </span>
                )}
              </div>

              <ChronoPanel
                hh={hh}
                mm={mm}
                ss={ss}
                timerOn={timerOn}
                total={sessionTotals.total}
                sph={sessionTotals.sph}
                character={character}
                minutes={minutes}
                onToggle={toggleTimer}
                onReset={resetTimer}
                onCharacter={setCharacter}
                onMinutes={setMinutes}
              />

              <div className="glass p-3 sm:p-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">Loot</p>
                  <button type="button" onClick={() => setAddingLoot((v) => !v)} className="btn-ghost h-7 px-2 text-[0.65rem]">
                    <Plus className="size-3" /> Add
                  </button>
                </div>
                {loots.length > 0 && (
                  <div className="mb-1 grid grid-cols-[minmax(0,1fr)_4.5rem_5.5rem_5.5rem_4rem] items-center gap-2 px-2 text-[0.55rem] font-bold uppercase tracking-wider text-muted-foreground sm:grid-cols-[minmax(0,1fr)_5rem_6rem_6rem_4.5rem]">
                    <span>Item</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right">Total</span>
                    <span className="text-right">/h</span>
                    <span />
                  </div>
                )}
                {addingLoot && (
                  <div className="mb-2 grid grid-cols-2 gap-1.5 rounded-lg bg-white/5 p-2 sm:grid-cols-4">
                    <Input value={lootName} onChange={(e) => setLootName(e.target.value)} placeholder="Item" className="h-8 text-xs" />
                    <select className="field-select h-8 text-xs" value={lootKind} onChange={(e) => setLootKind(e.target.value as "market" | "npc")}>
                      <option value="market">Market</option>
                      <option value="npc">NPC</option>
                    </select>
                    <Input type="number" value={lootPrice} onChange={(e) => setLootPrice(e.target.value)} placeholder="Price" className="h-8 text-xs" />
                    <button type="button" onClick={onCreateLoot} disabled={busy} className="btn-primary h-8 px-2 text-[0.65rem]">
                      Add
                    </button>
                  </div>
                )}
                <ul className="flex flex-col gap-1">
                  {loots.map((l) => {
                    const q = parseFloat(qty[l.id] || "0") || 0;
                    const lineVal = q * Number(l.unit_price);
                    const lineSph = sessionTotals.mins > 0 ? lineVal / (sessionTotals.mins / 60) : 0;
                    const editing = editingLootId === l.id;
                    return (
                      <li key={l.id} className="rounded-lg bg-white/[0.03] px-2 py-1.5">
                        {editing ? (
                          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                            <Input value={editLootName} onChange={(e) => setEditLootName(e.target.value)} className="h-8 text-xs" />
                            <select className="field-select h-8 text-xs" value={editLootKind} onChange={(e) => setEditLootKind(e.target.value as "market" | "npc")}>
                              <option value="market">Market</option>
                              <option value="npc">NPC</option>
                            </select>
                            <Input type="number" value={editLootPrice} onChange={(e) => setEditLootPrice(e.target.value)} className="h-8 text-xs" />
                            <div className="flex gap-1">
                              <button type="button" onClick={saveLootEdit} disabled={busy} className="btn-primary h-8 flex-1 text-[0.65rem]">
                                Save
                              </button>
                              <button type="button" onClick={() => setEditingLootId(null)} className="btn-ghost h-8 px-2 text-[0.65rem]">
                                <X className="size-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_5.5rem_5.5rem_4rem] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_5rem_6rem_6rem_4.5rem]">
                            <div className="flex min-w-0 items-center gap-2">
                              {l.icon_url ? (
                                <img src={l.icon_url} alt="" className="size-7 shrink-0 rounded object-contain" />
                              ) : (
                                <span className="flex size-7 shrink-0 items-center justify-center rounded bg-white/5 text-[0.55rem] font-bold text-cyan-300">
                                  {l.name[0]?.toUpperCase()}
                                </span>
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium text-foreground">{l.name}</p>
                                <p className="truncate text-[0.65rem] text-muted-foreground">
                                  {formatSilver(Number(l.unit_price))} · {l.kind === "market" ? "Market" : "NPC"}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-center">
                              <Input
                                type="number"
                                min={0}
                                value={qty[l.id] || ""}
                                onChange={(e) => setQty((prev) => ({ ...prev, [l.id]: e.target.value }))}
                                placeholder="0"
                                className="h-8 w-full max-w-[4.5rem] text-center text-xs"
                              />
                            </div>
                            <span className="text-right font-mono text-xs font-bold tabular-nums text-cyan-300">
                              {formatSilver(lineVal)}
                            </span>
                            <span className="text-right font-mono text-xs font-bold tabular-nums text-emerald-300">
                              {formatSilver(lineSph)}
                            </span>
                            <div className="flex items-center justify-end gap-0.5">
                              <button type="button" onClick={() => beginEditLoot(l)} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:text-cyan-300">
                                <Pencil className="size-3" strokeWidth={1.75} />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  await deleteLoot(l.id);
                                  if (selectedId) setLoots(await listLoots(selectedId));
                                }}
                                className="flex size-7 items-center justify-center rounded text-muted-foreground hover:text-rose-400"
                              >
                                <Trash2 className="size-3" strokeWidth={1.75} />
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                  {loots.length === 0 && (
                    <li className="px-2 py-4 text-center text-xs text-muted-foreground">No Loot Yet. Add Items Above.</li>
                  )}
                </ul>
                <button
                  type="button"
                  onClick={onSaveSession}
                  disabled={busy || sessionTotals.total <= 0}
                  className="btn-primary mt-3 h-10 w-full text-sm"
                >
                  Save Session
                </button>
              </div>

              <div className="glass p-3 sm:p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-300/90">Sessions</h3>
                {spotSessions.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">No Sessions For This Spot Yet.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {spotSessions.map((s) => (
                      <li key={s.id} className="rounded-lg bg-white/[0.03] px-2.5 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{s.character_name}</p>
                            <p className="text-[0.7rem] text-muted-foreground">
                              {s.minutes} min · {formatSilver(Number(s.total_value))} ·{" "}
                              {formatSilver(Number(s.silver_per_hour))}/h
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteSession(s.id);
                              setSessions((p) => p.filter((x) => x.id !== s.id));
                            }}
                            className="text-muted-foreground hover:text-rose-400"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
