import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { VoyageLog } from "@/components/voyage-log";
import { ShipTracker } from "@/components/ship-tracker";
import { cn } from "@/lib/utils";

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
      <div className="mb-4 flex w-fit gap-1 rounded-full border border-white/10 bg-black/25 p-1">
        <button
          type="button"
          onClick={() => navigate({ search: { tab: "sailies" } })}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-semibold transition-all",
            active === "sailies"
              ? "bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/40 shadow-[0_0_14px_rgba(34,211,238,0.2)]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Sailies
        </button>
        <button
          type="button"
          onClick={() => navigate({ search: { tab: "carrack" } })}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-semibold transition-all",
            active === "carrack"
              ? "bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/40 shadow-[0_0_14px_rgba(34,211,238,0.2)]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Carrack
        </button>
      </div>
      {active === "carrack" ? <ShipTracker /> : <VoyageLog />}
    </AppShell>
  );
}
