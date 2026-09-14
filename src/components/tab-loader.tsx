import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function TabLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[42vh] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="size-7 animate-spin text-cyan-300" />
      <p>{label}</p>
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
