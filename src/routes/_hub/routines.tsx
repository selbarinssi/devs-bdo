import { createFileRoute } from "@tanstack/react-router";
import { Routines } from "@/components/routines";

export const Route = createFileRoute("/_hub/routines")({
  component: Routines,
});
