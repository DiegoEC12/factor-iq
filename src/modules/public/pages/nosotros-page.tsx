import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

const ENFOQUE = [
  {
    n: "01",
    title: "Escuchar",
    text: "Entendemos a profundidad la realidad, las personas y los retos del negocio.",
  },
  {
    n: "02",
    title: "Diagnosticar",
    text: "Combinamos datos cualitativos y cuantitativos para identificar palancas clave.",
  },
  {
    n: "03",
    title: "Diseñar",
    text: "Co-creamos rutas a medida con responsables, indicadores y plazos claros.",
  },
  {
    n: "04",
    title: "Acompañar",
    text: "Estamos al lado del cliente durante toda la ejecución, ajustando en tiempo real.",
  },
];

export function NosotrosPage() {
  return (
    <div className="fiq-site min-h-screen bg-white">
      <SiteHeader />
      <main className="pt-[10vh]">
        <section className="bg-[#f2f4f8] py-20">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 lg:flex-row">
            <div className="flex flex-col items-start gap-4 px-6 text-left md:px-8 lg:w-1/2">
              <span className="text-sm tracking-widest text-[#d6452c] uppercase">Nosotros</span>
              <h2 className="font-primary text-4xl text-[#1b2447] sm:text-5xl md:text-6xl">
                Acompañamos el crecimiento humano de las organizaciones.
              </h2>
              <p className="py-4 text-lg text-gray-500">
                Somos una organización que a través del acompañamiento estratégico de nuestros clientes logramos que
                éstos sean organizaciones saludables, donde el compromiso y el desempeño van de la mano.
              </p>
            </div>
            <div className="flex w-full max-w-md items-center justify-center p-4 sm:max-w-4xl md:p-8 lg:w-1/2 lg:p-4">
              <img className="w-full rounded-xl object-contain shadow-md" src="/assets/img/about.jpg" alt="Nosotros" />
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto flex max-w-7xl flex-col flex-wrap items-center justify-center gap-4 p-4 md:flex-row">
            {[
              {
                title: "Misión",
                text: "Acompañar estratégicamente a las organizaciones para que sean lugares saludables donde las personas crezcan junto con los resultados.",
              },
              {
                title: "Visión",
                text: "Ser la firma de referencia en Latinoamérica en transformación cultural y desempeño sostenible.",
              },
              {
                title: "Valores",
                text: "Confianza, rigor analítico, calidez humana, compromiso con el largo plazo y orientación al impacto.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="flex max-w-xs cursor-pointer flex-col gap-4 rounded-xl border border-gray-200 bg-white p-8 shadow-md transition-transform duration-300 hover:shadow-xl select-none lg:max-w-sm"
              >
                <h3 className="font-primary text-2xl font-bold text-[#1b2447]">{card.title}</h3>
                <p className="text-sm text-[#6b7184]">{card.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-gray-200 bg-[#f2f4f8] py-16">
          <div className="mx-auto flex max-w-7xl flex-col gap-4">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-8 p-8 text-center">
              <h2 className="font-primary text-3xl text-[#1b2447] md:text-4xl xl:text-5xl">Nuestro enfoque</h2>
              <div className="flex w-full flex-col gap-4 text-left">
                {ENFOQUE.map((step) => (
                  <div key={step.n} className="flex gap-4 border-b border-gray-300 py-4">
                    <span className="font-primary pt-2 text-2xl text-[#d6452c]">{step.n}</span>
                    <div className="flex flex-col gap-2">
                      <h3 className="font-primary text-2xl text-[#1b2447]">{step.title}</h3>
                      <p className="text-sm text-[#6b7184]">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <SiteFooter />
      </main>
    </div>
  );
}
