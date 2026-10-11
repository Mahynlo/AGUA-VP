# 📝 Registro de Versiones (Changelog) — AGUA-VP

---

## 🧪 Notas de la versión — v1.3.1-rc.2 [Release Candidate]

**📅 Fecha de lanzamiento:** 10/10/2026
**🚀 Versión:** `v1.3.1-rc.2` [Pre-release / Versión Candidata de Evaluación]
**📌 Versión base anterior estable:** `v1.3.0`
**🔖 Pre-release precedente:** `v1.3.1-rc.1`
**🧩 Servidor embebido:** `@aguavp/api-server 1.0.17`

> ⚠️ **Aviso de Pre-release:** Corrección de la primera copia en la nube detectada al probar `v1.3.1-rc.1` instalada. Incluye todas las novedades de `v1.3.1-rc.1` (ver más abajo).

---

### 🐞 Correcciones

#### ☁️ Primera copia en una nube vacía (`FOREIGN KEY constraint failed`)
- **Problema:** al vincular una base de Turso **vacía**, la carga completa fallaba en cada intento con `SQLITE_CONSTRAINT: FOREIGN KEY constraint failed`: se creaba la estructura de las tablas pero no se subían los datos. Turso valida cada referencia al insertar la fila, y algunas apuntan a un registro que todavía no estaba en la nube: un usuario a otro con número mayor (`usuarios.eliminado_por`), o una factura o un pago a un convenio o una parcialidad, tablas que se suben después.
- **Corrección:** esas referencias se escriben en un segundo paso, cuando todas las filas ya están en la nube. Aplica a la carga completa, al ciclo automático de cambios (p. ej. crear un convenio y asignarlo a facturas en el mismo ciclo) y a las reparaciones de la verificación diaria.
- **Datos:** no se recalcula nada. Se suben los valores tal como están en la base local (saldos, totales, estados). Probado con una copia de la base real: 11 229 registros subidos a una nube vacía con llaves foráneas activas, contenido idéntico fila por fila y 0 referencias rotas.

#### 💾 Limpieza de respaldos
- Al eliminar respaldos antiguos por la retención se borran también sus archivos auxiliares `-wal` / `-shm`, que podían quedar sueltos en la carpeta `backups/`.

#### 💧 Tarifas: edición de rangos
- **Eliminar un rango ahora sí lo elimina.** Al editar una tarifa, el rango quitado con su botón seguía guardado y entraba en el cálculo. Ahora se borra al guardar, junto con los cambios del resto de la escala, todo o nada.
- **Validación única en la API** para crear y editar, sobre la escala completa: el primer rango empieza en 0 m³ (cuota base), cada rango empieza justo después del anterior (sin huecos ni rangos encimados), los consumos son m³ enteros y solo el último puede quedar sin máximo. Los mensajes indican qué rango corregir y en qué número debe empezar.
- **Protección al facturar:** si una tarifa tuviera rangos mal configurados, la factura de ese cliente se marca como fallida con el motivo, en lugar de generarse con un monto incorrecto.
- **Historial de precios:** cada rango creado o modificado queda registrado con su precio anterior y el nuevo (la tabla existía pero no se llenaba).
- La pantalla de edición muestra el motivo real cuando la API rechaza un cambio y, al guardar, cuántos rangos se actualizaron, agregaron y eliminaron.
- **Eliminar tarifas (nuevo):** botón en cada tarjeta de tarifa, con confirmación escribiendo su nombre. Solo se puede eliminar una tarifa **sin clientes asignados**, que **no se haya usado en ninguna factura** (protege recibos, reportes e historial de cobros) y que **no sea la única**. Se borran la tarifa, sus rangos y su historial de precios. Si no se puede, el botón aparece deshabilitado y explica el motivo. Requiere el permiso nuevo `tarifas.eliminar`, que se asigna a administradores y superadministradores al actualizar (migración `0023`).
- **El cálculo no cambia:** cuota base fija en el primer rango y cobro progresivo por tramo. Verificado recalculando las 1 119 facturas existentes: todas coinciden al centavo.

### 🖥️ Mejoras de interfaz

