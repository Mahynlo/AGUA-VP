# ipc — Handlers IPC del proceso principal

El renderer (React) no tiene acceso a Node, al disco ni a la API directamente. Todo lo que necesita del sistema lo pide por **IPC** (comunicación entre procesos de Electron). Esta carpeta contiene los **handlers**: las funciones del proceso principal que responden a esas peticiones.

```
Componente React                     window.api.fetchClientes(token, params)
   ▼
Preload (src/preload/index.js)       ipcRenderer.invoke('fetch-clientes', token, params)
   ▼
Handler IPC (esta carpeta)           ipcMain.handle('fetch-clientes', …)
   ▼
Lógica en src/main/…                 api-client/, print/, pdf/, managers/, …
```

Un handler debe ser **delgado**: recibe los datos, llama a la función que hace el trabajo (en `api-client/`, `print/`, `managers/`, etc.) y devuelve el resultado. La lógica pesada no vive aquí.

---

## Estructura

```
ipc/
├── index.js              Registra todos los handlers (lo llama src/main/index.js al iniciar)
├── appKeyFlow.js         runWithAppKeyFlow(): reintento automático si el AppKey fue revocado
│
├── core/                 Funciones de la aplicación, no ligadas a un módulo de negocio
│   ├── index.js          Registra los handlers de core y limpia PDFs temporales antiguos
│   ├── appHandlers.js        Zoom y versión de la app
│   ├── printHandlers.js      Vista previa (generación de PDF) e impresión con diálogo
│   ├── silentPrintHandlers.js  Impresoras instaladas e impresión silenciosa (SumatraPDF)
│   ├── pdfToolsHandlers.js   Guardar PDF, metadatos y cortes de páginas/rotación/B&N
│   ├── docsHandlers.js       Documentación de ayuda (/ayuda) y ventana de ayuda
│   ├── exportHandlers.js     Exportar a Excel / CSV
│   ├── brandingHandlers.js   Logo personalizado e imágenes del login
│   └── systemHandlers.js     Consola de administración: logs, respaldos, BD, Turso, servidor
│
├── auth/                 Autenticación
│   ├── usuariosHandlers.js   Login, sesiones, contraseñas y gestión de usuarios/permisos
│   └── appKeyHandlers.js     AppKey de la instalación y estado del servidor
│
└── dominios/             Módulos de negocio (usan src/main/api-client)
    ├── clientesHandlers.js
    ├── medidoresHandlers.js
    ├── tarifasHandlers.js
    ├── rutasHandlers.js
    ├── lecturasHandlers.js
    ├── facturasHandlers.js
    ├── pagosHandlers.js
    ├── deudoresHandlers.js
    ├── dashboardHandlers.js
    └── reportesHandlers.js
```

Cada archivo exporta por defecto una función `register…Handlers()` que registra sus canales con `ipcMain.handle(...)`.

Los controles de la barra de título (`minimize`, `maximize`, `close`) se registran en `src/main/index.js`, porque dependen de la referencia a la ventana principal.

---

## Canales por archivo

### core/

| Archivo | Canales | Delega en |
|---|---|---|
| `appHandlers.js` | `zoom-in`, `zoom-out`, `zoom-reset`, `get-zoom-level`, `get-app-version` | `managers/zoomManager.js` |
| `printHandlers.js` | `previewComponent`, `printComponent`, `savePrintData`, `getPrintData`, `delete-temp-pdf` | `print/` (nativePdf, chromiumPdf, printTempFiles) |
| `silentPrintHandlers.js` | `getPrinters`, `print-silent` | `pdf/tools/pdfTools.js`, SumatraPDF de `pdf-to-printer` |
| `pdfToolsHandlers.js` | `save-pdf`, `get-pdf-metadata`, `generate-preview-slice` | `pdf/tools/pdfTools.js` |
| `docsHandlers.js` | `list-documentation-files`, `load-documentation-file`, `load-documentation-image`, `open-help-window` | `docs/ayudaDocs.js`, `managers/helpWindowManager.js` |
| `exportHandlers.js` | `save-file-dialog` | `export/excelExport.js` |
| `brandingHandlers.js` | `select-logo`, `save-custom-logo`, `get-custom-logo`, `clear-custom-logo`, `get-default-logo`, `select-login-images` | `managers/logoManager.js` |
| `systemHandlers.js` | `system:logs`, `system:log-stats`, `system:clear-logs`, `system:read-log-file`, `system:backup-create`, `system:backup-list`, `system:backup-restore`, `system:backup-config`, `system:db-info`, `system:migrations`, `system:server-status`, `system:turso-config-get`, `system:turso-config-save`, `system:turso-config-clear`, `system:turso-test`, `system:turso-sync-now`, `system:turso-sync-status`, `server:status`, `server:backup`, `server:list-backups` | `managers/apiManager.js`, `managers/logManager.js`, `auth/verifyToken.js` |

### auth/

