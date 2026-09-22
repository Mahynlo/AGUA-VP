---
titulo: "Modificar Datos y Ubicación del Medidor"
seccion: "medidores"
orden: 4
descripcion: "Edición de parámetros técnicos, corrección de series, actualización de coordenadas GPS, cambio de estados operativos y resguardo de trazabilidad."
tags: ["medidores", "editar", "modificar", "actualizar", "coordenadas", "lectura base"]
---

# ✏️ Modificar Datos y Ubicación del Medidor

La edición de un medidor permite corregir errores tipográficos en los datos de registro, actualizar referencias de ubicación domiciliaria, reajustar las coordenadas geográficas en el mapa satelital, cambiar el estado físico del equipo o modificar la asignación de cliente.

---

## 📋 Pasos para Modificar un Medidor

1. Ingrese al módulo de **Medidores**.
2. En la pestaña **Inventario General** o en el panel lateral de **Mapa y Ubicaciones**, localice el equipo deseado.
3. Presione el botón de edición **⚙️ (Engranaje)** en la fila o tarjeta correspondiente.
4. Se abrirá la ventana modal **"Editar Medidor"** (`ModalEditarMedidor`) precargada con la información actual.

![Ventana modal para editar parámetros del medidor](../imagenes/medidores/modal_editar_medidor.png)

---

## 📝 Campos Modificables y Criterios Técnicos

### 1. Datos Técnicos y de Identificación
* **Código de Localidad y Número de Serie**: Permite corregir el prefijo (`NG-`, `MP-`, `AD-`) o los dígitos de la serie en caso de haberse capturado con error respecto a la placa física del medidor.
* **Marca y Modelo**: Actualice o complemente las especificaciones de fábrica (ej. cambiar a *AquaTech AT-150*).
* **Fecha de Instalación**: Ajuste la fecha en el calendario si se registró una fecha distinta a la maniobra de campo.
* **Capacidad Máxima ($m^3$)**: Modifique el límite del odómetro mecánico si el equipo cuenta con una carátula especial de 4 o 6 dígitos (estándar: `99999`).

---

### 2. Ubicación Física y Coordenadas Satelitales
* **Comentarios de Ubicación**: Enriquecer las referencias visibles para el lecturista (ej. *"Se reubicó medidor hacia la barda perimetral norte junto al nicho de luz"*).
* **Selector de Coordenadas GPS**:
  * Si la posición en el mapa quedó desfasada, mueva el pin interactivo en el mapa para fijar las coordenadas exactas de latitud y longitud.
  * La actualización de coordenadas impacta de inmediato en la vista de cartografía satelital y en la guía GPS de los lecturistas.

---

### 3. Estado Operativo del Medidor
El selector de estado permite clasificar la condición funcional del equipo:

| Estado | Significado Operativo | Impacto en Facturación |
| :--- | :--- | :--- |
| **Activo** | Medidor en funcionamiento óptimo y regular. | Se incluye en rutas de lectura y factura consumo normal en $m^3$. |
| **Inactivo** | Medidor dado de baja temporal o en bodega. | No se factura por consumo medido. |
| **Mantenimiento** | Equipo retirado temporalmente para calibración o reparación. | Se puede registrar lectura estimada o cuota mínima. |
| **Cortado** | Servicio suspendido físicamente por corte de toma o adeudo. | Bloquea el suministro y suspende la toma ordinaria. |
| **Retirado** | Equipo desmantelado de la red de agua. | Debe liberarse del cliente y trasladarse a papelera o baja. |

---

### 4. Asignación o Desvinculación de Cliente
* Mediante el buscador reactivo `BuscarCliente`, puede cambiar el titular vinculado al medidor o presionar el botón **"Desvincular Cliente"** para dejar el equipo libre en inventario.

---

## ⚠️ Protocolo de Seguridad: Modificación de la Lectura Base

La **Lectura Base** define el punto cero histórico del medidor. Si el medidor ya cuenta con lecturas mensuales capturadas o facturas emitidas:

> [!CAUTION]
> **Alerta de Trazabilidad Histórica**: Si modifica el valor del campo **Lectura Base (m³)** en un medidor que ya tiene historial de facturación, el sistema desplegará una alerta obligatoria de confirmación:
> 
> *"Estás por modificar la lectura base del medidor. Si ya existen lecturas o facturas, esto puede afectar la trazabilidad histórica. ¿Deseas continuar?"*
> 
> Modifique este valor únicamente si se está corrigiendo un error flagrante en el registro inicial del equipo. Para reemplazos de medidores viejos por nuevos, utilice siempre el procedimiento de **Reemplazo de Medidor (Swap)** en lugar de sobreescribir la lectura base.

![Advertencia de seguridad al alterar la lectura base](../imagenes/medidores/alerta_modificar_lectura_base.png)

---

## 🛡️ Permisos Requeridos

* Para acceder a la modificación de equipos, el usuario del sistema debe contar con el permiso institucional **`medidores.modificar`**.
* Si el rol no dispone de este permiso, los botones de edición aparecerán inhabilitados.