#### 🔎 Filtros de Clientes e Inventario de Medidores
- **Clientes:** filtro por **situación de pago** (al corriente, con saldo pendiente, 1 / 2 / 3 o más facturas vencidas), **tarifa**, **con / sin medidor**, **ruta de lectura** y ciudad; nuevo orden **Mayor adeudo**. La tabla muestra bajo el estado el adeudo de cada cliente y sus facturas vencidas (o «Al corriente»).
- **Medidores:** **ubicación agrupada** (ya no se repiten opciones por mayúsculas o espacios: «Medidor nuevo», «Medidor Nuevo » cuentan juntas), **asignado / disponible**, **marca** (ayuda a encontrar errores de captura), **ruta**, **con / sin coordenadas** y **año de instalación**.
- Cada opción muestra cuántos registros tiene. Búsqueda y filtros principales a la vista; el resto en **«Más filtros»**. Los filtros activos aparecen como etiquetas que se quitan con su X.
- **Pagos → Facturas:** se corrigió el filtro de estado: ofrecía «Vencido» y «En Convenio», que no coincidían con lo guardado («Vencida»), y no mostraba ninguna factura vencida. Nuevos filtros: **antigüedad del vencimiento** (más de 30, 60 o 90 días), **rango de consumo**, **ruta** y **tarifa**.
- **Pagos → Pagos:** filtro por **fecha de cobro** (hoy, ayer, esta semana, este mes, mes anterior o rango de fechas) con el **total cobrado** de todo el filtro, útil para el corte de caja; con fecha de cobro se incluyen pagos de todos los períodos facturados. Nuevos filtros **cobrado por** (usuario que registró el pago) y **tipo de pago** (completo, abono parcial, parcialidad de convenio). Se corrigió que «Limpiar» dejara la tabla vacía al restablecer el método de pago.
- **Pagos → Cobranza:** filtros de **situación de pago** (con deuda, al corriente, 1 / 2 / 3 o más vencidas), **monto de la deuda** (desde $500, $1,000, $2,000), **ruta** y **tarifa**, además del orden que ya existía. La impresión de deudores y la exportación respetan los filtros.
- **Exportar «Resultados del filtro»:** exporta todos los registros que cumplen los filtros, de todas las páginas (antes la opción de filtrados exportaba como máximo 60).

#### Paneles de Nube y Backups explicados
- **Nube (Turso):** el panel se ordena en dos pasos: *1. Conexión con Turso* y *2. Acciones sobre la copia*. Cada acción (Sincronizar ahora, Subir base completa, Restaurar desde la nube) tiene una tarjeta que explica qué hace y cuándo usarla. *Desvincular* queda aparte y aclara que no borra datos locales ni la copia en la nube. Se agregó una explicación en lenguaje sencillo de cómo funciona la copia.
- **Backups:** tarjetas con la explicación de *Crear respaldo ahora* y de la retención; guía de cómo funcionan los respaldos y cómo deshacer una restauración; descripción de cada tipo de respaldo al pasar el mouse; los avisos de la confirmación de restauración reflejan el funcionamiento actual (se aplica al reiniciar y se puede deshacer con el respaldo Pre-restauración).

#### Una acción a la vez
- En los paneles de Nube y Backups, mientras una operación está en curso los demás botones quedan deshabilitados y se muestra un aviso.
- Guardar o desvincular la conexión con Turso se rechaza mientras se está subiendo una copia (incluida la sincronización automática), con un mensaje para intentarlo al terminar.
- «Sincronizar ahora» ya no muestra «completada» cuando la sincronización automática estaba en curso: indica que hay que esperar.

---

### 🔖 Trazabilidad de Versiones
- **Versión actual:** `v1.3.1-rc.2` [Pre-release]
- **Pre-release previo:** `v1.3.1-rc.1` (10/10/2026)
- **Versión base estable previa:** `v1.3.0` (22/09/2026)
- **Servidor embebido:** `@aguavp/api-server 1.0.17`

---

## 🧪 Notas de la versión — v1.3.1-rc.1 [Release Candidate]

**📅 Fecha de lanzamiento:** 10/10/2026  
**🚀 Versión:** `v1.3.1-rc.1` [Pre-release / Versión Candidata de Evaluación]  
**📌 Versión base anterior estable:** `v1.3.0`  
**🧩 Servidor embebido:** `@aguavp/api-server 1.0.12` (antes `1.0.2`)

> ⚠️ **Aviso de Pre-release:** Versión candidata de la línea `v1.3.x` para pruebas en producción. Incorpora el **respaldo opcional en la nube (Turso)** con restauración verificada, un sistema de **respaldos locales más seguro** (copias consistentes, restauración al reiniciar y retención por motivo), el nuevo **Reporte General Ejecutivo** y la generación nativa en PDF de todos los reportes. El diseño y los cálculos de recibos y reportes existentes no cambian. **La nube es opcional:** sin configurarla, la app funciona en modo local exactamente como antes.

