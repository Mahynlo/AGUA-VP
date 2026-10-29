# Documentación de Ayuda (manual en la app) — AguaVP

Cómo funciona la sección **Ayuda**, cómo escribir sus guías y cómo se imprime el manual en PDF.

## 📁 Dónde viven las guías

```
ayuda/
├── clientes/  facturas/  impresion/  lecturas/  medidores/  pagos/  tarifas/   ← una carpeta = un módulo
│   └── <Título de la guía>.md
└── imagenes/<modulo>/...                                                        ← capturas (no se lista como módulo)
```

- La carpeta se empaqueta como `extraResources` (en producción queda en `resources/ayuda`). En desarrollo se lee de `./ayuda`; cualquier cambio se ve al reabrir la guía.
- Título, icono y subtítulo de cada módulo: `src/renderer/src/vistas/ayuda/components/sectionConfig.jsx`.

### Frontmatter

```yaml
---
titulo: "Registro de Pagos y Abonos Distribuidos"
seccion: "pagos"
orden: 6                     # posición dentro del módulo (menor = primero)
descripcion: "Una línea; se usa en el índice y en la búsqueda."
tags: ["pago distribuido", "abonos"]
tipo: uso                    # opcional: uso | funcionamiento (si falta se deduce del nombre)
---
```

## ✍️ Qué se puede usar dentro de una guía

