import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createLoot,
  createSession,
  createSpot,
  deleteLoot,
  deleteSession,
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
  CHRONO_KEY_LEGACY,
  bumpQty,
  emptyDraft,
  emptyStore,
  formatElapsed,
  migrateLegacyStore,
  setQtyValue,
  type PullDraft,
  type PullStore,
} from "@/lib/grind-chrono";
import {
  computeSpotStats,
  pullInsight,
  silverPerHour,
  sortBoardLoots,
  sumPullValue,
  topContributors,
  valueLines,
} from "@/lib/grind-metrics";
import { useCloudStorage } from "@/lib/user-sync";
import { formatSilverCompact } from "@/lib/utils";
import { readStorage } from "@/lib/storage";

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

function initialPullStore(): PullStore {
  const legacy = readStorage<unknown>(CHRONO_KEY_LEGACY, null);
  const migrated = migrateLegacyStore(legacy);
  if (migrated) return migrated;
  return emptyStore();
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
  const [undoUntil, setUndoUntil] = useState<number | null>(null);
  const [lastEndedSummary, setLastEndedSummary] = useState<string | null>(null);
  const undoSessionRef = useRef<SessionRow | null>(null);

  const {
    value: pullStore,
    setValue: setPullStore,
    hydrated: pullHydrated,
  } = useCloudStorage<PullStore>(CHRONO_KEY, initialPullStore());

  const [spotQuery, setSpotQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [archiveOpen, setArchiveOpen] = useState(false);

  // Live pull fields (synced into pullStore.bySpot)
  const [qty, setQty] = useState<Record<string, number>>({});
  const [pilot, setPilot] = useState("");
  const [dropRate, setDropRate] = useState("");
  const [minutes, setMinutes] = useState("");
  const [agris, setAgris] = useState(false);
  const [hotkeys, setHotkeys] = useState<Record<string, string>>({});
  const [timerOn, setTimerOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerStart = useRef<number | null>(null);
  const accumulated = useRef(0);
  const pulseRef = useRef<{ t: number; sph: number }[]>([]);

  // Spot / loot forms
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
  const [bindHotkeyLootId, setBindHotkeyLootId] = useState<string | null>(null);

  // Bootstrap spots + sessions
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sp, sess] = await Promise.all([listSpots(), listSessions(80)]);
        if (cancelled) return;
        setSpots(sp);
        setSessions(sess);
        grindCache = { spots: sp, sessions: sess };
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load grind data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Resume last spot once hydrated
  useEffect(() => {
    if (!pullHydrated || selectedId || !spots.length) return;
    const last = pullStore.lastSpotId;
    if (last && spots.some((s) => s.id === last)) {
      setSelectedId(last);
    }
  }, [pullHydrated, pullStore.lastSpotId, spots, selectedId]);

  // Load loots + draft when spot changes
  useEffect(() => {
    if (!selectedId || !pullHydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const ls = await listLoots(selectedId);
        if (!cancelled) setLoots(sortLootsByRarity(ls));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load loots");
      }
    })();
    const draft: PullDraft = pullStore.bySpot[selectedId] ?? emptyDraft();
    setQty(draft.qty ?? {});
    const pilotName = draft.pilot || pullStore.lastPilot || "";
    setPilot(pilotName);
    setDropRate(draft.dropRate ?? "");
    setMinutes(draft.minutes ?? "");
    setAgris(Boolean(draft.agris));
    setHotkeys(draft.hotkeys ?? {});
    pulseRef.current = draft.pulse ?? [];
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, pullHydrated]);

  // Persist draft
  useEffect(() => {
    if (!selectedId || !pullHydrated) return;
    setPullStore((prev) => {
      const pilots = new Set(prev.pilots);
      if (pilot.trim()) pilots.add(pilot.trim());
      return {
        ...prev,
        lastSpotId: selectedId,
        lastPilot: pilot.trim() || prev.lastPilot,
        pilots: Array.from(pilots),
        bySpot: {
          ...prev.bySpot,
          [selectedId]: {
            qty,
            pilot,
            dropRate,
            minutes,
            agris,
            hotkeys,
            favoriteLootIds: prev.bySpot[selectedId]?.favoriteLootIds ?? [],
            running: timerOn,
            startedAt: timerStart.current,
            accumulatedMs: accumulated.current,
            pulse: pulseRef.current.slice(-48),
          },
        },
      };
    });
  }, [
    selectedId,
    qty,
    pilot,
    dropRate,
    minutes,
    agris,
    hotkeys,
    timerOn,
    elapsed,
    pullHydrated,
    setPullStore,
  ]);

  // Timer tick + pulse samples
  useEffect(() => {
    if (!timerOn) return;
    const id = window.setInterval(() => {
      if (timerStart.current != null) {
        const ms = Date.now() - timerStart.current + accumulated.current;
        setElapsed(ms);
        const mins = ms / 60_000;
        const lines = valueLines(loots, qty);
        const { total } = sumPullValue(lines);
        const sph = silverPerHour(total, mins);
        const last = pulseRef.current[pulseRef.current.length - 1];
        if (!last || Date.now() - last.t > 20_000) {
          pulseRef.current = [...pulseRef.current.slice(-47), { t: Date.now(), sph }];
        }
      }
    }, 250);
    return () => clearInterval(id);
  }, [timerOn, loots, qty]);

  // Global hotkeys 1-9 while not typing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedId) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (bindHotkeyLootId) {
        if (/^[1-9]$/.test(e.key)) {
          e.preventDefault();
          setHotkeys((prev) => {
            const next = { ...prev };
            for (const [id, k] of Object.entries(next)) {
              if (k === e.key) delete next[id];
            }
            next[bindHotkeyLootId] = e.key;
            return next;
          });
          setBindHotkeyLootId(null);
        }
        return;
      }
      if (!/^[1-9]$/.test(e.key)) return;
      const lootId = Object.entries(hotkeys).find(([, k]) => k === e.key)?.[0];
      if (!lootId) return;
      e.preventDefault();
      setQty((q) => bumpQty(q, lootId, e.shiftKey ? 10 : 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, hotkeys, bindHotkeyLootId]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const s of spots) set.add((s.territory || "").trim() || "Unspecified");
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

  const favoriteSet = useMemo(
    () => new Set(pullStore.favoriteSpotIds ?? []),
    [pullStore.favoriteSpotIds],
  );

  const orderedSpots = useMemo(() => {
    const fav = filteredSpots.filter((s) => favoriteSet.has(s.id));
    const rest = filteredSpots.filter((s) => !favoriteSet.has(s.id));
    const recentIds = sessions
      .map((s) => s.spot_id)
      .filter((id, i, a) => a.indexOf(id) === i)
      .slice(0, 5);
    rest.sort((a, b) => {
      const ra = recentIds.indexOf(a.id);
      const rb = recentIds.indexOf(b.id);
      if (ra !== -1 || rb !== -1) {
        if (ra === -1) return 1;
        if (rb === -1) return -1;
        return ra - rb;
      }
      return a.name.localeCompare(b.name);
    });
    return [...fav, ...rest];
  }, [filteredSpots, favoriteSet, sessions]);

  const spotsByRegion = useMemo(() => {
    const map = new Map<string, SpotRow[]>();
    for (const s of orderedSpots) {
      const key = (s.territory || "").trim() || "Unspecified";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [orderedSpots]);

  const { hh, mm, ss, mins: timerMins } = formatElapsed(elapsed);
  const manualMins = parseFloat(minutes) || 0;
  const effectiveMins = timerOn || elapsed > 0 ? timerMins : manualMins;

  const lines = useMemo(() => valueLines(loots, qty), [loots, qty]);
  const { total, trash, rare } = useMemo(() => sumPullValue(lines), [lines]);
  const liveSph = useMemo(() => silverPerHour(total, effectiveMins), [total, effectiveMins]);

  const spotSessions = useMemo(
    () => (selectedId ? sessions.filter((s) => s.spot_id === selectedId) : []),
    [sessions, selectedId],
  );
  const spotStats = useMemo(() => computeSpotStats(spotSessions), [spotSessions]);
  const insight = useMemo(
    () =>
      pullInsight({
        liveSph,
        stats: spotStats,
        trash,
        rare,
        total,
        minutes: effectiveMins,
      }),
    [liveSph, spotStats, trash, rare, total, effectiveMins],
  );
  const boardLoots = useMemo(() => sortBoardLoots(loots, qty), [loots, qty]);
  const contributors = useMemo(() => topContributors(lines, 3), [lines]);
  const pulse = pulseRef.current;

  const suggested = useMemo(() => {
    if (!spots.length || !sessions.length) return null;
    const bySpot = new Map<string, SessionRow[]>();
    for (const s of sessions) {
      if (!bySpot.has(s.spot_id)) bySpot.set(s.spot_id, []);
      bySpot.get(s.spot_id)!.push(s);
    }
    let best: { spot: SpotRow; stats: ReturnType<typeof computeSpotStats> } | null = null;
    for (const spot of spots) {
      if (!favoriteSet.has(spot.id) && bySpot.get(spot.id)?.length) {
        /* allow non-fav if enough data */
      }
      const st = computeSpotStats(bySpot.get(spot.id) ?? []);
      if (st.count < 2) continue;
      if (!best || st.medianSph > best.stats.medianSph) best = { spot, stats: st };
    }
    // Prefer favorites when close
    for (const id of favoriteSet) {
      const spot = spots.find((s) => s.id === id);
      if (!spot) continue;
      const st = computeSpotStats(bySpot.get(id) ?? []);
      if (st.count < 1) continue;
      if (!best || st.medianSph >= best.stats.medianSph * 0.92) best = { spot, stats: st };
    }
    return best;
  }, [spots, sessions, favoriteSet]);

  const armSuggested = () => {
    if (!suggested) return;
    setSelectedId(suggested.spot.id);
  };

  const toggleFavoriteSpot = (id: string) => {
    setPullStore((prev) => {
      const set = new Set(prev.favoriteSpotIds ?? []);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...prev, favoriteSpotIds: Array.from(set) };
    });
  };

  const addQty = (lootId: string, delta: number) => {
    setQty((q) => bumpQty(q, lootId, delta));
  };

  const writeQty = (lootId: string, value: number) => {
    setQty((q) => setQtyValue(q, lootId, value));
  };

  const clearQty = () => setQty({});

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
    pulseRef.current = [];
  };

  const armPull = () => {
    if (!timerOn) {
      timerStart.current = Date.now();
      setTimerOn(true);
    }
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
      setError(e instanceof Error ? e.message : "Create spot failed");
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
          /* skip */
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
          /* keep 0 */
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
      const linesDb = await listSessionLoots(s.id);
      const spot = spots.find((x) => x.id === s.spot_id) ?? null;
      const iconByLootId: Record<string, string> = {};
      const metaByLootId: Record<
        string,
        { kind: "market" | "npc"; rarity: ReturnType<typeof normalizeRarity> }
      > = {};
      for (const l of loots) {
        if (l.icon_url) iconByLootId[l.id] = l.icon_url;
        metaByLootId[l.id] = { kind: l.kind, rarity: normalizeRarity(l.rarity) };
      }
      await downloadSessionReportPng({
        session: s,
        spot,
        lines: linesDb,
        iconByLootId,
        metaByLootId,
        showCharacter: true,
        showDropRate: true,
        showAgris: true,
        showMinutes: true,
        agris: s.agris != null ? Number(s.agris) : null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Share report failed");
    } finally {
      setSharingId(null);
    }
  };

  const endPull = async () => {
    if (!selectedId || total <= 0) return;
    if (timerOn) {
      if (timerStart.current != null) {
        accumulated.current += Date.now() - timerStart.current;
      }
      timerStart.current = null;
      setTimerOn(false);
      setElapsed(accumulated.current);
    }
    setBusy(true);
    setError(null);
    try {
      const mins = Math.max(1, Math.round(effectiveMins || manualMins || 1));
      const sph = silverPerHour(total, mins);
      const drParsed = parseFloat(dropRate);
      const saved = await createSession({
        spot_id: selectedId,
        character_name: pilot.trim() || "Unknown",
        minutes: mins,
        total_value: total,
        silver_per_hour: sph,
        drop_rate: Number.isFinite(drParsed) ? drParsed : null,
        agris: agris ? 1 : 0,
        started_at:
          elapsed > 0 ? new Date(Date.now() - elapsed).toISOString() : null,
        lines: lines
          .filter((l) => l.qty > 0)
          .map((l) => ({
            loot_id: l.loot.id,
            loot_name: l.loot.name,
            unit_price: Number(l.loot.unit_price),
            quantity: l.qty,
            line_value: l.lineValue,
          })),
      });
      setSessions((prev) => [saved, ...prev.filter((x) => x.id !== saved.id)]);
      undoSessionRef.current = saved;
      setUndoUntil(Date.now() + 15_000);
      setLastEndedSummary(
        `${formatSilver(total)} · ${formatSilver(sph)}/h · ${mins}m`,
      );
      setQty({});
      accumulated.current = 0;
      setElapsed(0);
      pulseRef.current = [];
      timerStart.current = null;
      setTimerOn(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "End pull failed");
    } finally {
      setBusy(false);
    }
  };

  const undoEndPull = async () => {
    const s = undoSessionRef.current;
    if (!s) return;
    try {
      await deleteSession(s.id);
      setSessions((p) => p.filter((x) => x.id !== s.id));
      setUndoUntil(null);
      undoSessionRef.current = null;
      setLastEndedSummary(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Undo failed");
    }
  };

  useEffect(() => {
    if (!undoUntil) return;
    const t = window.setTimeout(() => {
      setUndoUntil(null);
      undoSessionRef.current = null;
    }, Math.max(0, undoUntil - Date.now()));
    return () => clearTimeout(t);
  }, [undoUntil]);

  const applyImportQty = (next: Record<string, string>) => {
    const q: Record<string, number> = {};
    for (const [id, v] of Object.entries(next)) {
      const n = Number(v);
      if (n > 0) q[id] = n;
    }
    setQty(q);
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
    orderedSpots,
    favoriteSet,
    toggleFavoriteSpot,
    qty,
    addQty,
    writeQty,
    clearQty,
    pilot,
    setPilot,
    pilots: pullStore.pilots ?? [],
    dropRate,
    setDropRate,
    minutes,
    setMinutes,
    agris,
    setAgris,
    hotkeys,
    setBindHotkeyLootId,
    bindHotkeyLootId,
    timerOn,
    elapsed,
    hh,
    mm,
    ss,
    total,
    trash,
    rare,
    liveSph,
    effectiveMins,
    spotStats,
    insight,
    boardLoots,
    contributors,
    pulse,
    lines,
    suggested,
    armSuggested,
    archiveOpen,
    setArchiveOpen,
    undoUntil,
    lastEndedSummary,
    undoEndPull,
    armPull,
    toggleTimer,
    resetTimer,
    endPull,
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
    applyImportQty,
    pickIconFile,
    formatSilver,
    deleteLoot,
    deleteSession,
  };
}
