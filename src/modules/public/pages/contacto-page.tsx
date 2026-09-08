import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

const CONTACT_ENDPOINT = "https://sheetdb.io/api/v1/c58g2kr6e72f0";

export function ContactoPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    try {
      await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        body: new FormData(form),
      });
      form.reset();
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fiq-site min-h-screen scroll-smooth bg-white">
      <SiteHeader />
      <main className="pt-[10vh]">
        <section className="relative flex h-[90vh] flex-col items-center bg-[url(/assets/img/hero-contacto.webp)] bg-cover bg-top bg-no-repeat py-15 select-none">
          <div className="absolute inset-0 z-1 bg-[#f2f4f8] opacity-70" />
          <div className="relative z-2 mx-auto flex h-full max-w-4xl flex-col justify-center gap-4 px-4 py-10 md:px-8 lg:px-20 lg:py-28">
            <span className="text-sm font-semibold tracking-widest text-[#d6452c] uppercase xl:text-base">
              Contacto
            </span>
            <h1 className="font-primary text-5xl text-[#1b2447] md:text-6xl md:font-semibold xl:text-7xl xl:font-bold">
              Hablemos sobre tu organización
            </h1>
            <p className="py-4 text-lg font-semibold text-gray-500 xl:text-lg">
              Cuéntanos en qué momento se encuentra tu empresa. Te respondemos en menos de 24 horas hábiles.
            </p>
          </div>
        </section>

        <section id="contacto" className="py-15">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row">
            <div className="flex flex-col gap-4 p-6 lg:max-w-2/5">
              <div className="select-none">
                <h3 className="font-primary text-2xl font-bold text-[#1b2447]">Información</h3>
                <p className="text-sm text-[#6b7184]">
                  También puedes escribirnos directamente por cualquiera de estos canales.
                </p>
              </div>
              <div className="flex max-w-7xl flex-col flex-wrap items-center justify-center gap-6 md:flex-row">
                <InfoCard icon={Mail} label="CORREO" value="contacto@factoriq.com" />
                <InfoCard icon={Phone} label="TELÉFONO" value="+51 965 956 522" />
                <InfoCard icon={MapPin} label="UBICACIÓN" value="Calle Murcia 186, Santiago de Surco, Peru, Lima 33" />
                <InfoCard icon={Mail} label="CORREO" value="contacto@factoriq.com" />
              </div>
            </div>

            <div className="m-6 rounded-xl border border-gray-200 p-6 select-none md:p-8 lg:mx-auto lg:w-1/2">
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col flex-wrap gap-4">
                  <div className="flex flex-row flex-wrap gap-4">
                    <div className="flex flex-1 flex-col gap-2">
                      <label htmlFor="name" className="text-sm font-bold text-gray-500">
                        Nombre
                      </label>
                      <input
                        name="data[nombres]"
                        type="text"
                        id="name"
                        required
                        className="rounded-xl border-2 border-gray-200 p-2"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      <label htmlFor="email" className="text-sm font-bold text-gray-500">
                        Correo
                      </label>
                      <input
                        name="data[correo]"
                        type="email"
                        id="email"
                        required
                        className="rounded-xl border-2 border-gray-200 p-2"
                      />
                    </div>
                  </div>
                  <div className="flex flex-row flex-wrap gap-4">
                    <div className="flex flex-1 flex-col gap-2">
                      <label htmlFor="phone" className="text-sm font-bold text-gray-500">
                        Teléfono
                      </label>
                      <input name="data[telefono]" type="text" id="phone" className="rounded-xl border-2 border-gray-200 p-2" />
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      <label htmlFor="company" className="text-sm font-bold text-gray-500">
                        Empresa
                      </label>
                      <input name="data[empresa]" type="text" id="company" className="rounded-xl border-2 border-gray-200 p-2" />
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-2">
                    <label htmlFor="service" className="text-sm font-bold text-gray-500">
                      ¿Cómo podemos ayudarte?
                    </label>
                    <textarea
                      id="service"
                      placeholder="Escribe tu mensaje aquí..."
                      name="data[mensaje]"
                      className="h-24 resize-none rounded-xl border-2 border-gray-200 p-2"
                    />
                  </div>
                  <div className="mt-5 flex w-full flex-col gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-gray-200 bg-[#1b2447] p-3 text-xs font-bold text-white transition-colors duration-300 hover:bg-blue-950/90 disabled:opacity-70"
                    >
                      Enviar mensaje
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>
        <SiteFooter />
        {sent && (
          <div className="fixed bottom-0 left-0 z-50 m-4 flex items-center gap-3 rounded-xl bg-emerald-500 px-5 py-3 text-white shadow-lg">
            <span className="text-sm font-medium">
              Mensaje enviado con éxito, nos estaremos comunicando contigo pronto.
            </span>
          </div>
        )}
      </main>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="group flex w-full cursor-pointer gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-transform duration-300 hover:border-[#d6452c]/50 select-none lg:max-w-xl">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f2f4f8]">
        <Icon className="h-5 w-5 text-[#1b2447]" />
      </div>
      <div className="flex flex-col justify-center">
        <h3 className="text-xs text-[#6b7184]">{label}</h3>
        <p className="text-sm font-bold text-black/80">{value}</p>
      </div>
    </div>
  );
}
