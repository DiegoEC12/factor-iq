import { Link, useNavigate } from "@tanstack/react-router";
import { CircleAlert, CircleCheck, Lock, LogIn, User } from "lucide-react";
import { useState, type FormEvent } from "react";
import { loginFn } from "@/lib/auth";
import { SiteHeader } from "./site-header";

type AlertState = { message: string; type: "error" | "success" } | null;

export function LoginPage() {
  const navigate = useNavigate();
  const [alert, setAlert] = useState<AlertState>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const usuario = String(formData.get("usuario") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    if (!usuario || !password) {
      setAlert({ message: "Por favor ingresa tu usuario y contraseña.", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const result = await loginFn({ data: { usuario, password } });
      if (!result.ok) {
        setAlert({ message: result.message, type: "error" });
        return;
      }
      setAlert({ message: "Acceso correcto. Redirigiendo...", type: "success" });
      setTimeout(() => {
        void navigate({ to: result.redirectTo as "/maquinarias" });
      }, 600);
    } catch {
      setAlert({
        message: "No se pudo iniciar sesión. Intenta nuevamente.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fiq-site min-h-screen bg-white">
      <SiteHeader />
      <main className="flex min-h-[100dvh] items-stretch bg-[#1b2447] pt-18">
        <div className="relative hidden animate-on-load flex-col justify-between overflow-hidden bg-[#1b2447] p-12 select-none xl:flex xl:w-5/12">
          <div className="relative z-10">
            <div className="mt-8 mb-10">
              <img className="h-12 w-auto max-h-14" src="/assets/img/logo-transparent-white.png" alt="Factor IQ" />
            </div>
            <h1 className="mb-6 border-l-4 border-red-500 pl-4 text-5xl leading-tight font-extrabold tracking-tight text-white uppercase drop-shadow-md">
              Servicio en la nube <br />
              Para <br /> tu negocio
            </h1>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-slate-800 opacity-20 mix-blend-overlay">
            <img alt="" className="h-full w-full object-cover" src="/assets/img/hero.jpg" />
          </div>
        </div>

        <div className="flex w-full animate-on-load flex-col justify-center bg-[#1b2447]/50 px-6 py-10 select-none sm:px-10 md:bg-white md:px-16 xl:w-7/12 xl:px-24">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 md:mt-0 md:mb-10">
              <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-white md:text-slate-900">
                Iniciar Sesión
              </h2>
              <p className="font-medium text-slate-100 md:text-slate-500">
                Bienvenido de nuevo. Por favor ingresa tus credenciales.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="group">
                <label className="mb-3 ml-1 block text-xs font-bold tracking-widest text-white uppercase md:text-[#1b2447]">
                  Usuario (Correo o DNI)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pr-4 pl-12 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#1b2447] focus:bg-white focus:ring-2 focus:ring-[#1b2447]/20"
                    placeholder="Ingresa tu correo o DNI"
                    type="text"
                    name="usuario"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="group">
                <label className="mb-3 block px-1 text-xs font-bold tracking-widest text-white uppercase md:text-[#1b2447]">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pr-4 pl-12 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#1b2447] focus:bg-white focus:ring-2 focus:ring-[#1b2447]/20"
                    placeholder="••••••••"
                    type="password"
                    name="password"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#1B2447_0%,#3D5BB8_100%)] py-4 text-base font-bold tracking-wide text-white shadow-sm shadow-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 md:shadow-lg md:shadow-blue-500/30"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Ingresando..." : "Ingresar"}
                  <LogIn className="h-4 w-4" />
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-white md:text-slate-500">
                Aun no eres un cliente,
                <Link
                  className="ml-1 font-semibold text-white hover:underline md:text-[#d6452c] md:hover:text-red-600"
                  to="/contacto"
                  hash="contacto"
                >
                  comunicate con nosotros
                </Link>
              </p>
              <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 text-[10px] font-bold tracking-widest text-white uppercase md:flex-row md:text-slate-400">
                <p>© 2026 Factor IQ</p>
                <div className="flex space-x-6">
                  <span>Ayuda</span>
                  <span>Privacidad</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {alert && (
          <div
            className={`fixed bottom-0 left-0 z-50 m-4 flex items-center gap-3 rounded-xl px-5 py-3 text-white shadow-lg ${
              alert.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {alert.type === "success" ? (
              <CircleCheck className="h-5 w-5" />
            ) : (
              <CircleAlert className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{alert.message}</span>
          </div>
        )}
      </main>
    </div>
  );
}
