import { Link } from "@tanstack/react-router";
import { ArrowRight, Brain, Compass, HeartHandshake, LineChart, Rocket, ShieldCheck } from "lucide-react";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

const SERVICES = [
  {
    icon: Compass,
    title: "Planeación estratégica",
    text: "Diseñamos un norte claro: visión, propósito, objetivos y KPIs para los próximos 3 años.",
  },
  {
    icon: HeartHandshake,
    title: "Cultura organizacional",
    text: "Diagnóstico, propuesta de valor al colaborador y activación de comportamientos clave.",
  },
  {
    icon: Brain,
    title: "Desarrollo de liderazgo",
    text: "Programas a medida para líderes de equipo, mandos medios y comité directivo.",
  },
  {
    icon: LineChart,
    title: "Gestión del desempeño",
    text: "Sistemas modernos de OKRs, feedback continuo y conversaciones de crecimiento.",
  },
  {
    icon: Rocket,
    title: "Transformación digital",
    text: "Plataforma en la nube para medir clima, desempeño y evolución cultural en tiempo real.",
  },
  {
    icon: ShieldCheck,
    title: "Bienestar y salud",
    text: "Acompañamos la salud emocional y física de los equipos como ventaja competitiva.",
  },
];

export function ServiciosPage() {
  return (
    <div className="fiq-site min-h-screen bg-white">
      <SiteHeader />
      <main className="pt-[10vh]">
        <section className="relative flex h-[90vh] items-center justify-center bg-[url(/assets/img/hero-servicios.webp)] bg-cover bg-top bg-no-repeat py-20">
          <div className="absolute inset-0 z-1 bg-[#f2f4f8] opacity-70" />
          <div className="relative z-2 mx-auto flex h-full max-w-4xl flex-col items-center justify-center gap-4 py-8 select-none">
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <span className="text-sm tracking-widest text-[#d6452c] uppercase xl:text-base xl:font-semibold">
                Servicios
              </span>
              <h1 className="font-primary text-5xl text-[#1b2447] md:text-6xl xl:text-7xl xl:font-semibold">
                Soluciones integrales para tu organización
              </h1>
              <p className="py-4 text-gray-500 xl:text-lg xl:leading-relaxed xl:font-semibold">
                Cada engagement combina consultoría experta, herramientas en la nube y acompañamiento humano. Diseñamos
                rutas únicas para cada cliente.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto flex max-w-7xl flex-col flex-wrap items-center justify-center gap-4 p-4 md:flex-row">
            {SERVICES.map((service) => (
              <div
                key={service.title}
                className="group flex max-w-xs cursor-pointer flex-col gap-4 rounded-xl border border-gray-200 bg-white p-8 shadow-md transition-transform duration-300 hover:shadow-xl lg:max-w-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1b2447] transition-colors duration-200 group-hover:bg-[#1b2447]">
                  <service.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-primary text-2xl font-bold text-[#1b2447]">{service.title}</h3>
                <p className="text-sm text-[#6b7184]">{service.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-gray-200 bg-[#f2f4f8] py-16">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 p-8 text-center">
            <h2 className="font-primary text-3xl text-[#1b2447] md:text-4xl xl:text-5xl">
              ¿No estás seguro por dónde empezar?
            </h2>
            <p className="max-w-2xl text-[#6b7184]">
              Diseñamos un diagnóstico inicial gratuito que nos permite proponerte una ruta clara y medible para tu
              organización.
            </p>
            <Link
              to="/contacto"
              className="my-4 flex w-fit items-center gap-2 rounded-full bg-[#1b2447] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:text-[#d6452c]"
            >
              Hablemos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
        <SiteFooter />
      </main>
    </div>
  );
}