---

### 🔥 Novedades y Mejoras Principales (Cambios desde v1.3.0)

#### ☁️ 1. Respaldo Opcional en la Nube (Turso Cloud)
- **Copia automática de un solo sentido (local ➔ nube):**
  - Se configura desde **Administrador ➔ Mantenimiento ➔ Nube** (URL y token de Turso, guardados cifrados en el equipo). Sin configurar, la app trabaja en *modo local puro*.
  - Tras una carga completa inicial, solo se suben los cambios registrados (altas, ediciones y bajas) cada 15 minutos; si no hay internet los cambios quedan pendientes y se suben al reconectar.
  - Las tablas de sesiones y tokens no se suben a la nube.
- **Protección de la copia en la nube:**
  - Nunca se vacía la nube antes de copiar. La carga completa se **bloquea** si la nube pertenece a otra base de datos, si tiene más registros de negocio que la base local, si tiene columnas que la local no tiene o si la escribió **otra computadora**.
  - Antes de un reemplazo forzado se muestra, por tabla, **cuántos registros e ids se eliminarían** de la nube, con doble confirmación.
  - Cada computadora tiene un identificador propio: dos equipos no pueden mezclar sus datos en la misma copia.
- **Verificación de la copia:**
  - Después de cada subida se comparan conteos e ids de las tablas modificadas.
  - Una vez al día (y tras cada carga completa) se compara el **contenido de todas las tablas fila por fila** y se reparan las diferencias; también se revisa la integridad de la base local y no se sube nada si está dañada.
- **Restaurar desde la Nube:**
  - Descarga la copia, la valida (integridad, conteos y contenido) y la aplica **al reiniciar la app**, después de un respaldo local automático `pre-restore`.
  - Conserva columnas y tablas que el esquema actual no conoce, para no perder datos heredados.
- **Avisos y bitácora:**
  - Cada 30 minutos se revisa el estado de la copia; los administradores reciben un aviso si está detenida por un conflicto, si falló 3 veces seguidas, si no hay copia correcta en 24 horas o si la verificación encontró diferencias.
  - Los mensajes de sincronización aparecen en **Mantenimiento ➔ Logs** (fuente `nube`).
  - El panel muestra última copia, última sincronización correcta, cambios por subir, intentos fallidos y referencias huérfanas.
  - Probar la conexión con Turso requiere sesión de administrador.

---

#### 💾 2. Respaldos Locales Más Seguros
- **Copias consistentes:** los respaldos se generan con `VACUUM INTO`, incluyendo los cambios recientes que aún estaban en el archivo `-wal` (antes podían omitirse).
- **Restauración segura:** restaurar un respaldo ya no copia el archivo encima de la base abierta; se prepara, se verifica y se aplica al reiniciar, antes de abrir la base, protegido ante cortes de energía.
- **Retención por motivo:** el motivo va en el nombre del archivo (`agua-vp-backup-<fecha>-<motivo>.db`). Se conservan los más recientes (configurable y guardado entre reinicios), **uno por día de los últimos 14 días** y los **10 últimos previos a restaurar y a actualizar**, que ya no se pierden por abrir la app varias veces.
- Limpieza automática al arrancar de restos de restauraciones anteriores.

---

#### 📊 3. Reportes e Impresión
- **Nuevo Reporte General Ejecutivo (`TabReportes.jsx`):**
  - Consolida consumo de agua y situación financiera con filtros por **período**, **últimos meses** o **año**.
- **Generación nativa en PDF (pdfmake) de los reportes:** General, Financiero de Pagos, Lecturas, Lecturas con Métricas, Deudores Mayores y Comprobante de Pago se generan en el proceso principal, con mayor rapidez y fidelidad; la vista web queda como respaldo.
- **Progreso real al generar recibos:** la barra de avance refleja el progreso efectivo de la generación del PDF.
- **Impresión en escala de grises / blanco y negro** desde la vista previa, incluidas páginas sueltas.
- Mejor carga de imágenes en el Reporte de Documentación y en la Ayuda.

---

#### 📋 4. Lecturas
- **Indicadores de medidor en la toma de lecturas:** el reporte y el listado de lecturas marcan con **Cambio** o **Nuevo** los medidores sustituidos o recién instalados, y toman la lectura anterior correcta en esos casos (API: seguimiento de medidor en el reporte, con pruebas unitarias).

