import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Select,
    SelectItem,
    Input,
    Card,
    CardBody,
    Chip
} from "@nextui-org/react";
import { HiCog, HiLocationMarker, HiUser } from "react-icons/hi";
import { useState, useEffect } from "react";
import { useMedidores } from "../../../context/MedidoresContext";
import { useClientes } from "../../../context/ClientesContext";
import { useFeedback } from "../../../context/FeedbackContext";
import BuscarCliente from "./BuscarCliente";
import SelectorCoordenadas from "../../mapa/SelectorCoordenadas";

export default function ModalEditarMedidor({ isOpen, onClose, medidor }) {
    const { actualizarMedidores } = useMedidores();
    const { clientes } = useClientes();
    const { setSuccess, setError } = useFeedback();

    const pueblos = [
        { key: "NG-", label: "NG" },
        { key: "MP-", label: "MP" },
        { key: "AD-", label: "AD" },
    ];

    // --- LOGIC TO PARSE PROPS INTO INITIAL STATE ---
    // We do this directly in initialization to avoid flash of empty state
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
            clienteId: null
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
            clienteId: medidor.cliente_id
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

    // Fixed reference
    const [clienteActual] = useState(initialState.clienteId);

    const [isUpdating, setIsUpdating] = useState(false);

    // Sync if medidor prop changes significantly (fallback if key={id} approach fails, but usually initialization is enough)
    useEffect(() => {
        if (medidor && isOpen) {
            const newData = parseInitialState();
            setCiudad(newData.ciudad);
            setNumeroSerie(newData.numeroSerie);
            setMarca(newData.marca);
            setModelo(newData.modelo);
            setUbicacion(newData.ubicacion);
            setFechaInstalacion(newData.fechaInstalacion);
            setLatitud(newData.latitud); // This is key for the map
            setLongitud(newData.longitud);
            setEstadoMedidor(newData.estadoMedidor);
            setClienteId(newData.clienteId);
        }
    }, [medidor, isOpen]);

    const numeroSerieCompleto = `${ciudad}${numeroSerie}`;

    const handleClienteSeleccionado = (id) => {
        setClienteId(id);
    };

    const getChangedFields = () => {
        const changes = {};

        // 1. Serie
        if (numeroSerieCompleto !== medidor.numero_serie) {
            changes.numero_serie = numeroSerieCompleto;
        }

        // 2. Ubicacion
        if (ubicacion !== medidor.ubicacion) {
            changes.ubicacion = ubicacion;
        }

        // 2a. Marca
        if (marca !== (medidor.marca || "")) {
            changes.marca = marca.trim() || null;
        }

        // 2b. Modelo
        if (modelo !== (medidor.modelo || "")) {
            changes.modelo = modelo.trim() || null;
        }

        // 3. Fecha
        const originalDate = medidor.fecha_instalacion ? medidor.fecha_instalacion.split('T')[0] : "";
        if (fechaInstalacion !== originalDate) {
            changes.fecha_instalacion = fechaInstalacion;
        }

        // 4. Coordenadas
        const currentLat = parseFloat(latitud);
        const currentLng = parseFloat(longitud);
        const originalLat = parseFloat(medidor.latitud);
        const originalLng = parseFloat(medidor.longitud);

        if (Math.abs(currentLat - originalLat) > 0.000001) {
            changes.latitud = currentLat;
        }
        if (Math.abs(currentLng - originalLng) > 0.000001) {
            changes.longitud = currentLng;
        }

        // 5. Estado
        if (estadoMedidor !== medidor.estado_medidor) {
            changes.estado_medidor = estadoMedidor;
        }

        // 6. Cliente
        // Si el clienteId cambia (comparación flexible para ids numéricos/string)
        if (clienteId != medidor.cliente_id) {
            changes.cliente_id = clienteId === null ? null : clienteId;
        }

        return changes;
    }

    const handleUpdate = async () => {
        setIsUpdating(true);
        setError("");

        // Validaciones básicas de integridad
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

        // Obtener solo los cambios
        const changes = getChangedFields();

        // Si no hay cambios, avisar
        if (Object.keys(changes).length === 0) {
            setSuccess("No hay cambios para guardar.", "Edición de Medidor");
            setIsUpdating(false);
            setTimeout(() => {
                onClose();
            }, 1000);
            return;
        }

        // console.log("Enviando cambios parciales:", changes);

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
            classNames={{
                backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
                closeButton: "hover:bg-red-600 hover:text-white"
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex items-center gap-2 text-xl font-bold">
                            <HiCog className="w-6 h-6 text-blue-600" />
                            Editar Medidor
                        </ModalHeader>
                        <ModalBody className="space-y-4">
                            <form id="form-editar-medidor" onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>

                                {/* 1. Información del Medidor */}
                                <Card className="border border-gray-200 dark:border-gray-700">
                                    <CardBody className="space-y-4">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <HiCog className="w-5 h-5 text-blue-600" />
                                            Datos del Medidor
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Serie */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Número de Serie</label>
                                                <div className="flex gap-2 items-center">
                                                    <Select
                                                        className="w-24 flex-shrink-0"
                                                        aria-label="Prefijo"
                                                        placeholder="Código"
                                                        selectedKeys={ciudad ? [ciudad] : []}
                                                        onChange={(e) => setCiudad(e.target.value)}
                                                        variant="bordered"
                                                        size="sm"
                                                    >
                                                        {pueblos.map((p) => (
                                                            <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                                                        ))}
                                                    </Select>
                                                    <span className="text-gray-500">-</span>
                                                    <input
                                                        type="text"
                                                        className="w-full p-2 rounded-md border dark:bg-neutral-800 dark:border-gray-600"
                                                        value={numeroSerie}
                                                        onChange={(e) => setNumeroSerie(e.target.value)}
                                                        placeholder="123456"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    Serie completa: <strong>{numeroSerieCompleto}</strong>
                                                </p>
                                            </div>

                                            {/* Estado */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Estado</label>
                                                <Select
                                                    selectedKeys={[estadoMedidor]}
                                                    onChange={(e) => setEstadoMedidor(e.target.value)}
                                                    variant="bordered"
                                                    size="sm"
                                                    aria-label="Estado del medidor"
                                                >
                                                    <SelectItem key="Activo" value="Activo">Activo</SelectItem>
                                                    <SelectItem key="Inactivo" value="Inactivo">Inactivo</SelectItem>
                                                    <SelectItem key="Mantenimiento" value="Mantenimiento">Mantenimiento</SelectItem>
                                                </Select>
                                            </div>

                                            {/* Fecha Instalación */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Fecha de Instalación</label>
                                                <input
                                                    type="date"
                                                    className="w-full p-2 rounded-md border dark:bg-neutral-800 dark:border-gray-600"
                                                    value={fechaInstalacion}
                                                    onChange={(e) => setFechaInstalacion(e.target.value)}
                                                />
                                            </div>

                                            {/* Marca */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Marca</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 rounded-md border dark:bg-neutral-800 dark:border-gray-600"
                                                    value={marca}
                                                    onChange={(e) => setMarca(e.target.value)}
                                                    placeholder="Ej. AquaTech"
                                                />
                                            </div>

                                            {/* Modelo */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Modelo</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 rounded-md border dark:bg-neutral-800 dark:border-gray-600"
                                                    value={modelo}
                                                    onChange={(e) => setModelo(e.target.value)}
                                                    placeholder="Ej. AT-150"
                                                />
                                            </div>

                                            {/* Ubicación Texto */}
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-sm font-medium">Comentarios de Ubicación</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 rounded-md border dark:bg-neutral-800 dark:border-gray-600"
                                                    value={ubicacion}
                                                    onChange={(e) => setUbicacion(e.target.value)}
                                                    placeholder="Ej. Frente al poste..."
                                                />
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* 2. Asignación de Cliente */}
                                <Card className="border border-blue-200 dark:border-blue-800 mt-2">
                                    <CardBody className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold flex items-center gap-2">
                                                <HiUser className="w-5 h-5 text-blue-600" />
                                                Asignación de Cliente
                                            </h3>
                                            {clienteId ? (
                                                <Chip color="primary" variant="solid" size="sm">Ocupado</Chip>
                                            ) : (
                                                <Chip color="success" variant="flat" size="sm">Disponible</Chip>
                                            )}
                                        </div>

                                        {/* Lógica Estricta de Asignación */}
                                        {clienteId ? (
                                            <div className="space-y-3">
                                                {/* Información del Cliente Actual */}
                                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">
                                                        Asignado a
                                                    </p>
                                                    <div className="flex flex-col">
                                                        <span className="text-lg font-bold text-gray-800 dark:text-white">
                                                            {clientes.find(c => c.id === clienteId)?.nombre || "Cargando nombre..."}
                                                        </span>
                                                        <span className="text-sm text-gray-500 font-mono">
                                                            ID Cliente: {clienteId}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Advertencia de Bloqueo */}
                                                <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded border border-orange-200 dark:border-orange-800 flex gap-3 items-start">
                                                    <div className="mt-0.5 min-w-[20px]">
                                                        <HiCog className="text-orange-500 animate-spin-slow" />
                                                    </div>
                                                    <div className="text-sm text-orange-800 dark:text-orange-200">
                                                        <p className="font-bold">Acción Requerida para Reasignar</p>
                                                        <p className="mt-1 opacity-90">
                                                            Para asignar este medidor a otra persona, <strong>primero debe liberarlo</strong> del cliente actual.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="text-sm text-gray-600">
                                                    <p>Este medidor no tiene cliente asignado. Busque un cliente para asignarlo ahora.</p>
                                                </div>

                                                {/* Componente de Búsqueda solo visible si NO hay cliente */}
                                                <BuscarCliente onClienteSeleccionado={handleClienteSeleccionado} />

                                                {clienteId && (
                                                    <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-sm text-green-700">
                                                        Se asignará al Cliente ID: <strong>{clienteId}</strong> al guardar.
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    </CardBody>
                                </Card>

                                {/* 3. Ubicación Geográfica */}
                                <Card className="border border-orange-200 dark:border-orange-800 mt-2">
                                    <CardBody className="space-y-4">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <HiLocationMarker className="w-5 h-5 text-orange-600" />
                                            Ubicación Geográfica
                                        </h3>
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
                                        <div className="flex gap-4 text-xs text-gray-500">
                                            <span>Lat: {latitud}</span>
                                            <span>Lng: {longitud}</span>
                                        </div>
                                    </CardBody>
                                </Card>

                            </form>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Cancelar
                            </Button>
                            <Button
                                color="primary"
                                type="submit"
                                form="form-editar-medidor"
                                isLoading={isUpdating}
                                isDisabled={isUpdating}
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
