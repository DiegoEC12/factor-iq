# Plan de Unificación y Autenticación --- Factor IQ

**Proyecto:** Factor IQ\
**Dominio principal:** `https://factor-iq.com/`\
**Cliente actual:** Maquinarias  
**Plataforma actual:** `https://maquinarias.factor-iq.com/`\
**Hosting:** GoDaddy Web Hosting Economy\
**Backend actual:** Node.js\
**Frontend público actual:** HTML + CSS + JavaScript\
**Base de datos prevista:** MySQL\
**Estado:** Plan de implementación

------------------------------------------------------------------------

## 1. Objetivo general

Unificar la web pública de Factor IQ y la plataforma privada de clientes
bajo una arquitectura común, incorporando un sistema real de
autenticación, sesiones seguras, usuarios, clientes, roles y permisos.

### Contexto correcto del producto

**Maquinarias es el nombre del cliente**, no el nombre genérico del producto.

Factor IQ está desarrollando y entregando a Maquinarias un dashboard privado para consultar los resultados de un estudio de **mystery shopper en el rubro automotriz**. El objetivo es comparar el desempeño de Maquinarias frente a empresas competidoras, detectar diferencias mediante indicadores y encontrar puntos de mejora.

Además del dashboard, se contempla incorporar un módulo de reportes para exportar los datos utilizados por el dashboard y permitir la exportación de imágenes de los gráficos respetando los filtros activos.

La meta es pasar de un esquema basado principalmente en
redireccionamientos entre:

-   `factor-iq.com`
-   `maquinarias.factor-iq.com`

a una arquitectura donde **Node.js sea el backend central** y la base de
datos controle la identidad, sesión, cliente y permisos del usuario.

### Resultado esperado

El usuario deberá poder:

1.  Entrar a `factor-iq.com`.
2.  Conocer los servicios de Factor IQ.
3.  Seleccionar "Acceder a mi plataforma".
4.  Iniciar sesión.
5.  Ser autenticado por el backend Node.js.
6.  Recibir una sesión segura mediante cookie.
7.  Acceder al dashboard correspondiente.
8.  Ver únicamente la información de su empresa/cliente.
9.  Cerrar sesión y destruir la sesión correctamente.

------------------------------------------------------------------------

# 2. Situación actual

## 2.1 Web pública

Actualmente:

``` text
https://factor-iq.com/index.html
```

Está desarrollada principalmente con:

-   HTML
-   CSS
-   JavaScript

Su función principal es presentar:

-   Empresa
-   Servicios
-   Información comercial
-   Formulario/contacto
-   Acceso a la plataforma

## 2.2 Plataforma privada

Actualmente:

``` text
https://maquinarias.factor-iq.com/
```

Está desarrollada con Node.js y ya funciona como una aplicación Node.js
dentro de GoDaddy.

## 2.3 Hosting

El hosting actual es:

**GoDaddy Web Hosting Economy**

Según el panel actual:

-   Node.js está disponible.
-   Existe 1 slot de aplicación Node.js.
-   El slot actualmente está ocupado por `Maquinarias - Dashboard`.
-   Existe acceso a cPanel.
-   Existe phpMyAdmin.
-   Existe soporte para MySQL.
-   El dominio principal es `factor-iq.com`.
-   Ya existe el subdominio `maquinarias.factor-iq.com`.

### Decisión

No se plantea cambiar de hosting inicialmente.

Se aprovechará la infraestructura existente y se trabajará sobre la
única aplicación Node.js disponible.

------------------------------------------------------------------------

# 3. Decisión arquitectónica

## 3.1 No crear dos aplicaciones Node.js

El plan Economy tiene actualmente:

``` text
Node.js Apps
1/1 slots used
```

Por lo tanto, no se creará una segunda aplicación Node.js independiente.

La estrategia será:

> **Convertir la aplicación Node.js actual en el backend central de
> Factor IQ.**

La web pública será incorporada a la misma aplicación.

------------------------------------------------------------------------

# 4. Arquitectura objetivo

``` text
                         INTERNET
                             |
                           HTTPS
                             |
                    +--------v---------+
                    |     FACTOR IQ    |
                    |      Node.js     |
                    |     Express      |
                    +--------+---------+
                             |
             +---------------+----------------+
             |               |                |
             v               v                v
       WEB PÚBLICA       AUTENTICACIÓN     DASHBOARD
       factor-iq.com       /login          privado
             |               |                |
             +---------------+----------------+
                             |
                             v
                          MySQL
                             |
             +---------------+----------------+
             |               |                |
             v               v                v
         usuarios        clientes        maquinarias
```

------------------------------------------------------------------------

# 5. Dominios

Se mantendrá inicialmente:

``` text
https://factor-iq.com/
```

como sitio corporativo.

Y:

``` text
https://maquinarias.factor-iq.com/
```

como plataforma de dashboard.

La autenticación será compartida mediante el backend y una cookie de
sesión configurada para:

``` text
.factor-iq.com
```

De esta forma la sesión podrá funcionar entre el dominio principal y el
subdominio.

## Arquitectura de navegación

``` text
factor-iq.com
    |
    +-- /
    |
    +-- /nosotros
    |
    +-- /servicios
    |
    +-- /contacto
    |
    +-- /login
            |
            v
    autenticación Node.js
            |
            v
maquinarias.factor-iq.com
            |
            +-- dashboard
            +-- maquinarias
            +-- reportes
            +-- usuarios
            +-- configuración
```

------------------------------------------------------------------------

# 6. Principio de seguridad

Los redireccionamientos no deben considerarse autenticación.

No se deberá utilizar como mecanismo de seguridad:

``` text
?user=123
?token=123
?cliente=4
```

ni depender de:

``` javascript
localStorage
sessionStorage
window.location
```

para determinar si un usuario está autenticado.

La autorización debe ser validada en el servidor.

------------------------------------------------------------------------

# 7. Sistema de autenticación

## 7.1 Flujo

``` text
Usuario
   |
   v
factor-iq.com/login
   |
   v
POST /api/auth/login
   |
   v
Node.js
   |
   +-- Buscar usuario
   |
   +-- Verificar contraseña
   |
   +-- Verificar estado
   |
   +-- Obtener cliente
   |
   +-- Obtener rol/permisos
   |
   v
Crear sesión
   |
   v
Cookie segura
   |
   v
Dashboard
```

## 7.2 Contraseñas

Nunca guardar contraseñas en texto plano.

La base de datos deberá almacenar:

``` text
password_hash
```

Se recomienda utilizar:

-   Argon2, preferentemente.
-   bcrypt como alternativa.

Ejemplo conceptual:

``` text
Contraseña:
MiPassword123

NO guardar:

MiPassword123

Guardar:

$argon2id$...
```

------------------------------------------------------------------------

# 8. Sesiones

Se utilizarán sesiones del lado servidor.

La cookie deberá configurarse con medidas de seguridad como:

``` text
HttpOnly
Secure
SameSite=Lax
Domain=.factor-iq.com
```

El identificador de sesión no debe aparecer en la URL.

Ejemplo incorrecto:

``` text
https://maquinarias.factor-iq.com/?session=12345
```

Ejemplo correcto:

``` text
https://maquinarias.factor-iq.com/
```

con la sesión gestionada mediante cookie segura.

------------------------------------------------------------------------

# 9. Base de datos MySQL

La base de datos estará inicialmente dentro del mismo hosting de
GoDaddy.

## 9.1 Base propuesta

Nombre conceptual:

``` text
factoriq
```

El nombre real deberá adaptarse al prefijo que GoDaddy/cPanel asigne.

## 9.2 Usuario de base de datos

Crear un usuario independiente:

``` text
factoriq_user
```

con una contraseña fuerte.

No utilizar el usuario root para la aplicación.

------------------------------------------------------------------------

# 10. Modelo inicial de base de datos

## 10.1 Tabla `clientes`

``` text
clientes
---------
id
razon_social
ruc
nombre_comercial
estado
created_at
updated_at
```

## 10.2 Tabla `usuarios`

``` text
usuarios
---------
id
cliente_id
nombre
apellido
email
password_hash
rol_id
activo
ultimo_acceso
created_at
updated_at
```

## 10.3 Tabla `roles`

``` text
roles
---------
id
nombre
descripcion
```

Roles iniciales sugeridos:

``` text
SUPER_ADMIN
ADMIN_FACTOR_IQ
ADMIN_CLIENTE
SUPERVISOR
USUARIO
```

## 10.4 Tabla `permisos`

``` text
permisos
---------
id
nombre
descripcion
```

Ejemplos:

