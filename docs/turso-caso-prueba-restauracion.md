# Caso: prueba real de respaldo y restauración con Turso (2026-10-10)

Registro de la primera prueba completa del respaldo en la nube con la base de producción de desarrollo (≈ 11 200 registros), de los defectos que encontró y de lo que falta para considerar el sistema cerrado.

Documentos relacionados: [plan-sincronizacion-turso.md](plan-sincronizacion-turso.md) (plan y bitácora) · [sincronizacion-turso-cloud.md](sincronizacion-turso-cloud.md) (guía operativa) · `api-AguaVP/docs/SINCRONIZACION_TURSO_CLOUD.md` (especificación).

---

## 1. Resumen

| | |
|---|---|
| **Resultado** | La restauración desde la nube funciona y, tras las correcciones, reproduce la base **valor por valor** (11 230 filas, 103 461 valores idénticos en la última prueba). |
| **Defectos encontrados** | 5, todos corregidos y con prueba automática (sección 4). Dos de ellos afectaban a los **respaldos locales** que existían antes de este trabajo. |
| **Pérdida real de datos** | Ninguna de datos previos a la prueba. Se perdieron de la nube los cambios de prueba del día al **forzar** un reemplazo con una base antigua (sección 5); son recuperables desde un respaldo. |
| **Versiones** | `@aguavp/api-server` 1.0.6 → **1.0.11**; app con `dbFiles.js` nuevo. |
| **Pendiente** | Sección 7. Lo más importante: retención de respaldos, mostrar qué se borra antes de un reemplazo forzado, dos equipos con la misma identidad, avisos de fallo. |

---

## 2. Cómo se verificó

Comprobar solo cantidades **no basta**: el defecto 4 (campos vaciados) no cambia ningún conteo. Cada restauración se verificó así:

1. **Pares de archivos tomados en el mismo instante:** el respaldo previo a la restauración (`agua-vp-backup-<fecha>.db`) y el respaldo de arranque de la base restaurada (`agua-vp-backup-<fecha>-1.db`). Ambos se generan con `VACUUM INTO`, así que incluyen el WAL.
2. **Esquema:** tablas, columnas (nombre, tipo, NOT NULL, DEFAULT, PK), índices, vistas y triggers.
3. **Contenido:** cada fila por `id` y cada columna común, valor por valor (BLOB comparado por bytes).
4. **Espacio:** `dbstat` por tabla (incluye sus índices), datos útiles vs. espacio sin usar.
5. **Llaves foráneas:** `PRAGMA foreign_key_check` (resultado: 0 violaciones).

Los scripts usados son de solo lectura y se ejecutan con el binario de Electron de la app (`ELECTRON_RUN_AS_NODE=1`), porque `better-sqlite3` está compilado para Electron.

---

## 3. Cronología

| Hora (local) | Acción | Resultado |
|---|---|---|
| 00:22 | Paso 2 en producción: carga completa | 11 270 registros (antes 12 721: ya no se suben sesiones/tokens) |
| 00:57 | **1.ª restauración desde la nube** (API 1.0.9) | 11 250 registros; peso 3.3 → 2.0 MB |
| 01:06 | Comparación completa | **Defecto 3**: falta `facturas.fecha_entrega_recibo` (316 valores). La app se cerró antes del ciclo que lo habría borrado en la nube |
| 01:13 | **2.ª restauración** (1.0.10) | Columna conservada ✔ |
| 01:17 | Restaurar respaldo local previo a la prueba | Base idéntica a la de antes de la prueba (solo difieren datos del nuevo inicio de sesión) |
| 01:27 | **3.ª restauración** | **Defecto 4**: 9 permisos con `updated_by` vacío (venía así de la nube) |
| 01:36 | **4.ª restauración** | Mismos 9 valores vacíos (la nube aún no se había corregido) |
| 01:41 | Se carga una base "original" **anterior a la sincronización**; la guarda avisa: la nube tiene 1 lectura más (y otra identidad) | Correcto |
| 01:48 | **Reemplazo forzado** de la nube con esa base | Se eliminan de la nube 50 registros (sección 5); los 9 permisos quedan corregidos (ya con 1.0.11) |
| 01:49 | **5.ª restauración** | Idéntica a la base anterior valor por valor, permisos incluidos ✔ |

---

## 4. Defectos encontrados y corregidos

