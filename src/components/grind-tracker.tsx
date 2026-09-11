import { Loader2, Pencil, Plus, Trash2, Timer, Upload } from "lucide-react";
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
    }, 250);
    return () => clearInterval(id);
  }, [timerOn]);

  const spotSessions = useMemo(
    () => (selectedId ? sessions.filter((s) => s.spot_id === selectedId) : []),
    [sessions, selectedId],
  );

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
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Supabase not configured</p>
        <p className="mt-2">Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY on Vercel, then redeploy.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading grind data…
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
      const row = await createSpot({
        name: spotName.trim(),
        monsters,
        territory,
        icon_url,
      });
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

  const chronoLabel = `${String(Math.floor(elapsed / 3600)).padStart(2, "0")}:${String(
    Math.floor((elapsed % 3600) / 60),
  ).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

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
    <div className="flex flex-col gap-4">
      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <section className="rounded-lg border border-border bg-card p-3">
          <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-wider text-primary">Spots</p>
          <ul className="mb-3 flex max-h-72 flex-col gap-1 overflow-y-auto">
            {spots.length === 0 ? (
              <li className="text-xs text-muted-foreground">No spots yet</li>
            ) : (
              spots.map((s) => (
                <li key={s.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                      selectedId === s.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary",
                    )}
                  >
                    {s.icon_url ? (
                      <img src={s.icon_url} alt="" className="size-7 shrink-0 rounded object-contain" />
                    ) : (
                      <span className="size-7 shrink-0 rounded bg-secondary/80" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{s.name}</span>
                      <span className="block truncate text-[0.65rem] opacity-70">{s.territory}</span>
                    </span>
                  </button>
                  <button type="button" aria-label={`Delete ${s.name}`} className="rounded p-1 text-muted-foreground hover:text-destructive" onClick={() => { void (async () => { setBusy(true); try { await deleteSpot(s.id); await refresh(); } catch (e) { setError(e instanceof Error ? e.message : "Delete failed"); } finally { setBusy(false); } })(); }}>
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="flex flex-col gap-1.5 border-t border-border pt-3">
            <Input placeholder="Spot name" value={spotName} onChange={(e) => setSpotName(e.target.value)} className="h-8 text-sm" />
            <select className="field-select h-8 text-sm" value={territory} onChange={(e) => setTerritory(e.target.value)}>
              {TERRITORIES.map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
            <select className="field-select h-8 text-sm" value={monsters} onChange={(e) => setMonsters(e.target.value)}>
              {MONSTER_TYPES.map((m) => (<option key={m} value={m}>{m}</option>))}
            </select>
            <label className="flex h-8 cursor-pointer items-center justify-center gap-1 rounded-md border border-border text-xs text-muted-foreground hover:border-primary">
              <Upload className="size-3.5" /> Spot icon
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setSpotFile(e.target.files?.[0] ?? null)} />
            </label>
            {spotFile ? <p className="text-[0.65rem] text-muted-foreground">{spotFile.name}</p> : null}
            <button type="button" disabled={busy || !spotName.trim()} onClick={() => void onCreateSpot()} className="inline-flex h-8 items-center justify-center gap-1 rounded-md bg-primary px-2 text-xs font-bold text-primary-foreground disabled:opacity-50">
              <Plus className="size-3.5" /> Add spot
            </button>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          {!selected ? (
            <p className="text-sm text-muted-foreground">Create or select a spot.</p>
          ) : (
            <>
              <section className="rounded-lg border border-border bg-card p-3">
                <div className="mb-3 flex items-center gap-3">
                  {selected.icon_url ? <img src={selected.icon_url} alt="" className="size-12 rounded-md object-contain" /> : <span className="size-12 rounded-md bg-secondary" />}
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{selected.name}</h3>
                    <p className="text-xs text-muted-foreground">{selected.monsters} · {selected.territory}</p>
                  </div>
                </div>
                <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-primary">Loot table</p>
                <div className="mb-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-[0.7rem] uppercase text-muted-foreground">
                        <th className="py-1 pr-2 font-medium">Item</th>
                        <th className="py-1 pr-2 font-medium">Type</th>
                        <th className="py-1 pr-2 font-medium">Unit ⚙</th>
                        <th className="py-1 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {loots.map((l) => (
                        <tr key={l.id} className="border-b border-border/60">
                          <td className="py-1.5 pr-2">
                            <div className="flex items-center gap-2">
                              {l.icon_url ? <img src={l.icon_url} alt="" className="size-6 rounded object-contain" /> : <span className="size-6 rounded bg-secondary" />}
                              <span>{l.name}</span>
                            </div>
                          </td>
                          <td className="py-1.5 pr-2 capitalize text-muted-foreground">{l.kind}</td>
                          <td className="py-1.5 pr-2 tabular-nums">{formatSilver(Number(l.unit_price))}</td>
                          <td className="py-1.5 text-right">
                            <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => { void (async () => { await deleteLoot(l.id); setLoots(await listLoots(selected.id)); })(); }}>
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {loots.length === 0 ? <tr><td colSpan={4} className="py-3 text-xs text-muted-foreground">No loot yet.</td></tr> : null}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  <Input placeholder="Loot name" value={lootName} onChange={(e) => setLootName(e.target.value)} className="h-8 text-sm lg:col-span-2" />
                  <select className="field-select h-8 text-sm" value={lootKind} onChange={(e) => setLootKind(e.target.value as "market" | "npc")}>
                    <option value="market">Market</option>
                    <option value="npc">NPC</option>
                  </select>
                  <Input placeholder="Unit price" type="number" value={lootPrice} onChange={(e) => setLootPrice(e.target.value)} className="h-8 text-sm" />
                  <label className="flex h-8 cursor-pointer items-center justify-center gap-1 rounded-md border border-border text-xs text-muted-foreground hover:border-primary">
                    <Upload className="size-3.5" /> Icon
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setLootFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <button type="button" disabled={busy || !lootName.trim()} onClick={() => void onCreateLoot()} className="mt-2 inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs font-bold hover:border-primary disabled:opacity-50">
                  <Plus className="size-3.5" /> Add loot
                </button>
              </section>

              <section className="rounded-lg border border-border bg-card p-3">
                <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-wider text-primary">New session</p>
                <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <div>
                    <Label className="text-xs">Character</Label>
                    <Input value={character} onChange={(e) => setCharacter(e.target.value)} placeholder="Name" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Duration (min)</Label>
                    <Input type="number" min={1} value={minutes} disabled={timerOn} onChange={(e) => setMinutes(e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div className="flex flex-col justify-end">
                    <button type="button" onClick={toggleTimer} className={cn("inline-flex h-14 min-w-[9.5rem] flex-col items-center justify-center gap-0.5 rounded-lg px-4 text-primary-foreground shadow-md", timerOn ? "bg-destructive" : "bg-primary")}>
                      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide opacity-90">
                        <Timer className="size-4" />{timerOn ? "Stop" : "Start"}
                      </span>
                      <span className="font-mono text-xl font-bold tabular-nums tracking-wider">{chronoLabel}</span>
                    </button>
                  </div>
                </div>
                <div className="mb-3 grid gap-2 sm:grid-cols-2">
                  {loots.map((l) => (
                    <div key={l.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
                      {l.icon_url ? <img src={l.icon_url} alt="" className="size-6 object-contain" /> : null}
                      <span className="min-w-0 flex-1 truncate text-sm">{l.name}</span>
                      <Input type="number" min={0} placeholder="0" value={qty[l.id] ?? ""} onChange={(e) => setQty((prev) => ({ ...prev, [l.id]: e.target.value }))} className="h-7 w-20 text-right text-sm" />
                    </div>
                  ))}
                </div>
                <div className="mb-3 flex flex-wrap gap-4 text-sm">
                  <p><span className="text-muted-foreground">Total </span><span className="font-bold tabular-nums text-primary">{formatSilver(sessionTotals.total)} ⚙</span></p>
                  <p><span className="text-muted-foreground">⚙/h </span><span className="font-bold tabular-nums text-primary">{formatSilver(sessionTotals.sph)}</span></p>
                </div>
                <button type="button" disabled={busy || loots.length === 0} onClick={() => void onSaveSession()} className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50">
                  Save session
                </button>
              </section>

              <section className="rounded-lg border border-border bg-card p-3">
                <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-wider text-primary">Sessions — {selected.name}</p>
                {spotSessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No sessions for this spot yet.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {spotSessions.map((s) => (
                      <li key={s.id} className="rounded-md border border-border/60 px-2 py-2 text-sm">
                        {editingId === s.id ? (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <div className="flex-1"><Label className="text-[0.65rem]">Character</Label><Input value={editChar} onChange={(e) => setEditChar(e.target.value)} className="h-8 text-sm" /></div>
                            <div className="w-24"><Label className="text-[0.65rem]">Minutes</Label><Input value={editMinutes} onChange={(e) => setEditMinutes(e.target.value)} className="h-8 text-sm" /></div>
                            <div className="w-32"><Label className="text-[0.65rem]">Total ⚙</Label><Input value={editTotal} onChange={(e) => setEditTotal(e.target.value)} className="h-8 text-sm" /></div>
                            <button type="button" onClick={() => void saveEdit()} className="h-8 rounded-md bg-primary px-3 text-xs font-bold text-primary-foreground">Save</button>
                            <button type="button" onClick={() => setEditingId(null)} className="h-8 rounded-md border border-border px-3 text-xs">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-medium">{s.character_name}</p>
                              <p className="text-[0.7rem] text-muted-foreground">{new Date(s.created_at).toLocaleString()} · {s.minutes} min · {formatSilver(Number(s.total_value))} ⚙</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="tabular-nums text-primary">{formatSilver(Number(s.silver_per_hour))} ⚙/h</span>
                              <button type="button" className="text-muted-foreground hover:text-primary" onClick={() => startEdit(s)}><Pencil className="size-3.5" /></button>
                              <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => { void (async () => { await deleteSession(s.id); setSessions(await listSessions(100)); })(); }}><Trash2 className="size-3.5" /></button>
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
