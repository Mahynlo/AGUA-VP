import { useState, useEffect } from "react";
import { Modal, Button } from "flowbite-react";
import { HiUser, HiPlus, HiCheck } from "react-icons/hi";
import { useClienteForm } from "../../../hooks/useClienteForm";
import { usePermissions } from "../../../context/PermissionsContext";
import { useFeedback } from "../../../context/FeedbackContext";
import SeccionPersonal from "./components/SeccionPersonal";
import SeccionDireccion from "./components/SeccionDireccion";
import SeccionTarifa from "./components/SeccionTarifa";

// 1. Recreamos el estilo "Premium" del Modal original sobrescribiendo el tema interno de Flowbite
const premiumModalTheme = {
    root: {
        show: {
            on: "flex bg-slate-900/60 dark:bg-black/80", 
            off: "hidden"
        }
    },
    content: {
        base: "relative h-full w-full p-4 md:h-auto",
        // 1. CAMBIO: Bajamos de rounded-[2rem] a rounded-2xl y de shadow-2xl a shadow-lg
        inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-lg dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800"
    },
    header: {
        // CAMBIO: Ajustamos el borde superior a rounded-t-2xl
        base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/80 px-8 py-6 rounded-t-2xl",
        close: {
            base: "absolute top-6 right-6 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors",
            icon: "h-5 w-5"
        }
    },
    body: {
        // 2. CAMBIO: Eliminamos "scrollbar-thin" y sus colores. Dejamos el scroll nativo.
        base: "p-8 flex-1 overflow-y-auto transform-gpu will-change-scroll"
    },
    footer: {
        // CAMBIO: Ajustamos el borde inferior a rounded-b-2xl
        base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/80 px-8 py-6 rounded-b-2xl"
    }
};

export default function RegistrarClientes({ onSuccess, onError }) {
    const [isOpen, setIsOpen] = useState(false);
    const [renderForm, setRenderForm] = useState(false);

    const { can } = usePermissions();
    const { setError, setSuccess } = useFeedback();
    const canCrearClientes = can("clientes.crear");

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

    // Retraso intencional para evitar tirones en CPU's lentas al abrir el modal
    useEffect(() => {
        let timeoutId;
        if (isOpen) {
            timeoutId = setTimeout(() => setRenderForm(true), 150);
        } else {
            setRenderForm(false);
        }
        return () => clearTimeout(timeoutId);
    }, [isOpen]);

    const handleCloseModal = () => {
        resetForm();
        setIsOpen(false);
    };

    const handleRegistroCliente = async () => {
        if (!canCrearClientes) {
            setError("No tienes permisos para registrar clientes.", "Registro de Clientes");
            return;
        }

        const result = await handleSubmit();

        if (result.success) {
            setSuccess?.("Cliente registrado con éxito");
            handleCloseModal();
            onSuccess?.();
        } else {
            onError?.();
        }
    };

    return (
        <>
            {/* Botón Maestro Disparador (Estilo Original) */}
            <Button
                color="dark"
                onClick={() => setIsOpen(true)}
                disabled={!canCrearClientes}
                // Flowbite usa un <span> interno, por eso aplicamos el estilo contenedor aquí
                className="font-bold bg-slate-900 border-transparent text-white dark:bg-white dark:text-zinc-950 rounded-xl !h-[52px] !px-2 shadow-sm transition-transform active:scale-95"
            >
                <div className="flex items-center gap-2">
                    <HiPlus className="text-lg" />
                    Nuevo Cliente
                </div>
            </Button>

            {/* Modal Base Premium inyectando el custom theme */}
            <Modal
                show={isOpen}
                size="4xl"
                onClose={handleCloseModal}
                dismissible={false}
                theme={premiumModalTheme}
                className="mt-5"
            >
                {/* ── HEADER DEL MODAL ── */}
                <Modal.Header>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                            <HiUser className="w-7 h-7" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                                Registrar Nuevo Cliente
                            </h2>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mt-1">
                                Datos Personales, Dirección y Tarifa
                            </p>
                        </div>
                    </div>
                </Modal.Header>

                {/* ── CUERPO DEL MODAL (FORMULARIO) ── */}
                <Modal.Body>
                    {!renderForm ? (
                        <div className="flex justify-center items-center h-48 text-slate-400 font-medium">
                            Preparando formulario...
                        </div>
                    ) : (
                        <form
                            id="form-registro-cliente"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleRegistroCliente();
                            }}
                            className="flex flex-col gap-8"
                        >
                            <SeccionPersonal
                                formData={formData}
                                erroresCampos={erroresCampos}
                                mostrarErrores={mostrarErrores}
                                onChange={handleChange}
                                limpiarError={limpiarError}
                            />
                            <SeccionDireccion
                                formData={formData}
                                erroresCampos={erroresCampos}
                                mostrarErrores={mostrarErrores}
                                onChange={handleChange}
                                limpiarError={limpiarError}
                            />
                            <SeccionTarifa
                                formData={formData}
                                erroresCampos={erroresCampos}
                                mostrarErrores={mostrarErrores}
                                onChange={handleChange}
                                limpiarError={limpiarError}
                                modo="crear"
                            />
                        </form>
                    )}
                </Modal.Body>

                {/* ── FOOTER Y ACCIONES ── */}
                <Modal.Footer>
                    {/* Botón Cancelar (Estilo variant="light" original) */}
                    <Button
                        color="gray"
                        onClick={handleCloseModal}
                        disabled={isUpdating}
                        className="font-bold text-slate-500 border-transparent bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 focus:ring-0 rounded-xl h-11"
                    >
                        Cancelar
                    </Button>
                    
                    {/* Botón Guardar (Estilo variant="solid" original) */}
                    <Button
                        color="dark"
                        type="submit"
                        form="form-registro-cliente"
                        disabled={isUpdating || !canCrearClientes}
                        isProcessing={isUpdating}
                        className="font-bold bg-slate-900 border-transparent text-white dark:bg-white dark:text-zinc-950 rounded-xl h-11 px-2 shadow-sm transition-transform active:scale-95"
                    >
                        <div className="flex items-center gap-2">
                            {!isUpdating && <HiCheck className="text-lg" />}
                            {isUpdating ? "Registrando..." : "Guardar Cliente"}
                        </div>
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}