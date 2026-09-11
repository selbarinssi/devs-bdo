import {
  Loader2,
  Pencil,
  Plus,
  Square,
  Trash2,
  Timer,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MONSTER_TYPES, TERRITORIES } from "@/data/grind-meta";
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
  updateSession,
  updateSpot,
  uploadLootIcon,
} from "@/lib/grind-api";
import { isSupabaseConfigured, type LootRow, type SpotRow } from "@/lib/supabase";
import { cn, formatNumber } from "@/lib/utils";

function formatSilver(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return formatNumber(Math.round(n));
}

export function GrindTracker() {
  const configured = isSupabaseConfigured();
  const [spots, setSpots] = useState<SpotRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loots, setLoots] = useState<LootRow[]>([]);
  const [sessions, setSessions] = useState<Awaited<ReturnType<typeof listSessions>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [spotName, setSpotName] = useState("");
  const [monsters, setMonsters] = useState<string>(MONSTER_TYPES[0]);
  const [territory, setTerritory] = useState<string>(TERRITORIES[0]);
  const [spotFile, setSpotFile] = useState<File | null>(null);

  const [editingSpot, setEditingSpot] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMonsters, setEditMonsters] = useState("");
  const [editTerritory, setEditTerritory] = useState("");
  const [editSpotFile, setEditSpotFile] = useState<File | null>(null);

  const [lootName, setLootName] = useState("");
  const [lootKind, setLootKind] = useState<"market" | "npc">("market");
  const [lootPrice, setLootPrice] = useState("");
  const [lootFile, setLootFile] = useState<File | null>(null);

  const [character, setCharacter] = useState("");
  const [qty, setQty] = useState<Record<string, string>>({});
  const [minutes, setMinutes] = useState("60");
  const [timerOn, setTimerOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerStart = useRef<number | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editChar, setEditChar] = useState("");
  const [editMinutes, setEditMinutes] = useState("");
  const [editTotal, setEditTotal] = useState("");

  const selected = spots.find((s) => s.id === selectedId) ?? null;

  const refresh = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [s, sess] = await Promise.all([listSpots(), listSessions(100)]);
      setSpots(s);
      setSessions(sess);
      if (selectedId && !s.some((x) => x.id === selectedId)) {
        setSelectedId(s[0]?.id ?? null);
      } else if (!selectedId && s[0]) {
        setSelectedId(s[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [configured, selectedId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selectedId || !configured) {
      setLoots([]);
      setEditingSpot(false);
      return;
    }
    void listLoots(selectedId)
      .then(setLoots)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load loots"));
  }, [selectedId, configured]);

  useEffect(() => {
    if (!timerOn) return;
    const id = window.setInterval(() => {
      if (timerStart.current != null) {
        setElapsed(Math.floor((Date.now() - timerStart.current) / 1000));
      }
    }, 200);
    return () => clearInterval(id);
  }, [timerOn]);

  const spotSessions = useMemo(
    () => (selectedId ? sessions.filter((s) => s.spot_id === selectedId) : []),
    [sessions, selectedId],
  );

  const avgSph = useMemo(() => {
    if (!spotSessions.length) return 0;
    return spotSessions.reduce((a, s) => a + Number(s.silver_per_hour), 0) / spotSessions.length;
  }, [spotSessions]);

  const sessionTotals = useMemo(() => {
    let total = 0;
    for (const l of loots) {
      const q = parseFloat(qty[l.id] || "0") || 0;
      total += q * Number(l.unit_price);
    }
    const mins =
      timerOn && elapsed > 0 ? elapsed / 60 : Math.max(0.01, parseFloat(minutes) || 0);
    const sph = mins > 0 ? total / (mins / 60) : 0;
    return { total, mins, sph };
  }, [loots, qty, minutes, timerOn, elapsed]);

  if (!configured) {
    return (
      <div className="panel p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Supabase not configured</p>
        <p className="mt-2">Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  }

  const onCreateSpot = async () => {
    if (!spotName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      let icon_url: string | null = null;
      if (spotFile) icon_url = await uploadLootIcon(spotFile);
      const row = await createSpot({ name: spotName.trim(), monsters, territory, icon_url });
      setSpotName("");
      setSpotFile(null);
      await refresh();
      setSelectedId(row.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create spot failed");
    } finally {
      setBusy(false);
    }
  };

  const beginEditSpot = () => {
    if (!selected) return;
    setEditName(selected.name);
    setEditMonsters(selected.monsters || MONSTER_TYPES[0]);
    setEditTerritory(selected.territory || TERRITORIES[0]);
    setEditSpotFile(null);
    setEditingSpot(true);
  };

  const saveSpotEdit = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      let icon_url = selected.icon_url;
      if (editSpotFile) icon_url = await uploadLootIcon(editSpotFile);
      await updateSpot(selected.id, {
        name: editName.trim() || selected.name,
        monsters: editMonsters,
        territory: editTerritory,
        icon_url,
      });
      setEditingSpot(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update spot failed");
    } finally {
      setBusy(false);
    }
  };

  const onCreateLoot = async () => {
    if (!selectedId || !lootName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      let icon_url: string | null = null;
      if (lootFile) icon_url = await uploadLootIcon(lootFile);
      await createLoot({
        spot_id: selectedId,
        name: lootName.trim(),
        kind: lootKind,
        unit_price: Math.max(0, Math.round(parseFloat(lootPrice) || 0)),
        icon_url,
      });
      setLootName("");
      setLootPrice("");
      setLootFile(null);
      setLoots(await listLoots(selectedId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create loot failed");
    } finally {
      setBusy(false);
    }
  };

  const onSaveSession = async () => {
    if (!selectedId) return;
    const mins = sessionTotals.mins;
    if (mins <= 0) return;
    setBusy(true);
    setError(null);
    try {
      const lines = loots
        .map((l) => {
          const quantity = parseFloat(qty[l.id] || "0") || 0;
          const unit_price = Number(l.unit_price);
          return {
            loot_id: l.id,
            loot_name: l.name,
            unit_price,
            quantity,
            line_value: Math.round(quantity * unit_price),
          };
        })
        .filter((l) => l.quantity > 0);

      await createSession({
        spot_id: selectedId,
        character_name: character.trim() || "Unknown",
        minutes: Math.round(mins * 100) / 100,
        total_value: Math.round(sessionTotals.total),
        silver_per_hour: Math.round(sessionTotals.sph),
        started_at: timerStart.current ? new Date(timerStart.current).toISOString() : null,
        lines,
      });
      setQty({});
      setTimerOn(false);
      timerStart.current = null;
      setElapsed(0);
      setSessions(await listSessions(100));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save session failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleTimer = () => {
    if (timerOn) {
      setTimerOn(false);
      setMinutes(String(Math.max(1, Math.round(elapsed / 60))));
      timerStart.current = null;
    } else {
      timerStart.current = Date.now() - elapsed * 1000;
      setTimerOn(true);
    }
  };

  const resetTimer = () => {
    setTimerOn(false);
    timerStart.current = null;
    setElapsed(0);
  };

  const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const startEdit = (s: (typeof sessions)[0]) => {
    setEditingId(s.id);
    setEditChar(s.character_name);
    setEditMinutes(String(s.minutes));
    setEditTotal(String(s.total_value));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const mins = Math.max(0.01, parseFloat(editMinutes) || 0);
    const total = Math.max(0, Math.round(parseFloat(editTotal) || 0));
    const sph = Math.round(total / (mins / 60));
    setBusy(true);
    try {
      await updateSession(editingId, {
        character_name: editChar.trim() || "Unknown",
        minutes: Math.round(mins * 100) / 100,
        total_value: total,
        silver_per_hour: sph,
      });
      setEditingId(null);
      setSessions(await listSessions(100));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {error ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="panel flex flex-col p-3.5">
          <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">Spots</p>
          <ul className="mb-3 flex max-h-[22rem] flex-col gap-1 overflow-y-auto pr-0.5">
            {spots.length === 0 ? (
              <li className="px-1 py-6 text-center text-xs text-muted-foreground">No spots yet</li>
            ) : (
              spots.map((s) => (
                <li key={s.id} className="group flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(s.id);
                      setEditingSpot(false);
                    }}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors",
                      selectedId === s.id ? "bg-primary/15 ring-1 ring-primary/40" : "hover:bg-secondary",
                    )}
                  >
                    {s.icon_url ? (
                      <img src={s.icon_url} alt="" className="size-9 shrink-0 rounded-lg object-contain ring-1 ring-border" />
                    ) : (
                      <span className="size-9 shrink-0 rounded-lg bg-secondary ring-1 ring-border" />
                    )}
                    <span className="min-w-0">
                      <span className={cn("block truncate text-sm font-semibold", selectedId === s.id ? "text-primary" : "text-foreground")}>
                        {s.name}
                      </span>
                      <span className="block truncate text-[0.65rem] text-muted-foreground">{s.territory}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${s.name}`}
                    className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
                    onClick={() => {
                      void (async () => {
                        setBusy(true);
                        try {
                          await deleteSpot(s.id);
                          await refresh();
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Delete failed");
                        } finally {
                          setBusy(false);
                        }
                      })();
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))
            )}
          </ul>

          <div className="mt-auto space-y-2 border-t border-border pt-3">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">New spot</p>
            <Input placeholder="Name" value={spotName} onChange={(e) => setSpotName(e.target.value)} className="h-9 text-sm" />
            <select className="field-select h-9 text-sm" value={territory} onChange={(e) => setTerritory(e.target.value)}>
              {TERRITORIES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select className="field-select h-9 text-sm" value={monsters} onChange={(e) => setMonsters(e.target.value)}>
              {MONSTER_TYPES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <label className="btn-ghost w-full cursor-pointer">
              <Upload className="size-3.5" />
              {spotFile ? spotFile.name.slice(0, 18) : "Icon"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setSpotFile(e.target.files?.[0] ?? null)} />
            </label>
            <button type="button" disabled={busy || !spotName.trim()} onClick={() => void onCreateSpot()} className="btn-primary w-full">
              <Plus className="size-3.5" /> Add spot
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-5">
          {!selected ? (
            <div className="panel px-6 py-16 text-center text-sm text-muted-foreground">Create or select a spot to log grinds.</div>
          ) : (
            <>
              <section className="panel p-4 sm:p-5">
                {!editingSpot ? (
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {selected.icon_url ? (
                        <img src={selected.icon_url} alt="" className="size-14 rounded-2xl object-contain ring-1 ring-border" />
                      ) : (
                        <span className="size-14 rounded-2xl bg-secondary ring-1 ring-border" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{selected.name}</h3>
                        <p className="text-sm text-muted-foreground">{selected.monsters} · {selected.territory}</p>
                        {spotSessions.length > 0 ? (
                          <p className="mt-1 text-xs text-primary">
                            Avg {formatSilver(avgSph)} ⚙/h · {spotSessions.length} session{spotSessions.length === 1 ? "" : "s"}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <button type="button" className="btn-ghost" onClick={beginEditSpot}>
                      <Pencil className="size-3.5" /> Edit spot
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label className="text-xs">Name</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9" />
                    </div>
                    <div>
                      <Label className="text-xs">Territory</Label>
                      <select className="field-select h-9" value={editTerritory} onChange={(e) => setEditTerritory(e.target.value)}>
                        {TERRITORIES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Monsters</Label>
                      <select className="field-select h-9" value={editMonsters} onChange={(e) => setEditMonsters(e.target.value)}>
                        {MONSTER_TYPES.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <label className="btn-ghost cursor-pointer">
                      <Upload className="size-3.5" />
                      {editSpotFile ? editSpotFile.name.slice(0, 20) : "Change icon"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setEditSpotFile(e.target.files?.[0] ?? null)} />
                    </label>
                    <div className="flex gap-2 sm:col-span-2">
                      <button type="button" className="btn-primary" disabled={busy} onClick={() => void saveSpotEdit()}>
                        Save spot
                      </button>
                      <button type="button" className="btn-ghost" onClick={() => setEditingSpot(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section className="panel overflow-hidden p-0">
                <div className="border-b border-border px-4 py-3 sm:px-5">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">Loot table</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] table-fixed text-left text-sm">
                    <colgroup>
                      <col className="w-[46%]" />
                      <col className="w-[16%]" />
                      <col className="w-[24%]" />
                      <col className="w-[14%]" />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-border bg-secondary/40 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-2.5 font-semibold sm:px-5">Item</th>
                        <th className="px-2 py-2.5 font-semibold">Type</th>
                        <th className="px-2 py-2.5 font-semibold">Unit ⚙</th>
                        <th className="px-3 py-2.5 font-semibold" />
                      </tr>
                    </thead>
                    <tbody>
                      {loots.map((l) => (
                        <tr key={l.id} className="border-b border-border/50">
                          <td className="px-4 py-2.5 sm:px-5">
                            <div className="flex items-center gap-2.5">
                              {l.icon_url ? (
                                <img src={l.icon_url} alt="" className="size-7 rounded object-contain" />
                              ) : (
                                <span className="size-7 rounded bg-secondary" />
                              )}
                              <span className="truncate font-medium">{l.name}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 capitalize text-muted-foreground">{l.kind}</td>
                          <td className="px-2 py-2.5 font-medium tabular-nums">{formatSilver(Number(l.unit_price))}</td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-rose-400"
                              onClick={() => {
                                void (async () => {
                                  await deleteLoot(l.id);
                                  setLoots(await listLoots(selected.id));
                                })();
                              }}
                            >
                              <Trash2 className="inline size-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {loots.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-xs text-muted-foreground">No loot rows yet</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-2 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-5 sm:px-5">
                  <Input placeholder="Loot name" value={lootName} onChange={(e) => setLootName(e.target.value)} className="h-9 text-sm lg:col-span-2" />
                  <select className="field-select h-9 text-sm" value={lootKind} onChange={(e) => setLootKind(e.target.value as "market" | "npc")}>
                    <option value="market">Market</option>
                    <option value="npc">NPC</option>
                  </select>
                  <Input placeholder="Unit price" type="number" value={lootPrice} onChange={(e) => setLootPrice(e.target.value)} className="h-9 text-sm" />
                  <label className="btn-ghost h-9 cursor-pointer">
                    <Upload className="size-3.5" /> Icon
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setLootFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <div className="px-4 pb-4 sm:px-5">
                  <button type="button" disabled={busy || !lootName.trim()} onClick={() => void onCreateLoot()} className="btn-ghost">
                    <Plus className="size-3.5" /> Add loot
                  </button>
                </div>
              </section>

              <section className="panel p-4 sm:p-5">
                <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">New session</p>
                <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto]">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Character</Label>
                      <Input value={character} onChange={(e) => setCharacter(e.target.value)} placeholder="Name" className="h-10" />
                    </div>
                    <div>
                      <Label className="text-xs">Duration (min)</Label>
                      <Input type="number" min={1} value={minutes} disabled={timerOn} onChange={(e) => setMinutes(e.target.value)} className="h-10" />
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-[#0a121c] px-6 py-4 shadow-inner">
                    <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-[0.25em] text-muted-foreground">Session timer</p>
                    <p className={cn("font-mono text-3xl font-semibold tracking-[0.12em] tabular-nums sm:text-4xl", timerOn ? "text-primary" : "text-foreground")}>
                      <span>{hh}</span>
                      <span className={cn("mx-0.5", timerOn && "animate-pulse")}>:</span>
                      <span>{mm}</span>
                      <span className={cn("mx-0.5", timerOn && "animate-pulse")}>:</span>
                      <span>{ss}</span>
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={toggleTimer}
                        className={cn(
                          "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-bold",
                          timerOn
                            ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40"
                            : "bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(59,126,240,0.35)]",
                        )}
                      >
                        {timerOn ? (
                          <>
                            <Square className="size-3 fill-current" /> Stop
                          </>
                        ) : (
                          <>
                            <Timer className="size-3.5" /> Start
                          </>
                        )}
                      </button>
                      <button type="button" onClick={resetTimer} className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-xs font-semibold text-muted-foreground ring-1 ring-border hover:text-foreground">
                        <X className="size-3.5" /> Reset
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-4 grid gap-2 sm:grid-cols-2">
                  {loots.map((l) => (
                    <div key={l.id} className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2">
                      {l.icon_url ? <img src={l.icon_url} alt="" className="size-7 object-contain" /> : null}
                      <span className="min-w-0 flex-1 truncate text-sm">{l.name}</span>
                      <Input type="number" min={0} placeholder="0" value={qty[l.id] ?? ""} onChange={(e) => setQty((prev) => ({ ...prev, [l.id]: e.target.value }))} className="h-8 w-[4.75rem] text-right text-sm" />
                    </div>
                  ))}
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-6">
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold tabular-nums text-foreground">{formatSilver(sessionTotals.total)} ⚙</p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Silver / h</p>
                    <p className="text-lg font-semibold tabular-nums text-primary">{formatSilver(sessionTotals.sph)}</p>
                  </div>
                </div>

                <button type="button" disabled={busy || loots.length === 0} onClick={() => void onSaveSession()} className="btn-primary">
                  Save session
                </button>
              </section>

              <section className="panel p-4 sm:p-5">
                <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">Sessions — {selected.name}</p>
                {spotSessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No sessions for this spot yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {spotSessions.map((s) => (
                      <li key={s.id} className="rounded-xl border border-border/70 bg-secondary/30 px-3 py-2.5 text-sm">
                        {editingId === s.id ? (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <div className="flex-1">
                              <Label className="text-[0.65rem]">Character</Label>
                              <Input value={editChar} onChange={(e) => setEditChar(e.target.value)} className="h-8 text-sm" />
                            </div>
                            <div className="w-24">
                              <Label className="text-[0.65rem]">Minutes</Label>
                              <Input value={editMinutes} onChange={(e) => setEditMinutes(e.target.value)} className="h-8 text-sm" />
                            </div>
                            <div className="w-32">
                              <Label className="text-[0.65rem]">Total ⚙</Label>
                              <Input value={editTotal} onChange={(e) => setEditTotal(e.target.value)} className="h-8 text-sm" />
                            </div>
                            <button type="button" onClick={() => void saveEdit()} className="btn-primary h-8">Save</button>
                            <button type="button" onClick={() => setEditingId(null)} className="btn-ghost h-8">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-medium">{s.character_name}</p>
                              <p className="text-[0.7rem] text-muted-foreground">
                                {new Date(s.created_at).toLocaleString()} · {s.minutes} min · {formatSilver(Number(s.total_value))} ⚙
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold tabular-nums text-primary">
                                {formatSilver(Number(s.silver_per_hour))} ⚙/h
                              </span>
                              <button type="button" className="text-muted-foreground hover:text-primary" onClick={() => startEdit(s)}>
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-rose-400"
                                onClick={() => {
                                  void (async () => {
                                    await deleteSession(s.id);
                                    setSessions(await listSessions(100));
                                  })();
                                }}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
