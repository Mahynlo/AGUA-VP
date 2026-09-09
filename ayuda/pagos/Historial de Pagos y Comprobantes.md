---
titulo: "Historial de Pagos y Comprobantes"
seccion: "pagos"
orden: 7
descripcion: "Consulta de transacciones, folios de recibo, reimpresión de comprobantes y auditoría de cajero."
tags: ["historial", "pagos", "comprobantes", "folios", "cajero", "auditoría", "ticket"]
---

# 📜 Historial de Pagos y Comprobantes

La pestaña **Historial de Pagos** (`TabPagos`) es el libro diario digital donde quedan registradas de manera inmutable todas las transacciones de cobro procesadas en el municipio.

---

## 📋 Estructura del Historial

![Tabla maestra del Historial de Pagos con folios y filtros](../imagenes/pagos/tabla_historial_pagos.png)

* **Folio de Transacción (`#P-...`)**: Identificador numérico único de la operación de cobro.
* **Factura Vinculada**: Folio oficial del recibo cubierto.
* **Cliente y Predio**: Nombre del usuario y número de predio asociado.
* **Período Facturado**: Mes y año de servicio pagado (ej. `Septiembre 2026`).
* **Monto Pagado**: Cantidad exacta ingresada a caja ($ MXN).
* **Método de Pago**: Chip con la forma de cobro (*Efectivo*, *Transferencia*, *Tarjeta*).
* **Fecha y Hora**: Estampa de tiempo exacta de la transacción con zona horaria oficial.
* **Cajero Responsable**: Nombre del usuario del sistema que autorizó el cobro.

---

## 🔍 Ficha Técnica del Pago (`ModalDetallePago`)

Al presionar el botón de **Detalle (👁️)** en cualquier registro del historial, se despliega la ficha completa del ticket:

![Modal de Detalle de Pago y Comprobante de Caja](../imagenes/pagos/modal_detalle_pago.png)

1. **Datos del Comprobante**: Folio de recibo, fecha de timbrado y cajero.
2. **Desglose de Caja**: Cantidad entregada por el cliente y cambio devuelto.
3. **Factura Amortizada**: Detalle del período cubierto y consumo registrado.
4. **Botonera de Impresión**: Permite reimprimir el comprobante térmico de caja o exportarlo a PDF para aclaraciones ciudadanas.

---

## 📊 Exportación Institucional de Transacciones
Mediante el botón superior **Exportar**, el administrador puede descargar el arqueo de pagos en **Excel (.xlsx)** o **CSV (UTF-8)** para cotejo con la tesorería municipal.
