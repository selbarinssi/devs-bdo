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
  createLoot,
  createSession,
  createSpot,
  deleteLoot,
  deleteSession,
  deleteSpot,
  findIconByLootName,
  listLoots,
  listSessions,
  listSpots,
  updateLoot,
  updateSession,
  updateSpot,
  uploadLootIcon,
} from "@/lib/grind-api";
import { isSupabaseConfigured, type LootRow, type SpotRow } from "@/lib/supabase";
import { cn, formatNumber, formatSilverCompact } from "@/lib/utils";

function formatSilver(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return formatSilverCompact(n);
}

const CHRONO_KEY = "bdo_grind_chrono_v1";

type ChronoState = {
  running: boolean;
  startedAt: number | null;
  elapsedMs: number;
  character: string;
  mode: "grind" | "lifeskill";
  lifeskillType: string;
};

function loadChrono(): ChronoState {
  try {
    const raw = localStorage.getItem(CHRONO_KEY);
    if (!raw) return { running: false, startedAt: null, elapsedMs: 0, character: "", mode: "grind", lifeskillType: "Cooking" };
    const p = JSON.parse(raw) as ChronoState;
    return {
      running: !!p.running,
      startedAt: p.startedAt ?? null,
      elapsedMs: typeof p.elapsedMs === "number" ? p.elapsedMs : 0,
      character: p.character ?? "",
      mode: p.mode === "lifeskill" ? "lifeskill" : "grind",
      lifeskillType: p.lifeskillType ?? "Cooking",
    };
  } catch {
    return { running: false, startedAt: null, elapsedMs: 0, character: "", mode: "grind", lifeskillType: "Cooking" };
  }
}

function saveChrono(s: ChronoState) {
  try {
    localStorage.setItem(CHRONO_KEY, JSON.stringify(s));
  } catch {}
}

