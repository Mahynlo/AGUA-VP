import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
} from "@nextui-org/react";
import { useState, useEffect } from "react";
import { useAuth } from '../../../context/AuthContext';
import { useTarifas } from '../../../context/TarifasContext';
// Para manejar mensajes de éxito y error
import FeedbackMessages from "../../toast/FeedbackMessages.jsx";

export default function RegistrarTarifa({ onTarifaRegistrada }) {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const { user } = useAuth();
    const { actualizarTarifas } = useTarifas();

    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);


    //console.log("Usuario autenticado:", user.id, user.username, user.correo, user.rol);

    const id_usuario = user?.id || null; // Aseguramos que id_usuario sea null si no hay usuario autenticado


    // Reiniciar formulario al cerrar
    useEffect(() => {
        if (!isOpen) {
            setNombre("");
            setDescripcion("");
            setFechaInicio("");
            setFechaFin("");
            setSuccess("");
            setError("");
            setIsSaving(false);
        }
    }, [isOpen]);

    // Manejar el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccess("");
        setError("");
        setIsSaving(true); // Activar deshabilitación del botón correctamente

        if (!nombre || !fechaInicio) {
            setError("El nombre y la fecha de inicio son obligatorios.");
            setIsSaving(false); // Rehabilitar si hay error de validación
            return;
        }

        try {
            const token = localStorage.getItem("token");

            const response = await window.tarifasApp.registerTarifa({
                tarifa: {
                    nombre,
                    descripcion,
                    fecha_inicio: fechaInicio,
                    fecha_fin: fechaFin || null,
                    modificado_por: id_usuario,
                },
                token_session: token,
            });

            if (response.success) {
                setSuccess("Tarifa registrada correctamente.");
                onTarifaRegistrada?.();

                setTimeout(() => {
                    onClose();
                    actualizarTarifas();
                    setIsSaving(false); // Rehabilitar al finalizar
                }, 1500);
            } else {
                setError(response.message || "No se pudo registrar la tarifa.");
                setIsSaving(false); // Rehabilitar si la respuesta no fue exitosa
            }
        } catch (err) {
            console.error(err);
            setError("Error al registrar la tarifa. Verifica la conexión con el servidor.");
            setIsSaving(false); // Rehabilitar si ocurre una excepción
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
            <Button
                color="primary"
                className="ml-2 min-w-[50px] px-8 py-2"
                onPress={onOpen}
            >
                Nueva Tarifa
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
                                
                                Registrar Tarifa
                            </ModalHeader>
                            <ModalBody className="bg-gray-200 dark:bg-gray-800">
                                <FeedbackMessages
                                    success={success}
                                    error={error}
                                    setSuccess={setSuccess}
                                    setError={setError}
                                />
                                

                                <form onSubmit={handleSubmit} className="grid gap-4">
                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
                                            Nombre de la Tarifa
                                        </label>
                                        <input
                                            type="text"
                                            className="bg-gray-50 border rounded-xl dark:border-gray-600 text-gray-900 text-sm block w-full p-2.5 dark:bg-neutral-800 dark:text-white"
                                            value={nombre}
                                            onChange={(e) => setNombre(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
                                            Descripción
                                        </label>
                                        <textarea
                                            className="bg-gray-50 border h-32 rounded-xl dark:border-gray-600 text-gray-900 text-sm block w-full p-2.5 dark:bg-neutral-800 dark:text-white"
                                            value={descripcion}
                                            onChange={(e) => setDescripcion(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
                                            Fecha de Inicio
                                        </label>
                                        <input
                                            type="date"
                                            className="bg-gray-50 border rounded-xl dark:border-gray-600 text-gray-900 text-sm block w-full p-2.5 dark:bg-neutral-800 dark:text-white"
                                            value={fechaInicio}
                                            onChange={(e) => setFechaInicio(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
                                            Fecha de Fin (opcional)
                                        </label>
                                        <input
                                            type="date"
                                            className="bg-gray-50 border rounded-xl dark:border-gray-600 text-gray-900 text-sm block w-full p-2.5 dark:bg-neutral-800 dark:text-white"
                                            value={fechaFin}
                                            onChange={(e) => setFechaFin(e.target.value)}
                                        />
                                    </div>

                                </form>
                            </ModalBody>

                            <ModalFooter className="bg-gray-300 dark:bg-gray-700">
                                <Button
                                    color="primary"
                                    type="submit"
                                    onClick={handleSubmit}
                                    isDisabled={isSaving}
                                    className="bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-xl text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700"
                                >
                                    {isSaving ? "Registrando..." : "Registrar Tarifa"}
                                </Button>
                                <Button
                                    color="danger"
                                    variant="light"
                                    onPress={onClose}
                                    className="bg-red-700 hover:bg-red-800 text-white font-medium rounded-xl text-sm px-5 py-2.5"
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

