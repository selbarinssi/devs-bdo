import { cn } from "@/lib/utils";

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
      className={cn(
        "h-3 overflow-hidden rounded-full bg-stone",
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-teal transition-[width] duration-300 ease-[var(--ease-out-smooth)]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
