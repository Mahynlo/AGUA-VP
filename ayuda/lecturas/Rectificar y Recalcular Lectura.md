---
titulo: "Rectificación de Lecturas y Corrección de Consumos"
seccion: "lecturas"
orden: 5
descripcion: "Procedimiento para editar lecturas erróneas, activar el modo rectificación y corregir consumos antes y después de facturar."
tags: ["lecturas", "rectificar", "corregir", "consumo", "recalcular", "auditoría"]
---

# ✏️ Rectificación de Lecturas y Corrección de Consumos

Es común que durante la jornada de campo se presenten números invertidos por error de captura, tomas con carátulas empañadas o lecturas rectificadas tras una segunda visita de inspección. El sistema **AguaVP** provee herramientas para rectificar lecturas con total trazabilidad.

---

## 📋 Escenarios Comunes de Rectificación

1. **Error Tipográfico Inmediato**: El capturista escribió $1540 \ m^3$ en lugar de $1450 \ m^3$.
2. **Consumo Desproporcionado**: El usuario o la administración detectan una variación atípica y el fontanero realiza una segunda lectura de verificación.
3. **Sustitución de Medidor en Mitad de Ciclo**: Se ajusta la lectura de arranque de un equipo reemplazado.

---

## 🛠️ Procedimiento de Rectificación en el Carrusel

Si la ruta aún está en proceso de captura o no se ha emitido la facturación definitiva:

![Modo Rectificar lectura en el carrusel interactivo](../imagenes/lecturas/modo_rectificar_lectura.png)

1. Abra el **Carrusel de Lecturas** de la ruta.
2. Utilice el buscador **🔍** para saltar al medidor del cliente.
3. Si la lectura ya estaba registrada, verá la tarjeta verde de confirmación con el valor actual.
4. Presione el botón **"✏️ Rectificar Lectura"** (`setModoRectificar`).
5. La caja de entrada se habilitará nuevamente.
6. Escriba el valor numérico correcto y presione **"Guardar Rectificación"**.

![Ajuste y confirmación de la nueva lectura rectificada](../imagenes/lecturas/confirmacion_rectificacion.png)

7. El sistema recalculará instantáneamente el volumen de consumo en $m^3$ y actualizará el registro histórico.

---

## ⚠️ Rectificación Posterior a la Facturación

Si la ruta ya fue facturada y los recibos ya fueron generados:

> [!CAUTION]
> **Integridad Contable**: Modificar una lectura en una ruta ya facturada no altera mágicamente los recibos anteriores para evitar descuadres en el libro contable de caja.  
> Tras corregir la lectura, es **obligatorio ejecutar la función de Recalcular Facturación** desde la tarjeta de la ruta.

---

## 🛡️ Permisos Requeridos

* Para capturar lecturas estándar: permiso **`lecturas.tomar`**.
* Para modificar o rectificar lecturas previamente guardadas: permiso **`lecturas.modificar`**.
