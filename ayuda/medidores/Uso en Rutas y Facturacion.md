---
titulo: "Integración en Rutas de Lectura y Facturación"
seccion: "medidores"
orden: 6
descripcion: "Cómo interactúan los medidores con la toma de lecturas en campo, cálculo de consumo en m³, manejo de vueltas a cero y emisión de facturas."
tags: ["medidores", "rutas", "lecturas", "facturación", "consumo", "vuelta a cero", "rollover"]
---

# 📈 Integración en Rutas de Lectura y Facturación

El medidor es el sensor fundamental que alimenta todo el ciclo de ingresos de **AguaVP**. En este documento se explica cómo se integran los medidores en las rutas de campo, cómo calcula el sistema los consumos en metros cúbicos ($m^3$) y cómo se procesa la **vuelta a cero (rollover)** de los odómetros mecánicos.

---

## 🗺️ 1. Inclusión en Rutas de Lectura de Campo

Cada mes, el sistema compila la **Lista de Toma de Lecturas en Campo** para los lecturistas y operadores de brigada:

![Lista de campo con datos del medidor y lectura anterior](../imagenes/medidores/lecturas_ruta_medidor.png)

1. **Criterio de Agrupación**: El sistema agrupa a todos los clientes que tienen un medidor activo asignado según su localidad (`NG-`, `MP-`, `AD-`) y sector de ruta.
2. **Datos Visibles para el Lecturista**:
   * **Número de Serie**: Identificador troquelado del equipo a verificar en la banqueta.
   * **Ubicación y Referencias**: Comentarios descriptivos capturados durante el registro del medidor.
   * **Coordenadas Satelitales**: Enlace directo para abrir la posición en mapa móvil.
   * **Lectura Anterior (`LECT. ANT.`)**: Último valor registrado contra el cual se comparará la carátula actual.

---

## 🧮 2. Cálculo Matemático del Consumo en Metros Cúbicos ($m^3$)

Durante la captura mensual de lecturas, el motor de cálculo de AguaVP determina el volumen de agua consumido por el usuario mediante algoritmos de validación en tiempo real:

![Algoritmo de cálculo de consumo con detección de vuelta a cero](../imagenes/medidores/calculo_consumo_rollover.png)

### Caso A: Consumo Regular Estándar
Cuando la lectura del mes actual es mayor o igual a la lectura del mes anterior:

$$\text{Consumo } (m^3) = \text{Lectura Actual} - \text{Lectura Anterior}$$

* **Ejemplo**:
  * $\text{Lectura Anterior} = 1,420 \ m^3$
  * $\text{Lectura Actual} = 1,445 \ m^3$
  * $\text{Consumo} = 1,445 - 1,420 = \mathbf{25 \ m^3}$

---

### Caso B: Vuelta a Cero del Odómetro (Rollover Mecánico)
Los medidores cuentan con un límite físico en sus engranes mecánicos definido por el campo `capacidad_maxima` (generalmente **99,999 $m^3$** en 5 dígitos). Al rebasar dicho límite, el odómetro vuelve a comenzar en `00000`.

Si el operador captura una $\text{Lectura Actual} < \text{Lectura Anterior}$, el sistema detecta automáticamente la vuelta a cero y aplica la **Fórmula de Rollover**:

$$\text{Consumo } (m^3) = (\text{Capacidad Máxima} - \text{Lectura Anterior}) + \text{Lectura Actual} + 1$$

* **Ejemplo Práctico con Odómetro de 5 Dígitos**:
  * $\text{Capacidad Máxima} = 99,999 \ m^3$
  * $\text{Lectura Anterior (Mes previo)} = 99,980 \ m^3$
  * $\text{Lectura Actual (Mes en curso)} = 00,015 \ m^3$
  * **Cálculo Paso a Paso**:
    1. Consumo hasta el tope: $99,999 - 99,980 = 19 \ m^3$
    2. Paso de reinicio a cero: $+ 1 \ m^3$
    3. Consumo acumulado en el nuevo ciclo: $+ 15 \ m^3$
    4. **Consumo Total Real** = $19 + 1 + 15 = \mathbf{35 \ m^3}$

---

### Caso C: Alerta de Consumo Negativo por Error Tipográfico
Si la lectura actual es menor que la anterior y no corresponde a un rollover verosímil (por ejemplo, el mes pasado tenía $450 \ m^3$ y se captura por error $350 \ m^3$), el sistema emitirá una alerta visual para evitar la facturación de importes erróneos, solicitando al capturista revisar la fotografía de campo o rectificar el valor.

---

## 🧾 3. Emisión de Facturas y Desglose en Recibos

Una vez validadas las lecturas de los medidores, el sistema procede a generar la facturación mensual:

![Recibo de agua con desglose del consumo del medidor](../imagenes/medidores/factura_detalle_consumo_medidor.png)

1. **Aplicación de Tarifas Escalonadas**: El volumen en $m^3$ obtenido del medidor se multiplica por los rangos de la tarifa asignada al cliente (Consumo Básico, Intermedio, Excedente).
2. **Cuerpo del Recibo Oficial**:
   * En el recibo impreso y digital se imprimen con total transparencia los datos del medidor: **Número de Serie**, **Lectura Anterior**, **Lectura Actual**, **Metros Cúbicos Consumidos** y **Periodo de Medición**.
   * Se genera el historial gráfico comparativo de los últimos 6 meses para que el usuario conozca su comportamiento de consumo.

---

## ⚡ Resumen de Reglas de Oro

> [!IMPORTANT]
> **Orden de Operación Mensual**: Antes de registrar las nuevas lecturas de los medidores del mes, asegúrese de haber realizado la **Liquidación Total** de adeudos del periodo anterior para evitar descuadres en los saldos.

> [!TIP]
> **Verificación de Odómetros**: Si un cliente reporta un cobro desmedido, consulte en la ficha del medidor su historial de lecturas base y verifique si el equipo presentó una vuelta a cero en el periodo.
