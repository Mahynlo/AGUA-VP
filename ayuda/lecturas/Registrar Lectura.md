---
titulo: "Captura de Lecturas en el Carrusel Interactivo"
seccion: "lecturas"
orden: 4
descripcion: "Guía para capturar lecturas mensuales en el carrusel inmersivo, navegación por teclado, cálculo de consumo y vueltas a cero."
tags: ["lecturas", "carrusel", "captura", "consumo", "vuelta a cero", "teclado", "medidor"]
---

# 📲 Captura de Lecturas en el Carrusel Interactivo

La captura de lecturas en **AguaVP** se realiza a través de un **Carrusel Inmersivo a Pantalla Completa** (`CarruselLecturasModal`), diseñado para permitir una captura ágil, segura y libre de errores tipográficos.

---

## 🚀 Cómo Iniciar la Captura de una Ruta

1. Ingrese a la vista de **Lecturas**.
2. Localice la tarjeta de la ruta a capturar y presione el botón **"Tomar Lecturas"**.
3. Se abrirá la interfaz de captura a pantalla completa:

![Carrusel interactivo de toma de lecturas con mapa y expediente](../imagenes/lecturas/carrusel_toma_lecturas.png)

---

## 🖥️ Estructura de la Pantalla de Captura

La pantalla se divide en dos paneles complementarios:

### Panel Izquierdo: Cartografía GIS de Precisión
* Muestra el mapa satelital enfocado y centrado exactamente sobre las coordenadas GPS del medidor actual.
* Permite verificar visualmente la ubicación de la toma, la calle y referencias de campo.

### Panel Derecho: Expediente del Predio y Caja de Captura
1. **Identidad del Usuario**: Nombre completo del cliente titular, número de predio, dirección y teléfono de contacto.
2. **Ficha del Medidor**: Número de serie troquelado, marca, modelo y esquema tarifario asignado.
3. **Lectura Anterior de Referencia**:
   * Despliega el valor del mes anterior en $m^3$.
   * Si es la primera lectura de un medidor recién instalado, el sistema mostrará un banner informativo indicando que este valor será el punto de partida oficial.
4. **Caja de Entrada Numérica (Solo Enteros $m^3$)**:
   * Campo de texto con tipografía de alto contraste enfocado automáticamente.
   * Filtra caracteres inválidos y permite ingresar únicamente números enteros.
5. **Cálculo de Consumo en Tiempo Real**:
   * Al escribir la lectura, el sistema calcula de inmediato la diferencia:
     $$\text{Consumo} = \text{Lectura Actual} - \text{Lectura Anterior}$$
   * El consumo resultante se muestra en un recuadro esmeralda destacado (ej. `+25 m³`).

---

## 🔄 Tratamiento de la "Vuelta a Cero" (Rollover del Odómetro)

Si la lectura observada en el medidor físico es **menor que la lectura anterior** (por ejemplo, el mes pasado tenía $99,985 \ m^3$ y ahora marca $00,020 \ m^3$ debido a que el odómetro llegó a su capacidad máxima de $99,999 \ m^3$):

![Panel de alerta y confirmación de vuelta a cero en carrusel](../imagenes/lecturas/alerta_vuelta_cero_carrusel.png)

1. El sistema activará automáticamente un **Panel de Alerta Naranja**.
2. Mostrará el comparativo entre la lectura anterior y el valor ingresado.
3. Aplicará el algoritmo de compensación de rollover:
   $$\text{Consumo Rollover} = (\text{Capacidad Máxima} - \text{Lectura Anterior}) + \text{Lectura Actual}$$
4. El operador dispone de dos opciones:
   * **Confirmar Vuelta a Cero**: Acepta el cálculo de rollover y avanza al siguiente predio.
   * **Corregir Error**: Limpia el campo para reescribir la lectura en caso de haberse tratado de un error de dedo.

---

## ⌨️ Navegación Rápida y Atajos de Teclado

Para maximizar la velocidad de captura de las secretarias y operadores:

| Acción | Atajo o Método |
| :--- | :--- |
| **Guardar y Avanzar** | Presione la tecla **Enter** tras escribir la lectura. |
| **Navegar Entre Predios** | Utilice los botones **"‹ Anterior"** y **"Siguiente ›"** en el pie de página. |
| **Búsqueda y Salto Rápido** | Presione el botón **🔍 Buscar** en la cabecera para abrir el buscador predictivo y saltar directamente a cualquier medidor por serie, nombre o predio. |

![Buscador rápido de medidores en el carrusel de lecturas](../imagenes/lecturas/buscador_salto_carrusel.png)

---

## 💾 Cierre de la Toma de Lecturas

* Cada lectura guardada se almacena inmediatamente en la base de datos con persistencia en tiempo real.
* Al capturar el último medidor de la ruta, el carrusel indicará que la ruta está completa al $100\%$ y lista para su facturación.
