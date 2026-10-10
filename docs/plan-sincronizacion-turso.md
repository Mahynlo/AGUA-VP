# Plan: respaldo en Turso seguro, íntegro y restaurable

> Estado: **en ejecución** — Paso 1 (API 1.0.7, validado con Turso real) y Paso 2 (API 1.0.8, pendiente de validación con Turso real) implementados. Siguiente: Paso 3. Documento de diseño original: [sincronizacion-turso-cloud.md](sincronizacion-turso-cloud.md).
> Código afectado: `api-AguaVP` (`src/v2/services/tursoSyncService.js`, `src/v2/routes/sync.js`, `src/database/sqlite-migrator.js`) y esta app (`src/main/managers/apiManager.js`, `src/main/ipc/core/systemHandlers.js`, `PanelSincronizacionNube.jsx`).

## Objetivo

Tener en Turso una copia de la base local que **nunca se pierda ni se corrompa** y que, si la base local se daña o se pierde, se pueda **descargar y usar** en un equipo con AguaVP. La base local sigue siendo el único escritor; la nube solo recibe cambios.

**Regla principal:** ninguna operación puede dejar la nube con menos datos válidos de los que tenía.

### Garantías

1. La copia en la nube no se vacía ni se corrompe por: base local perdida, corte de internet a mitad, actualización de la API (columnas nuevas) ni por un clic accidental.
2. Todo cambio local (altas, ediciones y borrados de cualquier tabla) llega a la nube.
3. La base descargada funciona igual que la original: esquema actual, triggers correctos y validada antes de usarse.
4. Solo la app y un administrador pueden operar la sincronización; los datos sensibles innecesarios no salen del equipo.

## Problemas encontrados (análisis del 2026-10-09)

| # | Problema | Gravedad |
|---|---|---|
| P1 | `lastSync` vive en memoria → la carga semilla corre en cada arranque y **vacía Turso antes de copiar**. Con una base local perdida/vacía, la nube se sobrescribe con la base vacía a los 15 min. | Crítico |
| P2 | Las tablas en Turso se crean con `CREATE TABLE IF NOT EXISTS`: una actualización de la API que agregue columnas hace fallar la semilla **después** de los `DELETE` → nube vacía/parcial. | Alto |
| P3 | `ensureCoreTriggers()` recrea 3 triggers con definiciones antiguas (`validar_pago_parcialidad` previa a la 0018; historial de medidores previos a la 0022). | Alto |
| P4 | El incremental no detecta: tarifas/rangos/configuración (altas y ediciones), rutas nuevas (`fecha_creacion` sin hora), ediciones de rutas, usuarios, convenios, cortes y lecturas, ni borrados de `rutas_puntos`. | Medio |
| P5 | `/api/v2/sync/*` sin autenticación (el doc dice que requiere JWT de admin). `requireAdmin` en la app deja pasar sin token o con token no verificable. | Crítico (seguridad) |
| P6 | Se suben tablas sensibles innecesarias para restaurar (tokens, sesiones, códigos de recuperación). Errores del ciclo automático solo van a `console`. | Medio |

## Fases

### Fase 1 — Proteger la copia existente (Paso 1)

- **1.1 Identidad y guarda anti-sobrescritura.** Tabla local `sync_estado` (clave/valor, nunca se sincroniza) con `instancia_id`; tabla remota `_aguavp_sync_meta` con `instancia_id`, `last_sync` y conteos. Antes de una carga completa: si la nube pertenece a otra instancia, o alguna tabla de negocio (clientes, medidores, lecturas, facturas, pagos, tarifas, usuarios) tiene **más registros en la nube que en local**, se **bloquea** y se reporta conflicto. Solo un reemplazo forzado (confirmación doble en el panel) lo omite.
- **1.2 Semilla sin vaciar.** Se sustituye "`DELETE` todo → insertar" por "insertar/actualizar todo → borrar en la nube solo los ids que ya no existen en local". Un corte a mitad deja datos viejos + parte de los nuevos, nunca la nube vacía.
- **1.3 Estado persistente.** `last_sync` se guarda en `sync_estado`; ya no hay semilla en cada arranque.
- **1.4 Columnas nuevas.** Antes de copiar, se agregan en Turso las columnas que existan en local y falten allá (`ALTER TABLE ADD COLUMN`).
- **1.5 Seguridad.** `/sync/*` exige la clave interna de la app (header con el secreto compartido Electron↔API) o un JWT de administrador. `requireAdmin` rechaza sin token / token inválido / rol operador, verificando con el secreto real de la API.
- **3.3 (adelantado) Triggers.** `ensureCoreTriggers` con las definiciones vigentes de las migraciones 0018 y 0022 + prueba que lo compare con las migraciones.

### Fase 2 — Copia completa y verificada (Paso 2)

- **2.1 Registro de cambios por triggers locales** (`sync_cambios`: tabla, registro_id, operación) en todas las tablas sincronizadas; el incremental avanza por id del registro, no por fechas. Cubre P4.
- **2.2** Esquema reconciliado también en el incremental y versión de migración en `_aguavp_sync_meta`.
- **2.3 Verificación** tras cada sync: `COUNT(*)` y `MAX(id)` por tabla local vs nube en un solo batch; diario, checksum por tabla.
- **2.4 Integridad antes de subir:** `PRAGMA quick_check` y `foreign_key_check`; una base local dañada no se sube.

### Fase 3 — Restaurar desde la nube en la app (Paso 3)

1. Crear una base temporal con las migraciones de la versión instalada (esquema actual + triggers correctos).
2. Copiar los datos de Turso por columnas comunes, en orden de dependencias, con triggers de negocio desactivados.
3. Validar: `integrity_check`, `foreign_key_check`, conteos contra `_aguavp_sync_meta`, saldos de facturas = total − pagos.
4. Reactivar triggers y reemplazar la base con el flujo de `restoreBackup` (que guarda antes un respaldo de seguridad). Si algo falla, la base local queda intacta.
5. La base restaurada hereda el `instancia_id` de la nube.

Panel: botón **"Restaurar desde la nube"** con resumen previo (fecha, versión, conteos). La ruta manual (`turso db shell .dump` → `sqlite3`) queda documentada como emergencia.

### Fase 4 — Datos sensibles, versiones y visibilidad (Paso 4)

- **No se suben:** `refresh_tokens`, `sesiones`, `tokens_revocados`, `password_recovery_tokens` (tras restaurar, los usuarios solo vuelven a iniciar sesión). **Sí:** `usuarios`, permisos y `apps` (decisión: se conserva `apps` para que la restauración no dependa de volver a registrar la app).
- **Versiones:** opción simple — resumen diario de conteos en `_aguavp_snapshots` para detectar pérdidas; la recuperación de días anteriores se apoya en los respaldos locales diarios.
- Errores de sync al `logManager`; el panel muestra "Última copia verificada hace X" y aviso si pasan > 24 h sin sync verificada.
- Actualizar `sincronizacion-turso-cloud.md` (app) y `SINCRONIZACION_TURSO_CLOUD.md` (API).

### Fase 5 — Pruebas

`node:test` en `api-AguaVP`, usando como "nube" un archivo libsql local (`createClient({ url: 'file:…' })`): sin internet ni cuenta de Turso.

| Prueba | Debe comprobar |
|---|---|
| Local vacía + nube con datos | No se sube; conflicto |
| Nube de otra instancia | No se sube; conflicto |
| Corte a mitad de la semilla | La nube conserva sus datos |
| Columna nueva en local | Se agrega en la nube y la copia sigue |
| Borrado local | Desaparece en la nube tras la semilla |
| Ida y vuelta local → nube → restaurar | Mismos conteos, saldos correctos, triggers funcionando |
| `/sync/*` sin credenciales | 401/403 |
| `ensureCoreTriggers` | Igual a la última definición de cada trigger en las migraciones |

## Orden de entrega

| Paso | Contenido | Repositorio | Riesgo |
|---|---|---|---|
| 1 | Fase 1 + 3.3 | API + app | Bajo — elimina las fallas críticas |
| 2 | Fase 2 | API (nueva migración) | Medio |
| 3 | Fase 3 | API + app | Medio |
| 4 | Fase 4 + documentación | API + app | Bajo |

Cada paso: pruebas de la Fase 5 que le correspondan → reconstruir `aguavp-api-server-*.tgz` → `npm install` en la app → prueba manual con una base real de Turso.

**No cambia:** el local es el único escritor, ciclo de 15 min con "cero red sin cambios", credenciales cifradas con safeStorage, respaldos locales, uso diario de la app.

**Pendiente evaluado y pospuesto:** escuchar solo en `127.0.0.1`. Los clientes usan `localhost` (puede resolver a `::1`) y no está confirmado si algún flujo usa la API por red local; con `/sync` protegido, el riesgo restante queda cubierto por AppKey + JWT del resto de rutas.

## Bitácora

- 2026-10-09 — Plan aprobado. Inicia Paso 1.
- 2026-10-09 — **Paso 1 implementado** (`@aguavp/api-server` 1.0.7):
  - API: nuevo `src/v2/services/tursoSyncCore.js` (lógica sin estado, se prueba sin Turso); `tursoSyncService.js` usa `sync_estado` (local) y `_aguavp_sync_meta` (nube); semilla sin `DELETE` previo + borrado por diferencia de ids; guarda anti-sobrescritura (instancia + conteos de clientes, medidores, lecturas, facturas, pagos, tarifas, usuarios) con respuesta 409 y `{ force: true }`; reconciliación de columnas; `/sync/*` protegido (clave interna o JWT admin).
  - Triggers: `CORE_TRIGGERS` exportado y alineado con las migraciones. Además de los 3 detectados, faltaba **`actualizar_estado_factura_parcial`** (0013): una base restaurada nunca marcaba facturas como "Parcial". `actualizar_saldo_factura` quedó igual a la migración 0002 (sin `WHEN`, comportamiento equivalente).
  - App: `syncHeaders()` y `verifySessionToken()` en `apiManager`; `requireAdmin` rechaza sin token, con token inválido/expirado o rol distinto de administrador/superadmin (afecta también a restaurar respaldo local); panel muestra el conflicto y permite reemplazo forzado con doble confirmación. Eliminado `src/main/auth/verifyToken.js` (verificaba con `VITE_SECRET_KEY`, que no es el secreto de la API).
  - Pruebas: `npm run test:sync` en la API (21/21: protección, columnas nuevas, borrados, identidad heredada, triggers vigentes y su comportamiento). Prueba de humo con la API real bajo Electron: 401 sin clave, semilla 61 registros, "sin cambios" sin red, 409 con nube con más usuarios (dato conservado), reemplazo forzado, 9 triggers locales.
  - Nota: la carga completa ya **no** se repite en cada arranque. Si una tabla protegida pierde registros legítimamente (p. ej. borrar un usuario) y luego se requiere una carga completa, el panel pedirá confirmar el reemplazo.
- 2026-10-09 — Prueba real con Turso: carga completa de 12 721 registros sin borrados en la nube. Documentación actualizada: `docs/sincronizacion-turso-cloud.md` (app), `docs/SINCRONIZACION_TURSO_CLOUD.md` y `README.md` (API).
  - **Efecto lateral del Paso 1 a tener en cuenta:** antes, la carga completa en cada arranque "tapaba" los huecos del incremental (P4). Ahora solo corre la primera vez, así que esos cambios esperan a una carga completa manual. El Paso 2 pasa a ser prioritario; como medida inmediata se puede programar una carga completa protegida diaria (ya no vacía la nube y respeta la guarda).
- 2026-10-10 — **Paso 2 implementado** (`@aguavp/api-server` 1.0.8):
  - Registro de cambios: tabla local `sync_cambios` + triggers `_sync_<tabla>_ins|upd|del` en todas las tablas sincronizadas (creados al vincular, quitados al desvincular). El incremental sube el estado actual de los registros anotados (existe → INSERT OR REPLACE; no existe → DELETE) y avanza `cambios_cursor`. Reemplaza la detección por `historial_cambios` y fechas: resuelve P4 (tarifas, rutas, usuarios, convenios, cortes, lecturas, puntos de ruta, cambios por triggers de negocio y cascadas).
  - Verificación tras cada subida (tablas tocadas) y completa cada 24 h: `COUNT(*)` + `MAX(id)`; reparación automática sin borrar registros extra de tablas protegidas.
  - Integridad: `PRAGMA quick_check` antes de cada carga completa (bloquea incluso con `force`); `foreign_key_check` como aviso.
  - Adelantado de la Fase 4.1: `sesiones`, `refresh_tokens`, `tokens_revocados`, `password_recovery_tokens` ya no se suben ni se registran, y se vacían en la nube en la siguiente carga completa (necesario para mantener "cero red en reposo": cambian en cada renovación de sesión). `apps` se conserva.
  - Al actualizar desde 1.0.7 el primer ciclo hace una carga completa protegida (activa el registro de cambios).
  - Panel: muestra "Respaldo remoto verificado" / "⚠️ Diferencias en: …" y cambios por subir.
  - Pruebas: `npm run test:sync` 30/30. Humo con la API real: carga completa 61 registros y verificada; sin cambios → sin red; edición de tarifa y usuario subidas (2), borrado propagado; `lastInsertRowid`/`changes` intactos; 72 triggers de registro, ninguno en sesiones/tokens; desvincular los quita y deja los 9 de negocio.
