# Módulo: Impresión y Reportes

## ¿Qué es?

El módulo de Impresión centraliza la generación de todos los documentos del sistema: recibos individuales de pago, comprobantes, y reportes generales del período. Los documentos se pueden previsualizar en pantalla antes de imprimir y también se pueden guardar como PDF.

---

## ¿Qué se puede hacer aquí?

### Recibos individuales

- **Seleccionar un cliente** y ver sus facturas del período
- **Previsualizar el recibo** antes de imprimir (se abre una vista en PDF dentro de la app)
- **Imprimir directamente** a la impresora configurada
- **Configurar el mensaje** que aparece en el pie del recibo (anuncios, avisos al usuario)
- **Configurar la equivalencia de consumo**: mostrar en el recibo cuántos litros equivale el consumo en m³

### Reportes generales

| Reporte | Contenido |
|---|---|
| **Reporte de lecturas** | Resumen de consumos del período por ruta |
| **Reporte de métricas de lecturas** | Estadísticas de consumo, promedios, anomalías |
| **Reporte de clientes** | Listado completo de clientes activos |
| **Reporte financiero** | Resumen de ingresos, pagos recibidos y deuda pendiente del período |
| **Reporte de deudores mayores** | Clientes con la mayor deuda acumulada |
| **Comprobante de pago** | Documento individual de un pago registrado |

### Configuración de impresión

- Seleccionar la impresora a usar
- Configurar el período del que se imprime
- Activar o desactivar elementos del recibo (logo, mensaje, equivalencias)

---

## Flujo de impresión de recibos

```
Seleccionar el período y la ruta (o cliente individual)
        ↓
Ver la lista de clientes con facturas en ese período
        ↓
Clic en "Previsualizar" → se genera el PDF y se muestra en pantalla
        ↓
Revisar que el contenido sea correcto
        ↓
Clic en "Imprimir" → se envía a la impresora
```

---

## Cómo funciona por dentro

Cuando se solicita una impresión, el sistema crea una ventana invisible, renderiza el recibo o reporte como si fuera una página web, lo convierte a PDF y luego lo muestra. Este proceso tarda unos segundos pero garantiza que lo que se ve en pantalla es exactamente lo que se imprime.

---

## Relación con otros módulos

- Los recibos usan datos de **Clientes**, **Facturas** y **Pagos**
- Los reportes de lecturas usan datos del módulo de **Lecturas y Rutas**
- Las tarifas configuradas afectan los montos que aparecen en los recibos
