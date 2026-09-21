# 📝 Registro de Versiones (Changelog) — AGUA-VP

---

## 🧪 Notas de la versión — v1.3.0-beta.2 [Beta]

**📅 Fecha de lanzamiento:** 21/09/2026  
**🚀 Versión:** `v1.3.0-beta.2` [Pre-release / Versión Beta de Evaluación]  
**📌 Versión base anterior estable:** `v1.2.802`  
**🔖 Pre-release precedente:** `v1.3.0-beta.1`

> ⚠️ **Aviso de Pre-release:** Esta es la segunda versión **Beta de evaluación** de la línea `v1.3.x`. Consolida la integración del nuevo Centro de Actualizaciones con visualizador persistente de notas de versión y resolución de scroll, gestión centralizada del DPI y zoom en toda la aplicación (bloqueo de Ctrl+Rueda involuntario), rediseño interactivo en tarjetas desplegables para el Detalle de Cobranza de Clientes, soporte dinámico de logos institucionales y mejoras clave en la estimación de hojas e impresión de recibos y reportes.

---

### 🔥 Novedades y Mejoras Principales

#### 🔄 1. Centro de Actualizaciones y Visor Interactivo de Changelog
- **Restablecimiento del Desplazamiento (Scroll) en `/actualizaciones`:**
  - Corrección estructural en el contenedor principal (`ActualizacionesVista.jsx`), estableciendo altura exacta de viewport `h-[calc(100vh-4rem)]` con `overflow-y-auto` y `scroll-smooth`, habilitando el desplazamiento vertical continuo sin recortes de contenido.
- **Visor Permanente de Notas de Lanzamiento en `PanelActualizaciones.jsx`:**
  - Visualización predeterminada y persistente de las notas de la versión instalada (`v1.3.0`), eliminando la condición previa que ocultaba la sección cuando no había actualizaciones pendientes.
  - Pestañas dinámicas (`[✨ Nueva v...]`, `[📌 Instalada v...]`) y selector de historial para alternar entre la versión actual instalada, actualizaciones entrantes detectadas y releases históricos (`v1.2.802`, etc.).
  - Soporte de renderizado Markdown completo (`MarkdownRenderer`) con scroll interno personalizado y formato localizado de fechas en español.
- **Arquitectura de Changelog en Proceso Principal (`updateManager.js`):**
  - Lectura y parseo de changelogs locales empaquetados en `resources/releases_changelog.md` y `docs/releases_changelog.md`.
  - Integración asíncrona con GitHub Releases (timeout de 3.5s con fallback seguro) y canal IPC `system:get-changelog` con caché en memoria.
  - Habilitación de `forceDevUpdateConfig` para pruebas de actualización en entorno de desarrollo con `dev-app-update.yml`.
  - Respaldo de base de datos automático garantizado (`pre-update`) previo a la ejecución de reinicio e instalación.

---

#### 🔍 2. Gestión Centralizada de Zoom y Bloqueo de Escala Involuntaria
- **Aislamiento de Atajos de Teclado y Rueda del Ratón:**
  - Bloqueo de gestos accidentales de zoom mediante `Ctrl + Rueda del ratón` y gestos táctiles *pinch-to-zoom*, protegiendo la escala y distribución de la interfaz.
- **Manejador Centralizado (`zoomManager.js`):**
  - Control unificado del factor de escala del viewport y sincronización automática entre la ventana principal y ventanas auxiliares (Ayuda/Soporte).
  - Persistencia de la escala personalizada en configuración local y aplicación limpia desde el arranque de Electron.
- **Selector de Escala en Panel de Configuración (`Config.jsx`):**
  - Ajuste ergonómico de DPI / Escala con opciones preestablecidas y retroalimentación en tiempo real.

---

