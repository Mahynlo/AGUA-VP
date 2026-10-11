/**
 * Piezas de la barra de filtros de las tablas (Clientes, Inventario de Medidores):
 * lista desplegable con cantidades, botón "Más filtros" y etiquetas de filtros activos.
 */
import { HiAdjustments, HiChevronDown, HiX, HiFilter } from "react-icons/hi";

export const SELECT_FILTRO_CLS =
  "w-full h-[52px] pl-4 pr-8 text-sm font-semibold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none appearance-none cursor-pointer";

/** Mismo criterio que la API para agrupar textos (ubicación, marca): sin espacios sobrantes y en minúsculas. */
export const normalizarValorFiltro = (v) => String(v ?? "").trim().replace(/[A-Z]/g, (c) => c.toLowerCase());

/**
 * Agrupa los valores de un campo de texto ignorando mayúsculas y espacios.
 * @returns {Array<{ value: string, label: string, count: number }>} ordenadas por cantidad
 */
export function opcionesAgrupadas(lista, campo, etiquetaVacio = "Sin dato") {
  const grupos = new Map();
  for (const item of lista || []) {
    const original = String(item?.[campo] ?? "").trim();
    const clave = normalizarValorFiltro(original);
    const g = grupos.get(clave) || { value: clave === "" ? "__vacio" : original, label: clave === "" ? etiquetaVacio : original, count: 0, variantes: new Map() };
    g.count++;
    g.variantes.set(original, (g.variantes.get(original) || 0) + 1);
    grupos.set(clave, g);
  }
  // Etiqueta = la forma escrita más común del grupo
  return [...grupos.values()]
    .map((g) => {
      if (g.value === "__vacio") return { value: g.value, label: g.label, count: g.count };
      const [masComun] = [...g.variantes.entries()].sort((a, b) => b[1] - a[1])[0];
      return { value: masComun, label: masComun, count: g.count };
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "es"));
}

/** Lista desplegable de un filtro; muestra la cantidad de registros de cada opción cuando se conoce. */
export function SelectFiltro({ etiqueta, value, onChange, opciones, todos }) {
  const activo = value !== "All";
  return (
    <div className="flex flex-col gap-1">
      {etiqueta && (
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 ml-1">{etiqueta}</span>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={etiqueta || todos}
          className={`${SELECT_FILTRO_CLS} ${activo ? "!border-blue-500 !bg-blue-500/5" : ""}`}
        >
          <option value="All">{todos}</option>
          {opciones.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}{o.count != null ? ` (${o.count})` : ""}
            </option>
          ))}
        </select>
        <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

/** Botón que abre / cierra el panel de filtros adicionales, con el número de filtros activos del panel. */
export function BotonMasFiltros({ abierto, onToggle, activos }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full h-[52px] px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border ${
        abierto || activos > 0
          ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
          : "bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-800"
      }`}
    >
      <HiAdjustments className="w-4 h-4" />
      Más filtros
      {activos > 0 && (
        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">{activos}</span>
      )}
      <HiChevronDown className={`w-4 h-4 transition-transform ${abierto ? "rotate-180" : ""}`} />
    </button>
  );
}

/**
 * Etiquetas de los filtros activos (cada una se quita con su X) y botón para quitar todos.
 * @param {Array<{ clave: string, texto: string, onQuitar: Function }>} chips
 */
export function ChipsFiltros({ chips, onLimpiar, total, nombre }) {
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 pt-4">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mr-1 flex items-center gap-1">
        <HiFilter className="w-3.5 h-3.5" /> {total != null ? `${total} ${nombre} con:` : "Filtrando por:"}
      </span>
      {chips.map((c) => (
        <span
          key={c.clave}
          className="inline-flex items-center gap-1.5 pl-3 pr-1.5 h-7 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-xs font-semibold"
        >
          {c.texto}
          <button type="button" onClick={c.onQuitar} title="Quitar filtro" className="p-0.5 rounded hover:bg-blue-500/20">
            <HiX className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}
      <button type="button" onClick={onLimpiar} className="h-7 px-3 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors">
        Quitar todos
      </button>
    </div>
  );
}
