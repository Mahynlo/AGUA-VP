import { HiLocationMarker, HiUser, HiUserRemove } from "react-icons/hi";

const TONOS = {
  verde: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60",
  naranja: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/60",
  azul: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/60",
  rojo: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/60",
  gris: "bg-slate-500/10 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700",
};

/**
 * Contenido del popup de un medidor, igual en todos los mapas.
 *
 * @param {string} serie        número de serie
 * @param {string} color        color del punto en el mapa (se repite en el encabezado)
 * @param {number} [orden]      número de orden en la ruta
 * @param {{texto: string, tono: keyof TONOS}} [estado] etiqueta de estado (Leído, Pendiente, Activo…)
 * @param {string} [cliente]    nombre del cliente (sin él se muestra «Sin cliente asignado»)
 * @param {string|number} [predio]
 * @param {string} [direccion]  dirección del cliente o ubicación del medidor
 * @param {React.ReactNode} [detalle] filas extra (p. ej. lectura y consumo del período)
 * @param {[number, number]} [coords]
 * @param {React.ReactNode} [children] acciones (botones)
 */
export default function FichaMedidor({ serie, color, orden, estado, cliente, predio, direccion, detalle, coords, children }) {
  return (
    <div className="p-3 min-w-[240px] max-w-[300px] text-slate-700 dark:text-zinc-200">
      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100 dark:border-zinc-700">
        <span
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white"
          style={{ backgroundColor: color }}
        >
          {orden ?? ""}
        </span>
        <h3 className="flex-1 min-w-0 text-sm font-bold text-slate-900 dark:text-zinc-50 truncate">
          Medidor {serie || "—"}
        </h3>
        {estado && (
          <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${TONOS[estado.tono] || TONOS.gris}`}>
            {estado.texto}
          </span>
        )}
      </div>

      <div className="space-y-1.5 text-xs">
        {cliente ? (
          <div className="flex items-start gap-2">
            <HiUser className="mt-0.5 shrink-0 text-blue-500" />
            <span className="font-semibold text-slate-800 dark:text-zinc-100">
              {cliente}
              {predio ? <span className="font-normal text-slate-500 dark:text-zinc-400"> · Predio #{predio}</span> : null}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
            <HiUserRemove className="shrink-0" />
            <span>Sin cliente asignado</span>
          </div>
        )}

        {direccion && (
          <div className="flex items-start gap-2">
            <HiLocationMarker className="mt-0.5 shrink-0 text-violet-500" />
            <span>{direccion}</span>
          </div>
        )}

        {detalle}

        {coords && (
          <div className="pt-1 font-mono text-[10px] text-slate-400 dark:text-zinc-500">
            {coords[0].toFixed(6)}, {coords[1].toFixed(6)}
          </div>
        )}
      </div>

      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

/** Fila «etiqueta: valor» para el detalle de la ficha */
export function FilaFicha({ etiqueta, valor }) {
  return (
    <div className="flex justify-between gap-3 px-2 py-1 rounded-md bg-slate-50 dark:bg-zinc-900/60">
      <span className="text-slate-500 dark:text-zinc-400">{etiqueta}</span>
      <span className="font-semibold text-slate-800 dark:text-zinc-100">{valor}</span>
    </div>
  );
}

/** Leyenda de colores del mapa: [{ color, texto, cantidad }] */
export function LeyendaMapa({ items, titulo, className = "" }) {
  return (
    <div className={`absolute bottom-3 left-3 z-[500] px-3 py-2 rounded-xl bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-700 shadow-sm text-[11px] ${className}`}>
      {titulo && <div className="font-bold text-slate-700 dark:text-zinc-200 mb-1">{titulo}</div>}
      <div className="space-y-0.5">
        {items.map(({ color, texto, cantidad }) => (
          <div key={texto} className="flex items-center gap-2 text-slate-600 dark:text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-full border border-white dark:border-zinc-800 shadow-sm" style={{ backgroundColor: color }} />
            <span className="flex-1">{texto}</span>
            {cantidad !== undefined && <span className="font-bold tabular-nums">{cantidad}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