``` text
maquinarias.ver
maquinarias.crear
maquinarias.editar
maquinarias.eliminar

reportes.ver
reportes.exportar

usuarios.ver
usuarios.crear
usuarios.editar
usuarios.eliminar
```

## 10.5 Relación roles-permisos

``` text
rol_permisos
------------
rol_id
permiso_id
```

## 10.6 Tabla `maquinarias`

La estructura final deberá adaptarse al modelo actual del dashboard.

Como mínimo:

``` text
maquinarias
-----------
id
cliente_id
codigo
nombre
estado
created_at
updated_at
```

La columna `cliente_id` será fundamental para separar los datos de cada
empresa.

------------------------------------------------------------------------

# 11. Arquitectura multi-tenant

Factor IQ debe prepararse desde el inicio para múltiples
empresas/clientes.

Ejemplo:

``` text
Factor IQ
|
+-- Cliente A
|    |
|    +-- Usuarios
|    +-- Maquinarias
|    +-- Reportes
|
+-- Cliente B
|    |
|    +-- Usuarios
|    +-- Maquinarias
|    +-- Reportes
|
+-- Cliente C
     |
     +-- Usuarios
     +-- Maquinarias
     +-- Reportes
```

## Regla crítica

Un usuario de Cliente A nunca debe poder acceder a datos de Cliente B
aunque intente modificar una URL o enviar manualmente una petición a la
API.

Ejemplo:

``` text
Usuario:
cliente_id = 4

Solicita:

GET /api/maquinarias/152
```

El backend debe comprobar:

``` text
¿La maquinaria 152 pertenece al cliente 4?

SI  -> permitir
NO  -> 403 Forbidden
```

La seguridad debe estar implementada en backend, no solamente en
frontend.

------------------------------------------------------------------------

# 12. Estructura de proyecto propuesta

La estructura exacta dependerá de cómo esté construido actualmente el
dashboard, pero el objetivo es aproximarse a:

``` text
factor-iq-platform/
|
+-- server.js
+-- package.json
+-- .env
+-- .gitignore
|
+-- public/
|   |
|   +-- index.html
|   +-- nosotros.html
|   +-- servicios.html
|   +-- contacto.html
|   |
|   +-- css/
|   +-- js/
|   +-- images/
|
+-- routes/
|   |
|   +-- auth.js
|   +-- usuarios.js
|   +-- clientes.js
|   +-- maquinarias.js
|   +-- reportes.js
|
+-- controllers/
|
+-- services/
|
+-- middleware/
|   |
|   +-- auth.js
|   +-- permissions.js
|   +-- tenant.js
|
+-- database/
|   |
|   +-- connection.js
|   +-- migrations/
|   +-- seeds/
|
+-- utils/
|
+-- dashboard/
|   |
|   +-- ...
```

No es obligatorio que el dashboard se mueva exactamente a esa carpeta.
Primero se deberá inspeccionar su estructura actual.

------------------------------------------------------------------------

# 13. Frontend público

No es necesario convertir inmediatamente la web pública a:

-   React
-   Vue
-   Next.js
-   otro framework

La web actual puede conservar:

``` text
HTML
CSS
JavaScript
```

Node.js será principalmente el servidor/backend.

Esto reduce el riesgo y el tiempo de migración.

------------------------------------------------------------------------

# 14. Backend Node.js

El backend deberá encargarse de:

-   Servir la web pública.
-   Servir/proteger el dashboard.
-   Autenticar usuarios.
-   Crear sesiones.
-   Destruir sesiones.
-   Consultar MySQL.
-   Validar permisos.
-   Validar pertenencia al cliente.
-   Exponer APIs.
-   Gestionar errores.
-   Registrar eventos importantes.

------------------------------------------------------------------------

# 15. API inicial

Rutas sugeridas:

``` text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Usuarios:

``` text
GET    /api/usuarios
POST   /api/usuarios
GET    /api/usuarios/:id
PUT    /api/usuarios/:id
DELETE /api/usuarios/:id
```

Clientes:

``` text
GET    /api/clientes
POST   /api/clientes
GET    /api/clientes/:id
PUT    /api/clientes/:id
```

Maquinarias:

``` text
GET    /api/maquinarias
POST   /api/maquinarias
GET    /api/maquinarias/:id
PUT    /api/maquinarias/:id
DELETE /api/maquinarias/:id
```

Los endpoints reales deberán adaptarse a la API que ya utiliza el
dashboard.

------------------------------------------------------------------------

# 16. Middleware de autenticación

Crear un middleware conceptual:

``` text
requireAuth
```

Flujo:

``` text
Request
   |
   v
¿Existe sesión?
   |
   +-- NO --> 401 Unauthorized
   |
   +-- SÍ
         |
         v
      Usuario
         |
         v
      Dashboard
```

------------------------------------------------------------------------

# 17. Middleware de permisos

Crear un sistema conceptual:

``` text
requirePermission("maquinarias.editar")
```

Flujo:

``` text
Request
   |
   v
¿Está autenticado?
   |
   +-- NO --> 401
   |
   v
¿Tiene permiso?
   |
   +-- NO --> 403
   |
   v
Ejecutar operación
```

------------------------------------------------------------------------

# 18. Middleware de tenant

Crear un control para determinar el `cliente_id` del usuario.

Ejemplo:

``` text
req.user.cliente_id
```

Nunca confiar en:

``` text
req.body.cliente_id
```

para decidir a qué cliente pertenece una operación de un usuario normal.

El servidor debe obtener la identidad del cliente desde la
sesión/usuario autenticado.

------------------------------------------------------------------------

# 19. Variables de entorno

Nunca subir credenciales al repositorio.

Crear:

``` text
.env
```

Ejemplo:

``` env
NODE_ENV=production

PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=...
DB_USER=...
DB_PASSWORD=...

SESSION_SECRET=...

COOKIE_DOMAIN=.factor-iq.com
```

Y en `.gitignore`:

``` text
.env
node_modules/
logs/
```

El archivo `.env` real debe permanecer solamente en el servidor.

------------------------------------------------------------------------

# 20. Conexión Node.js + MySQL

Se puede utilizar:

``` text
mysql2
```

u otro driver compatible.

Se recomienda utilizar un pool de conexiones.

Conceptualmente:

``` text
Node.js
   |
   v
Connection Pool
   |
   +-- conexión
   +-- conexión
   +-- conexión
   |
   v
MySQL
```

No abrir una nueva conexión manual para cada consulta si la arquitectura
permite usar pool.

------------------------------------------------------------------------

# 21. Protección del dashboard

Actualmente no se debe asumir que ocultar el dashboard en frontend
equivale a protegerlo.

La protección debe existir en backend.

Ejemplo:

``` text
Usuario no autenticado
       |
       v
/dashboard
       |
       v
middleware
       |
       v
redirect /login
```

Y las APIs deben tener protección independientemente del frontend.

------------------------------------------------------------------------

# 22. Flujo de logout

``` text
Usuario
   |
   v
Cerrar sesión
   |
   v
POST /api/auth/logout
   |
   v
Destruir sesión
   |
   v
Eliminar/inutilizar cookie
   |
   v
Redirigir a login
```

------------------------------------------------------------------------

# 23. Seguridad adicional

Implementar progresivamente:

-   HTTPS obligatorio.
-   Cookies `Secure`.
-   Cookies `HttpOnly`.
-   `SameSite`.
-   Hash de contraseñas.
-   Validación de inputs.
-   Consultas parametrizadas.
-   Protección contra SQL Injection.
-   Rate limiting para login.
-   Bloqueo o retraso progresivo ante intentos repetidos.
-   CORS correctamente configurado.
-   Helmet u otra capa de headers de seguridad.
-   Protección CSRF cuando corresponda al modelo de autenticación.
-   Mensajes de error que no revelen información sensible.
-   Logs de autenticación.
-   Backup de base de datos.
-   Gestión segura de secretos.

------------------------------------------------------------------------

# 24. Desarrollo local

Antes de tocar producción:

``` text
LOCAL
|
+-- Web pública
+-- Node.js
+-- MySQL
+-- Login
+-- Dashboard
```

Probar primero todo localmente.

No realizar cambios importantes directamente en GoDaddy.

------------------------------------------------------------------------

# 25. Git y ramas

Recomendación:

``` text
main
  |
  +-- producción

develop
  |
  +-- integración

feature/auth
  |
  +-- login y sesiones

feature/database
  |
  +-- MySQL

feature/multitenant
  |
  +-- separación de clientes
