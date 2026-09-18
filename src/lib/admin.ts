import { createServerFn } from "@tanstack/react-start";
import bcrypt from "bcryptjs";
import { isDbEnabled, query } from "./db";
import { getAuthUserFn } from "./auth";

export interface ClientInput {
  id?: number;
  slug: string;
  nombre_comercial: string;
  razon_social?: string;
  ruc?: string;
  rubro?: string;
  plan: "basico" | "profesional" | "enterprise";
  estado: "activo" | "suspendido" | "inactivo";
  color_primario?: string;
  contacto_nombre?: string;
  contacto_email?: string;
  contacto_telefono?: string;
}

export interface UserInput {
  id?: number;
  usuario: string;
  nombre: string;
  email?: string;
  password?: string;
  rol: "superadmin" | "admin_cliente" | "viewer";
  cliente_id?: number | null;
  estado: "activo" | "bloqueado" | "inactivo";
}

async function assertSuperAdmin() {
  const user = await getAuthUserFn();
  if (!user || user.rol !== "superadmin") {
    throw new Error("Acceso no autorizado: se requieren permisos de SuperAdmin.");
  }
  return user;
}

async function recordAudit(accion: string, detalle: Record<string, any>) {
  try {
    if (!isDbEnabled()) return;
    const user = await getAuthUserFn();
    await query("INSERT INTO auditoria (usuario_id, accion, detalle) VALUES (?, ?, ?)", [
      user?.userId ? Number(user.userId) : null,
      accion,
      JSON.stringify(detalle),
    ]);
  } catch (err) {
    console.warn("No se pudo registrar auditoría:", err);
  }
}

/**
 * Guardar o actualizar un cliente
 */
export const saveClientFn = createServerFn({ method: "POST" })
  .validator((data: ClientInput) => data)
  .handler(async ({ data }) => {
    const admin = await assertSuperAdmin();

    if (!isDbEnabled()) {
      return { success: true, message: "Operación simulada en modo memoria (MySQL inactivo)." };
    }

    const cleanSlug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
    if (!cleanSlug) {
      throw new Error("El slug es obligatorio y solo debe contener caracteres alfanuméricos y guiones.");
    }
    if (!data.nombre_comercial?.trim()) {
      throw new Error("El nombre comercial es obligatorio.");
    }

    if (data.id) {
      // Actualización
      await query(
        `UPDATE clientes
            SET slug = ?, nombre_comercial = ?, razon_social = ?, ruc = ?, rubro = ?,
                plan = ?, estado = ?, color_primario = ?, contacto_nombre = ?,
                contacto_email = ?, contacto_telefono = ?, updated_at = NOW()
          WHERE id = ?`,
        [
          cleanSlug,
          data.nombre_comercial.trim(),
          data.razon_social?.trim() || null,
          data.ruc?.trim() || null,
          data.rubro?.trim() || null,
          data.plan || "basico",
          data.estado || "activo",
          data.color_primario || null,
          data.contacto_nombre?.trim() || null,
          data.contacto_email?.trim() || null,
          data.contacto_telefono?.trim() || null,
          data.id,
        ],
      );

      await recordAudit("actualizar_cliente", { clienteId: data.id, slug: cleanSlug, modificadoPor: admin.nombre });
      return { success: true, message: `Cliente "${data.nombre_comercial}" actualizado con éxito.` };
    } else {
      // Creación
      const existing = await query("SELECT id FROM clientes WHERE slug = ? OR (ruc IS NOT NULL AND ruc = ?)", [
        cleanSlug,
        data.ruc || "",
      ]);
      if (existing.length > 0) {
        throw new Error("Ya existe un cliente con el mismo Slug o RUC.");
      }

      const result = await query<{ insertId: number }>(
        `INSERT INTO clientes (slug, nombre_comercial, razon_social, ruc, rubro, plan, estado, color_primario, contacto_nombre, contacto_email, contacto_telefono)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cleanSlug,
          data.nombre_comercial.trim(),
          data.razon_social?.trim() || null,
          data.ruc?.trim() || null,
          data.rubro?.trim() || null,
          data.plan || "basico",
          data.estado || "activo",
          data.color_primario || null,
          data.contacto_nombre?.trim() || null,
          data.contacto_email?.trim() || null,
          data.contacto_telefono?.trim() || null,
        ],
      );

      await recordAudit("crear_cliente", { slug: cleanSlug, nombre: data.nombre_comercial, creadoPor: admin.nombre });
      return { success: true, message: `Cliente "${data.nombre_comercial}" registrado con éxito.` };
    }
  });

/**
 * Guardar o actualizar un usuario
 */
export const saveUserFn = createServerFn({ method: "POST" })
  .validator((data: UserInput) => data)
  .handler(async ({ data }) => {
    const admin = await assertSuperAdmin();

    if (!isDbEnabled()) {
      return { success: true, message: "Operación simulada en modo memoria (MySQL inactivo)." };
    }

    const cleanUsername = data.usuario.trim();
    if (!cleanUsername) {
      throw new Error("El nombre de usuario (login) es obligatorio.");
    }
    if (!data.nombre?.trim()) {
      throw new Error("El nombre de la persona es obligatorio.");
    }

    const clienteId = data.rol === "superadmin" ? null : data.cliente_id || null;

    if (data.id) {
      // Actualizar usuario existente
      if (data.password && data.password.trim().length > 0) {
        const hash = await bcrypt.hash(data.password, 10);
        await query(
          `UPDATE usuarios
              SET usuario = ?, nombre = ?, email = ?, password_hash = ?, rol = ?, cliente_id = ?, estado = ?, updated_at = NOW()
            WHERE id = ?`,
          [
            cleanUsername,
            data.nombre.trim(),
            data.email?.trim() || null,
            hash,
            data.rol,
            clienteId,
            data.estado,
            data.id,
          ],
        );
        await recordAudit("cambio_clave_admin", { usuarioModificado: cleanUsername, modificadoPor: admin.nombre });
      } else {
        await query(
          `UPDATE usuarios
              SET usuario = ?, nombre = ?, email = ?, rol = ?, cliente_id = ?, estado = ?, updated_at = NOW()
            WHERE id = ?`,
          [
            cleanUsername,
            data.nombre.trim(),
            data.email?.trim() || null,
            data.rol,
            clienteId,
            data.estado,
            data.id,
          ],
        );
      }

      await recordAudit("actualizar_usuario", { usuarioId: data.id, usuario: cleanUsername, modificadoPor: admin.nombre });
      return { success: true, message: `Usuario "${cleanUsername}" actualizado con éxito.` };
    } else {
      // Crear nuevo usuario
      if (!data.password || data.password.length < 6) {
        throw new Error("La contraseña inicial es requerida (mínimo 6 caracteres).");
      }

      const existing = await query("SELECT id FROM usuarios WHERE usuario = ? OR (email IS NOT NULL AND email = ?)", [
        cleanUsername,
        data.email || "",
      ]);
      if (existing.length > 0) {
        throw new Error("Ya existe un usuario con ese nombre de usuario o correo electrónico.");
      }

      const hash = await bcrypt.hash(data.password, 10);

      await query(
        `INSERT INTO usuarios (usuario, nombre, email, password_hash, rol, cliente_id, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          cleanUsername,
          data.nombre.trim(),
          data.email?.trim() || null,
          hash,
          data.rol,
          clienteId,
          data.estado || "activo",
        ],
      );

      await recordAudit("crear_usuario", { usuario: cleanUsername, rol: data.rol, creadoPor: admin.nombre });
      return { success: true, message: `Usuario "${cleanUsername}" creado exitosamente.` };
    }
  });

