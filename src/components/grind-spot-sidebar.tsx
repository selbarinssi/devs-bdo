import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { SpotRow } from "@/lib/supabase";
import { LIFESKILL_TYPES, MONSTER_TYPES, TERRITORIES, type SpotMode } from "@/data/grind-meta";
import { cn } from "@/lib/utils";

export type SpotSidebarProps = {
  regions: string[];
  regionFilter: string;
  setRegionFilter: (v: string) => void;
  spotQuery: string;
  setSpotQuery: (v: string) => void;
  spotsByRegion: [string, SpotRow[]][];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  addingSpot: boolean;
  setAddingSpot: (v: boolean | ((p: boolean) => boolean)) => void;
  setEditingSpot: (v: boolean) => void;
  spotName: string;
  setSpotName: (v: string) => void;
  spotMonsters: string;
  setSpotMonsters: (v: string) => void;
  spotTerritory: string;
  setSpotTerritory: (v: string) => void;
  spotIconUrl: string | null;
  setSpotIconUrl: (v: string | null) => void;
  spotMode: SpotMode;
  setSpotMode: (v: SpotMode) => void;
  busy: boolean;
  onCreateSpot: () => void;
  onPickSpotIcon: () => void;
};

export function SpotSidebar(p: SpotSidebarProps) {
  return (
    <aside className="glass flex max-h-[42vh] min-h-0 flex-col gap-2 p-3 lg:max-h-none">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">Spots</p>
        <button
          type="button"
          onClick={() => {
            p.setAddingSpot((v) => !v);
            p.setEditingSpot(false);
            p.setSpotName("");
            p.setSpotMonsters("");
            p.setSpotTerritory("");
            p.setSpotIconUrl(null);
            p.setSpotMode("pve");
          }}
          className="btn-ghost h-7 px-2 text-[0.65rem]"
        >
          <Plus className="size-3" /> Add Spot
        </button>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={p.spotQuery}
          onChange={(e) => p.setSpotQuery(e.target.value)}
          placeholder="Search Spots…"
          className="h-8 pl-8 text-xs"
        />
      </div>
      <select
        className="field-select h-8 w-full text-xs"
        value={p.regionFilter}
        onChange={(e) => p.setRegionFilter(e.target.value)}
      >
        {p.regions.map((r) => (
          <option key={r} value={r}>
            {r === "all" ? "All Regions" : r}
          </option>
        ))}
      </select>
      {p.addingSpot && (
        <div className="mb-1 flex flex-col gap-1.5 rounded-lg bg-white/5 p-2">
          <Input value={p.spotName} onChange={(e) => p.setSpotName(e.target.value)} placeholder="Name" className="h-8 text-xs" />
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => p.setSpotMode("pve")}
              className={cn(
                "h-8 rounded-md text-[0.65rem] font-semibold ring-1 transition",
                p.spotMode === "pve" ? "bg-cyan-400/15 text-cyan-200 ring-cyan-400/40" : "bg-white/5 text-muted-foreground ring-white/10",
              )}
            >
              Monsters
            </button>
            <button
              type="button"
              onClick={() => p.setSpotMode("lifeskill")}
              className={cn(
                "h-8 rounded-md text-[0.65rem] font-semibold ring-1 transition",
                p.spotMode === "lifeskill" ? "bg-violet-400/15 text-violet-200 ring-violet-400/40" : "bg-white/5 text-muted-foreground ring-white/10",
              )}
            >
              Lifeskill
            </button>
          </div>
          <select
            className="field-select h-8 w-full text-xs"
            value={p.spotMonsters}
            onChange={(e) => p.setSpotMonsters(e.target.value)}
          >
            <option value="">Type…</option>
            {(p.spotMode === "lifeskill" ? LIFESKILL_TYPES : MONSTER_TYPES).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className="field-select h-8 w-full text-xs"
            value={p.spotTerritory}
            onChange={(e) => p.setSpotTerritory(e.target.value)}
          >
            <option value="">Territory…</option>
            {TERRITORIES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button type="button" onClick={p.onPickSpotIcon} className="btn-ghost h-8 text-xs">
            {p.spotIconUrl ? "Change Icon" : "Icon"}
          </button>
          <button type="button" disabled={p.busy || !p.spotName.trim()} onClick={p.onCreateSpot} className="btn-primary h-8 text-xs">
            Create
          </button>
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto overscroll-contain">
        {p.spotsByRegion.map(([terr, list]) => (
          <div key={terr}>
            <p className="mb-1 px-1 text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">{terr}</p>
            <ul className="flex flex-col gap-0.5">
              {list.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => p.setSelectedId(s.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition",
                      p.selectedId === s.id
                        ? "bg-cyan-400/15 text-cyan-100 ring-1 ring-cyan-400/40"
                        : "text-foreground/90 hover:bg-white/5",
                    )}
                  >
                    {s.icon_url ? (
                      <img src={s.icon_url} alt="" className="size-7 shrink-0 rounded object-contain" />
                    ) : (
                      <span className="flex size-7 shrink-0 items-center justify-center rounded bg-white/5 text-[0.65rem] font-bold text-cyan-300">
                        {s.name[0]?.toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
