import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function TabLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[42vh] flex-col items-center justify-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="size-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)] [animation-delay:0ms]" />
        <span className="size-1.5 animate-pulse rounded-full bg-cyan-300/80 shadow-[0_0_10px_rgba(34,211,238,0.6)] [animation-delay:150ms]" />
        <span className="size-1.5 animate-pulse rounded-full bg-cyan-300/60 shadow-[0_0_10px_rgba(34,211,238,0.4)] [animation-delay:300ms]" />
      </div>
      <p className="hub-meta tracking-wide text-muted-foreground/70">{label}</p>
    </div>
  );
}

export function CloudReady({
  hydrated,
  label,
  children,
}: {
  hydrated: boolean;
  label?: string;
  children: ReactNode;
}) {
  if (!hydrated) return <TabLoader label={label ?? "Loading…"} />;
  return children;
}
