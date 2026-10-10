# api-client — Cliente HTTP de la API de AguaVP

Esta carpeta contiene **todas las peticiones HTTP** que el proceso principal (main) de Electron hace a la API local `@aguavp/api-server` (Express + SQLite, puerto 3000).

El renderer (React) **nunca** llama a la API directamente. El flujo completo es:

```
Componente React
   │  window.api.fetchMedidores(token, params)
   ▼
Preload (src/preload/index.js)
   │  ipcRenderer.invoke('fetch-medidores', …)
   ▼
Handler IPC (src/main/ipc/ipcHandlersMedidores.js)
   │  runWithAppKeyFlow(() => fetchMedidores(…))     ← reintenta si el AppKey fue revocado
   ▼
api-client (src/main/api-client/medidores/consultas.js)
   │  getJson(url, { token_app, token_session })     ← cabeceras y errores desde http.js
   ▼
API local  http://localhost:3000/api/v2/…
```

> Las reglas de negocio (tarifas, facturación, pagos, cortes) y la base de datos viven en la API, **no aquí**. Este código solo arma la petición, la envía y adapta la respuesta para el renderer.

---

## Estructura

```
api-client/
├── http.js                    Base común: cabeceras, fetch y manejo de errores
├── tokenExpiredHelper.js      Aviso al renderer cuando la sesión expiró
│
├── clientes/
│   ├── consultas.js           GET  — listar, estadísticas, eliminados
│   ├── registro.js            POST — registrar cliente
│   └── actualizacion.js       PUT/DELETE — modificar, asignar tarifa, eliminar, restaurar, purgar
├── medidores/
│   ├── consultas.js           GET  — listar, eliminados
│   ├── registro.js            POST — registrar medidor
│   └── actualizacion.js       PUT/DELETE — modificar, eliminar, restaurar, purgar
├── tarifas/
│   ├── consultas.js           GET  — listar tarifas
│   ├── registro.js            POST — registrar tarifa y sus rangos
│   └── actualizacion.js       PUT  — modificar tarifa y sus rangos
├── rutas/
│   ├── consultas.js           GET  — listar rutas  ·  PUT — actualizar ruta (actualizarRuta)
│   ├── registro.js            POST — crear ruta
│   └── infoMedidores.js       GET  — medidores de una ruta (por periodo)
├── lecturas/
│   ├── consultas.js           GET  — lecturas, validar cobranza, estado de periodos  ·  PUT — modificarLectura
│   ├── registro.js            POST — registrar lectura
│   └── generarFacturasRuta.js POST — generar facturas masivas de una ruta
├── facturas/
│   ├── consultas.js           GET  — listar facturas
│   └── registro.js            POST — registrar factura
├── pagos/
│   ├── consultas.js           GET  — listar pagos
│   └── registro.js            POST — registrar pago y pago distribuido
│
├── deudores.js                Cortes, reconexiones y convenios de pago
├── dashboard.js               Estadísticas del panel de inicio
└── reportes.js                Datos para reportes (recibos, lecturas, consumo, financiero)
```

### Convención de nombres

| Archivo | Contiene | Métodos HTTP |
|---|---|---|
| `consultas.js` | Lecturas de datos (listados, detalles, estadísticas) | GET |
| `registro.js` | Altas de registros nuevos | POST |
| `actualizacion.js` | Cambios sobre registros existentes | PUT / DELETE |

Los dominios con pocas operaciones (`deudores`, `dashboard`, `reportes`) son un solo archivo.

**Excepciones heredadas** (se mantienen para no cambiar imports): `actualizarRuta` vive en `rutas/consultas.js` y `modificarLectura` en `lecturas/consultas.js`, aunque ambas hacen PUT.

---

## `http.js` — base común

Es el **único** lugar donde se arman las cabeceras de la API. Todas las peticiones lo usan.

| Función | Para qué sirve |
|---|---|
| `authHeaders(token_app, token_session)` | Cabeceras de una petición autenticada: `x-app-key` (AppKey de la app) + `Authorization: Bearer` (sesión del usuario) + `Content-Type` |
| `appKeyHeaders(token_app)` | Cabeceras solo con AppKey (registro de la app, login, estado del servidor) |
| `apiFetch(url, { method, token_app, token_session, body, cache })` | `fetch` con cabeceras autenticadas. `body` se convierte a JSON automáticamente |
| `assertOk(response, { isRetry, notifyOnAuthError, formatError })` | Si la respuesta **no** es OK: lee el cuerpo, avisa al renderer si es 401/403 y lanza `Error('Error HTTP <status>: <cuerpo>')` |
| `getJson(url, { token_app, token_session, cache, isRetry, notifyOnAuthError, formatError })` | Atajo para GET: `apiFetch` + `assertOk` + `response.json()` |
| `appendDefinedParams(url, params)` | Agrega a un `URL` solo los parámetros con valor (omite `undefined`, `null` y `''`) |
| `notifyTokenExpired()` | Re-exportado de `tokenExpiredHelper.js` |

