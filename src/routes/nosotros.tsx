import { createFileRoute } from "@tanstack/react-router";
import { NosotrosPage } from "@/modules/public/pages/nosotros-page";

export const Route = createFileRoute("/nosotros")({
  head: () => ({
    meta: [
      { title: "Sobre Nosotros - Factor IQ" },
      {
        name: "description",
        content:
          "Conoce más sobre Factor IQ, nuestra misión, visión y el equipo detrás de nuestras soluciones y servicios tecnológicos.",
      },
    ],
  }),
  component: NosotrosPage,
});
