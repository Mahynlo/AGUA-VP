import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Select,
    SelectItem,
    Card,
    CardBody,
    Chip
} from "@nextui-org/react";
import { HiCog, HiLocationMarker, HiUser, HiHashtag, HiCalendar, HiInformationCircle, HiCheck, HiX } from "react-icons/hi";
import { useState, useEffect } from "react";
import { useMedidores } from "../../../context/MedidoresContext";
import { useClientes } from "../../../context/ClientesContext";
import { useFeedback } from "../../../context/FeedbackContext";
import BuscarCliente from "./BuscarCliente";
import SelectorCoordenadas from "../../mapa/SelectorCoordenadas";

// Componente de Input Personalizado (Premium UI)
const CustomInput = ({ label, value, onChange, icon, type = "text", color = "blue", description, placeholder, as = "input", min, step, ...props }) => {
    const focusColors = {
        blue: "focus:ring-blue-500 focus:border-blue-500",
        orange: "focus:ring-orange-500 focus:border-orange-500",
        indigo: "focus:ring-indigo-500 focus:border-indigo-500",
    };

    const inputClasses = `
        w-full pl-10 pr-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 resize-none
        bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100
        border border-slate-200 dark:border-zinc-700
        hover:bg-slate-50 dark:hover:bg-zinc-800
        focus:outline-none focus:ring-2 shadow-sm
        placeholder-slate-400 dark:placeholder-zinc-500
        ${focusColors[color] || focusColors.blue}
    `;

    return (
        <div className="w-full">
            {label && (
                <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">
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
                <div className="mt-1.5 ml-1 font-medium">{description}</div>
            )}
        </div>
    );
};

