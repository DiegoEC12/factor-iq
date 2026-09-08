import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginPage } from "@/modules/public/components/login-page";
import { getAuthUserFn } from "@/lib/auth";

export const Route = createFileRoute("/pages/servicio_nube.html")({
  beforeLoad: async () => {
    const user = await getAuthUserFn();
    if (user?.redirectTo) {
        throw redirect({ to: user.redirectTo as "/maquinarias" });
    }
  },
  head: () => ({
    meta: [
      { title: "Servicios Cloud y en la Nube - Factor IQ" },
      {
        name: "description",
        content:
          "Aprende sobre nuestra infraestructura en la nube, migración cloud, alta disponibilidad y escalabilidad para empresas con Factor IQ.",
      },
    ],
  }),
  component: LoginPage,
});
