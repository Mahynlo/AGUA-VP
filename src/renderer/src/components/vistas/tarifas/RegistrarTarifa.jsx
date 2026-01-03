import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Input,
    Textarea,
    Card,
    CardBody
} from "@nextui-org/react";
import { HiPlus, HiCurrencyDollar, HiCalendar, HiDocumentText } from "react-icons/hi";
import { useState, useEffect } from "react";
import { useAuth } from '../../../context/AuthContext';
import { useTarifas } from '../../../context/TarifasContext';
//para los iconos de los mensajes de feedback
import { useFeedback } from "../../../context/FeedbackContext";

export default function RegistrarTarifa({ onTarifaRegistrada }) {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const { user } = useAuth();
    const { actualizarTarifas } = useTarifas();

    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");

    const [isSaving, setIsSaving] = useState(false);
    const [erroresCampos, setErroresCampos] = useState({});
    const [mostrarErrores, setMostrarErrores] = useState(false);

    const { setSuccess, setError } = useFeedback();

    const id_usuario = user?.id || null;

    // Función para limpiar errores cuando el usuario empiece a escribir
    const limpiarError = (campo) => {
        if (erroresCampos[campo]) {
            setErroresCampos(prev => ({
                ...prev,
                [campo]: false
            }));
        }
    };

    // Función para manejar el cierre del modal y resetear estados
    const handleCloseModal = () => {
        setNombre("");
        setDescripcion("");
        setFechaInicio("");
        setFechaFin("");
        setErroresCampos({});
        setMostrarErrores(false);
        setIsSaving(false);
        onClose();
    };

    // Manejar el envío del formulario
    const handleSubmit = async (e) => {
        setSuccess("");
        setError("");
        setIsSaving(true);
        setMostrarErrores(true); // Activar la visualización de errores

        // Validaciones de campos específicas
        const nuevosErrores = {};
        if (!nombre) nuevosErrores.nombre = true;
        if (!descripcion) nuevosErrores.descripcion = true;
        if (!fechaInicio) nuevosErrores.fechaInicio = true;

        if (fechaFin && new Date(fechaFin) < new Date(fechaInicio)) {
            setError("La fecha de fin no puede ser anterior a la fecha de inicio.", "Registro de Tarifas");
            setIsSaving(false);
            return;
        }

        if (Object.keys(nuevosErrores).length > 0) {
            setErroresCampos(nuevosErrores);
            const camposFaltantes = Object.keys(nuevosErrores)
                .map((campo) => {
                    switch (campo) {
                        case "nombre": return "Nombre";
                        case "descripcion": return "Descripción";
                        case "fechaInicio": return "Fecha de Inicio";
                        default: return campo;
                    }
                });
            setError(`Los siguientes campos son obligatorios: ${camposFaltantes.join(", ")}`, "Registro de Tarifas");
            setIsSaving(false);
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
                setSuccess("Tarifa registrada correctamente.", "Registro de Tarifas");
                // Actualizar las tarifas en el contexto
                actualizarTarifas();
                // Ejecutar callback si se proporciona
                if (onTarifaRegistrada) onTarifaRegistrada();
                // Cerrar modal y limpiar estados
                handleCloseModal();
            } else {
                setError(response.message || "Error al registrar la tarifa.", "Registro de Tarifas");
            }
        } catch (error) {
            console.error("Error al registrar tarifa:", error);
            setError("Ocurrió un error inesperado al registrar la tarifa.", "Registro de Tarifas");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Button
                color="primary"
                startContent={<HiPlus className="w-4 h-4" />}
                onPress={onOpen}
            >
                Nueva Tarifa
            </Button>

            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                onClose={handleCloseModal}
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
                                <HiCurrencyDollar className="w-6 h-6 text-blue-600" />
                                Registrar Nueva Tarifa
                            </ModalHeader>
                            
                            <ModalBody className="space-y-4">
                                <form id="form-registrar-tarifa" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                                    
                                    {/* Información básica */}
                                    <Card className="border border-blue-200 dark:border-blue-800">
                                        <CardBody className="space-y-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <HiDocumentText className="w-5 h-5 text-green-600" />
                                                Información General
                                            </h3>
                                            
                                            {/* Nombre de la Tarifa con estilo personalizado */}
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Nombre de la Tarifa*
                                                </label>
                                                <div className="relative w-full flex">
                                                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                                                        <HiCurrencyDollar className="inline-block mr-1 h-5 w-5 text-green-600" />
                                                    </span>
                                                    <input
                                                        type="text"
                                                        placeholder="ej. Tarifa Residencial 2024"
                                                        value={nombre}
                                                        onChange={(e) => {
                                                            setNombre(e.target.value);
                                                            limpiarError('nombre');
                                                        }}
                                                        required
                                                        className={`border ${mostrarErrores && erroresCampos.nombre ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-600 focus:border-green-500'} text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200`}
                                                    />
                                                </div>
                                                {mostrarErrores && erroresCampos.nombre && (
                                                    <p className="text-sm text-red-500 mt-1">El nombre de la tarifa es requerido</p>
                                                )}
                                            </div>
                                            
                                            {/* Descripción con estilo personalizado */}
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Descripción*
                                                </label>
                                                <textarea
                                                    placeholder="Describe el propósito y características de esta tarifa..."
                                                    value={descripcion}
                                                    onChange={(e) => {
                                                        setDescripcion(e.target.value);
                                                        limpiarError('descripcion');
                                                    }}
                                                    required
                                                    rows={3}
                                                    className={`border ${mostrarErrores && erroresCampos.descripcion ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-600 focus:border-green-500'} text-gray-600 rounded-xl pl-4 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white resize-none transition-all duration-200`}
                                                />
                                                {mostrarErrores && erroresCampos.descripcion && (
                                                    <p className="text-sm text-red-500 mt-1">La descripción es requerida</p>
                                                )}
                                            </div>
                                        </CardBody>
                                    </Card>

                                    {/* Período de vigencia */}
                                    <Card className="border border-green-200 dark:border-green-800 mt-2">
                                        <CardBody className="space-y-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <HiCalendar className="w-5 h-5 text-green-600" />
                                                Período de Vigencia
                                            </h3>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                {/* Fecha de Inicio con estilo personalizado */}
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Fecha de Inicio*
                                                    </label>
                                                    <div className="relative w-full flex">
                                                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                                                            <HiCalendar className="inline-block mr-1 h-5 w-5 text-green-600" />
                                                        </span>
                                                        <input
                                                            type="date"
                                                            value={fechaInicio}
                                                            onChange={(e) => {
                                                                setFechaInicio(e.target.value);
                                                                limpiarError('fechaInicio');
                                                            }}
                                                            required
                                                            className={`border ${mostrarErrores && erroresCampos.fechaInicio ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-600 focus:border-green-500'} text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200`}
                                                        />
                                                    </div>
                                                    {mostrarErrores && erroresCampos.fechaInicio && (
                                                        <p className="text-sm text-red-500 mt-1">La fecha de inicio es requerida</p>
                                                    )}
                                                </div>
                                                
                                                {/* Fecha de Fin con estilo personalizado */}
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Fecha de Fin (opcional)
                                                    </label>
                                                    <div className="relative w-full flex">
                                                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                                                            <HiCalendar className="inline-block mr-1 h-5 w-5 text-green-600" />
                                                        </span>
                                                        <input
                                                            type="date"
                                                            value={fechaFin}
                                                            onChange={(e) => setFechaFin(e.target.value)}
                                                            className="border border-gray-300 focus:ring-green-600 focus:border-green-500 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200"
                                                        />
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dejar vacío para tarifa indefinida</p>
                                                </div>
                                            </div>
                                            
                                            {fechaFin && fechaInicio && (
                                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                                    <p className="text-sm text-blue-600 dark:text-blue-400">
                                                        ℹ️ Duración: {Math.ceil((new Date(fechaFin) - new Date(fechaInicio)) / (1000 * 60 * 60 * 24))} días
                                                    </p>
                                                </div>
                                            )}
                                        </CardBody>
                                    </Card>
                                </form>
                            </ModalBody>
                            
                            <ModalFooter>
                                <Button
                                    color="danger"
                                    variant="light"
                                    onPress={handleCloseModal}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    type="submit"
                                    onClick={handleSubmit}
                                    isDisabled={isSaving}
                                    isLoading={isSaving}
                                >
                                    {isSaving ? "Registrando..." : "Crear Tarifa"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
