import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Select,
    SelectItem,
    Card,
    CardBody
} from "@nextui-org/react";
import { HiPlus, HiLocationMarker, HiCog, HiHashtag, HiCalendar, HiCheck, HiX, HiInformationCircle, HiUser } from "react-icons/hi";
import { useState } from "react";
import { useMedidores } from "../../../context/MedidoresContext";
import BuscarCliente from "./BuscarCliente";
import SelectorCoordenadas from "../../mapa/SelectorCoordenadas";
import { useFeedback } from "../../../context/FeedbackContext";

// Componente de Input Personalizado (Fondo blanco para resaltar sobre tarjetas tintadas)
const CustomInput = ({ label, value, onChange, icon, type = "text", color = "blue", description, placeholder, as = "input", min, step, ...props }) => {
    const focusColors = {
        blue: "focus:ring-slate-400/20 focus:border-slate-300",
        orange: "focus:ring-slate-400/20 focus:border-slate-300",
        indigo: "focus:ring-slate-400/20 focus:border-slate-300",
    };

    const inputClasses = `
        w-full pl-10 pr-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 resize-none
        bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100
        border border-slate-200 dark:border-zinc-800
        hover:border-slate-300 dark:hover:border-zinc-700
        focus:outline-none focus:ring-2 shadow-none
        placeholder-slate-400 dark:placeholder-zinc-500
        ${focusColors[color] || focusColors.blue}
    `;

    return (
        <div className="w-full">
            {label && (
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1.5 block">
                    {label}
                </label>
            )}
            <div className="relative w-full flex items-start">
                <span className="absolute left-3 top-3.5 text-slate-400 dark:text-zinc-500 flex items-center justify-center pointer-events-none">
                    {icon}
                </span>
                {as === "textarea" ? (
                    <textarea
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        className={inputClasses}
                        {...props}
                    />
                ) : (
                    <input
                        type={type}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        min={min}
                        step={step}
                        className={inputClasses}
                        {...props}
                    />
                )}
            </div>
            {description && (
                <p className="text-[10px] mt-1.5 ml-1 font-bold text-slate-400 dark:text-zinc-500">
                    {description}
                </p>
            )}
        </div>
    );
};

