---
titulo: "Asignar un Medidor a un Cliente"
seccion: "clientes"
orden: 3
descripcion: "Procedimiento para buscar, seleccionar y vincular un medidor de agua al contrato de un usuario."
tags: ["medidores", "asignar", "micromedición", "serie", "toma"]
---

# 🚰 Asignación de Medidores a Clientes

Para que un cliente pueda facturar con base en su consumo real de agua en metros cúbicos ($m^3$), debe tener un medidor físico vinculado a su cuenta.

---

## 📋 Pasos para Asignar un Medidor

1. Diríjase a la pestaña **Directorio de Clientes**.
2. Localice al usuario en la tabla y presione el botón de **Editar (✏️ Lápiz)** o **Gestionar Medidor**.
3. En el formulario de edición, deslícese hasta la sección **"Gestión de Medidor"** (`BuscarMedidor`).

![Panel de Gestión de Medidor y Buscador de Series](../imagenes/clientes/panel_buscar_medidor_cliente.png)

---

## 🔍 Uso del Buscador de Medidores

El panel interactivo de búsqueda permite localizar cualquier equipo del inventario municipal:

1. Escriba en el campo de búsqueda el **Número de Serie**, la **Marca** o la **Ubicación** del medidor.
2. Los resultados se filtrarán en tiempo real tras 300 ms de debounce.

![Chips de estado de disponibilidad: Libre, Actual y Ocupado](../imagenes/clientes/chips_estado_disponibilidad_medidor.png)

### 🏷️ Significado de los Chips de Disponibilidad:

| Chip | Color | Estado | ¿Se puede asignar? |
| :---: | :---: | :--- | :---: |
| **Libre** | 🟢 Verde | Medidor en bodega/inventario sin contrato activo | **Sí** (Disponible) |
| **Actual** | 🔵 Índigo | Medidor asignado actualmente a este mismo cliente | **Sí** (Ya vinculado) |
| **Ocupado** | 🔴 Rojo | Medidor instalado y activo en el contrato de otro usuario | **No** (Bloqueado) |

---

## 🖱️ Selección y Confirmación

1. Haga clic sobre el medidor disponible que tenga el chip verde **"Libre"**.
2. El medidor se agregará a la lista de **Medidores Seleccionados** en el panel derecho.
3. Presione el botón **"Actualizar Cliente"** para guardar la asignación en la base de datos.

![Confirmación de asignación exitosa de medidor en el expediente](../imagenes/clientes/confirmacion_asignacion_medidor.png)

4. El medidor cambiará su estado a ocupado y quedará visible en la ficha técnica del usuario.

> [!IMPORTANT]
> **Lectura Inicial de Arranque**: Al asignar un medidor nuevo o reacondicionado, verifique en el módulo de Medidores cuál es su lectura acumulada actual para evitar cobros erróneos en el primer mes de uso.
