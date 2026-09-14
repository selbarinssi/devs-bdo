import { Info, Minus, Plus, Ship } from "lucide-react";
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
  next: number,
): Record<string, number> {
  const node = findNode(root, nodeId);
  if (!node) return counts;
  const owned = clamp(node, next);
  const nextCounts = { ...counts, [node.id]: owned };

  const isRoot = root.id === node.id;
  const kids = descendantsOf(node);
  if (kids.length && !isRoot) {
    if (owned >= node.req) {
      for (const d of kids) nextCounts[d.id] = d.req;
    } else if (owned === 0) {
      for (const d of kids) nextCounts[d.id] = 0;
    }
  }

  let cursor: MatNode | null = node;
  while (cursor) {
    const parent = findParent(root, cursor.id);
    if (!parent) break;
    const allDesc = descendantsOf(parent);
    const allDone = allDesc.every((d) => (nextCounts[d.id] ?? 0) >= d.req);
    nextCounts[parent.id] = allDone ? parent.req : 0;
    cursor = parent;
  }

  return nextCounts;
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full border transition-[background-color,border-color] duration-150",
        checked ? "border-emerald-400 bg-emerald-400/25" : "border-white/15 bg-[rgba(8,14,26,0.6)]",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-5 rounded-full transition-transform duration-150",
          checked ? "translate-x-5 bg-emerald-400" : "bg-slate-500",
        )}
      />
    </button>
  );
}

