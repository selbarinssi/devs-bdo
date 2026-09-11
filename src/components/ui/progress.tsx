import { cn } from "@/lib/utils";

function barColor(pct: number) {
  if (pct >= 100) return "bg-emerald-400";
  if (pct >= 60) return "bg-sky-400";
  if (pct >= 30) return "bg-amber-400";
  return "bg-rose-400";
}

export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-2.5 overflow-hidden rounded-full bg-secondary", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300 ease-[var(--ease-out-smooth)]",
          barColor(pct),
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
