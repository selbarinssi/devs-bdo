import { createFileRoute } from "@tanstack/react-router";
import { AlchemyPlanner } from "@/components/alchemy-planner";

export const Route = createFileRoute("/_hub/alchemy")({
  component: AlchemyPlanner,
});