```

No trabajar directamente sobre `main` para cambios grandes.

------------------------------------------------------------------------

# 26. Backups

Antes de migrar:

### Backup de archivos

Guardar:

``` text
web pública
dashboard
Node.js
package.json
configuración
```

### Backup de base de datos

Exportar MySQL desde phpMyAdmin.

Guardar el `.sql` fuera del servidor.

### Backup de producción

No reemplazar la aplicación actual sin disponer de una copia
recuperable.

------------------------------------------------------------------------

# 27. Plan de migración

## Fase 0 --- Inventario

-   [ ] Identificar repositorio de la web pública.
-   [ ] Identificar repositorio del dashboard.
-   [ ] Identificar versión de Node.js.
-   [ ] Identificar versión de npm.
-   [ ] Identificar framework backend.
-   [ ] Identificar framework/frontend del dashboard.
-   [ ] Identificar estructura actual de carpetas.
-   [ ] Identificar APIs existentes.
-   [ ] Identificar base de datos actual, si existe.
-   [ ] Identificar cómo se realiza actualmente el
    login/redireccionamiento.
-   [ ] Identificar variables de entorno actuales.
-   [ ] Identificar configuración del subdominio.
-   [ ] Documentar configuración actual de GoDaddy.

------------------------------------------------------------------------

# 28. Fase 1 --- Respaldos

-   [ ] Descargar/capturar una copia completa de la web pública.
-   [ ] Descargar/capturar una copia completa del dashboard.
-   [ ] Exportar cualquier base de datos existente.
-   [ ] Guardar `.env` de forma segura.
-   [ ] Guardar configuración de producción.
-   [ ] Confirmar que se puede restaurar la versión actual.
-   [ ] Documentar cómo volver a desplegar la versión actual.

### Criterio de finalización

Debe existir una versión funcional de producción que pueda recuperarse
si la migración falla.

------------------------------------------------------------------------

# 29. Fase 2 --- Inspección del dashboard

-   [ ] Revisar `package.json`.
-   [ ] Revisar `server.js`/`app.js`/archivo de entrada.
-   [ ] Revisar rutas.
-   [ ] Revisar servicios.
-   [ ] Revisar conexión a base de datos.
-   [ ] Revisar autenticación existente.
-   [ ] Revisar almacenamiento de sesión/token.
-   [ ] Revisar variables de entorno.
-   [ ] Revisar configuración para GoDaddy.
-   [ ] Identificar archivos que no deben tocarse.
-   [ ] Identificar componentes que pueden reutilizarse.

------------------------------------------------------------------------

# 30. Fase 3 --- Integración de la web pública

-   [ ] Crear respaldo de la web.
-   [ ] Copiar HTML público a la aplicación Node.js.
-   [ ] Copiar CSS.
-   [ ] Copiar JavaScript.
-   [ ] Copiar imágenes y recursos.
-   [ ] Configurar Express para servir archivos estáticos.
-   [ ] Verificar rutas relativas.
-   [ ] Verificar fuentes.
-   [ ] Verificar imágenes.
-   [ ] Verificar formularios.
-   [ ] Verificar responsive.
-   [ ] Verificar SEO básico.
-   [ ] Comprobar que el diseño no cambió.

### Criterio de finalización

La web pública debe verse y funcionar prácticamente igual que antes,
pero siendo servida por la aplicación Node.js.

------------------------------------------------------------------------

# 31. Fase 4 --- Base de datos

-   [ ] Crear base de datos MySQL en GoDaddy.
-   [ ] Crear usuario específico.
-   [ ] Asignar permisos.
-   [ ] Crear tabla `clientes`.
-   [ ] Crear tabla `usuarios`.
-   [ ] Crear tabla `roles`.
-   [ ] Crear tabla `permisos`.
-   [ ] Crear tabla `rol_permisos`.
-   [ ] Adaptar tabla `maquinarias`.
-   [ ] Agregar `cliente_id` donde corresponda.
-   [ ] Crear índices.
-   [ ] Crear claves foráneas donde sea apropiado.
-   [ ] Crear usuario administrador inicial.
-   [ ] Verificar conexión desde Node.js.

------------------------------------------------------------------------

# 32. Fase 5 --- Autenticación

-   [ ] Crear `/login`.
-   [ ] Crear formulario.
-   [ ] Validar email.
-   [ ] Validar contraseña.
-   [ ] Crear endpoint `POST /api/auth/login`.
-   [ ] Consultar usuario.
-   [ ] Verificar `password_hash`.
-   [ ] Verificar usuario activo.
-   [ ] Crear sesión.
-   [ ] Configurar cookie.
-   [ ] Crear `GET /api/auth/me`.
-   [ ] Crear `POST /api/auth/logout`.
-   [ ] Probar login correcto.
-   [ ] Probar contraseña incorrecta.
-   [ ] Probar usuario inexistente.
-   [ ] Probar usuario desactivado.
-   [ ] Probar logout.
-   [ ] Probar expiración de sesión.

------------------------------------------------------------------------

# 33. Fase 6 --- Sesión entre dominios

-   [ ] Configurar cookie para `.factor-iq.com`.
-   [ ] Activar `Secure`.
-   [ ] Activar `HttpOnly`.
-   [ ] Configurar `SameSite`.
-   [ ] Verificar HTTPS.
-   [ ] Probar login desde `factor-iq.com`.
-   [ ] Acceder a `maquinarias.factor-iq.com`.
-   [ ] Verificar que el dashboard reconoce la sesión.
-   [ ] Cerrar sesión.
-   [ ] Verificar que el dashboard deja de estar disponible.

### Criterio de finalización

El usuario inicia sesión una vez y puede acceder al dashboard sin pasar
credenciales nuevamente.

------------------------------------------------------------------------

# 34. Fase 7 --- Roles y permisos

-   [ ] Crear roles.
-   [ ] Crear permisos.
-   [ ] Relacionar roles con permisos.
-   [ ] Crear middleware de permisos.
-   [ ] Proteger endpoints.
-   [ ] Proteger acciones del dashboard.
-   [ ] Probar usuario administrador.
-   [ ] Probar usuario estándar.
-   [ ] Probar acceso denegado.
-   [ ] Verificar respuesta `403`.

------------------------------------------------------------------------

# 35. Fase 8 --- Multi-tenant

-   [ ] Asociar usuarios con clientes.
-   [ ] Asociar maquinarias con clientes.
-   [ ] Asociar reportes con clientes.
-   [ ] Crear middleware tenant.
-   [ ] Evitar confiar en `cliente_id` enviado desde frontend.
-   [ ] Filtrar consultas por cliente autenticado.
-   [ ] Probar Cliente A.
-   [ ] Probar Cliente B.
-   [ ] Intentar acceder a datos cruzados.
-   [ ] Confirmar que se devuelve `403` o `404` según corresponda.

### Criterio de finalización

Ningún usuario de un cliente puede visualizar o modificar información de
otro cliente.

------------------------------------------------------------------------

# 36. Fase 9 --- Seguridad

-   [ ] HTTPS.
-   [ ] Cookies seguras.
-   [ ] Password hashing.
-   [ ] SQL parametrizado.
-   [ ] Validación de inputs.
-   [ ] Rate limiting.
-   [ ] Headers de seguridad.
-   [ ] CORS.
-   [ ] CSRF si corresponde.
-   [ ] Protección de endpoints.
-   [ ] Protección contra acceso directo al dashboard.
-   [ ] No almacenar tokens sensibles en localStorage.
-   [ ] No enviar sesiones mediante URL.
-   [ ] No subir `.env` a Git.
-   [ ] No mostrar errores internos en producción.

------------------------------------------------------------------------

# 37. Fase 10 --- Pruebas

## Login

-   [ ] Login correcto.
-   [ ] Contraseña incorrecta.
-   [ ] Usuario inexistente.
-   [ ] Usuario inactivo.
-   [ ] Sesión expirada.
-   [ ] Logout.

## Seguridad

-   [ ] Acceso sin sesión.
-   [ ] Modificación manual de URL.
-   [ ] Manipulación de `cliente_id`.
-   [ ] Intento de acceso a otra empresa.
-   [ ] Peticiones directas a API.
-   [ ] Intentos repetidos de login.

## Dashboard

-   [ ] Carga correcta.
-   [ ] Datos correctos.
-   [ ] Crear.
-   [ ] Editar.
-   [ ] Eliminar.
-   [ ] Reportes.
-   [ ] Exportaciones.

## Web pública

-   [ ] Inicio.
-   [ ] Nosotros.
-   [ ] Servicios.
-   [ ] Contacto.
-   [ ] Formulario.
-   [ ] Responsive.
-   [ ] SEO.
-   [ ] Enlaces.
-   [ ] Imágenes.

------------------------------------------------------------------------

# 38. Fase 11 --- Despliegue GoDaddy

Antes de desplegar:

-   [ ] Crear backup completo.
-   [ ] Confirmar versión de Node.js.
-   [ ] Confirmar comando de inicio.
-   [ ] Confirmar `package.json`.
-   [ ] Confirmar variables de entorno.
-   [ ] Confirmar configuración MySQL.
-   [ ] Confirmar subdominio.
-   [ ] Confirmar HTTPS.
-   [ ] Preparar plan de rollback.

Después:

-   [ ] Subir nueva aplicación.
-   [ ] Instalar dependencias.
-   [ ] Configurar variables.
-   [ ] Reiniciar aplicación.
-   [ ] Revisar logs.
-   [ ] Probar `factor-iq.com`.
-   [ ] Probar `/login`.
-   [ ] Probar `maquinarias.factor-iq.com`.
-   [ ] Probar login.
-   [ ] Probar logout.
-   [ ] Probar APIs.
-   [ ] Probar base de datos.

------------------------------------------------------------------------

# 39. Fase 12 --- Puesta en producción

### Checklist final

-   [ ] Web pública funcionando.
-   [ ] Login funcionando.
-   [ ] Sesiones funcionando.
-   [ ] Dashboard funcionando.
-   [ ] MySQL funcionando.
-   [ ] Usuarios funcionando.
-   [ ] Roles funcionando.
-   [ ] Permisos funcionando.
-   [ ] Multi-tenant funcionando.
-   [ ] HTTPS funcionando.
-   [ ] Cookies seguras.
-   [ ] Backups funcionando.
-   [ ] Logs revisados.
-   [ ] No existen credenciales en Git.
-   [ ] No existen tokens en URLs.
-   [ ] No existen errores críticos.

------------------------------------------------------------------------

# 40. Estrategia de rollback

Si el despliegue falla:

``` text
Nueva versión
     |
     v
