import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
} from "@nextui-org/react";
import { HiDocumentText, HiPlus, HiCheck, HiX, HiTrash } from "react-icons/hi";
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

    // Clases estandarizadas para los inputs de la tabla
    const inputClasses = `
        w-full text-sm font-medium rounded-xl transition-all duration-200 resize-none
        border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50
        focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-950
        px-3 py-2 text-slate-800 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 text-center
    `;

    return (
        <>
            {/* Botón Disparador */}
            <Button 
                color="secondary" 
                variant="solid"
                onPress={onOpen} 
                isDisabled={!canGestionarRangos}
                className="font-bold shadow-md shadow-secondary/30 ml-2 px-6"
                startContent={<HiPlus className="w-4 h-4" />}
            >
                Nuevo Rango
            </Button>

            <Modal 
                isOpen={isOpen} 
                onOpenChange={onOpenChange} 
                onClose={onClose} 
                size="3xl"
                scrollBehavior="inside"
                isDismissable={false}
                isKeyboardDismissDisabled={true}
                backdrop="blur"
                placement="center"
                classNames={{
                    base: "bg-white dark:bg-zinc-900 shadow-2xl",
          backdrop: "bg-zinc-900/50 backdrop-blur-sm",
          header: "border-b border-slate-100 dark:border-zinc-800",
          footer: "border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900",
          closeButton: "hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 text-slate-400 dark:text-zinc-500 transition-colors z-50",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            {/* ── HEADER ── */}
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                                        <HiDocumentText className="w-7 h-7" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <h2 className="text-xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
                                            Registrar Rangos
                                        </h2>
                                        <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                            Tarifa: {tarifaSeleccionada?.nombre || 'Seleccionada'}
                                        </p>
                                    </div>
                                </div>
                            </ModalHeader>

                            {/* ── BODY ── */}
                            <ModalBody>
                                <form 
                                    id="form-registrar-rango" 
                                    onSubmit={handleSubmit}
                                    className="flex flex-col gap-6 pb-2"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/50 pb-2">
                                            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-slate-500">1</span>
                                            <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                                Configuración de Bloques
                                            </h3>
                                        </div>
                                        
                                        {/* Tabla Moderna de Rangos */}
                                        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800">
                                                        <tr>
                                                            <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 w-12">#</th>
                                                            <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Mínimo (m³)</th>
                                                            <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Máximo (m³)</th>
                                                            <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Precio ($/m³)</th>
                                                            <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 w-12"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                                                        {rangos.map((rango, index) => (
                                                            <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                                                {/* Índice */}
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">{index + 1}</span>
                                                                </td>
                                                                
                                                                {/* Consumo Mínimo */}
                                                                <td className="px-4 py-3">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        placeholder="0.00"
                                                                        value={rango.consumo_min}
                                                                        onChange={(e) => handleChange(index, "consumo_min", e.target.value)}
                                                                        className={inputClasses}
                                                                        required
                                                                    />
                                                                </td>

                                                                {/* Consumo Máximo */}
                                                                <td className="px-4 py-3">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        placeholder="0.00"
                                                                        value={rango.consumo_max}
                                                                        onChange={(e) => handleChange(index, "consumo_max", e.target.value)}
                                                                        className={inputClasses}
                                                                        required
                                                                    />
                                                                </td>

                                                                {/* Precio */}
                                                                <td className="px-4 py-3">
                                                                    <div className="relative">
                                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            placeholder="0.00"
                                                                            value={rango.precio_por_m3}
                                                                            onChange={(e) => handleChange(index, "precio_por_m3", e.target.value)}
                                                                            className={`${inputClasses} pl-7`}
                                                                            required
                                                                        />
                                                                    </div>
                                                                </td>

                                                                {/* Botón Eliminar Fila (Aparece si hay más de 1 rango) */}
                                                                <td className="px-4 py-3 text-center">
                                                                    {rangos.length > 1 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => eliminarRango(index)}
                                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                                            
                                            {/* Footer de la tabla (Botón Agregar) */}
                                            <div className="p-3 bg-slate-50 dark:bg-zinc-800/30 border-t border-slate-100 dark:border-zinc-800">
                                                <Button
                                                    type="button"
                                                    onClick={agregarRango}
                                                    variant="flat"
                                                    className="w-full font-bold bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-800 shadow-sm"
                                                    startContent={<HiPlus className="w-4 h-4 text-blue-500" />}
                                                >
                                                    Añadir Nuevo Rango
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </ModalBody>

                            {/* ── FOOTER ── */}
                            <ModalFooter className="flex justify-end gap-3">
                                <Button
                                    variant="flat"
                                    onPress={onClose}
                                    isDisabled={isSaving}
                                    startContent={<HiX className="text-lg" />}
                                    className="font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 h-11 px-6"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    type="submit"
                                    form="form-registrar-rango"
                                    isDisabled={isSaving}
                                    isLoading={isSaving}
                                    startContent={!isSaving && <HiCheck className="text-lg" />}
                                    className="font-bold shadow-md shadow-blue-500/30 h-11 px-8"
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

