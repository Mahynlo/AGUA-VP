import { useState, useEffect } from "react";
import { Modal, Button } from "flowbite-react";
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

// 1. Tema Premium Optimizado para GPU (igual que en RegistrarClientes)
const premiumModalTheme = {
    root: {
        show: {
            on: "flex bg-slate-900/60 dark:bg-black/80", 
            off: "hidden"
        }
    },
    content: {
        base: "relative h-full w-full p-4 md:h-auto",
        inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-lg dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800"
    },
    header: {
        base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/80 px-8 py-6 rounded-t-2xl",
        close: {
            base: "absolute top-6 right-6 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors",
            icon: "h-5 w-5"
        }
    },
    body: {
        base: "p-8 flex-1 overflow-y-auto transform-gpu will-change-scroll"
    },
    footer: {
        base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/80 px-8 py-6 rounded-b-2xl"
    }
};

// 2. Modificamos las props: Ahora recibe el control de apertura desde el padre (TabClientes)
export default function EditarClientes({ id, isOpen, onClose, onSuccess }) {
    const [renderForm, setRenderForm] = useState(false);
    
    const { can } = usePermissions();
    const { setError, setSuccess } = useFeedback();
    const canModificarClientes = can("clientes.modificar");

    // Hook personalizado reacciona al cambio de ID
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

    // Renderizado diferido para evitar picos de CPU/GPU al abrir
    useEffect(() => {
        let timeoutId;
        // Solo renderizamos si está abierto Y tenemos un ID válido
        if (isOpen && id) {
            timeoutId = setTimeout(() => setRenderForm(true), 150);
        } else {
            setRenderForm(false);
        }
        return () => clearTimeout(timeoutId);
    }, [isOpen, id]);

    // Función para manejar el cierre del modal
    const handleCloseModal = () => {
        resetForm();
        onClose(); // Ejecutamos la función de cierre del componente padre
    };

    // Manejar actualización del cliente
    const handleActualizarCliente = async () => {
        if (!canModificarClientes) {
            setError("No tienes permisos para modificar clientes.", "Actualización de Cliente");
            return;
        }

        const result = await handleSubmit();
        
        if (result.success) {
            setSuccess?.("Cliente actualizado correctamente.");
            handleCloseModal();
            onSuccess?.(); // Avisamos a la tabla para que recargue los datos
        }
    };

    return (
        // 3. Ya no hay botón "Trigger". Solo devolvemos el Modal que es controlado por las Props.
        <Modal
            show={isOpen}
            onClose={handleCloseModal}
            size="4xl"
            dismissible={false}
            theme={premiumModalTheme}
            className="mt-5"
        >
            {/* ── HEADER DEL MODAL ── */}
            <Modal.Header>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                        <HiPencil className="w-7 h-7" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                            Editar Cliente
                        </h2>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mt-1">
                            Actualizar Información y Medidores
                        </p>
                    </div>
                </div>
            </Modal.Header>

            {/* ── CUERPO DEL MODAL (FORMULARIO) ── */}
            <Modal.Body>
                {!renderForm ? (
                    <div className="flex justify-center items-center h-48 text-slate-400 font-medium">
                        Cargando información del cliente...
                    </div>
                ) : (
                    <form 
                        id="form-editar-cliente" 
                        onSubmit={(e) => { e.preventDefault(); handleActualizarCliente(); }}
                        className="flex flex-col gap-8" 
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
                )}
            </Modal.Body>

            {/* ── FOOTER Y ACCIONES ── */}
            <Modal.Footer>
                <Button
                    color="gray"
                    onClick={handleCloseModal}
                    disabled={isUpdating}
                    className="font-bold text-slate-500 border-transparent bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 focus:ring-0 rounded-xl h-11"
                >
                    Cancelar
                </Button>
                
                <Button
                    color="dark"
                    type="submit"
                    form="form-editar-cliente"
                    disabled={isUpdating || !canModificarClientes}
                    isProcessing={isUpdating}
                    className="font-bold bg-slate-900 border-transparent text-white dark:bg-white dark:text-zinc-950 rounded-xl h-11 px-2 shadow-sm transition-transform active:scale-95"
                >
                    <div className="flex items-center gap-2">
                        {!isUpdating && <HiCheck className="text-lg" />}
                        {isUpdating ? "Actualizando..." : "Guardar Cambios"}
                    </div>
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
