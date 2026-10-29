---
titulo: "Recálculo y Correcciones de Facturas"
seccion: "facturas"
orden: 4
descripcion: "Procedimiento de ajuste y recálculo de facturación, protección estricta de pagos aplicados y bitácora de auditoría."
tags: ["facturas", "recalcular", "ajuste", "auditoría", "rectificación", "pagos"]
---

# 🔄 Recálculo y Correcciones de Facturas

Cuando se detecta un error de captura en las lecturas de campo, se realiza un cambio de tarifa a mitad de período o se concede una bonificación oficial, es necesario recalcular la facturación sin alterar la contabilidad de los recibos ya cobrados.

---

## 📋 Cuándo Procede un Recálculo de Facturas

1. **Rectificación de Lecturas**: Tras corregir una lectura errónea en el módulo de Lecturas. Hágalo en ese mismo momento, antes de que el cliente pague.
2. **Ajuste Tarifario Retroactivo**: Modificación aprobada en los escalones de cobro municipal.
3. **Corrección de Lectura Base de Medidor**: Reajuste de odómetro de arranque por sustitución de equipo.

---

## 🛡️ La Regla Contable de Oro en el Recálculo

> [!IMPORTANT]
> **Inviolabilidad de Facturas con Pagos Aplicados**:  
> El motor de recálculo procesa **exclusivamente facturas en estado Pendiente o Vencida sin pagos registrados**.  
> Las facturas que ya cuentan con un folio de cobro en caja (`#P-...`), incluidos los abonos parciales, **se mantienen intactas** para no comprometer el arqueo diario ni la cuenta pública de la tesorería.

> [!IMPORTANT]
> **Meses Cerrados por Medidor**:  
> Tampoco se recalcula la factura de un medidor que **ya tiene la lectura del mes siguiente**. Para ese medidor, el mes quedó cerrado y su lectura tampoco se puede rectificar. El cierre es individual: los medidores que todavía no se leen en el mes siguiente conservan su mes abierto.

Las facturas protegidas por estas reglas aparecen en el visualizador como *Fallidas* con su motivo; quedan exactamente como estaban.

> [!NOTE]
> Una factura recalculada vuelve al estado **Pendiente**. Si su fecha de vencimiento ya pasó, el proceso diario la marca nuevamente como **Vencida**.

**¿Y si el error está en una factura ya cobrada o en un mes cerrado?** No se corrige recalculando el pasado: el ajuste se aplica en el mes en curso (por ejemplo, un descuento o un cargo en la siguiente factura), de modo que lo cobrado y los reportes anteriores sigan coincidiendo.

---

## 🛠️ Procedimiento de Recálculo Masivo por Ruta

El recálculo masivo se ejecuta desde la tarjeta de la ruta en el módulo de **Lecturas**:

![Modal de confirmación de recálculo con motivo de auditoría](../imagenes/facturas/modal_recalculo_facturas.png)

1. En la tarjeta de la ruta, presione el botón ámbar **"Recalcular Facturación"** (`handleRecalcularFacturas`).
2. En el formulario modal, ingrese obligatoriamente el **Motivo del Recálculo** (mínimo 10 caracteres) para el expediente de auditoría.
3. Presione **"Confirmar Recálculo"**.
4. El sistema reevaluará los consumos y actualizará los importes en la tabla de facturas.

---

## 📊 Visualizador de Resultados y Comparativa de Saldos

Al concluir el recálculo, se despliega el **Visualizador de Resultados** (`modalResultadoOpen`):

![Visualizador de facturas recalculadas vs anteriores](../imagenes/facturas/visualizador_facturas_recalculadas.png)

* **Resumen de la Operación**: Total de facturas recalculadas, generadas y fallidas.
* **Tabla Comparativa de Importes**: Muestra el monto anterior tachado junto al nuevo importe recalculado (ej. ~~\$280.00~~ &rarr; **\$195.00 MXN**).
* **Actualización en el Padrón**: El nuevo saldo se refleja de inmediato en el expediente de **Cobranza por Cliente**.