---

#### 🧱 5. Calidad Interna (sin cambios visibles)
- Reorganización de los manejadores IPC por dominio (`ipc/core`, `ipc/auth`, `ipc/dominios`) y cliente HTTP unificado hacia la API (`api-client/http.js`).
- Reorganización de vistas y componentes compartidos del renderer.
- Generadores PDF con fuentes y formatos compartidos (`pdf/shared`), sin alterar el diseño de recibos ni reportes.
- Limpieza del módulo de autenticación y del preload.
- Pruebas E2E (Playwright) para autenticación, navegación, clientes, medidores, lecturas, tarifas, pagos y administración.
- Se eliminó el desenfoque (`backdrop-blur`) del panel de configuración, que se veía negro en algunas tarjetas gráficas.

---

### ⚠️ Notas Importantes
- **Haga un respaldo manual** antes de instalar esta versión en el equipo de producción.
- Para usar la nube en producción, utilice **una base de Turso exclusiva** para ese equipo (no la de pruebas).
- En la primera vinculación se realiza una carga completa protegida; si aparece un aviso de conflicto, revise la lista de registros antes de forzar cualquier reemplazo.

---

### 🔖 Trazabilidad de Versiones
- **Versión actual:** `v1.3.1-rc.1` [Pre-release]
- **Versión base estable previa:** `v1.3.0` (22/09/2026)
- **Servidor embebido:** `@aguavp/api-server 1.0.12`

---

## 🚀 Notas de la versión — v1.3.0 [Estable]

**📅 Fecha de lanzamiento:** 22/09/2026  
**🚀 Versión:** `v1.3.0` [Versión Oficial de Producción / Release Estable]  
**📌 Versión base anterior estable:** `v1.2.802`  
**🔖 Pre-releases precedentes:** `v1.3.0-beta.1`, `v1.3.0-beta.2`

> ✅ **Lanzamiento Oficial Estable:** La versión `v1.3.0` culmina con éxito el ciclo de modernización más exhaustivo de **AGUA-VP**. Esta entrega resuelve de forma definitiva la trazabilidad histórica de medidores en períodos cerrados, la preservación íntegra de lecturas y facturas pasadas ante reemplazos de hardware, y la sincronización logística de rutas con ordenamiento numérico natural por predio. Todo el núcleo operativo ha sido certificado mediante una suite de 165 pruebas automatizadas al 100% de aprobación, acompañada de una interfaz en Electron refinada, reactiva y alineada al sistema de diseño unificado.

---

### 🔥 Novedades y Mejoras Principales (Cambios desde v1.3.0-beta.2)

#### 🛡️ 1. Motor de Trazabilidad e Integridad Histórica de Medidores
- **Preservación Total de Lecturas y Recibos Históricos:**
  - Resolución del problema de desvinculación al sustituir o retirar medidores: las lecturas pasadas y recibos emitidos se mantienen íntegros y accesibles permanentemente en sus períodos correspondientes (161/161 registros comprobados).
  - Consulta unificada mediante cláusulas relacionales `COALESCE` para reconstruir vínculos entre lecturas, medidores históricos y clientes sin depender exclusivamente del medidor activo actual.
- **Trigger `0022_fix_medidor_historial_triggers.sql` y Soft Delete:**
  - Implementación de triggers robustos en SQLite/Turso que gestionan adecuadamente valores `NULL` y eventos de sustitución en la tabla `cliente_medidor_historial`.
  - El proceso de retiro de medidores (`eliminarMedidor`) ahora preserva el `cliente_id`, asigna estado `'Retirado'`, registra la fecha y motivo de retiro, y cierra limpiamente los registros en el historial sin destruir la memoria contable.
- **Rutina de Autorreparación de Trazabilidad (`auto-repair`):**
  - Módulo proactivo de saneamiento en arranque que audita y repara discrepancias históricas en la base de datos sin requerir intervención manual del operador.

---

#### 🗺️ 2. Logística de Rutas y Estabilidad de Períodos Cerrados
- **CTE Unificada de Puntos de Ruta en Backend (`obtenerRutaConMedidores`):**
  - Fusión relacional inteligente (`UNION`) entre los puntos activos en `rutas_puntos` y las lecturas tomadas en el período consultado.
  - Los períodos cerrados mantienen su fotografía histórica inmutable: si un medidor fue reemplazado con posterioridad, la ruta del período cerrado continúa reflejando el medidor exacto que fue leído en ese mes.
