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
      return r.name.toLowerCase().includes(q);
    });
  }, [query, category]);

  const setCraft = (id: string, n: number) => {
    setValue((prev) => ({
      ...prev,
      crafts: { ...prev.crafts, [id]: Math.max(0, n) },
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="glass flex flex-col gap-3 p-3 sm:flex-row sm:items-end sm:p-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label>Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Recipe name…"
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

      <ul className="flex flex-col gap-2">
        {filtered.map((r) => {
          const crafts = value.crafts[r.id] || 0;
          const yieldN = estimatedYield(r, crafts, value.proc);
          const time = crafts * value.craftTime;
          return (
            <li key={r.id} className="glass flex flex-wrap items-center gap-3 px-3 py-2.5 sm:px-4">
              <ItemGlyph name={r.name} className="size-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.name}</p>
                <p className="text-[0.7rem] text-muted-foreground">{r.category}</p>
              </div>
              <Input
                type="number"
                min={0}
                value={crafts || ""}
                onChange={(e) => setCraft(r.id, parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="h-9 w-20 text-sm"
              />
              <div className="w-24 text-right text-xs">
                <p className="font-mono tabular-nums text-cyan-300">{formatNumber(Math.round(yieldN))}</p>
                <p className="text-muted-foreground">{formatTime(time)}</p>
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="glass px-4 py-8 text-center text-sm text-muted-foreground">No Recipes Match.</li>
        )}
      </ul>
    </div>
  );
}
