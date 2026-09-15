import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_hub")({
  component: HubLayout,
});

function HubLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