function clearChrono() {
  try {
    localStorage.removeItem(CHRONO_KEY);
  } catch {}
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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

  // Spot form
  const [spotName, setSpotName] = useState("");
  const [spotAp, setSpotAp] = useState("");
  const [spotDp, setSpotDp] = useState("");
  const [spotNotes, setSpotNotes] = useState("");

  // Chrono — restored from localStorage so it survives route/tab switches
  const [chrono, setChrono] = useState<ChronoState>(() => ({
    running: false,
    startedAt: null,
    elapsedMs: 0,
    character: "",
    mode: "grind",
    lifeskillType: "Cooking",
  }));
  const [tick, setTick] = useState(0);
  const [editingLootId, setEditingLootId] = useState<string | null>(null);
  const [editLootName, setEditLootName] = useState("");
  const [editLootPrice, setEditLootPrice] = useState("");
  const [editLootQty, setEditLootQty] = useState("");
  const [editLootIcon, setEditLootIcon] = useState<File | null>(null);

  // Loot form
  const [lootName, setLootName] = useState("");
  const [lootPrice, setLootPrice] = useState("");
  const [lootQty, setLootQty] = useState("1");
  const [lootIcon, setLootIcon] = useState<File | null>(null);

  // Session form extras
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionSilver, setSessionSilver] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Restore chrono from localStorage once on the client (survives route switches)
  useEffect(() => {
    setChrono(loadChrono());
  }, []);

  // Persist chrono whenever it changes
  useEffect(() => {
    saveChrono(chrono);
  }, [chrono]);

  // Tick while running
  useEffect(() => {
    if (!chrono.running || !chrono.startedAt) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [chrono.running, chrono.startedAt]);

  const displayMs = useMemo(() => {
    if (chrono.running && chrono.startedAt) {
      return chrono.elapsedMs + (Date.now() - chrono.startedAt);
    }
    return chrono.elapsedMs;
  }, [chrono.running, chrono.startedAt, chrono.elapsedMs, tick]);

  const hours = displayMs / 3_600_000;

  const refresh = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      const [s, sess] = await Promise.all([listSpots(), listSessions(100)]);
      setSpots(s);
      setSessions(sess);
      if (selectedId) {
        const l = await listLoots(selectedId);
        setLoots(l);
      } else if (s.length && !selectedId) {
        setSelectedId(s[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
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
    void (async () => {
      try {
        setLoots(await listLoots(selectedId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load loots");
      }
    })();
  }, [selectedId, configured]);

  const selected = spots.find((s) => s.id === selectedId) ?? null;

  const totalLootValue = useMemo(
    () => loots.reduce((sum, l) => sum + (l.price ?? 0) * (l.quantity ?? 0), 0),
    [loots],
  );

  const liveSilverPerHour = useMemo(() => {
    if (hours <= 0) return 0;
    return totalLootValue / hours;
  }, [totalLootValue, hours]);

  async function handleCreateSpot() {
    if (!spotName.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const spot = await createSpot({
        name: spotName.trim(),
        ap: spotAp ? Number(spotAp) : null,
        dp: spotDp ? Number(spotDp) : null,
        notes: spotNotes.trim() || null,
      });
      setSpots((prev) => [spot, ...prev]);
      setSelectedId(spot.id);
      setSpotName("");
      setSpotAp("");
      setSpotDp("");
      setSpotNotes("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create spot failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSpot(id: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteSpot(id);
      setSpots((prev) => prev.filter((s) => s.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddLoot() {
    if (!selectedId || !lootName.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      let icon_url: string | null = null;
      if (lootIcon) icon_url = await uploadLootIcon(lootIcon);
      else icon_url = await findIconByLootName(lootName.trim());
      const row = await createLoot({
        spot_id: selectedId,
        name: lootName.trim(),
        price: lootPrice ? Number(lootPrice) : 0,
        quantity: lootQty ? Number(lootQty) : 1,
        icon_url,
      });
      setLoots((prev) => [...prev, row]);
      setLootName("");
      setLootPrice("");
      setLootQty("1");
      setLootIcon(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Add loot failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteLoot(id: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteLoot(id);
      setLoots((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete loot failed");
    } finally {
      setBusy(false);
    }
  }

  function startEditLoot(l: LootRow) {
    setEditingLootId(l.id);
    setEditLootName(l.name);
    setEditLootPrice(String(l.price ?? 0));
    setEditLootQty(String(l.quantity ?? 1));
    setEditLootIcon(null);
  }

  function cancelEditLoot() {
    setEditingLootId(null);
    setEditLootName("");
    setEditLootPrice("");
    setEditLootQty("");
    setEditLootIcon(null);
  }

  async function handleSaveLoot() {
    if (!editingLootId || !selectedId) return;
    setBusy(true);
    setError(null);
    try {
      const existing = loots.find((x) => x.id === editingLootId);
      let icon_url = existing?.icon_url ?? null;
      if (editLootIcon) icon_url = await uploadLootIcon(editLootIcon);
      else if (!icon_url) icon_url = await findIconByLootName(editLootName.trim());
      await updateLoot(editingLootId, {
        name: editLootName.trim(),
        price: editLootPrice ? Number(editLootPrice) : 0,
        quantity: editLootQty ? Number(editLootQty) : 1,
        icon_url,
      });
      setLoots(await listLoots(selectedId));
      cancelEditLoot();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update loot failed");
    } finally {
      setBusy(false);
    }
  }

  function startTimer() {
    setChrono((c) => ({
      ...c,
      running: true,
      startedAt: Date.now(),
    }));
  }

  function pauseTimer() {
    setChrono((c) => {
      if (!c.running || !c.startedAt) return c;
      return {
        ...c,
        running: false,
        elapsedMs: c.elapsedMs + (Date.now() - c.startedAt),
        startedAt: null,
      };
    });
  }

  function resetTimer() {
    setChrono((c) => ({
      ...c,
      running: false,
      startedAt: null,
      elapsedMs: 0,
    }));
    clearChrono();
  }

  async function handleSaveSession() {
    if (!selectedId || busy) return;
    const durationMin = Math.max(1, Math.round(displayMs / 60_000));
    setBusy(true);
    setError(null);
    try {
      await createSession({
        spot_id: selectedId,
        character: chrono.character.trim() || null,
        duration_min: durationMin,
        silver: sessionSilver ? Number(sessionSilver) : totalLootValue,
        notes: sessionNotes.trim() || null,
        mode: chrono.mode,
        lifeskill_type: chrono.mode === "lifeskill" ? chrono.lifeskillType : null,
      });
      setSessions(await listSessions(100));
      setSessionNotes("");
      setSessionSilver("");
      resetTimer();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save session failed");
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <div className="glass p-6 text-sm text-muted-foreground">
        Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="glass border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>
      )}

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        {/* Spots sidebar */}
        <div className="space-y-3">
          <section className="glass p-3">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-300/90">Spots</h2>
            {loading && spots.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading…
              </div>
            ) : (
              <ul className="max-h-[40vh] space-y-1 overflow-y-auto">
                {spots.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition",
                        selectedId === s.id
                          ? "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/40"
                          : "hover:bg-white/5 text-foreground/90",
                      )}
                    >
                      <span className="truncate">{s.name}</span>
                      <span
                        role="button"
                        tabIndex={0}
                        className="ml-1 shrink-0 text-muted-foreground hover:text-rose-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteSpot(s.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            void handleDeleteSpot(s.id);
                          }
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="glass p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-300/90">New spot</h3>
            <div className="space-y-2">
              <Input placeholder="Spot name" value={spotName} onChange={(e) => setSpotName(e.target.value)} className="h-8 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="AP" type="number" value={spotAp} onChange={(e) => setSpotAp(e.target.value)} className="h-8 text-sm" />
                <Input placeholder="DP" type="number" value={spotDp} onChange={(e) => setSpotDp(e.target.value)} className="h-8 text-sm" />
              </div>
              <Input placeholder="Notes" value={spotNotes} onChange={(e) => setSpotNotes(e.target.value)} className="h-8 text-sm" />
              <button
                type="button"
                disabled={busy || !spotName.trim()}
                onClick={() => void handleCreateSpot()}
                className="flex w-full items-center justify-center gap-1.5 rounded-md bg-cyan-500/20 px-2 py-1.5 text-sm text-cyan-100 ring-1 ring-cyan-400/40 hover:bg-cyan-500/30 disabled:opacity-50"
              >
                <Plus className="size-3.5" /> Add
              </button>
            </div>
          </section>
        </div>

        {/* Main panel */}
        <div className="space-y-4">
          {selected && (
            <>
              {/* Compact chrono + metrics */}
              <section className="glass p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Timer className="size-4 text-cyan-400" />
                    <span className="font-mono text-lg tabular-nums text-cyan-100">{formatElapsed(displayMs)}</span>
                  </div>
                  <div className="flex gap-1">
                    {!chrono.running ? (
                      <button type="button" onClick={startTimer} className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-200 ring-1 ring-emerald-400/40 hover:bg-emerald-500/30">
                        Start
                      </button>
                    ) : (
                      <button type="button" onClick={pauseTimer} className="rounded-md bg-amber-500/20 px-2.5 py-1 text-xs text-amber-200 ring-1 ring-amber-400/40 hover:bg-amber-500/30">
                        Pause
                      </button>
                    )}
                    <button type="button" onClick={resetTimer} className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-muted-foreground hover:bg-white/10">
                      Reset
                    </button>
                  </div>
                  <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
                    <span className="metric-pill">
                      <span className="text-muted-foreground">Silver</span>
                      <span className="font-mono text-cyan-200">{formatSilver(totalLootValue)}</span>
                    </span>
                    <span className="metric-pill">
                      <span className="text-muted-foreground">/h</span>
                      <span className="font-mono text-emerald-300">{formatSilver(liveSilverPerHour)}</span>
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <div className="min-w-[120px] flex-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Character</Label>
                    <Input
                      value={chrono.character}
                      onChange={(e) => setChrono((c) => ({ ...c, character: e.target.value }))}
                      placeholder="Name"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex gap-1 rounded-md bg-black/20 p-0.5 ring-1 ring-white/10">
                    <button
                      type="button"
                      onClick={() => setChrono((c) => ({ ...c, mode: "grind" }))}
                      className={cn(
                        "rounded px-2.5 py-1 text-xs transition",
                        chrono.mode === "grind" ? "bg-cyan-500/30 text-cyan-100" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Grind
                    </button>
                    <button
                      type="button"
                      onClick={() => setChrono((c) => ({ ...c, mode: "lifeskill" }))}
                      className={cn(
                        "rounded px-2.5 py-1 text-xs transition",
                        chrono.mode === "lifeskill" ? "bg-violet-500/30 text-violet-100" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Lifeskill
                    </button>
                  </div>
                  {chrono.mode === "lifeskill" && (
                    <select
                      value={chrono.lifeskillType}
                      onChange={(e) => setChrono((c) => ({ ...c, lifeskillType: e.target.value }))}
                      className="h-8 rounded-md border border-white/10 bg-black/30 px-2 text-sm text-foreground"
                    >
                      {LIFESKILL_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="min-w-[100px]">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Session silver</Label>
                    <Input
                      type="number"
                      value={sessionSilver}
                      onChange={(e) => setSessionSilver(e.target.value)}
                      placeholder={String(Math.round(totalLootValue))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="min-w-[140px] flex-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Notes</Label>
                    <Input value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} placeholder="Optional" className="h-8 text-sm" />
                  </div>
                  <button
                    type="button"
                    disabled={busy || displayMs < 1000}
                    onClick={() => void handleSaveSession()}
                    className="h-8 rounded-md bg-emerald-500/20 px-3 text-xs text-emerald-100 ring-1 ring-emerald-400/40 hover:bg-emerald-500/30 disabled:opacity-50"
                  >
                    Save session
                  </button>
                </div>
              </section>

              {/* Loot table */}
              <section className="glass p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300/90">Loot — {selected.name}</h2>
                </div>
                <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
                  <Input placeholder="Name" value={lootName} onChange={(e) => setLootName(e.target.value)} className="h-8 text-sm lg:col-span-2" />
                  <Input placeholder="Price" type="number" value={lootPrice} onChange={(e) => setLootPrice(e.target.value)} className="h-8 text-sm" />
                  <Input placeholder="Qty" type="number" value={lootQty} onChange={(e) => setLootQty(e.target.value)} className="h-8 text-sm" />
                  <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-white/15 px-2 text-xs text-muted-foreground hover:border-cyan-400/40">
                    <Upload className="size-3.5" />
                    {lootIcon ? lootIcon.name.slice(0, 12) : "Icon"}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setLootIcon(e.target.files?.[0] ?? null)} />
                  </label>
                  <button
                    type="button"
                    disabled={busy || !lootName.trim()}
                    onClick={() => void handleAddLoot()}
                    className="flex h-8 items-center justify-center gap-1 rounded-md bg-cyan-500/20 text-xs text-cyan-100 ring-1 ring-cyan-400/40 hover:bg-cyan-500/30 disabled:opacity-50"
                  >
                    <Plus className="size-3.5" /> Add
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <th className="pb-1.5 pr-2 font-medium">Item</th>
                        <th className="pb-1.5 pr-2 font-medium">Price</th>
                        <th className="pb-1.5 pr-2 font-medium">Qty</th>
                        <th className="pb-1.5 pr-2 font-medium">Total</th>
                        <th className="pb-1.5 pr-2 font-medium min-w-[5.5rem]">/h</th>
                        <th className="pb-1.5 font-medium w-16" />
                      </tr>
                    </thead>
                    <tbody>
                      {loots.map((l) => {
                        const total = (l.price ?? 0) * (l.quantity ?? 0);
                        const perH = hours > 0 ? total / hours : 0;
                        return (
                          <tr key={l.id} className="border-b border-white/5">
                            {editingLootId === l.id ? (
                              <>
                                <td className="py-1.5 pr-2" colSpan={4}>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {l.icon_url && (
                                      <img src={l.icon_url} alt="" className="size-6 rounded object-contain" />
                                    )}
                                    <Input value={editLootName} onChange={(e) => setEditLootName(e.target.value)} className="h-7 w-32 text-xs" />
                                    <Input type="number" value={editLootPrice} onChange={(e) => setEditLootPrice(e.target.value)} className="h-7 w-24 text-xs" />
                                    <Input type="number" value={editLootQty} onChange={(e) => setEditLootQty(e.target.value)} className="h-7 w-16 text-xs" />
                                    <label className="flex h-7 cursor-pointer items-center gap-1 rounded border border-dashed border-white/15 px-1.5 text-[10px] text-muted-foreground">
                                      <Upload className="size-3" />
                                      <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setEditLootIcon(e.target.files?.[0] ?? null)} />
                                    </label>
                                    <button type="button" onClick={() => void handleSaveLoot()} className="h-7 rounded bg-emerald-500/20 px-2 text-xs text-emerald-200 ring-1 ring-emerald-400/40">
                                      Save
                                    </button>
                                    <button type="button" onClick={cancelEditLoot} className="h-7 rounded px-1.5 text-muted-foreground hover:text-foreground">
                                      <X className="size-3.5" />
                                    </button>
                                  </div>
                                </td>
                                <td className="py-1.5" />
                                <td className="py-1.5" />
                              </>
                            ) : (
                              <>
                                <td className="py-1.5 pr-2">
                                  <div className="flex items-center gap-2">
                                    {l.icon_url ? (
                                      <img src={l.icon_url} alt="" className="size-6 shrink-0 rounded object-contain" />
                                    ) : (
                                      <span className="flex size-6 shrink-0 items-center justify-center rounded bg-white/5 text-[10px] text-muted-foreground">?</span>
                                    )}
                                    <span className="truncate">{l.name}</span>
                                  </div>
                                </td>
                                <td className="py-1.5 pr-2 font-mono text-xs tabular-nums">{formatSilver(l.price ?? 0)}</td>
                                <td className="py-1.5 pr-2 font-mono text-xs tabular-nums">{l.quantity ?? 0}</td>
                                <td className="py-1.5 pr-2 font-mono text-xs tabular-nums text-cyan-200/90">{formatSilver(total)}</td>
                                <td className="py-1.5 pr-2 font-mono text-xs tabular-nums text-emerald-300/90 min-w-[5.5rem]">{formatSilver(perH)}</td>
                                <td className="py-1.5">
                                  <div className="flex gap-1">
                                    <button type="button" className="text-muted-foreground hover:text-cyan-300" onClick={() => startEditLoot(l)}>
                                      <Pencil className="size-3.5" />
                                    </button>
                                    <button type="button" className="text-muted-foreground hover:text-rose-400" onClick={() => void handleDeleteLoot(l.id)}>
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {loots.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">No loot yet — add items above.</p>
                  )}
                </div>
              </section>

              {/* Recent sessions */}
              <section className="glass p-3">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-300/90">Recent sessions</h2>
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sessions saved yet.</p>
                ) : (
                  <ul className="max-h-[28vh] space-y-1.5 overflow-y-auto">
                    {sessions.slice(0, 30).map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-2 rounded-md bg-white/[0.03] px-2 py-1.5 text-sm">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="font-medium text-foreground/90">{s.spot_name ?? "—"}</span>
                            {s.character && <span className="text-xs text-muted-foreground">{s.character}</span>}
                            {s.mode === "lifeskill" && s.lifeskill_type && (
                              <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] text-violet-200">{s.lifeskill_type}</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {s.duration_min} min · {formatSilver(s.silver ?? 0)} silver
                            {s.notes ? ` · ${s.notes}` : ""}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 text-muted-foreground hover:text-rose-400"
                          onClick={() => {
                            void (async () => {
                              await deleteSession(s.id);
                              setSessions(await listSessions(100));
                            })();
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}

          {!selected && !loading && (
            <div className="glass p-8 text-center text-sm text-muted-foreground">
              Select or create a grind spot to start tracking.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
