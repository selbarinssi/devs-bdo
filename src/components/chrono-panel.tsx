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
  dropRate,
  minutes,
  agris,
  showCharacter,
  showDropRate,
  showAgris,
  showMinutes,
  onToggle,
  onReset,
  onCharacter,
  onDropRate,
  onMinutes,
  onAgris,
  onShowCharacter,
  onShowDropRate,
  onShowAgris,
  onShowMinutes,
}: {
  hh: string;
  mm: string;
  ss: string;
  timerOn: boolean;
  total: number;
  sph: number;
  character: string;
  dropRate: string;
  minutes: string;
  agris: string;
  showCharacter: boolean;
  showDropRate: boolean;
  showAgris: boolean;
  showMinutes: boolean;
  onToggle: () => void;
  onReset: () => void;
  onCharacter: (v: string) => void;
  onDropRate: (v: string) => void;
  onMinutes: (v: string) => void;
  onAgris: (v: string) => void;
  onShowCharacter: (v: boolean) => void;
  onShowDropRate: (v: boolean) => void;
  onShowAgris: (v: boolean) => void;
  onShowMinutes: (v: boolean) => void;
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
          <p className="font-mono text-2xl font-bold tabular-nums text-cyan-300 sm:text-3xl">{formatSilver(total)}</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
          <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">Silver / Hour</p>
          <p className="font-mono text-2xl font-bold tabular-nums text-emerald-300 sm:text-3xl">{formatSilver(sph)}</p>
        </div>
      </div>

            <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ["Character", showCharacter, onShowCharacter],
            ["Drop Rate %", showDropRate, onShowDropRate],
            ["Agris", showAgris, onShowAgris],
            ["Minutes", showMinutes, onShowMinutes],
          ] as const
        ).map(([label, on, set]) => (
          <button
            key={label}
            type="button"
            onClick={() => set(!on)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ring-1 transition",
              on
                ? "bg-cyan-400/15 text-cyan-200 ring-cyan-400/40"
                : "bg-white/5 text-muted-foreground ring-white/10",
            )}
          >
            {label}: {on ? "On" : "Off"}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 sm:gap-3">
        {showCharacter && (
          <div>
            <Label className="mb-1 text-[0.65rem] uppercase tracking-wider text-muted-foreground">Character</Label>
            <Input
              value={character}
              onChange={(e) => onCharacter(e.target.value)}
              placeholder="Name"
              className="h-9 text-sm"
            />
          </div>
        )}
        {showDropRate && (
          <div>
            <Label className="mb-1 text-[0.65rem] uppercase tracking-wider text-muted-foreground">Drop Rate %</Label>
            <Input
              type="number"
              min={0}
              step="0.1"
              value={dropRate}
              onChange={(e) => onDropRate(e.target.value)}
              placeholder="e.g. 250"
              className="h-9 text-sm"
            />
          </div>
        )}
        {showAgris && (
          <div>
            <Label className="mb-1 text-[0.65rem] uppercase tracking-wider text-muted-foreground">Agris</Label>
            <button
              type="button"
              onClick={() => onAgris(agris === "on" ? "off" : "on")}
              className={cn(
                "flex h-9 w-full items-center justify-center rounded-md text-xs font-bold tracking-wide ring-1 transition",
                agris === "on"
                  ? "bg-emerald-500/20 text-emerald-200 ring-emerald-400/40"
                  : "bg-white/5 text-muted-foreground ring-white/10 hover:bg-white/10",
              )}
            >
              {agris === "on" ? "ON" : "OFF"}
            </button>
          </div>
        )}
        {showMinutes && (
          <div>
            <Label className="mb-1 text-[0.65rem] uppercase tracking-wider text-muted-foreground">Minutes</Label>
            <Input
              type="number"
              min={0}
              value={minutes}
              onChange={(e) => onMinutes(e.target.value)}
              placeholder="Manual if no timer"
              className="h-9 text-sm"
            />
          </div>
        )}
      </div>    
    </div>
  );
}
