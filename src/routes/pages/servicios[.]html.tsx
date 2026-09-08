import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pages/servicios.html")({
  beforeLoad: () => {
    throw redirect({ to: "/servicios" });
  },
  component: () => null,
});
