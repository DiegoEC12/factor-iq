import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAuthUserFn } from "@/lib/auth";

export const Route = createFileRoute("/portal/dashboard")({
  beforeLoad: async () => {
    const user = await getAuthUserFn();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    if (user.rol === "superadmin") {
      throw redirect({ to: "/admin/dashboard" });
    }
    if (user.clienteId) {
      throw redirect({ to: `/${user.clienteId}` as any });
    }
    throw redirect({ to: "/maquinarias" });
  },
  component: () => null,
});
