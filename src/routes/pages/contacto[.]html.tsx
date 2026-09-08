import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pages/contacto.html")({
  beforeLoad: () => {
    throw redirect({ to: "/contacto" });
  },
  component: () => null,
});
