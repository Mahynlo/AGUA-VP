# Módulo: Lecturas y Rutas

## ¿Qué es?

Este módulo cubre el proceso de toma de lecturas de consumo. Una **ruta** es una agrupación de medidores que se recorre en campo para anotar el consumo del período. Una vez capturadas las lecturas, el sistema calcula automáticamente cuántos metros cúbicos consumió cada usuario y genera las facturas correspondientes.

---

## ¿Qué es una ruta?

Una ruta es una lista ordenada de medidores que pertenecen a una misma zona o recorrido. Por ejemplo: "Ruta Centro", "Ruta Barrio Norte". Organizar los medidores en rutas facilita que el lector de campo sepa qué medidores visitar y en qué orden.

---

## ¿Qué se puede hacer aquí?

- **Crear rutas** agrupando medidores por zona o criterio geográfico
- **Ver y editar** las rutas existentes (agregar o quitar medidores)
- **Registrar lecturas** para cada medidor de una ruta (lectura actual del mes)
- **Modificar lecturas** si se cometió un error de captura
- **Generar facturas** de toda una ruta con un solo clic, una vez capturadas todas las lecturas
- **Ver métricas** de consumo: promedios, comparativos entre períodos, anomalías

---

## Flujo mensual de lecturas

```
1. El lector visita cada medidor de la ruta en campo
        ↓
2. En el sistema: registrar la lectura actual de cada medidor
        ↓
3. El sistema calcula: consumo = lectura actual − lectura anterior
        ↓
4. Se aplica la tarifa correspondiente para obtener el monto a cobrar
        ↓
5. Generar facturas de la ruta → quedan disponibles para cobro
```

---

## Cálculo del consumo

El sistema toma la lectura anterior (registrada el mes pasado) y la resta a la lectura actual. El resultado en metros cúbicos se compara contra los rangos de la tarifa asignada al cliente para determinar cuánto cobra cada tramo.

---

## Relación con otros módulos

- Las rutas agrupan **medidores** del inventario
- Al generar facturas de una ruta, se crean registros en el módulo de **Pagos**
- Las **tarifas** determinan el cálculo del monto de cada factura
- Los reportes de lecturas pueden imprimirse desde el módulo de **Impresión**
