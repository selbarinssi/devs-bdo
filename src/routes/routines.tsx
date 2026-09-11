import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Routines } from "@/components/routines";

export const Route = createFileRoute("/routines")({ component: RoutinesPage });

function RoutinesPage() {
  return (
    <AppShell eyebrow="Task Tracker" title="Routines">
      <Routines />
    </AppShell>
  );
}
