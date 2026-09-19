import { createServerFn } from "@tanstack/react-start";
import { isDbEnabled, query } from "../db";
import bundledRaw from "@/data/mystery-shopping-imported.json";
import type { Evaluacion, IndicadorRow, PreguntaRow } from "../analytics";

export interface MysteryShoppingPayload {
  meta: {
    source: string;
    importedAt: string;
    evaluationCount: number;
    provider: "mysql" | "bundled-json";
  };
  evaluaciones: Evaluacion[];
  indicadores: IndicadorRow[];
  preguntas: PreguntaRow[];
}

export const getMysteryShoppingDataFn = createServerFn({ method: "GET" })
  .validator((slug?: string) => slug || "maquinarias")
  .handler(async ({ data: clientSlug }): Promise<MysteryShoppingPayload> => {
    if (!isDbEnabled()) {
      return {
        ...(bundledRaw as unknown as Omit<MysteryShoppingPayload, "meta">),
        meta: {
          ...bundledRaw.meta,
          provider: "bundled-json",
        },
      };
    }

    try {
      // 1. Evaluaciones + Sucursales
      const evRows = await query<{
        codigo: string;
        concesionaria: string;
        marca: string;
        ubicacion: string;
        tipo_evaluacion: string;
        puntaje: string | number;
        resumen: string | null;
        recomendaciones: string | null;
      }>(
        `SELECT e.codigo, s.nombre AS concesionaria, s.marca, s.ubicacion,
                e.tipo_evaluacion, e.puntaje, e.resumen, e.recomendaciones
           FROM evaluaciones e
           JOIN sucursales s ON s.id = e.sucursal_id
           JOIN proyectos p ON p.id = e.proyecto_id
           JOIN clientes c ON c.id = p.cliente_id
          WHERE c.slug = ?
          ORDER BY e.id ASC`,
        [clientSlug],
      );

      if (!evRows || evRows.length === 0) {
        // Fallback si no hay evaluaciones en BD para este cliente
        return {
          ...(bundledRaw as unknown as Omit<MysteryShoppingPayload, "meta">),
          meta: {
            ...bundledRaw.meta,
            provider: "bundled-json",
          },
        };
      }

      // 2. Resultados por indicador
      const indRows = await query<{
        ev: string;
        n: number;
        nombre: string;
        peso: string | number;
        cumpl: string | number;
      }>(
        `SELECT e.codigo AS ev, i.orden AS n, i.nombre, i.peso, ei.cumplimiento AS cumpl
           FROM evaluacion_indicadores ei
           JOIN evaluaciones e ON e.id = ei.evaluacion_id
           JOIN indicadores i ON i.id = ei.indicador_id
           JOIN proyectos p ON p.id = e.proyecto_id
           JOIN clientes c ON c.id = p.cliente_id
          WHERE c.slug = ?
          ORDER BY e.id ASC, i.orden ASC`,
        [clientSlug],
      );

      // 3. Respuestas a preguntas
      const pregRows = await query<{
        ev: string;
        ind: number;
        indicador: string;
        q: string;
        resp: string | null;
        nota: string | number | null;
        obs: string | null;
      }>(
        `SELECT e.codigo AS ev, i.orden AS ind, i.nombre AS indicador,
                ep.pregunta AS q, ep.respuesta AS resp, ep.nota, ep.observacion AS obs
           FROM evaluacion_preguntas ep
           JOIN evaluaciones e ON e.id = ep.evaluacion_id
           JOIN indicadores i ON i.id = ep.indicador_id
           JOIN proyectos p ON p.id = e.proyecto_id
           JOIN clientes c ON c.id = p.cliente_id
          WHERE c.slug = ?
          ORDER BY e.id ASC, ep.id ASC`,
        [clientSlug],
      );

      return {
        meta: {
          source: `MySQL (factoriq) - Cliente: ${clientSlug}`,
          importedAt: new Date().toISOString(),
          evaluationCount: evRows.length,
          provider: "mysql",
        },
        evaluaciones: evRows.map((e) => ({
          id: e.codigo,
          concesionaria: e.concesionaria ?? "",
          marca: e.marca ?? "",
          ubicacion: e.ubicacion ?? "",
          puntaje: Number(e.puntaje) || 0,
          resumen: e.resumen ?? null,
          recomendaciones: e.recomendaciones ?? null,
          tipoEvaluacion: e.tipo_evaluacion ?? "Ventas",
        })),
        indicadores: indRows.map((i) => ({
          ev: i.ev,
          n: Number(i.n),
          nombre: i.nombre,
          peso: Number(i.peso) || 0,
          cumpl: Number(i.cumpl) || 0,
        })),
        preguntas: pregRows.map((p) => ({
          ev: p.ev,
          ind: Number(p.ind),
          indicador: p.indicador,
          q: p.q,
          resp: p.resp ?? null,
          nota: p.nota === null || p.nota === undefined ? null : Number(p.nota),
          obs: p.obs ?? null,
        })),
      };
    } catch (err) {
      console.warn("Error al consultar MySQL para Mystery Shopping, usando fallback JSON:", err);
      return {
        ...(bundledRaw as unknown as Omit<MysteryShoppingPayload, "meta">),
        meta: {
          ...bundledRaw.meta,
          provider: "bundled-json",
        },
      };
    }
  });