- **Enriquecimiento de Metadatos Operativos:**
  - La API expone de manera nativa los campos `es_retirado`, `medidor_actual_reemplazo` y `cliente_numero_predio` en cada punto de ruta.
- **Ordenamiento Numérico Natural:**
  - Algoritmo de ordenamiento por posición en ruta (`orden`) con desempate natural por número de predio (`NG-1` antes que `NG-2` y `NG-10`), eliminando discrepancias alfanuméricas.

---

#### 🖥️ 3. Experiencia de Usuario y Señalización en Electron
- **Retiro de Medidores Guiado y Seguro (`TabInventarioMedidores.jsx`):**
  - Eliminación del bloqueo restrictivo que impedía retirar medidores asignados a clientes.
  - Incorporación de aviso informativo de trazabilidad en el modal de confirmación, explicando al operador que el historial de lecturas y facturas pasadas permanecerá intacto.
- **Carrusel de Toma de Lecturas con Detección Histórica (`CarruselLecturasModal.jsx`):**
  - Identificación visual clara de medidores reemplazados mediante chips `# Predio` y badge de estado `Retirado`.
  - Banner explicativo de alerta institucional al posicionarse sobre un medidor histórico:
    > *"Medidor Histórico de este Período (NUM_SERIE). Este equipo fue reemplazado o retirado (actualmente el cliente tiene el medidor NUM_NUEVO). La lectura de este período corresponde al medidor anterior."*
  - Buscador integrado optimizado para filtrar por número de serie, nombre de titular o número de predio.
- **Sincronización Total en Detalle de Ruta (`ModalDetalleRuta.jsx`):**
  - Filtro adaptativo en períodos cerrados que oculta puntos sin lectura en ese ciclo y alinea el ordenamiento 1:1 con el mapa GPS y el carrusel de campo.

---

#### 🧪 4. Cobertura Exhaustiva de Pruebas Automatizadas (165 tests unitarios al 100%)
- **Suite Integral de Pruebas en Backend (`npm run test:v2`):**
  - **Trazabilidad de Medidores (10 tests):** Validación de triggers, soft-delete, preservación de lecturas 161/161 y recuperación de facturas pasadas.
  - **Pagos y Facturación (12 tests):** Distribución FIFO de cobros, triggers de validación contra sobrepago, amortización de convenios y pagos parciales.
  - **Lecturas de Consumo (13 tests):** Lectura base inicial cero, cálculo de rollover de odómetro `(cap - ant) + act` y bloqueo de edición en períodos cerrados.
  - **Logística de Rutas (27 tests):** CTE unificada, estabilidad de rutas históricas, reordenamiento atómico por transacción y restricciones en cascada.
  - **Directorio de Clientes (39 tests):** Normalización de predios (`NG-0012` ➔ `NG-12`), migración de ruta 1 a 1 ante reemplazo de medidor, bloqueos de baja con adeudos o medidores activos y candados de purga física.
  - **Tarifas y Simulación (37 tests):** Facturación escalonada progresiva por rangos de m³, validación de huecos o solapamientos en rangos y vigencias temporales.
  - **Seguridad, Roles y Permisos (27 tests):** Inmunidad de Superadministrador, RBAC con granularidad de permisos `allow`/`deny`, revocación de tokens y bloqueo por fuerza bruta a 5 intentos.

---

#### ⚙️ 5. Empaquetado, Correos y Respaldo Preventivo
- **Servidor Embebido `@aguavp/api-server: 1.0.2`:**
  - Empaquetado y resolución de rutas relativas corregida en `package.json` para despliegues locales y producción.
  - Ejecución garantizada de migraciones automáticas (`autoMigrate: true`) con backup pre-arranque cifrado.
- **Plantillas de Correo Electrónico:**
  - Modernización visual y semántica de las plantillas HTML de recuperación de contraseña y confirmación de cambios de credenciales.

---

### 🔖 Trazabilidad de Versiones
- **Versión actual:** `v1.3.0` [Lanzamiento Oficial Estable]
- **Pre-releases precedentes:** `v1.3.0-beta.2` (21/09/2026), `v1.3.0-beta.1` (17/09/2026)
- **Versión base estable previa:** `v1.2.802`
- **Punto de control arquitectónico:** `v1.2.900`

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