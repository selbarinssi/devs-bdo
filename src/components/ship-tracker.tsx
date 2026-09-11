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
import { useLocalStorage } from "@/lib/storage";
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
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label={`Decrease ${node.name}`}
        onClick={() => onOwned(owned - 1)}
        className="flex size-9 items-center justify-center rounded-md border border-white/15 bg-[rgba(8,14,26,0.6)] text-foreground transition-[border-color,color] duration-150 hover:border-emerald-400 hover:text-emerald-300"
      >
        <Minus className="size-3.5" strokeWidth={2.25} />
      </button>
      <input
        type="number"
        min={0}
        max={node.req}
        value={owned}
        aria-label={`${node.name} owned`}
        onChange={(e) => onOwned(parseInt(e.target.value, 10) || 0)}
        className="h-9 w-16 rounded-md border border-white/15 bg-[rgba(8,14,26,0.7)] text-center font-serif text-sm font-semibold tabular-nums text-foreground outline-none focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/20"
      />
      <span className="whitespace-nowrap text-xs text-muted-foreground">/ {formatNumber(node.req)}</span>
      <button
        type="button"
        aria-label={`Increase ${node.name}`}
        onClick={() => onOwned(owned + 1)}
        className="flex size-9 items-center justify-center rounded-md border border-white/15 bg-[rgba(8,14,26,0.6)] text-foreground transition-[border-color,color] duration-150 hover:border-emerald-400 hover:text-emerald-300"
      >
        <Plus className="size-3.5" strokeWidth={2.25} />
      </button>
    </div>
  );
}

function StatusBadge({ owned, req }: { owned: number; req: number }) {
  const done = owned >= req;
  const inProgress = owned > 0 && !done;
  const needed = req - owned;
  return (
    <span
      className={cn(
        "min-w-[4.25rem] rounded-full border px-2.5 py-1 text-center text-[0.7rem] font-bold",
        done && "border-emerald-400 bg-emerald-400/15 text-emerald-300",
        inProgress && "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
        !done && !inProgress && "border-white/15 bg-[rgba(8,14,26,0.5)] text-muted-foreground",
      )}
    >
      {done ? "Done" : req === 1 ? "Pending" : `Need ${formatNumber(needed)}`}
    </span>
  );
}

