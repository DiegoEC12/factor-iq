import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/benchmark")({
  beforeLoad: () => {
    throw redirect({ to: "/maquinarias/benchmark" });
  },
  component: () => null,
});
