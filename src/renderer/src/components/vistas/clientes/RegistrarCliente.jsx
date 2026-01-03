import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure
} from "@nextui-org/react";
import { HiUser, HiPlus } from "react-icons/hi";
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
                startContent={<HiPlus className="w-4 h-4" />}
                className="font-medium bg-green-600 hover:bg-green-700 active:bg-green-800 focus:bg-green-700 text-white rounded-xl px-4 py-2 text-sm sm:text-base"
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
                    backdrop: "bg-gradient-to-t mt-18 from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
                    closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
                    Modal: "bg-gray-300 dark:bg-gray-800 rounded-lg shadow-lg",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex items-center gap-2 text-xl font-bold ">
                                <HiUser className="w-6 h-6 text-green-600" />
                                Registrar Nuevo Cliente
                            </ModalHeader>

                            <ModalBody className="space-y-6 ">
                                <form id="form-registro-cliente" onSubmit={(e) => { e.preventDefault(); handleRegistroCliente(); }}>

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
                                        modo="crear"
                                    />

                                </form>
                            </ModalBody>

                            <ModalFooter className="">
                                <Button
                                    color="danger"
                                    variant="light"
                                    onPress={handleCloseModal}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    onClick={handleRegistroCliente}
                                    type="submit"
                                    form="form-registro-cliente"
                                    isDisabled={isUpdating}
                                    isLoading={isUpdating}
                                >
                                    {isUpdating ? "Registrando..." : "Registrar Cliente"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}

