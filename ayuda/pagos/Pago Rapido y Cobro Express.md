---
titulo: "Pago Rápido y Cobro Express en Ventanilla"
seccion: "pagos"
orden: 5
descripcion: "Procedimiento para cobrar recibos del período en un solo clic, emisión instantánea de comprobante y cálculo de cambio."
tags: ["pago rápido", "cobro express", "ventanilla", "recibo", "cajero"]
---

# ⚡ Pago Rápido y Cobro Express en Ventanilla

El **Pago Rápido** (`ModalPagoRapido`) es la herramienta predilecta para el cobro en caja durante los días de cobro ordinario, permitiendo liquidar la factura del mes en curso en menos de 5 segundos.

---

## 📋 Pasos para Realizar un Pago Rápido

1. Ingrese a **Pagos > Cobranza por Cliente**.
2. Localice al usuario en la tabla y presione el botón de rayo **"⚡ Pago Rápido"**.
3. Se abrirá la ventana modal precargada con el período activo y el monto exacto a cobrar:

![Modal de Pago Rápido con selector de método y cálculo de cambio](../imagenes/pagos/modal_pago_rapido.png)

---

## 💵 Configuración de la Transacción

1. **Confirmación del Período**: El sistema selecciona automáticamente el mes facturado corriente (ej. `2026-09`).
2. **Método de Pago**:
   * **Efectivo**: Habilita el calculador de cambio. Ingrese la **Cantidad Entregada** (ej. $200.00); el sistema mostrará inmediatamente el **Cambio a Devolver** (ej. $57.50).
   * **Transferencia Bancaria**: Permite ingresar la clave de rastreo o referencia bancaria.
   * **Tarjeta de Débito / Crédito**: Registra el número de autorización de la terminal.
3. **Comentarios Opcionales**: Espacio para registrar notas de caja o número de recibo manual si aplica.

---

## 🖨️ Confirmación y Emisión de Ticket

![Ticket de comprobante de pago express emitido](../imagenes/pagos/ticket_comprobante_pago_rapido.png)

1. Presione **"Confirmar Pago"**.
2. El sistema:
   * Cambia el estado de la factura a **Pagada**.
   * Reduce la deuda del cliente a $0.00.
   * Genera el folio inmutable de pago (`#P-...`).
   * Abre la vista previa del comprobante para su impresión térmica o formato PDF.
