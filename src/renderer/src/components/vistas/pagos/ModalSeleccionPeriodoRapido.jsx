import { Modal } from "flowbite-react";
import SelectorPeriodoAvanzado from "../../ui/SelectorPeriodoAvanzado";

const premiumModalTheme = {
  root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80 mt-10", off: "hidden" } },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-lg w-full"
  },
  header: {
    base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/50 px-8 py-6 rounded-t-2xl shrink-0",
    close: { base: "absolute top-6 right-6 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
  },
  body: { base: "px-8 py-6 flex-1 overflow-y-auto" },
  footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8 rounded-b-2xl shrink-0" }
};

const ModalSeleccionPeriodoRapido = ({
  isOpen,
  onClose,
  periodo,
  onChangePeriodo,
  onConfirmar,
  formatearPeriodo
}) => {
  return (
    <Modal show={isOpen} onClose={onClose} theme={premiumModalTheme} dismissible>
      <Modal.Header>
        <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
          Modo rápido de pagos
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
          Selecciona el periodo para aplicar pagos masivos
        </p>
      </Modal.Header>

      <Modal.Body>
        <div className="space-y-4">
          <SelectorPeriodoAvanzado
            value={periodo}
            onChange={onChangePeriodo}
            placeholder="Buscar y seleccionar período"
            startYear={2020}
            size="sm"
            className="w-full"
          />
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Periodo seleccionado:{" "}
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {formatearPeriodo(periodo)}
            </span>
          </p>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          onClick={onClose}
          className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6 h-11"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirmar}
          className="font-bold bg-emerald-600 text-white rounded-xl px-8 h-11 shadow-sm"
        >
          Continuar
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalSeleccionPeriodoRapido;
