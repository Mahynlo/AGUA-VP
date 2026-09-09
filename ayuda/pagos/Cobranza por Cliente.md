---
titulo: "Cobranza por Cliente y Ranking de Deuda"
seccion: "pagos"
orden: 2
descripcion: "Mesa de trabajo principal de cobranza, ranking de deudores, búsqueda reactiva, filtros por sector y exportación institucional."
tags: ["cobranza", "clientes", "deuda", "ranking", "filtros", "exportación"]
---

# 👥 Cobranza por Cliente y Ranking de Deuda

La pestaña **Cobranza por Cliente** (`TabCobranzaCliente`) es el centro neurálgico para la atención en ventanilla, consulta de saldos consolidados y auditoría del padrón de usuarios.

---

## 📋 Estructura de la Mesa de Trabajo

![Tabla maestra de Cobranza por Cliente con ranking de deuda](../imagenes/pagos/tabla_cobranza_cliente.png)

### 1. Barra Superior de Búsqueda y Filtros
* **Buscador Reactivo con Debounce (400 ms)**: Permite localizar al cliente al instante escribiendo su nombre, número de predio, teléfono, correo o dirección.
* **Filtro por Localidad / Ciudad**: Conmuta la vista entre clientes de *Nácori Grande*, *Mátape*, *Adivino* o *Todas*.
* **Selector de Ranking de Deuda**:
  * **Mayor deudor primero**: Prioriza las cuentas con saldos vencidos más elevados para gestión de cobranza.
  * **Menor deudor primero**: Orden ascendente de saldo.
  * **Por número de predio**: Orden natural por calle y manzana catastral.

![Opciones de ordenamiento y filtros en Cobranza por Cliente](../imagenes/pagos/filtros_ranking_cobranza.png)

---

### 2. Tabla Maestra de Cobranza
Cada fila presenta una radiografía financiera del usuario:
* **Predio y Cliente**: Avatar identificador, número de predio formal y nombre del titular.
* **Contacto y Ubicación**: Teléfono a 10 dígitos, correo electrónico y dirección domiciliaria.
* **Deuda Total Acumulada**: Monto consolidado en negritas ($ MXN) que suma todas las facturas impagas del cliente.
* **Balance de Recibos**: Conteo de facturas *Pagadas* vs. *Pendientes* y *Vencidas*.
* **Estado del Contrato**: Chip de estado del cliente (*Activo*, *Inactivo*).

---

### 3. Botonera de Acciones por Cliente
* **👁️ Expediente Digital (`setDetalleOpen`)**: Abre el expediente completo del usuario con su historial histórico de facturas y pagos.
* **💳 Cobro por Cliente (`setModalOpen`)**: Abre la pasarela de **Pago Distribuido** para abonar a múltiples facturas según el principio FIFO.
* **⚡ Pago Rápido (`setModalPagoRapidoOpen`)**: Abre el cobro express en 1 clic para la factura del período corriente.

---

### 4. Herramientas de Reportes y Exportación
* **Imprimir Deudores (`ImprimirDeudoresDropdown`)**: Genera el reporte oficial en PDF de la lista de deudores con tres opciones de ordenamiento (*Mayor deudor*, *Menor deudor*, *Por predio*).
* **Exportar Datos**: Descarga la tabla de cobranza en **Excel (.xlsx)** o **CSV (UTF-8)** con alcance por página, filtrados o padrón completo.
