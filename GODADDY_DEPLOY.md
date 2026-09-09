# Despliegue en GoDaddy Node.js

## Configuración de la aplicación

- **Versión de Node.js:** 20.19 o superior.
- **Comando de inicio:** `npm start`. Este comando compila la aplicación para Node.js y luego ejecuta `.output/server/index.mjs`.
- **Variable de entorno obligatoria:** `SESSION_SECRET` con una clave aleatoria de al menos 32 caracteres.

## Después de subir o actualizar el código

GoDaddy Node.js Hosting ejecuta `npm install` y luego `npm start`; no requiere configurar una ruta a un archivo compilado manualmente. Si usas la consola para probar antes de reiniciar la aplicación, ejecuta:

```bash
npm ci --include=dev
npm start
```

`npm start` debe crear `.output/server/index.mjs` antes de arrancar el servidor. No se debe subir ni configurar `.vercel/` en GoDaddy: esa carpeta solo corresponde a Vercel.

Después de validar el arranque, reiniciar la aplicación Node.js desde el panel de GoDaddy.
