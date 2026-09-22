---
titulo: "Registrar un Nuevo Medidor"
seccion: "medidores"
orden: 2
descripcion: "Guía técnica para el alta de equipos en inventario, convención de números de serie, lectura base, capacidad máxima y geolocalización GPS."
tags: ["medidores", "registro", "nuevo medidor", "serie", "gps", "lectura base", "capacidad"]
---

# ➕ Registrar un Nuevo Medidor

El registro de un medidor en el sistema **AguaVP** da de alta el equipo físico en el inventario municipal, estableciendo su número de serie oficial, sus especificaciones técnicas de fábrica, su punto de partida de medición y su posición geográfica en el mapa.

---

## 📋 Pasos para Registrar un Medidor

1. Ingrese a la vista de **Medidores** desde el menú de navegación principal.
2. Seleccione la pestaña **Inventario General**.
3. En la esquina superior derecha, presione el botón oscuro **"+ Nuevo Medidor"**.
4. Se abrirá la ventana modal de registro estructurada en tres secciones técnicas.

![Formulario modal de registro de nuevo medidor](../imagenes/medidores/formulario_registro_medidor.png)

---

## 🛠️ Especificación Detallada de Campos

### 1. Datos del Equipo (Identificación y Parámetros)

| Campo | Tipo | Obligatorio | Descripción Técnica y Reglas |
| :--- | :---: | :---: | :--- |
| **Código de Ciudad (Prefijo)** | Selector | **Sí** | Clave municipal de la localidad donde opera el medidor: <br>• `NG-`: Nácori Grande <br>• `MP-`: Mátape <br>• `AD-`: Adivino |
| **Número de Serie (Secuencia)** | Texto / Dígitos | **Sí** | Correlativo único o identificador numérico troquelado en la carátula de fábrica (ej. `10429`). La combinación del prefijo y la secuencia conforma la **Serie Completa** (ej. `NG-10429`). |
| **Fecha de Instalación** | Fecha | **Sí** | Fecha en la que el medidor fue montado físicamente en la tubería o ingresado formalmente a servicio activo. |
| **Marca** | Texto | No | Fabricante del equipo (ej. *AquaTech*, *Actaris*, *Kent*, *Badger Meter*). |
| **Modelo** | Texto | No | Modelo comercial o especificación del fabricante (ej. *AT-150*, *Flostar M*, *M-25*). |
| **Lectura Base ($m^3$)** | Decimal | No (Default: `0`) | **Lectura inicial de arranque del odómetro.** <br>• Para medidores nuevos de fábrica: se deja en `0`. <br>• Para medidores reinstalados o reacondicionados con lectura previa: se registra el odómetro físico actual para no facturar consumos antiguos ficticios. |
| **Capacidad Máxima ($m^3$)** | Entero | **Sí** (Default: `99999`) | Límite mecánico de la carátula antes de dar la **vuelta a cero (rollover)**. En medidores residenciales estándar de 5 dígitos el valor es **99,999 $m^3$**. |
| **Comentarios de Ubicación** | Área de Texto | **Sí** | Referencia física detallada para el personal de campo (ej. *"Banqueta exterior lado poniente, junto a la toma principal y zaguán de herrería"*). |

---

### 2. Asignación de Cliente (Opcional en el Registro)

El formulario incorpora el componente de búsqueda en vivo `BuscarCliente` para asociar el medidor a un usuario de forma inmediata si la instalación ya tiene titular:

![Buscador y vinculación de cliente en tiempo de registro](../imagenes/medidores/registro_buscar_cliente.png)

* **Búsqueda Dinámica**: Escriba el nombre del usuario, número de predio, teléfono o dirección.
* **Selección con un Clic**: Al elegir al cliente, el sistema mostrará un banner verde de confirmación: `Cliente vinculado exitosamente (ID: #)`.
* **Alta sin Asignación (Bodega)**: Si el equipo permanecerá en stock o en resguardo, omita este paso. El medidor se registrará con el chip verde **"Disponible"**.

---

### 3. Ubicación Geográfica en Mapa (Selector GPS)

El sistema requiere geolocalizar con precisión la toma de agua para el mapa satelital y el ordenamiento de rutas:

![Selector de coordenadas GPS con mapa interactivo Leaflet](../imagenes/medidores/selector_coordenadas_mapa.png)

1. En el recuadro **Ubicación Geográfica**, observe el mapa interactivo basado en Leaflet.
2. Arrastre el marcador (pin azul) o haga clic directamente sobre el predio o banqueta exacta de la propiedad.
3. Los campos de **Latitud** y **Longitud** se actualizarán automáticamente con precisión a 6 decimales (ej. `29.118078, -109.966982`).

---

## 💾 Guardar y Validar el Registro

1. Verifique que no queden campos obligatorios vacíos.
2. Presione el botón **"Registrar Medidor"** en el pie de la ventana.
3. El sistema realizará las validaciones de unicidad de serie y consistencia numérica.
4. Tras recibir la confirmación de éxito, el formulario se cerrará y la tabla de inventario se actualizará en tiempo real.

---

## 🛡️ Reglas y Permisos

> [!IMPORTANT]
> **Lectura Base de Arranque**: Asegúrese de verificar la carátula física antes de guardar. La lectura base define el punto cero para el primer cálculo de facturación del cliente vinculado.

> [!TIP]
> **Precisión Satelital**: Utilice el zoom del mapa en el Selector de Coordenadas para colocar el pin en la posición exacta del cuadro de la toma. Esto facilitará la localización rápida a los lecturistas en campo durante su jornada mensual.
