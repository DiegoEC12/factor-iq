import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/modules/public/pages/home-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Factor IQ | Soluciones Tecnológicas y Servicios en la Nube" },
      {
        name: "description",
        content:
          "Factor IQ ofrece soluciones avanzadas de tecnología, consultoría TI, desarrollo de software y servicios en la nube para potenciar tu negocio.",
      },
      { property: "og:title", content: "Factor IQ | Soluciones Tecnológicas y Servicios en la Nube" },
    ],
  }),
  component: HomePage,
});
