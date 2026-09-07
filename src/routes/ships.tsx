import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ShipTracker } from "@/components/ship-tracker";

export const Route = createFileRoute("/ships")({ component: ShipsPage });

function ShipsPage() {
  return (
    <AppShell
      eyebrow="Epheria Carrack"
      title="Ship upgrade tracker"
      subtitle="Pick your Caravel or Galleass and the Carrack you want. Track components, materials and the final turn-in."
    >
      <ShipTracker />
    </AppShell>
  );
}
