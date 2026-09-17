import { useEffect, useMemo, useRef, useState } from "react";
import {
  createLoot,
  createSession,
  createSpot,
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
import {
  normalizeRarity,
  sortLootsByRarity,
} from "@/components/grind-loot-meta";
import type { SpotMode } from "@/data/grind-meta";
import { downloadSessionReportPng } from "@/lib/session-report";
import { fetchMarketPriceByName } from "@/lib/arsha-market";
import {
  CHRONO_KEY,
  emptyDraft,
  formatElapsed,
  type ChronoStore,
} from "@/lib/grind-chrono";
import { useCloudStorage } from "@/lib/user-sync";
import { effectiveUnitSilver, formatSilverCompact } from "@/lib/utils";

let grindCache: { spots: SpotRow[]; sessions: SessionRow[] } | null = null;

const formatSilver = formatSilverCompact;

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

export function useGrindController() {
  const [spots, setSpots] = useState<SpotRow[]>(() => grindCache?.spots ?? []);
  const [loots, setLoots] = useState<LootRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>(() => grindCache?.sessions ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => grindCache == null);
  const [busy, setBusy] = useState(false);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
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
  const [agris, setAgris] = useState("off");
  const [showCharacter, setShowCharacter] = useState(true);
  const [showDropRate, setShowDropRate] = useState(true);
  const [showAgris, setShowAgris] = useState(true);
  const [showMinutes, setShowMinutes] = useState(true);
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
  setLoading(true);
  (async () => {
    try {
      const [sp, se] = await Promise.all([listSpots(), listSessions()]);
      if (cancelled) return;
      
      grindCache = { spots: sp, sessions: se };
      setSpots(sp);
      setSessions(se);
    } catch (e) {
      if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      // Always clear spinner for this mount (Strict Mode cancel must not leave a stuck true).
      setLoading(false);
    }
  })();
  return () => {
    cancelled = true;
  };
}, []);

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
    setAgris(
      draft.agris === "on" || Number(draft.agris) > 0 ? "on" : "off",
    );
    setShowCharacter(draft.showCharacter ?? true);
    setShowDropRate(draft.showDropRate ?? true);
    setShowAgris(draft.showAgris ?? true);
    setShowMinutes(draft.showMinutes ?? true);
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
          agris,
          showCharacter,
          showDropRate,
          showAgris,
          showMinutes,
          running: timerOn,
          startedAt: timerStart.current,
          accumulatedMs: accumulated.current,
        },
      },
    }));
    }, [selectedId, qty, character, dropRate, minutes, agris, showCharacter, showDropRate, showAgris, showMinutes, timerOn, elapsed, chronoHydrated, setChronoStore]);

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

    const onFetchMarketPrice = async () => {
    if (!lootName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const hit = await fetchMarketPriceByName(lootName.trim());
      if (hit) setLootPrice(String(hit.basePrice));
      else setError("No market match for that name");
    } catch {
      setError("Market fetch failed");
    } finally {
      setBusy(false);
    }
  };
    const onRefreshMarketPrices = async () => {
    if (!loots.length) return;
    setBusy(true);
    setRefreshingPrices(true);
    setError(null);
    try {
      const next = [...loots];
      for (let i = 0; i < next.length; i++) {
        const l = next[i];
        if (l.kind !== "market") continue;
        try {
          const hit = await fetchMarketPriceByName(l.name);
          if (!hit) continue;
          const row = await updateLoot(l.id, { unit_price: hit.basePrice });
          next[i] = row;
        } catch {
          /* skip this item */
        }
      }
      setLoots(sortLootsByRarity(next));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh market prices failed");
    } finally {
      setBusy(false);
      setRefreshingPrices(false);
    }
  };
  const onCreateLoot = async () => {
    if (!selectedId || !lootName.trim()) return;
    setBusy(true);
    try {
      const name = lootName.trim();
      const defaults = await findLootDefaultsByName(name);
      const icon = lootIconUrl || defaults?.icon_url || null;
      const priceParsed = parseFloat(lootPrice);
      let unit_price =
        lootPrice.trim() !== "" && Number.isFinite(priceParsed)
          ? priceParsed
          : defaults?.unit_price != null
            ? Number(defaults.unit_price)
            : 0;
      const kind = defaults?.kind ?? lootKind;
      let market_item_id: number | null = null;

      if (kind === "market" && unit_price <= 0) {
        try {
          const hit = await fetchMarketPriceByName(name);
          if (hit) {
            unit_price = hit.basePrice;
            market_item_id = hit.id;
          }
        } catch {
          /* keep 0 — user can type manually */
        }
      }

      const rarity = defaults?.rarity ?? lootRarity;
      const row = await createLoot({
        spot_id: selectedId,
        name,
        kind,
        unit_price,
        icon_url: icon,
        rarity,
        market_item_id,
      });
      setLoots((p) => sortLootsByRarity([...p, row]));
      setLootName("");
      setLootPrice("");
      setLootRarity("common");
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
    setEditLootRarity(normalizeRarity(l.rarity));
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
        rarity: editLootRarity,
      });
      setLoots((p) => sortLootsByRarity(p.map((x) => (x.id === row.id ? row : x))));
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
      const metaByLootId: Record<
        string,
        { kind?: "market" | "npc"; rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary" | null }
      > = {};
      const metaByName: Record<
        string,
        { kind?: "market" | "npc"; rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary" | null }
      > = {};
      for (const l of loots) {
        if (l.id) {
          iconByLootId[l.id] = l.icon_url;
          metaByLootId[l.id] = { kind: l.kind, rarity: l.rarity };
        }
        if (l.name) {
          metaByName[l.name.trim().toLowerCase()] = { kind: l.kind, rarity: l.rarity };
        }
      }
      for (const line of lines) {
        if (line.loot_id && !iconByLootId[line.loot_id]) {
          const match = loots.find((x) => x.name === line.loot_name);
          if (match?.icon_url) iconByLootId[line.loot_id] = match.icon_url;
          if (match) metaByLootId[line.loot_id] = { kind: match.kind, rarity: match.rarity };
        }
      }
            await downloadSessionReportPng({
        session: s,
        spot,
        lines,
        iconByLootId,
        metaByLootId,
        metaByName,
        showCharacter,
        showDropRate,
        showAgris,
        showMinutes,
        agris: agris === "on" ? 1 : 0,
      });
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
        agris: agris === "on" ? 1 : 0,
        started_at: timerStart.current
          ? new Date(timerStart.current).toISOString()
          : elapsed > 0
            ? new Date(Date.now() - elapsed).toISOString()
            : null,
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

  return {
    loading,
    error,
    setError,
    busy,
    refreshingPrices,
    sharingId,
    importOpen,
    setImportOpen,
    spots,
    setSpots,
    loots,
    setLoots,
    sessions,
    setSessions,
    selectedId,
    setSelectedId,
    spotQuery,
    setSpotQuery,
    regionFilter,
    setRegionFilter,
    regions,
    spotsByRegion,
    qty,
    setQty,
    character,
    setCharacter,
    dropRate,
    setDropRate,
    minutes,
    setMinutes,
    agris,
    setAgris,
    showCharacter,
    setShowCharacter,
    showDropRate,
    setShowDropRate,
    showAgris,
    setShowAgris,
    showMinutes,
    setShowMinutes,
    timerOn,
    elapsed,
    hh,
    mm,
    ss,
    sessionTotals,
    spotSessions,
    avgSph,
    toggleTimer,
    resetTimer,
    spotName,
    setSpotName,
    spotMonsters,
    setSpotMonsters,
    spotTerritory,
    setSpotTerritory,
    spotIconUrl,
    setSpotIconUrl,
    spotMode,
    setSpotMode,
    addingSpot,
    setAddingSpot,
    editingSpot,
    setEditingSpot,
    addingLoot,
    setAddingLoot,
    lootName,
    setLootName,
    lootKind,
    setLootKind,
    lootRarity,
    setLootRarity,
    lootPrice,
    setLootPrice,
    lootIconUrl,
    setLootIconUrl,
    editingLootId,
    setEditingLootId,
    editLootName,
    setEditLootName,
    editLootKind,
    setEditLootKind,
    editLootRarity,
    setEditLootRarity,
    editLootPrice,
    setEditLootPrice,
    editLootIconUrl,
    setEditLootIconUrl,
    onCreateSpot,
    beginEditSpot,
    onSaveSpot,
    onCreateLoot,
    onFetchMarketPrice,
    onRefreshMarketPrices,
    beginEditLoot,
    saveLootEdit,
    onShareSession,
    onSaveSession,
    pickIconFile,
    formatSilver,
  };
}
