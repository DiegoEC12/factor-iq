import { createFileRoute } from "@tanstack/react-router";
import { ContactoPage } from "@/modules/public/pages/contacto-page";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto - Factor IQ" },
      {
        name: "description",
        content:
          "Ponte en contacto con el equipo de Factor IQ para cotizar servicios en la nube, soluciones tecnológicas y consultoría TI.",
      },
    ],
  }),
  component: ContactoPage,
});
