import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure
} from "@nextui-org/react";
import { HiUser, HiPlus, HiCheck, HiX } from "react-icons/hi";
import { useClienteForm } from "../../../hooks/useClienteForm";
import SeccionPersonal from "./components/SeccionPersonal";
import SeccionDireccion from "./components/SeccionDireccion";
import SeccionTarifa from "./components/SeccionTarifa";

export default function RegistrarClientes({ onSuccess, onError }) {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    
    // Usar el hook personalizado
    const {
        formData,
        erroresCampos,
        mostrarErrores,
        isUpdating,
        handleChange,
        handleSubmit,
        limpiarError,
        resetForm
    } = useClienteForm();

    // Función para manejar el cierre del modal
    const handleCloseModal = () => {
        resetForm();
        onClose();
    };

    // Manejar registro del cliente
    const handleRegistroCliente = async () => {
        const result = await handleSubmit();
        
        if (result.success) {
            setTimeout(() => {
                handleCloseModal();
                onSuccess?.();
            }, 2000);
        } else {
            onError?.();
        }
    };

    return (
        <>
            <Button
                aria-label="Registrar Cliente"
                variant="solid"
                startContent={<HiPlus className="text-lg" />}
                className="font-bold bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-md shadow-green-600/30"
                onPress={onOpen}
            >
                Nuevo Cliente
            </Button>

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
                            {/* HEADER */}
                            <ModalHeader className="flex flex-col gap-1 pt-6 px-6 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-2xl shrink-0">
                                        <HiUser className="w-7 h-7" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                                            Registrar Nuevo Cliente
                                        </h2>
                                        <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-1">
                                            Datos Personales, Dirección y Tarifa
                                        </p>
                                    </div>
                                </div>
                            </ModalHeader>

                            {/* BODY */}
                            <ModalBody className="py-6 px-4 sm:px-6 bg-slate-50/50 dark:bg-black/10 custom-scrollbar">
                                <form 
                                    id="form-registro-cliente" 
                                    onSubmit={(e) => { e.preventDefault(); handleRegistroCliente(); }} 
                                    className="flex flex-col gap-6"
                                >
                                    {/* Información Personal (Se asume que ya tiene su propia Card interna) */}
                                    <SeccionPersonal
                                        formData={formData}
                                        erroresCampos={erroresCampos}
                                        mostrarErrores={mostrarErrores}
                                        onChange={handleChange}
                                        limpiarError={limpiarError}
                                    />

                                    {/* Dirección (Se asume que ya tiene su propia Card interna) */}
                                    <SeccionDireccion
                                        formData={formData}
                                        erroresCampos={erroresCampos}
                                        mostrarErrores={mostrarErrores}
                                        onChange={handleChange}
                                        limpiarError={limpiarError}
                                    />

                                    {/* Tarifa (Se asume que ya tiene su propia Card interna) */}
                                    <SeccionTarifa
                                        formData={formData}
                                        erroresCampos={erroresCampos}
                                        mostrarErrores={mostrarErrores}
                                        onChange={handleChange}
                                        limpiarError={limpiarError}
                                        modo="crear"
                                    />
                                </form>
                            </ModalBody>

                            {/* FOOTER */}
                            <ModalFooter className="px-6 py-4">
                                <Button
                                    color="default"
                                    variant="light"
                                    onPress={handleCloseModal}
                                    isDisabled={isUpdating}
                                    startContent={<HiX className="text-lg" />}
                                    className="font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    type="submit"
                                    form="form-registro-cliente"
                                    isDisabled={isUpdating}
                                    isLoading={isUpdating}
                                    startContent={!isUpdating && <HiCheck className="text-lg" />}
                                    className="font-bold shadow-md shadow-blue-500/30 px-6"
                                >
                                    {isUpdating ? "Registrando..." : "Guardar Cliente"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}