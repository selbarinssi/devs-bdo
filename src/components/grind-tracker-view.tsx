import {
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Search,
  Share2,
  Star,
  Trash2,
  X,
  Zap,
  Square,
  Play,
  RotateCcw,
  Keyboard,
} from "lucide-react";
import { InventoryScreenshotImport } from "@/components/inventory-screenshot-import";
import { Input } from "@/components/ui/input";
import {
  LootMetaTags,
  RARITY_LABEL,
  RARITY_ORDER,
} from "@/components/grind-loot-meta";
import { LIFESKILL_TYPES, MONSTER_TYPES, TERRITORIES } from "@/data/grind-meta";
import type { SpotRow } from "@/lib/supabase";
import { cn, effectiveUnitSilver } from "@/lib/utils";
import { useGrindController } from "@/components/use-grind-controller";
import { isTrashLoot } from "@/lib/grind-metrics";

type G = ReturnType<typeof useGrindController>;

function PulseSpark({ pulse }: { pulse: { t: number; sph: number }[] }) {
  if (pulse.length < 2) {
    return (
      <div className="h-10 rounded-lg bg-white/[0.03] ring-1 ring-white/5 flex items-center justify-center">
        <span className="hub-tiny text-muted-foreground">Pulse builds as you pull…</span>
      </div>
    );
  }
  const vals = pulse.map((p) => p.sph);
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals, 0);
  const span = Math.max(max - min, 1);
  const w = 240;
  const h = 40;
  const pts = pulse
    .map((p, i) => {
      const x = (i / (pulse.length - 1)) * w;
      const y = h - ((p.sph - min) / span) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-full overflow-visible" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="rgba(34,211,238,0.85)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts}
      />
    </svg>
  );
}

