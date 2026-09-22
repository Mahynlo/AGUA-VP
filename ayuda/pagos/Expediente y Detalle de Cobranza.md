---
titulo: "Expediente Digital y Detalle de Cobranza"
seccion: "pagos"
orden: 4
descripcion: "Consulta del expediente de cobranza del cliente, historial de facturas emitidas, desglose de pagos y folios de recibo."
tags: ["expediente", "detalle", "historial", "facturas", "pagos", "recibos"]
---

# 📁 Expediente Digital y Detalle de Cobranza

El **Expediente Digital de Cobranza** (`ModalDetalleCobranzaCliente`) concentra todo el historial financiero y operativo de un contrato de agua en una sola interfaz interactiva.

---

## 🔍 Cómo Abrir el Expediente del Cliente

1. Diríjase a **Pagos > Cobranza por Cliente**.
2. Localice al usuario en la tabla y presione el botón **👁️ (Ojo)**.
3. Se abrirá la ventana modal con el expediente digital del titular:

![Expediente Digital de Cobranza del Cliente con pestañas Facturas y Pagos](../imagenes/pagos/modal_detalle_cobranza_cliente.png)

---

## 🖥️ Estructura del Expediente

### 1. Cabecera de Identidad y Deuda
* **Identidad**: Avatar, nombre completo del titular, ID de cliente y badge del Número de Predio.
* **Contacto**: Teléfono a 10 dígitos y correo electrónico registrado.
* **Tarifa Activa**: Esquema tarifario asignado al contrato (ej. *Tarifa Doméstica Nácori*).
* **Tarjeta de Deuda Total**: Indicador visual en color rojo o esmeralda que muestra el saldo global pendiente ($ MXN).

---

### 2. Pestaña: Historial de Facturas Emitidas
Presenta la relación cronológica de todos los recibos generados para la cuenta:

![Historial de facturas y pagos dentro del expediente](../imagenes/pagos/expediente_historial_facturas_pagos.png)

* **Período Facturado**: Mes y año de servicio (ej. `Septiembre 2026`).
* **Consumo Medido**: Metros cúbicos ($m^3$) registrados en el odómetro.
* **Monto Total vs. Saldo Pendiente**: Importe original vs. remanente por pagar.
* **Estado de Factura**: Chip distintivo (*Pagada*, *Pendiente*, *Vencida*).
* **Detalle de Factura**: Al presionar sobre cualquier renglón, se abre `ModalDetalleFactura` con el desglose exacto de la cuota base y los bloques de consumo.

---

### 3. Pestaña: Historial de Pagos y Transacciones
Muestra todas las operaciones de cobro asentadas en caja a nombre del cliente:
* **Folio de Pago**: Identificador único (`#P-...`).
* **Fecha y Hora**: Estampa de tiempo exacta de la transacción.
* **Monto Pagado**: Cantidad en dinero aplicada a la cuenta.
* **Método de Pago**: *Efectivo*, *Transferencia*, *Tarjeta*.
* **Cajero / Operador**: Usuario que registró la operación en el sistema.
* **Comprobante**: Botón para consultar la ficha técnica del ticket (`ModalDetallePago`) y reimprimir el recibo.
