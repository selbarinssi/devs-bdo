import { TabLoader } from "@/components/tab-loader";
import { useGrindController } from "@/components/use-grind-controller";
import { GrindTrackerView } from "@/components/grind-tracker-view";

export function GrindTracker() {
  const g = useGrindController();

    if (g.loading) {
    return <TabLoader label="Grind" />;
  }

  const selectedSpot = g.spots.find((s) => s.id === g.selectedId);

  return <GrindTrackerView {...g} selectedSpot={selectedSpot} />;
}
