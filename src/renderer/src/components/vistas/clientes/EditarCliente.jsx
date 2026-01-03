import { useState } from "react";
import { EliminarClienteIcon, EditIcon } from "../../../IconsApp/IconsClientes";
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
import { HiUser } from "react-icons/hi";
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
            <Tooltip color="primary" content="Editar" delay={2000}>
                <Button
                    isIconOnly
                    aria-label="Editar"
                    color=""
                    variant="faded"

                    onPress={onOpen}
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
                    backdrop: "bg-gradient-to-t mt-18 from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
                    closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex items-center gap-2 text-xl font-bold">
                                <HiUser className="w-6 h-6 text-blue-600" />
                                {id ? "Editar Cliente" : "Registrar Cliente"}
                            </ModalHeader>
                            
                            <ModalBody className="space-y-6">
                                <form id="form-editar-cliente" onSubmit={(e) => { e.preventDefault(); handleActualizarCliente(); }}>
                                    
                                    {/* Información Personal */}
                                    <SeccionPersonal
                                        formData={formData}
                                        erroresCampos={erroresCampos}
                                        mostrarErrores={mostrarErrores}
                                        onChange={handleChange}
                                        limpiarError={limpiarError}
                                    />

                                    {/* Info de Registro */}
                                    <InfoRegistro fechaRegistroCliente={fechaRegistroCliente} />

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

                                    {/* Eliminar Cliente */}
                                    <SeccionEliminar clienteId={id} />
                                    
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
                                    onClick={handleActualizarCliente}
                                    type="submit"
                                    form="form-editar-cliente"
                                    isDisabled={isUpdating}
                                    isLoading={isUpdating}
                                >
                                    {isUpdating ? "Actualizando..." : (id ? "Actualizar Cliente" : "Registrar Cliente")}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}


