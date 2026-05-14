import { Button } from "@nextui-org/react";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "flowbite-react";
import { useState } from "react";
import { HiUser, HiPlus, HiCheck, HiX } from "react-icons/hi";
import { useClienteForm } from "../../../hooks/useClienteForm";
import { usePermissions } from "../../../context/PermissionsContext";
import { useFeedback } from "../../../context/FeedbackContext";
import SeccionPersonal from "./components/SeccionPersonal";
import SeccionDireccion from "./components/SeccionDireccion";
import SeccionTarifa from "./components/SeccionTarifa";

const modalTheme = {
    root: {
        show: {
            on: "flex bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        }
    },
    content: {
        inner: "relative flex max-h-[90dvh] flex-col rounded-[2rem] bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800"
    }
};

export default function RegistrarClientes({ onSuccess, onError }) {
    const [isOpen, setIsOpen] = useState(false);
    const { can } = usePermissions();
    const { setError } = useFeedback();
    const canCrearClientes = can("clientes.crear");
    
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
        setIsOpen(false);
    };

    const handleOpenModal = () => {
        setIsOpen(true);
    };

    // Manejar registro del cliente
    const handleRegistroCliente = async () => {
        if (!canCrearClientes) {
            setError("No tienes permisos para registrar clientes.", "Registro de Clientes");
            return;
        }

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
            {/* Token 4: Botón Maestro Disparador */}
            <Button
                aria-label="Registrar Cliente"
                variant="solid"
                startContent={<HiPlus className="text-lg" />}
                className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 h-[52px] shadow-sm transition-transform active:scale-95"
                onPress={handleOpenModal}
                isDisabled={!canCrearClientes}
            >
                Nuevo Cliente
            </Button>

            {/* Token 2: Modal Base Premium SaaS */}
            <Modal
                show={isOpen}
                onClose={handleCloseModal}
                size="4xl"
                dismissible={false}
                theme={modalTheme}
            >
                {/* ── HEADER DEL MODAL ── */}
                <ModalHeader className="border-b border-slate-100 dark:border-zinc-800/80 px-8 py-6">
                    <div className="flex items-center gap-4">
                        {/* Regla de Tintes: Azul Corporativo para Clientes */}
                        <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                            <HiUser className="w-7 h-7" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            {/* Token 3: Textos Principales */}
                            <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                                Registrar Nuevo Cliente
                            </h2>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mt-1">
                                Datos Personales, Dirección y Tarifa
                            </p>
                        </div>
                    </div>
                </ModalHeader>

                {/* ── CUERPO DEL MODAL (FORMULARIO) ── */}
                <ModalBody className="px-8 py-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    <form 
                        id="form-registro-cliente" 
                        onSubmit={(e) => { e.preventDefault(); handleRegistroCliente(); }} 
                        className="flex flex-col gap-8" // Aumentado el gap para que respiren las secciones
                    >
                        {/* Información Personal (Se asume que los subcomponentes ya aplican Token 4 para inputs) */}
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

                {/* ── FOOTER Y ACCIONES ── */}
                <ModalFooter className="border-t border-slate-100 dark:border-zinc-800/80 px-8 py-6 flex justify-end gap-3">
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
                        form="form-registro-cliente"
                        isDisabled={isUpdating || !canCrearClientes}
                        isLoading={isUpdating}
                        startContent={!isUpdating && <HiCheck className="text-lg" />}
                        className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-8 h-11 shadow-sm transition-transform active:scale-95"
                    >
                        {isUpdating ? "Registrando..." : "Guardar Cliente"}
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
}