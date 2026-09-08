import { Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, CheckCircle2, Sparkles, Target, Users } from "lucide-react";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

export function HomePage() {
  return (
    <div className="fiq-site min-h-screen bg-white">
      <SiteHeader />
      <main className="pt-[10vh]">
        <section className="relative flex w-full flex-col bg-linear-to-br from-[#071f44] to-[#1b5094] py-0 md:py-4 lg:h-[90vh]">
          <div className="absolute z-1 h-full w-full bg-[radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="z-2 mx-auto flex h-full items-center justify-center md:max-w-7xl lg:flex-row flex-col">
            <div className="flex flex-col justify-center gap-6 px-6 py-10 lg:w-1/2">
              <div className="flex w-fit items-center gap-2 rounded-2xl border border-white/50 bg-white/10 px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-xs text-white uppercase md:text-sm">Acompañamiento estratégico</span>
              </div>
              <h1 className="font-primary text-4xl text-white md:text-6xl xl:text-7xl">
                Organizaciones <span className="text-red-500">saludables,</span>
                <br />
                resultados extraordinarios.
              </h1>
              <p className="text-lg text-white/80">
                En Factor IQ acompañamos a líderes y equipos para que el compromiso y el desempeño caminen juntos.
                Estrategia, cultura y crecimiento sostenible
              </p>
              <div className="flex flex-col gap-4">
                <Link
                  to="/contacto"
                  className="inline-block w-fit rounded-full bg-red-500 px-10 py-3 text-sm font-bold text-white transition hover:scale-[1.01]"
                >
                  Agenda una reunion
                </Link>
                <Link
                  to="/servicios"
                  className="inline-block w-fit rounded-full border border-white bg-transparent px-10 py-3 text-sm text-white transition hover:bg-white/10"
                >
                  Ver servicios
                </Link>
              </div>
            </div>
            <div className="flex w-full justify-center p-4 lg:w-1/2">
              <img
                className="w-full rounded-2xl border border-white/50 object-cover shadow-[0px_-10px_100px_0px_rgba(214,69,44,0.5)]"
                src="/assets/img/hero.jpg"
                alt="Factor IQ"
              />
            </div>
          </div>
        </section>

        <section className="bg-[#f2f4f8] py-25">
          <div className="mx-auto flex w-full flex-col justify-around gap-8 md:max-w-7xl">
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              <span className="text-center text-xs tracking-widest text-[#d6452c] uppercase">Nuestros pilares</span>
              <h2 className="font-primary px-8 text-center text-4xl text-[#1b2447] md:text-5xl">
                Una metodología diseñada para perdurar
              </h2>
              <p className="px-6 text-center text-[#6b7184] md:px-12">
                Combinamos diagnóstico riguroso, intervención humana y herramientas digitales en la nube para que tu
                organización crezca con propósito.
              </p>
            </div>
            <div className="flex flex-col gap-6 p-6 md:flex-row">
              {[
                {
                  icon: Target,
                  title: "Estrategia",
                  text: "Definimos rumbo claro alineando visión, propósito y resultados medibles.",
                },
                {
                  icon: Users,
                  title: "Cultura",
                  text: "Construimos entornos de confianza donde las personas dan lo mejor de sí.",
                },
                {
                  icon: BarChart3,
                  title: "Desempeño",
                  text: "Diseñamos sistemas que convierten compromiso en resultados sostenibles.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group flex cursor-pointer flex-col gap-4 rounded-xl bg-white p-8 shadow-md transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl select-none"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f2f4f8] transition-colors duration-200 group-hover:bg-[#1b2447]">
                    <item.icon className="h-7 w-7 text-[#1b2447] transition-colors duration-200 group-hover:text-white" />
                  </div>
                  <h3 className="font-primary text-xl font-bold text-[#1b2447]">{item.title}</h3>
                  <p className="text-sm text-[#6b7184]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-18">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex p-6">
              <img className="rounded-xl" src="/assets/img/about.jpg" alt="Quiénes somos" />
            </div>
            <div className="flex flex-col gap-4 p-6">
              <span className="text-xs tracking-widest text-[#d6452c] uppercase">Quiénes somos</span>
              <h2 className="font-primary text-4xl text-[#1b2447] md:text-5xl">
                Aliados estratégicos del crecimiento humano y organizacional.
              </h2>
              <p className="text-base text-[#6b7184]">
                Somos una organización que a través del acompañamiento estratégico de nuestros clientes logramos que
                éstos sean organizaciones saludables, donde el compromiso y el desempeño van de la mano.
              </p>
              <ul className="flex flex-col gap-2">
                {[
                  "Diagnóstico organizacional integral",
                  "Planes de cultura y liderazgo a medida",
                  "Plataforma en la nube para medir el impacto",
                  "Acompañamiento continuo durante todo el proceso",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1b2447]" />
                    <p className="text-sm text-[#6b7184]">{item}</p>
                  </li>
                ))}
              </ul>
              <div className="flex w-fit items-center justify-center gap-2 py-8">
                <Link
                  to="/nosotros"
                  className="flex items-center gap-2 font-semibold text-[#1b2447] transition-all duration-200 hover:text-[#d6452c]"
                >
                  Conoce nuestra historia
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-linear-to-br from-[#071f44] to-[#1b5094] py-18">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-4 lg:flex-row">
            <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
              <Sparkles className="h-6 w-6 text-[#d6452c]" />
              <h2 className="font-primary text-4xl text-white md:text-5xl">¿Listo para transformar tu organización?</h2>
              <p className="text-sm text-white/80">
                Agenda una sesión diagnóstica sin costo y descubre cómo podemos acompañarte a construir una
                organización saludable y de alto desempeño.
              </p>
              <Link
                to="/contacto"
                hash="contacto"
                className="my-5 flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-[#1b2447] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
              >
                Comenzar ahora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
