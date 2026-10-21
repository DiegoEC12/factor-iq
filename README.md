# Factor IQ — Plataforma Integral de Mystery Shopping y Encuestas Virtuales

Plataforma empresarial de inteligencia operativa y analítica de experiencia del cliente (**CX**) desarrollada para **Maquinarias** y arquitectada como un sistema **multi-tenant** de alta escalabilidad.

Integra la web institucional pública de **Factor IQ**, el portal ejecutivo de **Mystery Shopping**, el módulo operativo de **Cuestionarios / Encuestas Virtuales en Tiempo Real** y el **Panel SuperAdmin** para la gestión de clientes, usuarios, auditoría y base de datos.

---

## 📑 Tabla de Contenidos

1. [Arquitectura del Sistema](#-arquitectura-del-sistema)
2. [Módulos de la Plataforma](#-módulos-de-la-plataforma)
   - [A. Resumen Ejecutivo](#a-resumen-ejecutivo)
   - [B. Indicadores](#b-indicadores)
   - [C. Benchmark](#c-benchmark)
   - [D. Concesionarias](#d-concesionarias)
   - [E. Cuestionarios y Encuestas Virtuales (Explicación y Fórmulas)](#e-cuestionarios-y-encuestas-virtuales)
   - [F. Panel SuperAdmin](#f-panel-superadmin)
3. [Fórmulas y Métodos de Cálculo](#-fórmulas-y-métodos-de-cálculo)
4. [Estructura y Esquema de Base de Datos MySQL](#-estructura-y-esquema-de-base-de-datos-mysql)
5. [Filtros Globales y Canales de Evaluación](#-filtros-globales-y-canales-de-evaluación)
6. [Importación Segura de Datos (Excel)](#-importación-segura-de-datos-excel)
7. [Pila Tecnológica](#-pila-tecnológica)
8. [Instalación y Puesta en Marcha Local](#-instalación-y-puesta-en-marcha-local)
9. [Guía de Despliegue en Producción (GoDaddy y Vercel)](#-guía-de-despliegue-en-producción)

---

## 🏛 Arquitectura del Sistema

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FACTOR IQ (Multi-Tenant)                        │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐        ┌──────────────────┐
│   Web Pública    │       │ Portal Cliente   │        │ Panel SuperAdmin │
│   (Factor IQ)    │       │  (/maquinarias)  │        │     (/admin)     │
│ · Landing        │       │ · Resumen Exec.  │        │ · CRUD Clientes  │
│ · Nosotros       │       │ · Indicadores    │        │ · Usuarios / Rol │
│ · Servicios      │       │ · Benchmark      │        │ · Salud MySQL    │
│ · Contacto       │       │ · Concesionarias │        │ · Importador XLS │
│ · Acceso Clientes│       │ · Cuestionarios  │        │ · Auditoría      │
└──────────────────┘       └─────────┬────────┘        └──────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌────────────────────────────────────┐         ┌───────────────────────────────────┐
│       Mystery Shopping (Audit)     │         │   Cuestionarios / Encuestas       │
│ · Evaluaciones en punto de venta   │         │ · Nuevos, Post Venta, Seminuevos  │
│ · 12 indicadores ponderados        │         │ · CSAT, NPS y métricas en vivo    │
│ · Comparativa de concesionarias    │         │ · Modificador y Realizadas        │
└────────────────────────────────────┘         └───────────────────────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │    MySQL Database (Base: factoriq)  │
                  └─────────────────────────────────────┘
```

---

## 🚀 Módulos de la Plataforma

### A. Resumen Ejecutivo
Vista macro para directores y gerentes que consolida el estado global de la red:
* **KPIs Principales**: Cumplimiento general porcentual, número de evaluaciones ejecutadas y comparación de canal.
* **Semáforo Institucional**:
  * 🟢 **Óptimo**: $\ge 85\%$
  * 🟡 **Observación**: $70\% - 84\%$
  * 🔴 **Crítico**: $< 70\%$
* **Benchmark Rápido**: Comparativo directo contra la competencia del sector automotriz.
* **Mapa de Calor (Heatmap)**: Matriz de calor cruzando concesionarias vs. indicadores evaluados.
* **Hallazgos y Preguntas Críticas**: Desglose de preguntas clave con menor cumplimiento para planes de acción inmediata.

---

### B. Indicadores
Módulo analítico que desglosa los **12 indicadores clave** de la experiencia en tienda:
1. Instalaciones y Ambiente General
2. Protocolo de atención
3. Identificación de necesidades
4. Asesoría y demostración de producto
5. Prueba de manejo (Test Drive)
6. Presentación de cotización
7. Financiamiento y alternativas de pago
8. Manejo de objeciones y alternativas
9. Cierre de venta o acuerdo comercial
10. Despedida y seguimiento
11. Imagen y presencia del asesor
12. Tiempo y agilidad en sala de venta

* **Interacción**: Al seleccionar un indicador, se despliega el listado de locales con su respectiva barra de progreso y porcentaje, más un panel lateral que detalla las **fortalezas** y **puntos de mejora** específicos.

---

### C. Benchmark
Comparativa competitiva del sector:
* Contrapone los puntajes de **Maquinarias** contra marcas competidoras líderes evaluadas bajo los mismos estándares metodológicos.
* Filtros por canal: Ventas, Seminuevos, Posventa y Call Center.

---

### D. Concesionarias
Módulo de rendimiento por sede y sucursal:
* **Ranking de Concesionarias**: Ordenamiento de mayor a menor desempeño.
* **Drill-down analítico**: Rendimiento de cada local en los 12 indicadores.
* **Historial de evaluaciones**: Consultas específicas por fecha, asesor evaluado y puntaje individual.

---

### E. Cuestionarios y Encuestas Virtuales

Módulo interactivo y transaccional diseñado para levantar y medir la satisfacción directa del cliente en 3 canales clave: **Vehículos Nuevos**, **Post Venta (Taller)** y **Semi Nuevos**.

```
/maquinarias/cuestionarios
├── [Dashboard Principal] ── KPIs globales (Evaluadas, Completas, CSAT, NPS) y tarjetas por segmento
├── /modificar             ── Editor visual de preguntas, tipos de respuesta y opciones JSON
├── /realizadas/$tipo      ── Listado con buscador en tiempo real de encuestas completadas
│   └── /$respuestaId      ── Vista detallada e individual de la encuesta contestada
└── /$tipo                 ── Formulario de llenado interactivo por bloques (también en /encuesta/$token)
```

#### Submódulos y Capacidades:

1. **Dashboard General (`/maquinarias/cuestionarios`)**:
   * **Tarjetas superiores (KPIs)**:
     * *Personas evaluadas*: Conteo acumulado de encuestados únicos.
     * *Respuestas completas*: Encuestas en estado `completa`.
     * *CSAT Promedio*: Promedio ponderado sobre 5 puntos (`X.X/5`).
     * *NPS Promedio*: Promedio de recomendación sobre 10 puntos (`X.X/10`).
   * **Tarjetas por Cuestionario**:
     * Muestra las encuestas completadas, el CSAT específico y el NPS del canal (Nuevos, Post Venta, Semi Nuevos).
     * Enlaces directos a la encuesta interna o enlace público para clientes (`/encuesta/mqi-...`).
   * **Distribución por Sede**: Gráfico de frecuencias por local de atención.

2. **Editor de Cuestionarios (`/maquinarias/cuestionarios/modificar`)**:
   * Permite activar/desactivar preguntas, definir obligatoriedad y modificar textos y opciones de respuesta.
   * Admite tipos: `select` (combo box), `scale` (escala Likert o NPS), `checks` (selección múltiple), `text` (texto corto) y `textarea` (comentarios libres).
   * **Versionado atómico**: Al publicar, se incrementa la versión en base de datos (`version + 1`) manteniendo inalteradas las respuestas históricas previamente registradas.

3. **Cuestionarios Realizados (`/maquinarias/cuestionarios/realizadas/$tipo`)**:
   * Tabla con buscador reactivo por correo, edad, distrito, sede o NPS.
   * Botón de inspección individual (`/realizadas/$tipo/$respuestaId`) que reconstruye el cuestionario completo con todas las alternativas marcadas por el cliente.

4. **Llenado y Persistencia en Tiempo Real**:
   * Formulario por pasos con barra de progreso y validaciones obligatorias.
   * Al pulsar **Finalizar**, la Server Function `submitQuestionnaireResponseFn` almacena en MySQL en una sola transacción la cabecera en `cuestionario_respuestas` y el detalle en `cuestionario_respuesta_items`.
   * **Actualización instantánea**: Invalida el caché de TanStack Router (`router.invalidate()`), refrescando automáticamente el dashboard y la lista de respuestas sin recargar la página (sin necesidad de F5).

---

### F. Panel SuperAdmin (`/admin`)

Entorno exclusivo para el rol `superadmin`:
* **Salud del Sistema**: Conexión a MySQL, latencia de base de datos y volumen de registros.
* **Directorio de Clientes**: Gestión de empresas, slugs, proyectos asociados y estado de cuenta.
* **Directorio de Usuarios**: Altas, bajas, asignación de roles (`superadmin`, `cliente_admin`, `viewer`) y hashing seguro de contraseñas con `bcryptjs`.
* **Bitácora de Auditoría**: Trazabilidad de accesos, inicios de sesión y modificaciones de datos.
* **Importación Segura**: Carga controlada de archivos Excel.

---

## 📊 Fórmulas y Métodos de Cálculo

### 1. CSAT (Customer Satisfaction Score)

El indicador de satisfacción se mide en la pregunta:
> *"Evaluación general de tu experiencia reciente"* (escala de 1 a 5 estrellas/puntos).

* **CSAT por Cuestionario / Canal**:
  $$\text{CSAT}_{\text{canal}} = \frac{\sum \text{Puntajes CSAT en el canal}}{\text{Total de encuestas completadas en el canal}}$$

* **CSAT Promedio Global (Dashboard Superior)**:
  Se calcula mediante **promedio general ponderado por encuestado**, garantizando que cada cliente tenga el mismo peso:
  $$\text{CSAT}_{\text{global}} = \frac{\sum_{i=1}^{N} \text{Puntaje CSAT}_i}{N}$$
  *(donde $N$ es el total consolidado de clientes evaluados en todos los canales).*

---

### 2. NPS (Net Promoter Score)

El indicador de recomendación se mide en la pregunta:
> *"¿Qué tan probable es que recomiendes Maquinarias a un familiar o colega?"* (escala de 0 a 10).

* **Calificación Promedio de Recomendación (Score /10)**:
  $$\overline{\text{NPS}} = \frac{\sum_{i=1}^{N} \text{Puntaje NPS}_i}{N}$$

* **Net Promoter Score Metodológico Oficial (-100 a +100)**:
  Los clientes se clasifican según su puntuación:
  * **Promotores**: Calificaciones de `9` y `10`.
  * **Pasivos**: Calificaciones de `7` y `8`.
  * **Detractores**: Calificaciones de `0` a `6`.

  $$\text{NPS (\%)} = \% \text{ Promotores} - \% \text{ Detractores} = \left(\frac{P - D}{N}\right) \times 100$$

---

### 3. Mystery Shopping — Cumplimiento de Indicadores

Para las evaluaciones presenciales de Mystery Shopping:
* Cada pregunta tiene un puntaje obtenido y un puntaje máximo.
* El cumplimiento del indicador es la razón entre puntos obtenidos y puntos posibles:
  $$\text{Cumplimiento}_{\text{indicador}} = \frac{\sum \text{Puntos Obtenidos}}{\sum \text{Puntos Máximos}}$$
* La nota global de una evaluación aplica la ponderación establecida para cada indicador según el canal (Ventas, Postventa, Seminuevos o Call Center):
  $$\text{Nota Final} = \sum_{k=1}^{M} \left( \text{Cumplimiento}_k \times \text{Peso}_k \right)$$

---

## 🗄 Estructura y Esquema de Base de Datos MySQL

Base de datos relacional: **`factoriq`** (UTF-8 `utf8mb4_0900_ai_ci`).

```
clientes (id, nombre, slug, estado)
 ├── usuarios (id, cliente_id, usuario, email, password_hash, rol)
 ├── proyectos (id, cliente_id, nombre, anio, estado)
 │    ├── sucursales (id, proyecto_id, concesionaria, marca, ubicacion, zona)
 │    ├── indicadores (id, proyecto_id, tipo_evaluacion, codigo, nombre, peso, orden)
 │    └── evaluaciones (id, proyecto_id, sucursal_id, codigo, tipo_evaluacion, fecha_evaluacion, puntaje, cumplimiento)
 │         ├── evaluacion_indicadores (evaluacion_id, indicador_id, puntaje, cumplimiento)
 │         └── evaluacion_preguntas (evaluacion_id, pregunta_id, respuesta, puntaje)
 └── cuestionarios (id, cliente_id, codigo, nombre, version, estado)
      ├── cuestionario_preguntas (id, cuestionario_id, codigo, orden, texto, tipo, tipo_respuesta, opciones)
      └── cuestionario_respuestas (id, cuestionario_id, respondente_email, edad, sexo, distrito_residencia, sede_atencion, estado)
           └── cuestionario_respuesta_items (id, respuesta_id, pregunta_id, valor_texto, valor_numero, valor_json)
```

### Scripts y Migraciones en `database/`:
* [`database/schema.sql`](database/schema.sql): Estructura base completa con restricciones e índices.
* [`database/seed_maquinarias.sql`](database/seed_maquinarias.sql): Carga de datos reales de Mystery Shopping (42 evaluaciones, 29 sucursales, 19 indicadores).
* [`database/migration_cuestionarios.sql`](database/migration_cuestionarios.sql): Tablas del módulo de cuestionarios.
* [`database/migrations/003_fix_questionnaire_data.sql`](database/migrations/003_fix_questionnaire_data.sql): Normalización de 27 preguntas de Nuevos, 30 de Postventa y 27 de Seminuevos, con opciones JSON y eliminación de preguntas cruzadas.

---

## 🔍 Filtros Globales y Canales de Evaluación

El sistema cuenta con un motor de filtrado multi-select y persistente:
* **Canales Canónicos**: `Ventas`, `Posventa`, `Seminuevos` y `Call Center`.
* **Selectores**: Concesionaria, Marca, Ubicación, Indicador y Canal.
* **Comportamiento**:
  * Estado por defecto en `Todas` las opciones seleccionadas (visión 100% de la red).
  * Menús compactos con búsqueda interna y contador de selecciones activas.
  * Sincronización reactiva entre filtros de cabecera y el dataset activo en memoria.

---

## 📥 Importación Segura de Datos (Excel)

Ubicación: **/admin/importar**
1. **Previsualización Aislada**: El archivo `.xlsx` se procesa 100% en el navegador (no escribe en disco ni base de datos).
2. **Validación Integral**: Verifica hojas obligatorias (`Evaluaciones`, `Indicadores`, `Preguntas`), tipos de datos, rangos porcentuales y duplicados de códigos.
3. **Control de Duplicados contra MySQL**: Cruza los códigos del archivo contra la base `factoriq` e identifica cuáles son nuevos y cuáles ya existen.
4. **Inserción Transaccional**: Solo crea evaluaciones nuevas e indicadores requeridos; ante cualquier inconsistencia revierte la transacción íntegra (`ROLLBACK`).

---

## 💻 Pila Tecnológica

* **Framework Full-Stack**: [TanStack Start](https://tanstack.com/start) (React 19 + Vite)
* **Enrutamiento**: [TanStack Router](https://tanstack.com/router) (Rutas basadas en archivos con tipado estricto)
* **Estilos**: [Tailwind CSS 4](https://tailwindcss.com) y diseño responsive mobile-first
* **Componentes UI**: [Radix UI Primitives](https://www.radix-ui.com/) y [Lucide Icons](https://lucide.dev/)
* **Gráficos**: [Recharts](https://recharts.org/)
* **Base de Datos**: MySQL 8.x con driver `mysql2/promise` y conexión por Connection Pool
* **Seguridad y Criptografía**: `bcryptjs` para contraseñas y cookies firmadas `HttpOnly` para sesión
* **Motor de Servidor SSR**: Nitro (`.output/server/index.mjs`)

---

## 🛠 Instalación y Puesta en Marcha Local

### Requisitos Previos:
* Node.js $\ge 20$
* MySQL $\ge 8.0$ (o WAMP / XAMPP)

### Pasos:

1. **Clonar e instalar dependencias**:
   ```bash
   git clone <repo-url>
   cd factor-iq
   npm install
   ```

2. **Configurar variables de entorno (`.env`)**:
   Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```
   Configura las credenciales:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=factoriq
   DB_USER=root
   DB_PASSWORD=
   SESSION_SECRET=clave_secreta_de_al_menos_32_caracteres_aleatorios
   ```

3. **Cargar la base de datos**:
   En tu cliente MySQL o phpMyAdmin, ejecuta:
   ```bash
   mysql -u root -p factoriq < database/schema.sql
   mysql -u root -p factoriq < database/seed_maquinarias.sql
   mysql -u root -p factoriq < database/migration_cuestionarios.sql
   mysql -u root -p factoriq < database/migrations/003_fix_questionnaire_data.sql
   ```

4. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:8081](http://localhost:8081) en tu navegador.

5. **Credenciales predeterminadas**:
   * **SuperAdmin**: `superadmin` / `admin123` (acceso a `/admin`)
   * **Cliente Maquinarias**: `admMaqui` / `adm123` (acceso a `/maquinarias`)

---

## 🌐 Guía de Despliegue en Producción

### A. Despliegue en GoDaddy (Node.js Hosting + cPanel)
1. En cPanel → **Node.js Selector** / **Setup Node.js App**:
   * Node Version: `20.x` o superior.
   * Application Root: `/home/usuario/factor-iq`
   * Application Startup File: `.output/server/index.mjs`
2. Variables de entorno en cPanel: configurar `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` y `SESSION_SECRET`.
3. Compilación:
   ```bash
   npm install
   npm run build
   npm start
   ```

### B. Despliegue en Vercel
1. El proyecto cuenta con preset para Vercel y `vercel.json` configurado.
2. Configurar en el panel de Vercel la variable obligatoria:
   * `SESSION_SECRET`: cadena de 32 caracteres mínimos.

---

## ✅ Comprobación de Calidad de Código

Para garantizar la estabilidad del proyecto en cada entrega:

```bash
# Comprobación de tipos TypeScript estricto (0 errores)
npx tsc --noEmit

# Compilación de producción cliente y servidor Nitro
npm run build
```
