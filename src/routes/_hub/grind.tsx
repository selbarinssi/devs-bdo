import { createFileRoute } from "@tanstack/react-router";
import { GrindTracker } from "@/components/grind-tracker";

export const Route = createFileRoute("/_hub/grind")({
  component: GrindTracker,
});