### Dos tipos de autenticación

- **AppKey (`token_app`)** — identifica a *la instalación* de la aplicación. Se obtiene con `leerToken()` de `src/main/auth/appKey.js`, que lo registra, guarda cifrado y rota cuando hace falta.
- **Sesión (`token_session`)** — identifica al *usuario* que inició sesión. Llega desde el renderer en cada llamada IPC.

### Sesión expirada

Cuando una consulta recibe **401 o 403**, `assertOk` llama a `notifyTokenExpired()`:

```
notifyTokenExpired()  →  evento 'auth:token-expired' al renderer
   →  el preload lo convierte en el evento DOM 'token-expired'
   →  AuthContext renueva la sesión
```

`reportes.js` desactiva este aviso (`notifyOnAuthError: false`), igual que antes de la refactorización.

---

## Cómo responde cada función cuando falla

Cada función conserva **su propia forma de responder ante errores**, porque el renderer depende de ella. Al modificar una función, respeta lo que ya devuelve:

| Tipo | Ejemplos | Si falla devuelve… |
|---|---|---|
| Listados | `fetchClientes`, `fetchMedidores`, `fetchTarifas`, `fetchRutas`, `fetchLecturas` | `[]` |
| Listados de eliminados | `fetchClientesEliminados`, `fetchMedidoresEliminados` | `{ total: 0, …_eliminados: [] }` |
| Estadísticas | `fetchClientesEstadisticas`, `fetchDashboardStats` | `null` |
| Registro / actualización | `registerClientes`, `updateMedidor`, `registerPagos`, … | `{ success: false, message }` |
| Facturas, pagos, reportes, deudores | `fetchFacturas`, `fetchPagos`, `fetchReporte*`, `crearConvenio`, … | **lanza** el error (lo captura `runWithAppKeyFlow` en el handler IPC) |
| Estado de periodos | `obtenerEstadoPeriodosLecturas` | Un estado por defecto con el mes actual |

---

## Agregar una petición nueva

1. Elige la carpeta del dominio y el archivo según la convención (`consultas` / `registro` / `actualizacion`). Si el dominio no existe y tiene pocas operaciones, crea un archivo suelto.
2. Usa las funciones de `http.js`; **no** armes cabeceras a mano ni importes `node-fetch` (usa el `fetch` global).
3. Lee el AppKey con `leerToken()` y valida los tokens al inicio, como las funciones vecinas.
4. Define qué devuelve ante un error siguiendo la tabla anterior.
5. Expórtala y úsala desde el handler IPC del dominio (`src/main/ipc/ipcHandlers<Dominio>.js`), envuelta en `runWithAppKeyFlow`.
6. Expón el canal en `src/preload/index.js`.

Ejemplo de consulta (ilustrativo: `fetchMedidorPorId` y su endpoint no existen en el proyecto):

```js
import { leerToken } from '../../auth/appKey.js'
import { getJson } from '../http.js'

const URL_MEDIDORES = import.meta.env.VITE_API_FETCH_MEDIDORES

export const fetchMedidorPorId = async (id, token_session, isRetry = false) => {
  try {
    const token_app = leerToken()
    if (!token_app || !token_session) return null
    const baseURL = URL_MEDIDORES.replace('/listar', '')
    return await getJson(`${baseURL}/${id}`, { token_app, token_session, isRetry })
  } catch (error) {
    console.error('Error al obtener medidor:', error)
    return null
  }
}
```

---

## URLs de la API

Las URLs salen de variables de entorno `VITE_API_*` y `VITE_URL_BASE_API_AGUAVP` (todas apuntan a `http://localhost:3000/api/v2/...`). En desarrollo vienen de `.env`; en la build de producción el workflow de CI las escribe en `.env.production`.

---

## Peticiones que no están en esta carpeta

| Archivo | Por qué está fuera |
|---|---|
| `src/main/auth/appKey.js` | Registro, recuperación y almacenamiento cifrado del AppKey (usa `appKeyHeaders`) |
| `src/main/ipc/ipcHandlersUsuario.js` | Login, sesiones y administración de usuarios con su propio `apiRequest()`, que incluye la recuperación del AppKey y el reintento. Usa `authHeaders` / `appKeyHeaders` |
| `src/main/ipc/ipcHandlersAuthApp.js` | Consulta del estado del servidor (`/api/v2/app/status`) |
