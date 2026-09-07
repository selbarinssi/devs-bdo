import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { VoyageLog } from "@/components/voyage-log";

export const Route = createFileRoute("/voyage")({ component: VoyagePage });

function VoyagePage() {
  return (
    <AppShell
      eyebrow="Daily Sailies & bartering"
      title="Voyage log"
      subtitle="Velia → Iliya → Oquilla's Eye → Margoria → home. Check off each stop; progress saves in this browser."
    >
      <VoyageLog />
    </AppShell>
  );
}
