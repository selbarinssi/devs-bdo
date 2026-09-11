import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { GrindTracker } from "@/components/grind-tracker";

export const Route = createFileRoute("/grind")({ component: GrindPage });

function GrindPage() {
  return (
    <AppShell eyebrow="PVE tracker" title="Grind">
      <GrindTracker />
    </AppShell>
  );
}
