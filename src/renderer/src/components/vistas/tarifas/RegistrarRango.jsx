import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure
} from "@nextui-org/react";
import { useState, useEffect } from "react";
import { useTarifas } from "../../../context/TarifasContext";

//para los iconos de los mensajes de feedback
import { useFeedback } from "../../../context/FeedbackContext";

export default function RegistrarRangoTarifa({ tarifaId }) {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const [rangos, setRangos] = useState([{ consumo_min: "", consumo_max: "", precio_por_m3: "" }]);
    const { setSuccess, setError } = useFeedback();
    const [isSaving, setIsSaving] = useState(false);

    const { actualizarTarifas } = useTarifas();


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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccess("");
        setError("");
        setIsSaving(true);

        // Preprocesar: convertir valores a numérico
        const parsedRangos = rangos.map((r, i) => ({
            index: i + 1, // para mensajes
            consumo_min: parseFloat(r.consumo_min),
            consumo_max: parseFloat(r.consumo_max),
            precio_por_m3: parseFloat(r.precio_por_m3),
        }));

        // Validaciones de campos vacíos o no numéricos
        for (const r of parsedRangos) {
            if (
                isNaN(r.consumo_min) || isNaN(r.consumo_max) || isNaN(r.precio_por_m3) ||
                r.consumo_min === "" || r.consumo_max === "" || r.precio_por_m3 === ""
            ) {
                setError("Todos los campos deben ser numéricos y no vacíos.(Advertencia-FNED)", "Registro de Rangos");
                setIsSaving(false);
                return;
            }

            if (r.consumo_min < 0 || r.consumo_max < 0 || r.precio_por_m3 < 0) {
                setError("Los valores no pueden ser negativos.(Advertencia-FNED)", "Registro de Rangos");
                setIsSaving(false);
                return;
            }

            if (r.consumo_min >= r.consumo_max) {
                setError(`El consumo mínimo debe ser menor que el máximo en el rango ${r.index}.(Advertencia-FNED)`, "Registro de Rangos");
                setIsSaving(false);
                return;
            }
        }

        // Validación de duplicados exactos
        const seen = new Set();
        for (const r of parsedRangos) {
            const key = `${r.consumo_min}-${r.consumo_max}`;
            if (seen.has(key)) {
                setError(`Rango duplicado [${r.consumo_min} - ${r.consumo_max}] (Advertencia-FNED)`, "Registro de Rangos");
                setIsSaving(false);
                return;
            }
            seen.add(key);
        }

        // Validación de solapamientos o contacto entre rangos
        const sorted = [...parsedRangos].sort((a, b) => a.consumo_min - b.consumo_min);
        for (let i = 0; i < sorted.length - 1; i++) {
            const actual = sorted[i];
            const siguiente = sorted[i + 1];

            if (actual.consumo_max >= siguiente.consumo_min) {
                setError(
                    `El consumo máximo del rango ${actual.index} no debe solaparse ni tocar el mínimo del rango ${siguiente.index}.(Advertencia-FNED)`,
                    "Registro de Rangos"
                );
                setIsSaving(false);
                return;
            }
        }

        // (Opcional) Validación de continuidad: detectar huecos
        for (let i = 0; i < sorted.length - 1; i++) {
            const actual = sorted[i];
            const siguiente = sorted[i + 1];

            if (actual.consumo_max + 1 < siguiente.consumo_min) {
                setError(
                    `Hay un hueco entre los rangos ${actual.index} y ${siguiente.index}.(Advertencia-FNED)`,
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
                setSuccess("Rangos registrados correctamente.(Sheck-FNED)", "Registro de Rangos");
                setTimeout(() => {
                    onClose();
                    actualizarTarifas();
                    setIsSaving(false);
                }, 1500);
            } else {
                setError(response.message || "No se pudo registrar el rango.(Error-FNED)", "Registro de Rangos");
                setIsSaving(false);
            }
        } catch (err) {
            console.error(err);
            setError("Error al registrar el rango. Verifica la conexión.", "Registro de Rangos");
            setIsSaving(false);
        }
    };



    return (
        <>
            <Button color="secondary" onPress={onOpen} className="ml-2 px-8 py-2">
                Nuevo Rango
            </Button>

            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                size="2xl"
                scrollBehavior="inside"
                isDismissable={false}
                isKeyboardDismissDisabled={true}
                classNames={{
                    header: "dark:border-b border-b border-gray-400 dark:border-[#6879bd]",
                    footer: "dark:border-t border-t border-gray-400 dark:border-[#6879bd]",
                    closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
                }}
                backdrop="transparent"
            //boton de cerrar modal estilo
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="text-2xl font-bold text-gray-900 bg-gray-300 dark:bg-gray-700 dark:text-white">
                                Registrar Rango
                            </ModalHeader>
                            <ModalBody className="bg-gray-200 dark:bg-gray-800">


                                <form id="form-registrar-rango" onSubmit={handleSubmit} className="space-y-6 mt-20 dark:text-white dark:bg-gray-800">
                                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                                        <thead>
                                            <tr>
                                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white">Consumo mínimo (m³)</th>
                                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white">Consumo máximo (m³)</th>
                                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white">Precio unitario ($/m³)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {rangos.map((rango, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="input-style w-full dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                            value={rango.consumo_min}
                                                            onChange={(e) => handleChange(index, "consumo_min", e.target.value)}
                                                            required
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="input-style w-full dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                            value={rango.consumo_max}
                                                            onChange={(e) => handleChange(index, "consumo_max", e.target.value)}
                                                            required
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="input-style w-full dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                            value={rango.precio_por_m3}
                                                            onChange={(e) => handleChange(index, "precio_por_m3", e.target.value)}
                                                            required
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <Button color="primary" type="button" onClick={agregarRango} className="text-white bg-green-600">
                                        + Agregar Rango
                                    </Button>
                                </form>
                            </ModalBody>


                            <ModalFooter className="bg-gray-300 dark:bg-gray-700">
                                <Button
                                    color="primary"
                                    type="submit"
                                    form="form-registrar-rango"
                                    onClick={handleSubmit}
                                    isDisabled={isSaving}
                                    className="bg-blue-700 text-white"
                                >
                                    {isSaving ? "Registrando..." : "Registrar Rangos"}
                                </Button>
                                <Button
                                    color="danger"
                                    variant="light"
                                    onPress={onClose}
                                    className="bg-red-700 text-white"
                                >
                                    Cancelar
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}

