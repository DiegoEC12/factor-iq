import { createFileRoute } from "@tanstack/react-router";
import { ServiciosPage } from "@/modules/public/pages/servicios-page";

export const Route = createFileRoute("/servicios")({
  head: () => ({
    meta: [
      { title: "Servicios Tecnológicos y Consultoría TI - Factor IQ" },
      {
        name: "description",
        content:
          "Conoce nuestros servicios de desarrollo, infraestructura, seguridad de datos y transformación digital en Factor IQ.",
      },
    ],
  }),
  component: ServiciosPage,
});
