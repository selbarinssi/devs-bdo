import { TabLoader } from "@/components/tab-loader";
import { useGrindController } from "@/components/use-grind-controller";
import { GrindTrackerView } from "@/components/grind-tracker-view";

export function GrindTracker() {
  const g = useGrindController();

      if (g.loading) {
    return <TabLoader label="Grind" />;
  }

  if (g.refreshingPrices) {
    return <TabLoader label="Refreshing prices…" />;
  }

  if (g.error && g.spots.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-rose-200">
        {g.error}
        <button type="button" className="ml-2 underline" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  const selectedSpot = g.spots.find((s) => s.id === g.selectedId);

  return <GrindTrackerView {...g} selectedSpot={selectedSpot} />;
}
