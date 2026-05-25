import React, { useState, useEffect } from "react";
import { Modal } from "flowbite-react";
import { HiBan, HiExclamation, HiChat } from "react-icons/hi";

const premiumModalTheme = {
  root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" } },
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

const selectClasses = "w-full bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 h-11 text-sm font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 transition-all";

const ModalRealizarCorte = ({ isOpen, onClose, selectedDeudor, onSuccess }) => {
  const token = localStorage.getItem("token");
  const [motivo, setMotivo] = useState("Falta de pago");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && selectedDeudor) {
      setMotivo("Falta de pago");
      setObservaciones("");
      setLoading(false);
    }
  }, [isOpen, selectedDeudor]);

  if (!selectedDeudor) return null;

  const handleConfirm = async () => {
    if (!selectedDeudor.medidor?.id) {
      console.error("Error: medidor.id no está disponible", selectedDeudor);
      alert("Error: No se pudo obtener el ID del medidor");
      return;
    }
    if (!motivo) {
      alert("Por favor seleccione un motivo");
      return;
    }

    setLoading(true);
    const payload = { medidor_id: selectedDeudor.medidor.id, motivo, observaciones };
    console.log("Enviando corte con payload:", payload);

    try {
      const result = await window.api.deudores.ejecutarCorte(token, payload);
      console.log("Corte ejecutado exitosamente:", result);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error ejecutando corte:", error);
      alert(`Error al ejecutar el corte: ${error.message || "Error desconocido"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} theme={premiumModalTheme} dismissible>
      <Modal.Header>
        <div className="flex gap-3 items-center">
          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
            <HiBan className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
              Confirmar Corte
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
              Procedimiento de suspensión
            </p>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className="space-y-5">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800/30">
            <div className="flex gap-3">
              <HiExclamation className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <p className="font-bold text-red-800 dark:text-red-300 text-sm">¿ESTÁ SEGURO DE PROCEDER?</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 mb-2">
                  Se registrará el corte de servicio para:
                </p>
                <div className="bg-white dark:bg-zinc-800 p-2 rounded-lg border border-red-100 dark:border-red-900/50">
                  <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{selectedDeudor.cliente_nombre}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{selectedDeudor.direccion_cliente}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">
              Motivo del Corte
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className={selectClasses}
            >
              <option value="Falta de pago">Falta de pago</option>
              <option value="Incumplimiento de convenio">Incumplimiento de convenio</option>
              <option value="Toma clandestina">Toma clandestina</option>
              <option value="Solicitud del usuario">Solicitud del usuario</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">
              Observaciones
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-400">
                <HiChat className="w-5 h-5" />
              </span>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                placeholder="Detalles adicionales sobre la acción..."
                className="border border-slate-200 dark:border-zinc-800 bg-slate-100/70 dark:bg-zinc-900/80 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 text-sm font-medium text-slate-800 dark:text-zinc-100 resize-none transition-all"
              />
            </div>
          </div>
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
          onClick={handleConfirm}
          disabled={loading}
          className="font-bold bg-red-600 text-white rounded-xl px-8 h-11 shadow-sm flex items-center gap-2 disabled:opacity-70 shadow-red-500/30"
        >
          {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          <HiBan className="w-4 h-4" />
          {loading ? "Ejecutando..." : "Ejecutar Corte"}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalRealizarCorte;
