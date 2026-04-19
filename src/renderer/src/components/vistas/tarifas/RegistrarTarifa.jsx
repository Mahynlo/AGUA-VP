import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure
} from "@nextui-org/react";
import { HiCurrencyDollar, HiPlus, HiCheck, HiX, HiCalendar } from "react-icons/hi";
import { useState } from "react";
import { useAuth } from '../../../context/AuthContext';
import { useTarifas } from '../../../context/TarifasContext';
import { usePermissions } from '../../../context/PermissionsContext';
import { useFeedback } from "../../../context/FeedbackContext";

export default function RegistrarTarifa({ onTarifaRegistrada }) {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const { user } = useAuth();
    const { actualizarTarifas } = useTarifas();
    const { can } = usePermissions();
    const canCrearTarifas = can("tarifas.crear");

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
        if (e) e.preventDefault();
        if (!canCrearTarifas) {
            setError("No tienes permisos para crear tarifas.", "Registro de Tarifas");
            return;
        }

        setSuccess("");
        setError("");
        setIsSaving(true);
        setMostrarErrores(true);

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
            const camposFaltantes = Object.keys(nuevosErrores).map((campo) => {
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
                actualizarTarifas();
                if (onTarifaRegistrada) onTarifaRegistrada();
                setTimeout(() => {
                    handleCloseModal();
                }, 1000); // Pequeño delay para que vea el mensaje de éxito
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

    // Clases estandarizadas para los inputs para mantener el diseño limpio
    const inputClasses = (hasError) => `
        w-full text-sm font-medium rounded-xl transition-all duration-200 resize-none
        border focus:outline-none focus:ring-2 px-4 py-2.5 bg-white dark:bg-zinc-900
        ${hasError 
            ? 'border-red-300 dark:border-red-800 focus:ring-red-500/50 focus:border-red-500' 
            : 'border-slate-200 dark:border-zinc-700 focus:ring-blue-500/50 focus:border-blue-500 dark:text-zinc-100 hover:border-blue-300 dark:hover:border-zinc-500'
        }
    `;

    return (
        <>
            <Button
                aria-label="Registrar Tarifa"
                variant="solid"
                color="primary" // Usamos primary al igual que en Clientes si prefieres unificar el color base
                startContent={<HiPlus className="text-lg" />}
                className="font-bold shadow-md shadow-blue-600/30"
                onPress={onOpen}
                isDisabled={!canCrearTarifas}
            >
                Nueva Tarifa
            </Button>

            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                onClose={handleCloseModal}
                size="3xl" // Un poco más pequeño que Clientes porque tiene menos campos, pero misma estructura
                backdrop="blur"
                scrollBehavior="inside"
                isDismissable={false}
                isKeyboardDismissDisabled={true}
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
                    {() => (
                        <>
                            {/* HEADER - Exactamente igual a Clientes */}
                            <ModalHeader className="flex flex-col gap-1 pt-6 px-6 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                                        <HiCurrencyDollar className="w-7 h-7" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                                            Registrar Nueva Tarifa
                                        </h2>
                                        <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-1">
                                            Estructura de cobro y vigencia
                                        </p>
                                    </div>
                                </div>
                            </ModalHeader>

                            {/* BODY - Fondo grisáceo y scrollbar, igual a Clientes */}
                            <ModalBody className="py-6 px-4 sm:px-6 bg-slate-50/50 dark:bg-black/10 custom-scrollbar">
                                <form 
                                    id="form-registro-tarifa" 
                                    onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} 
                                    className="flex flex-col gap-6"
                                >
                                    {/* SECCIÓN 1: Información General */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/50 pb-2">
                                            <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-slate-500">1</span>
                                            <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                                Información General
                                            </h3>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                                            <div>
                                                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5 block">
                                                    Nombre de la Tarifa <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                        <HiCurrencyDollar className="w-5 h-5" />
                                                    </span>
                                                    <input
                                                        type="text"
                                                        placeholder="ej. Tarifa Residencial 2024"
                                                        value={nombre}
                                                        onChange={(e) => {
                                                            setNombre(e.target.value);
                                                            limpiarError('nombre');
                                                        }}
                                                        className={`${inputClasses(mostrarErrores && erroresCampos.nombre)} pl-10`}
                                                    />
                                                </div>
                                                {mostrarErrores && erroresCampos.nombre && (
                                                    <p className="text-xs text-red-500 mt-1">Requerido</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5 block">
                                                    Descripción <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    placeholder="Describe el propósito y características..."
                                                    value={descripcion}
                                                    onChange={(e) => {
                                                        setDescripcion(e.target.value);
                                                        limpiarError('descripcion');
                                                    }}
                                                    rows={3}
                                                    className={inputClasses(mostrarErrores && erroresCampos.descripcion)}
                                                />
                                                {mostrarErrores && erroresCampos.descripcion && (
                                                    <p className="text-xs text-red-500 mt-1">Requerida</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECCIÓN 2: Vigencia */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/50 pb-2">
                                            <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-slate-500">2</span>
                                            <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                                Período de Vigencia
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                                            <div>
                                                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5 block">
                                                    Fecha de Inicio <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                        <HiCalendar className="w-5 h-5" />
                                                    </span>
                                                    <input
                                                        type="date"
                                                        value={fechaInicio}
                                                        onChange={(e) => {
                                                            setFechaInicio(e.target.value);
                                                            limpiarError('fechaInicio');
                                                        }}
                                                        className={`${inputClasses(mostrarErrores && erroresCampos.fechaInicio)} pl-10`}
                                                    />
                                                </div>
                                                {mostrarErrores && erroresCampos.fechaInicio && (
                                                    <p className="text-xs text-red-500 mt-1">Requerida</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5 block">
                                                    Fecha de Fin <span className="font-normal text-slate-400">(Opcional)</span>
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                        <HiCalendar className="w-5 h-5" />
                                                    </span>
                                                    <input
                                                        type="date"
                                                        value={fechaFin}
                                                        onChange={(e) => setFechaFin(e.target.value)}
                                                        className={`${inputClasses(false)} pl-10`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </ModalBody>

                            {/* FOOTER - Exactamente igual a Clientes */}
                            <ModalFooter className="px-6 py-4">
                                <Button
                                    color="default"
                                    variant="light"
                                    onPress={handleCloseModal}
                                    isDisabled={isSaving}
                                    startContent={<HiX className="text-lg" />}
                                    className="font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    type="submit"
                                    form="form-registro-tarifa"
                                    isDisabled={isSaving}
                                    isLoading={isSaving}
                                    startContent={!isSaving && <HiCheck className="text-lg" />}
                                    className="font-bold shadow-md shadow-blue-500/30 px-6"
                                >
                                    {isSaving ? "Registrando..." : "Guardar Tarifa"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}