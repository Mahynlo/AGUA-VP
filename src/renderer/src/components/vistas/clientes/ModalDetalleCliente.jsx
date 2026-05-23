import React from "react";
import { Modal, Button } from "flowbite-react";
import { 
    HiUser, 
    HiPhone, 
    HiMail, 
    HiLocationMarker, 
    HiMap, 
    HiCurrencyDollar, 
    HiCog, 
    HiHashtag,
    HiInbox
} from "react-icons/hi";
import { useMedidores } from "../../../context/MedidoresContext";
import { useTarifas } from "../../../context/TarifasContext";

// 1. Tema Premium Optimizado para GPU (Sin Blur, Scroll Nativo Aislado)
const premiumModalTheme = {
    root: {
        show: {
            on: "flex bg-slate-900/60 dark:bg-black/80 mt-5", 
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
        // Aislamiento en capa de hardware para el scroll suave
        base: "p-8 flex-1 overflow-y-auto transform-gpu will-change-scroll"
    },
    footer: {
        base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/80 px-8 py-6 rounded-b-2xl"
    }
};

export default function ModalDetalleCliente({ isOpen, onClose, cliente }) {
    const { allMedidores } = useMedidores();
    const { tarifas } = useTarifas();

    if (!cliente) return null;

    // Resolver Relaciones
    const medidoresAsignados = allMedidores.filter(m => m.cliente_id === cliente.id);
    const tarifaAsignada = tarifas.find(t => t.id === (cliente.id_tarifa || cliente.tarifa_id));

    return (
        <Modal
            show={isOpen}
            onClose={onClose}
            size="3xl"
            theme={premiumModalTheme}
            dismissible={false} // Evita que se cierre al hacer clic fuera si así lo deseas
        >
            {/* ── HEADER DEL MODAL ── */}
            <Modal.Header>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                        <HiUser className="w-7 h-7" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                            Detalles del Cliente
                        </h2>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                                ID: {cliente.id}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-700"></span>
                            <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest ${
                                cliente.estado_cliente === "Activo" 
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                                : "bg-red-500/10 text-red-600 dark:text-red-400"
                            }`}>
                                {cliente.estado_cliente || "Desconocido"}
                            </div>
                        </div>
                    </div>
                </div>
            </Modal.Header>

            {/* ── CUERPO DEL MODAL ── */}
            <Modal.Body>
                <div className="flex flex-col gap-10">

                    {/* 1. Información Personal */}
                    <div className="flex flex-col gap-5">
                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
                            <HiUser className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                                Información Personal
                            </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 px-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Nombre Completo</span>
                                <span className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{cliente.nombre}</span>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <HiMail className="w-3 h-3" /> Correo Electrónico
                                </span>
                                <span className={`text-sm font-medium truncate block ${!cliente.email && !cliente.correo ? 'text-slate-400 italic' : 'text-slate-800 dark:text-zinc-100'}`}>
                                    {cliente.email || cliente.correo || "No registrado"}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <HiPhone className="w-3 h-3" /> Teléfono
                                </span>
                                <span className={`text-sm font-medium truncate block ${!cliente.telefono ? 'text-slate-400 italic' : 'text-slate-800 dark:text-zinc-100'}`}>
                                    {cliente.telefono || "No registrado"}
                                </span>
                            </div>

                            {cliente.numero_predio && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <HiHashtag className="w-3 h-3" /> Número de Predio
                                    </span>
                                    <span className="text-sm font-semibold text-slate-800 dark:text-zinc-100 font-mono">
                                        {cliente.numero_predio}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Dirección y Ubicación */}
                    <div className="flex flex-col gap-5">
                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
                            <HiLocationMarker className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                                Dirección y Ubicación
                            </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 px-2">
                            <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Calle y Número</span>
                                <span className="text-sm font-medium text-slate-800 dark:text-zinc-100">{cliente.direccion || "N/A"}</span>
                            </div>
                            
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Colonia</span>
                                <span className="text-sm font-medium text-slate-800 dark:text-zinc-100">{cliente.colonia || "N/A"}</span>
                            </div>
                            
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Ciudad/Localidad</span>
                                <span className="text-sm font-medium text-slate-800 dark:text-zinc-100">{cliente.ciudad || "N/A"}</span>
                            </div>

                            {cliente.referencia && (
                                <div className="col-span-1 md:col-span-2 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Referencia</span>
                                    <span className="text-sm text-slate-600 dark:text-zinc-300 italic leading-relaxed">{cliente.referencia}</span>
                                </div>
                            )}

                            {cliente.latitud && (
                                <div className="col-span-1 md:col-span-2 flex items-center gap-2 p-3 bg-sky-500/10 border border-sky-200/50 dark:border-sky-900/40 rounded-xl w-fit">
                                    <HiMap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                                    <span className="text-xs font-bold font-mono text-sky-700 dark:text-sky-300">
                                        {cliente.latitud}, {cliente.longitud}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Tarifa Asignada */}
                    <div className="bg-emerald-500/5 border border-emerald-200/50 dark:border-emerald-900/30 rounded-2xl p-6 flex flex-row items-center gap-5">
                        <div className="p-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full shrink-0">
                            <HiCurrencyDollar className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/80 dark:text-emerald-400/90">
                                Esquema de Tarifa Actual
                            </h4>
                            {tarifaAsignada ? (
                                <div className="flex flex-col">
                                    <p className="text-lg font-black text-emerald-800 dark:text-emerald-300 tracking-tight">{tarifaAsignada.nombre}</p>
                                    <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">{tarifaAsignada.descripcion}</p>
                                </div>
                            ) : (
                                <p className="text-sm font-bold text-slate-500 dark:text-zinc-500">No tiene una tarifa asignada</p>
                            )}
                        </div>
                    </div>

                    {/* 4. Medidores Asignados */}
                    <div className="flex flex-col gap-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
                            <div className="flex items-center gap-2">
                                <HiCog className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                                    Equipos Medidores
                                </h4>
                            </div>
                            {medidoresAsignados.length > 0 && (
                                <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md">
                                    {medidoresAsignados.length} Registrados
                                </span>
                            )}
                        </div>

                        {medidoresAsignados.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-2">
                                {medidoresAsignados.map((medidor) => (
                                    <div 
                                        key={medidor.id} 
                                        className="p-5 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 rounded-2xl flex flex-col gap-4 shadow-sm"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-bold">Nº Serie</span>
                                                <span className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono tracking-tight">
                                                    {medidor.numero_serie}
                                                </span>
                                            </div>
                                            <div className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${
                                                medidor.estado_servicio === 'Cortado' 
                                                    ? 'bg-red-500/10 text-red-600 dark:text-red-400' 
                                                    : (medidor.estado_medidor === 'Activo' 
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                                        : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400')
                                            }`}>
                                                {medidor.estado_servicio === 'Cortado' ? 'Cortado' : medidor.estado_medidor}
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col gap-3">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-bold">Modelo / Marca</span>
                                                <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                                                    {medidor.marca} <span className="text-slate-300 dark:text-zinc-600 mx-1">/</span> {medidor.modelo}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-bold">Ubicación Física</span>
                                                <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                                                    {medidor.ubicacion || 'Sin especificar'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/30">
                                <div className="p-3 bg-white dark:bg-zinc-800 rounded-full mb-3 shadow-sm border border-slate-100 dark:border-zinc-700">
                                    <HiInbox className="w-6 h-6 text-slate-400 dark:text-zinc-500" />
                                </div>
                                <p className="text-sm font-bold text-slate-600 dark:text-zinc-300 mb-1">Sin Medidores Asignados</p>
                                <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 max-w-[250px]">
                                    Este cliente no tiene ningún equipo vinculado a su cuenta.
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </Modal.Body>
            
            {/* ── FOOTER Y ACCIONES ── */}
            <Modal.Footer>
                <Button 
                    color="gray" 
                    onClick={onClose}
                    className="font-bold text-slate-500 border-transparent bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 focus:ring-0 rounded-xl h-11"
                >
                    Cerrar Panel
                </Button>
            </Modal.Footer>
        </Modal>
    );
}