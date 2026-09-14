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

function applyOwned(
  root: MatNode,
  counts: Record<string, number>,
  nodeId: string,
  value: number,
  ship: ShipKey,
): Record<string, number> {
  const next = { ...counts };
  const node = findNode(root, nodeId);
  if (!node) return next;
  next[treeKey(ship, nodeId)] = clamp(node, value);
  if (value >= node.req && node.children?.length) {
    for (const ch of node.children) {
      const cid = ch.id;
      if (cid) next[treeKey(ship, cid)] = ch.req;
    }
  }
  return next;
}

export function ShipTracker() {
  const { value, setValue } = useCloudStorage<ShipSaveState>(SHIP_STORAGE_KEY, DEFAULT_SHIP_STATE);
  const [ship, setShip] = useState<ShipKey>((value.activeShip as ShipKey) || BASE_SHIPS[0]!.value);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const shipState = value;
  const targets = upgradesFor(ship);
  const [target, setTarget] = useState(targets[0]?.key ?? "");

  const tree = treeData[ship]?.[target];
  const flat = useMemo(() => (tree ? flattenTree(tree) : []), [tree]);

  const progress = useMemo(() => {
    let totalReq = 0;
    let totalOwned = 0;
    for (const { node, id } of flat) {
      if (!node?.req) continue;
      totalReq += node.req;
      totalOwned += Math.min(node.req, shipState.progress[treeKey(ship, id)] ?? 0);
    }
    return {
      pct: totalReq ? Math.round((totalOwned / totalReq) * 100) : 0,
      totalOwned,
      totalReq,
    };
  }, [flat, ship, shipState.progress]);

  const setOwned = (nodeId: string, n: number) => {
    if (!tree) return;
    setValue((prev) => ({
      ...prev,
      activeShip: ship,
      progress: applyOwned(tree, prev.progress, nodeId, n, ship),
    }));
  };

  const onShipChange = (s: ShipKey) => {
    setShip(s);
    const ups = upgradesFor(s);
    setTarget(ups[0]?.key ?? "");
    setValue((prev) => ({ ...prev, activeShip: s }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="glass flex flex-wrap items-center gap-3 p-4">
        <div className="flex items-center gap-2">
          <Ship className="size-5 text-cyan-300" />
          <select
            className="field-select h-9 min-w-[9rem]"
            value={ship}
            onChange={(e) => onShipChange(e.target.value as ShipKey)}
          >
            {BASE_SHIPS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <select
          className="field-select h-9 min-w-[9rem]"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        >
          {targets.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
        <div className="ml-auto flex min-w-[10rem] flex-1 flex-col gap-1 sm:max-w-xs">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums text-foreground">{progress.pct}%</span>
          </div>
          <Progress value={progress.pct} />
        </div>
      </div>

      {!tree && (
        <p className="text-sm text-muted-foreground">No upgrade tree for this selection.</p>
      )}

      {tree && (
        <div className="glass flex flex-col gap-2 p-3">
          {renderNodes(tree, "", ship, shipState, setOwned, expanded, setExpanded, 0)}
        </div>
      )}

      <p className="text-center text-[0.78rem] text-muted-foreground">
        Progress syncs to your account when signed in.
      </p>
    </div>
  );
}

function renderNodes(
  node: MatNode,
  pathPrefix: string,
  ship: ShipKey,
  state: ShipSaveState,
  setOwned: (id: string, n: number) => void,
  expanded: Record<string, boolean>,
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  depth: number,
): React.ReactNode {
  const id = node.id || pathPrefix || "root";
  if (!node.req && node.children?.length) {
    return node.children.map((ch, i) =>
      renderNodes(ch, `${id}.${i}`, ship, state, setOwned, expanded, setExpanded, depth),
    );
  }
  if (!node.req) return null;

  const owned = state.progress[treeKey(ship, id)] ?? 0;
  const done = owned >= node.req;
  const inProgress = owned > 0 && !done;
  const hasChildren = Boolean(node.children?.length);
  const open = expanded[id] ?? depth < 2;

  return (
    <div key={id} className={cn(depth > 0 && "ml-3 border-l border-white/10 pl-3")}>
      <div
        className={cn(
          "mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
          done && "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
          inProgress && "border border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
          !done && !inProgress && "border border-white/15 bg-[rgba(8,14,26,0.5)] text-muted-foreground",
        )}
      >
        {hasChildren && (
          <button
            type="button"
            className="text-muted-foreground"
            onClick={() => setExpanded((p) => ({ ...p, [id]: !open }))}
          >
            <ChevronDown className={cn("size-3.5 transition", !open && "-rotate-90")} />
          </button>
        )}
        <ItemGlyph name={node.name} className="size-7 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{node.name}</p>
          <p className="text-[0.65rem] text-muted-foreground">
            {owned}/{node.req}
          </p>
        </div>
        <button
          type="button"
          className="btn-ghost flex size-7 items-center justify-center p-0"
          onClick={() => setOwned(id, clamp(node, owned - 1))}
        >
          <Minus className="size-3.5" />
        </button>
        <button
          type="button"
          className="btn-ghost flex size-7 items-center justify-center p-0"
          onClick={() => setOwned(id, clamp(node, owned + 1))}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      {hasChildren && open &&
        node.children!.map((ch, i) =>
          renderNodes(ch, `${id}.${i}`, ship, state, setOwned, expanded, setExpanded, depth + 1),
        )}
    </div>
  );
}
