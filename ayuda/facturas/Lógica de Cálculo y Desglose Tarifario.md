---
titulo: "Lógica de Cálculo y Desglose Tarifario"
seccion: "facturas"
orden: 3
tipo: "funcionamiento"
descripcion: "Fórmula matemática y modelo de descomposición en rangos de consumo excedente."
tags: ["facturas", "cálculo", "fórmula", "tarifas", "matemática", "excedentes"]
---

# Lógica de Cálculo y Desglose Tarifario

Este documento detalla el modelo matemático implementado en el motor de facturación de **AguaVP** para calcular el importe a cobrar por consumo de agua.

---

## 📐 Modelo Matemático de Facturación

El costo total de una factura $C_{\text{total}}$ se compone de:

$$C_{\text{total}} = C_{\text{base}} + \sum_{i=1}^{n} (V_i \times P_i) + R_{\text{mora}} + A_{\text{adicionales}}$$

Donde:
- $C_{\text{base}}$: Cuota fija mensual que incluye un volumen base $V_{\text{base}}$ (ej. $10\text{ m}^3$).
- $V_{\text{consumo}}$: Volumen total medido en el periodo $(\text{Lectura Actual} - \text{Lectura Anterior})$.
- $V_{\text{excedente}}$: $\max(0, V_{\text{consumo}} - V_{\text{base}})$.
- $V_i$: Volumen de agua que cae dentro del rango $i$.
- $P_i$: Precio por metro cúbico asignado al rango $i$.
- $R_{\text{mora}}$: Recargos por pago extemporáneo si la factura está vencida.
- $A_{\text{adicionales}}$: Cuotas de alcantarillado, saneamiento o convenios especiales.

---

## 📊 Ejemplo de Descomposición por Bloques

Supongamos una tarifa con las siguientes reglas:
- **Cuota Base**: \$120.00 (incluye hasta $10\text{ m}^3$).
- **Rango 1 (11 a 20 $m^3$)**: \$8.00 por $m^3$.
- **Rango 2 (21 a 35 $m^3$)**: \$12.00 por $m^3$.

Si un suscriptor consume **$25\text{ m}^3$**:
1. **Base (0 a 10 $m^3$)**: \$120.00
2. **Rango 1 (10 $m^3$ excedentes)**: $10 \times \$8.00 = \$80.00$
3. **Rango 2 (5 $m^3$ excedentes)**: $5 \times \$12.00 = \$60.00$
4. **Total Facturado**: $\$120.00 + \$80.00 + \$60.00 = \$260.00$

> [!NOTE]
> Este esquema de tarifa escalonada promueve el cuidado y ahorro del recurso hídrico, penalizando consumos elevados.
