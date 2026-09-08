# Factor IQ - Rework

## Descripción del Proyecto

Factor IQ es una plataforma web enfocada en el acompañamiento estratégico para construir organizaciones saludables, donde el compromiso y el desempeño van de la mano. Este proyecto consiste en el _rework_ (rediseño y reestructuración) del sitio web principal, con el objetivo de brindar una interfaz más moderna, dinámica y responsiva que refleje los valores de la organización.

## Tecnologías Utilizadas

- **HTML5** para la estructura semántica.
- **Tailwind CSS (v4)** para el diseño, estilos personalizados y responsividad.
- **Iconify** para la gestión e integración de iconos.
- **JavaScript (Vanilla)** para la lógica de la interfaz y la interactividad (como el menú móvil).

---

## 🚀 Avance Realizado (Progreso Actual)

Hasta el momento se ha establecido la arquitectura inicial del frontend y se han completado las siguientes tareas:

- [x] **Configuración Base del Proyecto:** Configuración de dependencias (`package.json`) y Tailwind CSS.
- [x] **Maquetación de la Página de Inicio (`index.html`):**
  - Barra de navegación (Header/Menu) completamente funcional y responsiva.
  - Sección principal (Hero) con diseño atractivo, imágenes y CTAs (llamados a la acción).
  - Sección de métricas e impacto (+15 años, +200 organizaciones, etc.).
  - Sección de pilares fundamentales (Estrategia, Cultura, Desempeño) con efectos visuales (_hover_).
  - Sección de "Quiénes somos" y llamadas a la acción finales.
  - Pie de página (Footer) detallado con enlaces a todas las secciones.
- [x] **Desarrollo de Páginas Internas (`/pages`):**
  - `nosotros.html`: Página de "Quiénes somos" estructurada.
  - `servicios.html`: Página con el catálogo de servicios maquetada.
  - Creación de archivos base para las demás páginas del flujo (`contacto.html`, `recursos_informaticos.html`, `servicio_nube.html`, `pagina_construccion.html`).

---

## 🚧 Avances Pendientes / Próximos Pasos

A continuación se detallan los siguientes pasos para finalizar el _rework_:

- [ ] **Desarrollo y Pulido de Páginas Restantes:** Finalizar el contenido y la maquetación detallada de `contacto.html`, `recursos_informaticos.html` y `servicio_nube.html`.
- [ ] **Mejoras de Interactividad:** Implementar validaciones en el formulario de contacto y revisar scripts adicionales (ej. animaciones al hacer scroll o transiciones entre páginas).
- [ ] **Optimización SEO y Accesibilidad:** Añadir meta etiquetas descriptivas (Title, Description, OpenGraph) en todas las páginas e incrementar la accesibilidad (atributos `alt`, roles ARIA).
- [ ] **Control de Calidad (QA) y Responsividad:** Realizar pruebas exhaustivas en múltiples resoluciones (móviles, tablets, pantallas grandes) para asegurar un funcionamiento óptimo.
- [ ] **Integración Backend (Formularios):** Conectar los formularios (como el de contacto) para que los envíos de correo o recolección de datos funcionen en producción.
