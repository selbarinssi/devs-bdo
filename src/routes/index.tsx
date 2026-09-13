import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

/** Signed-in users land on Routines; signed-out users see Login via AppShell. */
function Home() {
  return <Navigate to="/routines" />;
}
