import { useState, useEffect } from "react";
import { Modal, Button, ModalHeader, ModalBody, ModalFooter } from "flowbite-react";
import { HiCog, HiLocationMarker, HiUser, HiHashtag, HiCalendar, HiInformationCircle, HiCheck, HiX } from "react-icons/hi";
import { useMedidores } from "../../../context/MedidoresContext";
import { useClientes } from "../../../context/ClientesContext";
import { usePermissions } from "../../../context/PermissionsContext";
import { useFeedback } from "../../../context/FeedbackContext";
import BuscarCliente from "./BuscarCliente";
import SelectorCoordenadas from "../../mapa/SelectorCoordenadas";

const premiumModalTheme = {
    root: {
        show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" }
    },
    content: {
        base: "relative h-full w-full p-4 md:h-auto",
        inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-lg dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800"
    },
    header: {
        base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/80 px-8 py-6 rounded-t-2xl",
        close: { base: "inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer",
            icon: "h-5 w-5"
        }
    },
    body: { base: "p-8 flex-1 overflow-y-auto" },
    footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/80 px-8 py-6 rounded-b-2xl" }
};

// ── INPUT REUTILIZABLE ────────────────────────────────────────────────────────
const CustomInput = ({ label, value, onChange, icon, type = "text", description, placeholder, as = "input", min, step, ...props }) => {
    const inputCls = "w-full pl-10 pr-4 py-3 text-sm font-medium rounded-xl resize-none bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none placeholder-slate-400 dark:placeholder-zinc-500 transition-all";
    return (
        <div className="w-full">
            {label && (
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">
                    {label}
                </label>
            )}
            <div className="relative w-full flex items-start">
                <span className="absolute left-3.5 top-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none">
                    {icon}
                </span>
                {as === "textarea" ? (
                    <textarea value={value} onChange={onChange} placeholder={placeholder} className={inputCls} {...props} />
                ) : (
                    <input type={type} value={value} onChange={onChange} placeholder={placeholder} min={min} step={step} className={inputCls} {...props} />
                )}
            </div>
            {description && <div className="mt-1.5 ml-1 font-medium text-[10px] text-slate-400 dark:text-zinc-500">{description}</div>}
        </div>
    );
};

const SELECT_CLS = "h-[46px] w-full px-3 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none appearance-none cursor-pointer transition-all";

const PUEBLOS = [
    { key: "NG-", label: "NG" },
    { key: "MP-", label: "MP" },
    { key: "AD-", label: "AD" },
];

