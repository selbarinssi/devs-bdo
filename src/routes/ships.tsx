import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ShipTracker } from "@/components/ship-tracker";

export const Route = createFileRoute("/ships")({ component: ShipsPage });

function ShipsPage() {
  return (
    <AppShell eyebrow="Epheria Carrack" title="Ship upgrade tracker">
      <ShipTracker />
    </AppShell>
  );
}
