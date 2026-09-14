import { BookOpen, Check, ChevronDown, Compass } from "lucide-react";
import { useMemo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { CAPTAIN_NOTES, STOPS, VOYAGE_STORAGE_KEY, type VoyageStop } from "@/data/voyage";
import { useCloudStorage } from "@/lib/user-sync";
import { cn } from "@/lib/utils";

type VoyageState = {
  checks: Record<string, boolean | string>;
  open: string | null;
};

const CLOSED = "__closed__";
const DEFAULT_STATE: VoyageState = { checks: {}, open: null };

function isStopDone(stop: VoyageStop, checks: Record<string, boolean | string>) {
  return stop.quests.filter((q) => !q.optional).every((q) => {
    if (q.choice?.length) {
      return q.choice.some((c) => !!checks[c.id]);
    }
    return !!checks[q.id];
  });
}

export function VoyageLog() {
  const { value, setValue } = useCloudStorage<VoyageState>(VOYAGE_STORAGE_KEY, DEFAULT_STATE);
  const [notesOpen, setNotesOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const currentId = useMemo(() => {
    const first = STOPS.find((s) => !isStopDone(s, value.checks));
    return first?.id ?? STOPS[STOPS.length - 1].id;
  }, [value.checks]);

  const doneCount = STOPS.filter((s) => isStopDone(s, value.checks)).length;
  const pct = Math.round((doneCount / STOPS.length) * 100);
  const currentIdx = STOPS.findIndex((s) => s.id === currentId);
  const openId =
    value.open === CLOSED ? null : value.open != null ? value.open : currentId;

  const toggleOpen = (id: string) => {
    setValue((prev) => {
      const auto =
        STOPS.find((s) => !isStopDone(s, prev.checks))?.id ?? STOPS[STOPS.length - 1].id;
      const shown = prev.open === CLOSED ? null : prev.open != null ? prev.open : auto;
      if (shown === id) return { ...prev, open: CLOSED };
      return { ...prev, open: id };
    });
  };

  const setCheck = (id: string, next: boolean | string) => {
    setValue((prev) => {
      const checks = { ...prev.checks };
      const owner = STOPS.find((s) =>
        s.quests.some((q) => q.id === id || q.choice?.some((c) => c.id === id)),
      );
      if (next === false || next === "") delete checks[id];
      else checks[id] = next;

      if (owner) {
        for (const q of owner.quests) {
          if (q.choice?.some((c) => c.id === id)) {
            for (const c of q.choice) {
              if (c.id !== id) delete checks[c.id];
            }
          }
        }
      }

      const wasDone = owner ? isStopDone(owner, prev.checks) : false;
      const nowDone = owner ? isStopDone(owner, checks) : false;
      let open = prev.open;
      if (!wasDone && nowDone && owner) {
        const idx = STOPS.findIndex((s) => s.id === owner.id);
        const nextStop = STOPS.slice(idx + 1).find((s) => !isStopDone(s, checks));
        open = nextStop?.id ?? CLOSED;
      }
      return { checks, open };
    });
  };

  const resetAll = () => {
    setValue(DEFAULT_STATE);
    setConfirmReset(false);
  };

  return (
    <div className="hub-wide flex flex-col gap-4">
      <div className="glass sticky top-2 z-20 p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-cyan-300" />
            <p className="hub-title">Carrack Voyage · Sailies</p>
          </div>
          <p className="font-mono text-sm tabular-nums neon-text">
            {doneCount}/{STOPS.length} · {pct}%
          </p>
        </div>
        <Progress value={pct} />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setNotesOpen((v) => !v)} className="btn-ghost h-8 text-xs">
            <BookOpen className="size-3.5" /> Captain Notes
          </button>
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="btn-ghost h-8 text-xs text-rose-300"
            >
              Reset Progress
            </button>
          ) : (
            <>
              <button type="button" onClick={resetAll} className="btn-primary h-8 px-3 text-xs">
                Confirm Reset
              </button>
              <button type="button" onClick={() => setConfirmReset(false)} className="btn-ghost h-8 text-xs">
                Cancel
              </button>
            </>
          )}
        </div>
        {notesOpen && (
          <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-3 hub-meta">
            {CAPTAIN_NOTES.map((n, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-cyan-400/80">•</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {STOPS.map((stop, idx) => {
          const done = isStopDone(stop, value.checks);
          const open = openId === stop.id;
          return (
            <div
              key={stop.id}
              className={cn(
                "glass overflow-hidden",
                done && "opacity-70",
                idx === currentIdx && !done && "ring-1 ring-cyan-400/30",
              )}
            >
              <button
                type="button"
                onClick={() => toggleOpen(stop.id)}
                className="flex w-full items-center gap-3 px-3 py-3 text-left sm:px-4"
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full hub-tiny font-bold",
                    done ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate hub-body font-semibold">{stop.title}</p>
                  <p className="truncate hub-meta">{stop.loc}</p>
                </div>
                <ChevronDown
                  className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
                />
              </button>
              {open && (
                <div className="border-t border-white/5 px-3 py-3 sm:px-4">
                  {(stop.heading || stop.note) && (
                    <p className="mb-2 hub-meta">{stop.heading || stop.note}</p>
                  )}
                  {stop.rewards && (
                    <p className="mb-2 hub-tiny font-medium text-cyan-300/80">Rewards: {stop.rewards}</p>
                  )}
                  <ul className="flex flex-col gap-2">
                    {stop.quests.map((q) => {
                      if (q.choice?.length) {
                        return (
                          <li key={q.id} className="rounded-lg bg-white/[0.03] p-2">
                            {q.heading || q.label || q.text ? (
                              <p className="mb-1.5 hub-body font-medium">{q.heading || q.label || q.text}</p>
                            ) : null}
                            <div className="flex flex-col gap-1.5">
                              {q.choice.map((c) => {
                                const checked = !!value.checks[c.id];
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setCheck(c.id, !checked)}
                                    className="flex items-start gap-2 text-left"
                                  >
                                    <span
                                      className="tick-box mt-0.5 size-6 shrink-0"
                                      data-checked={checked ? "true" : "false"}
                                    >
                                      {checked ? <Check className="size-3" strokeWidth={3} /> : null}
                                    </span>
                                    <span className={cn("hub-body", checked && "text-muted-foreground line-through")}>
                                      {c.text}
                                      {c.tag ? (
                                        <span className="ml-1 hub-tiny text-amber-300/90">· {c.tag}</span>
                                      ) : null}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </li>
                        );
                      }
                      const checked = !!value.checks[q.id];
                      return (
                        <li key={q.id} className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => setCheck(q.id, !checked)}
                            className="tick-box mt-0.5 size-6 shrink-0"
                            data-checked={checked ? "true" : "false"}
                          >
                            {checked ? <Check className="size-3" strokeWidth={3} /> : null}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className={cn("hub-body", checked && "text-muted-foreground line-through")}>
                              {q.text}
                              {q.optional ? (
                                <span className="ml-1 hub-tiny text-muted-foreground">(Optional)</span>
                              ) : null}
                              {q.tag ? (
                                <span className="ml-1 hub-tiny text-amber-300/90">· {q.tag}</span>
                              ) : null}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
