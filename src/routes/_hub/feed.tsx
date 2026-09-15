import { createFileRoute } from "@tanstack/react-router";
import { HubFeed } from "@/components/hub-feed";

export const Route = createFileRoute("/feed")({ component: HubFeed });