#### 💳 3. Rediseño del Detalle de Cobranza en Tarjetas Desplegables
- **Despliegue Vertical Tipo Acordeón (`ModalDetalleCobranzaCliente.jsx`):**
  - Transformación del visualizador de pagos: en lugar de mostrar los datos en una tabla estática al fondo, ahora cada pago se presenta en tarjetas individuales que se expanden verticalmente de arriba a abajo.
  - Preservación íntegra de los tokens y estética corporativa de HeroUI y Tailwind del sistema.
- **Depuración Lógica y Eliminación de Referencias Huérfanas:**
  - Corrección de excepciones en tiempo de ejecución (`pagoSeleccionadoDetalle is not defined`) y limpieza exhaustiva de imports y variables no utilizadas.
  - Sincronización precisa con el desglose de conceptos, abonos, descuentos y saldos restantes.

---

#### 🖨️ 4. Emisión de Recibos, Reportes y Estimación de Hojas
- **Estimación y Desglose de Hojas en Impresión de Reportes (`TabReportes.jsx`):**
  - Cálculo previo y visualización explícita de la cantidad de hojas estimadas antes del envío a la impresora, brindando previsibilidad al operador antes de mandar a imprimir.
- **Módulo de Pruebas de Impresión y Emisión de Recibos:**
  - Incorporación de rutinas de prueba y validación de conectividad en `TabImpresion.jsx` y `AccionesImpresion.jsx`.
  - Optimización en el hook `useImpresionRecibos.js` para la selección masiva de predios y cola de impresión.
- **Overhaul de `ModalImprimir.jsx` e IPC de Impresión:**
  - Refactorización de componentes de formulario, cálculo de paginación e integración robusta de impresión térmica.

---

#### 🏛️ 5. Gestión Dinámica de Identidad Institucional y Logos (`LogoContext` & `logoManager`)
- **Gestión Desacoplada del Logo Municipal (`logoManager.js`):**
  - Almacenamiento, validación y sincronización de logos personalizados entre el proceso principal y los procesos de renderizado.
  - Integración del Escudo Institucional oficial como recurso de reserva (*fallback*) de alta fidelidad (`Escudo_Villa_Pesqueira_sin_fondo.png`).
- **Integración en Documentos PDF y Vista de Documentación:**
  - Vinculación del logo dinámico con los generadores PDF de recibos térmicos y reportes impresos (`reciboPdfGenerator.js`, `PrintableDocContainer.jsx`, `ReporteDocumentacion.jsx`).

---

#### 📖 6. Ventana Independiente de Soporte y Ayuda
- **Gestión Dinámica de Título de Ventana (`helpWindowManager.js` & `AyudaVista.jsx`):**
  - Actualización reactiva del título de la ventana y de la barra superior según el tema, guía o manual técnico que se esté consultando.

---

### 🔖 Trazabilidad de Versiones
- **Versión actual:** `v1.3.0-beta.2` [Pre-release]
- **Pre-release previo:** `v1.3.0-beta.1` (17/09/2026)
- **Versión base estable previa:** `v1.2.802`
- **Punto de control arquitectónico:** `v1.2.900`

---

## 🧪 Notas de la versión — v1.3.0-beta.1 [Beta]

**📅 Fecha de lanzamiento:** 17/09/2026  
**🚀 Versión:** `v1.3.0-beta.1` [Pre-release / Versión Beta de Evaluación]  
**📌 Versión base anterior estable:** `v1.2.802`  
**🔖 Punto de control intermedio de seguridad:** `v1.2.900`

> ⚠️ **Aviso de Pre-release:** Esta es una versión **Beta de evaluación**. Incorpora una modernización integral de la plataforma técnica (React 19, Vite 7, Electron 42, Tailwind 4), reingeniería de contextos, blindaje de seguridad en exportaciones y mejoras sustanciales de rendimiento para equipos con solo CPU. Esta versión está sujeta a pruebas de campo antes de su publicación como versión final estable `v1.3.0`.

---

### 🔥 Novedades y Mejoras Principales