export interface AdminStatsPayload {
  dbEnabled: boolean;
  connected: boolean;
  stats: {
    clientes: number;
    usuarios: number;
    proyectos: number;
    sucursales: number;
    evaluaciones: number;
    indicadores: number;
    auditoria: number;
    tickets: number;
  };
  clientes: Array<{
    id: number;
    slug: string;
    nombre_comercial: string;
    razon_social: string | null;
    ruc: string | null;
    rubro: string | null;
    plan: string;
    estado: string;
    created_at: string;
  }>;
  usuarios: Array<{
    id: number;
    usuario: string;
    nombre: string;
    email: string | null;
    rol: string;
    estado: string;
    cliente_nombre: string | null;
    ultimo_acceso: string | null;
  }>;
  auditoria: Array<{
    id: number;
    accion: string;
    usuario: string | null;
    detalle: string | null;
    created_at: string;
  }>;
  proyectos: Array<{
    id: number;
    cliente_id: number;
    cliente_nombre: string;
    nombre: string;
    tipo: string;
    periodo: string | null;
    estado: string;
    fecha_inicio: string | null;
    fecha_fin: string | null;
  }>;
  tickets: Array<{
    id: number;
    asunto: string;
    cliente_nombre: string | null;
    estado: string;
    prioridad: string;
    created_at: string;
  }>;
}

