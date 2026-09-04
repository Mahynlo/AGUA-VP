---
name: aguavp-ui-system
description: >-
  Guía maestra de diseño unificado, tokens y patrones de interfaz para AguaVP.
  Utilizar siempre que se rediseñe, modifique o cree una vista o componente
  en la aplicación para mantener una UI seria, profesional, consistente y amigable.
---

# Sistema de Diseño Unificado - AguaVP

Esta guía y skill contiene los estándares visuales, componentes personalizados, distribución de pantallas y patrones de experiencia de usuario para la aplicación de escritorio **AguaVP**.

---

## 1. Filosofía de Diseño

- **Serio, Confiable y Profesional**: AguaVP administra servicios esenciales de agua potable y finanzas públicas. La interfaz debe proyectar orden institucional, alta legibilidad y robustez técnica.
- **Respetar lo que Funciona Bien**: Mantener los inputs personalizados, buscadores con botón limpiar, selectores de período y formularios modulares que ya ofrecen una excelente usabilidad.
- **Distribución Limpia y Amigable**:
  - Evitar sobrecargar con bordes multicolores estridentes.
  - Usar una paleta neutra elegante (**Slate / Zinc**) con un **color de identidad por módulo** (azul para clientes/medidores, esmeralda para pagos/tarifas, ámbar para lecturas, índigo para impresión/dashboard).
  - Espaciado generoso (`p-6 sm:p-8 lg:p-10`), tarjetas con `rounded-[2rem]` para vistas y `rounded-2xl` para modales y subsecciones.

---

## 2. Mapa de Identidad y Color por Módulo

| Módulo | Color Base | Tinte de Fondo / Icono | Rol Operativo |
|---|---|---|---|
| **Clientes** | Azul (`blue-600` / `blue-400`) | `bg-blue-500/10 text-blue-600 dark:text-blue-400` | Directorio de usuarios, altas, ediciones, expediente y métricas. |
| **Medidores** | Azul / Celeste (`blue-600`) | `bg-blue-500/10 text-blue-600 dark:text-blue-400` | Inventario de hardware, asignación a predios y mapa GIS. |
| **Lecturas** | Ámbar / Naranja (`amber-600`) | `bg-amber-500/10 text-amber-600 dark:text-amber-400` | Logística de rutas por sector, toma de lecturas y avance. |
| **Pagos** | Esmeralda (`emerald-600`) | `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400` | Cobranza FIFO, facturación, control de cartera y recaudación. |
| **Tarifas** | Esmeralda / Violeta (`emerald-600`) | `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400` | Catálogo de tarifas escalonadas y simulador de cobro. |
| **Impresión** | Índigo (`indigo-600`) | `bg-indigo-500/10 text-indigo-600 dark:text-indigo-400` | Centro de emisión masiva de recibos físicos y reportes. |
| **Inicio / Dashboard** | Índigo / Azul (`indigo-600`) | `bg-indigo-500/10 text-indigo-600 dark:text-indigo-400` | Panel ejecutivo, consumo mensual, tendencias y calendario. |
| **Administrador** | Slate / Azul (`slate-800`) | `bg-slate-500/10 text-slate-700 dark:text-slate-300` | Seguridad, usuarios, backups, logs y mantenimiento. |

---

## 3. Tokens de Superficie y Tipografía

### Superficies
- **Fondo Exterior de Vista**: `bg-slate-50 dark:bg-black/20` con scroll suave.
- **Card Contenedor de Vista**: `bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm`.
- **Card de Subsección**: `bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5`.
- **Modales en Windows (Electron)**: Usar overlay sólido `bg-slate-900/60 dark:bg-black/80` (NO usar `backdrop-blur-*` para evitar cuadros negros en GPU).

### Tipografía
- **Títulos de Módulo**: `text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none`.
- **Subtítulos**: `text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-lg mt-1 leading-relaxed`.
- **Etiquetas de KPI / Cabeceras**: `text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500`.
- **Valores Grandes de KPI**: `text-2xl sm:text-3xl font-black text-slate-800 dark:text-zinc-100 leading-none`.
- **Identificadores (# Predio, Serie)**: Tipografía monoespaciada `font-mono font-bold`.

---

## 4. Componentes Estándar Probados

### A. Buscador Personalizado con Limpieza Rápida
```jsx
<div className="relative w-full flex items-center">
  <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none">
    <HiSearch className="w-5 h-5" />
  </span>
  <input
    placeholder="Buscar..."
    value={search}
    onChange={(e) => handleSearch(e.target.value)}
    className="w-full pl-11 pr-10 py-3 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none h-[52px]"
  />
  {search && (
    <button
      onClick={() => handleSearch("")}
      className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
    >
      <HiX className="w-4 h-4" />
    </button>
  )}
</div>
```

### B. Dropdown Select Estandarizado
```jsx
const SELECT_CLS = "w-full h-[52px] pl-4 pr-8 text-sm font-semibold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none appearance-none cursor-pointer";
```

### C. Fila de Tabla de Usuario / Cliente
- **Avatar con Inicial**: Círculo con fondo suave `bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40`.
- **Nombre y Predio**: Nombre en negrita + Predio en chip monospace (`#NG-123`) + ID.
- **Contacto**: Icono de teléfono `HiPhone text-emerald-500` e icono de correo `HiMail text-blue-500`.
- **Ubicación**: Icono `HiLocationMarker text-slate-400` + Ciudad/Pueblo en negrita + Dirección en texto secundario.
- **Badge de Estado**: Píldora con punto indicador (`● Activo`, `● Inactivo`, `● Cortado`).
- **Botones de Acción**:
  - Ver detalle: `hover:bg-blue-50 hover:text-blue-600`
  - Editar: `hover:bg-slate-100 hover:text-slate-900`
  - Desactivar / Eliminar: `bg-rose-500/10 text-rose-600 hover:bg-rose-500/20`

### D. Paginador Estándar
- Resumen a la izquierda: `Mostrando X a Y de Z registros`.
- Botones numéricos limpios con active state en color del módulo.
- Selector de filas por página (`5`, `10`, `15`, `20`, `50`) a la derecha.

### E. Modales de Creación y Edición
- Encabezado con icono tintado + título + subtítulo.
- Secciones internas en tarjetas limpias `border-slate-200 dark:border-zinc-800`.
- Input de validación de predio en tiempo real para evitar duplicados.
- Selector de tarifa con ficha informativa de la tarifa vigente.
- Zona de peligro (Desactivar cliente / medidor) con motivo obligatorio de 10 caracteres y checkbox de confirmación.
- Footer con botón cancelar (fantasma) y guardar (sólido).

---

## 5. Resumen de Mejoras Aplicadas por Módulo

1. **Clientes**:
   - Unificación al color institucional **Azul**.
   - Sustitución de bordes de colores duros (verde/morado) en formularios por tarjetas neutrales elegantes.
   - Píldoras de navegación rápida entre **Directorio Activo** y **Papelera** con contadores en tiempo real.
2. **Tarifas**:
   - Mantenimiento del exitoso simulador de cobro de 2 columnas (parámetros a la izquierda, desglose en tabla a la derecha con frase de equivalencia).
3. **Lecturas**:
   - Fichas de rutas con selector de sectores (`Nácori Grande`, `Matapé`, `Adivino`) y barras de avance.
4. **Pagos**:
   - KPIs adaptativos según la pestaña seleccionada (Cobranza, Facturas, Pagos, Estadísticas).
   - Acciones de cobro rápido y liquidación total.
5. **Impresión**:
   - Distribución de 2 columnas (lista de selección con filtros a la izquierda, panel sticky de acciones a la derecha).
