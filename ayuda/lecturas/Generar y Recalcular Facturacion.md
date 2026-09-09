---
titulo: "Generación y Recálculo de Facturación de Rutas"
seccion: "lecturas"
orden: 6
descripcion: "Procedimiento para emitir facturas masivas por ruta, aplicar recálculos con motivo de auditoría y reglas contables de pagos."
tags: ["lecturas", "facturación", "recalcular", "ruta", "emisión", "cobranza", "auditoría"]
---

# 💳 Generación y Recálculo de Facturación de Rutas

Una vez capturadas las lecturas de campo, el módulo de **Lecturas** permite transformar los consumos en $m^3$ en facturas y recibos oficiales mediante procesos masivos automatizados.

---

## 🟢 1. Proceso de Primera Facturación de una Ruta

Cuando todos los medidores de una ruta han sido leídos ($100\%$ de avance):

![Modal de confirmación para Generar Facturas de la ruta](../imagenes/lecturas/modal_generar_facturas_ruta.png)

### Pasos para Generar Facturas:
1. Localice la tarjeta de la ruta en la vista principal de **Lecturas**.
2. Presione el botón verde **"Generar Facturas"** (`handleGenerarFacturas`).
3. El sistema verificará automáticamente si existe una alta concentración de adeudos sin liquidar del mes anterior (`validarCobranzaPeriodo`).
4. Si todo es correcto, confirme la acción en la ventana modal.
5. El motor de facturación procesará cada medidor:
   * Obtiene el consumo: $\text{Consumo} = \text{Lectura Actual} - \text{Lectura Anterior}$.
   * Aplica la tarifa asignada al cliente (cuota base, bloques de consumo y excedentes).
   * Genera el registro de factura con estatus *Pendiente de Pago*.
6. La ruta pasará a mostrar el chip verde **"Facturada"**.

---

## 🟡 2. Proceso de Recálculo de Facturación (`handleRecalcularFacturas`)

Si después de haber generado las facturas de un período se rectificó la lectura de uno o más medidores, debe actualizarse el importe de los recibos mediante un **Recálculo**:

![Modal de Recalcular Facturación con motivo obligatorio](../imagenes/lecturas/modal_recalcular_facturacion.png)

### Pasos para Recalcular:
1. En la tarjeta de la ruta facturada, presione el botón ámbar **"Recalcular Facturación"**.
2. Se abrirá el modal de recálculo donde es **obligatorio ingresar el motivo del ajuste** (ej. *"Se corrigió lectura del predio #104 por carátula empañada verificada en segunda visita"*).
3. Presione **"Confirmar Recálculo"**.
4. El sistema ejecutará el ajuste y actualizará el estado de la ruta a **"Recalculada"**.

---

## 🔒 Regla Contable de Oro en el Recálculo

> [!IMPORTANT]
> **Protección de Facturas Pagadas**:  
> El motor de recálculo procesa **únicamente las facturas que NO tienen pagos registrados en caja**.  
> Si un usuario ya acudió a ventanilla y liquidó su recibo del mes, el sistema **conservará intacta su factura y su folio de pago** para proteger la concordancia del arqueo de caja y auditoría municipal.

---

## 📊 Visualizador de Resultados de Facturación

Al finalizar tanto una primera facturación como un recálculo, el sistema despliega automáticamente el **Visualizador de Resultados** (`modalResultadoOpen`):

![Visualizador de resultados de facturación y comparativa de totales](../imagenes/lecturas/visualizador_resultados_facturacion.png)

### Información Detallada en el Visualizador:
* **Resumen de Procesamiento**: Conteo de facturas *Generadas*, *Recalculadas* y *Fallidas*.
* **Tabla de Auditoría por Predio**:
  * Nombre del cliente y número de medidor.
  * Folio de factura asignado.
  * **Comparativa de Importes**: Si fue un recálculo, muestra el total anterior tachado y el total nuevo en negrita (ej. ~$185.00~ $\rightarrow$ **$142.50**).
  * Estado individual del renglón (*Generada*, *Recalculada* o *Fallida con mensaje de error técnico*).

---

## ⚡ Resumen de Buenas Prácticas

> [!TIP]
> **Revisión Inmediata**: Revise siempre el visualizador de resultados para confirmar que no haya quedado ninguna factura en estado *Fallida* debido a inconsistencias en las tarifas de los usuarios.