¿Funciona?
   /     \
 NO       SÍ
 |         |
 v         v
Rollback   Producción
```

El rollback deberá permitir regresar a:

``` text
Maquinarias - Dashboard
```

y restaurar:

-   archivos
-   variables
-   base de datos

si fuera necesario.

------------------------------------------------------------------------

# 41. Limitaciones del hosting actual

GoDaddy Economy es adecuado para comenzar, pero tiene recursos
limitados.

Actualmente el plan debe considerarse como una infraestructura inicial.

La aplicación debe evitar:

-   Procesos pesados permanentes.
-   Consultas MySQL innecesariamente grandes.
-   Cargas excesivas.
-   Generación pesada de reportes dentro del request.
-   Uso excesivo de memoria.
-   Almacenamiento de archivos grandes sin estrategia.

Si Factor IQ crece significativamente, se deberá evaluar:

``` text
Web Hosting Plus
        o
VPS
        o
Cloud
```

No es necesario hacer ese cambio ahora.

------------------------------------------------------------------------

# 42. Decisiones que NO deben tomarse todavía

No migrar inmediatamente a:

-   React.
-   Next.js.
-   Vue.
-   Microservicios.
-   Kubernetes.
-   Docker complejo.
-   Redis externo.
-   Servidores adicionales.

Primero lograr:

``` text
Web
+
Node.js
+
MySQL
+
Login
+
Sesiones
+
Roles
+
Multi-tenant
```

Una vez estable, se puede optimizar.

------------------------------------------------------------------------

# 43. Objetivo de arquitectura a futuro

La plataforma puede evolucionar hacia:

``` text
                         FACTOR IQ
                            |
             +--------------+--------------+
             |                             |
        Sitio público                 Plataforma SaaS
             |                             |
       factor-iq.com              maquinarias.factor-iq.com
                                           |
                                    +------+------+
                                    |             |
                                Clientes       Usuarios
                                    |             |
                                    +------+------+
                                           |
                                         API
                                           |
                                        MySQL
```

Y posteriormente incorporar:

-   Más módulos.
-   Más clientes.
-   Más roles.
-   Auditoría.
-   Notificaciones.
-   Reportes avanzados.
-   Integraciones externas.
-   Facturación.
-   Gestión documental.
-   Monitoreo.
-   Analítica.

------------------------------------------------------------------------

# 44. Orden recomendado de ejecución

La implementación debe seguir este orden:

``` text
1. Inventario
       ↓
2. Backup
       ↓
3. Revisar dashboard actual
       ↓
4. Integrar web pública
       ↓
5. Configurar MySQL
       ↓
6. Crear modelo de usuarios/clientes
       ↓
7. Crear autenticación
       ↓
8. Crear sesiones
       ↓
9. Probar subdominio
       ↓
10. Roles y permisos
       ↓
11. Multi-tenant
       ↓
12. Seguridad
       ↓
13. Pruebas
       ↓
14. Deploy
       ↓
15. Verificación
       ↓
16. Producción
```

------------------------------------------------------------------------

# 45. Criterio final de éxito

El proyecto se considerará correctamente migrado cuando:

1.  `factor-iq.com` funcione normalmente.
2.  La web pública sea servida por la aplicación Node.js.
3.  `maquinarias.factor-iq.com` continúe funcionando.
4.  Exista una base de datos MySQL correctamente configurada.
5.  Los usuarios tengan cuentas individuales.
6.  Las contraseñas estén almacenadas mediante hash seguro.
7.  El login cree una sesión segura.
8.  La sesión funcione entre `factor-iq.com` y
    `maquinarias.factor-iq.com`.
9.  El dashboard no sea accesible sin autenticación.
10. Existan roles y permisos.
11. Cada usuario esté asociado a un cliente.
12. Los datos estén aislados por cliente.
13. Las APIs estén protegidas.
14. No existan credenciales sensibles en el repositorio.
15. Exista un procedimiento de backup y rollback.
16. La aplicación funcione correctamente dentro de los recursos del
    GoDaddy Economy.

------------------------------------------------------------------------

# 46. Próximo paso recomendado

Antes de comenzar a modificar código:

### Obtener los dos proyectos

1.  Repositorio de la web pública de Factor IQ.
2.  Repositorio de `maquinarias.factor-iq.com`.

### Después

Realizar una auditoría de ambos proyectos:

``` text
WEB PÚBLICA
    |
    +-- estructura
    +-- rutas
    +-- formularios
    +-- JS
    +-- CSS
    +-- recursos

DASHBOARD
    |
    +-- Node.js
    +-- package.json
    +-- backend
    +-- frontend
    +-- API
    +-- base de datos
    +-- autenticación actual
```

Con esa información se deberá crear el **Plan Técnico de Migración v1**,
indicando archivo por archivo:

-   qué conservar;
-   qué mover;
-   qué modificar;
-   qué eliminar;
-   qué crear;
-   qué rutas nuevas agregar;
-   qué tablas crear;
-   qué variables de entorno agregar;
-   y cómo desplegarlo en GoDaddy.

------------------------------------------------------------------------

# 47. Estado de tareas

## Arquitectura

-   [x] Decidir mantener GoDaddy inicialmente.
-   [x] Confirmar disponibilidad de Node.js.
-   [x] Confirmar que el plan tiene 1 slot Node.js.
-   [x] Decidir utilizar una sola aplicación Node.js.
-   [x] Mantener inicialmente `maquinarias.factor-iq.com`.
-   [x] Mantener inicialmente `factor-iq.com`.
-   [ ] Auditar ambos proyectos.
-   [ ] Definir estructura final.

## Base de datos

-   [ ] Crear base de datos.
-   [ ] Crear usuario.
-   [ ] Diseñar tablas.
-   [ ] Crear migraciones.
-   [ ] Crear índices.
-   [ ] Crear datos iniciales.
-   [ ] Probar conexión.

## Autenticación

-   [ ] Login.
-   [ ] Logout.
-   [ ] Sesiones.
-   [ ] Cookies.
-   [ ] Hash de contraseñas.
-   [ ] Recuperación de contraseña.
-   [ ] Protección contra intentos repetidos.

## Autorización

-   [ ] Roles.
-   [ ] Permisos.
-   [ ] Middleware.
-   [ ] Multi-tenant.
-   [ ] Protección de API.
-   [ ] Protección de dashboard.

## Frontend

-   [ ] Integrar web pública.
-   [ ] Crear login.
-   [ ] Conectar login con API.
-   [ ] Integrar estado de sesión.
-   [ ] Integrar logout.
-   [ ] Mantener diseño actual.

## GoDaddy

-   [ ] Backup.
-   [ ] Revisar configuración Node.js.
-   [ ] Configurar variables de entorno.
-   [ ] Configurar MySQL.
-   [ ] Desplegar.
-   [ ] Reiniciar aplicación.
-   [ ] Revisar logs.
-   [ ] Probar producción.

## Seguridad

-   [ ] HTTPS.
-   [ ] Secure cookies.
-   [ ] HttpOnly.
-   [ ] SameSite.
-   [ ] Hash de contraseñas.
-   [ ] SQL parametrizado.
-   [ ] Validación de entradas.
-   [ ] Rate limiting.
-   [ ] CORS.
-   [ ] Headers de seguridad.
-   [ ] CSRF si corresponde.
-   [ ] Auditoría final.

------------------------------------------------------------------------

# 48. Nota de trabajo

Este documento es el **plan maestro inicial**.

No se debe modificar producción directamente para comenzar la migración.

La siguiente etapa será revisar los repositorios reales y actualizar
este documento con:

-   arquitectura real;
-   dependencias reales;
-   estructura real;
-   base de datos actual;
-   rutas existentes;
-   configuración de GoDaddy;
-   estrategia exacta de despliegue;
-   migraciones SQL;
-   implementación de autenticación;
-   plan de pruebas.

**Principio principal del proyecto:**

> Mantener lo que ya funciona, centralizar autenticación y datos en
> Node.js + MySQL, proteger el dashboard desde el backend y evolucionar
> Factor IQ progresivamente sin rehacer innecesariamente el frontend.


---

# Actualización v2 — Mystery Shopper, Reportes y Exportaciones

## 1. Contexto funcional

```text
Factor IQ
    |
    +---- Cliente: Maquinarias
              |
              +---- Estudio Mystery Shopper Automotriz
                         |
                         +---- Indicadores
                         +---- Resultados
                         +---- Competidores
                         +---- Filtros
                         +---- Dashboard
                         +---- Reportes
