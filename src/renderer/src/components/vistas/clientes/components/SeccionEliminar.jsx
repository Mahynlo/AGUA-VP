import React from "react";
import { Button, Tooltip } from "@heroui/react";
import { HiTrash } from "react-icons/hi";
import { useFeedback } from "../../../../context/FeedbackContext";

export const SeccionEliminar = ({ clienteId, onEliminar }) => {
  const [confirmacion, setConfirmacion] = React.useState(false);
  const [razon, setRazon] = React.useState("");
  const { setError } = useFeedback();

  const handleEliminar = () => {
    if (!confirmacion) {
      setError("Debes confirmar que deseas desactivar/eliminar este cliente", "Desactivar Cliente");
      return;
    }
    if (razon.trim().length < 10) {
      setError("Debes proporcionar un motivo de al menos 10 caracteres", "Desactivar Cliente");
      return;
    }
    onEliminar?.(clienteId, razon);
  };

  return (
    <div className="rounded-2xl border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/10 p-6 space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-rose-200/60 dark:border-rose-900/40">
        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
          <HiTrash className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-sm text-rose-700 dark:text-rose-400 uppercase tracking-wider leading-none">
            Zona de Peligro
          </h3>
          <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
            Desactivación y traslado a la papelera del cliente
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
        Esta acción desactiva al cliente y lo envía a la papelera. Se conservará su historial de pagos y consumo de agua.
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">
            Motivo de la desactivación (mínimo 10 caracteres)
            {razon.trim().length < 10 ? (
              <span className="text-rose-500 ml-2 font-extrabold">(Faltan {10 - razon.trim().length} caract.)</span>
            ) : (
              <span className="text-emerald-500 ml-2 font-extrabold">✓ Completo</span>
            )}
          </label>
          <textarea
            placeholder="Ingrese el motivo o razón por la cual se desactiva al cliente..."
            value={razon}
            onChange={(e) => setRazon(e.target.value)}
            className="w-full px-4 py-3 text-sm font-medium rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 min-h-[80px]"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-900/60 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={confirmacion} 
              onChange={(e) => setConfirmacion(e.target.checked)}
              className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 border-rose-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 cursor-pointer"
            />
            <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
              Confirmo que deseo desactivar este cliente
            </span>
          </label>
          <Tooltip color="danger" content="Desactivar Cliente" delay={1000}>
            <Button 
              color="danger" 
              variant="ghost"
              className="font-bold bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400"
              onPress={handleEliminar}
              isDisabled={!confirmacion || razon.trim().length < 10}
            >
              <HiTrash className="w-4 h-4" />
              Desactivar Cliente
            </Button>
          </Tooltip>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-zinc-500">
        ⚠️ El medidor asociado quedará liberado. El historial financiero y de lecturas se mantendrá intacto en el sistema.
      </p>
    </div>
  );
};

export default SeccionEliminar;
