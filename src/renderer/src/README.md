# Renderer — Interfaz de AguaVP (React)

Código de la interfaz que se ejecuta en la ventana de Electron. Se comunica con el proceso principal **solo** a través de `window.api`, `window.authApp`, `window.tarifasApp`, `window.docsApp` y `window.electronAPI` (definidos en `src/preload/index.js`).

```
src/renderer/src/
├── main.jsx           Punto de entrada: ThemeProvider → FeedbackProvider → App
├── App.jsx            Rutas (React.lazy) y pila de providers de contexto
│
├── vistas/            PÁGINAS — una carpeta por módulo / ruta
├── components/        COMPONENTES COMPARTIDOS — usados por varias vistas o por App
│
├── context/           Estado global (un Provider + hook por dominio: useClientes, useMedidores…)
├── hooks/             Hooks de lógica reutilizable (formularios, tabs, impresión…)
├── utils/             Funciones puras (fechas, periodos, tarifas, exportación…)
├── theme/             useTheme(): 'light' | 'dark' | 'system'
├── IconsApp/          Iconos SVG como componentes
├── ProtectedRoutes/   ProtectedRoute: protege las rutas que requieren sesión
└── assets/            CSS global (main.css), imágenes y SVG
```

---

## `vistas/` — páginas

Cada carpeta corresponde a un módulo. La regla es siempre la misma:

```
vistas/<modulo>/
├── <Modulo>Vista.jsx      ← la página: la que monta la ruta en App.jsx
└── components/            ← piezas que SOLO usa esta vista (tabs, modales, formularios, tarjetas)
```

| Carpeta | Página | Ruta | Qué contiene `components/` |
|---|---|---|---|
| `inicio/` | `InicioVista.jsx` | `/home` | — |
| `clientes/` | `ClientesVista.jsx` | `/clientes` | Tabs de clientes y métricas, registro/edición (secciones del formulario), detalle, buscador de medidor |
| `medidores/` | `MedidoresVista.jsx` | `/medidores` | Inventario, mapa, registro/edición, detalle, buscador de cliente |
| `lecturas/` | `LecturasVista.jsx` | `/resibos/lecturas` | Rutas (tarjeta, registro, edición, detalle, gestión), carrusel de captura, métricas de lecturas |
| `tarifas/` | `TarifasVista.jsx` | `/resibos/tarifas` | Tarjeta de tarifa, registro y edición de tarifas y rangos |
| `pagos/` | `PagosVista.jsx` | `/resibos/pagos` | Tabs (pagos, facturas, cobranza, deudores, estadísticas), modales de cobro y detalle; `deudores/` con cortes y convenios |
| `impresion/` | `ImpresionVista.jsx` | `/resibos/impresion` | Tabs de impresión de recibos, reportes y configuración (anuncio, equivalencias) |
| `recibos/` | `ResibosVista.jsx` | `/resibos` | — (menú de acceso a los submódulos de recibos) |
| `historial/` | `HistorialVista.jsx` | `/resibos/historial` | — |
| `ayuda/` | `AyudaVista.jsx` | `/ayuda` | Barra lateral, visor de documentos, buscador, impresión de documentación |
| `administrador/` | `AdministradorVista.jsx` | `/administrador` | Usuarios y permisos, configuración, personalización; `sistema/` con la consola de mantenimiento (ver su README) |
| `perfil/` | `PerfilVista.jsx` | `/perfil` | — |
| `actualizaciones/` | `ActualizacionesVista.jsx` | `/actualizaciones` | — (usa `components/actualizaciones/`) |
| `login/` | `LoginVista.jsx` | `/` | — |
| `recuperarPassword/` | `RecuperacionVista.jsx` | `/recuperarPassword` | — |
| `notFound/` | `NotFoundVista.jsx` | `*` | — |
| `documentos/` | Recibos y reportes | `/recibo`, `/reporte…`, `/comprobante-pago` | — (ver abajo) |

### `vistas/documentos/` — rutas de impresión

Páginas que **no se navegan**: el proceso principal las abre en una ventana oculta con `?print=true` para generar el PDF (respaldo cuando no hay generador nativo). No muestran navbar ni sidebar.

