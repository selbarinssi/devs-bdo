import { createFileRoute } from "@tanstack/react-router";
import { AlchemyPlanner } from "@/components/alchemy-planner";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <AppShell
      eyebrow="Harmony Draught pipeline"
      title="Alchemy planner"
      subtitle="Batch-craft oils, bloods, elixirs and draughts. Set your EXP buffs, proc rate and batch size to see materials, yield and time to Guru."
    >
      <AlchemyPlanner />
    </AppShell>
  );
}
