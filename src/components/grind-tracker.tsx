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

  // REST_OF_FILE_IN_NEXT_CALL - THIS WILL FAIL IF INCOMPLETE
  return null;
}
