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

1. **Rectificación de Lecturas**: Tras corregir una lectura errónea en el módulo de Lecturas.
2. **Ajuste Tarifario Retroactivo**: Modificación aprobada en los escalones de cobro municipal.
3. **Corrección de Lectura Base de Medidor**: Reajuste de odómetro de arranque por sustitución de equipo.

---

## 🛡️ La Regla Contable de Oro en el Recálculo

> [!IMPORTANT]
> **Inviolabilidad de Facturas con Pagos Aplicados**:  
> El motor de recálculo procesa **exclusivamente facturas en estado Pendiente o Vencida sin pagos registrados**.  
> Las facturas que ya cuentan con un folio de cobro en caja (`#P-...`) **se mantienen intactas** para no comprometer el arqueo diario ni la cuenta pública de la tesorería.

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
* **Tabla Comparativa de Importes**: Muestra el monto anterior tachado junto al nuevo importe recalculado (ej. ~$280.00~ $\rightarrow$ **$195.00 MXN**).
* **Actualización en el Padrón**: El nuevo saldo se refleja de inmediato en el expediente de **Cobranza por Cliente**.
