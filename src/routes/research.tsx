import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { SpotResearch } from "@/components/spot-research";

export const Route = createFileRoute("/research")({ component: ResearchPage });

function ResearchPage() {
  return (
    <AppShell eyebrow="Spot Catalog" title="Research">
      <SpotResearch />
    </AppShell>
  );
}
