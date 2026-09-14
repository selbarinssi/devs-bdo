import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { HubFeed } from "@/components/hub-feed";

export const Route = createFileRoute("/feed")({ component: FeedPage });

function FeedPage() {
  return (
    <AppShell eyebrow="Community" title="Hub Feed">
      <HubFeed />
    </AppShell>
  );
}