| # | Defecto | Efecto | Cómo se detectó | Corrección |
|---|---|---|---|---|
| 1 | `createBackup` copiaba solo `agua-vp.db` | En modo WAL los cambios recientes viven en `agua-vp.db-wal`: los respaldos podían **omitirlos** (en la prueba, la copia ni siquiera tenía una tabla recién creada). La base real tenía 1 MB en el WAL | Prueba dirigida al diseñar la restauración | `snapshotDatabase` con `VACUUM INTO` (`dbFiles.js`) |
| 2 | `restoreBackup` copiaba el respaldo encima de la base **abierta** | `apiServer.stop()` solo cierra HTTP; el WAL de la conexión abierta se reaplicaba y **deshacía la restauración** | Prueba dirigida | Restauración preparada (`agua-vp.db.restaurar`) y aplicada al reiniciar, antes de abrir la base (`applyPendingRestore`) |
| 3 | La restauración copiaba solo columnas del esquema instalado | Se perdió `facturas.fecha_entrega_recibo` (316 valores), columna de una migración que ya no está en el código; la carga completa siguiente la habría vaciado en la nube | Comparación completa (1.ª restauración) | Se conservan tablas/columnas desconocidas; guarda `columnas` bloquea subir una base sin columnas que la nube sí tiene |
| 4 | La subida usaba `INSERT OR REPLACE` | SQLite lo ejecuta como borrar + insertar y **Turso aplica las llaves foráneas** a ese borrado: subir el usuario 2 vació `updated_by` en 9 permisos (ON DELETE SET NULL). Igual habría borrado rangos al subir una tarifa, puntos al subir una ruta, permisos al subir un usuario | Comparación completa (3.ª restauración) | `INSERT … ON CONFLICT(id) DO UPDATE` (actualiza en su lugar); choques de otras claves únicas se resuelven borrando solo la fila obsoleta y verificando todo |
| 5 | Corte de energía durante el reemplazo de archivos | Podía reaplicarse un `-wal` viejo sobre la base restaurada | Revisión del código | Se borra `-wal`/`-shm` huérfano antes de colocar la base; simulado en los 3 puntos de corte |

Además: restaurar un respaldo **local** ahora marca la base para una **carga completa protegida** (si la nube tiene datos más nuevos, pide confirmación; si no, re-sube todo y corrige la nube).

---

## 5. Incidente: reemplazo forzado con una base antigua

Se cargó una base de **antes** de activar la sincronización. La guarda la bloqueó correctamente (`instancia` distinta y `conteo`: la nube tenía una lectura más). Al **forzar** el reemplazo, la nube quedó igual a esa base y se borraron 50 registros:

| Eliminado de la nube | Qué era |
|---|---|
| Lectura 1295 (medidor 1, periodo 2026-09, consumo 0, pendiente, sin factura) | Prueba del día |
| Rango 17 de la tarifa 3 (31–40 m³, $6.50) | Prueba del día |
| Coordenadas del medidor 1 + historial 6213 | Edición de prueba del día |
| 48 eventos de `auditoria_seguridad` | Inicios de sesión del día |

Recuperables desde `agua-vp-backup-2026-10-10T08-36-53.db` (estaba en la Papelera de reciclaje): restaurarlo desde **Respaldos** y sincronizar.

**Lección:** el aviso de conflicto muestra cantidades, no **qué** se perdería. Ver pendiente P2.

---

## 6. Por qué la base restaurada pesa menos (medido)

Última restauración, 3 184 KB → 2 000 KB, 12 628 → 11 212 registros:

| Tabla | Registros | Espacio |
|---|---|---|
| `refresh_tokens` | 1 242 → 0 | 1 012 → 8 KB |
| `sesiones` | 101 → 0 | 100 → 8 KB |
| `tokens_revocados` | 67 → 0 | 68 → 8 KB |
| `password_recovery_tokens` | 11 → 0 | — |
| Esquema (72 triggers de registro, se recrean al vincular) | — | 56 → 32 KB |
| `sync_estado` / `__drizzle_migrations` | 6 → 3 / 24 → 23 | — |
| **Resto de tablas** | **sin cambios** | < 8 KB de diferencia cada una |

Las tablas de sesión no se suben por diseño (credenciales temporales; tras restaurar solo hay que iniciar sesión). El historial de accesos se conserva en `auditoria_seguridad`.

---

## 7. Análisis de la implementación: qué falta

> **Actualización (API 1.0.12):** P1, P2, P3, P4, P5, P6, P10 y P11 están implementados y probados; ver sección 9. P8 y P9 se cerraron tras investigar (sección 10). Quedan P7 y P12.

Revisado: núcleo (`tursoSyncCore.js`), servicio, rutas, `dbFiles.js`, `apiManager`, handlers IPC y panel.

**Funciona como se espera:** registro de cambios (incluye cambios hechos por triggers de negocio y por cascadas), `last_insert_rowid`/`changes` intactos, escrituras concurrentes durante un ciclo (quedan para el siguiente), reintento sin pérdida ante fallos de red, columnas nuevas, tablas excluidas, autenticación de `/sync`, guarda anti-sobrescritura, restauración preparada y aplicada al arrancar.

