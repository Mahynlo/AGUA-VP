import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, Card, CardBody
} from "@nextui-org/react";
import { HiCurrencyDollar, HiPlus, HiDocumentText } from "react-icons/hi";
import { useState, useEffect } from "react";
import { useTarifas } from "../../../context/TarifasContext";

//para los iconos de los mensajes de feedback
import { useFeedback } from "../../../context/FeedbackContext";

export default function RegistrarRangoTarifa({ tarifaId }) {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const [rangos, setRangos] = useState([{ consumo_min: "", consumo_max: "", precio_por_m3: "" }]);
    const { setSuccess, setError } = useFeedback();
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

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} onClose={onClose} 
                size="3xl"
                scrollBehavior="inside"
                isDismissable={false}
                isKeyboardDismissDisabled={true}
                backdrop="blur"
                placement="center"
                classNames={{
                    backdrop: "bg-gradient-to-t mt-18 ml-24 from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
                    closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex items-center gap-2 text-xl font-bold">
                                <HiDocumentText className="w-6 h-6 text-green-600" />
                                Registrar Rangos - {tarifaSeleccionada?.nombre_tarifa || 'Tarifa'}
                            </ModalHeader>
                            <ModalBody className="space-y-4">


                                <Card className="border border-green-200 dark:border-green-800">
                                    <CardBody className="space-y-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <HiCurrencyDollar className="w-5 h-5 text-green-600" />
                                            Configuración de Rangos
                                        </h3>
                                        
                                        <form className="space-y-4"
                                            onSubmit={handleSubmit}
                                            id="form-registrar-rango"
                                        >
                                            <table className="min-w-full border-separate border-spacing-y-2">
                                                <thead>
                                                    <tr>
                                                        <th className="px-4 py-2 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                                            Consumo mínimo
                                                        </th>
                                                        <th className="px-4 py-2 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                                            Consumo máximo
                                                        </th>
                                                        <th className="px-4 py-2 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                                            Precio ($/m³)
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm">
                                                    {rangos.map((rango, index) => (
                                                        <tr key={index} className="bg-gray-50 dark:bg-neutral-800">
                                                            <td className="px-4 py-2">
                                                                <div className="flex items-center gap-2">
                                                                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                                                                        {index + 1}:
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        placeholder="Mín"
                                                                        value={rango.consumo_min}
                                                                        onChange={(e) => handleChange(index, "consumo_min", e.target.value)}
                                                                        className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-neutral-700 dark:text-white"
                                                                        required
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    placeholder="Máx"
                                                                    value={rango.consumo_max}
                                                                    onChange={(e) => handleChange(index, "consumo_max", e.target.value)}
                                                                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-neutral-700 dark:text-white"
                                                                    required
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    placeholder="$/m³"
                                                                    value={rango.precio_por_m3}
                                                                    onChange={(e) => handleChange(index, "precio_por_m3", e.target.value)}
                                                                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-neutral-700 dark:text-white"
                                                                    required
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>

                                            <div className="flex justify-center pt-4">
                                                <Button
                                                    type="button"
                                                    onClick={agregarRango}
                                                    color="success"
                                                    variant="flat"
                                                    startContent={<HiPlus className="h-4 w-4" />}
                                                    className="bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50"
                                                >
                                                    Agregar Rango
                                                </Button>
                                            </div>
                                        </form>
                                    </CardBody>
                                </Card>
                            </ModalBody>


                            <ModalFooter>
                                <Button
                                    color="danger"
                                    variant="light"
                                    onPress={onClose}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    type="submit"
                                    form="form-registrar-rango"
                                    isDisabled={isSaving}
                                    isLoading={isSaving}
                                >
                                    {isSaving ? "Registrando..." : "Registrar Rangos"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}

