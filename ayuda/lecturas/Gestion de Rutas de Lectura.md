---
titulo: "Gestión y Creación de Rutas de Lectura"
seccion: "lecturas"
orden: 3
descripcion: "Procedimiento para diseñar, crear, ordenar y geolocalizar rutas de lectura de campo con trazado satelital."
tags: ["rutas", "crear ruta", "predios", "ordenamiento", "secuencia", "mapa", "gis"]
---

# 🗺️ Gestión y Creación de Rutas de Lectura

Una **Ruta de Lectura** es una agrupación lógica y geográfica de tomas de agua potable organizada en una secuencia óptima de recorrido para que el personal de campo capture las mediciones mensuales con la máxima eficiencia.

---

## 📋 Pasos para Crear una Nueva Ruta

1. Ingrese al módulo de **Lecturas** y presione el botón superior **"+ Nueva Ruta"** (`RegistrarRuta`).
2. Se abrirá el asistente modal estructurado en dos fases:

![Modal de Creación y Trazado de Rutas](../imagenes/lecturas/creacion_gestion_ruta/modal_crear_ruta.avif)

---

### Fase 1: Información Básica de la Ruta
* **Nombre de la Ruta** (Obligatorio): Nombre descriptivo y formal (ej. *"Ruta 1 - Sector Centro Nácori"*, *"Barrio El Llano - Mátape"*).
* **Descripción** (Opcional): Detalles sobre los límites geográficos, colonias cubiertas o referencias de acceso.

---

### Fase 2: Secuencia de Predios y Mapa (`PanelGestionRuta`)

En esta sección se eligen los clientes y medidores que integrarán la ruta:

![Panel de Gestión de Secuencia y Ordenamiento de Predios](../imagenes/lecturas/creacion_gestion_ruta/panel_ordenamiento_predios.avif)

#### 1. Métodos para Agregar Tomas a la Ruta:
* **Buscador Individual Reactivo**: Escriba el nombre del cliente, número de predio, dirección o número de serie del medidor. Al seleccionarlo, se agregará a la lista.
* **Carga Masiva por Localidad (Pueblo)**: Mediante el menú de sectores, puede importar de un solo clic la totalidad de clientes y medidores de *Nácori Grande*, *Mátape* o *Adivino*.

#### 2. Requisitos Técnicos de Inclusión:
Para que un medidor pueda integrarse exitosamente a una ruta, debe cumplir dos condiciones:
1. **Tener Cliente Vinculado**: Equipos libres en bodega no pueden pertenecer a rutas de cobro.
2. **Tener Coordenadas GPS Válidas**: Si el medidor no tiene latitud y longitud registradas, el sistema emitirá un aviso informativo de omisión para que se geolocalice primero en el módulo de Medidores.

---

## 🔢 Modos de Ordenamiento de la Secuencia de Lectura

El panel permite reordenar las paradas de la ruta con tres criterios técnicos:

| Modo de Orden | Funcionamiento y Aplicación |
| :--- | :--- |
| **Por Número de Predio** | *(Recomendado)* Ordena los medidores automáticamente según la numeración progresiva de los predios catastrales, siguiendo el curso natural de las calles. |
| **Por ID de Cliente** | Ordena las tomas cronológicamente según la antigüedad del contrato en el sistema. |
| **Personalizado (Drag & Drop)** | Permite arrastrar manualmente las tarjetas con el cursor hacia arriba o abajo para establecer un recorrido a la medida de las vialidades. |

---

## 📍 Trazado Satelital y Cálculo de Ruta en Mapa

Al presionar el botón **"Trazar Ruta"** en el panel:
* El sistema conecta los puntos GPS de los medidores en el mapa satelital Leaflet.
* Se traza la poligonal del recorrido mostrando la línea directriz del avance de campo.
* Si desea reiniciar el trazado para reordenar, presione **"Reiniciar Trazado"**.

![Visualización de la ruta en mapa interactivo con paradas](../imagenes/lecturas/creacion_gestion_ruta/mapa_trazado_ruta.avif)

---

## 💾 Guardar y Confirmar la Ruta

1. Verifique que el conteo de paradas coincida con los predios del sector.
2. Presione **"Guardar Ruta"**.
3. La ruta se registrará inmediatamente y estará disponible para el ciclo de lecturas en todos los períodos activos.

---

## 🛠️ Modificar o Auditar una Ruta Existente

* **Editar Ruta (`ModalEditarRuta`)**: En la tarjeta de la ruta, presione el menú de tres puntos &rarr; **"Editar Ruta"**. Permite agregar nuevas tomas recién contratadas, retirar medidores dados de baja o reajustar la secuencia.
* **Ver Detalle (`ModalDetalleRuta`)**: Despliega la ficha técnica de la ruta con la relación de clientes, medidores, lectura anterior registrada y mapa interactivo con zoom a cada punto.
