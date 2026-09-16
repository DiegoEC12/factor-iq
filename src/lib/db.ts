import mysql from "mysql2/promise";

/**
 * Pool de conexiones MySQL para Factor IQ.
 *
 * Configuración por variables de entorno (ver .env.example):
 *   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 *
 * Si DB_HOST no está configurado, `isDbEnabled()` retorna false y la app
 * puede seguir funcionando con los datos JSON estáticos (modo transición).
 */

let pool: mysql.Pool | null = null;

export function isDbEnabled(): boolean {
  return Boolean(process.env["DB_HOST"] && process.env["DB_NAME"] && process.env["DB_USER"]);
}

export function getPool(): mysql.Pool {
  if (!isDbEnabled()) {
    throw new Error(
      "Base de datos no configurada. Define DB_HOST, DB_NAME, DB_USER y DB_PASSWORD en el entorno.",
    );
  }

  if (!pool) {
    pool = mysql.createPool({
      host: process.env["DB_HOST"],
      port: Number(process.env["DB_PORT"] ?? 3306),
      database: process.env["DB_NAME"],
      user: process.env["DB_USER"],
      password: process.env["DB_PASSWORD"] ?? "",
      waitForConnections: true,
      connectionLimit: 5, // hosting compartido: mantener bajo
      queueLimit: 0,
      charset: "utf8mb4",
      namedPlaceholders: false,
    });
  }

  return pool;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: ReadonlyArray<unknown> = [],
): Promise<T[]> {
  const [rows] = await getPool().execute(sql, params as unknown[]);
  return rows as T[];
}
