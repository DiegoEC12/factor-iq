import { Link } from "@tanstack/react-router";
import { LOGIN_PATH } from "../nav";

export function SiteFooter() {
  return (
    <footer className="full-width bg-[#020c22] py-12 text-white">
      <div className="flex w-full flex-col items-center justify-between gap-4 px-4 transition-all duration-500 md:flex-row md:px-6 xl:px-8">
        <div className="mb-8 w-full text-left md:mb-0 md:text-left sm:w-sm lg:w-1/2 lg:items-start">
          <div className="mb-2">
            <Link to="/">
              <img src="/assets/img/logo-transparent-white.png" className="w-52" alt="Factor IQ" />
            </Link>
          </div>
          <p className="max-w-xs text-left text-xs lg:max-w-md">
            Acompañamiento estratégico para construir organizaciones saludables, donde el compromiso y el
            desempeño van de la mano.
          </p>
        </div>
        <div className="flex w-full flex-col flex-wrap gap-8 sm:flex-row sm:justify-center md:justify-end md:gap-10 lg:w-2/3 lg:justify-evenly lg:gap-25">
          <div className="flex flex-col gap-3">
            <span className="text-lg font-bold">Organización</span>
            <Link className="opacity-80 transition-all hover:underline hover:opacity-100" to="/nosotros">
              Nosotros
            </Link>
            <Link className="opacity-80 transition-all hover:underline hover:opacity-100" to="/servicios">
              Servicios
            </Link>
            <Link className="opacity-80 transition-all hover:underline hover:opacity-100" to="/contacto">
              Contacto
            </Link>
            <Link
              className="opacity-80 transition-all hover:underline hover:opacity-100"
              to={LOGIN_PATH as "/pages/servicio_nube.html"}
            >
              Servicio en la nube
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-lg font-bold">Soporte</span>
            <Link className="opacity-80 transition-all hover:underline hover:opacity-100" to="/contacto">
              Contáctanos
            </Link>
            <Link className="opacity-80 transition-all hover:underline hover:opacity-100" to="/contacto">
              FAQ
            </Link>
            <span className="text-lg font-bold">Legal</span>
            <span className="opacity-80">Términos y Condiciones</span>
            <span className="opacity-80">Política de Privacidad</span>
          </div>
        </div>
      </div>
      <div className="mt-20 flex w-full flex-col gap-2 border-t border-white/5 pt-10 text-center md:flex-row md:items-center md:justify-between">
        <p className="px-4 text-sm text-white/50">© 2026 Factor IQ. Todos los derechos reservados</p>
        <p className="px-4 text-sm text-white/50">Acompañamiento Estratégico</p>
      </div>
    </footer>
  );
}