function NodeRow({
  node,
  counts,
  onOwned,
}: {
  node: MatNode;
  counts: Record<string, number>;
  onOwned: (id: string, n: number) => void;
}) {
  const hasChildren = Boolean(node.children?.length);
  const [open, setOpen] = useState(true);
  const [showHow, setShowHow] = useState(false);
  const owned = counts[node.id] ?? 0;
  const done = owned >= node.req;
  const inProgress = owned > 0 && !done;

  return (
    <div
      className={cn(
        hasChildren
          ? "my-2 rounded-[10px] border bg-[rgba(12,18,32,0.5)] p-3"
          : "border-b border-white/10 py-2.5 last:border-b-0",
        hasChildren && done && "border-emerald-400/60 bg-emerald-400/10 shadow-[0_0_18px_rgba(52,211,153,0.18)]",
        hasChildren && inProgress && "border-emerald-400/40",
        hasChildren && !done && !inProgress && "border-white/10",
        !hasChildren && done && "bg-emerald-400/15",
        !hasChildren && inProgress && "bg-cyan-400/5",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {hasChildren ? (
            <button
              type="button"
              aria-expanded={open}
              aria-label={`${open ? "Collapse" : "Expand"} ${node.name}`}
              onClick={() => setOpen((v) => !v)}
              className="flex size-7 shrink-0 items-center justify-center text-emerald-300"
            >
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-150",
                  !open && "-rotate-90",
                )}
              />
            </button>
          ) : (
            <span className="w-4 shrink-0 text-center text-muted-foreground" aria-hidden>
              ·
            </span>
          )}
          <ItemGlyph name={node.name} size={30} />
          <span className={cn("text-sm", hasChildren ? "font-semibold text-foreground" : "font-medium text-foreground")}>
            {node.name}
          </span>
          <button
            type="button"
            aria-label={`How To Obtain ${node.name}`}
            aria-expanded={showHow}
            onClick={() => setShowHow((v) => !v)}
            className="flex size-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-muted-foreground transition-[border-color,color] duration-150 hover:border-emerald-400 hover:text-emerald-300"
          >
            <Info className="size-3.5" strokeWidth={2} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          {node.req === 1 ? (
            <ToggleSwitch
              checked={done}
              onChange={(v) => onOwned(node.id, v ? node.req : 0)}
              label={`Mark ${node.name} Complete`}
            />
          ) : (
            <Stepper node={node} owned={owned} onOwned={(n) => onOwned(node.id, n)} />
          )}
          <StatusBadge owned={owned} req={node.req} />
        </div>
      </div>
      {showHow ? (
        <p className="mt-2 rounded-md bg-[rgba(8,14,26,0.6)] px-2.5 py-2 text-[0.82rem] text-muted-foreground">
          <strong className="font-semibold text-emerald-300">How To Get It: </strong>
          {node.how}
        </p>
      ) : null}
      {hasChildren && open ? (
        <div className="mt-3 ml-2 border-l-2 border-white/10 pl-4">
          {node.children!.map((child) => (
            <NodeRow key={child.id} node={child} counts={counts} onOwned={onOwned} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ShipTracker() {
  const { value, setValue } = useLocalStorage<ShipSaveState>(SHIP_STORAGE_KEY, DEFAULT_SHIP_STATE);
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
          <label htmlFor="current-ship" className="text-xs font-bold uppercase tracking-wider text-cyan-300">
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
          <label htmlFor="target-ship" className="text-xs font-bold uppercase tracking-wider text-cyan-300">
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

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-foreground">Crafting Tree For {activeTree.name}</h3>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex min-h-11 items-center rounded-md border border-rose-400/40 px-3.5 text-sm font-semibold text-rose-400 transition-[background-color,color] duration-150 hover:bg-rose-500 hover:text-white"
            >
              Reset This Ship
            </button>
          </div>

          {confirmReset ? (
            <div className="mb-5 rounded-xl border border-rose-400/30 bg-[rgba(12,18,32,0.5)] p-4 shadow-[var(--shadow-border)]">
              <p className="text-sm text-foreground">
                Reset Owned Stock Only For {activeTree.name}?
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex h-11 items-center rounded-md bg-rose-500 px-4 text-sm font-semibold text-white"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="inline-flex h-11 items-center rounded-md border border-white/15 bg-[rgba(8,14,26,0.6)] px-4 text-sm font-semibold text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          <div
            className={cn(
              "mb-4 rounded-xl border bg-[rgba(12,18,32,0.55)] p-4 shadow-[var(--shadow-border)] sm:p-5",
              finalDone ? "border-emerald-400 bg-emerald-400/10 shadow-[0_0_18px_rgba(52,211,153,0.18)]" : "border-white/10",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <ItemGlyph name={activeTree.name} size={40} />
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-cyan-300">
                    Final Step
                  </p>
                  <p className="font-semibold text-foreground">{activeTree.name}</p>
                </div>
              </div>
              <StatusBadge owned={finalOwned} req={activeTree.req} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{activeTree.how}</p>
            <div className="mt-4 flex min-h-11 w-fit items-center gap-3">
              <ToggleSwitch
                checked={finalDone}
                onChange={(v) => setOwned(activeTree.id, v ? activeTree.req : 0)}
                label="I've Turned This In"
              />
              <span className="text-sm font-medium text-foreground">I've Turned This In</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[rgba(12,18,32,0.55)] px-4 py-2 shadow-[var(--shadow-border)] sm:px-5">
            {components.length ? (
              <>
                <p className="pt-4 pb-1 text-sm font-semibold text-cyan-300">Components To Craft</p>
                {components.map((c) => (
                  <NodeRow key={c.id} node={c} counts={counts} onOwned={setOwned} />
                ))}
              </>
            ) : null}
            {materials.length ? (
              <>
                <p className="border-t border-white/10 pt-4 pb-1 text-sm font-semibold text-cyan-300 first:border-t-0">
                  Materials To Gather
                </p>
                {materials.map((c) => (
                  <NodeRow key={c.id} node={c} counts={counts} onOwned={setOwned} />
                ))}
              </>
            ) : null}
          </div>

          <p className="mt-6 text-center text-[0.78rem] text-muted-foreground">
            Progress Saves Automatically In This Browser.
          </p>
        </>
      )}
    </div>
  );
}
