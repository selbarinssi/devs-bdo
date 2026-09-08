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

/**
 * Standard alchemy uses mastery proc.
 * Simple Alchemy (draughts / harmony, baseExp 0) has fixed output:
 *  - Party Harmony variants → 1 per craft
 *  - Draughts & base Harmony → 10 per craft
 */
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
    <article className="grid gap-5 rounded-xl border border-stone bg-paper p-4 shadow-[var(--shadow-border)] transition-[border-color,box-shadow] duration-150 hover:border-teal hover:shadow-[var(--shadow-border-hover)] sm:p-5 lg:grid-cols-[minmax(0,280px)_1fr_minmax(0,200px)] lg:items-center">
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border-2 border-teal bg-ivory shadow-[0_0_10px_rgba(32,89,92,0.18)]">
          <ItemGlyph name={recipe.name} size={44} />
        </div>
        <div className="min-w-0">
          <h3 className="text-[1.05rem] font-bold leading-snug text-ink">{recipe.name}</h3>
          <div className="mt-2 flex items-center gap-2">
            <label htmlFor={`crafts-${recipe.id}`} className="text-xs font-semibold text-muted">
              Batch crafts
            </label>
            <Input
              id={`crafts-${recipe.id}`}
              type="number"
              min={1}
              value={crafts}
              onChange={(e) => onCrafts(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="h-9 w-[5.5rem] bg-ivory text-right font-bold tabular-nums"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {recipe.ingredients.map((ing) => (
            <div
              key={ing.name}
              className="flex items-center gap-2 rounded-lg border border-stone bg-ivory px-2.5 py-1.5"
            >
              <ItemGlyph name={ing.name} size={28} />
              <div className="min-w-0">
                <p className="truncate text-[0.82rem] text-ink" title={ing.name}>
                  {ing.name}
                </p>
                <p className="text-[0.82rem] font-bold tabular-nums text-teal">
                  {formatNumber(ing.qty * crafts)}
                </p>
              </div>
            </div>
          ))}
        </div>
        {recipe.spot ? (
          <p className="rounded-r-md border-l-[3px] border-teal bg-teal/10 px-3 py-2 text-[0.8rem] text-ink">
            <strong className="mr-1.5 text-teal">Note:</strong>
            {recipe.spot}
          </p>
        ) : null}
      </div>

      <dl className="flex flex-col gap-1.5 rounded-[10px] border border-stone bg-ivory p-3 sm:p-4">
        <div className="flex justify-between gap-3 text-[0.85rem]">
          <dt className="text-muted">Estimated yields</dt>
          <dd className="font-bold tabular-nums text-teal">{formatNumber(totalYield)}</dd>
        </div>
        <div className="flex justify-between gap-3 text-[0.85rem]">
          <dt className="text-muted">Crafting time</dt>
          <dd className="font-bold tabular-nums text-teal">{formatTime(totalSeconds)}</dd>
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
      <div className="grid gap-4 rounded-xl border border-stone bg-paper p-4 shadow-[var(--shadow-border)] sm:grid-cols-2 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="craft-time">Crafting Speed (Seconds)</Label>
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
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mastery-proc">Average Proc Multiplier</Label>
          <select
            id="mastery-proc"
            value={String(value.proc)}
            onChange={(e) => patch({ proc: parseFloat(e.target.value) })}
            className="field-select"
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
                "flex min-h-12 min-w-[7.5rem] flex-1 items-center justify-center gap-2 rounded-[10px] border px-3 py-3 font-bold transition-[background-color,color,border-color,box-shadow] duration-150",
                active
                  ? "border-teal bg-teal text-ivory shadow-[0_4px_14px_rgba(32,89,92,0.30)]"
                  : "border-stone bg-paper text-muted hover:border-teal hover:text-ink",
              )}
            >
              <span>{cat.label}</span>
              <small className={cn("hidden font-medium italic sm:inline", active ? "text-ivory/75" : "text-muted")}>
                ({cat.hint})
              </small>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter recipes on this tab by name…"
          className="bg-paper pl-10"
          aria-label="Filter recipes"
        />
      </div>

      <div className="flex flex-col gap-4" role="tabpanel">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-stone bg-paper px-4 py-10 text-center text-sm text-muted">
            No recipes match “{query}”.
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
