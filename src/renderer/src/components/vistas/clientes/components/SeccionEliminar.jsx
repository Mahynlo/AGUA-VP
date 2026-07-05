import React from "react";
import { Card, CardBody, Button, Tooltip } from "@nextui-org/react";
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
    <Card className="border border-red-200 dark:border-red-800 mt-2">
      <CardBody className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <HiTrash className="w-5 h-5 text-red-600" />
          Zona de Peligro
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Esta acción desactiva el cliente y lo envía a la papelera. Se conservará su historial de pagos y consumo de agua.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1.5 block">
              Motivo de la desactivación (mínimo 10 caracteres)
              {razon.trim().length < 10 ? (
                <span className="text-red-500 ml-2 font-extrabold">(Faltan {10 - razon.trim().length} caract.)</span>
              ) : (
                <span className="text-emerald-500 ml-2 font-extrabold">✓ Completo</span>
              )}
            </label>
            <textarea
              placeholder="Ingrese el motivo o razón por la cual se desactiva al cliente..."
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
              className="w-full px-4 py-3 text-sm font-medium rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 min-h-[80px]"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-red-50/50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={confirmacion} 
                onChange={(e) => setConfirmacion(e.target.checked)}
                className="w-5 h-5 rounded text-red-600 focus:ring-red-500 border-red-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 cursor-pointer"
              />
              <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                Confirmo que deseo desactivar este cliente
              </span>
            </label>
            <Tooltip color="danger" content="Desactivar Cliente" delay={1000}>
              <Button 
                color="danger" 
                variant="bordered"
                startContent={<HiTrash className="w-4 h-4" />}
                onPress={handleEliminar}
                isDisabled={!confirmacion || razon.trim().length < 10}
              >
                Desactivar Cliente
              </Button>
            </Tooltip>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          ⚠️ El medidor asociado quedará liberado. El historial financiero y de lecturas se mantendrá intacto en el sistema.
        </p>
      </CardBody>
    </Card>
  );
};

export default SeccionEliminar;
