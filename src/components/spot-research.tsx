import { MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { listLoots, listSpots } from "@/lib/grind-api";
import type { LootRow, SpotRow } from "@/lib/supabase";
import { cn, formatSilverCompact } from "@/lib/utils";

export function SpotResearch() {
  const [spots, setSpots] = useState<SpotRow[]>([]);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loots, setLoots] = useState<LootRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sp = await listSpots();
        if (!cancelled) setSpots(sp);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load spots");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setLoots([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const ls = await listLoots(selectedId);
        if (!cancelled) setLoots(ls);
      } catch {
        if (!cancelled) setLoots([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const s of spots) {
      const t = (s.territory || "").trim();
      set.add(t || "Unspecified");
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [spots]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return spots.filter((s) => {
      const terr = (s.territory || "").trim() || "Unspecified";
      if (region !== "all" && terr !== region) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.monsters || "").toLowerCase().includes(q) ||
        terr.toLowerCase().includes(q)
      );
    });
  }, [spots, query, region]);

  const byRegion = useMemo(() => {
    const map = new Map<string, SpotRow[]>();
    for (const s of filtered) {
      const key = (s.territory || "").trim() || "Unspecified";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const selected = spots.find((s) => s.id === selectedId);

  if (loading) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Loading Spots…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>
      )}

      <div className="glass flex flex-col gap-3 p-3 sm:flex-row sm:items-end sm:p-4">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Spot, Monster, Region…"
            className="h-10 pl-10"
          />
        </div>
        <div className="sm:w-48">
          <select
            className="field-select h-10 w-full"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            {regions.map((r) => (
              <option key={r} value={r}>
                {r === "all" ? "All Regions" : r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          {byRegion.length === 0 ? (
            <p className="glass py-12 text-center text-sm text-muted-foreground">No Spots Match.</p>
          ) : (
            byRegion.map(([terr, list]) => (
              <section key={terr} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1">
                  <MapPin className="size-3.5 text-cyan-300" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300/90">{terr}</h3>
                  <span className="text-[0.65rem] text-muted-foreground">{list.length}</span>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {list.map((s) => {
                    const active = selectedId === s.id;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(s.id)}
                          className={cn(
                            "glass flex w-full items-center gap-3 px-3 py-2.5 text-left transition",
                            active && "ring-1 ring-cyan-400/40",
                          )}
                        >
                          {s.icon_url ? (
                            <img src={s.icon_url} alt="" className="size-9 shrink-0 rounded object-contain" />
                          ) : (
                            <span className="flex size-9 shrink-0 items-center justify-center rounded bg-white/5 text-sm font-bold text-cyan-300">
                              {s.name[0]?.toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                            <p className="truncate text-[0.7rem] text-muted-foreground">
                              {s.monsters || "—"}
                              {s.mode ? ` · ${s.mode}` : ""}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>

        <aside className="glass sticky top-20 h-fit p-4">
          {!selected ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Select A Spot To Inspect Loot.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {selected.icon_url ? (
                  <img src={selected.icon_url} alt="" className="size-12 rounded object-contain" />
                ) : (
                  <span className="flex size-12 items-center justify-center rounded bg-white/5 text-lg font-bold text-cyan-300">
                    {selected.name[0]?.toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{selected.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selected.territory || "").trim() || "Unspecified"}
                  </p>
                </div>
              </div>
              {selected.monsters ? (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground/80">Monsters: </span>
                  {selected.monsters}
                </p>
              ) : null}
              <div>
                <p className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
                  Typical Loot
                </p>
                {loots.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No Loot Entries Yet.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {loots.map((l) => (
                      <li
                        key={l.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-2 py-1.5 text-xs"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          {l.icon_url ? (
                            <img src={l.icon_url} alt="" className="size-6 rounded object-contain" />
                          ) : null}
                          <span className="truncate font-medium">{l.name}</span>
                        </span>
                        <span className="shrink-0 font-mono text-cyan-300">
                          {formatSilverCompact(Number(l.unit_price))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
