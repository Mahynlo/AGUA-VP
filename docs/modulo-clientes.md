# Módulo: Clientes

## ¿Qué es?

El módulo de Clientes es el punto de entrada del sistema. Aquí se registra a cada persona o unidad que recibe el servicio de agua. Cada cliente queda vinculado a un medidor físico y a una tarifa, lo que permite que el sistema calcule sus consumos y genere sus facturas automáticamente.

---

## ¿Qué se puede hacer aquí?

- **Registrar** un nuevo cliente con su información personal (nombre, dirección, teléfono, etc.)
- **Asignar** un medidor físico al cliente en el momento del registro
- **Asignar** la tarifa que se le aplicará según su categoría (doméstico, comercial, etc.)
- **Editar** la información de un cliente existente
- **Ver el detalle** de un cliente: su historial de facturas, pagos, lecturas y estado de cuenta
- **Consultar métricas** generales: cuántos clientes activos hay, distribución por tarifa, etc.

---

## Flujo de registro

```
Llenar datos personales
        ↓
Buscar y seleccionar el medidor a asignar
        ↓
Seleccionar la tarifa correspondiente
        ↓
Confirmar → el cliente queda registrado y activo
```

---

## Estados de un cliente

| Estado | Significado |
|---|---|
| Activo | Recibe el servicio normalmente |
| Con corte | El servicio fue suspendido por deuda |
| Con convenio | Tiene un plan de pago pactado |

---

## Relación con otros módulos

- Un cliente **necesita** un medidor asignado para poder generar lecturas y facturas
- La **tarifa** determina cuánto paga según su consumo del mes
- Desde el detalle del cliente se puede acceder directamente a sus **pagos** y **facturas**
