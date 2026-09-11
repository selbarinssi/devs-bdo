import { Loader2 } from "lucide-react";

/** Temporary stub — full grind tracker restore in progress. */
export function GrindTracker() {
  return (
    <div className="glass flex items-center gap-2 p-6 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Restoring grind tracker… redeploy after the next push.
    </div>
  );
}
