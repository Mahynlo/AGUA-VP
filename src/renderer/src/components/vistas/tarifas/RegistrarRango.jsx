import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure
} from "@nextui-org/react";
import { useState, useEffect } from "react";

// Para manejar mensajes de éxito y error
import FeedbackMessages from "../../toast/FeedbackMessages.jsx";

export default function RegistrarRangoTarifa({ tarifaId, onRangoRegistrado }) {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const [rangos, setRangos] = useState([{ consumo_min: "", consumo_max: "", precio_por_m3: "" }]);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setRangos([{ consumo_min: "", consumo_max: "", precio_por_m3: "" }]);
            setSuccess("");
            setError("");
            setIsSaving(false);
        }
    }, [isOpen]);

    const handleChange = (index, field, value) => {
        const nuevosRangos = [...rangos];
        nuevosRangos[index][field] = value;
        setRangos(nuevosRangos);
    };

    const agregarRango = () => {
        const ultimo = rangos[rangos.length - 1];
        if (!ultimo.consumo_min || !ultimo.consumo_max || !ultimo.precio_por_m3) {
            setError("Completa el rango actual antes de agregar otro.");
            return;
        }

        const yaExiste = rangos.some((r, idx) =>
            idx !== rangos.length - 1 &&
            r.consumo_min === ultimo.consumo_min &&
            r.consumo_max === ultimo.consumo_max &&
            r.precio_por_m3 === ultimo.precio_por_m3
        );
        if (yaExiste) {
            setError("Ese rango ya ha sido agregado.");
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

        for (const rango of rangos) {
            if (
                rango.consumo_min === "" ||
                rango.consumo_max === "" ||
                rango.precio_por_m3 === "" ||
                isNaN(rango.consumo_min) ||
                isNaN(rango.consumo_max) ||
                isNaN(rango.precio_por_m3)
            ) {
                setError("Todos los campos de cada rango deben ser numéricos y no vacíos.");
                setIsSaving(false);
                return;
            }
        }

        try {
            const token = localStorage.getItem("token");

            const response = await window.tarifasApp.registrarRangosTarifa({
                tarifaId,
                rangos: rangos.map((r) => ({
                    consumo_min: parseFloat(r.consumo_min),
                    consumo_max: parseFloat(r.consumo_max),
                    precio_por_m3: parseFloat(r.precio_por_m3),
                })),
                token_session: token,
            });

            if (response.success) {
                setSuccess("Rangos registrados correctamente.");
                onRangoRegistrado?.();

                setTimeout(() => {
                    onClose();
                    setIsSaving(false);
                }, 1500);
            } else {
                setError(response.message || "No se pudo registrar el rango.");
                setIsSaving(false);
            }
        } catch (err) {
            console.error(err);
            setError("Error al registrar el rango. Verifica la conexión.");
            setIsSaving(false);
        }
    };

    useEffect(() => { //use effect para ocultar mensajes de éxito o error después de 10 segundos
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess(null);
                setError(null);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

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
                    {() => (
                        <>
                            <ModalHeader className="text-2xl font-bold text-gray-900 bg-gray-300 dark:bg-gray-700 dark:text-white">
                                Registrar Rango
                            </ModalHeader>
                            <ModalBody className="bg-gray-200 dark:bg-gray-80">
                            <FeedbackMessages
                                success={success}
                                error={error}
                                setSuccess={setSuccess}
                                setError={setError}
                            />

                                <form onSubmit={handleSubmit} className="space-y-6 mt-20">
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
                                                            className="input-style w-full"
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
                                                            className="input-style w-full"
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
                                                            className="input-style w-full"
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