```

El dashboard no es simplemente un sistema de "maquinarias": es una plataforma de análisis para los resultados del mystery shopper realizado en el rubro automotriz.

### Objetivos del dashboard

- Consultar resultados del estudio.
- Analizar indicadores.
- Comparar Maquinarias con competidores.
- Aplicar filtros.
- Detectar puntos de mejora.
- Presentar resultados mediante gráficos y métricas.

---

# 2. Nuevos módulos previstos

## 2.1 Dashboard

```text
Dashboard
|
+-- Resumen
+-- Indicadores
+-- Comparación con competencia
+-- Gráficos
+-- Filtros
+-- Detalle de resultados
```

## 2.2 Módulo de reportes

```text
Reportes
|
+-- Datos
|     +-- Exportar
|
+-- SQL
|     +-- Exportar
|
+-- Gráficos
      +-- Exportar imagen
```

---

# 3. Exportación de datos / SQL

La frase "exportar la base de datos usada para el dashboard" debe definirse técnicamente antes de programarla.

Puede significar:

### A. Dump SQL

Archivo:

```text
mystery_shopper.sql
```

con estructura y/o datos para restaurar una base.

### B. Consultas SQL

Archivo con consultas:

```sql
SELECT ...
FROM ...
WHERE ...
```

### C. Datos filtrados

Exportar solamente los registros que coinciden con los filtros del usuario.

### D. Formato de negocio

Exportar:

```text
CSV
XLSX
```

### Decisión pendiente

Antes de implementar, confirmar con Maquinarias:

- ¿Necesitan un `.sql` restaurable?
- ¿Necesitan solamente los datos?
- ¿Necesitan los datos filtrados?
- ¿Necesitan estructura + datos?
- ¿Necesitan CSV/Excel?
- ¿Qué campos pueden exportarse?
- ¿Quién tendrá permiso de exportar?

**Recomendación:** para usuarios de negocio, CSV/XLSX suele ser más práctico que un dump SQL. El `.sql` debe implementarse solamente si existe una necesidad técnica concreta.

---

# 4. Exportación de gráficos

El usuario debe poder descargar el gráfico que está visualizando con los filtros actuales.

Ejemplo:

```text
Filtros
  |
  +-- Período: Enero - Marzo
  +-- Indicador: Atención
  +-- Competencia: Todas
  |
  v
Dashboard
  |
  v
Gráfico filtrado
  |
  v
[Exportar imagen]
  |
  v
grafico-atencion-ene-mar.png
```

La imagen debe incluir, cuando corresponda:

- Título.
- Indicador.
- Período.
- Filtros.
- Leyenda.
- Valores.
- Unidades.
- Contexto del estudio.

### Regla fundamental

Dashboard y exportaciones deben utilizar la misma lógica:

```text
Base de datos
      |
      v
Servicio de consultas
      |
      v
Filtros
      |
      +------------------+
      |                  |
      v                  v
 Dashboard          Exportaciones
      |                  |
      +--------+---------+
               |
               v
        mismos resultados
```

No se debe crear una segunda lógica de cálculo para los reportes.

---

# 5. Permisos de reportes y exportaciones

Las exportaciones son operaciones sensibles.

Permisos sugeridos:

```text
reportes.ver
reportes.exportar
datos.exportar
sql.exportar
graficos.exportar
```

Ejemplo inicial:

```text
SUPER_ADMIN
    -> todos

ADMIN_FACTOR_IQ
    -> según configuración

ADMIN_CLIENTE
    -> reportes y exportaciones permitidas

SUPERVISOR
    -> reportes permitidos

USUARIO
    -> solamente lo autorizado
```

La matriz final se definirá con los requerimientos reales.

---

# 6. Auditoría de exportaciones

Se recomienda registrar:

```text
id
usuario_id
cliente_id
fecha_hora
tipo_exportacion
filtros_aplicados
archivo
estado
```

Ejemplo:

```text
Usuario: usuario@maquinarias.com
Cliente: Maquinarias
Tipo: EXPORTACION_GRAFICO
Indicador: Atención
Periodo: Enero-Marzo
Fecha: 2026-09-07 10:32
```

Esto permitirá conocer quién exportó información y cuándo.

---

# 7. Arquitectura multi-cliente

Aunque actualmente el cliente sea Maquinarias, Factor IQ debe poder incorporar otros clientes sin rehacer el sistema.

```text
Factor IQ
|
+-- Maquinarias
|    |
|    +-- Estudio
|    +-- Indicadores
|    +-- Resultados
|    +-- Competidores
|    +-- Reportes
|
+-- Cliente B
|    |
|    +-- Estudio
|    +-- Indicadores
|    +-- Resultados
|    +-- Reportes
|
+-- Cliente C
     |
     +-- ...
```

La regla de seguridad será:

```text
usuario
   |
   +-- cliente_id
          |
          v
      consultas
          |
          v
datos permitidos
```

Nunca confiar únicamente en un `cliente_id` enviado por el frontend.

---

# 8. Orden recomendado de implementación

## ETAPA 1 — Auditoría de los dos proyectos

- [ ] Revisar repositorio de la web pública Factor IQ.
- [ ] Revisar repositorio del dashboard de Maquinarias.
- [ ] Revisar `package.json`.
- [ ] Identificar Node.js/framework.
- [ ] Identificar frontend.
- [ ] Identificar API.
- [ ] Identificar base de datos.
- [ ] Identificar modelo de datos del mystery shopper.
- [ ] Identificar indicadores.
- [ ] Identificar filtros.
- [ ] Identificar gráficos.
- [ ] Identificar autenticación/redireccionamientos actuales.

**Resultado:** mapa técnico real.

---

## ETAPA 2 — Backup y entorno local

- [ ] Backup de web.
- [ ] Backup de dashboard.
- [ ] Backup de base de datos.
- [ ] Backup de configuración.
- [ ] Configurar entorno local.
- [ ] Confirmar que el dashboard actual funciona.

**Resultado:** podemos trabajar sin arriesgar producción.

---

## ETAPA 3 — Unificación Node.js

Integrar la web pública dentro de la aplicación Node.js actual.

```text
Una aplicación Node.js
|
+-- Web pública Factor IQ
+-- Login
+-- API
+-- Dashboard Maquinarias
+-- MySQL
```

- [ ] Integrar HTML.
- [ ] Integrar CSS.
- [ ] Integrar JS.
- [ ] Integrar imágenes.
- [ ] Revisar rutas.
- [ ] Revisar assets.
- [ ] Verificar formularios.
- [ ] Verificar responsive.

---

## ETAPA 4 — Modelo de datos

Definir y documentar las entidades reales.

Candidatas:

```text
clientes
usuarios
roles
permisos
estudios
periodos
indicadores
categorias
competidores
resultados
```

- [ ] Mapear tablas actuales.
- [ ] Identificar relaciones.
- [ ] Definir `cliente_id`.
- [ ] Crear índices.
- [ ] Documentar consultas principales.

---

## ETAPA 5 — Autenticación

Implementar:

```text
/login
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

