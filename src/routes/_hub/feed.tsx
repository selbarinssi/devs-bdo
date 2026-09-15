import { createFileRoute } from "@tanstack/react-router";
import { HubFeed } from "@/components/hub-feed";

export const Route = createFileRoute("/_hub/feed")({
  component: HubFeed,
});
