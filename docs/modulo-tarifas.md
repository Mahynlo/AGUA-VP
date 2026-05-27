# Módulo: Tarifas

## ¿Qué es?

El módulo de Tarifas define cuánto se cobra a los clientes según su consumo. Las tarifas funcionan por **rangos**: el primer bloque de metros cúbicos tiene un precio, el siguiente bloque tiene otro precio distinto (generalmente más caro), y así sucesivamente. Esto permite aplicar tarifas escalonadas, donde quien más consume paga más por metro cúbico.

---

## ¿Qué se puede hacer aquí?

- **Crear tarifas** con nombre y descripción (por ejemplo: "Doméstico", "Comercial", "Industrial")
- **Definir rangos** de consumo y el precio por metro cúbico en cada rango
- **Editar** tarifas y rangos existentes
- **Asignar** tarifas a los clientes desde el módulo de Clientes

---

## Ejemplo de tarifa escalonada

| Rango (m³) | Precio por m³ |
|---|---|
| 0 – 10 | $5.00 |
| 11 – 20 | $8.00 |
| 21 – 50 | $12.00 |
| Más de 50 | $18.00 |

Si un cliente consume 25 m³:
- Primeros 10 m³ × $5.00 = $50.00
- Siguientes 10 m³ × $8.00 = $80.00
- Últimos 5 m³ × $12.00 = $60.00
- **Total: $190.00**

---

## Consideraciones

- Una tarifa puede asignarse a múltiples clientes
- Si se modifica una tarifa, el cambio aplica a partir del siguiente período de facturación
- Los rangos deben cubrir todos los posibles niveles de consumo sin huecos ni superposiciones

---

## Relación con otros módulos

- Las tarifas se **asignan a clientes** en el módulo de Clientes
- Al generar facturas desde el módulo de **Lecturas**, el sistema usa la tarifa del cliente para calcular el monto
