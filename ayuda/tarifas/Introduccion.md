---
titulo: "Introducción a Tarifas"
seccion: "tarifas"
orden: 1
descripcion: "Cálculo de tarifas de agua - Introducción a las fórmulas"
tags: ["tarifas", "cálculo", "fórmulas", "costos"]
---

# 📊 Cálculo de la tarifa de agua

La tarifa doméstica se cobra de la siguiente manera:

- **Primer rango (0–10 m³):** Se cobra un cargo fijo de **$108.98**.
- **Rangos posteriores (11 m³ en adelante):** Se cobra de forma escalonada, es decir,
  los m³ que excedan los primeros 10 se cobran según la tarifa correspondiente al
  rango en el que caen.

---

## Fórmula general

Sea $C$ el consumo total de agua (en m³):

$$\text{Costo}(C) = \text{Base} + \sum_{i=1}^{n} \text{(m³ en el rango i)} \times \text{Tarifa del rango i}$$

Donde:
- **Base = $108.98** (corresponde a los primeros 10 m³).
- $\text{m³ en el rango i}$ es la cantidad consumida dentro de cada rango.
- $\text{Tarifa del rango i}$ es el costo por m³ del rango correspondiente.

---

## Fórmula detallada por tramos

Sea \(C\) el consumo en m³ y definamos:
- \(\text{Base} = 108.98\) (cargo fijo para 0–10 m³)
- \(t_2 = 10.84\) (tarifa para 11–15)
- \(t_3 = 14.04\) (tarifa para 16–20)
- \(t_4 = \) tarifa del rango 21–25 (reemplaza por el valor correcto)
- \(\dots\)

$$
\mathrm{Costo}(C)=
\begin{cases}
\text{Base}, & 0 \le C \le 10, \\[6pt]
\text{Base} + (C-10)\cdot t_2, & 10 < C \le 15, \\[6pt]
\text{Base} + 5\cdot t_2 + (C-15)\cdot t_3, & 15 < C \le 20, \\[6pt]
\text{Base} + 5\cdot t_2 + 5\cdot t_3 + (C-20)\cdot t_4, & 20 < C \le 25, \\[6pt]
\vdots & \\
\end{cases}
$$

**Notas:**
- Cada bloque completo contribuye con `(ancho_del_bloque) × tarifa_del_bloque` al acumulado.  
- Solo el *excedente* dentro del bloque actual se multiplica por la tarifa de ese bloque.  
- Redondea el resultado final a 2 decimales.

---
Para cualquier consumo $C$ (en m³), el costo se calcula de la siguiente forma:

**Rango 1 (0-10 m³):**
$$\text{Costo}(C) = 108.98$$

**Rango 2 (11-15 m³):**
$$\text{Costo}(C) = 108.98 + (C-10) \times 10.84$$

**Rango 3 (16-20 m³):**
$$\text{Costo}(C) = 108.98 + 5 \times 10.84 + (C-15) \times 14.04$$

**Rango 4 (21-25 m³):**
$$\text{Costo}(C) = 108.98 + 5 \times 10.84 + 5 \times 14.04 + (C-20) \times 14.04$$

**Rangos superiores (26+ m³):**
Se sigue el mismo patrón agregando $14.04$ por cada m³ adicional.

---

## 💡 Ejemplo con 12 m³

### Paso 1: Cargo base
Primeros 10 m³ → **$108.98** (cargo fijo)  

### Paso 2: Consumo adicional
Los 2 m³ restantes (11 y 12) caen en el segundo rango:
$2 \times 10.84 = 21.68$

### Paso 3: Cálculo final
$$\text{Costo}(12) = 108.98 + 21.68 = 130.66$$

✅ **Resultado: $130.66**

---

## 📊 Tabla de Rangos y Tarifas

| Rango | Consumo (m³) | Tarifa por m³ | Descripción |
|-------|-------------|---------------|-------------|
| 1     | 0 - 10      | $108.98 (fijo)| Cargo base |
| 2     | 11 - 15     | $10.84        | Primer escalón |
| 3     | 16 - 20     | $14.04        | Segundo escalón |
| 4     | 21 - 25     | $14.04        | Tercer escalón |
| 5+    | 26+         | $14.04        | Escalones superiores |

---

## 🧮 Ejemplos Adicionales

### Consumo de 8 m³
$$\text{Costo}(8) = 108.98$$
**Total: $108.98**

### Consumo de 18 m³
$$\text{Costo}(18) = 108.98 + (5 \times 10.84) + (3 \times 14.04) = 108.98 + 54.20 + 42.12 = 205.30$$
**Total: $205.30**

### Consumo de 25 m³
$$\text{Costo}(25) = 108.98 + (5 \times 10.84) + (5 \times 14.04) + (5 \times 14.04) = 108.98 + 54.20 + 70.20 + 70.20 = 303.58$$
**Total: $303.58**
