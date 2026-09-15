import { createFileRoute } from "@tanstack/react-router";
import { Routines } from "@/components/routines";

export const Route = createFileRoute("/routines")({ component: Routines });
