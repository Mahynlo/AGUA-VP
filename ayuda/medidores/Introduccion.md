---
titulo: "Introducción al Módulo de Medidores"
seccion: "medidores"
orden: 1
descripcion: "Visión general del parque de medidores, inventario técnico, geolocalización GIS, métricas y ciclo de vida de micromedición."
tags: ["medidores", "inventario", "mapa", "gis", "micromedición", "kpis", "resumen"]
---

# 🚰 Introducción al Módulo de Medidores

El módulo de **Medidores** es la plataforma central de control de hardware y micromedición del sistema **AguaVP**. Su objetivo principal es registrar, monitorear, geolocalizar y administrar todo el parque de medidores de agua potable instalados y en bodega para las localidades de **Nácori Grande (`NG-`)**, **Mátape (`MP-`)** y **Adivino (`AD-`)**.

A través de este módulo se garantiza la trazabilidad física de cada equipo, el control estricto de consumos en metros cúbicos ($m^3$), la reducción de pérdidas comerciales de agua y la asignación transparente de consumos a los contratos de los usuarios.

---

## 🗺️ Ciclo de Vida Operativo del Medidor

```mermaid
flowchart LR
    A[1. Registro en Bodega/Inventario] --> B[2. Asignación a Contrato de Cliente]
    B --> C[3. Integración en Rutas de Lectura]
    C --> D[4. Toma Mensual de Lecturas]
    D --> E[5. Facturación por Consumo Real en m³]
    E -.-> F[Mantenimiento, Reemplazo o Baja]
```

---

## 🧭 Estructura y Navegación del Módulo

El módulo de Medidores está organizado en **dos vistas especializadas** accesibles mediante las pestañas superiores de la pantalla principal:

### 1. Pestaña de Mapa y Ubicaciones (`TabMapaMedidores`)
Es un entorno **GIS interactivo** que combina un mapa satelital/vectorial con un panel lateral reactivo:

![Mapa interactivo de geolocalización de medidores con panel lateral](../imagenes/medidores/mapa_medidores_interactivo.png)

* **Visor Cartográfico Satelital y Vectorial**: Permite explorar geográficamente la totalidad de las tomas y medidores instalados en las tres localidades con marcadores inteligentes geolocalizados.
* **Filtros Inmediatos de Cartografía**:
  * **Por Localidad**: Conmuta la vista entre *Nácori Grande*, *Mátape*, *Adivino* o *Todas*.
  * **Por Asignación**: Muestra medidores *Disponibles* (libres en bodega) o *Asignados* (en servicio en un predio).
  * **Por Estado Operativo**: Filtra entre medidores *Activos* e *Inactivos*.
* **Buscador Reactivo con Debounce (250 ms)**: Localiza de forma instantánea cualquier equipo buscando por número de serie, dirección, calle o nombre del cliente titular.
* **Panel Lateral de Medidores (Render Incremental)**: Lista fluida de tarjetas informativas optimizada para equipos de cómputo estándar mediante renderizado por bloques de 40 elementos. Al hacer clic sobre cualquier tarjeta, el mapa centra y enfoca automáticamente la toma correspondiente.

---

### 2. Pestaña de Inventario General (`TabInventarioMedidores`)
Es la mesa de trabajo principal para la administración técnica, auditoría y control de inventario:

![Tabla maestra del Inventario de Medidores con buscador y filtros](../imagenes/medidores/inventario_medidores_tabla.png)

* **Buscador Multicriterio**: Búsqueda reactiva por número de serie, marca, nombre del cliente o número de predio.
* **Filtros Combinables Avanzados**:
  * **Estado del Medidor**: *Activo*, *Inactivo*, *Mantenimiento*, *Cortado*, *Retirado*.
  * **Ubicación**: Segmentación por sector o calle registrada.
  * **Ciudad / Localidad**: Filtro directo por comunidad municipal.
* **Tabla Maestra de Datos**:
  * **Datos del Equipo**: Iconografía de estado, número de serie formal y ficha de fabricante (Marca y Modelo).
  * **Ubicación y Coordenadas**: Dirección física registrada y coordenadas GPS de precisión (`Latitud, Longitud`).
  * **Estado de Servicio**: Chip visual con código de color que identifica el estado funcional.
  * **Vinculación de Cliente**: Indicador de *Disponible* (verde) o tarjeta de *Asignado* con nombre del titular y número de predio.
  * **Botonera de Acciones**: Acceso rápido para ver ficha técnica (`👁️ Detalle`), editar parámetros (`⚙️ Modificar`) o desactivar equipo (`🗑️ Eliminar/Papelera`).
* **Exportación Institucional de Datos**: Genera reportes en formato **Excel (.xlsx)** con estilos de auditoría o en **CSV (UTF-8)** con tres alcances seleccionables:
  1. *Página actual visible*.
  2. *Conjunto de datos filtrados*.
  3. *Inventario histórico completo*.
* **Gestor de Papelera de Reciclaje**: Pestaña dedicada para consultar medidores desactivados, revisar motivos de baja documentados, restaurar equipos al inventario activo o ejecutar la purga definitiva.

---

## 📊 Panel de Indicadores Clave (KPIs en Tiempo Real)

En la cabecera superior del módulo se presentan cuatro tarjetas analíticas que reflejan el estado del parque de medidores:

![Panel de métricas y tarjetas de indicadores KPIs de medidores](../imagenes/medidores/metricas_kpis_medidores.png)

| Indicador KPI | Código Color | Significado Operativo |
| :--- | :---: | :--- |
| **Total Medidores** | 🔵 Azul | Volumen total de equipos registrados en la base de datos institucional. |
| **Asignados** | 🟢 Esmeralda | Medidores actualmente vinculados a un contrato de cliente y predio activo. |
| **Disponibles** | 🟣 Índigo | Medidores libres en bodega/inventario listos para nuevas contrataciones. |
| **En Servicio** | 🟠 Naranja | Equipos con estado "Activo" en funcionamiento normal sin reportes de corte o falla. |

---

## 📁 Expediente Técnico del Medidor (`ModalDetalleMedidor`)

Al presionar el botón de **Ver Detalle (👁️)** en cualquier medidor, se abre una ventana con su ficha técnica completa:

![Ficha técnica y expediente digital del medidor](../imagenes/medidores/modal_detalle_medidor.png)

1. **Identificación y Especificaciones Técnicas**: Identificador interno (`ID`), número de serie con tipografía monoespaciada, marca y modelo de fábrica.
2. **Ubicación y Registro**: Referencia física escrita, coordenadas geográficas GPS con chip interactivo y fecha de instalación formal.
3. **Titular Asociado y Tarifa**: Nombre del cliente titular, ID de contrato, teléfono de contacto y esquema tarifario activo (Doméstica, Comercial, Preferencial).
4. **Estado de Disponibilidad**: Si el equipo no tiene contrato asociado, la ficha muestra claramente el distintivo de **"Medidor Libre"**.

---

## ⚡ Buenas Prácticas de Operación

> [!TIP]
> **Planificación de Nuevas Tomas**: Al preparar una nueva instalación en campo, consulte primero en la pestaña de **Inventario General** los medidores con estado **Disponible** para asignar un equipo físico ya registrado en bodega.

> [!IMPORTANT]
> **Coherencia de Series y Rutas**: Registre siempre el prefijo correcto de localidad (`NG-`, `MP-`, `AD-`) para que el medidor se incorpore automáticamente en la ruta física de lecturas correspondiente.
