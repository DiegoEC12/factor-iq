# Migración a Base de Datos MySQL — Factor IQ

> Estado al **2026-09-16**. Documento vivo: actualizar la sección de avance a medida que se completen pasos.

## 1. Contexto

Factor IQ hoy es una app **TanStack Start (React + Vite, Node.js)** desplegada en **GoDaddy Node.js Hosting**. Los datos del único cliente en línea (**Maquinarias**) viven en archivos JSON estáticos (`src/data/mystery-shopping-imported.json`, generado desde el Excel consolidado) y la autenticación usa usuarios hardcodeados en `src/lib/auth.ts` con sesión por cookie firmada.

El hosting GoDaddy incluye **MySQL**, lo que permite migrar a un modelo **multi-cliente** y construir el **panel administrador** para gestionar clientes, usuarios, credenciales e información de empresa.

## 2. Arquitectura objetivo

```
┌────────────────────────────────────────────────────┐
│  Panel SuperAdmin Factor IQ (/admin)               │
│  · CRUD clientes, usuarios, credenciales, planes   │
├────────────────────────────────────────────────────┤
│  Panel de cada cliente (/<slug>, ej. /maquinarias) │
│  · dashboards, evaluaciones, sus usuarios viewer   │
├────────────────────────────────────────────────────┤
│  Capa de datos (server functions TanStack Start)   │
│  · mysql2/promise + pool por request               │
├────────────────────────────────────────────────────┤
│  MySQL (GoDaddy) — base `factor_iq` multi-tenant   │
└────────────────────────────────────────────────────┘
```

Todas las tablas de negocio cuelgan de `clientes` (multi-tenant por `cliente_id`).

## 3. Archivos entregados

| Archivo                         | Contenido                                                                                                                                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `database/schema.sql`           | Creación de la base`factor_iq` y 9 tablas (clientes, usuarios, proyectos, sucursales, indicadores, evaluaciones, evaluacion\_indicadores, evaluacion\_preguntas, auditoria)                           |
| `database/seed_maquinarias.sql` | Datos reales migrados desde el JSON: cliente Maquinarias, 1 proyecto, 29 sucursales, 12 indicadores, 42 evaluaciones, 434 resultados por indicador, 2 494 respuestas a preguntas + usuarios iniciales |
| `scripts/hash-password.mjs`     | Generador de hashes bcrypt para contraseñas de usuarios                                                                                                                                               |

## 4. Avance

* [x] Revisión del stack (TanStack Start, auth por sesión, datos en JSON).

* [x] Diseño del esquema multi-cliente (`database/schema.sql`).

* [x] Script de seed con los datos reales de Maquinarias (`database/seed_maquinarias.sql`).

* [x] Utilidad para generar hashes de contraseña (`scripts/hash-password.mjs`).

* [x] Crear la base MySQL en el hosting GoDaddy (cPanel → MySQL Databases) y usuario con permisos.

* [x] Ejecutar `schema.sql` y `seed_maquinarias.sql` (phpMyAdmin del hosting o cliente MySQL local con tunnel).

* [ ] `npm install mysql2 bcryptjs` y crear `src/lib/db.ts` (pool de conexiones con variables de entorno).

* [ ] Reemplazar `DEMO_USERS` de `src/lib/auth.ts` por validación contra la tabla `usuarios` (bcrypt).

* [ ] Migrar la lectura de dashboards de Maquinarias del JSON a consultas SQL (manteniendo los JSON como fallback durante la transición).

* [ ] Construir el panel `/admin` (superadmin): gestión de clientes, usuarios, credenciales, proyectos.

* [ ] Panel de auto-gestión del cliente: sus usuarios viewer, datos de empresa.

* [ ] Pruebas en staging y despliegue.

## 5. Paso a paso de la migración

### Paso 1 — Crear la base en GoDaddy

1. cPanel → **MySQL® Databases** → crear base `factoriq`.
2. Crear usuario MySQL (ej. `factoriq_app`) con contraseña fuerte y asignarlo a la base con **ALL PRIVILEGES**.
3. Anotar host (normalmente `localhost`), usuario y contraseña para el `.env`.

### Paso 2 — Ejecutar los scripts

Opción A (phpMyAdmin del hosting): Importar `database/schema.sql` y luego `database/seed_maquinarias.sql`.

