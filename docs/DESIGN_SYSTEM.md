# Guía del Sistema de Diseño Unificado - AguaVP

Esta guía documenta los componentes, tokens de color, estructura de vistas y lineamientos de experiencia de usuario para garantizar coherencia en todos los módulos del sistema **AguaVP**.

---

## 1. Principios de Diseño
1. **Claridad sobre Ornamento**: La información operativa (saldos, lecturas, estados de medidor, clientes) debe ser inmediatamente legible sin distracciones.
2. **Jerarquía Visual Consistente**:
   - Títulos de vista: `text-3xl font-black text-slate-800 dark:text-zinc-100`.
   - Etiquetas de métrica / cabeceras de tabla: `text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500`.
   - Cifras y KPIs: `text-2xl font-black`.
   - Textos descriptivos: `text-xs` o `text-sm font-medium text-slate-500 dark:text-zinc-400`.
3. **Paleta Unificada**:
   - **Color Institucional Base**: Agua / Azul Corporativo (`blue-600` / `blue-400`).
   - **Superficies**: `slate-50` / `zinc-950` con bordes sutiles `slate-200` / `zinc-800`.
   - **Estados**: Verde (Activo/Pagado), Ámbar (Pendiente/Alerta), Rojo (Cortado/Eliminado/Deuda), Azul (Información/Proceso).

---

## 2. Componentes Clave

### A. Barra de Búsqueda y Filtros
- Alto homogéneo `h-[46px]` o `h-[48px]`.
- Input con icono a la izquierda y botón limpiar `X` a la derecha.
- Selects estilizados con bordes limpios y texto semibold.
- Píldoras de filtrado rápido con conteos en tiempo real.

### B. Tablas de Datos
- Encabezados transparentes con borde inferior sutil.
- Fila con padding generoso (`py-4 px-6`).
- Identificadores con badge o chip (# de Predio, Serie, Folio).
- Acciones con botones compactos redondeados y tooltips descriptivos.

### C. Modales de Gestión (Alta, Edición, Detalle)
- Ancho estándar (`3xl` o `4xl`).
- Encabezado con icono con fondo tintado suave.
- Agrupación por tarjetas de sección (`bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5`).
- Footer con botón cancelar fantasma y botón guardar sólido en color primario.
