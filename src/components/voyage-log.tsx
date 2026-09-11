import { BookOpen, Check, ChevronDown, Compass } from "lucide-react";
import { useMemo, useState } from "react";
import { RichText } from "@/components/rich-text";
import { Progress } from "@/components/ui/progress";
import { CAPTAIN_NOTES, STOPS, VOYAGE_STORAGE_KEY, type VoyageStop } from "@/data/voyage";
import { useLocalStorage } from "@/lib/storage";
import { cn } from "@/lib/utils";

type VoyageState = {
  checks: Record<string, boolean | string>;
  open: string | null;
};

const DEFAULT_STATE: VoyageState = { checks: {}, open: null };

function isStopDone(stop: VoyageStop, checks: Record<string, boolean | string>) {
  return stop.quests.filter((q) => !q.optional).every((q) => !!checks[q.id]);
}

export function VoyageLog() {
  const { value, setValue } = useLocalStorage<VoyageState>(VOYAGE_STORAGE_KEY, DEFAULT_STATE);
  const [notesOpen, setNotesOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const currentId = useMemo(() => {
    const first = STOPS.find((s) => !isStopDone(s, value.checks));
    return first?.id ?? STOPS[STOPS.length - 1].id;
  }, [value.checks]);

  const doneCount = STOPS.filter((s) => isStopDone(s, value.checks)).length;
  const pct = Math.round((doneCount / STOPS.length) * 100);
  const currentIdx = STOPS.findIndex((s) => s.id === currentId);
  const openId = value.open ?? currentId;

  const toggleOpen = (id: string) => {
    setValue((prev) => ({ ...prev, open: prev.open === id ? null : id }));
  };

  const setCheck = (id: string, next: boolean | string) => {
    setValue((prev) => {
      const checks = { ...prev.checks };
      if (next === false || next === "") delete checks[id];
      else checks[id] = next;
      return { ...prev, checks };
    });
  };

  const reset = () => {
    setValue({ checks: {}, open: STOPS[0].id });
    setConfirmReset(false);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="glass sticky top-2 z-20 mb-4 p-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-foreground">
            {doneCount === STOPS.length ? (
              <>
                Voyage complete <span className="font-normal text-muted-foreground">· all stops turned in</span>
              </>
            ) : (
              <>
                Stop {currentIdx + 1} of {STOPS.length}{" "}
                <span className="font-normal text-muted-foreground">· {STOPS[currentIdx]?.title}</span>
              </>
            )}
          </p>
          <p className="shrink-0 font-semibold tabular-nums neon-text">
            {doneCount}/{STOPS.length} stops
          </p>
        </div>
        <Progress value={pct} />
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setNotesOpen((o) => !o)}
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground underline decoration-white/20 underline-offset-[3px] hover:text-foreground"
        >
          <BookOpen className="size-4" strokeWidth={1.75} />
          Captain's notes
        </button>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="inline-flex min-h-11 items-center text-sm text-rose-400 underline decoration-rose-400/40 underline-offset-[3px] hover:text-rose-300"
        >
          Reset voyage
        </button>
      </div>

      {notesOpen ? (
        <div className="glass mb-5 p-4">
          <h3 className="mb-2 font-semibold neon-text">Captain's notes</h3>
          <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            {CAPTAIN_NOTES.map((n) => (
              <li key={n} className="relative pl-3.5 before:absolute before:left-0 before:text-muted before:content-['—']">
                {n}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {confirmReset ? (
        <div className="glass mb-5 border border-rose-400/30 p-4">
          <p className="text-sm text-foreground">Reset all progress for this voyage?</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center rounded-full bg-rose-500 px-4 text-sm font-semibold text-white"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="btn-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="relative">
        {STOPS.map((stop, idx) => {
          const done = isStopDone(stop, value.checks);
          const isCurrent = stop.id === currentId;
          const isOpen = stop.id === openId;
          return (
            <div key={stop.id} className="flex gap-3.5">
              <div className="flex w-7 shrink-0 flex-col items-center sm:w-[30px]">
                <div
                  className={cn(
                    "relative z-[1] flex size-7 items-center justify-center rounded-full border-2 bg-[#0a0e1a] font-semibold transition-[border-color,background-color,color,box-shadow] duration-300 sm:size-[30px] sm:text-sm",
                    done && "border-emerald-400 bg-emerald-400/25 text-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.45)]",
                    !done && isCurrent && "border-cyan-400 text-cyan-300 shadow-[0_0_0_4px_rgba(34,211,238,0.2),0_0_18px_rgba(34,211,238,0.25)]",
                    !done && !isCurrent && "border-white/20 text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : idx + 1}
                </div>
                {idx < STOPS.length - 1 ? (
                  <div
                    className={cn(
                      "my-0.5 w-0.5 min-h-3.5 flex-1",
                      done ? "bg-emerald-400/70" : "bg-white/10",
                    )}
                  />
                ) : (
                  <div className="h-2" />
                )}
              </div>

              <article
                className={cn(
                  "glass mb-3.5 min-w-0 flex-1 overflow-hidden transition-[border-color,opacity,box-shadow] duration-200",
                  done && "opacity-55",
                  !done && isCurrent && "border-cyan-400/35 shadow-[0_0_24px_rgba(34,211,238,0.08)]",
                  !done && !isCurrent && "",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleOpen(stop.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                  aria-expanded={isOpen}
                >
                  <div>
                    <h3 className="font-semibold text-foreground">{stop.title}</h3>
                    <span className="mt-0.5 block text-[0.78rem] text-muted-foreground">{stop.loc}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted transition-transform duration-200",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>

                {isOpen ? (
                  <div className="px-4 pb-4">
                    {stop.heading ? (
                      <p className="mb-2 flex gap-1.5 border-b border-white/10 pb-2.5 text-[0.78rem] text-muted-foreground">
                        <Compass className="mt-0.5 size-3.5 shrink-0 text-cyan-400" strokeWidth={1.75} />
                        <span>{stop.heading}</span>
                      </p>
                    ) : null}

                    {stop.quests.map((q) => {
                      if (q.choice) {
                        return (
                          <div key={q.id} className="border-t border-white/10 py-2.5 first:border-t-0">
                            {q.heading ? (
                              <p className="mb-2 border-t border-dashed border-white/10 pt-2 text-[0.74rem] text-cyan-300 first:border-t-0 first:pt-0">
                                {q.heading}
                              </p>
                            ) : null}
                            <span className="mb-2 inline-block rounded px-1.5 py-0.5 text-[0.68rem] font-semibold tracking-wide text-slate-950 bg-cyan-400">
                              {q.label || "Choose one"}
                            </span>
                            <div className="flex flex-col gap-1">
                              {q.choice.map((opt) => {
                                const rid = `r-${q.id}-${opt.id}`;
                                const checked = value.checks[q.id] === opt.id;
                                return (
                                  <label
                                    key={opt.id}
                                    htmlFor={rid}
                                    className="flex min-h-11 cursor-pointer items-start gap-2.5 py-1 pl-1"
                                  >
                                    <input
                                      type="radio"
                                      id={rid}
                                      name={q.id}
                                      className="radio-dot"
                                      checked={checked}
                                      onChange={() => setCheck(q.id, opt.id)}
                                    />
                                    <span className="text-[0.87rem] text-ink">
                                      {opt.text}
                                      {opt.tag ? (
                                        <span className="mt-0.5 block text-[0.75rem] text-muted">
                                          {opt.tag}
                                        </span>
                                      ) : null}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      const checked = !!value.checks[q.id];
                      const cbId = `cb-${q.id}`;
                      return (
                        <div key={q.id}>
                          {q.heading ? (
                            <p className="mt-2.5 border-t border-dashed border-white/10 pt-2 text-[0.74rem] text-cyan-300">
                              {q.heading}
                            </p>
                          ) : null}
                          <label
                            htmlFor={cbId}
                            className={cn(
                              "flex min-h-11 cursor-pointer items-start gap-2.5 border-t border-white/10 py-2 first:border-t-0",
                              q.optional && "text-muted-foreground",
                            )}
                          >
                            <span
                              className="tick-box mt-0.5"
                              data-checked={checked ? "true" : "false"}
                              aria-hidden
                            >
                              <input
                                type="checkbox"
                                id={cbId}
                                checked={checked}
                                onChange={(e) => setCheck(q.id, e.target.checked)}
                                className="sr-only"
                              />
                              {checked ? <Check className="block size-3" strokeWidth={3} /> : null}
                            </span>
                            <span
                              className={cn(
                                "text-[0.88rem]",
                                checked ? "text-muted-foreground line-through" : q.optional ? "text-muted-foreground" : "text-foreground",
                              )}
                            >
                              <RichText text={q.text || ""} />
                              {q.tag ? (
                                <span className="ml-1.5 inline-block rounded border border-cyan-400/35 px-1.5 py-px align-middle text-[0.68rem] text-cyan-300">
                                  {q.tag}
                                </span>
                              ) : null}
                            </span>
                          </label>
                        </div>
                      );
                    })}

                    {stop.note ? (
                      <p className="mt-2.5 rounded-lg border-l-2 border-cyan-400/30 bg-black/25 px-2.5 py-2 text-[0.8rem] text-muted-foreground">
                        {stop.note}
                      </p>
                    ) : null}

                    <p className="mt-2.5 inline-block rounded-md bg-emerald-400/10 px-2.5 py-1.5 text-[0.78rem] text-emerald-300">
                      {stop.rewards}
                    </p>
                  </div>
                ) : null}
              </article>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[0.78rem] text-muted-foreground">
        Progress saves automatically in this browser.
      </p>
    </div>
  );
}
