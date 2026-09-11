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
import {
  LIFESKILL_TYPES,
  MONSTER_TYPES,
  TERRITORIES,
  type SpotMode,
} from "@/data/grind-meta";
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

  const [addingSpot, setAddingSpot] = useState(false);
  const [spotName, setSpotName] = useState("");
  const [mode, setMode] = useState<SpotMode>("pve");
  const [monsters, setMonsters] = useState<string>(MONSTER_TYPES[0]);
  const [territory, setTerritory] = useState<string>(TERRITORIES[0]);
  const [spotFile, setSpotFile] = useState<File | null>(null);

  const [editingSpotId, setEditingSpotId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editMode, setEditMode] = useState<SpotMode>("pve");
  const [editMonsters, setEditMonsters] = useState("");
  const [editTerritory, setEditTerritory] = useState("");
  const [editSpotFile, setEditSpotFile] = useState<File | null>(null);

  const [lootName, setLootName] = useState("");
  const [lootKind, setLootKind] = useState<"market" | "npc">("market");
  const [lootPrice, setLootPrice] = useState("");
  const [lootFile, setLootFile] = useState<File | null>(null);
  const [addingLoot, setAddingLoot] = useState(false);

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
  const typeOptions = mode === "lifeskill" ? LIFESKILL_TYPES : MONSTER_TYPES;
  const editTypeOptions = editMode === "lifeskill" ? LIFESKILL_TYPES : MONSTER_TYPES;

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
      if (selectedId && !s.some((x) => x.id === selectedId)) setSelectedId(s[0]?.id ?? null);
      else if (!selectedId && s[0]) setSelectedId(s[0].id);
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
      if (timerStart.current != null) setElapsed(Math.floor((Date.now() - timerStart.current) / 1000));
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
    const mins = timerOn && elapsed > 0 ? elapsed / 60 : Math.max(0.01, parseFloat(minutes) || 0);
    const sph = mins > 0 ? total / (mins / 60) : 0;
    return { total, mins, sph };
  }, [loots, qty, minutes, timerOn, elapsed]);

  if (!configured) {
    return <div className="glass p-5 text-sm text-muted-foreground">Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy.</div>;
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
      try {
        const row = await createSpot({ name: spotName.trim(), monsters, territory, icon_url, mode });
        setSpotName("");
        setSpotFile(null);
        setAddingSpot(false);
        await refresh();
        setSelectedId(row.id);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.toLowerCase().includes("mode")) {
          const row = await createSpot({ name: spotName.trim(), monsters, territory, icon_url });
          setSpotName("");
          setSpotFile(null);
          setAddingSpot(false);
          await refresh();
          setSelectedId(row.id);
          setError("Spot created. Run SQL to add mode column for lifeskills.");
        } else throw e;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create spot failed");
    } finally {
      setBusy(false);
    }
  };

  const beginEditSpot = (s: SpotRow) => {
    setEditingSpotId(s.id);
    setEditName(s.name);
    setEditMode((s.mode as SpotMode) || "pve");
    setEditMonsters(s.monsters || MONSTER_TYPES[0]);
    setEditTerritory(s.territory || TERRITORIES[0]);
    setEditSpotFile(null);
    setAddingSpot(false);
  };

  const saveSpotEdit = async () => {
    if (!editingSpotId) return;
    setBusy(true);
    setError(null);
    try {
      const existing = spots.find((x) => x.id === editingSpotId);
      let icon_url = existing?.icon_url ?? null;
      if (editSpotFile) icon_url = await uploadLootIcon(editSpotFile);
      try {
        await updateSpot(editingSpotId, {
          name: editName.trim() || existing?.name || "Spot",
          monsters: editMonsters,
          territory: editTerritory,
          icon_url,
          mode: editMode,
        });
      } catch {
        await updateSpot(editingSpotId, {
          name: editName.trim() || existing?.name || "Spot",
          monsters: editMonsters,
          territory: editTerritory,
          icon_url,
        });
      }
      setEditingSpotId(null);
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
      setAddingLoot(false);
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
    <div className="flex flex-col gap-4">
      {error ? (
        <p className="glass rounded-xl border border-rose-400/30 px-4 py-2.5 text-sm text-rose-300">{error}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="glass flex flex-col p-3">
          <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-[0.2em] neon-text">Spots</p>
          <ul className="mb-2 flex max-h-[20rem] flex-col gap-1 overflow-y-auto">
            {spots.map((s) => (
              <li key={s.id}>
                {editingSpotId === s.id ? (
                  <div className="space-y-1.5 rounded-xl border border-cyan-400/20 bg-black/20 p-2">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-sm" />
                    <div className="grid grid-cols-2 gap-1">
                      <button type="button" className={cn("h-7 rounded-lg text-[0.65rem] font-bold", editMode === "pve" ? "bg-cyan-400/20 text-cyan-300" : "text-muted-foreground")} onClick={() => { setEditMode("pve"); setEditMonsters(MONSTER_TYPES[0]); }}>PvE</button>
                      <button type="button" className={cn("h-7 rounded-lg text-[0.65rem] font-bold", editMode === "lifeskill" ? "bg-violet-400/20 text-violet-300" : "text-muted-foreground")} onClick={() => { setEditMode("lifeskill"); setEditMonsters(LIFESKILL_TYPES[0]); }}>Lifeskill</button>
                    </div>
                    <select className="field-select h-8 text-xs" value={editTerritory} onChange={(e) => setEditTerritory(e.target.value)}>{TERRITORIES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
                    <select className="field-select h-8 text-xs" value={editMonsters} onChange={(e) => setEditMonsters(e.target.value)}>{editTypeOptions.map((m) => <option key={m} value={m}>{m}</option>)}</select>
                    <label className="btn-ghost h-7 w-full cursor-pointer text-[0.65rem]"><Upload className="size-3" /> Icon<input type="file" accept="image/*" className="hidden" onChange={(e) => setEditSpotFile(e.target.files?.[0] ?? null)} /></label>
                    <div className="flex gap-1">
                      <button type="button" className="btn-primary h-7 flex-1 text-[0.65rem]" disabled={busy} onClick={() => void saveSpotEdit()}>Save</button>
                      <button type="button" className="btn-ghost h-7" onClick={() => setEditingSpotId(null)}><X className="size-3" /></button>
                    </div>
                  </div>
                ) : (
                  <div className="group flex items-center gap-0.5">
                    <button type="button" onClick={() => setSelectedId(s.id)} className={cn("flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-all", selectedId === s.id ? "bg-cyan-400/10 ring-1 ring-cyan-400/35" : "hover:bg-white/5")}>
                      {s.icon_url ? <img src={s.icon_url} alt="" className="size-8 rounded-lg object-contain ring-1 ring-white/10" /> : <span className="size-8 rounded-lg bg-white/5 ring-1 ring-white/10" />}
                      <span className="min-w-0">
                        <span className={cn("block truncate text-sm font-semibold", selectedId === s.id ? "text-cyan-300" : "text-foreground")}>{s.name}</span>
                        <span className="block truncate text-[0.6rem] text-muted-foreground">{(s.mode === "lifeskill" ? "LS · " : "") + (s.territory || "")}</span>
                      </span>
                    </button>
                    <button type="button" className="rounded-lg p-1 text-muted-foreground opacity-0 hover:text-cyan-300 group-hover:opacity-100" onClick={() => beginEditSpot(s)}><Pencil className="size-3.5" /></button>
                    <button type="button" className="rounded-lg p-1 text-muted-foreground opacity-0 hover:text-rose-400 group-hover:opacity-100" onClick={() => { void (async () => { setBusy(true); try { await deleteSpot(s.id); await refresh(); } catch (e) { setError(e instanceof Error ? e.message : "Delete failed"); } finally { setBusy(false); } })(); }}><Trash2 className="size-3.5" /></button>
                  </div>
                )}
              </li>
            ))}
            {spots.length === 0 && !addingSpot ? <li className="py-6 text-center text-xs text-muted-foreground">No spots</li> : null}
          </ul>

          {addingSpot ? (
            <div className="mt-1 space-y-1.5 border-t border-white/10 pt-2">
              <Input placeholder="Spot name" value={spotName} onChange={(e) => setSpotName(e.target.value)} className="h-8 text-sm" />
              <div className="grid grid-cols-2 gap-1">
                <button type="button" className={cn("h-7 rounded-lg text-[0.65rem] font-bold", mode === "pve" ? "bg-cyan-400/20 text-cyan-300" : "text-muted-foreground")} onClick={() => { setMode("pve"); setMonsters(MONSTER_TYPES[0]); }}>PvE</button>
                <button type="button" className={cn("h-7 rounded-lg text-[0.65rem] font-bold", mode === "lifeskill" ? "bg-violet-400/20 text-violet-300" : "text-muted-foreground")} onClick={() => { setMode("lifeskill"); setMonsters(LIFESKILL_TYPES[0]); }}>Lifeskill</button>
              </div>
              <select className="field-select h-8 text-xs" value={territory} onChange={(e) => setTerritory(e.target.value)}>{TERRITORIES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
              <select className="field-select h-8 text-xs" value={monsters} onChange={(e) => setMonsters(e.target.value)}>{typeOptions.map((m) => <option key={m} value={m}>{m}</option>)}</select>
              <label className="btn-ghost h-7 w-full cursor-pointer text-[0.65rem]"><Upload className="size-3" /> {spotFile ? "Icon ✓" : "Icon"}<input type="file" accept="image/*" className="hidden" onChange={(e) => setSpotFile(e.target.files?.[0] ?? null)} /></label>
              <div className="flex gap-1">
                <button type="button" disabled={busy || !spotName.trim()} onClick={() => void onCreateSpot()} className="btn-primary h-7 flex-1 text-[0.65rem]">Create</button>
                <button type="button" className="btn-ghost h-7" onClick={() => setAddingSpot(false)}><X className="size-3" /></button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => { setAddingSpot(true); setEditingSpotId(null); }} className="mt-1 flex h-9 w-full items-center justify-center gap-1 rounded-xl border border-dashed border-cyan-400/30 text-xs font-semibold text-cyan-300/90 hover:bg-cyan-400/5">
              <Plus className="size-3.5" /> Add spot
            </button>
          )}
        </aside>

        <div className="flex min-w-0 flex-col gap-3">
          {!selected ? (
            <div className="glass px-6 py-14 text-center text-sm text-muted-foreground">Select or create a spot</div>
          ) : (
            <>
              <section className="glass-strong p-3 sm:p-4">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  {selected.icon_url ? <img src={selected.icon_url} alt="" className="size-11 rounded-xl object-contain ring-1 ring-white/10" /> : <span className="size-11 rounded-xl bg-white/5 ring-1 ring-white/10" />}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold">{selected.name}</h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {selected.mode === "lifeskill" ? "Lifeskill" : "PvE"} · {selected.monsters} · {selected.territory}
                      {spotSessions.length ? ` · avg ${formatSilver(avgSph)} ⚙/h` : ""}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[0.6rem] text-muted-foreground">Character</Label>
                      <Input value={character} onChange={(e) => setCharacter(e.target.value)} placeholder="Name" className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-[0.6rem] text-muted-foreground">Min</Label>
                      <Input type="number" min={1} value={minutes} disabled={timerOn} onChange={(e) => setMinutes(e.target.value)} className="h-8 text-sm" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-2xl border border-cyan-400/15 bg-black/25 px-4 py-2">
                    <div className="text-center">
                      <p className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">Timer</p>
                      <p className={cn("font-mono text-2xl font-semibold tabular-nums tracking-wider", timerOn ? "neon-text" : "text-foreground")}>
                        {hh}:{mm}:{ss}
                      </p>
                      <div className="mt-1 flex justify-center gap-1">
                        <button type="button" onClick={toggleTimer} className={cn("rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold", timerOn ? "bg-rose-500/20 text-rose-300" : "bg-cyan-400 text-slate-950")}>
                          {timerOn ? <span className="inline-flex items-center gap-1"><Square className="size-2.5 fill-current" />Stop</span> : <span className="inline-flex items-center gap-1"><Timer className="size-3" />Start</span>}
                        </button>
                        <button type="button" onClick={resetTimer} className="rounded-full px-2 py-0.5 text-[0.65rem] text-muted-foreground ring-1 ring-white/10">
                          Reset
                        </button>
                      </div>
                    </div>
                    <div className="h-12 w-px bg-white/10" />
                    <div className="text-right">
                      <p className="text-[0.55rem] font-bold uppercase tracking-[0.15em] text-muted-foreground">Live ⚙/h</p>
                      <p className="text-xl font-semibold tabular-nums neon-violet">{formatSilver(sessionTotals.sph)}</p>
                      <p className="text-[0.65rem] tabular-nums text-muted-foreground">{formatSilver(sessionTotals.total)} total</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  {loots.map((l) => {
                    const q = parseFloat(qty[l.id] || "0") || 0;
                    const line = q * Number(l.unit_price);
                    const lineSph = sessionTotals.mins > 0 ? line / (sessionTotals.mins / 60) : 0;
                    return (
                      <div key={l.id} className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/20 px-2.5 py-1.5">
                        {l.icon_url ? (
                          <img src={l.icon_url} alt="" className="size-7 rounded object-contain" />
                        ) : (
                          <span className="size-7 rounded bg-white/5" />
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm">{l.name}</span>
                        <span className="hidden text-[0.65rem] tabular-nums text-muted-foreground sm:inline">
                          {formatSilver(Number(l.unit_price))} ⚙
                        </span>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={qty[l.id] ?? ""}
                          onChange={(e) => setQty((prev) => ({ ...prev, [l.id]: e.target.value }))}
                          className="h-7 w-16 text-right text-sm"
                        />
                        <span className="w-20 text-right text-xs font-semibold tabular-nums text-violet-300">
                          {q > 0 ? `${formatSilver(lineSph)}/h` : "—"}
                        </span>
                      </div>
                    );
                  })}
                  {loots.length === 0 ? (
                    <p className="py-2 text-center text-xs text-muted-foreground">Add loot rows below</p>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" disabled={busy || loots.length === 0} onClick={() => void onSaveSession()} className="btn-primary">
                    Save session
                  </button>
                </div>
              </section>

              <section className="glass overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] neon-text">Loot table</p>
                  <button type="button" className="btn-ghost h-7 text-[0.65rem]" onClick={() => setAddingLoot((v) => !v)}>
                    <Plus className="size-3" /> Loot
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] table-fixed text-left text-sm">
                    <colgroup>
                      <col className="w-[48%]" />
                      <col className="w-[14%]" />
                      <col className="w-[24%]" />
                      <col className="w-[14%]" />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-white/10 text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                        <th className="px-3 py-2 font-semibold">Item</th>
                        <th className="px-2 py-2 font-semibold">Type</th>
                        <th className="px-2 py-2 font-semibold">Unit</th>
                        <th className="px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {loots.map((l) => (
                        <tr key={l.id} className="border-b border-white/5">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {l.icon_url ? <img src={l.icon_url} alt="" className="size-6 rounded object-contain" /> : <span className="size-6 rounded bg-white/5" />}
                              <span className="truncate">{l.name}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2 capitalize text-muted-foreground">{l.kind}</td>
                          <td className="px-2 py-2 tabular-nums">{formatSilver(Number(l.unit_price))}</td>
                          <td className="px-2 py-2 text-right">
                            <button type="button" className="text-muted-foreground hover:text-rose-400" onClick={() => { void (async () => { await deleteLoot(l.id); setLoots(await listLoots(selected.id)); })(); }}>
                              <Trash2 className="inline size-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {addingLoot ? (
                  <div className="grid gap-2 border-t border-white/10 p-3 sm:grid-cols-2 lg:grid-cols-5">
                    <Input placeholder="Name" value={lootName} onChange={(e) => setLootName(e.target.value)} className="h-8 text-sm lg:col-span-2" />
                    <select className="field-select h-8 text-sm" value={lootKind} onChange={(e) => setLootKind(e.target.value as "market" | "npc")}>
                      <option value="market">Market</option>
                      <option value="npc">NPC</option>
                    </select>
                    <Input placeholder="Price" type="number" value={lootPrice} onChange={(e) => setLootPrice(e.target.value)} className="h-8 text-sm" />
                    <label className="btn-ghost h-8 cursor-pointer">
                      <Upload className="size-3" /> Icon
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setLootFile(e.target.files?.[0] ?? null)} />
                    </label>
                    <button type="button" disabled={busy || !lootName.trim()} onClick={() => void onCreateLoot()} className="btn-primary h-8 sm:col-span-2 lg:col-span-1">
                      Add
                    </button>
                  </div>
                ) : null}
              </section>

              <section className="glass p-3">
                <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-[0.18em] neon-text">
                  Sessions — {selected.name}
                </p>
                {spotSessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No sessions yet</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {spotSessions.map((s) => (
                      <li key={s.id} className="rounded-xl border border-white/5 bg-black/20 px-2.5 py-2 text-sm">
                        {editingId === s.id ? (
                          <div className="flex flex-wrap items-end gap-2">
                            <Input value={editChar} onChange={(e) => setEditChar(e.target.value)} className="h-7 w-28 text-xs" />
                            <Input value={editMinutes} onChange={(e) => setEditMinutes(e.target.value)} className="h-7 w-16 text-xs" />
                            <Input value={editTotal} onChange={(e) => setEditTotal(e.target.value)} className="h-7 w-24 text-xs" />
                            <button type="button" className="btn-primary h-7 text-[0.65rem]" onClick={() => void saveEdit()}>Save</button>
                            <button type="button" className="btn-ghost h-7" onClick={() => setEditingId(null)}><X className="size-3" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-medium">{s.character_name}</p>
                              <p className="text-[0.65rem] text-muted-foreground">
                                {new Date(s.created_at).toLocaleString()} · {s.minutes}m · {formatSilver(Number(s.total_value))} ⚙
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-violet-300">
                                {formatSilver(Number(s.silver_per_hour))}/h
                              </span>
                              <button type="button" className="text-muted-foreground hover:text-cyan-300" onClick={() => startEdit(s)}>
                                <Pencil className="size-3.5" />
                              </button>
                              <button type="button" className="text-muted-foreground hover:text-rose-400" onClick={() => { void (async () => { await deleteSession(s.id); setSessions(await listSessions(100)); })(); }}>
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
