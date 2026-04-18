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
                className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 shadow-sm"
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
                                    <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
                                        <HiUser className="w-7 h-7" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                                            Registrar Nuevo Cliente
                                        </h2>
                                        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
                                            Datos Personales, Dirección y Tarifa
                                        </p>
                                    </div>
                                </div>
                            </ModalHeader>

                            {/* BODY */}
                            <ModalBody className="custom-scrollbar">
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
                                    form="form-registro-cliente"
                                    isDisabled={isUpdating}
                                    isLoading={isUpdating}
                                    startContent={!isUpdating && <HiCheck className="text-lg" />}
                                    className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 shadow-sm"
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