import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ItemGlyph } from "@/components/item-glyph";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ALCHEMY_CATEGORIES,
  recipeData,
  type AlchemyCategory,
  type Recipe,
} from "@/data/alchemy";
import { useLocalStorage } from "@/lib/storage";
import { cn, formatNumber } from "@/lib/utils";

const STORAGE_KEY = "bdo_alchemy_planner_v2";

type AlchemyState = {
  craftTime: number;
  proc: number;
  crafts: Record<string, number>;
};

const DEFAULT_STATE: AlchemyState = {
  craftTime: 1.0,
  proc: 2.8,
  crafts: {},
};

function formatTime(totalSeconds: number): string {
  if (totalSeconds >= 3600) return `${(totalSeconds / 3600).toFixed(1)}h`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}m ${seconds}s`;
}

function estimatedYield(recipe: Recipe, crafts: number, proc: number): number {
  if (recipe.baseExp === 0) {
    const per = /\[Party\]/.test(recipe.name) ? 1 : 10;
    return crafts * per;
  }
  return Math.floor(crafts * proc);
}

function RecipeCard({
  recipe,
  crafts,
  craftTime,
  proc,
  onCrafts,
}: {
  recipe: Recipe;
  crafts: number;
  craftTime: number;
  proc: number;
  onCrafts: (n: number) => void;
}) {
  const totalYield = estimatedYield(recipe, crafts, proc);
  const totalSeconds = crafts * craftTime;

  return (
    <article className="grid gap-3 rounded-xl border border-white/10 bg-[rgba(12,18,32,0.55)] p-3 shadow-[var(--shadow-border)] transition-[border-color,box-shadow] duration-150 hover:border-cyan-400/40 hover:shadow-[var(--shadow-border-hover)] sm:gap-5 sm:p-4 lg:grid-cols-[minmax(0,280px)_1fr_minmax(0,200px)] lg:items-center">
      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-cyan-400/30 bg-[rgba(8,14,26,0.6)] sm:size-16">
          <ItemGlyph name={recipe.name} size={36} />
        </div>
        <div className="min-w-0">
          <h3 className="text-[0.95rem] font-bold leading-snug text-foreground sm:text-[1.05rem]">{recipe.name}</h3>
          <div className="mt-1.5 flex items-center gap-2">
            <label htmlFor={`crafts-${recipe.id}`} className="text-[0.7rem] font-semibold text-muted-foreground">
              Batch
            </label>
            <Input
              id={`crafts-${recipe.id}`}
              type="number"
              min={1}
              value={crafts}
              onChange={(e) => onCrafts(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="h-8 w-[4.5rem] bg-[rgba(8,14,26,0.7)] text-right text-sm font-bold tabular-nums"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {recipe.ingredients.map((ing) => (
            <div
              key={ing.name}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-[rgba(8,14,26,0.5)] px-2 py-1"
            >
              <ItemGlyph name={ing.name} size={24} />
              <div className="min-w-0">
                <p className="truncate text-[0.78rem] text-foreground" title={ing.name}>
                  {ing.name}
                </p>
                <p className="text-[0.78rem] font-bold tabular-nums text-cyan-300">
                  {formatNumber(ing.qty * crafts)}
                </p>
              </div>
            </div>
          ))}
        </div>
        {recipe.spot ? (
          <p className="rounded-r-md border-l-[3px] border-cyan-400/50 bg-cyan-400/10 px-3 py-1.5 text-[0.78rem] text-foreground">
            <strong className="mr-1.5 text-cyan-300">Note:</strong>
            {recipe.spot}
          </p>
        ) : null}
      </div>

      <dl className="flex flex-col gap-1.5 rounded-[10px] border border-white/10 bg-[rgba(8,14,26,0.5)] p-3">
        <div className="flex justify-between gap-3 text-[0.82rem]">
          <dt className="text-muted-foreground">Yields</dt>
          <dd className="font-bold tabular-nums text-cyan-300">{formatNumber(totalYield)}</dd>
        </div>
        <div className="flex justify-between gap-3 text-[0.82rem]">
          <dt className="text-muted-foreground">Time</dt>
          <dd className="font-bold tabular-nums text-cyan-300">{formatTime(totalSeconds)}</dd>
        </div>
      </dl>
    </article>
  );
}

export function AlchemyPlanner() {
  const { value, setValue } = useLocalStorage<AlchemyState>(STORAGE_KEY, DEFAULT_STATE);
  const [tab, setTab] = useState<AlchemyCategory>("bloods");
  const [query, setQuery] = useState("");

  const recipes = recipeData[tab];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((r) => r.name.toLowerCase().includes(q));
  }, [recipes, query]);

  const patch = (partial: Partial<AlchemyState>) =>
    setValue((prev) => ({ ...prev, ...partial }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 rounded-xl border border-white/10 bg-[rgba(12,18,32,0.55)] p-3 shadow-[var(--shadow-border)] sm:grid-cols-2 sm:gap-4 sm:p-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="craft-time" className="text-[0.7rem]">Crafting Speed (Seconds)</Label>
          <Input
            id="craft-time"
            type="number"
            min={0.5}
            max={10}
            step={0.1}
            value={value.craftTime}
            onChange={(e) =>
              patch({ craftTime: Math.max(0.5, parseFloat(e.target.value) || 1) })
            }
            className="h-9"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mastery-proc" className="text-[0.7rem]">Average Proc Multiplier</Label>
          <select
            id="mastery-proc"
            value={String(value.proc)}
            onChange={(e) => patch({ proc: parseFloat(e.target.value) })}
            className="field-select h-9"
          >
            <option value="2.5">2.5× (Master standard)</option>
            <option value="2.8">2.8× (High Master)</option>
            <option value="3.0">3.0× (Guru standard)</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3" role="tablist" aria-label="Recipe tiers">
        {ALCHEMY_CATEGORIES.map((cat) => {
          const active = tab === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setTab(cat.id);
                setQuery("");
              }}
              className={cn(
                "flex min-h-11 min-w-[6.5rem] flex-1 items-center justify-center gap-1.5 rounded-[10px] border px-2.5 py-2.5 text-sm font-bold transition-[background-color,color,border-color,box-shadow] duration-150",
                active
                  ? "border-cyan-400 bg-cyan-400/20 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.25)]"
                  : "border-white/10 bg-[rgba(12,18,32,0.4)] text-muted-foreground hover:border-cyan-400/40 hover:text-foreground",
              )}
            >
              <span>{cat.label}</span>
              <small className={cn("hidden font-medium italic sm:inline", active ? "text-cyan-200/70" : "text-muted-foreground")}>
                ({cat.hint})
              </small>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter recipes on this tab by name…"
          className="bg-[rgba(12,18,32,0.55)] pl-10"
          aria-label="Filter recipes"
        />
      </div>

      <div className="flex flex-col gap-3" role="tabpanel">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-[rgba(12,18,32,0.4)] px-4 py-10 text-center text-sm text-muted-foreground">
            No recipes match "{query}".
          </p>
        ) : (
          filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              crafts={value.crafts[recipe.id] ?? 1000}
              craftTime={value.craftTime}
              proc={value.proc}
              onCrafts={(n) =>
                setValue((prev) => ({
                  ...prev,
                  crafts: { ...prev.crafts, [recipe.id]: n },
                }))
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
