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

const CHRONO_KEY = "bdo_grind_chrono_v2";

type SpotChrono = {
  character: string;
  minutes: string;
  qty: Record<string, string>;
  timerOn: boolean;
  elapsed: number;
  anchorMs: number | null;
};

type ChronoStore = {
  lastSpotId: string | null;
  bySpot: Record<string, SpotChrono>;
};

function emptySpotChrono(): SpotChrono {
  return { character: "", minutes: "60", qty: {}, timerOn: false, elapsed: 0, anchorMs: null };
}

function readStore(): ChronoStore {
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

function writeStore(s: ChronoStore) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHRONO_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
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

  const [editingLootId, setEditingLootId] = useState<string | null>(null);
  const [editLootName, setEditLootName] = useState("");
  const [editLootKind, setEditLootKind] = useState<"market" | "npc">("market");
  const [editLootPrice, setEditLootPrice] = useState("");
  const [editLootFile, setEditLootFile] = useState<File | null>(null);
  const [chronoHydrated, setChronoHydrated] = useState(false);

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
    }, 200);
    return () => clearInterval(id);
  }, [timerOn]);

  useEffect(() => {
    const store = readStore();
    if (store.lastSpotId) setSelectedId(store.lastSpotId);
    setChronoHydrated(true);
  }, []);

  useEffect(() => {
    if (!chronoHydrated || !selectedId) return;
    const store = readStore();
    const draft = store.bySpot[selectedId] ?? emptySpotChrono();
    setCharacter(draft.character);
    setMinutes(draft.minutes || "60");
    setQty(draft.qty ?? {});
    if (draft.timerOn && draft.anchorMs != null) {
      timerStart.current = draft.anchorMs;
      setTimerOn(true);
      setElapsed(Math.max(0, Math.floor((Date.now() - draft.anchorMs) / 1000)));
    } else {
      timerStart.current = null;
      setTimerOn(false);
      setElapsed(draft.elapsed || 0);
    }
  }, [selectedId, chronoHydrated]);

  useEffect(() => {
    if (!chronoHydrated || !selectedId) return;
    const store = readStore();
    const next: SpotChrono = {
      character,
      minutes,
      qty,
      timerOn,
      elapsed:
        timerOn && timerStart.current != null
          ? Math.max(0, Math.floor((Date.now() - timerStart.current) / 1000))
          : elapsed,
      anchorMs: timerOn ? timerStart.current : null,
    };
    writeStore({ lastSpotId: selectedId, bySpot: { ...store.bySpot, [selectedId]: next } });
  }, [selectedId, character, minutes, qty, timerOn, elapsed, chronoHydrated]);

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
    return (
      <div className="glass p-5 text-sm text-muted-foreground">
        Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy.
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
      const row = await createSpot({ name: spotName.trim(), monsters, territory, icon_url, mode });
      setSpotName("");
      setSpotFile(null);
      setAddingSpot(false);
      await refresh();
      setSelectedId(row.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create spot failed";
      if (msg.toLowerCase().includes("mode")) {
        try {
          let icon_url: string | null = null;
          if (spotFile) icon_url = await uploadLootIcon(spotFile);
          const row = await createSpot({ name: spotName.trim(), monsters, territory, icon_url });
          setSpotName("");
          setSpotFile(null);
          setAddingSpot(false);
          await refresh();
          setSelectedId(row.id);
          setError("Spot created. Run SQL to enable mode column for lifeskills.");
          return;
        } catch (e2) {
          setError(e2 instanceof Error ? e2.message : "Create spot failed");
        }
      } else {
        setError(msg);
      }
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
      else icon_url = await findIconByLootName(lootName.trim());
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
        lines,
      });
      setQty({});
      setTimerOn(false);
      timerStart.current = null;
      setElapsed(0);
      const store = readStore();
      const nextBy = { ...store.bySpot };
      delete nextBy[selectedId];
      writeStore({ lastSpotId: selectedId, bySpot: nextBy });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save session failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleTimer = () => {
    if (timerOn) {
      setTimerOn(false);
      if (timerStart.current != null) {
        setElapsed(Math.floor((Date.now() - timerStart.current) / 1000));
      }
      timerStart.current = null;
      setMinutes(String(Math.max(1, Math.round(elapsed / 60))));
    } else {
      timerStart.current = Date.now() - elapsed * 1000;
      setTimerOn(true);
    }
  };

  const resetTimer = () => {
    setTimerOn(false);
    timerStart.current = null;
    setElapsed(0);
    if (selectedId) {
      const store = readStore();
      writeStore({
        lastSpotId: selectedId,
        bySpot: {
          ...store.bySpot,
          [selectedId]: {
            ...(store.bySpot[selectedId] ?? emptySpotChrono()),
            timerOn: false,
            elapsed: 0,
            anchorMs: null,
          },
        },
      });
    }
  };

  const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const beginEditSession = (s: (typeof sessions)[0]) => {
    setEditingId(s.id);
    setEditChar(s.character_name);
    setEditMinutes(String(s.minutes));
    setEditTotal(String(s.total_value));
  };

  const saveSessionEdit = async () => {
    if (!editingId) return;
    setBusy(true);
    try {
      const mins = Math.max(0.01, parseFloat(editMinutes) || 0);
      const total = Math.max(0, Math.round(parseFloat(editTotal) || 0));
      await updateSession(editingId, {
        character_name: editChar.trim() || "Unknown",
        minutes: mins,
        total_value: total,
        silver_per_hour: Math.round(total / (mins / 60)),
      });
      setEditingId(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const beginEditLoot = (l: LootRow) => {
    setEditingLootId(l.id);
    setEditLootName(l.name);
    setEditLootKind(l.kind);
    setEditLootPrice(String(l.unit_price));
    setEditLootFile(null);
  };

  const saveLootEdit = async () => {
    if (!editingLootId || !selectedId) return;
    setBusy(true);
    setError(null);
    try {
      const existing = loots.find((x) => x.id === editingLootId);
      let icon_url = existing?.icon_url ?? null;
      if (editLootFile) icon_url = await uploadLootIcon(editLootFile);
      else if (!icon_url) icon_url = await findIconByLootName(editLootName.trim());
      await updateLoot(editingLootId, {
        name: editLootName.trim() || existing?.name || "Item",
        kind: editLootKind,
        unit_price: Math.max(0, Math.round(parseFloat(editLootPrice) || 0)),
        icon_url,
      });
      setEditingLootId(null);
      setLoots(await listLoots(selectedId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update loot failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="glass border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>
      )}

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <section className="glass p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-300/90">Spots</h2>
          <ul className="mb-2 flex max-h-[20rem] flex-col gap-1 overflow-y-auto">
            {spots.map((s) => (
              <li key={s.id}>
                {editingSpotId === s.id ? (
                  <div className="space-y-1.5 rounded-lg bg-white/5 p-2 ring-1 ring-cyan-400/30">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-sm" />
                    <div className="grid grid-cols-2 gap-1">
                      <button type="button" className={cn("h-7 rounded-lg text-[0.65rem] font-bold", editMode === "pve" ? "bg-cyan-400/20 text-cyan-300" : "text-muted-foreground")} onClick={() => { setEditMode("pve"); setEditMonsters(MONSTER_TYPES[0]); }}>PvE</button>
                      <button type="button" className={cn("h-7 rounded-lg text-[0.65rem] font-bold", editMode === "lifeskill" ? "bg-violet-400/20 text-violet-300" : "text-muted-foreground")} onClick={() => { setEditMode("lifeskill"); setEditMonsters(LIFESKILL_TYPES[0]); }}>Lifeskill</button>
                    </div>
                    <select className="field-select h-8 text-xs" value={editMonsters} onChange={(e) => setEditMonsters(e.target.value)}>{editTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}</select>
                    <select className="field-select h-8 text-xs" value={editTerritory} onChange={(e) => setEditTerritory(e.target.value)}>{TERRITORIES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
                    <label className="flex h-8 cursor-pointer items-center gap-1 rounded-md border border-dashed border-white/15 px-2 text-[10px] text-muted-foreground">
                      <Upload className="size-3" /> Icon
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setEditSpotFile(e.target.files?.[0] ?? null)} />
                    </label>
                    <div className="flex gap-1">
                      <button type="button" disabled={busy} onClick={() => void saveSpotEdit()} className="flex-1 rounded-md bg-emerald-500/20 py-1 text-xs text-emerald-200 ring-1 ring-emerald-400/40">Save</button>
                      <button type="button" onClick={() => setEditingSpotId(null)} className="rounded-md px-2 text-xs text-muted-foreground">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition",
                      selectedId === s.id ? "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/40" : "hover:bg-white/5",
                    )}
                  >
                    {s.icon_url ? <img src={s.icon_url} alt="" className="size-6 shrink-0 rounded object-contain" /> : <span className="flex size-6 shrink-0 items-center justify-center rounded bg-white/5 text-[10px]">?</span>}
                    <span className="min-w-0 flex-1 truncate">{s.name}</span>
                    <span role="button" tabIndex={0} className="text-muted-foreground hover:text-cyan-300" onClick={(e) => { e.stopPropagation(); beginEditSpot(s); }}>
                      <Pencil className="size-3.5" />
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="text-muted-foreground hover:text-rose-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        void (async () => {
                          await deleteSpot(s.id);
                          if (selectedId === s.id) setSelectedId(null);
                          await refresh();
                        })();
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </span>
                  </button>
                )}
              </li>
            ))}
          </ul>

          {addingSpot ? (
            <div className="space-y-1.5 rounded-lg bg-white/5 p-2 ring-1 ring-violet-400/30">
              <Input placeholder="Spot name" value={spotName} onChange={(e) => setSpotName(e.target.value)} className="h-8 text-sm" />
              <div className="grid grid-cols-2 gap-1">
                <button type="button" className={cn("h-7 rounded-lg text-[0.65rem] font-bold", mode === "pve" ? "bg-cyan-400/20 text-cyan-300" : "text-muted-foreground")} onClick={() => { setMode("pve"); setMonsters(MONSTER_TYPES[0]); }}>PvE</button>
                <button type="button" className={cn("h-7 rounded-lg text-[0.65rem] font-bold", mode === "lifeskill" ? "bg-violet-400/20 text-violet-300" : "text-muted-foreground")} onClick={() => { setMode("lifeskill"); setMonsters(LIFESKILL_TYPES[0]); }}>Lifeskill</button>
              </div>
              <select className="field-select h-8 text-xs" value={monsters} onChange={(e) => setMonsters(e.target.value)}>{typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}</select>
              <select className="field-select h-8 text-xs" value={territory} onChange={(e) => setTerritory(e.target.value)}>{TERRITORIES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
              <label className="flex h-8 cursor-pointer items-center gap-1 rounded-md border border-dashed border-white/15 px-2 text-[10px] text-muted-foreground">
                <Upload className="size-3" /> Icon
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setSpotFile(e.target.files?.[0] ?? null)} />
              </label>
              <div className="flex gap-1">
                <button type="button" disabled={busy || !spotName.trim()} onClick={() => void onCreateSpot()} className="flex-1 rounded-md bg-cyan-500/20 py-1 text-xs text-cyan-100 ring-1 ring-cyan-400/40">Add</button>
                <button type="button" onClick={() => setAddingSpot(false)} className="rounded-md px-2 text-xs text-muted-foreground">Cancel</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setAddingSpot(true)} className="flex w-full items-center justify-center gap-1 rounded-md bg-white/5 py-1.5 text-xs text-muted-foreground hover:bg-white/10">
              <Plus className="size-3.5" /> Add spot
            </button>
          )}
        </section>

        <div className="space-y-4">
          {selected ? (
            <>
              <section className="glass-strong p-3">
                <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                  <div className="flex items-baseline gap-2">
                    <Timer className="size-4 shrink-0 translate-y-[-1px] text-cyan-400" />
                    <span className={cn("font-mono text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl", timerOn ? "neon-text text-cyan-100" : "text-cyan-100")}>
                      {hh}:{mm}:{ss}
                    </span>
                  </div>
                  <div className="ml-auto flex flex-wrap items-baseline gap-x-6 gap-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">Total</span>
                      <span className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-cyan-200 sm:text-3xl">{formatSilver(sessionTotals.total)}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">/h</span>
                      <span className="font-mono text-2xl font-semibold tabular-nums tracking-tight neon-emerald text-emerald-300 sm:text-3xl">{formatSilver(sessionTotals.sph)}</span>
                    </div>
                    {avgSph > 0 && (
                      <span className="text-[0.65rem] tabular-nums text-muted-foreground">avg {formatSilver(avgSph)}/h</span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <button type="button" onClick={toggleTimer} className={cn("rounded-md px-2.5 py-1 text-xs ring-1", timerOn ? "bg-amber-500/20 text-amber-200 ring-amber-400/40" : "bg-emerald-500/20 text-emerald-200 ring-emerald-400/40")}>
                    {timerOn ? "Pause" : "Start"}
                  </button>
                  <button type="button" onClick={resetTimer} className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-muted-foreground hover:bg-white/10">Reset</button>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-white/10 pt-3">
                  <div className="min-w-[120px] flex-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Character</Label>
                    <Input value={character} onChange={(e) => setCharacter(e.target.value)} placeholder="Name" className="h-8 text-sm" />
                  </div>
                  <div className="w-24">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Minutes</Label>
                    <Input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} disabled={timerOn} className="h-8 text-sm" />
                  </div>
                  <button type="button" disabled={busy || sessionTotals.mins <= 0} onClick={() => void onSaveSession()} className="h-8 rounded-md bg-emerald-500/20 px-3 text-xs text-emerald-100 ring-1 ring-emerald-400/40 hover:bg-emerald-500/30 disabled:opacity-50">
                    Save session
                  </button>
                </div>
              </section>

              <section className="glass p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300/90">Loot — {selected.name}</h2>
                  {!addingLoot && (
                    <button type="button" onClick={() => setAddingLoot(true)} className="flex items-center gap-1 rounded-md bg-cyan-500/15 px-2 py-1 text-[10px] text-cyan-200 ring-1 ring-cyan-400/30">
                      <Plus className="size-3" /> Item
                    </button>
                  )}
                </div>

                {addingLoot && (
                  <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
                    <Input placeholder="Name" value={lootName} onChange={(e) => setLootName(e.target.value)} className="h-8 text-sm lg:col-span-2" />
                    <select className="field-select h-8 text-xs" value={lootKind} onChange={(e) => setLootKind(e.target.value as "market" | "npc")}>
                      <option value="market">Market</option>
                      <option value="npc">NPC</option>
                    </select>
                    <Input placeholder="Unit price" type="number" value={lootPrice} onChange={(e) => setLootPrice(e.target.value)} className="h-8 text-sm" />
                    <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-white/15 px-2 text-xs text-muted-foreground hover:border-cyan-400/40">
                      <Upload className="size-3.5" />
                      {lootFile ? lootFile.name.slice(0, 10) : "Icon"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setLootFile(e.target.files?.[0] ?? null)} />
                    </label>
                    <div className="flex gap-1">
                      <button type="button" disabled={busy || !lootName.trim()} onClick={() => void onCreateLoot()} className="flex flex-1 items-center justify-center gap-1 rounded-md bg-cyan-500/20 text-xs text-cyan-100 ring-1 ring-cyan-400/40 disabled:opacity-50">
                        <Plus className="size-3.5" /> Add
                      </button>
                      <button type="button" onClick={() => setAddingLoot(false)} className="rounded-md px-2 text-xs text-muted-foreground"><X className="size-3.5" /></button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <th className="pb-1.5 pr-2 font-medium">Item</th>
                        <th className="pb-1.5 pr-2 font-medium">Kind</th>
                        <th className="pb-1.5 pr-2 font-medium">Price</th>
                        <th className="pb-1.5 pr-2 font-medium">Qty</th>
                        <th className="pb-1.5 pr-2 font-medium">Line</th>
                        <th className="pb-1.5 pr-2 font-medium min-w-[5.5rem]">/h</th>
                        <th className="pb-1.5 w-16 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {loots.map((l) => {
                        const q = parseFloat(qty[l.id] || "0") || 0;
                        const line = q * Number(l.unit_price);
                        const perH = sessionTotals.mins > 0 ? line / (sessionTotals.mins / 60) : 0;
                        return (
                          <tr key={l.id} className="border-b border-white/5">
                            {editingLootId === l.id ? (
                              <td className="py-1.5" colSpan={7}>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {l.icon_url && <img src={l.icon_url} alt="" className="size-6 rounded object-contain" />}
                                  <Input value={editLootName} onChange={(e) => setEditLootName(e.target.value)} className="h-7 w-28 text-xs" />
                                  <select className="field-select h-7 text-xs" value={editLootKind} onChange={(e) => setEditLootKind(e.target.value as "market" | "npc")}>
                                    <option value="market">Market</option>
                                    <option value="npc">NPC</option>
                                  </select>
                                  <Input type="number" value={editLootPrice} onChange={(e) => setEditLootPrice(e.target.value)} className="h-7 w-24 text-xs" />
                                  <label className="flex h-7 cursor-pointer items-center gap-1 rounded border border-dashed border-white/15 px-1.5 text-[10px] text-muted-foreground">
                                    <Upload className="size-3" />
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setEditLootFile(e.target.files?.[0] ?? null)} />
                                  </label>
                                  <button type="button" onClick={() => void saveLootEdit()} className="h-7 rounded bg-emerald-500/20 px-2 text-xs text-emerald-200 ring-1 ring-emerald-400/40">Save</button>
                                  <button type="button" onClick={() => setEditingLootId(null)} className="h-7 rounded px-1.5 text-muted-foreground"><X className="size-3.5" /></button>
                                </div>
                              </td>
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
                                <td className="py-1.5 pr-2 text-xs text-muted-foreground">{l.kind}</td>
                                <td className="py-1.5 pr-2 font-mono text-xs tabular-nums">{formatSilver(l.unit_price)}</td>
                                <td className="py-1.5 pr-2">
                                  <Input
                                    type="number"
                                    value={qty[l.id] ?? ""}
                                    onChange={(e) => setQty((prev) => ({ ...prev, [l.id]: e.target.value }))}
                                    placeholder="0"
                                    className="h-7 w-20 text-xs"
                                  />
                                </td>
                                <td className="py-1.5 pr-2 font-mono text-xs tabular-nums text-cyan-200/90">{formatSilver(line)}</td>
                                <td className="py-1.5 pr-2 font-mono text-xs tabular-nums text-emerald-300/90 min-w-[5.5rem]">{formatSilver(perH)}</td>
                                <td className="py-1.5">
                                  <div className="flex gap-1">
                                    <button type="button" className="text-muted-foreground hover:text-cyan-300" onClick={() => beginEditLoot(l)}><Pencil className="size-3.5" /></button>
                                    <button type="button" className="text-muted-foreground hover:text-rose-400" onClick={() => void (async () => { await deleteLoot(l.id); setLoots(await listLoots(selectedId!)); })()}><Trash2 className="size-3.5" /></button>
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

              <section className="glass p-3">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-300/90">Sessions @ {selected.name}</h2>
                {spotSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sessions yet.</p>
                ) : (
                  <ul className="max-h-[28vh] space-y-1.5 overflow-y-auto">
                    {spotSessions.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-2 rounded-md bg-white/[0.03] px-2 py-1.5 text-sm">
                        {editingId === s.id ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Input value={editChar} onChange={(e) => setEditChar(e.target.value)} className="h-7 w-28 text-xs" />
                            <Input type="number" value={editMinutes} onChange={(e) => setEditMinutes(e.target.value)} className="h-7 w-20 text-xs" />
                            <Input type="number" value={editTotal} onChange={(e) => setEditTotal(e.target.value)} className="h-7 w-28 text-xs" />
                            <button type="button" onClick={() => void saveSessionEdit()} className="h-7 rounded bg-emerald-500/20 px-2 text-xs text-emerald-200">Save</button>
                            <button type="button" onClick={() => setEditingId(null)} className="h-7 px-1 text-muted-foreground"><X className="size-3.5" /></button>
                          </div>
                        ) : (
                          <>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-2">
                                <span className="font-medium">{s.character_name}</span>
                                <span className="text-xs text-muted-foreground">{s.minutes} min</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatSilver(s.total_value)} · {formatSilver(s.silver_per_hour)}/h
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button type="button" className="text-muted-foreground hover:text-cyan-300" onClick={() => beginEditSession(s)}><Pencil className="size-3.5" /></button>
                              <button type="button" className="text-muted-foreground hover:text-rose-400" onClick={() => void (async () => { await deleteSession(s.id); await refresh(); })()}><Trash2 className="size-3.5" /></button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : (
            <div className="glass p-8 text-center text-sm text-muted-foreground">
              Select or create a grind spot to start tracking.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
