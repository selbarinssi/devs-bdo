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

  // Don't cascade from the final ship step — unchecking "turned in"
  // must not wipe gathered materials.
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
        checked ? "border-teal bg-teal/25" : "border-stone bg-ivory",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-5 rounded-full transition-transform duration-150",
          checked ? "translate-x-5 bg-teal" : "bg-muted",
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
        className="flex size-9 items-center justify-center rounded-md border border-stone bg-ivory text-ink transition-[border-color,color] duration-150 hover:border-teal hover:text-teal"
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
        className="h-9 w-16 rounded-md border border-stone bg-ivory text-center font-serif text-sm font-semibold tabular-nums text-ink outline-none focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/20"
      />
      <span className="whitespace-nowrap text-xs text-muted">/ {formatNumber(node.req)}</span>
      <button
        type="button"
        aria-label={`Increase ${node.name}`}
        onClick={() => onOwned(owned + 1)}
        className="flex size-9 items-center justify-center rounded-md border border-stone bg-ivory text-ink transition-[border-color,color] duration-150 hover:border-teal hover:text-teal"
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
        done && "border-teal bg-teal/15 text-teal",
        inProgress && "border-teal/40 bg-teal/10 text-teal",
        !done && !inProgress && "border-stone bg-ivory text-muted",
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
          ? "my-2 rounded-[10px] border bg-ivory p-3"
          : "border-b border-stone py-2.5 last:border-b-0",
        hasChildren && done && "border-teal",
        hasChildren && inProgress && "border-teal/40",
        hasChildren && !done && !inProgress && "border-stone",
        !hasChildren && done && "bg-teal/5",
        !hasChildren && inProgress && "bg-teal/[0.04]",
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
              className="flex size-7 shrink-0 items-center justify-center text-teal"
            >
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-150",
                  !open && "-rotate-90",
                )}
              />
            </button>
          ) : (
            <span className="w-4 shrink-0 text-center text-muted" aria-hidden>
              ·
            </span>
          )}
          <ItemGlyph name={node.name} size={30} />
          <span className={cn("text-sm text-ink", hasChildren ? "font-semibold" : "font-medium")}>
            {node.name}
          </span>
          <button
            type="button"
            aria-label={`How to obtain ${node.name}`}
            aria-expanded={showHow}
            onClick={() => setShowHow((v) => !v)}
            className="flex size-7 shrink-0 items-center justify-center rounded-full border border-stone text-muted transition-[border-color,color] duration-150 hover:border-teal hover:text-teal"
          >
            <Info className="size-3.5" strokeWidth={2} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          {node.req === 1 ? (
            <ToggleSwitch
              checked={done}
              onChange={(v) => onOwned(node.id, v ? node.req : 0)}
              label={`Mark ${node.name} complete`}
            />
          ) : (
            <Stepper node={node} owned={owned} onOwned={(n) => onOwned(node.id, n)} />
          )}
          <StatusBadge owned={owned} req={node.req} />
        </div>
      </div>
      {showHow ? (
        <p className="mt-2 rounded-md bg-paper px-2.5 py-2 text-[0.82rem] text-muted">
          <strong className="font-semibold text-teal">How to get it: </strong>
          {node.how}
        </p>
      ) : null}
      {hasChildren && open ? (
        <div className="mt-3 ml-2 border-l-2 border-stone pl-4">
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
      <div className="mb-5 grid gap-4 rounded-xl border border-stone bg-paper p-4 shadow-[var(--shadow-border)] sm:grid-cols-2 sm:p-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="current-ship" className="text-xs font-bold uppercase tracking-wider text-teal">
            Current base ship
          </label>
          <select
            id="current-ship"
            className="field-select"
            value={current}
            onChange={(e) => setCurrent((e.target.value as ShipKey) || "")}
          >
            <option value="" disabled>
              Select base ship…
            </option>
            {BASE_SHIPS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="target-ship" className="text-xs font-bold uppercase tracking-wider text-teal">
            Target upgrade
          </label>
          <select
            id="target-ship"
            className="field-select"
            value={target}
            disabled={!current}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="" disabled>
              Select target upgrade…
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
        <div className="rounded-xl border border-stone bg-paper px-6 py-16 text-center shadow-[var(--shadow-border)]">
          <Ship className="mx-auto mb-3 size-10 text-teal" strokeWidth={1.5} aria-hidden />
          <p className="text-sm text-muted">
            Select a base ship and target upgrade above to begin tracking.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-5 rounded-xl border border-stone bg-paper p-4 shadow-[var(--shadow-border)] sm:p-5">
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-muted">Overall upgrade completion</span>
              <span className="font-semibold tabular-nums text-teal">
                {progress.pct}% ({formatNumber(progress.owned)} / {formatNumber(progress.req)})
              </span>
            </div>
            <Progress value={progress.pct} />
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-ink">Crafting tree for {activeTree.name}</h3>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex min-h-11 items-center rounded-md border border-danger/40 px-3.5 text-sm font-semibold text-danger transition-[background-color,color] duration-150 hover:bg-danger hover:text-ivory"
            >
              Reset this ship
            </button>
          </div>

          {confirmReset ? (
            <div className="mb-5 rounded-xl border border-danger/30 bg-paper p-4 shadow-[var(--shadow-border)]">
              <p className="text-sm text-ink">
                Reset owned stock only for {activeTree.name}?
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex h-11 items-center rounded-md bg-danger px-4 text-sm font-semibold text-ivory"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="inline-flex h-11 items-center rounded-md border border-stone bg-paper px-4 text-sm font-semibold text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          <div
            className={cn(
              "mb-4 rounded-xl border bg-paper p-4 shadow-[var(--shadow-border)] sm:p-5",
              finalDone ? "border-teal" : "border-stone",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <ItemGlyph name={activeTree.name} size={40} />
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-teal">
                    Final step
                  </p>
                  <p className="font-semibold text-ink">{activeTree.name}</p>
                </div>
              </div>
              <StatusBadge owned={finalOwned} req={activeTree.req} />
            </div>
            <p className="mt-3 text-sm text-muted">{activeTree.how}</p>
            <div className="mt-4 flex min-h-11 w-fit items-center gap-3">
              <ToggleSwitch
                checked={finalDone}
                onChange={(v) => setOwned(activeTree.id, v ? activeTree.req : 0)}
                label="I've turned this in"
              />
              <span className="text-sm font-medium text-ink">I've turned this in</span>
            </div>
          </div>

          <div className="rounded-xl border border-stone bg-paper px-4 py-2 shadow-[var(--shadow-border)] sm:px-5">
            {components.length ? (
              <>
                <p className="pt-4 pb-1 text-sm font-semibold text-teal">Components to craft</p>
                {components.map((c) => (
                  <NodeRow key={c.id} node={c} counts={counts} onOwned={setOwned} />
                ))}
              </>
            ) : null}
            {materials.length ? (
              <>
                <p className="border-t border-stone pt-4 pb-1 text-sm font-semibold text-teal first:border-t-0">
                  Materials to gather
                </p>
                {materials.map((c) => (
                  <NodeRow key={c.id} node={c} counts={counts} onOwned={setOwned} />
                ))}
              </>
            ) : null}
          </div>

          <p className="mt-6 text-center text-[0.78rem] text-muted">
            Progress saves automatically in this browser.
          </p>
        </>
      )}
    </div>
  );
}
