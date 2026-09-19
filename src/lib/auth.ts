import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import bcrypt from "bcryptjs";
import { isDbEnabled, query } from "./db";

export type AuthUser = {
  userId: string;
  clienteId: string;
  nombre: string;
  rol: "superadmin" | "admin_cliente" | "editor_web" | "soporte" | "viewer";
  redirectTo: string;
};

type AuthSession = {
  userId?: string;
  clienteId?: string;
  nombre?: string;
  rol?: AuthUser["rol"];
};

type UsuarioRow = {
  id: number;
  usuario: string;
  password_hash: string;
  nombre: string;
  rol: AuthUser["rol"];
  cliente_id: number | null;
  cliente_slug: string | null;
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

// Usado únicamente cuando la base de datos no está configurada (modo transición).
const DEMO_USERS = [
  {
    usuario: "admMaqui",
    password: "adm123",
    clienteId: "maquinarias",
    nombre: "Admin Maquinarias",
    rol: "admin_cliente" as const,
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

function redirectFor(rol: AuthUser["rol"], clienteSlug: string | null): string {
  if (rol === "superadmin") return "/admin";
  return clienteSlug ? `/${clienteSlug}` : "/login";
}

function toAuthUser(data: AuthSession): AuthUser | null {
  if (!data.userId) return null;
  const rol = data.rol ?? "viewer";
  return {
    userId: data.userId,
    clienteId: data.clienteId ?? "",
    nombre: data.nombre ?? data.userId,
    rol,
    redirectTo: redirectFor(rol, data.clienteId ?? null),
  };
}

async function findUsuario(usuario: string): Promise<UsuarioRow | null> {
  const rows = await query<UsuarioRow>(
    `SELECT u.id, u.usuario, u.password_hash, u.nombre, u.rol, u.cliente_id,
            c.slug AS cliente_slug
       FROM usuarios u
       LEFT JOIN clientes c ON c.id = u.cliente_id
      WHERE u.usuario = ? AND u.estado = 'activo'
      LIMIT 1`,
    [usuario],
  );
  return rows[0] ?? null;
}

async function registrarAcceso(usuarioId: number, ok: boolean): Promise<void> {
  try {
    if (ok) {
      await query("UPDATE usuarios SET ultimo_acceso = NOW(), intentos_fallidos = 0 WHERE id = ?", [
        usuarioId,
      ]);
    } else {
      await query("UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1 WHERE id = ?", [
        usuarioId,
      ]);
    }
    await query("INSERT INTO auditoria (usuario_id, accion, detalle) VALUES (?, ?, ?)", [
      usuarioId,
      ok ? "login" : "login_fallido",
      JSON.stringify({ ok }),
    ]);
  } catch {
    // La auditoría nunca debe romper el login.
  }
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

    // Modo transición: sin BD configurada, usar el usuario demo.
    if (!isDbEnabled()) {
      const demo = DEMO_USERS.find(
        (candidate) => candidate.usuario === data.usuario && candidate.password === data.password,
      );
      if (!demo) {
        return {
          ok: false as const,
          message: "Datos incorrectos. Intenta nuevamente o comunicate con soporte.",
        };
      }
      const session = await getSessionManager();
      await session.update({
        userId: demo.usuario,
        clienteId: demo.clienteId,
        nombre: demo.nombre,
        rol: demo.rol,
      });
      return { ok: true as const, redirectTo: demo.redirectTo };
    }

    const user = await findUsuario(data.usuario);
    const passwordOk = user ? await bcrypt.compare(data.password, user.password_hash) : false;

    if (!user || !passwordOk) {
      if (user) await registrarAcceso(user.id, false);
      return {
        ok: false as const,
        message: "Datos incorrectos. Intenta nuevamente o comunicate con soporte.",
      };
    }

    await registrarAcceso(user.id, true);

    const session = await getSessionManager();
    await session.update({
      userId: user.usuario,
      clienteId: user.cliente_slug ?? "",
      nombre: user.nombre,
      rol: user.rol,
    });

    return { ok: true as const, redirectTo: redirectFor(user.rol, user.cliente_slug) };
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getSessionManager();
  await session.clear();
  return { ok: true as const };
});