- [ ] Login.
- [ ] Hash de contraseña.
- [ ] Validación.
- [ ] Sesiones.
- [ ] Cookie segura.
- [ ] Logout.
- [ ] Expiración.
- [ ] Rate limiting.

---

## ETAPA 6 — Roles, permisos y multi-tenant

- [ ] Roles.
- [ ] Permisos.
- [ ] `requireAuth`.
- [ ] Middleware de permisos.
- [ ] Asociación usuario-cliente.
- [ ] Filtros por `cliente_id`.
- [ ] Protección de APIs.
- [ ] Protección del dashboard.
- [ ] Pruebas de acceso cruzado.

---

## ETAPA 7 — Estabilización del dashboard

Antes de construir exportaciones:

- [ ] Validar indicadores.
- [ ] Validar cálculos.
- [ ] Validar comparaciones.
- [ ] Validar filtros.
- [ ] Validar períodos.
- [ ] Validar gráficos.
- [ ] Revisar consultas SQL.
- [ ] Optimizar consultas importantes.

**Resultado:** el dashboard es la fuente funcional de verdad.

---

## ETAPA 8 — Centralizar filtros y consultas

Esta es una etapa crítica.

```text
Filtros
   |
   v
Servicio de datos
   |
   +---- Dashboard
   |
   +---- Reportes
   |
   +---- Exportación de datos
   |
   +---- Exportación de gráficos
```

- [ ] Crear estructura común de filtros.
- [ ] Validar filtros.
- [ ] Centralizar consultas.
- [ ] Evitar SQL duplicado.
- [ ] Crear servicios reutilizables.

---

## ETAPA 9 — Exportación de gráficos

Se recomienda hacerla antes de la exportación de datos.

- [ ] Revisar librería de gráficos actual.
- [ ] Implementar PNG.
- [ ] Respetar filtros.
- [ ] Incluir título.
- [ ] Incluir período.
- [ ] Incluir indicador.
- [ ] Incluir leyenda.
- [ ] Probar diferentes tamaños.
- [ ] Probar sin datos.

**Resultado:** Maquinarias puede descargar imágenes de sus análisis.

---

## ETAPA 10 — Módulo de reportes

Crear:

```text
/dashboard/reportes
```

o la ruta que determine la arquitectura final.

```text
Reportes
|
+-- Datos
+-- Gráficos
+-- Exportaciones
```

- [ ] Crear pantalla.
- [ ] Mostrar filtros.
- [ ] Mostrar acciones permitidas.
- [ ] Integrar exportaciones.
- [ ] Mostrar historial si se decide implementarlo.

---

## ETAPA 11 — Exportación de datos

- [ ] Definir formato con Maquinarias.
- [ ] Definir columnas.
- [ ] Definir alcance.
- [ ] Aplicar filtros.
- [ ] Aplicar permisos.
- [ ] Generar archivo.
- [ ] Validar datos.
- [ ] Probar grandes volúmenes.

**Prioridad sugerida:**

```text
CSV/XLSX
   ↓
SQL si existe necesidad técnica
```

---

## ETAPA 12 — Exportación SQL

Si Maquinarias confirma que necesita un `.sql`:

- [ ] Definir estructura.
- [ ] Definir datos.
- [ ] Definir si será completo o filtrado.
- [ ] Definir información excluida.
- [ ] Crear permiso `sql.exportar`.
- [ ] Implementar generación.
- [ ] Probar restauración en entorno separado.

---

## ETAPA 13 — Auditoría

- [ ] Registrar usuario.
- [ ] Registrar cliente.
- [ ] Registrar fecha/hora.
- [ ] Registrar tipo.
- [ ] Registrar filtros.
- [ ] Registrar estado.

---

## ETAPA 14 — Seguridad integral

- [ ] HTTPS.
- [ ] `HttpOnly`.
- [ ] `Secure`.
- [ ] `SameSite`.
- [ ] Password hashing.
- [ ] SQL parametrizado.
- [ ] Validación.
- [ ] Rate limiting.
- [ ] CORS.
- [ ] Headers de seguridad.
- [ ] CSRF cuando corresponda.
- [ ] Protección de API.
- [ ] Protección de exportaciones.
- [ ] Separación por cliente.
- [ ] No tokens sensibles en URLs.
- [ ] No credenciales en Git.

---

## ETAPA 15 — Pruebas

### Autenticación

- [ ] Login correcto.
- [ ] Login incorrecto.
- [ ] Usuario inexistente.
- [ ] Usuario desactivado.
- [ ] Logout.
- [ ] Expiración.

### Dashboard

- [ ] Indicadores.
- [ ] Filtros.
- [ ] Gráficos.
- [ ] Competidores.
- [ ] Períodos.
- [ ] Sin datos.

### Exportaciones

- [ ] PNG.
- [ ] CSV/XLSX.
- [ ] SQL si corresponde.
- [ ] Filtros.
- [ ] Permisos.
- [ ] Grandes volúmenes.
- [ ] Intento de exportar otro cliente.

### Seguridad

- [ ] Acceso sin login.
- [ ] Manipulación de IDs.
- [ ] Manipulación de `cliente_id`.
- [ ] Acceso directo a API.
- [ ] Exportación sin permisos.
- [ ] Acceso cruzado.

---

## ETAPA 16 — Deploy GoDaddy

- [ ] Backup final.
- [ ] Configurar variables.
- [ ] Configurar MySQL.
- [ ] Subir aplicación.
- [ ] Instalar dependencias.
- [ ] Reiniciar Node.js.
- [ ] Revisar logs.
- [ ] Probar `factor-iq.com`.
- [ ] Probar login.
- [ ] Probar `maquinarias.factor-iq.com`.
- [ ] Probar dashboard.
- [ ] Probar reportes.
- [ ] Probar exportaciones.

---

# 9. Resumen visual del orden

```text
AUDITORÍA
   ↓
BACKUP
   ↓
UNIFICAR NODE.JS
   ↓
MODELO DE DATOS
   ↓
LOGIN
   ↓
SESIONES
   ↓
ROLES + PERMISOS
   ↓
MULTI-TENANT
   ↓
ESTABILIZAR DASHBOARD
   ↓
CENTRALIZAR FILTROS + CONSULTAS
   ↓
EXPORTAR GRÁFICOS
   ↓
MÓDULO DE REPORTES
   ↓
EXPORTAR DATOS
   ↓
EXPORTAR SQL (SI SE CONFIRMA)
   ↓
AUDITORÍA
   ↓
SEGURIDAD
   ↓
PRUEBAS
   ↓
DEPLOY
```

## Motivo de este orden

La exportación depende de que primero estén resueltos:

```text
Quién es el usuario
        +
Qué cliente representa
        +
Qué puede ver
        +
Qué filtros puede aplicar
        +
Qué datos devuelve el dashboard
        +
Qué puede exportar
```

Por eso la cadena recomendada es:

```text
DATOS
  ↓
AUTENTICACIÓN
  ↓
AUTORIZACIÓN
  ↓
MULTI-TENANT
  ↓
FILTROS
  ↓
DASHBOARD
  ↓
REPORTES
  ↓
EXPORTACIONES
```

---

# 10. Backlog futuro

- [ ] Recuperación de contraseña.
- [ ] Cambio obligatorio de contraseña inicial.
- [ ] Auditoría de usuarios.
- [ ] Historial de exportaciones.
- [ ] Reportes PDF.
- [ ] Reportes Excel avanzados.
- [ ] Programación de reportes.
- [ ] Envío de reportes por correo.
- [ ] Comparaciones históricas.
- [ ] Comparaciones por período.
- [ ] Indicadores personalizados.
- [ ] Administración de clientes.
- [ ] Administración de estudios.
- [ ] Administración de usuarios.
- [ ] Administración avanzada de permisos.
- [ ] Soporte para nuevos clientes.

---

# 11. Próxima acción

**No comenzar todavía programando el login ni las exportaciones.**

Primero revisar los dos repositorios reales:

```text
REPOSITORIO 1
Factor IQ — Web pública

REPOSITORIO 2
Maquinarias — Dashboard
```

Después de la auditoría, convertir este plan en un **Plan Técnico de Migración v1**, especificando:

- estructura final de carpetas;
- archivos que se conservan;
- archivos que se mueven;
- archivos que se modifican;
- archivos nuevos;
- rutas API;
- tablas MySQL;
- relaciones;
- middleware;
- sesiones;
- permisos;
- filtros;
- consultas;
- exportación de gráficos;
- exportación de datos;
- exportación SQL;
- despliegue en GoDaddy.

