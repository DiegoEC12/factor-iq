import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pages/nosotros.html")({
  beforeLoad: () => {
    throw redirect({ to: "/nosotros" });
  },
  component: () => null,
});