export function GrindTrackerView(g: G & { selectedSpot: SpotRow | undefined }) {
  const {
    error,
    setError,
    busy,
    sharingId,
    importOpen,
    setImportOpen,
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
    favoriteSet,
    toggleFavoriteSpot,
    qty,
    addQty,
    writeQty,
    clearQty,
    pilot,
    setPilot,
    pilots,
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
    loots,
    refreshingPrices,
    selectedSpot,
  } = g;

  const vsMedian =
    spotStats.medianSph > 0 && liveSph > 0
      ? ((liveSph - spotStats.medianSph) / spotStats.medianSph) * 100
      : null;

  const trashShare = total > 0 ? (trash / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-4 pb-8">
      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
          <button type="button" className="ml-2 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </p>
      )}

      {undoUntil && lastEndedSummary && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-100">
          <span>
            Pull closed · <strong className="font-mono">{lastEndedSummary}</strong>
          </span>
          <button type="button" className="btn-ghost h-8 text-xs" onClick={() => void undoEndPull()}>
            Undo (15s)
          </button>
        </div>
      )}

      {/* Suggested arm */}
      {suggested && !timerOn && total <= 0 && (
        <div className="glass flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
          <div>
            <p className="hub-label mb-1 text-cyan-300/90">Suggested pull</p>
            <p className="text-sm font-semibold text-foreground">
              {suggested.spot.name}
              <span className="ml-2 font-mono text-emerald-300">
                ~{formatSilver(suggested.stats.medianSph)}/h median
              </span>
            </p>
            <p className="hub-meta mt-0.5">
              {suggested.stats.count} sessions · band{" "}
              {formatSilver(suggested.stats.p25)}–{formatSilver(suggested.stats.p75)}/h
            </p>
          </div>
          <button type="button" className="btn-primary h-10 px-4 text-sm" onClick={armSuggested}>
            <Zap className="mr-1.5 size-4" />
            Arm this
          </button>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(220px,260px)_1fr_minmax(240px,300px)]">
        {/* ─── RAIL ─── */}
        <aside className="glass flex flex-col gap-3 p-3 sm:p-4">
          <div>
            <p className="hub-label mb-2">Pilot</p>
            <div className="flex flex-wrap gap-1.5">
              {(pilots.length ? pilots : pilot ? [pilot] : []).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPilot(p)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition",
                    pilot === p
                      ? "bg-violet-500/25 text-violet-100 ring-violet-400/45"
                      : "bg-white/5 text-muted-foreground ring-white/10 hover:text-foreground",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <Input
              value={pilot}
              onChange={(e) => setPilot(e.target.value)}
              placeholder="Character name"
              className="mt-2 h-9 text-sm"
              list="grind-pilots"
            />
            <datalist id="grind-pilots">
              {pilots.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAgris((v) => !v)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition",
                agris
                  ? "bg-amber-500/20 text-amber-100 ring-amber-400/45"
                  : "bg-white/5 text-muted-foreground ring-white/10",
              )}
            >
              Agris {agris ? "ON" : "OFF"}
            </button>
            <Input
              value={dropRate}
              onChange={(e) => setDropRate(e.target.value)}
              placeholder="DR %"
              className="h-8 w-20 text-xs"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <Search className="size-3.5 text-muted-foreground" />
              <Input
                value={spotQuery}
                onChange={(e) => setSpotQuery(e.target.value)}
                placeholder="Find spot…"
                className="h-8 text-xs"
              />
            </div>
            <select
              className="field-select mb-2 h-8 w-full text-xs"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r === "all" ? "All territories" : r}
                </option>
              ))}
            </select>
            <div className="max-h-[42vh] space-y-3 overflow-y-auto pr-1">
              {spotsByRegion.map(([region, list]) => (
                <div key={region}>
                  <p className="hub-tiny mb-1 text-muted-foreground">{region}</p>
                  <ul className="space-y-0.5">
                    {list.map((s) => {
                      const active = s.id === selectedId;
                      const fav = favoriteSet.has(s.id);
                      return (
                        <li key={s.id} className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => toggleFavoriteSpot(s.id)}
                            className="flex size-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-amber-300"
                            title="Favorite"
                          >
                            <Star
                              className={cn("size-3.5", fav && "fill-amber-400 text-amber-300")}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedId(s.id)}
                            className={cn(
                              "min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-xs font-semibold transition",
                              active
                                ? "bg-cyan-400/15 text-cyan-100 ring-1 ring-cyan-400/40"
                                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                            )}
                          >
                            <span className="block truncate">{s.name}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setAddingSpot((v) => !v);
                setEditingSpot(false);
              }}
              className="btn-ghost mt-2 h-8 w-full text-xs"
            >
              <Plus className="mr-1 size-3.5" /> New spot
            </button>
            {addingSpot && (
              <div className="mt-2 space-y-1.5 rounded-lg bg-white/[0.03] p-2 ring-1 ring-white/10">
                <Input
                  value={spotName}
                  onChange={(e) => setSpotName(e.target.value)}
                  placeholder="Spot name"
                  className="h-8 text-xs"
                />
                <select
                  className="field-select h-8 w-full text-xs"
                  value={spotTerritory}
                  onChange={(e) => setSpotTerritory(e.target.value)}
                >
                  <option value="">Territory</option>
                  {TERRITORIES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <Input
                  value={spotMonsters}
                  onChange={(e) => setSpotMonsters(e.target.value)}
                  placeholder="Monsters / notes"
                  className="h-8 text-xs"
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setSpotMode("pve")}
                    className={cn(
                      "h-8 flex-1 rounded text-xs ring-1",
                      spotMode === "pve"
                        ? "bg-cyan-400/15 text-cyan-200 ring-cyan-400/40"
                        : "ring-white/10 text-muted-foreground",
                    )}
                  >
                    PvE
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpotMode("lifeskill")}
                    className={cn(
                      "h-8 flex-1 rounded text-xs ring-1",
                      spotMode === "lifeskill"
                        ? "bg-emerald-400/15 text-emerald-200 ring-emerald-400/40"
                        : "ring-white/10 text-muted-foreground",
                    )}
                  >
                    Life
                  </button>
                </div>
                {spotMode === "lifeskill" ? (
                  <select
                    className="field-select h-8 w-full text-xs"
                    value={spotMonsters}
                    onChange={(e) => setSpotMonsters(e.target.value)}
                  >
                    <option value="">Life type</option>
                    {LIFESKILL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    className="field-select h-8 w-full text-xs"
                    value={spotMonsters}
                    onChange={(e) => setSpotMonsters(e.target.value)}
                  >
                    <option value="">Monster type</option>
                    {MONSTER_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  disabled={busy || !spotName.trim()}
                  onClick={() => void onCreateSpot()}
                  className="btn-primary h-8 w-full text-xs"
                >
                  Create
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ─── STAGE ─── */}
        <main className="flex min-w-0 flex-col gap-3">
          {!selectedSpot ? (
            <div className="hub-empty">Select or arm a spot to begin a pull.</div>
          ) : (
            <>
              {/* Live instruments */}
              <div className="glass grid gap-3 p-3 sm:grid-cols-4 sm:p-4">
                <div
                  className={cn(
                    "rounded-xl border px-3 py-3 text-center transition",
                    timerOn
                      ? "border-cyan-400/45 bg-cyan-400/10 shadow-[0_0_28px_rgba(34,211,238,0.2)]"
                      : "border-white/10 bg-white/[0.03]",
                  )}
                >
                  <p className="hub-tiny mb-1 text-muted-foreground">
                    {timerOn ? "● LIVE" : "Timer"}
                  </p>
                  <p
                    className={cn(
                      "font-mono text-2xl font-bold tabular-nums",
                      timerOn ? "text-cyan-200" : "text-foreground",
                    )}
                  >
                    {hh}:{mm}:{ss}
                  </p>
                  <div className="mt-2 flex justify-center gap-1">
                    <button
                      type="button"
                      onClick={timerOn ? toggleTimer : armPull}
                      className={cn(
                        "inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold ring-1",
                        timerOn
                          ? "bg-amber-500/20 text-amber-100 ring-amber-400/40"
                          : "bg-emerald-500/20 text-emerald-100 ring-emerald-400/40",
                      )}
                    >
                      {timerOn ? (
                        <>
                          <Square className="size-3" /> Stop
                        </>
                      ) : (
                        <>
                          <Play className="size-3" /> Arm
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={resetTimer}
                      className="inline-flex h-8 items-center rounded-full bg-white/5 px-2 text-xs ring-1 ring-white/10"
                      title="Reset timer"
                    >
                      <RotateCcw className="size-3" />
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-center">
                  <p className="hub-tiny mb-1 text-muted-foreground">Silver now</p>
                  <p className="font-mono text-2xl font-bold tabular-nums text-emerald-300">
                    {formatSilver(liveSph)}
                    <span className="text-sm font-semibold text-muted-foreground">/h</span>
                  </p>
                  {vsMedian != null && (
                    <p
                      className={cn(
                        "mt-1 text-xs font-semibold",
                        vsMedian >= 0 ? "text-emerald-300/90" : "text-amber-200/90",
                      )}
                    >
                      {vsMedian >= 0 ? "+" : ""}
                      {vsMedian.toFixed(0)}% vs median
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-center">
                  <p className="hub-tiny mb-1 text-muted-foreground">This pull</p>
                  <p className="font-mono text-2xl font-bold tabular-nums text-cyan-300">
                    {formatSilver(total)}
                  </p>
                  <p className="hub-meta mt-1">
                    Trash {formatSilver(trash)} · Rare {formatSilver(rare)}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-center">
                  <p className="hub-tiny mb-1 text-muted-foreground">Spot dossier</p>
                  <p className="font-mono text-lg font-bold tabular-nums text-foreground">
                    {formatSilver(spotStats.medianSph)}
                    <span className="text-xs font-medium text-muted-foreground"> med</span>
                  </p>
                  <p className="hub-meta mt-1">
                    Best {formatSilver(spotStats.bestSph)} · {spotStats.count} runs ·{" "}
                    {spotStats.totalHours.toFixed(1)}h
                  </p>
                </div>
              </div>

              <div className="glass p-3 sm:p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedSpot.name}</p>
                    <p className="hub-meta">{insight}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={beginEditSpot}
                      className="btn-ghost h-8 px-2 text-xs"
                    >
                      <Pencil className="mr-1 size-3" /> Spot
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportOpen(true)}
                      className="btn-ghost h-8 px-2 text-xs"
                    >
                      <ImagePlus className="mr-1 size-3" /> Import
                    </button>
                    <button
                      type="button"
                      disabled={busy || loots.length === 0}
                      onClick={() => void onRefreshMarketPrices()}
                      className="btn-ghost h-8 px-2 text-xs"
                    >
                      {refreshingPrices ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        "Prices"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={clearQty}
                      className="btn-ghost h-8 px-2 text-xs"
                    >
                      Clear qty
                    </button>
                    <button
                      type="button"
                      disabled={busy || total <= 0}
                      onClick={() => void endPull()}
                      className="btn-primary h-8 px-3 text-xs"
                    >
                      End pull
                    </button>
                  </div>
                </div>
                <PulseSpark pulse={pulse} />
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>
                    Trash share{" "}
                    <strong className="text-foreground">{trashShare.toFixed(0)}%</strong>
                  </span>
                  <span>
                    Effective mins{" "}
                    <strong className="text-foreground">{effectiveMins.toFixed(1)}</strong>
                  </span>
                  {!timerOn && (
                    <label className="inline-flex items-center gap-1">
                      Manual min
                      <Input
                        value={minutes}
                        onChange={(e) => setMinutes(e.target.value)}
                        className="h-7 w-16 text-xs"
                      />
                    </label>
                  )}
                </div>
                {contributors.length > 0 && (
                  <p className="hub-meta mt-2">
                    Top:{" "}
                    {contributors
                      .map((c) => `${c.loot.name} (${formatSilver(c.lineValue)})`)
                      .join(" · ")}
                  </p>
                )}
              </div>

              {editingSpot && (
                <div className="glass grid gap-2 p-3 sm:grid-cols-2">
                  <Input
                    value={spotName}
                    onChange={(e) => setSpotName(e.target.value)}
                    className="h-9 text-sm"
                  />
                  <select
                    className="field-select h-9 text-sm"
                    value={spotTerritory}
                    onChange={(e) => setSpotTerritory(e.target.value)}
                  >
                    {TERRITORIES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={spotMonsters}
                    onChange={(e) => setSpotMonsters(e.target.value)}
                    className="h-9 text-sm sm:col-span-2"
                  />
                  <div className="flex gap-2 sm:col-span-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onSaveSpot()}
                      className="btn-primary h-9 text-xs"
                    >
                      Save spot
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSpot(false)}
                      className="btn-ghost h-9 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Drop board */}
              <div className="glass p-3 sm:p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="hub-label">Drop board</p>
                    <p className="hub-meta">
                      +1 / +10 chips · keys 1–9 · Shift+key = +10 · click{" "}
                      <Keyboard className="inline size-3" /> to bind
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddingLoot((v) => !v)}
                    className="btn-ghost h-8 text-xs"
                  >
                    <Plus className="mr-1 size-3" /> Item
                  </button>
                </div>

                {addingLoot && (
                  <div className="mb-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
                    <Input
                      value={lootName}
                      onChange={(e) => setLootName(e.target.value)}
                      placeholder="Item name"
                      className="h-9 text-sm col-span-2"
                    />
                    <select
                      className="field-select h-9 text-sm"
                      value={lootKind}
                      onChange={(e) => setLootKind(e.target.value as "market" | "npc")}
                    >
                      <option value="market">Market</option>
                      <option value="npc">NPC</option>
                    </select>
                    <select
                      className="field-select h-9 text-sm"
                      value={lootRarity}
                      onChange={(e) => setLootRarity(e.target.value as typeof lootRarity)}
                    >
                      {RARITY_ORDER.map((r) => (
                        <option key={r} value={r}>
                          {RARITY_LABEL[r]}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      value={lootPrice}
                      onChange={(e) => setLootPrice(e.target.value)}
                      placeholder="Price"
                      className="h-9 text-sm"
                    />
                    <button
                      type="button"
                      className="btn-ghost h-9 text-xs"
                      onClick={() => void onFetchMarketPrice()}
                    >
                      Market
                    </button>
                    <button
                      type="button"
                      className="btn-ghost h-9 text-xs"
                      onClick={() => void pickIconFile().then((u) => u && setLootIconUrl(u))}
                    >
                      Icon
                    </button>
                    <button
                      type="button"
                      disabled={busy || !lootName.trim()}
                      onClick={() => void onCreateLoot()}
                      className="btn-primary h-9 text-xs"
                    >
                      Add
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {boardLoots.map((l) => {
                    const q = qty[l.id] || 0;
                    const unit = effectiveUnitSilver(Number(l.unit_price) || 0, l.kind);
                    const line = q * unit;
                    const hk = hotkeys[l.id];
                    const trash = isTrashLoot(l.rarity);
                    const editing = editingLootId === l.id;

                    if (editing) {
                      return (
                        <div
                          key={l.id}
                          className="rounded-xl bg-white/[0.04] p-2.5 ring-1 ring-white/10 sm:col-span-2"
                        >
                          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                            <Input
                              value={editLootName}
                              onChange={(e) => setEditLootName(e.target.value)}
                              className="h-9 text-sm"
                            />
                            <select
                              className="field-select h-9 text-sm"
                              value={editLootKind}
                              onChange={(e) =>
                                setEditLootKind(e.target.value as "market" | "npc")
                              }
                            >
                              <option value="market">Market</option>
                              <option value="npc">NPC</option>
                            </select>
                            <select
                              className="field-select h-9 text-sm"
                              value={editLootRarity}
                              onChange={(e) =>
                                setEditLootRarity(e.target.value as typeof editLootRarity)
                              }
                            >
                              {RARITY_ORDER.map((r) => (
                                <option key={r} value={r}>
                                  {RARITY_LABEL[r]}
                                </option>
                              ))}
                            </select>
                            <Input
                              type="number"
                              value={editLootPrice}
                              onChange={(e) => setEditLootPrice(e.target.value)}
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => void saveLootEdit()}
                              className="btn-primary h-8 text-xs"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingLootId(null)}
                              className="btn-ghost h-8 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={l.id}
                        className={cn(
                          "group relative flex gap-2.5 rounded-xl p-2.5 ring-1 transition",
                          q > 0
                            ? "bg-white/[0.05] ring-white/15"
                            : "bg-white/[0.02] ring-white/8",
                          !trash && "ring-amber-400/20",
                        )}
                      >
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-black/30 ring-1 ring-white/10">
                          {l.icon_url ? (
                            <img
                              src={l.icon_url}
                              alt=""
                              className="size-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-[0.65rem] text-muted-foreground">
                              ?
                            </div>
                          )}
                          {hk && (
                            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded bg-cyan-500/90 text-[0.65rem] font-bold text-black">
                              {hk}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {l.name}
                              </p>
                              <div className="mt-0.5 flex flex-wrap gap-1">
                                <LootMetaTags kind={l.kind} rarity={l.rarity} />
                                <span className="hub-tiny text-muted-foreground">
                                  {formatSilver(unit)}
                                  {l.kind === "market" ? " eff" : ""}
                                </span>
                              </div>
                            </div>
                            <div className="flex shrink-0 gap-0.5 opacity-70 group-hover:opacity-100">
                              <button
                                type="button"
                                title="Bind hotkey"
                                onClick={() =>
                                  setBindHotkeyLootId(
                                    bindHotkeyLootId === l.id ? null : l.id,
                                  )
                                }
                                className={cn(
                                  "flex size-7 items-center justify-center rounded",
                                  bindHotkeyLootId === l.id
                                    ? "bg-cyan-400/20 text-cyan-200"
                                    : "text-muted-foreground hover:text-cyan-300",
                                )}
                              >
                                <Keyboard className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => beginEditLoot(l)}
                                className="flex size-7 items-center justify-center rounded text-muted-foreground hover:text-cyan-300"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  await deleteLoot(l.id);
                                  setLoots((p) => p.filter((x) => x.id !== l.id));
                                }}
                                className="flex size-7 items-center justify-center rounded text-muted-foreground hover:text-rose-400"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => addQty(l.id, 1)}
                              className="rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-200 ring-1 ring-emerald-400/30 hover:bg-emerald-500/25"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() => addQty(l.id, 10)}
                              className="rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-200 ring-1 ring-emerald-400/30 hover:bg-emerald-500/25"
                            >
                              +10
                            </button>
                            <button
                              type="button"
                              onClick={() => addQty(l.id, 100)}
                              className="rounded-md bg-white/5 px-2 py-1 text-xs font-bold text-muted-foreground ring-1 ring-white/10 hover:text-foreground"
                            >
                              +100
                            </button>
                            <button
                              type="button"
                              onClick={() => addQty(l.id, -1)}
                              className="rounded-md bg-white/5 px-2 py-1 text-xs font-bold text-muted-foreground ring-1 ring-white/10"
                            >
                              −1
                            </button>
                            <Input
                              type="number"
                              value={q || ""}
                              onChange={(e) =>
                                writeQty(l.id, parseFloat(e.target.value) || 0)
                              }
                              className="h-8 w-20 text-center font-mono text-sm"
                            />
                            <span className="ml-auto font-mono text-sm font-semibold tabular-nums text-cyan-200">
                              {line > 0 ? formatSilver(line) : "—"}
                            </span>
                          </div>
                          {bindHotkeyLootId === l.id && (
                            <p className="mt-1 text-[0.7rem] text-cyan-200/90">
                              Press 1–9 to bind this item…
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {boardLoots.length === 0 && (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No items on this board yet — add trash and sellables for the spot.
                  </p>
                )}
              </div>
            </>
          )}
        </main>

        {/* ─── ARCHIVE ─── */}
        <aside className="glass flex flex-col gap-3 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <p className="hub-label">Archive</p>
            <button
              type="button"
              className="btn-ghost h-7 px-2 text-xs md:hidden"
              onClick={() => setArchiveOpen((v) => !v)}
            >
              {archiveOpen ? <X className="size-3.5" /> : "Open"}
            </button>
          </div>

          <div className={cn("space-y-3", !archiveOpen && "max-md:hidden")}>
            {selectedSpot && (
              <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
                <p className="text-xs font-semibold text-foreground">{selectedSpot.name}</p>
                <p className="hub-meta mt-1">
                  Median {formatSilver(spotStats.medianSph)}/h · p25–p75{" "}
                  {formatSilver(spotStats.p25)}–{formatSilver(spotStats.p75)}
                </p>
                <p className="hub-meta">
                  {spotStats.count} sessions · {formatSilver(spotStats.totalSilver)} total
                </p>
              </div>
            )}

            <p className="hub-tiny text-muted-foreground">Recent pulls</p>
            <ul className="max-h-[55vh] space-y-1.5 overflow-y-auto pr-0.5">
              {(selectedId
                ? sessions.filter((s) => s.spot_id === selectedId)
                : sessions
              )
                .slice(0, 24)
                .map((s) => (
                  <li
                    key={s.id}
                    className="flex items-start gap-2 rounded-lg bg-white/[0.03] px-2 py-2 ring-1 ring-white/8"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {s.character_name || "—"}
                      </p>
                      <p className="font-mono text-[0.7rem] text-emerald-300/90">
                        {formatSilver(Number(s.silver_per_hour))} /h ·{" "}
                        {formatSilver(Number(s.total_value))} · {s.minutes}m
                      </p>
                      <p className="hub-tiny text-muted-foreground">
                        {(() => {
                          const ts = s.started_at || s.created_at;
                          if (!ts) return "—";
                          try {
                            return new Date(ts).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                          } catch {
                            return "—";
                          }
                        })()}
                        {s.agris ? " · Agris" : ""}
                        {s.drop_rate != null ? ` · DR ${s.drop_rate}%` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-0.5">
                      <button
                        type="button"
                        title="Share PNG"
                        disabled={sharingId === s.id}
                        onClick={() => void onShareSession(s)}
                        className="flex size-7 items-center justify-center rounded text-muted-foreground hover:text-cyan-300"
                      >
                        {sharingId === s.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Share2 className="size-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        onClick={async () => {
                          await deleteSession(s.id);
                          setSessions((p) => p.filter((x) => x.id !== s.id));
                        }}
                        className="flex size-7 items-center justify-center rounded text-muted-foreground hover:text-rose-400"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              {sessions.length === 0 && (
                <li className="py-6 text-center text-xs text-muted-foreground">
                  No pulls logged yet.
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>

      <InventoryScreenshotImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        loots={loots}
        currentQty={Object.fromEntries(
          Object.entries(qty).map(([k, v]) => [k, String(v)]),
        )}
        onApply={applyImportQty}
      />
    </div>
  );
}

