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
import { HiPencil, HiCheck, HiX } from "react-icons/hi";
import { useClienteForm } from "../../../hooks/useClienteForm";
import SeccionPersonal from "./components/SeccionPersonal";
import SeccionDireccion from "./components/SeccionDireccion";
import SeccionTarifa from "./components/SeccionTarifa";
import SeccionMedidor from "./components/SeccionMedidor";
import SeccionEliminar from "./components/SeccionEliminar";
import InfoRegistro from "./components/InfoRegistro";

export default function EditarClientes({ id }) {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

    // Usar el hook personalizado
    const {
        formData,
        erroresCampos,
        mostrarErrores,
        isUpdating,
        fechaRegistroCliente,
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
        const result = await handleSubmit();
        
        if (result.success) {
            setTimeout(() => {
                handleCloseModal();
            }, 2000);
        }
    };

    return (
        <>
            <Tooltip color="primary" content="Editar Cliente" delay={500} closeDelay={0}>
                <Button
                    isIconOnly
                    aria-label="Editar"
                    variant="flat"
                    onPress={onOpen}
                    className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                >
                    <EditIcon />
                </Button>
            </Tooltip>

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
                    backdrop: "bg-slate-900/40 backdrop-blur-sm",
                    base: "bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-2xl",
                    header: "border-b border-slate-100 dark:border-zinc-800/50 pb-4 pt-6 px-8",
                    body: "px-8 py-6",
                    footer: "border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8",
                    closeButton: "hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 text-slate-400 p-2 top-4 right-4",
                }}
            >
                <ModalContent>
                    {() => (
                        <>
                            {/* HEADER */}
                            <ModalHeader className="flex flex-col gap-1 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl shrink-0">
                                        <HiPencil className="w-7 h-7" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                                            {id ? "Editar Cliente" : "Registrar Cliente"}
                                        </h2>
                                        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
                                            Actualizar Información y Medidores
                                        </p>
                                    </div>
                                </div>
                            </ModalHeader>
                            
                            {/* BODY */}
                            <ModalBody className="custom-scrollbar">
                                <form 
                                    id="form-editar-cliente" 
                                    onSubmit={(e) => { e.preventDefault(); handleActualizarCliente(); }}
                                    className="flex flex-col gap-6"
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
                                        tarifaIdOriginal={useClienteForm(id).cliente?.id_tarifa || useClienteForm(id).cliente?.tarifa_id}
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
                            
                            {/* FOOTER */}
                            <ModalFooter>
                                <Button
                                    color="default"
                                    variant="flat"
                                    onPress={handleCloseModal}
                                    isDisabled={isUpdating}
                                    startContent={<HiX className="text-lg" />}
                                    className="font-bold text-slate-600 dark:text-zinc-300 bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-6"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    color="default"
                                    type="submit"
                                    form="form-editar-cliente"
                                    isDisabled={isUpdating}
                                    isLoading={isUpdating}
                                    startContent={!isUpdating && <HiCheck className="text-lg" />}
                                    className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 shadow-sm"
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


