import { EditIcon } from "../../../IconsApp/IconsClientes";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Tooltip
} from "@nextui-org/react";
import { HiPencil, HiCheck } from "react-icons/hi";
import { useClienteForm } from "../../../hooks/useClienteForm";
import { usePermissions } from "../../../context/PermissionsContext";
import { useFeedback } from "../../../context/FeedbackContext";
import SeccionPersonal from "./components/SeccionPersonal";
import SeccionDireccion from "./components/SeccionDireccion";
import SeccionTarifa from "./components/SeccionTarifa";
import SeccionMedidor from "./components/SeccionMedidor";
import SeccionEliminar from "./components/SeccionEliminar";
import InfoRegistro from "./components/InfoRegistro";

export default function EditarClientes({ id }) {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const { can } = usePermissions();
    const { setError } = useFeedback();
    const canModificarClientes = can("clientes.modificar");

    // Usar el hook personalizado
    const {
        formData,
        erroresCampos,
        mostrarErrores,
        isUpdating,
        fechaRegistroCliente,
        cliente,
        handleChange,
        handleSubmit,
        limpiarError,
        resetForm,
        handleLiberarMedidores,
        handleMedidorSeleccionado
    } = useClienteForm(id);

    // Función para manejar el cierre del modal
    const handleCloseModal = () => {
        resetForm();
        onClose();
    };

    // Manejar actualización del cliente
    const handleActualizarCliente = async () => {
        if (!canModificarClientes) {
            setError("No tienes permisos para modificar clientes.", "Actualización de Cliente");
            return;
        }

        const result = await handleSubmit();
        
        if (result.success) {
            setTimeout(() => {
                handleCloseModal();
            }, 2000);
        }
    };

    return (
        <>
            <Tooltip 
                color="foreground" 
                content="Editar Cliente" 
                delay={500} 
                closeDelay={0}
                classNames={{
                    base: "font-bold text-xs rounded-lg shadow-xl",
                }}
            >
                <Button
                    isIconOnly
                    aria-label="Editar"
                    variant="flat"
                    onPress={onOpen}
                    isDisabled={!canModificarClientes}
                    className="bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all active:scale-95 rounded-xl"
                >
                    <EditIcon />
                </Button>
            </Tooltip>

            {/* Token 2: Modal Base Premium SaaS */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                size="4xl"
                backdrop="blur"
                scrollBehavior="inside"
                isDismissable={false}
                isKeyboardDismissDisabled={true}
                placement="center"
                classNames={{
                    backdrop: "bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm",
                    base: "bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-2xl",
                    header: "border-b border-slate-100 dark:border-zinc-800/80 px-8 py-6",
                    body: "px-8 py-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent",
                    footer: "border-t border-slate-100 dark:border-zinc-800/80 px-8 py-6",
                    closeButton: "hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 text-slate-400 p-2 top-6 right-6 rounded-xl transition-colors",
                }}
            >
                <ModalContent>
                    {() => (
                        <>
                            {/* ── HEADER DEL MODAL ── */}
                            <ModalHeader className="flex flex-col gap-1 shrink-0">
                                <div className="flex items-center gap-4">
                                    {/* Regla de Tintes: Azul Corporativo para Clientes */}
                                    <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                                        <HiPencil className="w-7 h-7" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        {/* Token 3: Textos Principales */}
                                        <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                                            {id ? "Editar Cliente" : "Registrar Cliente"}
                                        </h2>
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mt-1">
                                            Actualizar Información y Medidores
                                        </p>
                                    </div>
                                </div>
                            </ModalHeader>
                            
                            {/* ── CUERPO DEL MODAL (FORMULARIO) ── */}
                            <ModalBody>
                                <form 
                                    id="form-editar-cliente" 
                                    onSubmit={(e) => { e.preventDefault(); handleActualizarCliente(); }}
                                    className="flex flex-col gap-8" // Aumentado el gap a 8 para respiración
                                >
                                    {/* Información Personal */}
                                    <SeccionPersonal
                                        formData={formData}
                                        erroresCampos={erroresCampos}
                                        mostrarErrores={mostrarErrores}
                                        onChange={handleChange}
                                        limpiarError={limpiarError}
                                    />

                                    {/* Dirección */}
                                    <SeccionDireccion
                                        formData={formData}
                                        erroresCampos={erroresCampos}
                                        mostrarErrores={mostrarErrores}
                                        onChange={handleChange}
                                        limpiarError={limpiarError}
                                    />

                                    {/* Tarifa */}
                                    <SeccionTarifa
                                        formData={formData}
                                        erroresCampos={erroresCampos}
                                        mostrarErrores={mostrarErrores}
                                        onChange={handleChange}
                                        limpiarError={limpiarError}
                                        modo="editar"
                                        tarifaIdOriginal={cliente?.id_tarifa || cliente?.tarifa_id}
                                    />

                                    {/* Medidor */}
                                    <SeccionMedidor
                                        clienteId={id}
                                        medidorAsignado={formData.medidorAsignado}
                                        onLiberarMedidor={handleLiberarMedidores}
                                        onMedidorSeleccionado={handleMedidorSeleccionado}
                                    />

                                    {/* Info de Registro */}
                                    <InfoRegistro fechaRegistroCliente={fechaRegistroCliente} />

                                    {/* Eliminar Cliente */}
                                    <SeccionEliminar clienteId={id} />
                                    
                                </form>
                            </ModalBody>
                            
                            {/* ── FOOTER Y ACCIONES ── */}
                            <ModalFooter className="flex justify-end gap-3">
                                <Button
                                    variant="light"
                                    onPress={handleCloseModal}
                                    isDisabled={isUpdating}
                                    className="font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl h-11 px-6"
                                >
                                    Cancelar
                                </Button>
                                {/* Token 4: Botón Maestro de Acción */}
                                <Button
                                    type="submit"
                                    form="form-editar-cliente"
                                    isDisabled={isUpdating || !canModificarClientes}
                                    isLoading={isUpdating}
                                    startContent={!isUpdating && <HiCheck className="text-lg" />}
                                    className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-8 h-11 shadow-sm transition-transform active:scale-95"
                                >
                                    {isUpdating ? "Actualizando..." : (id ? "Guardar Cambios" : "Registrar Cliente")}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}

