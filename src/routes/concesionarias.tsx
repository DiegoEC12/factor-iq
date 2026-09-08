import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/concesionarias")({
  beforeLoad: () => {
    throw redirect({ to: "/maquinarias/concesionarias" });
  },
  component: () => null,
});
