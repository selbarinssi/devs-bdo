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
import { useCloudStorage } from "@/lib/user-sync";
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
  return crafts * (1 + proc / 100);
}

export function AlchemyPlanner() {
  const { value, setValue } = useCloudStorage<AlchemyState>(STORAGE_KEY, DEFAULT_STATE);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<AlchemyCategory | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipeData.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q))
      );
    });
  }, [query, category]);

  const setCraft = (id: string, n: number) => {
    setValue((prev) => ({
      ...prev,
      crafts: { ...prev.crafts, [id]: Math.max(0, Math.round(n) || 0) },
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="glass flex flex-col gap-3 p-3 sm:flex-row sm:items-end sm:gap-3 sm:p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Label>Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Recipe Or Material…"
              className="h-10 pl-8"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 sm:w-40">
          <Label>Category</Label>
          <select
            className="field-select h-10"
            value={category}
            onChange={(e) => setCategory(e.target.value as AlchemyCategory | "all")}
          >
            <option value="all">All</option>
            {ALCHEMY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:w-56">
          <div className="flex flex-col gap-1">
            <Label className="text-[0.65rem]">Craft Time (s)</Label>
            <Input
              type="number"
              step="0.1"
              value={value.craftTime}
              onChange={(e) =>
                setValue((p) => ({ ...p, craftTime: parseFloat(e.target.value) || 0 }))
              }
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[0.65rem]">Proc %</Label>
            <Input
              type="number"
              step="0.1"
              value={value.proc}
              onChange={(e) => setValue((p) => ({ ...p, proc: parseFloat(e.target.value) || 0 }))}
              className="h-10"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map((recipe) => {
          const crafts = value.crafts[recipe.id] || 0;
          const yieldN = estimatedYield(recipe, crafts, value.proc);
          const time = crafts * value.craftTime;
          return (
            <div key={recipe.id} className="glass p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-3">
                <ItemGlyph name={recipe.name} className="size-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{recipe.name}</p>
                  <p className="text-[0.7rem] text-muted-foreground">{recipe.category}</p>
                </div>
                <Input
                  type="number"
                  min={0}
                  value={crafts || ""}
                  onChange={(e) => setCraft(recipe.id, parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="h-9 w-20 text-sm"
                />
                <div className="w-28 text-right text-xs">
                  <p className="font-mono font-bold tabular-nums text-cyan-300">
                    {formatNumber(Math.round(yieldN))}
                  </p>
                  <p className="text-muted-foreground">{formatTime(time)}</p>
                </div>
              </div>
              {recipe.ingredients?.length ? (
                <ul className="mt-2 flex flex-wrap gap-1.5 border-t border-white/5 pt-2">
                  {recipe.ingredients.map((ing) => (
                    <li
                      key={ing.name}
                      className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[0.65rem] text-muted-foreground"
                    >
                      <ItemGlyph name={ing.name} className="size-4" />
                      <span>
                        {ing.name} ×{formatNumber(ing.qty * (crafts || 1))}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="glass px-4 py-8 text-center text-sm text-muted-foreground">
            No Recipes Match.
          </div>
        )}
      </div>
    </div>
  );
}