Opción B (local con WAMP, para probar primero):

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p factor_iq < database/seed_maquinarias.sql
```

### Paso 3 — Contraseñas iniciales

Los hashes del seed son placeholders. Generar los reales:

```bash
npm install bcryptjs
node scripts/hash-password.mjs 'TuPasswordSegura'
```

y actualizar:

```sql
UPDATE usuarios SET password_hash = '<hash>' WHERE usuario = 'admMaqui';
```

### Paso 4 — Conexión desde la app

```bash
npm install mysql2 bcryptjs
```

Agregar a `.env` (y en GoDaddy como variables de entorno):

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=factor_iq
DB_USER=factoriq_app
DB_PASSWORD=********
SESSION_SECRET=<cadena aleatoria >= 32 caracteres>
```

Crear `src/lib/db.ts` con un pool `mysql2/promise` leyendo esas variables.

### Paso 5 — Reemplazar la autenticación

En `src/lib/auth.ts`, sustituir `DEMO_USERS` por:

1. `SELECT * FROM usuarios WHERE usuario = ? AND estado = 'activo'`.
2. `bcrypt.compare(password, password_hash)`.
3. Registrar `ultimo_acceso` y fila en `auditoria` (acción `login`).
4. `redirectTo` según rol: `superadmin → /admin`, resto → `/<slug del cliente>`.

### Paso 6 — Migrar lecturas de datos

Reemplazar los loaders que hoy leen `src/data/*.json` por consultas:

* Evaluaciones + sucursal: `evaluaciones JOIN sucursales`.

* Indicadores por evaluación: `evaluacion_indicadores JOIN indicadores`.

* Preguntas: `evaluacion_preguntas`.
  Mantener el JSON como fallback si `DB_HOST` no está configurado (transición sin downtime).

### Paso 7 — Panel administrador `/admin` (solo rol superadmin)

Módulos sugeridos:

* **Clientes**: alta/edición (datos de empresa, RUC, contacto, logo, color, plan, estado), suspender/activar.

* **Usuarios**: por cliente, reseteo de contraseña (generar hash y forzar cambio), roles, bloqueo.

* **Proyectos**: crear estudio, cargar Excel (reusar `scripts/generate-imported-json.cjs` adaptado para insertar en BD), cerrar periodo.

* **Auditoría**: bitácora de accesos y cambios.

* Protección: `beforeLoad` en la ruta `/admin` validando `rol = 'superadmin'` desde la sesión.

## 6. Decisiones de diseño tomadas

* **Multi-tenant por `cliente_id`** (no base por cliente): más simple en un solo hosting MySQL y suficiente a esta escala.

* **`slug` único por cliente** para URLs (`/maquinarias`), reutilizando el routing actual.

* **Contraseñas solo con bcrypt**; el seed trae placeholders obligando a definirlas.

* **`auditoria`** desde el día uno: clave para un panel que gestiona credenciales.

* **Sucursales normalizadas** (nombre + marca + ubicación únicos por cliente) en lugar de texto repetido en cada evaluación.

## 7. Sugerencias

1. **Recuperación de contraseña**: agregar tabla `password_resets` (token, expiración) y flujo por email; hoy no hay envío de correo en el stack.
2. **Campo `debe_cambiar_password`** en `usuarios` para forzar cambio en el primer login cuando el superadmin crea o resetea credenciales.
3. **Backups**: programar `mysqldump` diario desde cron del hosting antes de poner clientes reales.
4. **Soft delete**: considerar `deleted_at` en `clientes`/`usuarios` en lugar de borrado físico (las FK ya usan `ON DELETE CASCADE`, conviene decidirlo antes de producción).
5. **Carga de nuevos estudios**: convertir el importador Excel actual en una pantalla del panel admin que inserte directamente en MySQL, eliminando la etapa JSON.
6. **Índices por `cliente_id`** ya incluidos; si crece el volumen, particionar `evaluacion_preguntas` por proyecto.
7. **Roles futuros**: si un cliente necesita permisos finos (por sucursal o por módulo), agregar tabla `permisos` en lugar de ampliar el ENUM.

## 8. Riesgos / pendientes por confirmar

* Versión de MySQL del hosting (el esquema usa `utf8mb4` y `JSON`, requiere MySQL 5.7+; ideal 8.x).

* Acceso remoto a MySQL desde la app Node en GoDaddy (normalmente es `localhost`, mismo servidor).

* Definir si los dashboards públicos (benchmark, concesionarias) seguirán leyendo JSON o pasan también a BD.