#### 🚀 1. Modernización de la Plataforma Técnica y Dependencias Core
- **Vite 7.3.6:** Migración desde Vite 5/6 a la versión LTS madura y estable de Vite 7, optimizando tiempos de construcción y resolución de módulos.
- **Electron 42.11.4:** Actualización del runtime nativo con Chromium 148 y Node.js 24.19.0 (paridad total con el entorno del sistema operativo).
- **electron-vite 5.0.0:** Migración completa a la sintaxis moderna con configuración nativa de `build.externalizeDeps`.
- **React 19.3.0 & ReactDOM 19.3.0:** Integración oficial de React 19 con el nuevo compilador de JSX y gestión moderna de hooks.
- **Migración a HeroUI v3 & Tailwind CSS v4:**
  - Sustitución completa de `@nextui-org/react` por `@heroui/react` (`^3.2.5`) y `@heroui/styles`.
  - Integración del motor de estilos con Tailwind CSS v4 (`@tailwindcss/postcss`).
- **electron-builder 26.15.3:** Soporte oficial para empaquetar ejecutables en Electron 42 y corrección definitiva de vulnerabilidades de dependencias secundarias (`tar`).
- **better-sqlite3 13.0.3:** Recompilación binaria nativa en C++ para el motor V8 de Electron 42 con `electron-rebuild`.
- **@electron-toolkit/utils ^4.0.0:** Actualización a la versión moderna de utilidades del proceso principal sin dependencias secundarias.

---

#### 🧠 2. Reingeniería Integral de Contextos y Flujo de Datos (Fases A y B)
- **Memoización global (`useMemo`):**
  - Los 13 contextos de la aplicación (`AuthContext`, `ClientesContext`, `FacturasContext`, `PagosContext`, `DeudoresContext`, `TarifasContext`, `MedidoresContext`, `RutasContext`, `UsuariosContext`, `ReportesContext`, `DashboardContext`, `LogoContext`, `PermissionsContext`) ahora memoizan estrictamente sus valores.
  - Se eliminan por completo los re-renderizados innecesarios en cascada al cambiar de pestaña o registrar cobros.
- **Resolución de condiciones de carrera y deadlocks:**
  - Sincronización reactiva entre facturas, lecturas, pagos y balances deudores.
  - Corrección de bucles infinitos de sincronización y estados fantasma duplicados.
- **Caché Inteligente y Revocación en Cascada:**
  - Estandarización de la invalidación de caché: al registrar un pago o modificar una tarifa, los reportes financieros, deudores y métricas se refrescan automáticamente sin consultar la base de datos en bucle.

---

#### 🔒 3. Ciberseguridad y Endurecimiento (*Hardening*)
- **Protección contra Inyección de Fórmulas en CSV (*CWE-1236*):**
  - En `exportUtils.js`, se neutralizan automáticamente celdas de texto que comiencen con caracteres interpretables por hojas de cálculo (`=`, `@`, `\t`, `\r`, o `+`/`-` no numéricos) anteponiendo un apóstrofe de escape (`'`).
