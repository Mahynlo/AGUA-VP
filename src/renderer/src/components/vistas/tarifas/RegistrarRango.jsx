import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import { HiDocumentText, HiPlus, HiTrash } from "react-icons/hi";
import { useState } from "react";
import { useTarifas } from "../../../context/TarifasContext";
import { usePermissions } from "../../../context/PermissionsContext";
import { useFeedback } from "../../../context/FeedbackContext";

export default function RegistrarRangoTarifa({ tarifaId }) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [rangos, setRangos] = useState([{ consumo_min: "", consumo_max: "", precio_por_m3: "" }]);
  const { setSuccess, setError } = useFeedback();
  const { can } = usePermissions();
  const canGestionarRangos = can("tarifas.modificar") || can("tarifas.crear");
  const [isSaving, setIsSaving] = useState(false);

  const { actualizarTarifas, tarifas } = useTarifas();

  // Obtener la tarifa seleccionada basada en el ID
  const tarifaSeleccionada = tarifas.find(tarifa => tarifa.id === tarifaId);

  const handleChange = (index, field, value) => {
    const nuevosRangos = [...rangos];
    nuevosRangos[index][field] = value;
    setRangos(nuevosRangos);
  };

  const agregarRango = () => {
    const ultimo = rangos[rangos.length - 1];
    if (!ultimo.consumo_min || !ultimo.consumo_max || !ultimo.precio_por_m3) {
      setError("Completa el rango actual antes de agregar otro.", "Registro de Rangos");
      return;
    }

    const yaExiste = rangos.some((r, idx) =>
      idx !== rangos.length - 1 &&
      r.consumo_min === ultimo.consumo_min &&
      r.consumo_max === ultimo.consumo_max &&
      r.precio_por_m3 === ultimo.precio_por_m3
    );
    if (yaExiste) {
      setError("Ese rango ya ha sido agregado.", "Registro de Rangos");
      return;
    }

    setError("");
    setRangos([...rangos, { consumo_min: "", consumo_max: "", precio_por_m3: "" }]);
  };

  // Función opcional para eliminar un rango si te equivocas (Mejora de UX)
  const eliminarRango = (indexToRemove) => {
    if (rangos.length === 1) return; // Siempre debe haber al menos uno
    setRangos(rangos.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!canGestionarRangos) {
      setError("No tienes permisos para registrar rangos de tarifa.", "Registro de Rangos");
      return;
    }

    setSuccess("");
    setError("");
    setIsSaving(true);

    // Preprocesar: convertir valores a numérico
    const parsedRangos = rangos.map((r, i) => ({
      index: i + 1,
      consumo_min: parseFloat(r.consumo_min),
      consumo_max: parseFloat(r.consumo_max),
      precio_por_m3: parseFloat(r.precio_por_m3),
    }));

    // Validaciones...
    for (const r of parsedRangos) {
      if (
        isNaN(r.consumo_min) || isNaN(r.consumo_max) || isNaN(r.precio_por_m3) ||
        r.consumo_min === "" || r.consumo_max === "" || r.precio_por_m3 === ""
      ) {
        setError("Todos los campos deben ser numéricos y no vacíos.", "Registro de Rangos");
        setIsSaving(false);
        return;
      }

      if (r.consumo_min < 0 || r.consumo_max < 0 || r.precio_por_m3 < 0) {
        setError("Los valores no pueden ser negativos.", "Registro de Rangos");
        setIsSaving(false);
        return;
      }

      if (r.consumo_min >= r.consumo_max) {
        setError(`El consumo mínimo debe ser menor que el máximo en el rango ${r.index}.`, "Registro de Rangos");
        setIsSaving(false);
        return;
      }
    }

    // Validación de duplicados
    const seen = new Set();
    for (const r of parsedRangos) {
      const key = `${r.consumo_min}-${r.consumo_max}`;
      if (seen.has(key)) {
        setError(`Rango duplicado [${r.consumo_min} - ${r.consumo_max}]`, "Registro de Rangos");
        setIsSaving(false);
        return;
      }
      seen.add(key);
    }

    // Validación de solapamientos
    const sorted = [...parsedRangos].sort((a, b) => a.consumo_min - b.consumo_min);
    for (let i = 0; i < sorted.length - 1; i++) {
      const actual = sorted[i];
      const siguiente = sorted[i + 1];

      if (actual.consumo_max >= siguiente.consumo_min) {
        setError(
          `El consumo máximo del rango ${actual.index} no debe solaparse con el rango ${siguiente.index}.`,
          "Registro de Rangos"
        );
        setIsSaving(false);
        return;
      }
    }

    // Validación de continuidad
    for (let i = 0; i < sorted.length - 1; i++) {
      const actual = sorted[i];
      const siguiente = sorted[i + 1];

      if (actual.consumo_max + 1 < siguiente.consumo_min) {
        setError(
          `Hay un hueco entre los rangos ${actual.index} y ${siguiente.index}.`,
          "Registro de Rangos"
        );
        setIsSaving(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");

      const response = await window.tarifasApp.registrarRangosTarifa({
        tarifaId,
        rangos: parsedRangos,
        token_session: token,
      });

      if (response.success) {
        setSuccess("Rangos registrados correctamente.", "Registro de Rangos");
        setTimeout(() => {
          onClose();
          actualizarTarifas();
          setIsSaving(false);
          // Limpiamos los rangos para la próxima vez
          setRangos([{ consumo_min: "", consumo_max: "", precio_por_m3: "" }]);
        }, 1500);
      } else {
        setError(response.message || "No se pudo registrar el rango.", "Registro de Rangos");
        setIsSaving(false);
      }
    } catch (err) {
      console.error(err);
      setError("Error al registrar el rango. Verifica la conexión.", "Registro de Rangos");
      setIsSaving(false);
    }
  };

  // Clases estandarizadas para inputs de tabla (Token 4)
  const getInputClasses = () => `
    w-full text-sm font-medium rounded-xl transition-all duration-200 resize-none px-3 h-11
    bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 
    hover:border-slate-300 dark:hover:border-zinc-700 focus:ring-2 focus:ring-slate-900/10 
    dark:focus:ring-zinc-100/10 focus:border-slate-400 dark:focus:border-zinc-500 
    text-slate-800 dark:text-zinc-100 focus:outline-none shadow-none text-center
  `;

  return (
    <>
      {/* Botón Disparador */}
      <Button 
        variant="flat" 
        onPress={onOpen} 
        isDisabled={!canGestionarRangos}
        className="font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-xl px-4 min-w-0"
        title="Nuevo Rango"
      >
        <HiPlus className="w-4 h-4 mr-1" /> Nuevo Rango
      </Button>

      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        onClose={onClose} 
        size="3xl"
        scrollBehavior="inside"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        /* Token 2: Modal Premium SaaS */
        classNames={{
          backdrop: "bg-slate-900/40 backdrop-blur-sm",
          base: "bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-2xl",
          header: "border-b border-slate-100 dark:border-zinc-800/50 pb-4 pt-6 px-8 flex flex-col gap-1",
          body: "px-8 py-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent",
          footer: "border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8",
          closeButton: "hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 text-slate-400 p-2 top-4 right-4"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              {/* ── HEADER ── */}
              <ModalHeader>
                <div className="flex items-center gap-4">
                  {/* Regla de tintes */}
                  <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                    <HiDocumentText className="w-6 h-6" />
                  </div>
                  <div>
                    {/* Token 3 */}
                    <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                      Registrar Rangos
                    </h2>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                      Tarifa: <span className="font-bold">{tarifaSeleccionada?.nombre || 'Seleccionada'}</span>
                    </p>
                  </div>
                </div>
              </ModalHeader>

              {/* ── BODY ── */}
              <ModalBody>
                <form 
                  id="form-registrar-rango" 
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-6"
                >
                  <div className="space-y-4">
                    {/* Token 3: Overlines */}
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                      Configuración de Bloques
                    </h3>
                    
                    {/* Tabla de Rangos - Token 6 */}
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr>
                            <th className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-3 px-2 w-12 text-center">#</th>
                            <th className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-3 px-2 text-center">Mínimo (m³)</th>
                            <th className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-3 px-2 text-center">Máximo (m³)</th>
                            <th className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-3 px-2 text-center">Precio ($/m³)</th>
                            <th className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-3 px-2 w-12"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {rangos.map((rango, index) => (
                            <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors border-b border-slate-100 dark:border-zinc-800/50">
                              {/* Índice */}
                              <td className="px-2 py-3 text-center">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">{index + 1}</span>
                              </td>
                              
                              {/* Consumo Mínimo */}
                              <td className="px-2 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={rango.consumo_min}
                                  onChange={(e) => handleChange(index, "consumo_min", e.target.value)}
                                  className={getInputClasses()}
                                  required
                                />
                              </td>

                              {/* Consumo Máximo */}
                              <td className="px-2 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={rango.consumo_max}
                                  onChange={(e) => handleChange(index, "consumo_max", e.target.value)}
                                  className={getInputClasses()}
                                  required
                                />
                              </td>

                              {/* Precio */}
                              <td className="px-2 py-3">
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={rango.precio_por_m3}
                                    onChange={(e) => handleChange(index, "precio_por_m3", e.target.value)}
                                    className={`${getInputClasses()} pl-7 text-left`}
                                    required
                                  />
                                </div>
                              </td>

                              {/* Botón Eliminar Fila */}
                              <td className="px-2 py-3 text-center">
                                {rangos.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => eliminarRango(index)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Eliminar rango"
                                  >
                                    <HiTrash className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="pt-2">
                      {/* Regla de Tintes: Acción secundaria */}
                      <Button
                        type="button"
                        onClick={agregarRango}
                        variant="flat"
                        className="w-full font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl h-11"
                        startContent={<HiPlus className="text-lg" />}
                      >
                        Añadir Nuevo Rango
                      </Button>
                    </div>
                  </div>
                </form>
              </ModalBody>

              {/* ── FOOTER ── */}
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={onClose}
                  isDisabled={isSaving}
                  className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6"
                >
                  Cancelar
                </Button>
                {/* Token 4: Botón Primario */}
                <Button
                  type="submit"
                  form="form-registrar-rango"
                  isDisabled={isSaving}
                  isLoading={isSaving}
                  className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-8 shadow-sm"
                >
                  {isSaving ? "Guardando..." : "Guardar Rangos"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