function Stepper({
  node,
  owned,
  onOwned,
}: {
  node: MatNode;
  owned: number;
  onOwned: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="btn-ghost flex size-7 items-center justify-center p-0"
        onClick={() => onOwned(clamp(node, owned - 1))}
        aria-label="Decrease"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-[3rem] text-center text-xs tabular-nums">
        {owned}/{node.req}
      </span>
      <button
        type="button"
        className="btn-ghost flex size-7 items-center justify-center p-0"
        onClick={() => onOwned(clamp(node, owned + 1))}
        aria-label="Increase"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

function StatusBadge({ owned, req }: { owned: number; req: number }) {
  const done = owned >= req;
  const inProgress = owned > 0 && !done;
  return (
    <span
      className={cn(
        "hub-tiny rounded-md px-1.5 py-0.5 font-semibold",
        done && "bg-emerald-400/20 text-emerald-200",
        inProgress && "bg-cyan-400/15 text-cyan-200",
        !done && !inProgress && "bg-white/5 text-muted-foreground",
      )}
    >
      {done ? "Done" : inProgress ? "In Progress" : "Todo"}
    </span>
  );
}

function MaterialRow({
  node,
  counts,
  onOwned,
}: {
  node: MatNode;
  counts: Record<string, number>;
  onOwned: (id: string, n: number) => void;
}) {
  const owned = counts[node.id] ?? 0;
  const [showHow, setShowHow] = useState(false);
  const hasChildren = Boolean(node.children?.length);
  const done = owned >= node.req;

  return (
    <div className="rounded-lg border border-white/10 bg-[rgba(8,14,26,0.4)] p-2.5">
      <div className="flex items-center gap-2">
        <ItemGlyph name={node.name} size={30} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-sm font-medium", done ? "text-emerald-200" : "text-foreground")}>
              {node.name}
            </span>
            <StatusBadge owned={owned} req={node.req} />
          </div>
        </div>
        <button
          type="button"
          aria-label={`How to obtain ${node.name}`}
          onClick={() => setShowHow((v) => !v)}
          className="flex size-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-muted-foreground hover:border-emerald-400 hover:text-emerald-300"
        >
          <Info className="size-3.5" strokeWidth={2} />
        </button>
        <Stepper node={node} owned={owned} onOwned={(n) => onOwned(node.id, n)} />
      </div>
      {showHow && node.how && <p className="hub-meta mt-2">{node.how}</p>}
      {hasChildren && (
        <div className="mt-2 space-y-2 border-t border-white/10 pt-2 pl-2">
          {node.children!.map((ch) => (
            <MaterialRow key={ch.id} node={ch} counts={counts} onOwned={onOwned} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ShipTracker() {
  const { value, setValue } = useCloudStorage<ShipSaveState>(SHIP_STORAGE_KEY, DEFAULT_SHIP_STATE);
  const [confirmReset, setConfirmReset] = useState(false);

  const current = (value.lastCurrentShip || "") as ShipKey | "";
  const target = value.lastTargetUpgrade || "";
  const activeTree = current && target ? treeData[current]?.[target] : undefined;
  const key = current && target ? treeKey(current, target) : "";
  const counts = (key && value.trees[key]) || {};

  const targets = current ? upgradesFor(current) : [];

  const progress = useMemo(() => {
    if (!activeTree) return { pct: 0, owned: 0, req: 0 };
    const nodes = flattenTree(activeTree);
    let req = 0;
    let owned = 0;
    for (const n of nodes) {
      if (!n?.req) continue;
      req += n.req;
      owned += Math.min(n.req, counts[n.id] ?? 0);
    }
    return { pct: req > 0 ? Math.round((owned / req) * 100) : 0, owned, req };
  }, [activeTree, counts]);

  const setCurrent = (ship: ShipKey | "") => {
    setValue((prev) => ({
      ...prev,
      lastCurrentShip: ship,
      lastTargetUpgrade: "",
    }));
    setConfirmReset(false);
  };

  const setTarget = (upgrade: string) => {
    setValue((prev) => ({ ...prev, lastTargetUpgrade: upgrade }));
    setConfirmReset(false);
  };

  const setOwned = (id: string, n: number) => {
    if (!activeTree || !key) return;
    setValue((prev) => {
      const nextCounts = applyOwned(activeTree, prev.trees[key] || {}, id, n);
      return { ...prev, trees: { ...prev.trees, [key]: nextCounts } };
    });
  };

  const reset = () => {
    if (!key) return;
    setValue((prev) => ({
      ...prev,
      trees: { ...prev.trees, [key]: {} },
    }));
    setConfirmReset(false);
  };

  const components = activeTree?.children?.filter((c) => c.children?.length) ?? [];
  const materials = activeTree?.children?.filter((c) => !c.children?.length) ?? [];
  const finalOwned = activeTree ? (counts[activeTree.id] ?? 0) : 0;
  const finalDone = activeTree ? finalOwned >= activeTree.req : false;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 grid gap-4 rounded-xl border border-white/10 bg-[rgba(12,18,32,0.55)] p-4 shadow-[var(--shadow-border)] sm:grid-cols-2 sm:p-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="current-ship" className="hub-label">
            Current Base Ship
          </label>
          <select
            id="current-ship"
            className="field-select"
            value={current}
            onChange={(e) => setCurrent((e.target.value as ShipKey) || "")}
          >
            <option value="" disabled>
              Select Base Ship…
            </option>
            {BASE_SHIPS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="target-ship" className="hub-label">
            Target Upgrade
          </label>
          <select
            id="target-ship"
            className="field-select"
            value={target}
            disabled={!current}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="" disabled>
              Select Target Upgrade…
            </option>
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!activeTree ? (
        <div className="rounded-xl border border-white/10 bg-[rgba(12,18,32,0.4)] px-6 py-16 text-center shadow-[var(--shadow-border)]">
          <Ship className="mx-auto mb-3 size-10 text-cyan-300" strokeWidth={1.5} aria-hidden />
          <p className="text-sm text-muted-foreground">
            Select A Base Ship And Target Upgrade Above To Begin Tracking.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-5 rounded-xl border border-white/10 bg-[rgba(12,18,32,0.55)] p-4 shadow-[var(--shadow-border)] sm:p-5">
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-muted-foreground">Overall Upgrade Completion</span>
              <span className="font-semibold tabular-nums text-emerald-300">
                {progress.pct}% ({formatNumber(progress.owned)} / {formatNumber(progress.req)})
              </span>
            </div>
            <Progress value={progress.pct} />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {!confirmReset ? (
              <button type="button" className="btn-ghost h-8 text-xs" onClick={() => setConfirmReset(true)}>
                Reset This Tree
              </button>
            ) : (
              <>
                <span className="text-xs text-muted-foreground">Reset Owned Stock Only For {activeTree.name}?</span>
                <button type="button" className="btn-primary h-8 text-xs" onClick={reset}>
                  Confirm
                </button>
                <button type="button" className="btn-ghost h-8 text-xs" onClick={() => setConfirmReset(false)}>
                  Cancel
                </button>
              </>
            )}
          </div>

          <div className="mb-4 rounded-xl border border-white/10 bg-[rgba(12,18,32,0.55)] p-4">
            <div className="flex flex-wrap items-center gap-3">
              <ItemGlyph name={activeTree.name} size={40} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{activeTree.name}</p>
                <StatusBadge owned={finalOwned} req={activeTree.req} />
              </div>
              <ToggleSwitch
                checked={finalDone}
                label="Mark complete"
                onChange={(v) => setOwned(activeTree.id, v ? activeTree.req : 0)}
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{activeTree.how}</p>
          </div>

          <div className="flex flex-col gap-2">
            {components.length > 0 && (
              <>
                <h4 className="hub-label mt-2">Components</h4>
                {components.map((c) => (
                  <MaterialRow key={c.id} node={c} counts={counts} onOwned={setOwned} />
                ))}
              </>
            )}
            {materials.length > 0 && (
              <>
                <h4 className="hub-label mt-2">Materials</h4>
                {materials.map((c) => (
                  <MaterialRow key={c.id} node={c} counts={counts} onOwned={setOwned} />
                ))}
              </>
            )}
          </div>

          <p className="hub-footer mt-6 text-center">Progress syncs to your account when signed in.</p>
        </>
      )}
    </div>
  );
}