| Elemento | Cómo | Notas |
|---|---|---|
| Capturas | `![Qué muestra](../imagenes/<modulo>/<nombre>.png)` | El texto alternativo se usa como pie de foto. Ver *Imágenes*. |
| Avisos | `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]` | Se dibujan como recuadros de color. |
| Tablas | GFM (`\| a \| b \|`) | En el PDF no se parten entre páginas; tablas muy largas, mejor dividirlas. |
| Diagramas | Bloque ` ```mermaid ` | `flowchart`, `graph`, `sequenceDiagram`, `stateDiagram-v2` están en uso. |
| Fórmulas | `$m^3$`, `$$ ... $$` (KaTeX) | |

### Signo de pesos

`$` abre una fórmula de KaTeX. Los montos `$120.00` se escapan solos, pero un `$` suelto seguido de texto (`$importe`, `+ $ convenio`) debe escribirse `\$`.

### Diagramas Mermaid

- Etiquetas cortas; para dos renglones usar `<br/>` dentro del nodo: `A[Mayo: $180<br/>Queda pagada]`.
- Si un diagrama tiene error de sintaxis se muestra el código en un recuadro amarillo (en pantalla y en el PDF); revisarlo en <https://mermaid.live>.
- En el PDF los diagramas se limitan a 180 mm de alto; los muy largos conviene partirlos.

## 🖼️ Imágenes

`load-documentation-file` (`src/main/ipc/core/docsHandlers.js`) convierte cada imagen a *data URI* antes de mandar la guía al renderer, así funciona igual en pantalla, en la ventana de ayuda y en el PDF. Para encontrarla prueba, en orden:

1. La ruta relativa a la guía (`../imagenes/pagos/x.png`).
2. `ayuda/imagenes/...` y `ayuda/imagenes/<nombre>`.
3. **El mismo nombre con otra extensión**: `.avif`, `.webp`, `.png`, `.jpg`, `.jpeg`, `.svg`. Se puede guardar `x.avif` aunque la guía diga `x.png`.
4. Búsqueda recursiva por nombre (sin extensión) dentro de `ayuda/imagenes`.

Si no la encuentra, se dibuja un recuadro **“Espacio reservado para captura”**. En el PDF ese recuadro sale compacto y sin la ruta del archivo.

**Recomendado:** AVIF o WebP, ancho ~1400 px, recortar a la parte relevante de la pantalla, tema claro (el PDF es blanco).

## 🖨️ Impresión del manual (PDF)

`AyudaVista` → `ModalImprimirDocumentacion` (alcance: guía actual, módulo o manual completo; portada e índice opcionales).

1. Se juntan las guías ya convertidas (con imágenes en data URI) y se guardan con `savePrintData`.
2. `previewComponent('#/reporteDocumentacion?dataKey=…&print=true', { pageNumbers: true, pageSize: 'Letter', readyTimeoutMs: 45000 })`.
3. No hay generador pdfmake para este documento: `src/main/print/chromiumPdf.js` abre una ventana oculta con `ReporteDocumentacion.jsx` y captura con `printToPDF()`.
4. `ReporteDocumentacion` solo envía `print-ready` cuando **no quedan diagramas pendientes** (`mermaidCoordinator`), **todas las imágenes están cargadas** y **las fuentes listas**. Tope interno: 40 s.
5. `readyTimeoutMs` hace que el proceso principal espere esa señal hasta 45 s (el valor por defecto de 3.5 s se mantiene para los demás reportes web).

Reglas de estilo del PDF (bloque `@media print` en `ReporteDocumentacion.jsx`):
- Tipografía compacta (9 pt), carta vertical, márgenes de 12 mm.
- **Las etiquetas de Mermaid quedan fuera** de las reglas de `p`/`li`: Mermaid mide cada caja con los estilos de pantalla y, si el texto cambia de tamaño al imprimir, se sale o se corta.
- La versión de la portada se lee con `getAppVersion()`.

## ✅ Cómo probar

1. `npm run dev` → Ayuda → abrir una guía con diagramas (p. ej. *Pagos › Registro de Pagos y Abonos Distribuidos*).
2. Imprimir → **Manual completo** con portada e índice: deben verse todos los diagramas completos (sin el recuadro “Generando diagrama…”) y las capturas de *Lecturas*.
3. En la consola del proceso principal debe aparecer `Señal print-ready recibida`, no `Usando fallback timer`.

## 📷 Capturas pendientes

Las guías hacen referencia a 104 capturas; existen 23, todas de *Lecturas*. Faltan las 81 siguientes; basta guardar cada archivo con ese nombre (cualquier extensión de la lista de arriba) para que aparezca en pantalla y en el PDF.

### clientes (19)

| Guía | Archivo esperado (`ayuda/…`) | Qué debe mostrar |
|---|---|---|
| Asignar a Rutas de Lectura | `imagenes/clientes/gestion_rutas_pueblo.png` | Gestión y asignación de medidores dentro de la Ruta de Lectura del pueblo |
| Asignar a Rutas de Lectura | `imagenes/clientes/puntos_inspeccion_ruta_lectura.png` | Puntos de inspección y medidores ordenados en la ruta de trabajo |
| Asignar un Medidor | `imagenes/clientes/panel_buscar_medidor_cliente.png` | Panel de Gestión de Medidor y Buscador de Series |
| Asignar un Medidor | `imagenes/clientes/chips_estado_disponibilidad_medidor.png` | Chips de estado de disponibilidad: Libre, Actual y Ocupado |
| Asignar un Medidor | `imagenes/clientes/confirmacion_asignacion_medidor.png` | Confirmación de asignación exitosa de medidor en el expediente |
| Eliminar Cliente | `imagenes/clientes/zona_peligro_desactivar_cliente.png` | Sección Zona de Peligro al pie del modal de edición |
| Eliminar Cliente | `imagenes/clientes/motivo_baja_confirmacion_cliente.png` | Campo de motivo de baja con contador de caracteres y checkbox de confirmación |
| Introduccion | `imagenes/clientes/directorio_clientes_vista_principal.png` | Vista principal del Directorio de Clientes con tabla, buscador y filtros |
| Introduccion | `imagenes/clientes/metricas_clientes_dashboard.png` | Pestaña de Métricas y Analítica de Padrón Municipal |
| Introduccion | `imagenes/clientes/modal_detalle_expediente_cliente.png` | Expediente Digital del Cliente con historial de recibos, pagos y consumos |
| Liberar Medidor | `imagenes/clientes/boton_liberar_medidor_cliente.png` | Botón de Liberar Medidor en la sección de gestión del cliente |
| Liberar Medidor | `imagenes/clientes/medidor_liberado_inventario.png` | Estado del medidor devuelto a Libre en el inventario general |
| Modificar Cliente | `imagenes/clientes/modal_editar_cliente.png` | Modal de Edición con datos precargados del titular |
| Modificar Cliente | `imagenes/clientes/tarjeta_tarifa_actual_cliente.png` | Tarjeta informativa de Tarifa Actual y selector para cambio |
| Registrar Cliente | `imagenes/clientes/boton_nuevo_cliente.png` | Botón Nuevo Cliente en la cabecera del directorio de clientes |
| Registrar Cliente | `imagenes/clientes/formulario_registro_datos_personales.png` | Formulario de Registro: Bloque de Información Personal y Número de Predio |
| Registrar Cliente | `imagenes/clientes/alerta_predio_duplicado.png` | Alerta de validación en tiempo real cuando un Número de Predio ya está ocupado |
| Registrar Cliente | `imagenes/clientes/formulario_registro_direccion.png` | Formulario de Registro: Bloque de Dirección de Residencia y Selección de Pueblo |
| Registrar Cliente | `imagenes/clientes/formulario_registro_tarifa.png` | Formulario de Registro: Bloque de Selección de Esquema Tarifario |

### facturas (7)

| Guía | Archivo esperado (`ayuda/…`) | Qué debe mostrar |
|---|---|---|
| Ciclo de Vida y Estados de Facturas | `imagenes/facturas/estados_facturas_chips.png` | Diagrama y visualización de estados en la tabla de facturas |
| Introduccion | `imagenes/facturas/facturas_vista_principal.png` | Vista principal del Módulo de Facturas con tabla maestra y KPIs |
| Introduccion | `imagenes/facturas/filtros_periodo_facturas.png` | Filtros avanzados por período y estado de factura |
| Lógica de Cálculo y Desglose Tarifario | `imagenes/facturas/modal_detalle_factura.png` | Modal de Detalle de Factura con desglose de consumos y tarifas |
| Lógica de Cálculo y Desglose Tarifario | `imagenes/facturas/desglose_bloques_consumo.png` | Gráfica y desglose de bloques de consumo en la factura |
| Recalculo y Correcciones de Facturas | `imagenes/facturas/modal_recalculo_facturas.png` | Modal de confirmación de recálculo con motivo de auditoría |
| Recalculo y Correcciones de Facturas | `imagenes/facturas/visualizador_facturas_recalculadas.png` | Visualizador de facturas recalculadas vs anteriores |

### impresion (13)

| Guía | Archivo esperado (`ayuda/…`) | Qué debe mostrar |
|---|---|---|
| Configuración de Recibos y Cultura del Agua | `imagenes/impresion/impresion_tab_configuracion.png` | Pestaña de Configuración Visual |
| Configuración de Recibos y Cultura del Agua | `imagenes/impresion/impresion_modal_anuncio.png` | Modal de Edición de Anuncio Institucional |
| Configuración de Recibos y Cultura del Agua | `imagenes/impresion/impresion_modal_equivalencias.png` | Modal de Equivalencias de Consumo |
| Impresión de Recibos | `imagenes/impresion/impresion_recibos_lote.png` | Pantalla de Impresión General de Recibos |
| Impresión de Recibos | `imagenes/impresion/impresion_acciones_panel.png` | Panel de Acciones de Impresión |
| Impresión de Recibos | `imagenes/impresion/impresion_modal_visor_pdf.png` | Modal de Configuración de Impresión |
| Impresión desde Otros Módulos | `imagenes/impresion/impresion_dropdown_deudores.png` | Menú de Impresión de Deudores |
| Impresión desde Otros Módulos | `imagenes/impresion/impresion_ticket_comprobante.png` | Comprobante Térmico de Pago |
| Impresión desde Otros Módulos | `imagenes/impresion/impresion_reporte_metricas_lecturas.png` | Reporte de Métricas de Lecturas |
| Introduccion | `imagenes/impresion/impresion_dashboard_principal.png` | Centro de Impresión y Reportes |
| Reportes y Exportación | `imagenes/impresion/impresion_tab_reportes.png` | Vista de Reportes y Exportación |
| Reportes y Exportación | `imagenes/impresion/impresion_padron_clientes.png` | Generador del Padrón General |
| Reportes y Exportación | `imagenes/impresion/impresion_exportacion_panel.png` | Panel de Exportación a Excel y CSV |

### medidores (18)

| Guía | Archivo esperado (`ayuda/…`) | Qué debe mostrar |
|---|---|---|
| Asignar Medidor a Cliente | `imagenes/medidores/asignacion_medidor_cliente.png` | Panel de búsqueda y asignación de medidores en edición de cliente |
| Asignar Medidor a Cliente | `imagenes/medidores/medidor_vincular_cliente.png` | Componente BuscarCliente en el formulario de medidores |
| Asignar Medidor a Cliente | `imagenes/medidores/confirmacion_vinculacion_medidor.png` | Ficha del cliente con el medidor formalmente vinculado |
| Introduccion | `imagenes/medidores/mapa_medidores_interactivo.png` | Mapa interactivo de geolocalización de medidores con panel lateral |
| Introduccion | `imagenes/medidores/inventario_medidores_tabla.png` | Tabla maestra del Inventario de Medidores con buscador y filtros |
| Introduccion | `imagenes/medidores/metricas_kpis_medidores.png` | Panel de métricas y tarjetas de indicadores KPIs de medidores |
| Introduccion | `imagenes/medidores/modal_detalle_medidor.png` | Ficha técnica y expediente digital del medidor |
| Modificar Medidor | `imagenes/medidores/modal_editar_medidor.png` | Ventana modal para editar parámetros del medidor |
| Modificar Medidor | `imagenes/medidores/alerta_modificar_lectura_base.png` | Advertencia de seguridad al alterar la lectura base |
| Reasignacion y Reemplazo de Medidor | `imagenes/medidores/flujo_reemplazo_medidor.png` | Flujo de reemplazo y desvinculación de medidores |
| Reasignacion y Reemplazo de Medidor | `imagenes/medidores/modal_desactivar_medidor.png` | Modal de confirmación de desactivación con motivo obligatorio |
| Reasignacion y Reemplazo de Medidor | `imagenes/medidores/papelera_medidores.png` | Pestaña de Papelera con opciones de Restauración y Purga Definitiva |
| Registrar Medidor | `imagenes/medidores/formulario_registro_medidor.png` | Formulario modal de registro de nuevo medidor |
| Registrar Medidor | `imagenes/medidores/registro_buscar_cliente.png` | Buscador y vinculación de cliente en tiempo de registro |
| Registrar Medidor | `imagenes/medidores/selector_coordenadas_mapa.png` | Selector de coordenadas GPS con mapa interactivo Leaflet |
| Uso en Rutas y Facturacion | `imagenes/medidores/lecturas_ruta_medidor.png` | Lista de campo con datos del medidor y lectura anterior |
| Uso en Rutas y Facturacion | `imagenes/medidores/calculo_consumo_rollover.png` | Algoritmo de cálculo de consumo con detección de vuelta a cero |
| Uso en Rutas y Facturacion | `imagenes/medidores/factura_detalle_consumo_medidor.png` | Recibo de agua con desglose del consumo del medidor |

### pagos (17)

| Guía | Archivo esperado (`ayuda/…`) | Qué debe mostrar |
|---|---|---|
| Cartera Vencida y Morosidad | `imagenes/pagos/cartera_vencida_reporte.png` | Reporte y listado de Cartera Vencida con ranking de morosidad |
| Cartera Vencida y Morosidad | `imagenes/pagos/imprimir_deudores_dropdown.png` | Opciones de impresión de deudores con ordenamiento |
| Cobranza por Cliente | `imagenes/pagos/tabla_cobranza_cliente.png` | Tabla maestra de Cobranza por Cliente con ranking de deuda |
| Cobranza por Cliente | `imagenes/pagos/filtros_ranking_cobranza.png` | Opciones de ordenamiento y filtros en Cobranza por Cliente |
| Expediente y Detalle de Cobranza | `imagenes/pagos/modal_detalle_cobranza_cliente.png` | Detalle de Cobranza del cliente con el resumen en el encabezado y las pestañas |
| Expediente y Detalle de Cobranza | `imagenes/pagos/expediente_historial_facturas_pagos.png` | Historial de facturas y pagos dentro del expediente |
| Historial de Pagos y Comprobantes | `imagenes/pagos/tabla_historial_pagos.png` | Tabla maestra del Historial de Pagos con folios y filtros |
| Historial de Pagos y Comprobantes | `imagenes/pagos/modal_detalle_pago.png` | Modal de Detalle de Pago y Comprobante de Caja |
| Introduccion | `imagenes/pagos/pagos_vista_principal.png` | Vista principal del Módulo de Pagos y Cobranza con KPIs |
| Introduccion | `imagenes/pagos/pestanas_navegacion_pagos.png` | Pestañas de navegación del Módulo de Pagos |
| Liquidacion Total y Corte de Periodo | `imagenes/pagos/modal_liquidacion_total.png` | Liquidación Total: resumen y datos del pago a la izquierda, lista de clientes a la derecha |
| Liquidacion Total y Corte de Periodo | `imagenes/pagos/resumen_liquidacion_bloque.png` | Resumen financiero y confirmación de liquidación en bloque |
| Liquidacion Total y Corte de Periodo | `imagenes/pagos/alerta_seguro_cobranza_periodo.png` | Alerta de precaución de cobranza previa al facturar |
| Pago Rapido y Cobro Express | `imagenes/pagos/modal_pago_rapido.png` | Modal de Pago Rápido con selector de método y cálculo de cambio |
| Pago Rapido y Cobro Express | `imagenes/pagos/ticket_comprobante_pago_rapido.png` | Ticket de comprobante de pago express emitido |
| Registro de Pagos y Abonos Distribuidos | `imagenes/pagos/modal_pago_distribuido_fifo.png` | Ventana de Cobro Distribuido con el formulario a la izquierda y el reparto a la derecha |
| Registro de Pagos y Abonos Distribuidos | `imagenes/pagos/desglose_abonos_facturas.png` | Tabla de reparto del pago por factura |

### tarifas (7)

| Guía | Archivo esperado (`ayuda/…`) | Qué debe mostrar |
|---|---|---|
| Calculadora de Tarifas | `imagenes/tarifas/tarifas_calculadora_simulacion.png` | Simulador de Tarifas y Desglose |
| Calculadora de Tarifas | `imagenes/tarifas/tarifas_tabla_desglose_calculadora.png` | Tabla de Desglose por Tramo |
| Gestión de Tarifas | `imagenes/tarifas/tarifas_grid_cards.png` | Catálogo de Tarifas y Tarjetas |
| Gestión de Tarifas | `imagenes/tarifas/tarifas_modal_registro.png` | Modal de Registro de Nueva Tarifa |
| Gestión de Tarifas | `imagenes/tarifas/tarifas_card_detalle.png` | Detalle de Tarjeta de Tarifa |
| Introduccion | `imagenes/tarifas/tarifas_vista_principal.png` | Vista Principal de Gestión de Tarifas |
| Rangos de Consumo y Lógica de Cálculo | `imagenes/tarifas/tarifas_configuracion_rangos.png` | Tabla de Configuración de Rangos |
