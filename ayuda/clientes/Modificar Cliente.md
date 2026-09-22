---
titulo: "Modificar Datos y Esquema Tarifario"
seccion: "clientes"
orden: 6
descripcion: "Aprende cómo actualizar datos personales, corregir domicilios y gestionar cambios de tarifa en clientes existentes."
tags: ["modificar", "editar", "actualizar", "tarifa", "cambio de datos"]
---

# ✏️ Modificar Datos y Esquema Tarifario

La edición de clientes permite corregir erratas de captura, actualizar datos de contacto cuando el usuario cambia de número telefónico o ajustar su tarifa de consumo.

---

## 📝 Pasos para Modificar un Cliente

1. Diríjase a la pestaña **Directorio de Clientes**.
2. Ubique al cliente deseado utilizando la barra de búsqueda o los filtros de localidad.
3. Haga clic en el botón con el **icono de lápiz (✏️)** en la columna de acciones.
4. Se abrirá el modal de edición con los datos precargados del usuario.

![Modal de Edición con datos precargados del titular](../imagenes/clientes/modal_editar_cliente.png)

---

## 🏷️ Secciones Editables

### 1. Datos Personales y Predio
* **Número de Predio**: Modifique la clave predial si fue asignada incorrectamente. El sistema validará al instante que el nuevo número no esté ocupado por otro usuario.
* **Nombre Completo**: Corrija nombres o apellidos del titular.
* **Correo Electrónico**: Actualice la dirección para recibos digitales.
* **Teléfono**: Ingrese el nuevo teléfono de 10 dígitos.

### 2. Dirección y Residencia
* **Pueblo**: Cambie la localidad si hubo una reasignación territorial.
* **Dirección Completa**: Ajuste calles, números o referencias de la casa.

---

### 3. Gestión del Esquema Tarifario (`SeccionTarifa`)
Al editar a un cliente, el sistema despliega una tarjeta informativa en color verde esmeralda:

![Tarjeta informativa de Tarifa Actual y selector para cambio](../imagenes/clientes/tarjeta_tarifa_actual_cliente.png)

* **Tarjeta de Tarifa Actual**: Muestra el nombre y la descripción de la tarifa que el cliente tiene vigente en la base de datos (ej. *"Tarifa Doméstica · Consumo estándar residencial"*).
* **Selector de Nueva Tarifa**:
  * **Mantener actual**: Si no desea cambiar la tarifa, deje el selector tal como está.
  * **Cambiar tarifa**: Si el usuario cambió de giro (ej. de casa habitación a comercio), seleccione la nueva tarifa en el menú desplegable.

---

## 💾 Guardar Cambios

Presione el botón negro **"Actualizar Cliente"** al pie del modal. El sistema validará los datos y emitirá una confirmación en verde. La tabla se refrescará automáticamente con la información actualizada.