> **Principio rector:** mantener lo que ya funciona, centralizar autenticación y datos en Node.js + MySQL, proteger el dashboard desde el backend, separar correctamente la información de cada cliente y construir los reportes/exportaciones sobre la misma lógica de datos que alimenta el dashboard.


---

# Actualización basada en la revisión de los repositorios

## 1. Contexto técnico real

Se revisaron los dos proyectos actuales:

- Web pública: `https://github.com/DiegoEC12/factor-iq-rework`
- Dashboard del cliente Maquinarias: `https://github.com/DiegoEC12/dashboardMaquinarias`

### Web pública `factor-iq-rework`

Actualmente es un proyecto de frontend con:

```text
HTML5
Tailwind CSS v4
Iconify
JavaScript Vanilla
```

Su estructura actual gira alrededor de:

```text
factor-iq-rework/
├── assets/
├── pages/
├── index.html
├── robots.txt
├── sitemap.xml
├── package.json
└── README.md
```

El proyecto ya contiene Home, Nosotros, Servicios y páginas adicionales, y todavía contempla tareas de SEO, accesibilidad, QA e integración backend del formulario.

### Dashboard `dashboardMaquinarias`

Este proyecto será la **base técnica** de la nueva aplicación Factor IQ.

Tecnologías actuales:

```text
React 19
TypeScript
TanStack Start
TanStack Router
Vite
Tailwind CSS 4
Radix UI
Recharts
xlsx
```

Ya tiene funcionalidades reales de negocio para el Mystery Shopping:

```text
Resumen Ejecutivo
Indicadores
Benchmark
Concesionarias
Ranking
Mapa de calor
Preguntas críticas
Filtros globales
Importación Excel
Restauración del dataset
```

Los filtros actuales contemplan concesionaria, marca, ubicación, indicador y tipo de evaluación. El repositorio documenta además un flujo actual Excel → JSON mediante `generate-imported-json.cjs` y una lógica de importación aislada en `src/lib/excel-import.ts`.

El repositorio también documenta actualmente 42 evaluaciones, 434 filas de indicadores, 2494 preguntas, 9756 opciones de respuesta y 12 indicadores únicos en el dataset de referencia.

**Decisión:** no migrar este dashboard a Express desde cero. Se conservará TanStack Start como base y se aprovechará su arquitectura servidor/cliente.

---

## 2. Nueva raíz del proyecto

Crear un nuevo repositorio/carpeta raíz:

```text
factor-iq/
```

Esta será la aplicación completa de Factor IQ.

No se recomienda que la estructura final sea:

```text
factor-iq/
├── factor-iq-rework/
└── dashboardMaquinarias/
```

Esa estructura puede utilizarse temporalmente durante la migración, pero el resultado final será un único proyecto.

---

## 3. Regla de organización del producto

Maquinarias es el **cliente** de Factor IQ.

Por lo tanto:

```text
Factor IQ
│
├── Web pública
├── Autenticación
├── Plataforma
├── Reportes
├── Exportaciones
└── Clientes
    └── Maquinarias
```

La estructura de código debe reflejar esto:

```text
src/modules/clientes/maquinarias/
```

No tratar `maquinarias` como si fuera toda la aplicación.

Esto permitirá posteriormente:

```text
src/modules/clientes/
├── maquinarias/
├── cliente-b/
└── cliente-c/
```

---

## 4. Estructura objetivo actualizada

La estructura propuesta para el proyecto unificado es:

```text
factor-iq/
│
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── schema/
│
├── docs/
│   ├── arquitectura/
│   ├── base-datos/
│   ├── seguridad/
│   ├── reportes/
│   └── despliegue/
│
├── public/
│   ├── favicon.png
│   ├── robots.txt
│   ├── sitemap.xml
│   └── images/
│
├── scripts/
│   └── generate-imported-json.cjs
│
├── src/
│   ├── assets/
│   │   ├── factor-iq/
│   │   └── maquinarias/
│   │
│   ├── components/
│   │   ├── ui/
│   │   └── shared/
│   │
│   ├── modules/
│   │   ├── public/
│   │   │   ├── components/
│   │   │   ├── layouts/
│   │   │   └── sections/
│   │   │
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   │
│   │   └── clientes/
│   │       └── maquinarias/
│   │           ├── components/
│   │           ├── charts/
│   │           ├── filters/
│   │           ├── pages/
│   │           ├── reportes/
│   │           ├── services/
│   │           ├── types/
│   │           └── utils/
│   │
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   ├── nosotros.tsx
│   │   ├── servicios.tsx
│   │   ├── contacto.tsx
│   │   ├── login.tsx
│   │   └── maquinarias/
│   │       ├── index.tsx
│   │       ├── indicadores.tsx
│   │       ├── benchmark.tsx
│   │       ├── concesionarias.tsx
│   │       └── reportes.tsx
│   │
│   ├── server/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── exports/
│   │
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── exports/
│   │   ├── security/
│   │   └── utils/
│   │
│   ├── data/
│   │   └── legacy/
│   ├── hooks/
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

Esta es una **estructura objetivo**. No se debe crear todo de golpe.

---

## 5. Qué proyecto sirve de base y qué proyecto aporta contenido

La decisión queda formalizada así:

```text
dashboardMaquinarias
        ↓
BASE TÉCNICA
        ↓
React + TypeScript + TanStack Start + Router + Vite

factor-iq-rework
        ↓
FUENTE DE WEB PÚBLICA
        ↓
HTML + contenido + estilos + assets + diseño
```

La web pública se migrará progresivamente a React/TanStack.

No se copiarán los `.html` como solución definitiva dentro del nuevo proyecto.

Ejemplo:

```text
factor-iq-rework/index.html
        ↓
src/routes/index.tsx
```

```text
factor-iq-rework/pages/nosotros.html
        ↓
src/routes/nosotros.tsx
```

```text
factor-iq-rework/assets/
        ↓
src/assets/factor-iq/
```

---

## 6. Qué conservar del dashboard durante la migración

Inicialmente no mover ni rediseñar todo.

Conservar primero:

```text
src/routes
src/components
src/data
src/lib
src/hooks
src/server.ts
src/start.ts
src/router.tsx
scripts/generate-imported-json.cjs
```

Especialmente conservar el flujo actual:

```text
Excel
  ↓
generate-imported-json.cjs
  ↓
mystery-shopping-imported.json
  ↓
Dashboard
```

Este flujo funcionará como **compatibilidad temporal** mientras se construye la futura capa MySQL.

---

## 7. Qué NO hacer en la primera etapa

No hacer todavía:

```text
❌ Cambiar todo a Express
❌ Reescribir el dashboard
❌ Eliminar el JSON
❌ Eliminar la importación Excel
❌ Crear la exportación SQL
❌ Migrar todo a MySQL de golpe
❌ Cambiar producción directamente
```

Primero se debe tener una versión unificada que conserve el funcionamiento actual.

---

# 8. Migración por grupos

La migración se hará por grupos funcionales.

## Grupo 1 — Crear `factor-iq`

- [ ] Crear carpeta `factor-iq/`.
- [ ] Copiar `dashboardMaquinarias` como base.
- [ ] Crear nuevo repositorio Git.
- [ ] Renombrar el proyecto.
- [ ] Ejecutar instalación de dependencias.
- [ ] Ejecutar `npm run dev`.
- [ ] Ejecutar `npm run build`.
- [ ] Ejecutar `npx tsc --noEmit`.
- [ ] Confirmar que el dashboard sigue funcionando.

**No continuar hasta cumplir esta condición.**

## Grupo 2 — Reorganización de Maquinarias

Objetivo:

```text
src/modules/clientes/maquinarias/
```

Mover de manera progresiva:

- [ ] Componentes específicos.
- [ ] Gráficos.
- [ ] Filtros.
- [ ] Tipos.
- [ ] Utilidades.
- [ ] Servicios.

Después de cada movimiento:

```text
npm run dev
npm run build
```

## Grupo 3 — Migración de la web pública

Orden recomendado:

```text
1. Layout
2. Header
3. Footer
4. Inicio
5. Nosotros
6. Servicios
7. Contacto
8. Servicio nube
9. Recursos
10. Páginas restantes
```

Por cada página:

```text
HTML actual
   ↓
Componente React
   ↓
Ruta TanStack
   ↓
Prueba visual
```

No mezclar migración visual con grandes refactors de negocio.

## Grupo 4 — Navegación y acceso

Cuando la web y el dashboard convivan:

```text
factor-iq.com
    ↓
Web pública
    ↓
Login
```

```text
maquinarias.factor-iq.com
    ↓