export default function RegistrarMedidor() {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const pueblos = [
        { key: "NG-", label: "NG" },
        { key: "MP-", label: "MP" },
        { key: "AD-", label: "AD" },
    ];

    const { actualizarMedidores } = useMedidores();
    const [ciudad, setCiudad] = useState("");
    const [clienteIdBusqueda, setClienteIdBusqueda] = useState(null);

    const handleClienteSeleccionado = (id) => {
        setClienteIdBusqueda(id);
    };

    const [numeroSerie, setNumeroSerie] = useState("");
    const [marca, setMarca] = useState("");
    const [modelo, setModelo] = useState("");
    const [ubicacion, setUbicacion] = useState("");
    const [fechaInstalacion, setFechaInstalacion] = useState("");
    const [latitud, setLatitud] = useState("");
    const [longitud, setLongitud] = useState("");
    const [estadoMedidor, setEstadoMedidor] = useState("Activo");
    const [lecturaBase, setLecturaBase] = useState("");
    const [capacidadMaxima, setCapacidadMaxima] = useState("99999");
    const { setSuccess, setError } = useFeedback();

    const numeroSerieCompleto = `${ciudad}${numeroSerie}`;
    const [isUpdating, setIsUpdating] = useState(false);

    const handleRegistroMedidor = async () => {
        setError("");
        setSuccess("");
        setIsUpdating(true);

        const camposFaltantes = [];
        if (!numeroSerie) camposFaltantes.push("Número de serie");
        if (!ubicacion) camposFaltantes.push("Ubicación");
        if (!fechaInstalacion) camposFaltantes.push("Fecha de instalación");
        if (!ciudad) camposFaltantes.push("Ciudad");
        if (!latitud) camposFaltantes.push("Latitud");
        if (!longitud) camposFaltantes.push("Longitud");

        if (camposFaltantes.length > 0) {
            setError(`Los siguientes campos son obligatorios: ${camposFaltantes.join(", ")}.`, "Registro de Medidores");
            setIsUpdating(false);
            return;
        }

        const lat = parseFloat(latitud);
        const lon = parseFloat(longitud);

        if (isNaN(lat) || isNaN(lon)) {
            const erroresNumericos = [];
            if (isNaN(lat)) erroresNumericos.push("Latitud");
            if (isNaN(lon)) erroresNumericos.push("Longitud");

            setError(`${erroresNumericos.join(" y ")} deben ser números válidos.`, "Registro de Medidores");
            setIsUpdating(false);
            return;
        }

        try {
            const tokensession = localStorage.getItem("token");
            const response = await window.api.registerMeter({
                medidor: {
                    cliente_id: clienteIdBusqueda || null,
                    numero_serie: numeroSerieCompleto,
                    marca: marca.trim() || null,
                    modelo: modelo.trim() || null,
                    ubicacion,
                    fecha_instalacion: fechaInstalacion,
                    latitud,
                    longitud,
                    estado_medidor: estadoMedidor,
                    lectura_base: lecturaBase !== "" ? parseFloat(lecturaBase) : null,
                    capacidad_maxima: capacidadMaxima !== "" ? parseFloat(capacidadMaxima) : null,
                },
                token_session: tokensession,
            });

            if (response.success) {
                setSuccess("Medidor registrado exitosamente.", "Registro de Medidores");
                setTimeout(() => {
                    setClienteIdBusqueda(null);
                    setCiudad("");
                    setNumeroSerie("");
                    setMarca("");
                    setModelo("");
                    setUbicacion("");
                    setFechaInstalacion("");
                    setLatitud("");
                    setLongitud("");
                    setLecturaBase("");
                    setCapacidadMaxima("99999");
                    onClose();
                    actualizarMedidores();
                    setIsUpdating(false);
                }, 2000);
            } else {
                setError(response.message, "Registro de Medidores");
                setIsUpdating(false);
            }
        } catch (err) {
            setError("Ocurrió un error en el registro. Intenta nuevamente.", "Registro de Medidores");
            setIsUpdating(false);
        }
    };

    return (
        <>
            <Button
                aria-label="Registrar Medidor"
                color="default"
                variant="solid"
                startContent={<HiPlus className="text-lg" />}
                className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 shadow-sm"
                onPress={onOpen}
            >
                Nuevo Medidor
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
                    {(onClose) => (
                        <>
                            {/* HEADER */}
                            <ModalHeader className="flex flex-col gap-1 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl shrink-0">
                                        <HiCog className="w-7 h-7" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                                            Registrar Nuevo Medidor
                                        </h2>
                                        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
                                            Datos técnicos, Asignación y Ubicación
                                        </p>
                                    </div>
                                </div>
                            </ModalHeader>
                            
                            {/* BODY */}
                            <ModalBody className="custom-scrollbar">
                                <form id="form-registro-medidor" onSubmit={(e) => { e.preventDefault(); handleRegistroMedidor(); }} className="flex flex-col gap-6">
                                    
                                    {/* 1. Información del Medidor (AZUL) */}
                                    <Card className="shadow-none bg-sky-500/10 rounded-2xl border border-sky-200/70 dark:border-sky-900/40">
                                        <CardBody className="p-5 sm:p-6 space-y-6">
                                            <h3 className="font-bold text-base text-sky-900 dark:text-sky-300 flex items-center gap-2 border-b border-sky-200/70 dark:border-sky-900/30 pb-3">
                                                <HiHashtag className="w-5 h-5 text-sky-500" />
                                                Datos del Equipo
                                            </h3>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Número de Serie Compuesto */}
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">
                                                        Número de Serie *
                                                    </label>
                                                    <div className="flex items-stretch gap-2">
                                                        <Select
                                                            aria-label="Código de Ciudad"
                                                            placeholder="Cód."
                                                            selectedKeys={ciudad ? [ciudad] : []}
                                                            onChange={(e) => setCiudad(e.target.value)}
                                                            variant="flat"
                                                            className="w-28 shrink-0"
                                                            classNames={{
                                                                trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 shadow-none h-[46px] rounded-xl hover:border-slate-300 dark:hover:border-zinc-700",
                                                                value: "text-sm font-medium text-slate-800 dark:text-zinc-100"
                                                            }}
                                                        >
                                                            {pueblos.map((pueblo) => (
                                                                <SelectItem key={pueblo.key} value={pueblo.key}>{pueblo.label}</SelectItem>
                                                            ))}
                                                        </Select>
                                                        <div className="flex-1">
                                                            <input
                                                                type="text"
                                                                placeholder="123456"
                                                                value={numeroSerie}
                                                                onChange={(e) => setNumeroSerie(e.target.value)}
                                                                required
                                                                className="w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-300 shadow-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] mt-1.5 ml-1 font-bold text-slate-400 dark:text-zinc-500">
                                                        Serie completa: <span className="text-sky-700 dark:text-sky-400 font-mono">{numeroSerieCompleto || "---"}</span>
                                                    </p>
                                                </div>

                                                <CustomInput
                                                    label="Fecha de Instalación *"
                                                    type="date"
                                                    value={fechaInstalacion}
                                                    onChange={(e) => setFechaInstalacion(e.target.value)}
                                                    icon={<HiCalendar className="w-5 h-5 text-sky-500" />}
                                                    required
                                                />

                                                <CustomInput
                                                    label="Marca"
                                                    placeholder="Ej. AquaTech"
                                                    value={marca}
                                                    onChange={(e) => setMarca(e.target.value)}
                                                    icon={<HiCog className="w-5 h-5 text-sky-500" />}
                                                />

                                                <CustomInput
                                                    label="Modelo"
                                                    placeholder="Ej. AT-150"
                                                    value={modelo}
                                                    onChange={(e) => setModelo(e.target.value)}
                                                    icon={<HiInformationCircle className="w-5 h-5 text-sky-500" />}
                                                />

                                                <CustomInput
                                                    label="Lectura Base (m³)"
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    placeholder="Ej. 0 o 1234.56"
                                                    value={lecturaBase}
                                                    onChange={(e) => setLecturaBase(e.target.value)}
                                                    icon={<HiHashtag className="w-5 h-5 text-sky-500" />}
                                                    description="Valor inicial del medidor al instalarse."
                                                />

                                                <CustomInput
                                                    label="Capacidad Máxima (m³)"
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    placeholder="99999"
                                                    value={capacidadMaxima}
                                                    onChange={(e) => setCapacidadMaxima(e.target.value)}
                                                    icon={<HiHashtag className="w-5 h-5 text-sky-500" />}
                                                    description="Límite antes de dar vuelta a cero (estándar: 99,999)."
                                                />
                                            </div>

                                            <CustomInput
                                                as="textarea"
                                                rows={3}
                                                label="Comentarios de Ubicación *"
                                                placeholder="Ej. Frente a la casa, junto al poste..."
                                                value={ubicacion}
                                                onChange={(e) => setUbicacion(e.target.value)}
                                                icon={<HiLocationMarker className="w-5 h-5 text-sky-500" />}
                                                required
                                            />
                                        </CardBody>
                                    </Card>

                                    {/* 2. Asignación de Cliente (ÍNDIGO) */}
                                    <Card className="shadow-none bg-indigo-500/10 rounded-2xl border border-indigo-200/70 dark:border-indigo-900/40">
                                        <CardBody className="p-5 sm:p-6">
                                            <h3 className="font-bold text-base text-indigo-900 dark:text-indigo-300 flex items-center gap-2 mb-2 border-b border-indigo-100 dark:border-indigo-900/30 pb-3">
                                                <HiUser className="w-5 h-5 text-indigo-500" />
                                                Asignación de Cliente <span className="text-xs font-medium text-indigo-500/60 dark:text-indigo-400/60 normal-case">(Opcional)</span>
                                            </h3>
                                            <p className="text-sm font-medium text-slate-600 dark:text-zinc-400 mb-4">
                                                Selecciona el cliente propietario del inmueble donde se instalará este equipo.
                                            </p>
                                            
                                            <div className="bg-slate-50/80 dark:bg-zinc-950/40 p-4 rounded-xl border border-indigo-200/60 dark:border-zinc-800 shadow-none">
                                                <BuscarCliente onClienteSeleccionado={handleClienteSeleccionado} />
                                                
                                                {clienteIdBusqueda && (
                                                    <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 animate-in fade-in">
                                                        <HiCheck className="text-emerald-600 dark:text-emerald-400 text-lg shrink-0" />
                                                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                                            Cliente vinculado exitosamente (ID: {clienteIdBusqueda})
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardBody>
                                    </Card>

                                    {/* 3. Coordenadas (NARANJA) */}
                                    <Card className="shadow-none bg-amber-500/10 rounded-2xl border border-amber-200/70 dark:border-amber-900/40">
                                        <CardBody className="p-5 sm:p-6">
                                            <h3 className="font-bold text-base text-amber-900 dark:text-amber-300 flex items-center gap-2 mb-2 border-b border-amber-200/70 dark:border-amber-900/30 pb-3">
                                                <HiLocationMarker className="w-5 h-5 text-amber-500" />
                                                Ubicación Geográfica *
                                            </h3>
                                            <p className="text-sm font-medium text-slate-600 dark:text-zinc-400 mb-4">
                                                Ajusta el pin en el mapa para registrar las coordenadas exactas del medidor.
                                            </p>
                                            <div className="rounded-xl overflow-hidden border border-amber-200/60 dark:border-amber-900/50 shadow-none">
                                                <SelectorCoordenadas
                                                    valorInicial={{ lat: parseFloat(latitud) || 29.1180777, lng: parseFloat(longitud) || -109.9669819 }}
                                                    onChange={({ lat, lng }) => {
                                                        setLatitud(lat.toFixed(6));
                                                        setLongitud(lng.toFixed(6));
                                                    }}
                                                />
                                            </div>
                                        </CardBody>
                                    </Card>

                                </form>
                            </ModalBody>
                            
                            {/* FOOTER */}
                            <ModalFooter>
                                <Button
                                    color="default"
                                    variant="flat"
                                    onPress={onClose}
                                    startContent={<HiX className="text-lg" />}
                                    className="font-bold text-slate-600 dark:text-zinc-300 bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-6"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    color="default"
                                    onClick={handleRegistroMedidor}
                                    type="submit"
                                    form="form-registro-medidor"
                                    isDisabled={isUpdating}
                                    isLoading={isUpdating}
                                    startContent={!isUpdating && <HiCheck className="text-lg" />}
                                    className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 shadow-sm"
                                >
                                    {isUpdating ? "Registrando..." : "Registrar Medidor"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}

