import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/ships")({
  beforeLoad: () => {
    throw redirect({ to: "/voyage", search: { tab: "carrack" } });
  },
});
