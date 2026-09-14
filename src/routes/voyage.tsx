import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { VoyageLog } from "@/components/voyage-log";
import { ShipTracker } from "@/components/ship-tracker";

type VoyageSearch = {
  tab?: "sailies" | "carrack";
};

export const Route = createFileRoute("/voyage")({
  validateSearch: (s: Record<string, unknown>): VoyageSearch => ({
    tab: s.tab === "carrack" ? "carrack" : "sailies",
  }),
  component: VoyagePage,
});

function VoyagePage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: "/voyage" });
  const active = tab === "carrack" ? "carrack" : "sailies";

  return (
    <AppShell
      eyebrow={active === "carrack" ? "Epheria Carrack" : "Daily Sailies & Bartering"}
      title="Voyage"
    >
      <div className="hub-tab-rail mb-5">
        <button
          type="button"
          data-active={active === "sailies" ? "true" : "false"}
          onClick={() => navigate({ search: { tab: "sailies" } })}
          className="hub-tab"
        >
          Sailies
        </button>
        <button
          type="button"
          data-active={active === "carrack" ? "true" : "false"}
          onClick={() => navigate({ search: { tab: "carrack" } })}
          className="hub-tab"
        >
          Carrack
        </button>
      </div>
      {active === "carrack" ? <ShipTracker /> : <VoyageLog />}
    </AppShell>
  );
}