| Archivo | Canales | Delega en |
|---|---|---|
| `usuariosHandlers.js` | `login`, `register`, `logout`, `verify-session`, `refresh-token`, `active-sessions-user`, `close-specific-session`, `close-all-user-sessions`, `change-password`, `request-password-recovery`, `reset-password-recovery`, `fetch-usuarios`, `create-user`, `update-user`, `delete-user`, `reactivate-user`, `purge-user`, `fetch-permissions-catalog`, `fetch-user-permissions`, `fetch-my-permissions`, `update-user-permissions` | Su propio `apiRequest()` (con recuperación del AppKey) + `api-client/http.js` |
| `appKeyHandlers.js` | `auth-app:leer-token`, `auth-app:leer-id`, `auth-app:registrar-app`, `auth-app:ensure-token`, `auth-app:recover-or-register`, `auth-app:borrar-token`, `check-server-status` | `auth/appKey.js` |

### dominios/

| Archivo | Canales | Delega en |
|---|---|---|
| `clientesHandlers.js` | `fetch-clientes`, `fetch-clientes-estadisticas`, `fetch-clientes-eliminados`, `register-cliente`, `update-cliente`, `asignar-tarifa-cliente`, `delete-cliente`, `reactivate-cliente`, `purge-cliente` | `api-client/clientes/` |
| `medidoresHandlers.js` | `fetch-medidores`, `fetch-medidores-eliminados`, `register-medidor`, `update-medidor`, `delete-medidor`, `reactivate-medidor`, `purge-medidor` | `api-client/medidores/` |
| `tarifasHandlers.js` | `fetch-tarifas`, `register-tarifa`, `registrar-rangos-tarifa`, `update-tarifa`, `update-rangos-tarifa` | `api-client/tarifas/` |
| `rutasHandlers.js` | `listar-rutas`, `listar-rutas-info-medidores`, `registrar-ruta`, `modificar-ruta`, `calcular-ruta` | `api-client/rutas/`, `src/generador_rutas/` (cálculo de ruta con ruta-craft-osm) |
| `lecturasHandlers.js` | `fetch-lecturas`, `listar-lecturas`, `obtener-estado-periodos-lecturas`, `register-lectura`, `modificar-lectura`, `generar-facturas-ruta`, `validar-cobranza-periodo` | `api-client/lecturas/` |
| `facturasHandlers.js` | `fetch-facturas`, `register-factura` | `api-client/facturas/` |
| `pagosHandlers.js` | `fetch-pagos`, `register-pago`, `register-pago-distribuido` | `api-client/pagos/` |
| `deudoresHandlers.js` | `fetch-configuracion-corte`, `update-configuracion-corte`, `recalcular-vencimientos-por-periodo`, `fetch-candidatos-corte`, `ejecutar-corte`, `registrar-reconexion`, `crear-convenio`, `obtener-convenio`, `pagar-parcialidad`, `fetch-resumen-cobro-convenio`, `pagar-integrado-convenio` | `api-client/deudores.js` |
| `dashboardHandlers.js` | `fetch-dashboard-stats` | `api-client/dashboard.js` |
| `reportesHandlers.js` | `fetch-reporte-recibos`, `fetch-reporte-lecturas`, `fetch-reporte-financiero`, `fetch-reporte-consumo-agua` | `api-client/reportes.js` |

---

## `appKeyFlow.js` — reintento con AppKey

Los handlers de `dominios/` envuelven sus llamadas en `runWithAppKeyFlow`:

```js
ipcMain.handle('fetch-medidores', (event, token_session, params) =>
  runWithAppKeyFlow(() => fetchMedidores(token_session, params), { fallbackValue: [] })
)
```

Antes de ejecutar la operación verifica que exista un AppKey válido (y lo rota si está por vencer). Si la API responde que el AppKey fue revocado, lo recupera o re-registra la app y **reintenta una vez**. Si todo falla, devuelve `fallbackValue` (o `{ success: false, message }` si no se indicó).

---

## Agregar un canal nuevo

1. **Elige la carpeta:**
   - ¿Llama a la API de un módulo de negocio? → `dominios/<dominio>Handlers.js`
   - ¿Es sesión, usuarios o AppKey? → `auth/`
   - ¿Es una función de la app (archivos, impresión, sistema)? → `core/`
2. **Pon la lógica fuera del handler:** peticiones HTTP en `src/main/api-client/`; impresión y PDF en `src/main/print/` o `src/main/pdf/`; servicios en `src/main/managers/`.
3. **Registra el canal** con `ipcMain.handle('nombre-del-canal', …)` dentro de la función `register…Handlers()` del archivo. En `dominios/`, envuélvelo en `runWithAppKeyFlow`.
4. **Expón el canal** en `src/preload/index.js` (por ejemplo dentro de `window.api`).
5. Si creas un archivo nuevo, impórtalo y llámalo en `ipc/index.js`.
6. Mantén la forma de respuesta que usan los canales vecinos (normalmente `{ success, message, ... }`), porque el renderer depende de ella.

> No registres dos veces el mismo nombre de canal: Electron lanza un error al iniciar.
