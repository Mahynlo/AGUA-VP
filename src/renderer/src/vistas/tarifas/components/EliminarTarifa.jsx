import { Modal, ModalHeader, ModalBody, ModalFooter } from "flowbite-react";
import { HiTrash, HiExclamationCircle } from "react-icons/hi";
import { useState } from "react";
import { useTarifas } from "../../../context/TarifasContext";
import { usePermissions } from "../../../context/PermissionsContext";
import { useFeedback } from "../../../context/FeedbackContext";

const modalTheme = {
  root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80 mt-10", off: "hidden" } },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-lg w-full"
  },
  header: {
    base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/50 px-6 py-5 rounded-t-2xl shrink-0",
    close: { base: "inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer", icon: "h-5 w-5" }
  },
  body: { base: "px-6 py-5 flex-1 overflow-y-auto" },
  footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/50 py-4 px-6 rounded-b-2xl shrink-0" }
};

/**
 * Eliminar una tarifa: solo si no tiene clientes ni facturas y no es la única
 * (la API aplica las mismas reglas; aquí solo se explican y se deshabilita el botón).
 */
export default function EliminarTarifa({ tarifa }) {
  const { tarifas, pagination, actualizarTarifas } = useTarifas();
  const { can } = usePermissions();
  const { setSuccess, setError } = useFeedback();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [eliminando, setEliminando] = useState(false);

  const clientes = tarifa.clientes_asignados ?? 0;
  const facturas = tarifa.facturas_emitidas ?? 0;
  const totalTarifas = pagination?.total ?? tarifas.length;

  const motivos = [];
  if (!can("tarifas.eliminar")) motivos.push("No tienes permiso para eliminar tarifas");
  if (clientes > 0) motivos.push(`tiene ${clientes} cliente(s) asignado(s)`);
  if (facturas > 0) motivos.push(`se usó en ${facturas} factura(s)`);
  if (totalTarifas <= 1) motivos.push("debe existir al menos una tarifa");
  const bloqueada = motivos.length > 0;

  const abrir = () => {
    setConfirmText("");
    setIsOpen(true);
  };

  const eliminar = async () => {
    if (confirmText.trim() !== tarifa.nombre) return;
    try {
      setEliminando(true);
      const res = await window.tarifasApp.eliminarTarifa({ id: tarifa.id, token_session: localStorage.getItem("token") });
      if (!res?.success) {
        setError(res?.message || "No se pudo eliminar la tarifa.", "Eliminar Tarifa");
        return;
      }
      setSuccess(res.message || `Tarifa "${tarifa.nombre}" eliminada.`, "Eliminar Tarifa");
      setIsOpen(false);
      actualizarTarifas();
    } catch (err) {
      setError(err.message || "Error al eliminar la tarifa.", "Eliminar Tarifa");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <>
      {/* El motivo va en el contenedor: un botón deshabilitado no muestra su title */}
      <span className="inline-flex" title={bloqueada ? `No se puede eliminar: ${motivos.join(", ")}` : "Eliminar tarifa"}>
        <button
          onClick={abrir}
          disabled={bloqueada}
          className="font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl px-4 h-10 min-w-0 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
        >
          <HiTrash className="w-4 h-4" />
        </button>
      </span>

      <Modal show={isOpen} onClose={() => !eliminando && setIsOpen(false)} theme={modalTheme} dismissible={!eliminando}>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 rounded-xl shrink-0">
              <HiExclamationCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100 leading-tight">Eliminar Tarifa</h3>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mt-0.5">
                {tarifa.nombre}
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-200 dark:border-rose-900/40">
              <p className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-2">Esta operación:</p>
              <ul className="space-y-1">
                {[
                  `Borra la tarifa "${tarifa.nombre}", sus ${tarifa.rangos?.length ?? 0} rango(s) y su historial de precios`,
                  "No afecta clientes ni facturas: esta tarifa no tiene ninguno",
                  "No se puede deshacer (salvo restaurando un respaldo)"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm font-medium text-rose-600 dark:text-rose-400">
                    <span className="mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Para cambiar precios no elimines la tarifa: edita sus rangos. Así los clientes conservan su tarifa y el cambio queda en el historial.
            </p>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200 mb-2">
                Escribe <span className="font-black text-rose-600 dark:text-rose-400">{tarifa.nombre}</span> para confirmar:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={tarifa.nombre}
                className={`w-full px-4 h-11 rounded-xl text-sm font-bold bg-slate-50 dark:bg-zinc-800 border-2 transition-colors focus:outline-none ${
                  confirmText.trim() === tarifa.nombre
                    ? "border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400"
                    : "border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200"
                }`}
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            disabled={eliminando}
            className="font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 rounded-xl px-6 h-10 text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={eliminar}
            disabled={confirmText.trim() !== tarifa.nombre || eliminando}
            className="inline-flex items-center gap-2 font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 rounded-xl px-6 h-10 text-sm shadow-sm transition-all active:scale-95"
          >
            {eliminando && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
            {eliminando ? "Eliminando..." : "Eliminar Tarifa"}
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
}
