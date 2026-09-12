import { Square, Timer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatSilverCompact } from "@/lib/utils";

function formatSilver(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return formatSilverCompact(n);
}

export function ChronoPanel({
  hh,
  mm,
  ss,
  timerOn,
  total,
  sph,
  character,
  minutes,
  onToggle,
  onReset,
  onCharacter,
  onMinutes,
}: {
  hh: string;
  mm: string;
  ss: string;
  timerOn: boolean;
  total: number;
  sph: number;
  character: string;
  minutes: string;
  onToggle: () => void;
  onReset: () => void;
  onCharacter: (v: string) => void;
  onMinutes: (v: string) => void;
}) {
  return (
    <div className="glass p-3 sm:p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border px-3 py-3 transition-all duration-200",
            timerOn
              ? "border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,0.22)]"
              : "border-white/10 bg-white/[0.03]",
          )}
        >
          <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">Timer</p>
          <p
            className={cn(
              "font-mono text-2xl font-bold tabular-nums sm:text-3xl",
              timerOn ? "text-cyan-200" : "text-foreground",
            )}
          >
            {hh}:{mm}:{ss}
          </p>
          <div className="mt-2.5 flex gap-1.5">
            <button
              type="button"
              onClick={onToggle}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all",
                timerOn
                  ? "bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40 hover:bg-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40 hover:bg-emerald-500/30",
              )}
            >
              {timerOn ? (
                <>
                  <Square className="size-3" /> Stop
                </>
              ) : (
                <>
                  <Timer className="size-3" /> Start
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-8 items-center rounded-full bg-white/5 px-2.5 text-xs font-semibold text-muted-foreground ring-1 ring-white/10 hover:bg-white/10 hover:text-foreground"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
          <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">Total Silver</p>
          <p className="font-mono text-2xl font-bold tabular-nums text-cyan-300 sm:text-3xl">
            {formatSilver(total)}
          </p>
          <p className="mt-1 text-[0.65rem] text-muted-foreground">Session Value</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-3">
          <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">Silver / Hour</p>
          <p className="font-mono text-2xl font-bold tabular-nums text-emerald-300 sm:text-3xl">
            {formatSilver(sph)}
          </p>
          <p className="mt-1 text-[0.65rem] text-muted-foreground">Live /h</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1">
          <Label className="text-[0.65rem]">Character</Label>
          <Input
            value={character}
            onChange={(e) => onCharacter(e.target.value)}
            placeholder="Character Name"
            className="h-9 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[0.65rem]">Minutes</Label>
          <Input
            type="number"
            min={1}
            value={minutes}
            onChange={(e) => onMinutes(e.target.value)}
            className="h-9 w-20 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