- **Sanitización Estricta en Generación XLSX (`ExcelJS`):**
  - Sanitización de nombres de hojas multi-hoja eliminando caracteres prohibidos por la especificación de Excel (`/`, `\`, `?`, `*`, `:`, `[`, `]`) y recortando a un máximo seguro de 31 caracteres.
  - Forzado de texto plano en celdas complejas para evitar objetos con propiedades de fórmula reservadas.
  - Límite de seguridad de 100,000 filas por hoja para evitar agotamiento de memoria (*DoS/OOM*).
- **Protección contra Path Traversal:**
  - Sanitización de nombres de archivos en el diálogo de guardado mediante `path.basename` y filtrado de caracteres reservados de Windows (`/ \ ? % * : | " < >`).

---

#### ⚡ 4. Optimización Extrema para Equipos de Oficina (CPU y Almacenamiento)
- **Eliminación de librerías pesadas y adelgazamiento de paquete:**
  - Desinstalación completa de `framer-motion`: sustitución por transiciones CSS nativas ligeras de Tailwind, reduciendo el consumo de CPU en reposo a **0 % - 1 %**.
  - Desinstalación de `pdfjs-dist`: reducción sustancial en el peso de empaquetado del bundle final.
  - Reorganización de dependencias exclusivas del frontend (`mermaid`, `react-icons`, `@heroui/react`, `apexcharts`, etc.) a `devDependencies`: se evita duplicar más de 200 MB de `node_modules` crudos dentro del instalador y en disco.
- **Carga Diferida (*Lazy Loading*):**
  - Carga diferida con `React.lazy()` y `Suspense` en todas las vistas principales y reportes pesados, reduciendo la memoria RAM inicial a ~140 MB.

---

#### 📚 5. Módulo de Ayuda y Documentación Técnica
- **Ventana Independiente de Soporte:** Nueva ventana dedicada para explorar la documentación técnica del sistema sin interrumpir las operaciones en curso.
- **Renderizado de Markdown y Diagramas Mermaid:** Visualización interactiva de diagramas de flujo y arquitectura mediante Web Workers en segundo plano.
- **Impresión de Reportes de Documentación:** Capacidad de exportar e imprimir guías de usuario y especificaciones técnicas.
- **Optimización Gráfica:** Adición de recursos visuales optimizados en formato AVIF.

---

#### 🖨️ 6. Recibos, Cobranza y Persistencia de Ventana
- Reestructuración del sistema de anuncios de recibos (`useAnuncioRecibo`, `ModalAnuncioRecibo`).
- Persistencia mejorada de dimensiones, coordenadas y estado de pantalla completa en `windowState.js`.
- Refactorización de botones y modales en módulos de cobranza, pagos y tarifas adaptados a los estándares de HeroUI.

---

### 🔖 Versión Intermedia de Seguimiento (`v1.2.900`)
> **Nota de trazabilidad:** Antes de liberar la línea `v1.3.x`, se consolidó y congeló la versión `v1.2.900` como punto de control (*checkpoint*) de seguridad y estabilidad interna para respaldar todos los cambios arquitectónicos acumulados desde la versión `v1.2.802`.

---

### 📥 Instrucciones de Evaluación (Beta)

1. **Cerrar la versión anterior** de AguaVP si está en ejecución.
2. **Descargar el instalador de prueba** desde la sección de Releases de GitHub:
   `https://github.com/Mahynlo/AGUA-VP/releases/tag/v1.3.0-beta.1`
3. **Probar en entorno de evaluación:**
   - Cobranza y emisión de comprobantes de pago.
   - Generación y previsualización de recibos térmicos y anuncios.
   - Captura y filtrado de lecturas históricas.
   - Exportación de archivos a Excel (.xlsx) y CSV.
   - Navegación fluida y consumo de memoria en equipos con solo CPU.
4. **Reportar observaciones:** Notificar cualquier anomalía detectada antes de la promoción a la versión definitiva `v1.3.0`.

---

## 📌 Información de la versión Beta

| Información | Detalle |
|---|---|
| **Versión** | `v1.3.0-beta.1` |
| **Tipo de lanzamiento** | 🟡 Pre-release / Beta de evaluación |
| **Fecha de corte** | `17/09/2026` |
| **Canal** | Pruebas de campo y validación operativa |

---

# 📝 Notas de la versión anterior — v1.2.802 [Estable]

> 📌 **Aviso:** Se recomienda actualizar a la versión **v1.2.802** para disfrutar del nuevo diseño unificado del Panel de Configuración con soporte de zoom en tiempo real (**50 % – 300 %**), la corrección de superposición de los modales de impresión con la barra de navegación, la mejora del menú de acciones en las tarjetas de rutas y la optimización del filtrado de lecturas históricas en períodos cerrados.

---

## 🔥 Novedades y mejoras

### ⚙️ Panel de Configuración y Personalización

- **Diseño unificado con `aguavp-ui-system`:**
  - Rediseño integral del panel lateral.
  - Incorporación de tokens visuales corporativos.
  - Tarjetas de opciones modulares.
  - Transiciones más fluidas.

- **Control de zoom y escalado dinámico:**
  - Selector visual para ajustar la escala de la aplicación entre **50 % y 300 %** en tiempo real.
  - Botón de restablecimiento rápido para regresar al valor estándar de **100 %**.
  - Mejor adaptación para pantallas táctiles, monitores de alta resolución y pantallas compactas.

- **Selector de tema segmentado:**
  - Control de tres estados: **Claro**, **Oscuro** y **Automático del sistema**.
  - Actualización reactiva de la apariencia.
  - Persistencia inmediata de las preferencias mediante `localStorage`.

- **Limpieza y organización visual:**
  - Eliminación de la sección redundante de atajos de teclado.
  - El panel queda enfocado en preferencias y apariencia del sistema.
  - Incorporación de un chip oficial de versión con insignia de compilación estable `v1.2.802`.

---

### 🖨️ Modales de impresión y vista previa

- **Alineación segura respecto al Navbar:**
  - Los modales de previsualización e impresión (`ModalImprimir`, `ModalAnuncioRecibo` y `ModalEquivalenciaConsumo`) ahora se posicionan a partir de `top-16`.
  - Se establece una capa de profundidad `z-[9990]`.
  - El `Navbar`, con `z-[10000]`, y los controles de ventana permanecen siempre visibles y accesibles.

- **Mejor adaptación a la pantalla:**
  - Altura máxima limitada mediante `max-h-[calc(100vh-5.5rem)]`.
  - Se evitan cortes en la parte inferior de la vista previa de recibos.
  - Fondos semi-transparentes suavizados mediante `bg-slate-900/60 dark:bg-black/80`.

---

### 🗺️ Rutas y gestión de sectores

- **Menú flotante de acciones en `RutaCard`:**
  - Reorganización de capas mediante `z-50`.
  - Las opciones de **Recalcular**, **Ver detalle** y **Editar** aparecen correctamente por encima de los indicadores de estado y período.
  - El `overflow-hidden` se limita a la portada gráfica para evitar que el menú desplegable quede truncado.

- **Ordenamiento predeterminado por predio:**
  - En `PanelGestionRuta.jsx`, el ordenamiento predeterminado ahora utiliza `numero_predio`.
  - Facilita la captura de lecturas y el seguimiento de la ruta física de distribución.

---

### 📊 Módulo de lecturas y períodos cerrados

- **Filtrado estricto de períodos cerrados (`esPeriodoCerrado`):**
  - `CarruselLecturasModal` y `ModalDetalleRuta` verifican si el período consultado se encuentra cerrado.
  - Solo se muestran los medidores y tomas que pertenecían activamente al ciclo histórico consultado.

- **Identificación unívoca mediante `medidor_id`:**
  - Mejora del rastreo y captura de lecturas.
  - Asociación de evidencias fotográficas mediante el identificador único del medidor físico.

- **Formateo estandarizado de períodos:**
  - Presentación uniforme y clara de fechas y períodos de facturación en las cabeceras de consulta.

---

### 💳 Cobranza, pagos y caché de reportes

- **Sincronización de indicadores financieros:**
  - Optimización del recálculo de KPIs y balances acumulados en `TabCobranzaCliente` y `PagosVista`.

- **Caché inteligente en `ReportesContext`:**
  - Implementación de almacenamiento en caché.
  - Reducción de consultas repetitivas al servidor.
  - Mejora en el tiempo de carga de los resúmenes de cobranza.

---

## 🐞 Correcciones de errores

### 🖨️ Centro de impresión y modales

- **Superposición con el Navbar:**
  - Corregido el problema por el cual los modales de vista previa e impresión se mostraban por encima del Navbar o quedaban cortados por el margen superior de la ventana.

- **Iconografía y etiquetas:**
  - Actualización de los iconos de recibos y etiquetas de resumen en `ImpresionVista`.
  - Mejora de la legibilidad de la información mostrada.

---

### 🗺️ Tarjetas de rutas y menús desplegables

- **Menú de opciones truncado:**
  - Corregido el problema que ocultaba la tercera opción del menú contextual cuando existían recálculos pendientes.

- **Solapamiento con indicadores:**
  - Corregido el orden de apilamiento que provocaba que el menú apareciera detrás del estado de la ruta o del período de facturación.

---

### 📊 Lecturas y sincronización

- **Altas nuevas en ciclos anteriores:**
  - Corregida la discrepancia que provocaba que nuevos clientes registrados aparecieran con lecturas pendientes dentro de meses históricos ya cerrados.

- **Parámetro `periodo_mostrado`:**
  - Actualizado `obtenerInfoRuta` para recibir el período como argumento directo.
  - Se evitan lecturas desfasadas durante las consultas históricas.

---

### 🌐 Control de sesión y navegación

- **Renderizado por roles en Navbar y Sidebar:**
  - Corregidos elementos interactivos que se mostraban antes de validar la sesión autenticada o el rol del usuario.

- **Eventos de medidores y rutas:**
  - Mejorada la sincronización en tiempo real entre contextos al registrar, transferir o dar de baja medidores.

---

## ⚠️ Notas importantes

### 1. 🔍 Control de zoom en toda la aplicación

> **Cambio:** El selector de zoom de Configuración permite ajustar la escala de la aplicación entre **50 % y 300 %**.
>
> **Impacto:** Los usuarios pueden adaptar la interfaz a pantallas táctiles, monitores grandes o pantallas compactas sin modificar la distribución de los componentes.

### 2. 🖥️ Visibilidad permanente de la barra superior

> **Cambio:** Los modales de previsualización e impresión se posicionan a partir de `top-16` con `z-[9990]`.
>
> **Impacto:** El Navbar y los controles de ventana permanecen operativos mientras se revisan recibos o reportes antes de imprimir.

### 3. 📊 Filtro de medidores en períodos cerrados

> **Cambio:** Las consultas de lecturas históricas respetan el padrón activo al momento del cierre del ciclo mediante `esPeriodoCerrado`.
>
> **Impacto:** Los medidores instalados posteriormente no aparecen como faltantes ni alteran los porcentajes de captura de períodos ya concluidos.

### 4. 🗺️ Menú de opciones en tarjetas de rutas

> **Cambio:** Elevación del menú contextual a `z-50` y separación del `overflow-hidden` de la tarjeta.
>
> **Impacto:** Las opciones de **Recalcular**, **Editar** y **Ver detalle** se despliegan correctamente por encima de los demás indicadores visuales.

---

## 📥 Instrucciones de actualización manual

1. **Cerrar la aplicación** si está en ejecución.

2. **Descargar el instalador** desde:

   `https://github.com/Mahynlo/AGUA-VP/releases/download/v1.2.802/aguavp-1.2.802-setup.exe`

3. **Ejecutar el instalador** y seguir los pasos habituales.

4. **Abrir la aplicación** y verificar las funciones principales:

   - ⚙️ Panel de Configuración
     - Zoom
     - Modo de tema
   - 🖨️ Centro de Impresión y Vista Previa
   - 🗺️ Tarjetas de Rutas y Menú de Acciones
   - 📊 Carrusel de Lecturas y Períodos Cerrados

---

## 📌 Información de la versión

| Información | Detalle |
|---|---|
| **Versión** | `v1.2.802` |
| **Estado** | 🟢 Estable |
| **Fecha de lanzamiento** | `06/09/2026` |