export default function ModalEditarMedidor({ isOpen, onClose, medidor }) {
    const { actualizarMedidores } = useMedidores();
    const { allClientes } = useClientes();
    const { can } = usePermissions();
    const { setSuccess, setError } = useFeedback();
    const canModificarMedidores = can("medidores.modificar");

    const parseInitialState = () => {
        if (!medidor) return { ciudad: "", numeroSerie: "", marca: "", modelo: "", ubicacion: "", fechaInstalacion: "", latitud: "", longitud: "", estadoMedidor: "Activo", clienteId: null, lecturaBase: "", capacidadMaxima: "" };
        let prefix = "";
        let serie = medidor.numero_serie || "";
        const found = PUEBLOS.find(p => serie.startsWith(p.key));
        if (found) { prefix = found.key; serie = serie.substring(prefix.length); }
        return {
            ciudad: prefix,
            numeroSerie: serie,
            marca: medidor.marca || "",
            modelo: medidor.modelo || "",
            ubicacion: medidor.ubicacion || "",
            fechaInstalacion: medidor.fecha_instalacion ? medidor.fecha_instalacion.split("T")[0] : "",
            latitud: medidor.latitud != null ? medidor.latitud.toString() : "",
            longitud: medidor.longitud != null ? medidor.longitud.toString() : "",
            estadoMedidor: medidor.estado_medidor || "Activo",
            clienteId: medidor.cliente_id,
            lecturaBase: medidor.lectura_base != null ? medidor.lectura_base.toString() : "",
            capacidadMaxima: medidor.capacidad_maxima != null ? medidor.capacidad_maxima.toString() : "99999",
        };
    };

    const initial = parseInitialState();
    const [ciudad, setCiudad] = useState(initial.ciudad);
    const [numeroSerie, setNumeroSerie] = useState(initial.numeroSerie);
    const [marca, setMarca] = useState(initial.marca);
    const [modelo, setModelo] = useState(initial.modelo);
    const [ubicacion, setUbicacion] = useState(initial.ubicacion);
    const [fechaInstalacion, setFechaInstalacion] = useState(initial.fechaInstalacion);
    const [latitud, setLatitud] = useState(initial.latitud);
    const [longitud, setLongitud] = useState(initial.longitud);
    const [estadoMedidor, setEstadoMedidor] = useState(initial.estadoMedidor);
    const [clienteId, setClienteId] = useState(initial.clienteId);
    const [lecturaBase, setLecturaBase] = useState(initial.lecturaBase);
    const [capacidadMaxima, setCapacidadMaxima] = useState(initial.capacidadMaxima);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (medidor && isOpen) {
            const d = parseInitialState();
            setCiudad(d.ciudad); setNumeroSerie(d.numeroSerie); setMarca(d.marca);
            setModelo(d.modelo); setUbicacion(d.ubicacion); setFechaInstalacion(d.fechaInstalacion);
            setLatitud(d.latitud); setLongitud(d.longitud); setEstadoMedidor(d.estadoMedidor);
            setClienteId(d.clienteId); setLecturaBase(d.lecturaBase); setCapacidadMaxima(d.capacidadMaxima);
        }
    }, [medidor, isOpen]);

    const numeroSerieCompleto = `${ciudad}${numeroSerie}`;

    const getChangedFields = () => {
        const changes = {};
        if (numeroSerieCompleto !== medidor.numero_serie) changes.numero_serie = numeroSerieCompleto;
        if (ubicacion !== medidor.ubicacion) changes.ubicacion = ubicacion;
        if (marca !== (medidor.marca || "")) changes.marca = marca.trim() || null;
        if (modelo !== (medidor.modelo || "")) changes.modelo = modelo.trim() || null;
        const originalDate = medidor.fecha_instalacion ? medidor.fecha_instalacion.split("T")[0] : "";
        if (fechaInstalacion !== originalDate) changes.fecha_instalacion = fechaInstalacion;
        const cLat = parseFloat(latitud), cLng = parseFloat(longitud);
        const oLat = parseFloat(medidor.latitud), oLng = parseFloat(medidor.longitud);
        if (Math.abs(cLat - oLat) > 0.000001) changes.latitud = cLat;
        if (Math.abs(cLng - oLng) > 0.000001) changes.longitud = cLng;
        if (estadoMedidor !== medidor.estado_medidor) changes.estado_medidor = estadoMedidor;
        if (clienteId != medidor.cliente_id) changes.cliente_id = clienteId ?? null;
        const newLec = lecturaBase !== "" ? parseFloat(lecturaBase) : null;
        const origLec = medidor.lectura_base != null ? parseFloat(medidor.lectura_base) : null;
        if (newLec !== origLec) changes.lectura_base = newLec;
        const newCap = capacidadMaxima !== "" ? parseFloat(capacidadMaxima) : null;
        const origCap = medidor.capacidad_maxima != null ? parseFloat(medidor.capacidad_maxima) : null;
        if (newCap !== origCap) changes.capacidad_maxima = newCap;
        return changes;
    };

    const handleUpdate = async () => {
        if (!canModificarMedidores) { setError("No tienes permisos para modificar medidores.", "Edición de Medidor"); return; }
        setIsUpdating(true);
        setError("");
        if (!numeroSerie || !ubicacion || !latitud || !longitud) {
            setError("Por favor verifica que no haya campos vacíos inválidos.", "Edición de Medidor");
            setIsUpdating(false); return;
        }
        if (isNaN(parseFloat(latitud)) || isNaN(parseFloat(longitud))) {
            setError("Latitud y Longitud deben ser números válidos.", "Edición de Medidor");
            setIsUpdating(false); return;
        }
        const changes = getChangedFields();
        if (Object.prototype.hasOwnProperty.call(changes, "lectura_base")) {
            const ok = window.confirm("Estás por modificar la lectura base del medidor. Si ya existen lecturas o facturas, esto puede afectar la trazabilidad histórica. ¿Deseas continuar?");
            if (!ok) { setIsUpdating(false); return; }
        }
        if (Object.keys(changes).length === 0) {
            setSuccess("No hay cambios para guardar.", "Edición de Medidor");
            setIsUpdating(false);
            setTimeout(() => onClose(), 1000);
            return;
        }
        try {
            const result = await window.api.updateMedidor({ id: medidor.id, medidor: changes, token_session: localStorage.getItem("token") });
            if (result.success) {
                setSuccess("Medidor actualizado correctamente.", "Edición de Medidor");
                await actualizarMedidores();
                setTimeout(() => onClose(), 1500);
            } else {
                setError(result.message || "Error al actualizar el medidor.", "Edición de Medidor");
            }
        } catch (err) {
            console.error(err);
            setError("Ocurrió un error inesperado al actualizar.", "Edición de Medidor");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Modal
            show={isOpen}
            onClose={onClose}
            size="4xl"
            dismissible
            theme={premiumModalTheme}
            className="mt-5"
        >
            {/* ── HEADER ── */}
            <ModalHeader>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                        <HiCog className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">Editar Medidor</h2>
                        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">Actualizar datos técnicos, asignación y ubicación</p>
                    </div>
                </div>
            </ModalHeader>

            {/* ── BODY ── */}
            <ModalBody>
                <form id="form-editar-medidor" onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="flex flex-col gap-6">

                    {/* 1. Datos del Equipo */}
                    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 p-6 space-y-5">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-200/70 dark:border-zinc-800/70">
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                                <HiHashtag className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm text-slate-800 dark:text-zinc-100 uppercase tracking-wider leading-none">Datos del Equipo</h3>
                                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1">Identificación y parámetros técnicos</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Número de Serie */}
                            <div className="w-full flex-wrap">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-widest">Número de Serie *</label>
                                <div className="flex items-stretch gap-2">
                                    <select value={ciudad} onChange={(e) => setCiudad(e.target.value)} aria-label="Código de Ciudad" className={`${SELECT_CLS} !w-28 shrink-0`}>
                                        <option value="">Cód.</option>
                                        {PUEBLOS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="123456"
                                        value={numeroSerie}
                                        onChange={(e) => setNumeroSerie(e.target.value)}
                                        required
                                        className="flex-1 px-4 py-3 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none transition-all"
                                    />
                                </div>
                                <p className="text-[10px] mt-1.5 ml-1 font-bold text-slate-400 dark:text-zinc-500">
                                    Serie completa: <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">{numeroSerieCompleto || "---"}</span>
                                </p>
                            </div>
                            
                            <CustomInput label="Fecha de Instalación *" type="date" value={fechaInstalacion} onChange={(e) => setFechaInstalacion(e.target.value)} icon={<HiCalendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />} required />

                            {/* Estado Operativo */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-widest">Estado Operativo</label>
                                <select value={estadoMedidor} onChange={(e) => setEstadoMedidor(e.target.value)} aria-label="Estado del medidor" className={SELECT_CLS}>
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                    <option value="Retirado">Retirado</option>
                                    <option value="No instalado">No instalado</option>
                                </select>
                            </div>

                            <CustomInput label="Marca" placeholder="Ej. AquaTech" value={marca} onChange={(e) => setMarca(e.target.value)} icon={<HiCog className="w-5 h-5 text-blue-600 dark:text-blue-400" />} />
                            <CustomInput label="Modelo" placeholder="Ej. AT-150" value={modelo} onChange={(e) => setModelo(e.target.value)} icon={<HiInformationCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />} />
                            <CustomInput
                                label="Lectura Base (m³)" type="number" min="0" step="any" placeholder="Ej. 0 o 1234.56"
                                value={lecturaBase} onChange={(e) => setLecturaBase(e.target.value)} icon={<HiHashtag className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                                description={<>Punto de partida al instalar. <span className="text-amber-600 dark:text-amber-400 font-bold">Puede afectar el historial.</span></>}
                            />
                            <CustomInput
                                label="Capacidad Máxima (m³)" type="number" min="1" step="1" placeholder="99999"
                                value={capacidadMaxima} onChange={(e) => setCapacidadMaxima(e.target.value)} icon={<HiHashtag className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                                description="Límite antes de dar vuelta a cero (estándar: 99,999)."
                            />
                        </div>
                        <CustomInput as="textarea" rows={3} label="Comentarios de Ubicación *" placeholder="Ej. Frente a la casa, junto al poste..." value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} icon={<HiLocationMarker className="w-5 h-5 text-blue-600 dark:text-blue-400" />} required />
                    </div>

                    {/* 2. Asignación de Cliente */}
                    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 p-6 space-y-5">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-200/70 dark:border-zinc-800/70">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                                    <HiUser className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm text-slate-800 dark:text-zinc-100 uppercase tracking-wider leading-none">Asignación de Cliente</h3>
                                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1">Vínculo con el cliente titular del predio</p>
                                </div>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${clienteId ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40"}`}>
                                {clienteId ? "Asignado" : "Disponible"}
                            </span>
                        </div>
                        <div className="mt-2">
                            {clienteId ? (
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-slate-200/70 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Asignado Actualmente a</p>
                                            <p className="text-lg font-bold text-slate-800 dark:text-zinc-100 leading-tight truncate">
                                                {allClientes.find(c => c.id === clienteId)?.nombre || "Cargando nombre..."}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-zinc-500 font-mono mt-0.5">ID Cliente: #{clienteId}</p>
                                        </div>
                                    </div>
                                    <div className="bg-amber-500/10 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200/60 dark:border-amber-800/50 flex gap-3 items-start">
                                        <div className="p-1.5 bg-amber-500/20 dark:bg-amber-800/50 rounded-lg shrink-0 text-amber-600 dark:text-amber-400">
                                            <HiCog className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Acción Requerida para Reasignar</p>
                                            <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1 leading-relaxed">
                                                Para asignar este medidor a otra persona, <strong>primero debe liberarlo</strong> desde el panel de edición del cliente actual.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">Este medidor está libre. Busque un cliente para asignarlo ahora.</p>
                                    <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-slate-200/70 dark:border-zinc-800">
                                        <BuscarCliente onClienteSeleccionado={(id) => setClienteId(id)} />
                                        {clienteId && (
                                            <div className="mt-4 bg-emerald-500/10 dark:bg-emerald-900/20 p-3.5 rounded-xl border border-emerald-200/70 dark:border-emerald-800/50 flex items-center gap-2">
                                                <HiCheck className="text-emerald-600 dark:text-emerald-400 text-lg shrink-0" />
                                                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                                    Se asignará al Cliente ID: <strong>{clienteId}</strong> al guardar cambios.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Coordenadas */}
                    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 p-6 space-y-5">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-200/70 dark:border-zinc-800/70">
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                                <HiLocationMarker className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm text-slate-800 dark:text-zinc-100 uppercase tracking-wider leading-none">Ubicación Geográfica *</h3>
                                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1">Ajusta el pin en el mapa para capturar las coordenadas exactas</p>
                            </div>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800">
                            <SelectorCoordenadas
                                key={`coords-${medidor?.id}`}
                                valorInicial={{ lat: parseFloat(latitud) || 29.1180777, lng: parseFloat(longitud) || -109.9669819 }}
                                onChange={({ lat, lng }) => { setLatitud(lat.toFixed(6)); setLongitud(lng.toFixed(6)); }}
                            />
                        </div>
                        <div className="flex gap-4 text-xs font-mono text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-900/80 w-fit px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                            <span>Lat: <strong className="text-slate-800 dark:text-zinc-200">{latitud}</strong></span>
                            <span>Lng: <strong className="text-slate-800 dark:text-zinc-200">{longitud}</strong></span>
                        </div>
                    </div>
                </form>
            </ModalBody>

            {/* ── FOOTER ── */}
            <ModalFooter>
                <Button
                    color="gray"
                    onClick={onClose}
                    disabled={isUpdating}
                    className="font-bold text-slate-500 border-transparent bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 focus:ring-0 rounded-xl h-11"
                >
                    <div className="flex items-center gap-2"><HiX className="text-lg" /> Cancelar</div>
                </Button>
                <Button
                    color="dark"
                    type="submit"
                    form="form-editar-medidor"
                    disabled={isUpdating || !canModificarMedidores}
                    className="font-black bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 text-white border-transparent rounded-xl h-11 px-5 shadow-sm transition-transform active:scale-95"
                >
                    <div className="flex items-center gap-2">
                        {isUpdating ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-zinc-950/30 dark:border-t-zinc-950 rounded-full animate-spin" />
                        ) : (
                            <HiCheck className="text-lg" />
                        )}
                        {isUpdating ? "Guardando..." : "Guardar Cambios"}
                    </div>
                </Button>
            </ModalFooter>
        </Modal>
    );
}