### Prioridad alta

| # | Hueco | Riesgo | Propuesta |
|---|---|---|---|
| P1 | **Retención de respaldos locales**: se guardan los 5 más recientes sin importar el motivo; cada restauración genera 2 (previo + arranque) y cada arranque 1. `maxBackups` cambiado desde el panel **no se guarda** (vuelve a 5 al reiniciar) | En la prueba, la rotación borró en minutos el respaldo previo a la restauración | Respaldos `pre-restore` y `pre-update` con retención propia (no se rotan con los de arranque); un respaldo diario conservado N días; persistir la configuración |
| P2 | **Reemplazo forzado a ciegas**: el aviso muestra conteos | Se borraron de la nube los cambios del día (sección 5) | Antes de confirmar, listar por tabla los registros (ids y un resumen) que se eliminarían de la nube; sugerir "Restaurar desde la nube" como primera opción |
| P3 | **Dos equipos con la misma identidad**: si se restaura la nube en otra computadora mientras la original sigue en uso, ambas suben a la misma copia | Ids que chocan entre equipos: la copia en la nube mezcla datos de dos bases sin aviso | `equipo_id` por instalación (en `api-secrets.enc`); la nube guarda el último equipo que escribió; si escribe otro equipo, bloquear con conflicto y pedir decisión |
| P4 | **Fallos silenciosos**: errores de sincronización solo en consola; sin aviso si pasan días sin copia | La copia puede quedar desactualizada sin que nadie lo sepa (token de Turso vencido, sin internet) | Mensajes `[TursoSync]` al visor de logs; aviso visible si no hay copia verificada en 24 h |

### Prioridad media

| # | Hueco | Propuesta |
|---|---|---|
| P5 | La verificación (sync diaria y validación de la restauración) compara `COUNT` y `MAX(id)`: **no detecta campos cambiados** (el defecto 4 pasó sin aviso) | Huella por tabla calculada en ambos lados (p. ej. `SUM` de columnas numéricas y `total(length(...))` de texto) en la verificación diaria y al restaurar |
| P6 | Turso valida llaves foráneas: una referencia huérfana en local (p. ej. datos antiguos con FK desactivadas) haría fallar la carga completa en cada intento | Hoy hay 0 violaciones. Mostrar `fkViolaciones` en el panel y el nombre de la tabla que falla |
| P7 | Probado solo con `npm run dev`: falta el reinicio automático (`app.relaunch`) en la app **instalada** | Generar el instalador y repetir una restauración |
| P8 | `facturas.fecha_entrega_recibo` y 4 entradas de `__drizzle_migrations` no existen en el repositorio | **Cerrado** (sección 10): columna heredada de una migración local no versionada; ningún código la usa; se conserva tal cual |
| P9 | Columnas conservadas al restaurar solo traen nombre y tipo (sin NOT NULL/DEFAULT/CHECK) | **Cerrado** (sección 10): la única columna afectada no tenía restricciones (`DATE` sin NOT NULL/DEFAULT) |

### Prioridad baja

| # | Hueco | Propuesta |
|---|---|---|
| P10 | Canales `system:turso-test`, `turso-config-get` y `turso-sync-status` sin `requireAdmin` | Solo lectura/prueba; protegerlos por consistencia |
| P11 | Restos tras fallos: `agua-vp.db.anterior`, `*.restaurar.invalido`, archivos en `restauraciones/` | Limpieza al arrancar |
| P12 | Sin historial de versiones en la nube (un error humano se replica en 15 min) | Revisar restauración a un punto en el tiempo del plan de Turso; respaldos diarios (P1) |

---

## 8. Procedimiento recomendado de prueba (repetible)

1. Respaldo manual desde **Respaldos**.
2. Hacer un cambio y **sincronizar**; hacer otro cambio **sin** sincronizar.
3. **Restaurar desde la nube**; al reiniciar, comparar el respaldo previo (`<fecha>.db`) con el de arranque (`<fecha>-1.db`) campo por campo (sección 2).
4. Resultado esperado: el primer cambio está, el segundo no (está en el respaldo previo); solo difieren las tablas de sesión.
5. **No** usar el reemplazo forzado salvo que se quiera descartar lo que tiene la nube.
6. **No** borrar la carpeta `backups/` hasta confirmar el resultado.

---

## 9. Pendientes resueltos (API 1.0.12)

