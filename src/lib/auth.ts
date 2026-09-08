import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";

export type AuthUser = {
  userId: string;
  clienteId: string;
  nombre: string;
  redirectTo: string;
};

type AuthSession = {
  userId?: string;
  clienteId?: string;
  nombre?: string;
};

function getSessionPassword(): string {
  const secret = process.env["SESSION_SECRET"];
  if (process.env["NODE_ENV"] === "production" && (!secret || secret.length < 32)) {
    throw new Error("SESSION_SECRET debe configurarse con al menos 32 caracteres en producción.");
  }

  // Solo permite esta clave predecible durante desarrollo local. Producción exige
  // explícitamente un secreto configurado para no emitir cookies reutilizables.
  return secret ?? "factor-iq-local-dev-secret-key-min-32";
}

const DEMO_USERS = [
  {
    usuario: "admMaqui",
    password: "adm123",
    clienteId: "maquinarias",
    nombre: "Admin Maquinarias",
    redirectTo: "/maquinarias",
  },
] as const;

async function getSessionManager() {
  return useSession<AuthSession>({
    name: "fiq_session",
    password: getSessionPassword(),
    maxAge: 60 * 60 * 8,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env["NODE_ENV"] === "production",
      path: "/",
    },
  });
}

function toAuthUser(data: AuthSession): AuthUser | null {
  if (!data.userId || !data.clienteId) return null;
  const redirectTo = data.clienteId === "maquinarias" ? "/maquinarias" : "/login";
  return {
    userId: data.userId,
    clienteId: data.clienteId,
    nombre: data.nombre ?? data.userId,
    redirectTo,
  };
}

export const getAuthUserFn = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSessionManager();
  return toAuthUser(session.data);
});

export const loginFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = input as { usuario?: string; password?: string };
    return {
      usuario: String(data.usuario ?? "").trim(),
      password: String(data.password ?? "").trim(),
    };
  })
  .handler(async ({ data }) => {
    if (!data.usuario || !data.password) {
      return {
        ok: false as const,
        message: "Por favor ingresa tu usuario y contraseña.",
      };
    }

    const user = DEMO_USERS.find(
      (candidate) => candidate.usuario === data.usuario && candidate.password === data.password,
    );

    if (!user) {
      return {
        ok: false as const,
        message: "Datos incorrectos. Intenta nuevamente o comunicate con soporte.",
      };
    }

    const session = await getSessionManager();
    await session.update({
      userId: user.usuario,
      clienteId: user.clienteId,
      nombre: user.nombre,
    });

    return { ok: true as const, redirectTo: user.redirectTo };
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getSessionManager();
  await session.clear();
  return { ok: true as const };
});
