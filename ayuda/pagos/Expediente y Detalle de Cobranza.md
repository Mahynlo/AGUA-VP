---
titulo: "Expediente Digital y Detalle de Cobranza"
seccion: "pagos"
orden: 4
descripcion: "Consulta del detalle de cobranza del cliente: resumen de deuda, facturas con filtros, datos del cliente e historial de pagos."
tags: ["expediente", "detalle", "historial", "facturas", "pagos", "recibos", "filtros"]
---

# 📁 Expediente Digital y Detalle de Cobranza

La ventana **Detalle de Cobranza** reúne en un solo lugar la situación financiera de un cliente: cuánto debe, qué facturas tiene y qué pagos ha hecho.

---

## 🔍 Cómo abrirlo

1. Vaya a **Pagos > Cobranza por Cliente**.
2. Localice al cliente y presione el botón **👁️ Ver Detalle** de su fila.

![Detalle de Cobranza del cliente con el resumen en el encabezado y las pestañas](../imagenes/pagos/modal_detalle_cobranza_cliente.png)

---

## 🖥️ Estructura de la ventana

### 1. Encabezado: quién es y cuánto debe
* **Nombre** del cliente, **número de predio** y su **estado** (Activo / Inactivo).
* Resumen a la derecha: **Facturas** emitidas, facturas **Pendientes** y **Deuda total**.

El encabezado siempre está visible, aunque cambie de pestaña.

### 2. Pestaña **Facturas**
Lista de todos los recibos del cliente:

| Columna | Qué indica |
|---|---|
| **Factura** | Folio de la factura. |
| **Periodo** | Mes y año facturado. |
| **Estado** | *Pagada*, *Pendiente*, *Vencida*, etc. |
| **Total a pagar** | Importe original del recibo. |
| **Saldo pendiente** | Lo que falta por pagar. |
| **Últ. pago** | Fecha del último pago aplicado. |

* **Filtros**: *Todos los años* y *Todos los períodos del año*; **Limpiar filtros** los quita.
* Al seleccionar una factura se abre **su detalle debajo de la fila**: medidor, tarifa, total, saldo, quién la generó y cuándo, y quién la cobró y cuándo. Ciérrelo con la **X** o seleccionando otra fila.

![Historial de facturas y pagos dentro del expediente](../imagenes/pagos/expediente_historial_facturas_pagos.png)

### 3. Pestaña **Datos del Cliente**
* **Identificación**: nombre completo, número de predio y estado del cliente.
* **Contacto y ubicación**: teléfono, correo electrónico y dirección completa.

### 4. Pestaña **Historial de Pagos**
* Franja de resumen: **Total de pagos**, **Monto total pagado** y **Último pago registrado**.
* Tabla con **Pago ID**, **Factura**, **Fecha**, **Método** y **Monto**, con los mismos filtros por año y periodo.
* Al seleccionar un pago se muestra su detalle: factura relacionada, fecha de registro, método de pago, monto entregado y comentarios.

> [!TIP]
> Las tablas usan todo el alto de la ventana y mantienen los títulos de columna fijos al desplazarse, así que en clientes con muchos meses no se pierde de vista qué es cada dato.

> [!NOTE]
> Esta ventana es **solo de consulta**: no modifica facturas ni pagos. Para cobrar use **Cobrar** en la fila del cliente (ver *Registro de Pagos y Abonos Distribuidos*).
