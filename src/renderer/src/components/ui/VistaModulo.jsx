/**
 * Piezas visuales compartidas por las vistas de los módulos (Clientes, Lecturas, …) para que
 * todas tengan el mismo encabezado, pestañas, subtítulo de sección e indicadores.
 *
 * Estructura de una vista:
 *   <ProveedorIndicadores>
 *     <EncabezadoVista …/>          ← título del módulo + espacio para los indicadores
 *     <PestanasVista …/>
 *     (pestaña) <IndicadoresVista>…</IndicadoresVista>   ← la pestaña elige sus indicadores
 *               <EncabezadoSeccion …/>                    ← subtítulo de la pestaña + acciones
 *   </ProveedorIndicadores>
 *
 * Los indicadores se dibujan en el encabezado con un portal: la lógica que los calcula se queda
 * en la pestaña que los conoce. Solo presentación.
 */
import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";

const RanuraContext = createContext(null);

/** Envuelve la vista para que las pestañas puedan colocar sus indicadores en el encabezado. */
export function ProveedorIndicadores({ children }) {
  const [nodo, setNodo] = useState(null);
  return <RanuraContext.Provider value={{ nodo, setNodo }}>{children}</RanuraContext.Provider>;
}

/** Indicadores de la pestaña activa; se muestran junto al título del módulo. */
export function IndicadoresVista({ children }) {
  const ranura = useContext(RanuraContext);
  if (!ranura?.nodo) return null;
  return createPortal(children, ranura.nodo);
}

// Colores de acento por módulo (clases completas para que Tailwind las incluya)
const ACENTOS = {
  blue: {
    icono: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    pestana: "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400",
    contador: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
  },
  amber: {
    icono: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    pestana: "border-amber-600 text-amber-600 dark:border-amber-500 dark:text-amber-400",
    contador: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  },
  emerald: {
    icono: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    pestana: "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400",
    contador: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  },
  indigo: {
    icono: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    pestana: "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400",
    contador: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
  }
};

/** Título del módulo con su icono, una línea de descripción y, a la derecha, los indicadores de la pestaña. */
export function EncabezadoVista({ icon: Icon, acento = "blue", titulo, descripcion, children }) {
  const a = ACENTOS[acento] || ACENTOS.blue;
  const ranura = useContext(RanuraContext);
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 xl:gap-6">
      <div className="flex items-center gap-4 min-w-0 xl:max-w-sm 2xl:max-w-xl">
        <div className={`p-3 rounded-xl shrink-0 flex items-center justify-center ${a.icono}`}>
          <Icon className="w-7 h-7" />
        </div>
        <div className="flex flex-col min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
            {titulo}
          </h1>
          {descripcion && (
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 leading-snug">{descripcion}</p>
          )}
        </div>
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
      {ranura && (
        <div
          ref={ranura.setNodo}
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full xl:w-auto xl:flex-1 xl:max-w-3xl empty:hidden"
        />
      )}
    </div>
  );
}

/** Subtítulo de la pestaña: qué es este apartado, con sus acciones a la derecha. */
export function EncabezadoSeccion({ icon: Icon, titulo, descripcion, cargando = false, children }) {
  return (
    // Con flex-wrap las acciones bajan a su propia línea cuando no caben junto al título
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1 basis-72">
        {Icon && (
          <div className="p-2 rounded-lg shrink-0 bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">{titulo}</h2>
            {cargando && (
              <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-zinc-600 border-t-slate-700 dark:border-t-zinc-200 animate-spin" />
            )}
          </div>
          {descripcion && <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 leading-snug">{descripcion}</p>}
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 max-w-full">{children}</div>}
    </div>
  );
}

/**
 * Pestañas subrayadas de la vista.
 * @param {Array<{ key: string, label: string, icon?: Function, contador?: number|string }>} tabs
 */
export function PestanasVista({ tabs, activa, onChange, acento = "blue", className = "mb-6", children }) {
  const a = ACENTOS[acento] || ACENTOS.blue;
  return (
    <div className={`w-full flex items-end justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 ${className}`}>
      <nav className="flex gap-6 -mb-px overflow-x-auto min-w-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(({ key, label, icon: Icon, contador }) => {
          const esActiva = activa === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-current={esActiva ? "page" : undefined}
              className={`flex items-center gap-2 py-3 text-sm border-b-2 transition-colors cursor-pointer shrink-0 ${
                esActiva
                  ? `${a.pestana} font-bold`
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
              }`}
            >
              {Icon && <Icon className="text-lg" />}
              <span>{label}</span>
              {contador != null && (
                <span className={`px-1.5 h-5 inline-flex items-center rounded-md text-[11px] font-bold tabular-nums ${
                  esActiva ? a.contador : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                }`}>
                  {contador}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      {children && <div className="flex items-center gap-2 pb-2 shrink-0">{children}</div>}
    </div>
  );
}

/**
 * Indicador compacto: icono, etiqueta y valor; el detalle se muestra al pasar el cursor. Admite contenido extra (una barra).
 * Se adapta a su propio ancho (container query): si la tarjeta es angosta oculta el icono y reduce el valor,
 * y el valor nunca se desborda (se recorta y se ve completo en el tooltip).
 */
export function Indicador({ icon: Icon, tint, label, value, valueClass = "text-slate-800 dark:text-zinc-100", detalle, sufijo, children }) {
  const valorTexto = typeof value === "string" || typeof value === "number" ? String(value) : "";
  const tooltip = [valorTexto && `${label}: ${valorTexto}`, detalle].filter(Boolean).join(" · ");
  return (
    <div className="@container bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 @min-[11rem]:px-3.5 flex flex-col justify-center gap-1.5 min-w-0" title={tooltip || undefined}>
      <div className="flex items-center gap-2.5 @min-[11rem]:gap-3 min-w-0">
        {Icon && (
          <div className={`hidden @min-[10rem]:block p-2 rounded-lg shrink-0 ${tint}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 truncate">{label}</p>
          <div className="flex items-baseline gap-1.5 min-w-0">
            <p className={`text-lg @min-[12rem]:text-xl font-black leading-tight tabular-nums truncate min-w-0 ${valueClass}`}>{value}</p>
            {sufijo && <span className="shrink-0">{sufijo}</span>}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
