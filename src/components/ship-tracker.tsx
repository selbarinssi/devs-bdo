import { ChevronDown, Info, Minus, Plus, Ship } from "lucide-react";
import { useMemo, useState } from "react";
import { ItemGlyph } from "@/components/item-glyph";
import { Progress } from "@/components/ui/progress";
import {
  BASE_SHIPS,
  DEFAULT_SHIP_STATE,
  SHIP_STORAGE_KEY,
  descendantsOf,
  findNode,
  findParent,
  flattenTree,
  treeData,
  treeKey,
  upgradesFor,
  type MatNode,
  type ShipKey,
  type ShipSaveState,
} from "@/data/ships";
import { useCloudStorage } from "@/lib/user-sync";
import { cn, formatNumber } from "@/lib/utils";

function clamp(node: MatNode, n: number) {
  return Math.max(0, Math.min(node.req, Number.isFinite(n) ? n : 0));
}

function ownedOf(state: ShipSaveState, ship: ShipKey, path: string) {
  return state.progress[treeKey(ship, path)] ?? 0;
}

function MatRow({
  node,
  path,
  ship,
  state,
  setOwned,
  depth,
}: {
  node: MatNode;
  path: string;
  ship: ShipKey;
  state: ShipSaveState;
  setOwned: (path: string, n: number) => void;
  depth: number;
}) {
  const owned = ownedOf(state, ship, path);
  const done = owned >= node.req;
  const inProgress = owned > 0 && !done;
  const hasChildren = Boolean(node.children?.length);

  return (
    <div className={cn("flex flex-col gap-1", depth > 0 && "ml-3 border-l border-white/10 pl-3")}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
          done && "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
          inProgress && "border border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
          !done && !inProgress && "border border-white/15 bg-[rgba(8,14,26,0.5)] text-muted-foreground",
          hasChildren && done && "border-emerald-400/30",
          hasChildren && inProgress && "border-emerald-400/40",
          hasChildren && !done && !inProgress && "border-white/10",
          !hasChildren && inProgress && "bg-cyan-400/5",
        )}
      >
        <ItemGlyph name={node.name} className="size-7 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{node.name}</p>
          <p className="text-[0.65rem] text-muted-foreground">
            {owned}/{node.req}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn-ghost flex size-7 items-center justify-center p-0"
            onClick={() => setOwned(path, clamp(node, owned - 1))}
          >
            <Minus className="size-3.5" />
          </button>
          <button
            type="button"
            className="btn-ghost flex size-7 items-center justify-center p-0"
            onClick={() => setOwned(path, clamp(node, owned + 1))}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>
      {node.children?.map((ch, i) => (
        <MatRow
          key={`${path}.${i}`}
          node={ch}
          path={`${path}.${i}`}
          ship={ship}
          state={state}
          setOwned={setOwned}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export function ShipTracker() {
  const { value, setValue } = useCloudStorage<ShipSaveState>(SHIP_STORAGE_KEY, DEFAULT_SHIP_STATE);
  const [ship, setShip] = useState<ShipKey>((value.activeShip as ShipKey) || "caravel");
  const [openUpgrades, setOpenUpgrades] = useState<Record<string, boolean>>({});

  const upgrades = upgradesFor(ship);
  const flat = useMemo(() => flattenTree(ship), [ship]);

  const progress = useMemo(() => {
    let total = 0;
    let got = 0;
    for (const { path, node } of flat) {
      total += node.req;
      got += Math.min(node.req, ownedOf(value, ship, path));
    }
    const pct = total ? Math.round((got / total) * 100) : 0;
    return { total, got, pct };
  }, [flat, value, ship]);

  const setOwned = (path: string, n: number) => {
    const key = treeKey(ship, path);
    setValue((prev) => ({
      ...prev,
      activeShip: ship,
      progress: { ...prev.progress, [key]: n },
    }));
  };

  const onShipChange = (next: ShipKey) => {
    setShip(next);
    setValue((prev) => ({ ...prev, activeShip: next }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="glass flex flex-wrap items-center gap-3 p-4">
        <Ship className="size-5 text-cyan-300" />
        <select
          className="field-select h-9 min-w-[10rem]"
          value={ship}
          onChange={(e) => onShipChange(e.target.value as ShipKey)}
        >
          {BASE_SHIPS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="ml-auto flex min-w-[12rem] flex-1 flex-col gap-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums text-foreground">{progress.pct}%</span>
          </div>
          <Progress value={progress.pct} />
        </div>
      </div>

      {upgrades.map((up) => {
        const open = openUpgrades[up.key] ?? true;
        return (
          <div key={up.key} className="glass overflow-hidden">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-3 text-left"
              onClick={() => setOpenUpgrades((p) => ({ ...p, [up.key]: !open }))}
            >
              <ChevronDown className={cn("size-4 transition", !open && "-rotate-90")} />
              <span className="font-semibold">{up.label}</span>
            </button>
            {open && (
              <div className="flex flex-col gap-2 border-t border-white/10 px-4 py-3">
                {(treeData[ship]?.[up.key] ?? []).map((node, i) => (
                  <MatRow
                    key={i}
                    node={node}
                    path={`${up.key}.${i}`}
                    ship={ship}
                    state={value}
                    setOwned={setOwned}
                    depth={0}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      <p className="mt-2 text-center text-[0.78rem] text-muted-foreground">
        Progress syncs to your account when signed in.
      </p>
    </div>
  );
}
