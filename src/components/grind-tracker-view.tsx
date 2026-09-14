import {
  ImagePlus,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { ChronoPanel } from "@/components/chrono-panel";
import { SpotSidebar } from "@/components/grind-spot-sidebar";
import { InventoryScreenshotImport } from "@/components/inventory-screenshot-import";
import { Input } from "@/components/ui/input";
import {
  LootMetaTags,
  RARITY_LABEL,
  RARITY_ORDER,
  sortLootsByRarity,
} from "@/components/grind-loot-meta";
import { LIFESKILL_TYPES, MONSTER_TYPES, TERRITORIES } from "@/data/grind-meta";
import {
  deleteLoot,
  deleteSession,
  listLoots,
} from "@/lib/grind-api";
import type { SpotRow } from "@/lib/supabase";
import { cn, effectiveUnitSilver } from "@/lib/utils";
import { useGrindController } from "@/components/use-grind-controller";

type G = ReturnType<typeof useGrindController>;

export function GrindTrackerView(g: G & { selectedSpot: SpotRow | undefined }) {
  const {
    error,
    setError,
    busy,
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
    timerOn,
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
    beginEditLoot,
    saveLootEdit,
    onShareSession,
    onSaveSession,
    formatSilver,
    pickIconFile,
    selectedSpot,
  } = { ...g };

  return (
    <div className="flex flex-col gap-4 pb-[env(safe-area-inset-bottom)]">
      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
          <button type="button" className="ml-2 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(240px,280px)_1fr]">
        <SpotSidebar
          regions={regions}
          regionFilter={regionFilter}
          setRegionFilter={setRegionFilter}
          spotQuery={spotQuery}
          setSpotQuery={setSpotQuery}
          spotsByRegion={spotsByRegion}
          selectedId={selectedId}
          setSelectedId={(id) => setSelectedId(id)}
          addingSpot={addingSpot}
          setAddingSpot={setAddingSpot}
          setEditingSpot={setEditingSpot}
          spotName={spotName}
          setSpotName={setSpotName}
          spotMonsters={spotMonsters}
          setSpotMonsters={setSpotMonsters}
          spotTerritory={spotTerritory}
          setSpotTerritory={setSpotTerritory}
          spotIconUrl={spotIconUrl}
          setSpotIconUrl={setSpotIconUrl}
          spotMode={spotMode}
          setSpotMode={setSpotMode}
          busy={busy}
          onCreateSpot={onCreateSpot}
          onPickSpotIcon={() => void pickIconFile().then((url) => { if (url) setSpotIconUrl(url); })}
        />
        <div className="flex min-w-0 flex-col gap-3">
          {!selectedId ? (
            <div className="glass flex flex-col items-center justify-center gap-2 px-4 py-16 text-center text-sm text-muted-foreground">
              <MapPin className="size-8 text-cyan-300/70" />
              Select a spot to track loot and sessions.
            </div>
          ) : (
            <>
              <div className="glass flex flex-wrap items-center gap-3 p-3 sm:p-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {selectedSpot?.icon_url ? (
                    <img src={selectedSpot.icon_url} alt="" className="size-10 rounded object-contain" />
                  ) : (
                    <span className="flex size-10 items-center justify-center rounded bg-white/5 text-sm font-bold text-cyan-300">
                      {selectedSpot?.name[0]?.toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold sm:text-lg">{selectedSpot?.name}</h3>
                    <p className="truncate text-xs text-muted-foreground sm:text-sm">
                      {selectedSpot?.monsters}
                      {selectedSpot?.territory ? ` · ${selectedSpot.territory}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={beginEditSpot} className="btn-ghost h-9 px-2.5 text-xs">
                    <Pencil className="size-3.5" /> Edit
                  </button>
                  <button type="button" onClick={() => setImportOpen(true)} className="btn-ghost h-9 px-2.5 text-xs">
                    <ImagePlus className="size-3.5" /> Import Qty
                  </button>
                  <button
                    type="button"
                    disabled={busy || sessionTotals.total <= 0}
                    onClick={onSaveSession}
                    className="btn-primary h-9 px-3 text-xs"
                  >
                    Save Session
                  </button>
                </div>
              </div>

              {editingSpot && (
                <div className="glass grid gap-2 p-3 sm:grid-cols-2">
                  <Input value={spotName} onChange={(e) => setSpotName(e.target.value)} placeholder="Name" className="h-9 text-sm sm:col-span-2" />
                  <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                    <button type="button" onClick={() => setSpotMode("pve")} className={cn("h-9 rounded-md text-xs font-semibold ring-1 transition", spotMode === "pve" ? "bg-cyan-400/15 text-cyan-200 ring-cyan-400/40" : "bg-white/5 text-muted-foreground ring-white/10")}>
                      Monsters
                    </button>
                    <button type="button" onClick={() => setSpotMode("lifeskill")} className={cn("h-9 rounded-md text-xs font-semibold ring-1 transition", spotMode === "lifeskill" ? "bg-emerald-400/15 text-emerald-200 ring-emerald-400/40" : "bg-white/5 text-muted-foreground ring-white/10")}>
                      Lifeskill
                    </button>
                  </div>
                  <select className="field-select h-9 text-sm" value={spotMonsters} onChange={(e) => setSpotMonsters(e.target.value)}>
                    <option value="">Type…</option>
                    {(spotMode === "lifeskill" ? LIFESKILL_TYPES : MONSTER_TYPES).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <select className="field-select h-9 text-sm" value={spotTerritory} onChange={(e) => setSpotTerritory(e.target.value)}>
                    <option value="">Territory…</option>
                    {TERRITORIES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <div className="flex gap-2 sm:col-span-2">
                    <button type="button" onClick={() => void pickIconFile().then((u) => u && setSpotIconUrl(u))} className="btn-ghost h-9 text-xs">
                      {spotIconUrl ? "Change Icon" : "Icon"}
                    </button>
                    <button type="button" disabled={busy} onClick={onSaveSpot} className="btn-primary h-9 text-xs">
                      Save Spot
                    </button>
                    <button type="button" onClick={() => setEditingSpot(false)} className="btn-ghost h-9 text-xs">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <ChronoPanel
                hh={hh}
                mm={mm}
                ss={ss}
                timerOn={timerOn}
                total={sessionTotals.total}
                sph={sessionTotals.sph}
                character={character}
                dropRate={dropRate}
                minutes={minutes}
                onToggle={toggleTimer}
                onReset={resetTimer}
                onCharacter={setCharacter}
                onDropRate={setDropRate}
                onMinutes={setMinutes}
              />

              <div className="glass p-3 sm:p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-300/90">Loot</h3>
                  <button type="button" onClick={() => setAddingLoot((v) => !v)} className="btn-ghost h-8 px-2 text-xs">
                    <Plus className="size-3.5" /> Add Loot
                  </button>
                </div>
                {addingLoot && (
                  <div className="mb-2 grid grid-cols-2 gap-1.5 rounded-lg bg-white/5 p-2 sm:grid-cols-3 lg:grid-cols-6">
                    <Input value={lootName} onChange={(e) => setLootName(e.target.value)} placeholder="Item" className="h-9 text-sm sm:col-span-2 lg:col-span-1" />
                    <select className="field-select h-9 text-sm" value={lootKind} onChange={(e) => setLootKind(e.target.value as "market" | "npc")}>
                      <option value="market">Market</option>
                      <option value="npc">NPC</option>
                    </select>
                    <select className="field-select h-9 text-sm" value={lootRarity} onChange={(e) => setLootRarity(e.target.value as typeof lootRarity)}>
                      {RARITY_ORDER.map((r) => (
                        <option key={r} value={r}>{RARITY_LABEL[r]}</option>
                      ))}
                    </select>
                    <Input type="number" value={lootPrice} onChange={(e) => setLootPrice(e.target.value)} placeholder="Price" className="h-9 text-sm" />
                    <button type="button" onClick={() => void pickIconFile().then((u) => u && setLootIconUrl(u))} className="btn-ghost h-9 text-xs">
                      Icon
                    </button>
                    <button type="button" disabled={busy || !lootName.trim()} onClick={onCreateLoot} className="btn-primary h-9 text-xs">
                      Add
                    </button>
                  </div>
                )}
                <ul className="flex flex-col gap-1.5">
                  {loots.map((l) => {
                    const q = parseFloat(qty[l.id] || "0") || 0;
                    const lineVal = q * effectiveUnitSilver(l.unit_price, l.kind);
                    const lineSph = sessionTotals.mins > 0 ? lineVal / (sessionTotals.mins / 60) : 0;
                    if (editingLootId === l.id) {
                      return (
                        <li key={l.id} className="rounded-xl bg-white/[0.04] p-2 ring-1 ring-white/10">
                          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
                            <Input value={editLootName} onChange={(e) => setEditLootName(e.target.value)} className="h-9 text-sm sm:col-span-2 lg:col-span-1" />
                            <select className="field-select h-9 text-sm" value={editLootKind} onChange={(e) => setEditLootKind(e.target.value as "market" | "npc")}>
                              <option value="market">Market</option>
                              <option value="npc">NPC</option>
                            </select>
                            <select className="field-select h-9 text-sm" value={editLootRarity} onChange={(e) => setEditLootRarity(e.target.value as typeof editLootRarity)}>
                              {RARITY_ORDER.map((r) => (
                                <option key={r} value={r}>{RARITY_LABEL[r]}</option>
                              ))}
                            </select>
                            <Input type="number" value={editLootPrice} onChange={(e) => setEditLootPrice(e.target.value)} className="h-9 text-sm" />
                            <button type="button" onClick={saveLootEdit} className="btn-primary h-9 text-xs">Save</button>
                            <button type="button" onClick={() => setEditingLootId(null)} className="btn-ghost h-9 text-xs">Cancel</button>
                          </div>
                        </li>
                      );
                    }
                    return (
                      <li key={l.id} className="rounded-xl bg-white/[0.03] px-2 py-2 ring-1 ring-white/10">
                        <div className="grid grid-cols-[minmax(0,1fr)_4.25rem_5.25rem_4rem_5.25rem_4.5rem] items-center gap-1.5 sm:grid-cols-[minmax(0,1fr)_5rem_6rem_4.5rem_6rem_5rem] sm:gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            {l.icon_url ? (
                              <img src={l.icon_url} alt="" className="size-9 shrink-0 rounded object-contain sm:size-10" />
                            ) : (
                              <span className="flex size-9 shrink-0 items-center justify-center rounded bg-white/5 text-xs font-bold text-cyan-300 sm:size-10">
                                {l.name[0]?.toUpperCase()}
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground sm:text-[0.95rem]">{l.name}</p>
                              <div className="mt-0.5 flex flex-wrap gap-1">
                                <LootMetaTags kind={l.kind} rarity={l.rarity} />
                              </div>
                            </div>
                          </div>
                          <Input
                            type="number"
                            min={0}
                            value={qty[l.id] || ""}
                            onChange={(e) => setQty((p) => ({ ...p, [l.id]: e.target.value }))}
                            className="h-9 text-center text-sm font-semibold"
                            placeholder="0"
                          />
                          <span className="text-right font-mono text-sm font-bold tabular-nums text-cyan-300 sm:text-base">{formatSilver(lineVal)}</span>
                          <span className="text-right font-mono text-sm font-bold tabular-nums text-amber-300/95 sm:text-base">
                            {sessionTotals.total > 0 ? `${((lineVal / sessionTotals.total) * 100).toFixed(1)}%` : "—"}
                          </span>
                          <span className="text-right font-mono text-sm font-bold tabular-nums text-emerald-300 sm:text-base">{formatSilver(lineSph)}</span>
                          <div className="flex justify-end gap-0.5">
                            <button type="button" onClick={() => beginEditLoot(l)} className="flex size-8 items-center justify-center rounded text-muted-foreground hover:text-cyan-300">
                              <Pencil className="size-3.5" strokeWidth={1.75} />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await deleteLoot(l.id);
                                if (selectedId) setLoots(sortLootsByRarity(await listLoots(selectedId)));
                              }}
                              className="flex size-8 items-center justify-center rounded text-muted-foreground hover:text-rose-400"
                            >
                              <Trash2 className="size-3.5" strokeWidth={1.75} />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  {loots.length === 0 && (
                    <li className="py-8 text-center text-sm text-muted-foreground">No loot rows yet — add items for this spot.</li>
                  )}
                </ul>
              </div>

              <div className="glass p-3 sm:p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-300/90">Sessions</h3>
                {spotSessions.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No Sessions For This Spot Yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {spotSessions.map((s) => (
                      <li key={s.id} className="rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/10">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{s.character_name || "Unknown"}</p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground ring-1 ring-white/10">
                                {s.minutes} min
                              </span>
                              <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 font-mono text-[0.7rem] font-semibold text-cyan-300 ring-1 ring-cyan-400/20">
                                {formatSilver(Number(s.total_value))}
                              </span>
                              <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-mono text-[0.7rem] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
                                {formatSilver(Number(s.silver_per_hour))}/h
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <button type="button" title="Share Report PNG" disabled={sharingId === s.id} onClick={() => onShareSession(s)} className="flex size-8 items-center justify-center rounded text-muted-foreground hover:text-cyan-300 disabled:opacity-50">
                              {sharingId === s.id ? <Loader2 className="size-3.5 animate-spin" /> : <Share2 className="size-3.5" strokeWidth={1.75} />}
                            </button>
                            <button type="button" title="Delete Session" onClick={async () => { await deleteSession(s.id); setSessions((p) => p.filter((x) => x.id !== s.id)); }} className="flex size-8 items-center justify-center rounded text-muted-foreground hover:text-rose-400">
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
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
      <InventoryScreenshotImport open={importOpen} onClose={() => setImportOpen(false)} loots={loots} currentQty={qty} onApply={(next) => setQty(next)} />
    </div>
  );
}
