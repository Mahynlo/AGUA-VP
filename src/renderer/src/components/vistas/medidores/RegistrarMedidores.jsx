import { useState } from "react";
import { Modal, Button } from "flowbite-react";
import { HiPlus, HiLocationMarker, HiCog, HiHashtag, HiCalendar, HiCheck, HiX, HiInformationCircle, HiUser } from "react-icons/hi";
import { useMedidores } from "../../../context/MedidoresContext";
import { usePermissions } from "../../../context/PermissionsContext";
import BuscarCliente from "./BuscarCliente";
import SelectorCoordenadas from "../../mapa/SelectorCoordenadas";
import { useFeedback } from "../../../context/FeedbackContext";

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
        close: {
            base: "absolute top-6 right-6 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors",
            icon: "h-5 w-5"
        }
    },
    body: { base: "p-8 flex-1 overflow-y-auto" },
    footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/80 px-8 py-6 rounded-b-2xl" }
};

// ── INPUT REUTILIZABLE ────────────────────────────────────────────────────────
const CustomInput = ({ label, value, onChange, icon, type = "text", description, placeholder, as = "input", min, step, ...props }) => {
    const inputCls = "w-full pl-10 pr-4 py-3 text-sm font-medium rounded-xl resize-none bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-300 shadow-none placeholder-slate-400 dark:placeholder-zinc-500";
    return (
        <div className="w-full">
            {label && <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1.5 block">{label}</label>}
            <div className="relative w-full flex items-start">
                <span className="absolute left-3 top-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none">{icon}</span>
                {as === "textarea" ? (
                    <textarea value={value} onChange={onChange} placeholder={placeholder} className={inputCls} {...props} />
                ) : (
                    <input type={type} value={value} onChange={onChange} placeholder={placeholder} min={min} step={step} className={inputCls} {...props} />
                )}
            </div>
            {description && <p className="text-[10px] mt-1.5 ml-1 font-bold text-slate-400 dark:text-zinc-500">{description}</p>}
        </div>
    );
};

const SELECT_CLS = "h-[46px] w-full px-3 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-slate-400/20 shadow-none appearance-none cursor-pointer";

const PUEBLOS = [
    { key: "NG-", label: "NG" },
    { key: "MP-", label: "MP" },
    { key: "AD-", label: "AD" },
];

export default function RegistrarMedidor() {
    const [isOpen, setIsOpen] = useState(false);
    const { actualizarMedidores } = useMedidores();
    const { can } = usePermissions();
    const { setSuccess, setError } = useFeedback();
    const canCrearMedidores = can("medidores.crear");

    const [ciudad, setCiudad] = useState("");
    const [clienteIdBusqueda, setClienteIdBusqueda] = useState(null);
    const [numeroSerie, setNumeroSerie] = useState("");
    const [marca, setMarca] = useState("");
    const [modelo, setModelo] = useState("");
    const [ubicacion, setUbicacion] = useState("");
    const [fechaInstalacion, setFechaInstalacion] = useState("");
    const [latitud, setLatitud] = useState("");
    const [longitud, setLongitud] = useState("");
    const [estadoMedidor] = useState("Activo");
    const [lecturaBase, setLecturaBase] = useState("");
    const [capacidadMaxima, setCapacidadMaxima] = useState("99999");
    const [isUpdating, setIsUpdating] = useState(false);

    const numeroSerieCompleto = `${ciudad}${numeroSerie}`;

    const resetForm = () => {
        setClienteIdBusqueda(null); setCiudad(""); setNumeroSerie(""); setMarca("");
        setModelo(""); setUbicacion(""); setFechaInstalacion(""); setLatitud(""); setLongitud("");
        setLecturaBase(""); setCapacidadMaxima("99999");
    };

    const handleClose = () => { resetForm(); setIsOpen(false); };

    const handleRegistroMedidor = async () => {
        if (!canCrearMedidores) { setError("No tienes permisos para registrar medidores.", "Registro de Medidores"); return; }
        setError(""); setSuccess(""); setIsUpdating(true);

        const faltantes = [];
        if (!numeroSerie) faltantes.push("Número de serie");
        if (!ubicacion) faltantes.push("Ubicación");
        if (!fechaInstalacion) faltantes.push("Fecha de instalación");
        if (!ciudad) faltantes.push("Ciudad");
        if (!latitud) faltantes.push("Latitud");
        if (!longitud) faltantes.push("Longitud");
        if (faltantes.length > 0) {
            setError(`Los siguientes campos son obligatorios: ${faltantes.join(", ")}.`, "Registro de Medidores");
            setIsUpdating(false); return;
        }
        const lat = parseFloat(latitud), lon = parseFloat(longitud);
        if (isNaN(lat) || isNaN(lon)) {
            const errNum = [!isNaN(lat) ? null : "Latitud", !isNaN(lon) ? null : "Longitud"].filter(Boolean);
            setError(`${errNum.join(" y ")} deben ser números válidos.`, "Registro de Medidores");
            setIsUpdating(false); return;
        }
        try {
            const response = await window.api.registerMeter({
                medidor: {
                    cliente_id: clienteIdBusqueda || null,
                    numero_serie: numeroSerieCompleto,
                    marca: marca.trim() || null,
                    modelo: modelo.trim() || null,
                    ubicacion, fecha_instalacion: fechaInstalacion,
                    latitud, longitud,
                    estado_medidor: estadoMedidor,
                    lectura_base: lecturaBase !== "" ? parseFloat(lecturaBase) : null,
                    capacidad_maxima: capacidadMaxima !== "" ? parseFloat(capacidadMaxima) : null,
                },
                token_session: localStorage.getItem("token"),
            });
            if (response.success) {
                setSuccess("Medidor registrado exitosamente.", "Registro de Medidores");
                setTimeout(() => { handleClose(); actualizarMedidores(); setIsUpdating(false); }, 2000);
            } else {
                setError(response.message, "Registro de Medidores");
                setIsUpdating(false);
            }
        } catch {
            setError("Ocurrió un error en el registro. Intenta nuevamente.", "Registro de Medidores");
            setIsUpdating(false);
        }
    };

    return (
        <>
            <Button
                color="dark"
                onClick={() => setIsOpen(true)}
                disabled={!canCrearMedidores}
                className="font-bold bg-slate-900 border-transparent text-white dark:bg-white dark:text-zinc-950 rounded-xl !h-[52px] !px-2 shadow-sm transition-transform active:scale-95"
            >
                <div className="flex items-center gap-2"><HiPlus className="text-lg" /> Nuevo Medidor</div>
            </Button>

            <Modal
                show={isOpen}
                onClose={handleClose}
                size="4xl"
                dismissible={false}
                theme={premiumModalTheme}
                className="mt-5"
            >
                {/* ── HEADER ── */}
                <Modal.Header>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl shrink-0">
                            <HiCog className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">Registrar Nuevo Medidor</h2>
                            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">Datos técnicos, Asignación y Ubicación</p>
                        </div>
                    </div>
                </Modal.Header>

                {/* ── BODY ── */}
                <Modal.Body>
                    <form id="form-registro-medidor" onSubmit={(e) => { e.preventDefault(); handleRegistroMedidor(); }} className="flex flex-col gap-6">

                        {/* 1. Datos del Equipo */}
                        <div className="bg-sky-500/10 rounded-2xl border border-sky-200/70 dark:border-sky-900/40 p-5 sm:p-6 space-y-6">
                            <h3 className="font-bold text-base text-sky-900 dark:text-sky-300 flex items-center gap-2 border-b border-sky-200/70 dark:border-sky-900/30 pb-3">
                                <HiHashtag className="w-5 h-5 text-sky-500" /> Datos del Equipo
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Número de Serie */}
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">Número de Serie *</label>
                                    <div className="flex items-stretch gap-2">
                                        <select value={ciudad} onChange={(e) => setCiudad(e.target.value)} aria-label="Código de Ciudad" className={`${SELECT_CLS} !w-28 shrink-0`}>
                                            <option value="">Cód.</option>
                                            {PUEBLOS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                                        </select>
                                        <input
                                            type="text" placeholder="123456" value={numeroSerie}
                                            onChange={(e) => setNumeroSerie(e.target.value)} required
                                            className="flex-1 px-4 py-3 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-slate-400/20 shadow-none"
                                        />
                                    </div>
                                    <p className="text-[10px] mt-1.5 ml-1 font-bold text-slate-400 dark:text-zinc-500">
                                        Serie completa: <span className="text-sky-700 dark:text-sky-400 font-mono">{numeroSerieCompleto || "---"}</span>
                                    </p>
                                </div>

                                <CustomInput label="Fecha de Instalación *" type="date" value={fechaInstalacion} onChange={(e) => setFechaInstalacion(e.target.value)} icon={<HiCalendar className="w-5 h-5 text-sky-500" />} required />
                                <CustomInput label="Marca" placeholder="Ej. AquaTech" value={marca} onChange={(e) => setMarca(e.target.value)} icon={<HiCog className="w-5 h-5 text-sky-500" />} />
                                <CustomInput label="Modelo" placeholder="Ej. AT-150" value={modelo} onChange={(e) => setModelo(e.target.value)} icon={<HiInformationCircle className="w-5 h-5 text-sky-500" />} />
                                <CustomInput label="Lectura Base (m³)" type="number" min="0" step="any" placeholder="Ej. 0 o 1234.56" value={lecturaBase} onChange={(e) => setLecturaBase(e.target.value)} icon={<HiHashtag className="w-5 h-5 text-sky-500" />} description="Valor inicial del medidor al instalarse." />
                                <CustomInput label="Capacidad Máxima (m³)" type="number" min="1" step="1" placeholder="99999" value={capacidadMaxima} onChange={(e) => setCapacidadMaxima(e.target.value)} icon={<HiHashtag className="w-5 h-5 text-sky-500" />} description="Límite antes de dar vuelta a cero (estándar: 99,999)." />
                            </div>
                            <CustomInput as="textarea" rows={3} label="Comentarios de Ubicación *" placeholder="Ej. Frente a la casa, junto al poste..." value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} icon={<HiLocationMarker className="w-5 h-5 text-sky-500" />} required />
                        </div>

                        {/* 2. Asignación de Cliente */}
                        <div className="bg-indigo-500/10 rounded-2xl border border-indigo-200/70 dark:border-indigo-900/40 p-6 sm:p-8 flex flex-col min-h-[380px]">
                            <h3 className="font-bold text-base text-indigo-900 dark:text-indigo-300 flex items-center gap-2 mb-2 border-b border-indigo-100 dark:border-indigo-900/30 pb-4">
                                <HiUser className="w-5 h-5 text-indigo-500" />
                                Asignación de Cliente <span className="text-xs font-medium text-indigo-500/60 dark:text-indigo-400/60 normal-case">(Opcional)</span>
                            </h3>
                            <p className="text-sm font-medium text-slate-600 dark:text-zinc-400 mb-6">
                                Selecciona el cliente propietario del inmueble donde se instalará este equipo.
                            </p>
                            <div className="bg-slate-50/80 dark:bg-zinc-950/40 sm:p-2 rounded-xl border border-indigo-200/60 dark:border-zinc-800 flex flex-col flex-1">
                                <BuscarCliente onClienteSeleccionado={(id) => setClienteIdBusqueda(id)} />
                                {clienteIdBusqueda && (
                                    <div className="mt-6 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3">
                                        <HiCheck className="text-emerald-600 dark:text-emerald-400 text-xl shrink-0" />
                                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                            Cliente vinculado exitosamente (ID: {clienteIdBusqueda})
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Coordenadas */}
                        <div className="bg-amber-500/10 rounded-2xl border border-amber-200/70 dark:border-amber-900/40 p-5 sm:p-6">
                            <h3 className="font-bold text-base text-amber-900 dark:text-amber-300 flex items-center gap-2 mb-2 border-b border-amber-200/70 dark:border-amber-900/30 pb-3">
                                <HiLocationMarker className="w-5 h-5 text-amber-500" /> Ubicación Geográfica *
                            </h3>
                            <p className="text-sm font-medium text-slate-600 dark:text-zinc-400 mb-4">
                                Ajusta el pin en el mapa para registrar las coordenadas exactas del medidor.
                            </p>
                            <div className="rounded-xl overflow-hidden border border-amber-200/60 dark:border-amber-900/50">
                                <SelectorCoordenadas
                                    valorInicial={{ lat: parseFloat(latitud) || 29.1180777, lng: parseFloat(longitud) || -109.9669819 }}
                                    onChange={({ lat, lng }) => { setLatitud(lat.toFixed(6)); setLongitud(lng.toFixed(6)); }}
                                />
                            </div>
                        </div>
                    </form>
                </Modal.Body>

                {/* ── FOOTER ── */}
                <Modal.Footer>
                    <Button
                        color="gray"
                        onClick={handleClose}
                        disabled={isUpdating}
                        className="font-bold text-slate-500 border-transparent bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 focus:ring-0 rounded-xl h-11"
                    >
                        <div className="flex items-center gap-2"><HiX className="text-lg" /> Cancelar</div>
                    </Button>
                    <Button
                        color="dark"
                        type="submit"
                        form="form-registro-medidor"
                        disabled={isUpdating}
                        isProcessing={isUpdating}
                        className="font-bold bg-slate-900 border-transparent text-white dark:bg-white dark:text-zinc-950 rounded-xl h-11 px-2 shadow-sm transition-transform active:scale-95"
                    >
                        <div className="flex items-center gap-2">
                            {!isUpdating && <HiCheck className="text-lg" />}
                            {isUpdating ? "Registrando..." : "Registrar Medidor"}
                        </div>
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
