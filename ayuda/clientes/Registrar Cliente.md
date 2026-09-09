---
titulo: "Registrar Nuevo Cliente"
seccion: "clientes"
orden: 2
descripcion: "Guía paso a paso para el alta de usuarios, formato técnico del número de predio, validación de datos y tarifas."
tags: ["registro", "nuevo cliente", "número de predio", "alta", "validaciones", "formulario"]
---

# ➕ Registrar Nuevo Cliente

El registro de un cliente formaliza un nuevo contrato de agua potable en el sistema. Para iniciar el trámite, presione el botón negro **"+ Nuevo Cliente"** ubicado en la esquina superior derecha del directorio.

![Botón Nuevo Cliente en la cabecera del directorio de clientes](../imagenes/clientes/boton_nuevo_cliente.png)

Se abrirá el modal interactivo de alta dividido en 3 bloques obligatorios: **Información Personal**, **Dirección de Residencia** y **Tarifa del Cliente**.

---

## 🏷️ 1. Bloque: Información Personal

![Formulario de Registro: Bloque de Información Personal y Número de Predio](../imagenes/clientes/formulario_registro_datos_personales.png)

### 📌 Especificación Técnica del Número de Predio (`numero_predio`)
El **Número de Predio** es la clave catastral y operativa única que identifica físicamente el inmueble o lote dentro del municipio.

#### Prefijos Oficiales por Localidad:
| Localidad | Prefijo | Ejemplo Correcto | Descripción |
| :--- | :---: | :---: | :--- |
| **Nácori Grande** | `NG-` | `NG-1`, `NG-45`, `NG-120` | Tomas y predios en la cabecera de Nácori |
| **Mátape** | `MP-` | `MP-8`, `MP-34`, `MP-210` | Tomas y predios en Mátape |
| **Adivino** | `AD-` | `AD-3`, `AD-15`, `AD-88` | Tomas y predios en El Adivino |

#### ⚙️ Reglas de Auto-Formato y Normalización:
* **Conversión a Mayúsculas**: Cualquier entrada como `ng-12` o `mp45` se convierte automáticamente a `NG-12` y `MP-45`.
* **Depuración de Ceros Redundantes**: Si se ingresa `NG002` o `NG-02`, el sistema lo normaliza a `NG-2`.
* **Inserción Automática del Guion**: Si el operador escribe `MP45`, el sistema inserta el guion transformándolo en `MP-45`.

#### 🛡️ Detección de Duplicidad en Tiempo Real:
Mientras escribe el número de predio, el sistema consulta en segundo plano la base de datos completa. Si el predio ya está asignado a otro contrato activo:

![Alerta de validación en tiempo real cuando un Número de Predio ya está ocupado](../imagenes/clientes/alerta_predio_duplicado.png)

* El campo se resaltará en **rojo**.
* Se mostrará la advertencia: `⚠️ Predio en uso por: [Nombre del Titular Actual]`.
* El sistema bloqueará el guardado hasta ingresar un predio disponible o corregir el dato.

---

### 👤 Datos Personales del Titular:
* **Nombre Completo (`nombre`)** *(Obligatorio)*:
  * Capture nombre(s) y apellidos completos del titular del contrato.
* **Correo Electrónico (`correo`)** *(Obligatorio)*:
  * Correo electrónico válido para envío de recibos digitales y notificaciones (ej. `usuario@gmail.com`).
* **Teléfono (`telefono`)** *(Obligatorio)*:
  * Ingrese los 10 dígitos del número telefónico. El sistema lo formateará automáticamente con máscara estándar: `(662) 123-4567`.

---

## 📍 2. Bloque: Dirección de Residencia

![Formulario de Registro: Bloque de Dirección de Residencia y Selección de Pueblo](../imagenes/clientes/formulario_registro_direccion.png)

* **Pueblo (`ciudad`)** *(Obligatorio)*:
  * Seleccione la localidad en el menú desplegable: **Nacori Grande**, **Matape** o **Adivino**.
* **Dirección Completa (`direccion`)** *(Obligatorio)*:
  * Ingrese calle principal, entrecalles, número exterior e interior, colonia y referencias visuales (ej. *"Calle Hidalgo #24 entre Juárez y Morelos, casa blanca con cerco verde"*).

> [!TIP]
> **Referencias de Campo**: Entre más detallada sea la dirección, más rápido podrá el personal de campo ubicar la toma durante la toma física de lecturas y reparto de recibos.

---

## 💲 3. Bloque: Tarifa del Cliente

![Formulario de Registro: Bloque de Selección de Esquema Tarifario](../imagenes/clientes/formulario_registro_tarifa.png)

* **Selección de Tarifa (`tarifaSeleccionada`)** *(Obligatorio)*:
  * Seleccione la tarifa aplicable al usuario según el uso del inmueble:
    * **Doméstica**: Viviendas particulares y residencias de uso familiar.
    * **Comercial**: Tiendas, talleres, restaurantes y negocios locales.
    * **Especial / Preferencial**: Escuelas, edificios públicos, templos o convenios autorizados.

---

## 💾 4. Guardado y Verificación

1. Revise los datos capturados en el formulario.
2. Presione el botón negro **"Guardar Cliente"**.
3. El sistema realizará las validaciones de campos requeridos y unicidad de predio.
4. Se mostrará una **alerta verde de confirmación** y el nuevo usuario aparecerá de inmediato al inicio del directorio.

> [!NOTE]
> **Medidor Posterior**: Al registrar un nuevo cliente, no es indispensable que ya tenga medidor físico instalado. Puede crearse la cuenta y posteriormente usar la opción **"Asignar Medidor"** cuando la cuadrilla instale el equipo en la toma.