export default function ModalEditarMedidor({ isOpen, onClose, medidor }) {
    const { actualizarMedidores } = useMedidores();
    const { allClientes } = useClientes();
    const { setSuccess, setError } = useFeedback();

    const pueblos = [
        { key: "NG-", label: "NG" },
        { key: "MP-", label: "MP" },
        { key: "AD-", label: "AD" },
    ];

    // --- LOGIC TO PARSE PROPS INTO INITIAL STATE ---
    const parseInitialState = () => {
        if (!medidor) return {
            ciudad: "",
            numeroSerie: "",
            marca: "",
            modelo: "",
            ubicacion: "",
            fechaInstalacion: "",
            latitud: "",
            longitud: "",
            estadoMedidor: "Activo",
            clienteId: null,
            lecturaBase: "",
            capacidadMaxima: "",
        };

        let prefix = "";
        let serie = medidor.numero_serie || "";

        const foundPrefix = pueblos.find(p => serie.startsWith(p.key));
        if (foundPrefix) {
            prefix = foundPrefix.key;
            serie = serie.substring(prefix.length);
        }

        return {
            ciudad: prefix,
            numeroSerie: serie,
            marca: medidor.marca || "",
            modelo: medidor.modelo || "",
            ubicacion: medidor.ubicacion || "",
            fechaInstalacion: medidor.fecha_instalacion ? medidor.fecha_instalacion.split('T')[0] : "",
            latitud: medidor.latitud !== null && medidor.latitud !== undefined ? medidor.latitud.toString() : "",
            longitud: medidor.longitud !== null && medidor.longitud !== undefined ? medidor.longitud.toString() : "",
            estadoMedidor: medidor.estado_medidor || "Activo",
            clienteId: medidor.cliente_id,
            lecturaBase: medidor.lectura_base !== null && medidor.lectura_base !== undefined ? medidor.lectura_base.toString() : "",
            capacidadMaxima: medidor.capacidad_maxima !== null && medidor.capacidad_maxima !== undefined ? medidor.capacidad_maxima.toString() : "99999",
        };
    };

    const initialState = parseInitialState();

    // Estados del formulario
    const [ciudad, setCiudad] = useState(initialState.ciudad);
    const [numeroSerie, setNumeroSerie] = useState(initialState.numeroSerie);
    const [marca, setMarca] = useState(initialState.marca);
    const [modelo, setModelo] = useState(initialState.modelo);
    const [ubicacion, setUbicacion] = useState(initialState.ubicacion);
    const [fechaInstalacion, setFechaInstalacion] = useState(initialState.fechaInstalacion);
    const [latitud, setLatitud] = useState(initialState.latitud);
    const [longitud, setLongitud] = useState(initialState.longitud);
    const [estadoMedidor, setEstadoMedidor] = useState(initialState.estadoMedidor);
    const [clienteId, setClienteId] = useState(initialState.clienteId);
    const [lecturaBase, setLecturaBase] = useState(initialState.lecturaBase);
    const [capacidadMaxima, setCapacidadMaxima] = useState(initialState.capacidadMaxima);

    const [clienteActual] = useState(initialState.clienteId);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (medidor && isOpen) {
            const newData = parseInitialState();
            setCiudad(newData.ciudad);
            setNumeroSerie(newData.numeroSerie);
            setMarca(newData.marca);
            setModelo(newData.modelo);
            setUbicacion(newData.ubicacion);
            setFechaInstalacion(newData.fechaInstalacion);
            setLatitud(newData.latitud);
            setLongitud(newData.longitud);
            setEstadoMedidor(newData.estadoMedidor);
            setClienteId(newData.clienteId);
            setLecturaBase(newData.lecturaBase);
            setCapacidadMaxima(newData.capacidadMaxima);
        }
    }, [medidor, isOpen]);

    const numeroSerieCompleto = `${ciudad}${numeroSerie}`;

    const handleClienteSeleccionado = (id) => {
        setClienteId(id);
    };

    const getChangedFields = () => {
        const changes = {};

        if (numeroSerieCompleto !== medidor.numero_serie) changes.numero_serie = numeroSerieCompleto;
        if (ubicacion !== medidor.ubicacion) changes.ubicacion = ubicacion;
        if (marca !== (medidor.marca || "")) changes.marca = marca.trim() || null;
        if (modelo !== (medidor.modelo || "")) changes.modelo = modelo.trim() || null;
        
        const originalDate = medidor.fecha_instalacion ? medidor.fecha_instalacion.split('T')[0] : "";
        if (fechaInstalacion !== originalDate) changes.fecha_instalacion = fechaInstalacion;

        const currentLat = parseFloat(latitud);
        const currentLng = parseFloat(longitud);
        const originalLat = parseFloat(medidor.latitud);
        const originalLng = parseFloat(medidor.longitud);

        if (Math.abs(currentLat - originalLat) > 0.000001) changes.latitud = currentLat;
        if (Math.abs(currentLng - originalLng) > 0.000001) changes.longitud = currentLng;
        if (estadoMedidor !== medidor.estado_medidor) changes.estado_medidor = estadoMedidor;
        if (clienteId != medidor.cliente_id) changes.cliente_id = clienteId === null ? null : clienteId;

        const newLecturaBase = lecturaBase !== "" ? parseFloat(lecturaBase) : null;
        const origLecturaBase = medidor.lectura_base !== null && medidor.lectura_base !== undefined ? parseFloat(medidor.lectura_base) : null;
        if (newLecturaBase !== origLecturaBase) changes.lectura_base = newLecturaBase;

        const newCapMaxima = capacidadMaxima !== "" ? parseFloat(capacidadMaxima) : null;
        const origCapMaxima = medidor.capacidad_maxima !== null && medidor.capacidad_maxima !== undefined ? parseFloat(medidor.capacidad_maxima) : null;
        if (newCapMaxima !== origCapMaxima) changes.capacidad_maxima = newCapMaxima;

        return changes;
    }

    const handleUpdate = async () => {
        setIsUpdating(true);
        setError("");

        if (!numeroSerie || !ubicacion || !latitud || !longitud) {
            setError("Por favor verifica que no haya campos vacíos inválidos.", "Edición de Medidor");
            setIsUpdating(false);
            return;
        }

        const lat = parseFloat(latitud);
        const lon = parseFloat(longitud);

        if (isNaN(lat) || isNaN(lon)) {
            setError("Latitud y Longitud deben ser números válidos.", "Edición de Medidor");
            setIsUpdating(false);
            return;
        }

        const changes = getChangedFields();

        if (Object.prototype.hasOwnProperty.call(changes, 'lectura_base')) {
            const confirmar = window.confirm(
                "Estás por modificar la lectura base del medidor. Si ya existen lecturas o facturas, esto puede afectar la trazabilidad histórica. ¿Deseas continuar?"
            );

            if (!confirmar) {
                setIsUpdating(false);
                return;
            }
        }

        if (Object.keys(changes).length === 0) {
            setSuccess("No hay cambios para guardar.", "Edición de Medidor");
            setIsUpdating(false);
            setTimeout(() => {
                onClose();
            }, 1000);
            return;
        }

        try {
            const token = localStorage.getItem("token");

            const result = await window.api.updateMedidor({
                id: medidor.id,
                medidor: changes,
                token_session: token
            });

            if (result.success) {
                setSuccess("Medidor actualizado correctamente.", "Edición de Medidor");
                await actualizarMedidores();
                setTimeout(() => {
                    onClose();
                }, 1500);
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
            isOpen={isOpen}
            onClose={onClose}
            size="4xl"
            backdrop="blur"
            scrollBehavior="inside"
            isDismissable={false}
            isKeyboardDismissDisabled={true}
            placement="center"
            classNames={{
                base: "bg-white dark:bg-zinc-900 shadow-2xl",
                backdrop: "bg-zinc-900/50 backdrop-blur-sm",
                header: "border-b border-slate-100 dark:border-zinc-800",
                footer: "border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900",
                closeButton: "hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 text-slate-400 dark:text-zinc-500 transition-colors z-50",
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        {/* HEADER */}
                        <ModalHeader className="flex flex-col gap-1 pt-6 px-6 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                                    <HiCog className="w-7 h-7" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                                        Editar Medidor
                                    </h2>
                                    <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-1">
                                        Actualizar datos técnicos, cliente y ubicación
                                    </p>
                                </div>
                            </div>
                        </ModalHeader>

                        {/* BODY */}
                        <ModalBody className="py-6 px-4 sm:px-6 bg-slate-50/50 dark:bg-black/10 custom-scrollbar">
                            <form id="form-editar-medidor" onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="flex flex-col gap-6">

                                {/* 1. Información del Medidor (AZUL) */}
                                <Card className="shadow-sm bg-blue-50/40 dark:bg-blue-900/10 rounded-2xl border border-blue-200/70 dark:border-blue-800/50">
                                    <CardBody className="p-5 sm:p-6 space-y-6">
                                        <h3 className="font-bold text-base text-blue-900 dark:text-blue-300 flex items-center gap-2 border-b border-blue-100 dark:border-blue-900/30 pb-3">
                                            <HiHashtag className="w-5 h-5 text-blue-500" />
                                            Datos del Equipo
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Número de Serie */}
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
                                                        variant="bordered"
                                                        className="w-28 shrink-0"
                                                        classNames={{
                                                            trigger: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 shadow-sm h-[42px] rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800",
                                                            value: "text-sm font-medium text-slate-800 dark:text-zinc-100"
                                                        }}
                                                    >
                                                        {pueblos.map((p) => (
                                                            <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                                                        ))}
                                                    </Select>
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            placeholder="123456"
                                                            value={numeroSerie}
                                                            onChange={(e) => setNumeroSerie(e.target.value)}
                                                            required
                                                            className="w-full px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-[10px] mt-1.5 ml-1 font-bold text-slate-400 dark:text-zinc-500">
                                                    Serie completa: <span className="text-blue-600 dark:text-blue-400 font-mono">{numeroSerieCompleto || "---"}</span>
                                                </p>
                                            </div>

                                            {/* Estado del Medidor */}
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">
                                                    Estado Operativo
                                                </label>
                                                <Select
                                                    selectedKeys={[estadoMedidor]}
                                                    onChange={(e) => setEstadoMedidor(e.target.value)}
                                                    variant="bordered"
                                                    aria-label="Estado del medidor"
                                                    classNames={{
                                                        trigger: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 shadow-sm h-[42px] rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800",
                                                        value: "text-sm font-medium text-slate-800 dark:text-zinc-100"
                                                    }}
                                                >
                                                    <SelectItem key="Activo" value="Activo">Activo</SelectItem>
                                                    <SelectItem key="Inactivo" value="Inactivo">Inactivo</SelectItem>
                                                    <SelectItem key="Retirado" value="Retirado">Retirado</SelectItem>
                                                    <SelectItem key="No instalado" value="No instalado">No instalado</SelectItem>
                                                </Select>
                                            </div>

                                            <CustomInput
                                                label="Fecha de Instalación *"
                                                type="date"
                                                value={fechaInstalacion}
                                                onChange={(e) => setFechaInstalacion(e.target.value)}
                                                icon={<HiCalendar className="w-5 h-5 text-blue-500" />}
                                                required
                                            />

                                            <CustomInput
                                                label="Marca"
                                                placeholder="Ej. AquaTech"
                                                value={marca}
                                                onChange={(e) => setMarca(e.target.value)}
                                                icon={<HiCog className="w-5 h-5 text-blue-500" />}
                                            />

                                            <CustomInput
                                                label="Modelo"
                                                placeholder="Ej. AT-150"
                                                value={modelo}
                                                onChange={(e) => setModelo(e.target.value)}
                                                icon={<HiInformationCircle className="w-5 h-5 text-blue-500" />}
                                            />

                                            <CustomInput
                                                label="Lectura Base (m³)"
                                                type="number"
                                                min="0"
                                                step="any"
                                                placeholder="Ej. 0 o 1234.56"
                                                value={lecturaBase}
                                                onChange={(e) => setLecturaBase(e.target.value)}
                                                icon={<HiHashtag className="w-5 h-5 text-blue-500" />}
                                                description={
                                                    <>
                                                        Punto de partida al instalar. <span className="text-amber-600 dark:text-amber-400">Puede afectar el historial.</span>
                                                    </>
                                                }
                                            />

                                            <CustomInput
                                                label="Capacidad Máxima (m³)"
                                                type="number"
                                                min="1"
                                                step="1"
                                                placeholder="99999"
                                                value={capacidadMaxima}
                                                onChange={(e) => setCapacidadMaxima(e.target.value)}
                                                icon={<HiHashtag className="w-5 h-5 text-blue-500" />}
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
                                            icon={<HiLocationMarker className="w-5 h-5 text-blue-500" />}
                                            required
                                        />
                                    </CardBody>
                                </Card>

                                {/* 2. Asignación de Cliente (ÍNDIGO) */}
                                <Card className="shadow-sm bg-indigo-50/40 dark:bg-indigo-900/10 rounded-2xl border border-indigo-200/70 dark:border-indigo-800/50">
                                    <CardBody className="p-5 sm:p-6">
                                        <div className="flex justify-between items-center mb-2 border-b border-indigo-100 dark:border-indigo-900/30 pb-3">
                                            <h3 className="font-bold text-base text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                                                <HiUser className="w-5 h-5 text-indigo-500" />
                                                Asignación de Cliente
                                            </h3>
                                            <Chip 
                                                color={clienteId ? "primary" : "success"} 
                                                variant={clienteId ? "solid" : "flat"} 
                                                size="sm" 
                                                className="font-bold text-[10px] uppercase tracking-wider h-6 px-1"
                                            >
                                                {clienteId ? "Ocupado" : "Disponible"}
                                            </Chip>
                                        </div>

                                        <div className="mt-4">
                                            {clienteId ? (
                                                <div className="space-y-3">
                                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-indigo-100 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-indigo-500/80 dark:text-indigo-400/80 uppercase tracking-widest mb-1">
                                                                Asignado Actualmente a
                                                            </p>
                                                            <p className="text-lg font-bold text-slate-800 dark:text-zinc-100 leading-tight truncate">
                                                                {allClientes.find(c => c.id === clienteId)?.nombre || "Cargando nombre..."}
                                                            </p>
                                                            <p className="text-xs text-slate-500 dark:text-zinc-500 font-mono mt-0.5">
                                                                ID Cliente: {clienteId}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="bg-orange-50 dark:bg-orange-900/10 p-3.5 rounded-xl border border-orange-200/60 dark:border-orange-800/50 flex gap-3 items-start">
                                                        <div className="p-1.5 bg-orange-100 dark:bg-orange-800/50 rounded-full shrink-0">
                                                            <HiCog className="text-orange-600 dark:text-orange-400 w-4 h-4 animate-spin-slow" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-orange-800 dark:text-orange-300">Acción Requerida para Reasignar</p>
                                                            <p className="text-xs text-orange-700/80 dark:text-orange-200/80 mt-1 leading-relaxed">
                                                                Para asignar este medidor a otra persona, <strong>primero debe liberarlo</strong> desde el panel de edición del cliente actual.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">
                                                        Este medidor está libre. Busque un cliente para asignarlo ahora.
                                                    </p>
                                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-indigo-100 dark:border-zinc-800 shadow-sm">
                                                        <BuscarCliente onClienteSeleccionado={handleClienteSeleccionado} />
                                                        {clienteId && (
                                                            <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 animate-in fade-in">
                                                                <HiCheck className="text-emerald-600 dark:text-emerald-400 text-lg shrink-0" />
                                                                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                                                    Se asignará al Cliente ID: <strong>{clienteId}</strong> al guardar.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* 3. Coordenadas (NARANJA) */}
                                <Card className="shadow-sm bg-orange-50/40 dark:bg-orange-900/10 rounded-2xl border border-orange-200/70 dark:border-orange-800/50">
                                    <CardBody className="p-5 sm:p-6 space-y-4">
                                        <h3 className="font-bold text-base text-orange-900 dark:text-orange-300 flex items-center gap-2 mb-2 border-b border-orange-100 dark:border-orange-900/30 pb-3">
                                            <HiLocationMarker className="w-5 h-5 text-orange-500" />
                                            Ubicación Geográfica *
                                        </h3>
                                        
                                        <div className="rounded-xl overflow-hidden border border-orange-200/60 dark:border-orange-800/50 shadow-sm">
                                            <SelectorCoordenadas
                                                key={`coords-${medidor?.id}`}
                                                valorInicial={{
                                                    lat: parseFloat(latitud) || 29.1180777,
                                                    lng: parseFloat(longitud) || -109.9669819
                                                }}
                                                onChange={({ lat, lng }) => {
                                                    setLatitud(lat.toFixed(6));
                                                    setLongitud(lng.toFixed(6));
                                                }}
                                            />
                                        </div>
                                        <div className="flex gap-4 text-xs font-mono text-orange-700/60 dark:text-orange-400/60 bg-white dark:bg-zinc-900 w-fit px-3 py-1.5 rounded-lg border border-orange-100 dark:border-zinc-800 shadow-sm">
                                            <span>Lat: <strong className="text-slate-700 dark:text-zinc-300">{latitud}</strong></span>
                                            <span>Lng: <strong className="text-slate-700 dark:text-zinc-300">{longitud}</strong></span>
                                        </div>
                                    </CardBody>
                                </Card>

                            </form>
                        </ModalBody>
                        
                        {/* FOOTER */}
                        <ModalFooter className="px-6 py-4">
                            <Button 
                                color="default" 
                                variant="light" 
                                onPress={onClose}
                                startContent={<HiX className="text-lg" />}
                                className="font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                            >
                                Cancelar
                            </Button>
                            <Button
                                color="primary"
                                onClick={handleUpdate}
                                type="submit"
                                form="form-editar-medidor"
                                isDisabled={isUpdating}
                                isLoading={isUpdating}
                                startContent={!isUpdating && <HiCheck className="text-lg" />}
                                className="font-bold shadow-md shadow-blue-500/30 px-6"
                            >
                                {isUpdating ? "Guardando..." : "Guardar Cambios"}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}