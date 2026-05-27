# Módulo: Pagos y Facturación

## ¿Qué es?

Este es el módulo financiero del sistema. Aquí se registran los pagos que hacen los clientes, se gestiona quiénes tienen deudas pendientes y se manejan situaciones especiales como convenios de pago o cortes del servicio.

---

## ¿Qué se puede hacer aquí?

### Pagos

- **Registrar un pago** de una o varias facturas pendientes de un cliente
- **Pago rápido**: cobrar el total adeudado de un cliente en pocos clics
- **Pago distribuido**: cuando un cliente paga un monto que no cubre todas sus facturas, el sistema distribuye el pago entre ellas
- **Ver el historial** de pagos con filtros por fecha, cliente o monto
- **Ver el detalle** de cada pago y sus facturas asociadas

### Facturas

- **Ver todas las facturas** generadas (pendientes, pagadas, parciales)
- **Ver el detalle** de una factura: consumo, período, monto calculado, estado de pago
- **Cobros por cliente**: ver el estado de cuenta completo de un cliente específico

### Deudores

- **Listado de deudores**: clientes con facturas vencidas y sin pagar
- **Montos adeudados** por cliente y por período

### Convenios de pago

Cuando un cliente tiene una deuda alta y no puede pagar de golpe, se puede crear un **convenio de pago**: un plan donde se paga la deuda en parcialidades acordadas.

- **Crear convenio** definiendo el monto, número de cuotas y fechas
- **Registrar pagos** de cada parcialidad
- **Ver el estado** del convenio (cuánto se ha pagado, cuánto queda)

### Cortes del servicio

Si un cliente acumula deuda sin pagar, el sistema permite:

- **Configurar las reglas de corte** (cuántas facturas vencidas generan un corte)
- **Ejecutar el corte** para suspender el servicio
- **Registrar la reconexión** cuando el cliente regulariza su situación

---

## Estados de una factura

| Estado | Significado |
|---|---|
| Pendiente | Generada pero sin pago |
| Pagada | Cubierta en su totalidad |
| Parcial | Con pago parcial registrado |
| En convenio | Incluida en un plan de pagos |

---

## Flujo de cobro

```
El cliente llega a pagar
        ↓
Buscar al cliente → el sistema muestra sus facturas pendientes
        ↓
Seleccionar el tipo de pago (total, parcial, distribuido, convenio)
        ↓
Registrar el pago → la factura se actualiza automáticamente
        ↓
Imprimir el comprobante de pago (desde módulo de Impresión)
```

---

## Relación con otros módulos

- Las facturas las genera el módulo de **Lecturas y Rutas** al procesar las lecturas del mes
- Los comprobantes de pago se imprimen desde el módulo de **Impresión**
- El reporte financiero general también se genera en **Impresión**
