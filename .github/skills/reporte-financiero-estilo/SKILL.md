# SKILL: Premium SaaS UI (AguaVP Design System)

## Objetivo
Aplicar un estilo visual consistente, limpio y tecnico ("Premium SaaS") para todas las vistas, reportes, dashboards y modales en AguaVP.

## Cuando usar esta skill
Usa esta skill cuando el pedido sea:
- "Haz que se vea igual al financiero"
- "Unificar estilos"
- "Mismo look and feel"
- "Aplica el estilo Premium SaaS"
- "Refactoriza este modal/componente para que encaje con el diseño actual"

No usar para:
- componentes fuera del dominio visual/UI
- cambios de logica de negocio, contratos API o validaciones funcionales

## Fuente de verdad
El estilo base SIEMPRE parte del patron canonico:
- src/renderer/src/components/vistas/impresion/components/ReporteFinancieroEstado.jsx

Debe respetar esta jerarquia:
- Contenedor general
- Header de seccion (titulo + subtitulo + chip)
- Bloque de filtros
- Grid KPI
- Secciones de charts
- Secciones de tablas
- Estados de error y loading

## Reglas de composicion (Premium SaaS)
1. Ratio de datos
- Menos ruido visual (sin sombras pesadas ni gradientes de relleno innecesarios)
- Mayor protagonismo a tipografia y datos

2. Jerarquia tipografica
- Etiquetas tecnicas: uppercase + tracking-widest
- Numeros/valores: font-black + tracking-tight

3. Regla de los tintes
- Prohibido usar fondos solidos brillantes para tarjetas o iconos
- Si hay acento de color, usar color al 10% en fondo y texto al 100%
- Ejemplo: bg-emerald-500/10 text-emerald-600

4. Buscadores invisibles
- Inputs y selects no van en tarjetas gigantes
- Usar fondos sutiles (bg-slate-100/70) y bordes suaves

## Tokens visuales (copiar/pegar)

### 1) Contenedores raiz (vistas completas)
Usar:

className="w-full bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10 print:shadow-none print:rounded-none print:bg-white print:border-none print:p-0"

### 2) Modales (NextUI)
Usar exactamente en <Modal>:

classNames={{
  backdrop: "bg-slate-900/40 backdrop-blur-sm",
  base: "bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-2xl",
  header: "border-b border-slate-100 dark:border-zinc-800/50 pb-4 pt-6 px-8",
  body: "px-8 py-6",
  footer: "border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8",
  closeButton: "hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 text-slate-400 p-2 top-4 right-4"
}}

### 3) Textos principales
- Titulo vista/modal: text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100
- Subtitulo: text-sm font-medium text-slate-500 dark:text-zinc-400
- Overlines: text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500

### 4) Selects, inputs y botones
Select e inputs (flat o bordered limpio):

classNames={{ trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-none h-[52px]" }}

Boton primario:

className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-8 shadow-sm"

### 5) Tarjetas KPI y metricas
Tarjeta base:

className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700"

Metrica:
- Valor: text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100

### 6) Tablas de datos
Usar en <Table removeWrapper>:

classNames={{
  th: "bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800",
  td: "text-sm font-medium text-slate-600 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/50 py-4"
}}

Tip de fila:
- hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-colors

### 7) Pestañas de navegacion (Tabs)
Usar variant="underlined" con:

classNames={{
  base: "w-full",
  tabList: "gap-6 w-full relative rounded-none p-0 border-b border-slate-200 dark:border-zinc-800",
  cursor: "w-full bg-slate-800 dark:bg-zinc-200 h-[2px]",
  tab: "max-w-fit px-0 h-12",
  tabContent: "group-data-[selected=true]:text-slate-800 dark:group-data-[selected=true]:text-zinc-100 group-data-[selected=true]:font-bold text-slate-500 dark:text-zinc-400 font-medium text-sm transition-colors"
}}

## Checklist de Definition of Done
- [ ] Elimina fondos de gradientes y sombras pesadas genericas
- [ ] Mantiene la misma jerarquia visual tecnica (overlines pequenos + datos grandes/gruesos)
- [ ] Usa la regla de los tintes para iconos y contenedores destacados
- [ ] No rompe funcionalidad ni handlers existentes
- [ ] Soporta light/dark sin contraste pobre
- [ ] Soporta print ocultando UI innecesaria

## Prompt rapido para aplicar la skill
"Refactoriza este componente para usar la skill Premium SaaS UI (AguaVP Design System). Conserva logica, contratos y handlers, y unifica layout, clases, tipografia, tarjetas, tablas, tabs y estados de carga/error segun el canonico ReporteFinancieroEstado.jsx."