# IMPLEMENTACION: Flujo de Lecturas, Facturacion y Movimientos de Medidor

## 1. Objetivo
Este documento resume los cambios implementados para mantener consistencia operativa y trazabilidad historica cuando existen:
- Captura de lecturas por periodo.
- Generacion de facturacion desde el modulo de lecturas.
- Reasignacion o reemplazo de medidores.
- Cambios de medidor durante o despues de un periodo ya facturado.

El objetivo principal es que la facturacion de un periodo use solo las lecturas efectivamente registradas para ese periodo y no se contamine con movimientos posteriores de medidor.

## 2. Regla de negocio consolidada
1. La facturacion se ejecuta por periodo y ruta.
2. Si un periodo ya tiene facturas generadas para una ruta, ese periodo se considera cerrado para altas nuevas de lecturas.
3. Los movimientos de medidor (liberar/asignar/reemplazar) no deben romper la consistencia de rutas ni crear pendientes artificiales en periodos ya facturados.
4. Toda reasignacion relevante debe quedar registrada en historial de cambios.

## 3. Cambios aplicados en frontend (AguaVP)

### 3.1 Modal de edicion de medidor
Archivo:
- src/renderer/src/components/vistas/medidores/ModalEditarMedidor.jsx

Cambios relevantes:
- Se corrigio el flujo para medidores no asignados, evitando referencia a variable incorrecta y pantalla en blanco.
- Se mantuvo el comportamiento de asignacion solo cuando el medidor esta libre.
- Se alinearon opciones de estado operativo del medidor con valores aceptados por backend:
  - Activo
  - Inactivo
  - Retirado
  - No instalado
- Se mantiene advertencia explicita cuando se modifica lectura_base por impacto potencial en trazabilidad.

### 3.2 Manejo de errores al actualizar rutas
Archivo:
- src/fetch/rutas.js

Cambios relevantes:
- actualizarRuta ahora retorna una estructura de error enriquecida cuando backend responde error:
  - success: false
  - status
  - message
  - details
- Esto evita mensajes genericos y permite mostrar la causa real al usuario operativo.

## 4. Flujo funcional esperado (operacion)

### 4.1 Captura normal de lecturas
1. Operador selecciona periodo y ruta.
2. Captura lecturas de medidores que corresponden a ese periodo.
3. Se valida no duplicar lectura por medidor+periodo.
4. Se calcula consumo y se guarda lectura.

### 4.2 Facturacion del periodo
1. Operador ejecuta boton de facturacion en Lecturas.
2. Se generan facturas sobre lecturas existentes del periodo.
3. Desde ese momento, la ruta/periodo queda cerrada para altas nuevas de lectura.

### 4.3 Movimiento de medidor durante/tras cierre
Caso comun: reemplazo 1 a 1.
1. Se libera medidor anterior y se asigna medidor nuevo al cliente.
2. El sistema migra automaticamente el punto de ruta del medidor viejo al nuevo cuando aplica reemplazo 1:1.
3. Si el medidor nuevo ya pertenece a otra ruta, la operacion se bloquea con error explicito.
4. El cambio queda auditado en historial.

Resultado esperado:
- No queda medidor viejo sin cliente ocupando punto de ruta.
- No aparece medidor nuevo como pendiente en periodo ya facturado.

## 5. Efecto operativo en periodos cerrados
- Un periodo con facturas en una ruta se trata como cerrado para captura nueva.
- El usuario puede consultar progreso/resumen del periodo.
- No se deben abrir nuevas lecturas para medidores agregados posteriormente a ese cierre.

## 6. Trazabilidad preservada
La trazabilidad se mantiene por estas medidas combinadas:
- Historial de cambios en actualizacion de cliente/medidor.
- Reasignacion atomica (sin estados intermedios incoherentes).
- Bloqueo de nuevas lecturas en ruta/periodo ya facturado.
- Separacion temporal entre lectura del periodo y movimientos posteriores de inventario de medidores.

## 7. Errores operativos esperados y su significado
- "Ya existe una lectura registrada para este medidor y periodo": evita duplicidad.
- "El periodo ya esta cerrado por facturacion...": evita altas nuevas post-cierre.
- "No se pudo migrar ruta automaticamente: el medidor nuevo ... ya pertenece a una ruta": evita doble pertenencia de medidor a rutas.

## 8. Checklist de validacion manual
1. Capturar lecturas en un periodo sin facturas: debe permitir altas.
2. Facturar el periodo.
3. Intentar alta de nueva lectura en misma ruta/periodo: debe rechazar con error de cierre.
4. Reemplazar medidor (liberar 1, asignar 1): punto de ruta debe migrar al nuevo.
5. Verificar que no se genere pendiente artificial por medidor agregado despues del cierre.
6. Verificar existencia de registro de historial para la reasignacion.

## 9. Referencia tecnica
Detalle tecnico de API en:
- ../api-AguaVP/docs/medidores/FLUJO_LECTURAS_FACTURACION_MOVIMIENTOS.md
