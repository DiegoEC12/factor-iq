import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { LOGIN_PATH, PUBLIC_NAV } from "../nav";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="fixed top-0 z-50 w-full border-blue-500 bg-white/95 shadow-md backdrop-blur-sm">
      <div className="z-50 mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex h-full items-center py-2">
          <Link to="/" onClick={() => setOpen(false)} className="sm:hidden">
            <img
              className="h-12 w-12 rounded-full object-contain"
              src="/assets/icon/Isotipo IQ.png"
              alt="Isotipo Factor IQ"
            />
          </Link>
          <Link to="/" onClick={() => setOpen(false)} className="hidden sm:block">
            <img className="h-12 w-auto max-h-14" src="/assets/img/logo-transparent.png" alt="Factor IQ" />
          </Link>
        </div>

        <nav
          className={cn(
            "absolute top-18 left-0 z-10 h-[calc(100dvh-4.5rem)] w-full flex-col bg-[#1b2447] lg:relative lg:top-0 lg:flex lg:h-full lg:flex-row lg:bg-transparent",
            open ? "flex" : "hidden lg:flex",
          )}
        >
          <ul className="flex w-full flex-col items-center justify-end gap-4 py-4 text-center lg:flex-row lg:py-0">
            {PUBLIC_NAV.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <li
                  key={item.to}
                  className="flex h-20 w-full items-center justify-center lg:h-full lg:w-auto"
                >
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex h-full w-full cursor-pointer items-center justify-center px-2 font-bold text-white hover:bg-blue-800 lg:border-b-2 lg:text-gray-500 lg:hover:bg-transparent lg:hover:text-blue-500",
                      active ? "lg:border-blue-500" : "lg:border-transparent",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="flex h-20 w-full items-center justify-center lg:h-full lg:w-auto">
              <Link
                to={LOGIN_PATH as "/pages/servicio_nube.html"}
                onClick={() => setOpen(false)}
                className="flex h-full w-full cursor-pointer items-center justify-center px-2 font-bold text-white lg:h-fit lg:rounded-2xl lg:border lg:border-white/10 lg:bg-[#1b2447] lg:px-4 lg:py-2 lg:hover:bg-[#3d5bb8]"
              >
                Servicio en la nube
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center justify-center lg:hidden">
          <button
            className="cursor-pointer"
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-9 w-9 text-blue-900" /> : <Menu className="h-9 w-9 text-blue-900" />}
          </button>
        </div>
      </div>
    </header>
  );
}
