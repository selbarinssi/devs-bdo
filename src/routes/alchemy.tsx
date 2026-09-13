import { createFileRoute } from "@tanstack/react-router";
import { AlchemyPlanner } from "@/components/alchemy-planner";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/alchemy")({ component: AlchemyPage });

function AlchemyPage() {
  return (
    <AppShell eyebrow="Harmony Draught Pipeline" title="Alchemy Planner">
      <AlchemyPlanner />
    </AppShell>
  );
}
