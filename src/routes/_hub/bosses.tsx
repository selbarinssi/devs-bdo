// src/routes/_hub/bosses.tsx
import { createFileRoute } from "@tanstack/react-router";
import { WorldBossesPanel } from "@/components/world-bosses-panel";

export const Route = createFileRoute("/_hub/bosses")({
  component: WorldBossesPanel,
});
