---
titulo: "Liquidación Total y Corte de Período"
seccion: "pagos"
orden: 3
descripcion: "Mecanismo de liquidación masiva de deudores, cierre del período mensual y seguro de detección de cobranza previa."
tags: ["liquidación", "corte", "deudores", "cierre mensual", "seguro cobranza", "validación"]
---

# ⚡ Liquidación Total y Corte de Período

En los municipios de AguaVP, la gran mayoría de los usuarios acude a liquidar puntualmente su recibo durante los días de corte mensual. Para evitar procesar cientos de pagos individuales en ventanilla, el sistema incorpora el mecanismo de **Liquidación Total Masiva** (`ModalLiquidacionTotal`).

---

## 🚀 El Flujo Rápido de Liquidación Total

El principio operativo de la Liquidación Total invierte la captura para ahorrar horas de trabajo:

> **En lugar de registrar a todos los que pagaron, el cajero solo marca a los clientes que "SIGUEN DEBIENDO".**  
> El sistema da por liquidados automáticamente a todos los demás clientes del sector.

![Modal de Liquidación Total con lista rápida de deudores](../imagenes/pagos/modal_liquidacion_total.png)

---

## 📋 Pasos para Ejecutar la Liquidación Total

1. En la pestaña **Cobranza por Cliente**, presione el botón destacado **"Liquidación Total"**.
2. Seleccione la **Localidad / Sector** a liquidar (*Nácori Grande*, *Mátape* o *Adivino*).
3. En la lista desplegada, **marque con una casilla únicamente a los usuarios morosos que no acudieron a pagar**.
4. Presione el botón **"Revisar y Confirmar"** en la parte inferior.

![Resumen financiero y confirmación de liquidación en bloque](../imagenes/pagos/resumen_liquidacion_bloque.png)

5. Se desplegará el **Resumen Financiero**:
   * Total de cuentas en el sector.
   * Cuentas marcadas con deuda pendiente.
   * Cuentas a liquidar automáticamente en bloque.
   * Importe total recaudado ($ MXN) a ingresar a caja.
6. Presione **"Confirmar Liquidación"**. El sistema generará los folios de pago correspondientes y dejará las cuentas al corriente.

---

## 🛡️ El Seguro de Detección de Cobranza Previa (`validarCobranzaPeriodo`)

Este es uno de los **mecanismos de seguridad más importantes** de todo el sistema AguaVP:

![Alerta de precaución de cobranza previa al facturar](../imagenes/pagos/alerta_seguro_cobranza_periodo.png)

### ¿Por qué es fundamental realizar el corte antes de las nuevas lecturas?
1. Si un operador intenta capturar lecturas o generar facturas del nuevo mes sin haber liquidado los pagos del mes anterior, el sistema detecta que existe un alto porcentaje de facturas impagas.
2. El motor de validación dispara la **Alerta de Precaución de Cobranza**:
   > *"¡Se detectó un alto índice de facturas sin pagar del período anterior! Han quedado pendientes X de Y facturas (Z%). Si generas los recibos ahora, los usuarios acumularán el mes sin que se haya procesado su pago previo."*
3. **Consecuencia de omitir este paso**: Al generar la nueva facturación, el sistema sumaría los adeudos del mes anterior no liquidados en el nuevo recibo, provocando quejas ciudadanas por cobros dobles en ventanilla.

---

## ⚡ Regla de Oro Operativa

> [!CAUTION]
> **Secuencia Obligatoria**:  
> **1.** Cerrar caja y ejecutar **Liquidación Total** del mes anterior.  
> **2.** Iniciar captura de **Lecturas** del nuevo período.  
> **3.** **Generar Facturas** del nuevo mes.
