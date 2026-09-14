import { Loader2 } from "lucide-react";
import { useGrindController } from "@/components/use-grind-controller";
import { GrindTrackerView } from "@/components/grind-tracker-view";

export function GrindTracker() {
  const g = useGrindController();

  if (g.loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading Grind Data…
      </div>
    );
  }

  const selectedSpot = g.spots.find((s) => s.id === g.selectedId);

  return <GrindTrackerView {...g} selectedSpot={selectedSpot} />;
}