Dashboard Maquinarias
```

La autenticación será central.

## Grupo 5 — Modelo de datos

Analizar antes de diseñar MySQL:

```text
Evaluaciones
Indicadores
Preguntas
Opciones
Concesionarias
Marcas
Ubicaciones
Tipos de evaluación
Resultados
Períodos
```

El modelo debe reflejar el negocio real del Mystery Shopper, no solamente la estructura actual del JSON.

## Grupo 6 — Autenticación

Implementar:

```text
/login
POST /api/auth/login
GET /api/auth/me
POST /api/auth/logout
```

Incluye:

- [ ] Hash de contraseñas.
- [ ] Sesión servidor.
- [ ] Cookies seguras.
- [ ] Logout.
- [ ] Expiración.
- [ ] Rate limiting.

## Grupo 7 — Roles y multi-cliente

Implementar:

```text
clientes
usuarios
roles
permisos
```

Relaciones principales:

```text
usuario → cliente
estudio → cliente
resultado → cliente
```

El backend debe aplicar el aislamiento de datos.

## Grupo 8 — Migración progresiva de datos a MySQL

Estado actual:

```text
Excel → JSON → Dashboard
```

Estado intermedio:

```text
Excel → JSON → servicio de datos → Dashboard
```

Estado objetivo:

```text
Excel/API → MySQL → API/servicio → Dashboard
```

La UI no debe quedar atada permanentemente a la forma de almacenamiento.

## Grupo 9 — Centralizar filtros y consultas

Crear una capa común:

```text
Filtros
   ↓
Consulta/servicio de datos
   ↓
Resultado normalizado
   ├── Dashboard
   ├── Gráficos
   ├── Reportes
   └── Exportaciones
```

Los filtros actuales del dashboard ya incluyen concesionaria, marca, ubicación, indicador y tipo de evaluación; deben reutilizarse como punto de partida. 

## Grupo 10 — Exportación de gráficos

Primero implementar:

```text
Filtro → gráfico → PNG
```

El archivo debe representar exactamente el estado filtrado que ve el usuario.

## Grupo 11 — Módulo de reportes

Crear:

```text
Maquinarias
├── Dashboard
├── Indicadores
├── Benchmark
├── Concesionarias
└── Reportes
```

El módulo podrá contener:

```text
Reportes
├── Datos
├── Gráficos
└── SQL
```

## Grupo 12 — Exportación de datos

Primera prioridad:

```text
CSV / XLSX
```

Aplicar:

- [ ] Filtros.
- [ ] Permisos.
- [ ] Aislamiento por cliente.
- [ ] Validación del resultado.

## Grupo 13 — Exportación SQL

Implementar solamente después de confirmar el requerimiento real.

Definir:

- [ ] Dump SQL completo.
- [ ] Estructura + datos.
- [ ] Datos filtrados.
- [ ] Consultas SQL.
- [ ] Otros formatos.

Si se necesita un `.sql`, deberá existir un permiso específico y pruebas de restauración.

## Grupo 14 — Auditoría de exportaciones

Registrar como mínimo:

```text
usuario
cliente
fecha/hora
tipo de exportación
filtros
estado
```

## Grupo 15 — Seguridad y QA

- [ ] Sesiones.
- [ ] Cookies.
- [ ] Roles.
- [ ] Permisos.
- [ ] Multi-cliente.
- [ ] API.
- [ ] Exportaciones.
- [ ] Validación de inputs.
- [ ] SQL parametrizado.
- [ ] Rate limiting.
- [ ] CORS.
- [ ] Headers de seguridad.
- [ ] CSRF cuando corresponda.

## Grupo 16 — Producción

Solo al final:

```text
Backup
 ↓
Build
 ↓
Deploy GoDaddy
 ↓
Reinicio Node.js
 ↓
Smoke tests
 ↓
Producción
```

---

# 9. Matriz de migración rápida

| Elemento actual | Origen | Acción | Momento |
|---|---|---|---|
| Dashboard actual | `dashboardMaquinarias` | Conservar | Grupo 1 |
| React/TS/TanStack | `dashboardMaquinarias` | Conservar | Grupo 1 |
| Rutas actuales | `dashboardMaquinarias` | Conservar y reorganizar | Grupo 2 |
| Componentes | `dashboardMaquinarias` | Conservar/reorganizar | Grupo 2 |
| Importación Excel | `dashboardMaquinarias` | Conservar temporalmente | Grupo 1–8 |
| JSON actual | `dashboardMaquinarias` | Conservar temporalmente | Grupo 1–8 |
| Home público | `factor-iq-rework` | Adaptar a React | Grupo 3 |
| Nosotros | `factor-iq-rework` | Adaptar a React | Grupo 3 |
| Servicios | `factor-iq-rework` | Adaptar a React | Grupo 3 |
| Contacto | `factor-iq-rework` | Adaptar a React + backend | Grupo 3/6 |
| Assets públicos | `factor-iq-rework` | Migrar | Grupo 3 |
| SEO / sitemap / robots | `factor-iq-rework` | Integrar/revisar | Grupo 3 |
| Autenticación | Nuevo | Crear | Grupo 6 |
| MySQL | Nuevo | Crear | Grupo 5–8 |
| Multi-cliente | Nuevo | Crear | Grupo 7 |
| Reportes | Nuevo | Crear | Grupo 11 |
| Exportación gráficos | Nuevo | Crear | Grupo 10 |
| Exportación datos | Nuevo | Crear | Grupo 12 |
| Exportación SQL | Nuevo | Definir y crear si aplica | Grupo 13 |
| Auditoría | Nuevo | Crear | Grupo 14 |

---

# 10. Arquitectura objetivo del producto

```text
                              FACTOR IQ
                                  |
             +--------------------+--------------------+
             |                                         |
        WEB PÚBLICA                               PLATAFORMA
             |                                         |
       factor-iq.com                              LOGIN/AUTH
                                                       |
                                                       v
                                                   USUARIO
                                                       |
                                                       v
                                                    ROL/ACL
                                                       |
                                                       v
                                                    CLIENTE
                                                       |
                                  +--------------------+--------------------+
                                  |                                         |
                              MAQUINARIAS                              Cliente B...
                                  |
                                  v
                              DASHBOARD
                                  |
                   +--------------+--------------+
                   |              |              |
                   v              v              v
               Indicadores    Benchmark    Concesionarias
                   |
                   v
                 Filtros
                   |
                   v
              Servicio de datos
                   |
                   v
                 MySQL
                   |
          +--------+---------+
          |                  |
          v                  v
       Reportes         Exportaciones
                             |
                    +--------+--------+
                    |        |        |
                    v        v        v
                   PNG     CSV/XLSX   SQL*
```

`SQL*` queda sujeto a la definición del requerimiento.

---

# 11. Criterio de trabajo por fase

Cada fase debe cerrar con cuatro comprobaciones:

```text
1. Funciona en local
2. Pasa build/TypeScript
3. No rompe funcionalidades anteriores
4. Tiene commit propio
```

Proceso:

```text
Cambio pequeño
      ↓
Prueba
      ↓
Build
      ↓
Commit
      ↓
Siguiente cambio
```

---

# 12. Próximo paso práctico

La primera sesión de trabajo del proyecto unificado debería consistir en:

```text
1. Crear factor-iq/
2. Copiar dashboardMaquinarias
3. Hacerlo correr localmente
4. Crear repositorio nuevo
5. Confirmar que el dashboard actual quedó intacto
6. Crear una rama de migración
7. Empezar la migración del Header/Footer/Home público
```

Todavía no crear login ni cambiar producción.

---

# 13. Referencia técnica de los repositorios revisados

La información funcional y técnica de esta actualización se basa en los repositorios actuales revisados: el dashboard documenta su stack React/TanStack/Vite/Tailwind/Recharts, módulos de Mystery Shopping, filtros, importación Excel y el flujo Excel→JSON; la web pública documenta su implementación HTML/Tailwind/JavaScript, sus páginas y sus pendientes de SEO, accesibilidad, QA y backend de formularios. 

Fuentes:

- Dashboard Maquinarias: https://github.com/DiegoEC12/dashboardMaquinarias
- Factor IQ Rework: https://github.com/DiegoEC12/factor-iq-rework

---

# 14. Decisión arquitectónica vigente

> **`dashboardMaquinarias` será la base técnica del nuevo proyecto `factor-iq/`. `factor-iq-rework` aportará la web pública, contenido, diseño y assets, que serán migrados progresivamente a React/TanStack. La aplicación final centralizará autenticación, datos y permisos, estará preparada para múltiples clientes y tendrá un módulo de reportes con exportación de gráficos y datos, además de exportación SQL si el requerimiento real lo justifica.**