/**
 * Restablecer contraseña de un usuario directamente
 */
export const resetUserPasswordFn = createServerFn({ method: "POST" })
  .validator((data: { userId: number; newPassword: string; usuarioName: string }) => data)
  .handler(async ({ data }) => {
    const admin = await assertSuperAdmin();

    if (!data.newPassword || data.newPassword.length < 6) {
      throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
    }

    if (!isDbEnabled()) {
      return { success: true, message: "Contraseña actualizada en simulación." };
    }

    const hash = await bcrypt.hash(data.newPassword, 10);
    await query("UPDATE usuarios SET password_hash = ?, intentos_fallidos = 0, updated_at = NOW() WHERE id = ?", [
      hash,
      data.userId,
    ]);

    await recordAudit("reset_password", {
      usuarioId: data.userId,
      usuario: data.usuarioName,
      restablecidoPor: admin.nombre,
    });

    return { success: true, message: `Contraseña restablecida con éxito para el usuario ${data.usuarioName}.` };
  });

/**
 * Cambiar estado de usuario (activo / bloqueado / inactivo)
 */
export const toggleUserStatusFn = createServerFn({ method: "POST" })
  .validator((data: { userId: number; nuevoEstado: "activo" | "bloqueado" | "inactivo"; usuarioName: string }) => data)
  .handler(async ({ data }) => {
    const admin = await assertSuperAdmin();

    if (!isDbEnabled()) {
      return { success: true, message: "Estado cambiado (simulación)." };
    }

    await query("UPDATE usuarios SET estado = ?, updated_at = NOW() WHERE id = ?", [data.nuevoEstado, data.userId]);

    await recordAudit("cambio_estado_usuario", {
      usuarioId: data.userId,
      usuario: data.usuarioName,
      nuevoEstado: data.nuevoEstado,
      modificadoPor: admin.nombre,
    });

    return { success: true, message: `Estado del usuario ${data.usuarioName} cambiado a ${data.nuevoEstado}.` };
  });

/**
 * Cambiar estado de cliente (activo / suspendido / inactivo)
 */
export const toggleClientStatusFn = createServerFn({ method: "POST" })
  .validator((data: { clientId: number; nuevoEstado: "activo" | "suspendido" | "inactivo"; slug: string }) => data)
  .handler(async ({ data }) => {
    const admin = await assertSuperAdmin();

    if (!isDbEnabled()) {
      return { success: true, message: "Estado de cliente cambiado (simulación)." };
    }

    await query("UPDATE clientes SET estado = ?, updated_at = NOW() WHERE id = ?", [data.nuevoEstado, data.clientId]);

    await recordAudit("cambio_estado_cliente", {
      clientId: data.clientId,
      slug: data.slug,
      nuevoEstado: data.nuevoEstado,
      modificadoPor: admin.nombre,
    });

    return { success: true, message: `Estado del cliente cambiado a ${data.nuevoEstado}.` };
  });