export const getAdminStatsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminStatsPayload> => {
    const defaultRes: AdminStatsPayload = {
      dbEnabled: isDbEnabled(),
      connected: false,
      stats: {
        clientes: 1,
        usuarios: 2,
        proyectos: 1,
        sucursales: 29,
        evaluaciones: 42,
        indicadores: 19,
        auditoria: 0,
        tickets: 0,
      },
      clientes: [
        {
          id: 1,
          slug: "maquinarias",
          nombre_comercial: "Maquinarias",
          razon_social: "Maquinarias S.A.",
          ruc: "20100055411",
          rubro: "Automotriz / Maquinaria",
          plan: "profesional",
          estado: "activo",
          created_at: new Date().toISOString(),
        },
      ],
      usuarios: [
        {
          id: 1,
          usuario: "superadmin",
          nombre: "Super Admin Factor IQ",
          email: "admin@factor-iq.com",
          rol: "superadmin",
          estado: "activo",
          cliente_nombre: "Factor IQ Global",
          ultimo_acceso: null,
        },
        {
          id: 2,
          usuario: "admMaqui",
          nombre: "Admin Maquinarias",
          email: "contacto@maquinarias.pe",
          rol: "admin_cliente",
          estado: "activo",
          cliente_nombre: "Maquinarias",
          ultimo_acceso: null,
        },
      ],
      auditoria: [],
      proyectos: [
        {
          id: 1,
          cliente_id: 1,
          cliente_nombre: "Maquinarias",
          nombre: "Mystery Shopping Maquinarias",
          tipo: "mystery_shopping",
          periodo: "Base consolidada 2025",
          estado: "activo",
          fecha_inicio: null,
          fecha_fin: null,
        },
      ],
      tickets: [],
    };

    if (!isDbEnabled()) {
      return defaultRes;
    }

    try {
      const [cCount] = await query<{ count: number }>("SELECT count(*) AS count FROM clientes");
      const [uCount] = await query<{ count: number }>("SELECT count(*) AS count FROM usuarios");
      const [pCount] = await query<{ count: number }>("SELECT count(*) AS count FROM proyectos");
      const [sCount] = await query<{ count: number }>("SELECT count(*) AS count FROM sucursales");
      const [eCount] = await query<{ count: number }>("SELECT count(*) AS count FROM evaluaciones");
      const [iCount] = await query<{ count: number }>("SELECT count(*) AS count FROM indicadores");
      const [aCount] = await query<{ count: number }>("SELECT count(*) AS count FROM auditoria");
      const [tCount] = await query<{ count: number }>("SELECT count(*) AS count FROM tickets");

      const clientes = await query<AdminStatsPayload["clientes"][0]>(
        "SELECT id, slug, nombre_comercial, razon_social, ruc, rubro, plan, estado, created_at FROM clientes ORDER BY id ASC",
      );

      const usuarios = await query<AdminStatsPayload["usuarios"][0]>(
        `SELECT u.id, u.usuario, u.nombre, u.email, u.rol, u.estado, u.ultimo_acceso,
                COALESCE(c.nombre_comercial, 'Factor IQ Global') AS cliente_nombre
           FROM usuarios u
           LEFT JOIN clientes c ON c.id = u.cliente_id
          ORDER BY u.id ASC`,
      );

      const auditoria = await query<AdminStatsPayload["auditoria"][0]>(
        `SELECT a.id, a.accion, COALESCE(u.usuario, 'Sistema') AS usuario, a.detalle, a.created_at
           FROM auditoria a
           LEFT JOIN usuarios u ON u.id = a.usuario_id
          ORDER BY a.id DESC
          LIMIT 20`,
      );

      const proyectos = await query<AdminStatsPayload["proyectos"][0]>(
        `SELECT p.id, p.cliente_id, c.nombre_comercial AS cliente_nombre, p.nombre, p.tipo,
                p.periodo, p.estado, p.fecha_inicio, p.fecha_fin
           FROM proyectos p
           JOIN clientes c ON c.id = p.cliente_id
          ORDER BY p.updated_at DESC, p.id DESC`,
      );

      const tickets = await query<AdminStatsPayload["tickets"][0]>(
        `SELECT t.id, t.asunto, c.nombre_comercial AS cliente_nombre, t.estado, t.prioridad,
                t.created_at
           FROM tickets t
           LEFT JOIN clientes c ON c.id = t.cliente_id
          ORDER BY FIELD(t.estado, 'abierto', 'en_analisis', 'resuelto'), t.updated_at DESC
          LIMIT 30`,
      );

      return {
        dbEnabled: true,
        connected: true,
        stats: {
          clientes: Number(cCount?.count || 0),
          usuarios: Number(uCount?.count || 0),
          proyectos: Number(pCount?.count || 0),
          sucursales: Number(sCount?.count || 0),
          evaluaciones: Number(eCount?.count || 0),
          indicadores: Number(iCount?.count || 0),
          auditoria: Number(aCount?.count || 0),
          tickets: Number(tCount?.count || 0),
        },
        clientes: clientes || [],
        usuarios: usuarios || [],
        auditoria: auditoria || [],
        proyectos: proyectos || [],
        tickets: tickets || [],
      };
    } catch (err) {
      console.warn("No se pudo conectar a MySQL para admin stats:", err);
      return { ...defaultRes, connected: false };
    }
  },
);