- `ReporteClientes.jsx` y `ReporteDocumentacion.jsx` son la **única** forma de generar esos documentos.
- El resto (`Recibo`, `ComprobantePago`, `ReporteGeneral`, `ReporteFinancieroPagos`, `ReporteLecturas`, `ReporteLecturasMetricas`, `ReporteDeudoresMayores`) solo se usan si falla el generador nativo `pdfmake` de `src/main/pdf/`. **El diseño oficial de esos documentos está en `src/main/pdf/`**, no aquí.

---

## `components/` — compartidos

Solo componentes que usan **varias vistas** o la propia `App.jsx`. Si un componente lo usa una sola vista, va en `vistas/<modulo>/components/`.

| Carpeta | Contenido | Lo usan |
|---|---|---|
| `layout/` | `navbar`, `sidebar`, `BotonActualizacionesNavbar`, `Config` (panel de ajustes del navbar), `modoTema`, `TitleBar` | `App.jsx` y la navegación |
| `impresion/` | `ModalImprimir` (vista previa, impresión y guardado de PDF) y `ModalVistaPrevia` (alias) | Impresión, pagos, lecturas, ayuda |
| `actualizaciones/` | `PanelActualizaciones`, `ModalActualizacionDisponible` | Administrador, `/actualizaciones`, `App.jsx` |
| `markdown/` | `MarkdownRenderer` (Markdown + KaTeX + Mermaid) | Ayuda, actualizaciones, documento de ayuda impreso |
| `mapa/` | Mapas Leaflet (medidores, lecturas, rutas, selector de coordenadas) y su configuración | Medidores, lecturas |
| `charts/` | Gráficas ApexCharts | Inicio, clientes, documentos de recibo |
| `calendario/` | Calendario de días hábiles | Inicio, recibos |
| `ui/` | Controles genéricos: `FormComponents`, `SelectorPeriodoAvanzado` | Varios módulos |
| `carga/` | `PantallaCarga` (arranque), `LoadingVistas` (rutas protegidas) | `App.jsx`, `ProtectedRoute` |
| `feedback/` | `FeedbackMessages` (toasts globales) | `App.jsx` |
| `bienvenida/` | `ModalBienvenida` (registro inicial de la app) | `App.jsx` |

---

## Cómo agregar o quitar cosas

**Un módulo nuevo** (ej. "inventario"):
1. Crea `vistas/inventario/InventarioVista.jsx` y, si hace falta, `vistas/inventario/components/`.
2. Regístralo en `App.jsx` con `React.lazy(() => import('./vistas/inventario/InventarioVista'))` y su `<Route>`.
3. Agrega el enlace en `components/layout/sidebar.jsx`.
4. Si necesita datos del proceso principal: canal IPC en `src/main/ipc/dominios/` y su entrada en `src/preload/index.js` (ver `src/main/ipc/README.md`).

**Un componente nuevo:**
- ¿Lo usa una sola vista? → `vistas/<modulo>/components/`
- ¿Lo usan varias vistas? → `components/<categoría>/`
- Si un componente de una vista empieza a usarse en otra, muévelo a `components/`.

**Quitar un módulo:** borra su carpeta en `vistas/`, su ruta en `App.jsx`, su enlace en el sidebar y, si ya no se usan, su contexto, hooks y canales IPC.

---

## Archivos sin uso actualmente

Se conservan en su ubicación lógica, pero **ningún archivo los importa**. Pueden eliminarse cuando se confirme que no se necesitan:

- Vistas: `inicio/components/content.jsx`, `documentos/Recibo_Oficial.jsx`, `documentos/Recibo_doblecara.jsx`, `tarifas/components/EditarTarifa.jsx`, `tarifas/components/EditarRangoTarifa.jsx`, `administrador/components/DashboardAdmin.jsx`, `GestionClientes.jsx`, `GestionMedidores.jsx`, `impresion/components/PeriodoSelector.jsx`, `impresion/components/PruebaEquivalencias.jsx`
- Componentes: `ui/Versions.jsx`, `layout/TitleBar.jsx`, `calendario/CalendarioInicio.jsx`, `charts/ClientesRegistrados.jsx`, `charts/lineChartRecibo.jsx`
- Hooks y utils: `hooks/useEstadisticasPagos.js` (vacío), `hooks/useImpresionReportes.js`, `hooks/useBuscarMedidor.js`, `utils/reporteUtils.js`, `utils/medidorUtils.js`
- Otros: `IconsApp/IconsMedior.jsx`, `assets/base.css`, `assets/mainComp.css` y varios SVG/imágenes de `assets/`
