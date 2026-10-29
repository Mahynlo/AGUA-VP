---
titulo: "Rectificación de Lecturas y Corrección de Consumos"
seccion: "lecturas"
orden: 5
descripcion: "Cuándo se puede rectificar una lectura, procedimiento para corregirla y cómo recalcular su factura antes de que se cobre."
tags: ["lecturas", "rectificar", "corregir", "consumo", "recalcular", "auditoría", "período cerrado", "pagos"]
---

# ✏️ Rectificación de Lecturas y Corrección de Consumos

Es común que durante la jornada de campo se presenten números invertidos por error de captura, tomas con carátulas empañadas o lecturas rectificadas tras una segunda visita de inspección. El sistema **AguaVP** provee herramientas para rectificar lecturas con total trazabilidad.

---

## 📋 Escenarios Comunes de Rectificación

1. **Error Tipográfico Inmediato**: El capturista escribió $1540 \ m^3$ en lugar de $1450 \ m^3$.
2. **Consumo Desproporcionado**: El usuario o la administración detectan una variación atípica y se realiza una segunda lectura de verificación.
3. **Sustitución de Medidor en Mitad de Ciclo**: Se ajusta la lectura de arranque de un equipo reemplazado.

---

## 🔐 ¿Cuándo se Puede Rectificar una Lectura?

Una lectura se puede rectificar solo si cumple **las dos** condiciones:

1. **Es la lectura más reciente del medidor.** En cuanto el medidor tiene la lectura del mes siguiente, la del mes anterior queda **cerrada**.
2. **Su factura no tiene pagos.** Ni pago completo ni abonos parciales, y no está incluida en un convenio de pago.

| Situación | ¿Se puede rectificar? |
|---|---|
| Lectura del mes en curso, todavía sin facturar | ✅ Sí |
| Lectura ya facturada, sin pagos, y el medidor no tiene lectura del mes siguiente | ✅ Sí (después hay que recalcular, ver abajo) |
| La factura ya tiene un pago o un abono | ❌ No |
| La factura está en un convenio de pago | ❌ No |
| El medidor ya tiene la lectura del mes siguiente | ❌ No: el mes quedó cerrado |

> [!NOTE]
> **El cierre es por medidor, no por mes completo.** Ejemplo: febrero queda cerrado para un medidor en cuanto **ese** medidor tiene su lectura de marzo. Si a mitad de la ruta de marzo otro medidor todavía no se ha leído, su febrero sigue abierto (siempre que su factura no tenga pagos).

**¿Por qué existe esta regla?**
* **Lo cobrado no se altera:** si se cambiara la lectura de una factura ya pagada, el recibo y el reporte dirían un consumo distinto al que se cobró.
* **La continuidad del medidor se conserva:** la lectura anterior de cada mes es la lectura actual del mes previo. Cambiar un mes que ya tiene otro encima rompería esa cadena.

Cuando una lectura no se puede rectificar, el botón **"Editar / Rectificar Lectura"** aparece deshabilitado y arriba de él se muestra el motivo, por ejemplo:

* *"La factura de esta lectura ya tiene pagos registrados ($113.00); no se puede rectificar."*
* *"El período 2026-08 quedó cerrado para este medidor: ya tiene la lectura de 2026-09. Solo se puede rectificar la lectura más reciente."*

La regla también la aplica el servidor: aunque se intentara rectificar por otra vía, el cambio se rechaza con el mismo mensaje.

---

## 🛠️ Procedimiento de Rectificación en el Carrusel

Si la lectura cumple las condiciones anteriores:

![Modo Rectificar lectura en el carrusel interactivo](../imagenes/lecturas/rectificacion/modo_rectificar_lectura.avif)

1. Abra el **Carrusel de Lecturas** de la ruta.
2. Utilice el buscador **🔍** para saltar al medidor del cliente.
3. Si la lectura ya estaba registrada, verá la tarjeta verde de confirmación con el valor actual.
4. Presione el botón **"✏️ Editar / Rectificar Lectura"**. Si está deshabilitado, lea el motivo que aparece arriba de él.
5. La caja de entrada se habilitará nuevamente.
6. Escriba el valor numérico correcto y presione **"Guardar Rectificación"**.

![Ajuste y confirmación de la nueva lectura rectificada](../imagenes/lecturas/rectificacion/confirmacion_rectificacion.avif)

7. El sistema recalculará instantáneamente el volumen de consumo en $m^3$ y actualizará el registro histórico.

---

## ⚠️ Rectificación Posterior a la Facturación

Si la ruta ya fue facturada y los recibos ya fueron generados:

> [!CAUTION]
> **Integridad Contable**: Modificar una lectura en una ruta ya facturada no altera mágicamente los recibos anteriores para evitar descuadres en el libro contable de caja.  
> Tras corregir la lectura, es **obligatorio ejecutar la función de Recalcular Facturación** desde la tarjeta de la ruta.

> [!WARNING]
> **Recalcule en ese mismo momento, antes de que el cliente pague.** Rectificar y recalcular son dos pasos separados: mientras no se recalcule, la factura conserva el importe anterior. Si el cliente paga antes del recálculo, se le cobra el importe viejo y, como la factura ya tiene un pago, **ya no se podrá recalcular ni rectificar**.

**Si el error se descubre cuando la lectura ya está cerrada** (la factura ya se cobró o el medidor ya tiene la lectura del mes siguiente), no se corrige editando el pasado: el ajuste se aplica en el mes en curso, por ejemplo con un descuento o un cargo en la siguiente factura, para que el historial cobrado se mantenga intacto.

---

## 🛡️ Permisos Requeridos

* Para capturar lecturas estándar: permiso **`lecturas.tomar`**.
* Para modificar o rectificar lecturas previamente guardadas: permiso **`lecturas.modificar`**.