| # | Implementación | Prueba |
|---|---|---|
| P1 | Respaldos con el motivo en el nombre (`agua-vp-backup-<fecha>-<motivo>.db`). Rotación (`planBackupRotation` en `dbFiles.js`): los N más recientes (configurable, se guarda en `userData/backup-config.json`) + uno por día de los últimos 14 días + los 10 últimos `pre-restore` y los 10 últimos `pre-update`, que no compiten con los de arranque | 30 arranques seguidos ya no borran el respaldo previo a una restauración; 14 días conservados; protegidos por motivo |
| P2 | Al bloquear una carga completa, la API calcula `eliminaria` (por tabla: total e ids que un reemplazo forzado borraría de la nube); el panel lo muestra en las dos confirmaciones | Base con 1 cliente contra nube con 3 → `clientes: 2 (ids 2, 3)`, `pagos: 2` |
| P3 | `equipoId` por computadora (en `api-secrets.enc`, fuera de la base). La nube guarda qué equipo escribió por última vez; si escribe otro, el ciclo incremental se detiene y la carga completa se bloquea con el motivo `equipo`. Restaurar desde la nube en una computadora la convierte en la que respalda (`tomar_control_equipo`) y bloquea a la anterior | PC-B con la misma base → bloqueada; PC-B tras restaurar → toma el control y PC-A queda bloqueada; con la API real: 409 `equipo` |
| P4 | Mensajes `[TursoSync]` al visor de logs (fuente `nube`, evento `sync-log` de la API). `syncMonitor.js` revisa cada 30 min y avisa a los administradores (`sync:alerta`): conflicto, ≥ 3 fallos seguidos, sin copia correcta en 24 h, diferencias en la verificación, referencias huérfanas. El mismo aviso se repite como máximo cada 6 h | Reglas en `syncHealth.js` (8 casos); 3 mensajes recibidos en el visor con la API real |
| P5 | Verificación por **contenido** (`verifyContent`: hash de cada fila, columnas comunes) en la verificación diaria, tras cada carga completa y al validar una restauración; `repairContent` corrige filas distintas o faltantes y conserva las filas extra de tablas protegidas. La verificación diaria también ejecuta `quick_check` y no sube nada si la base local está dañada | `updated_by` vaciado y un nombre alterado en la nube: la verificación rápida no los ve, la diaria los detecta y repara |
| P6 | `fkViolaciones` en el estado y en el panel; incluido en los avisos | Base real: 0 |
| P10 | `system:turso-test` exige administrador | — |
| P11 | `cleanupRestoreLeftovers` al arrancar: `.anterior`, `.restaurar.tmp`, archivos de `restauraciones/` con más de un día (los `.invalido` se conservan) | Prueba de archivos |

Pruebas: API `npm run test:sync` 46/46; app (retención, limpieza, reglas de aviso) 6/6; humo con la API real en dos procesos (restauración, re-vinculación verificada por contenido, estado, logs, bloqueo por otro equipo).

---

## 10. Origen de `facturas.fecha_entrega_recibo` (P8–P9, cerrados)

Investigación de solo lectura sobre la base real y el respaldo previo a la restauración (`…T17-52-51-pre-restore.db`):

* **Código:** no aparece en la app, la API (código actual, historial de git de todas las ramas, stashes, paquetes `.tgz` 1.0.6–1.0.12) ni en los proyectos hermanos (`app_movil`, `querys_SQL`, `api-agua-vp_2`, `AguaVP` anterior).
* **Origen:** la base anterior a las pruebas tenía 24 entradas en `__drizzle_migrations`; la n.º 20, aplicada el **2026-04-11 09:33 UTC**, no corresponde a ninguna migración del repositorio. Es una migración local que nunca se versionó. (Las entradas 0021 y 0022 tienen otro hash porque sus `.sql` se editaron después de aplicarse; no afecta, Drizzle solo compara fechas.) La base restaurada tiene las 23 del repositorio, todas con hash coincidente.
* **Definición:** `"fecha_entrega_recibo" DATE`, sin NOT NULL, DEFAULT ni CHECK; por eso conservarla solo con nombre y tipo (P9) no pierde nada.
* **Datos:** 316 de 1 119 facturas; una sola fecha por lote (marzo: 2026-03-09, abril: 2026-04-15); de mayo en adelante, vacía.
* **Uso:** ninguno. El vencimiento se calcula como `fecha_emision + dias_vencimiento_factura` (`recalcularVencimientosPorPeriodo`): marzo 03-07 + 18 = 03-25, abril 04-11 + 10 = 04-21. No interviene en recargos, cortes, recibos ni reportes. Coincide con los cambios de configuración del 11–12 de abril (31 → 10 → 15 → 18 → 10 días): un experimento de contar el plazo desde la entrega que se descartó.

**Decisión:** se deja como está, sin incorporarla al esquema oficial (sería una columna oficial sin uso, y una migración `ADD COLUMN` fallaría en esta base por estar duplicada). El sistema de copias la conserva al restaurar y la guarda `columnas` impide que se pierda en la nube. Si en el futuro se quiere registrar la entrega de recibos, se diseña como función nueva con una migración que tenga en cuenta la columna existente.
