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
    Input,
    Card,
    CardBody
} from "@nextui-org/react";
import { Datepicker } from "flowbite-react";
import { HiPlus, HiLocationMarker, HiCog } from "react-icons/hi";

import { useState } from "react";
import { RegistrarMedidorIcon } from "../../../IconsApp/IconsMedior";
import { useClientes } from "../../../context/ClientesContext";
import { useMedidores } from "../../../context/MedidoresContext";
import BuscarCliente from "./BuscarCliente";
import SelectorCoordenadas from "../../mapa/SelectorCoordenadas";

//para los iconos de los mensajes de feedback
import { useFeedback } from "../../../context/FeedbackContext";
export default function RegistrarMedidor() {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const pueblos = [
        { key: "NG-", label: "NG" },
        { key: "MP-", label: "MP" },
        { key: "AD-", label: "AD" },
    ];

    const { actualizarMedidores } = useMedidores(); // se obtiene el contexto de medidores
    const [ciudad, setCiudad] = useState("");
    const [clienteIdBusqueda, setClienteIdBusqueda] = useState(null); //regrasa el id del cliente del componente de busqueda

    const handleClienteSeleccionado = (id) => {
        setClienteIdBusqueda(id); // Actualiza el estado con el ID del cliente seleccionado
        // Puedes seguir con el registro del medidor aquí
    };


    const [clienteId, setClienteId] = useState("");
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
    const { setSuccess, setError } = useFeedback(); // Importa el contexto de feedback

    const numeroSerieCompleto = `${ciudad}${numeroSerie}`;

    const [isUpdating, setIsUpdating] = useState(false);

    const handleRegistroMedidor = async () => {
        setError("");
        setSuccess("");
        setIsUpdating(true); // Indica que se está realizando una actualización

        // Validaciones de campos
        const camposFaltantes = [];
        if (!numeroSerie) camposFaltantes.push("Número de serie");
        if (!ubicacion) camposFaltantes.push("Ubicación");
        if (!fechaInstalacion) camposFaltantes.push("Fecha de instalación");
        if (!ciudad) camposFaltantes.push("Ciudad");
        if (!latitud) camposFaltantes.push("Latitud");
        if (!longitud) camposFaltantes.push("Longitud");

        if (camposFaltantes.length > 0) {
            setError(`Los siguientes campos son obligatorios: ${camposFaltantes.join(", ")}.`,
                "Registro de Medidores");
            setIsUpdating(false);
            return;
        }

        // Validar que latitud y longitud sean números válidos
        const lat = parseFloat(latitud);
        const lon = parseFloat(longitud);

        if (isNaN(lat) || isNaN(lon)) {
            const erroresNumericos = [];
            if (isNaN(lat)) erroresNumericos.push("Latitud");
            if (isNaN(lon)) erroresNumericos.push("Longitud");

            setError(`${erroresNumericos.join(" y ")} deben ser números válidos.`,
                "Registro de Medidores");
            setIsUpdating(false);
            return;
        }



        try {
            const tokensession = localStorage.getItem("token");
            const response = await window.api.registerMeter({
                medidor: {
                    cliente_id: clienteIdBusqueda || null, // Si no hay cliente seleccionado, se envía null
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
                token_session: tokensession, // Asegúrate de enviar el token de sesión
            });

            //console.log("Respuesta del servidor:", response);

            if (response.success) {
                setSuccess("Medidor registrado exitosamente.", "Registro de Medidores");
                setTimeout(() => {
                    //setSuccess("");
                    setClienteIdBusqueda(null); // Resetea el cliente seleccionado
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
                    onClose(); // Cierra el modal automáticamente
                    actualizarMedidores(); // Actualiza la lista de clientes si es necesario
                    setIsUpdating(false); // Indica que la actualización ha finalizado
                }, 2000);
            } else {
                setError(response.message, "Registro de Medidores");
                setIsUpdating(false); // Indica que la actualización ha finalizado
            }
        } catch (err) {
            setError("Ocurrió un error en el registro. Intenta nuevamente.", "Registro de Medidores");
            setIsUpdating(false); // Indica que la actualización ha finalizado
        }
    };

    return (
        <>
            <Button
                aria-label="Registrar Medidor"
                color="primary"
                variant="solid"
                startContent={<HiPlus className="w-4 h-4" />}
                className="font-medium"
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
                    backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20 ",
                    closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex items-center gap-2 text-xl font-bold">
                                <HiCog className="w-6 h-6 text-blue-600" />
                                Registrar Nuevo Medidor
                            </ModalHeader>
                            
                            <ModalBody className="space-y-6">
                                <form id="form-registro-medidor" onSubmit={(e) => { e.preventDefault(); handleRegistroMedidor(); }}>
                                    
                                    

                                    {/* Información del Medidor */}
                                    <Card className="border border-gray-200 dark:border-gray-700 mt-2">
                                        <CardBody className="space-y-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <HiCog className="w-5 h-5 text-blue-600" />
                                                Datos del Medidor
                                            </h3>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2 mt-2">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Número de Serie
                                                    </label>
                                                    <div className="flex gap-2 items-center">
                                                        <Select
                                                            className="flex-shrink-0 w-24"
                                                            aria-label="Pueblo"
                                                            placeholder="Código"
                                                            value={ciudad}
                                                            defaultSelectedKeys={[ciudad]}
                                                            onChange={(e) => setCiudad(e.target.value)}
                                                            color="primary"
                                                            variant="bordered"
                                                            size="sm"
                                                        >
                                                            {pueblos.map((pueblo) => (
                                                                <SelectItem key={pueblo.key}>{pueblo.label}</SelectItem>
                                                            ))}
                                                        </Select>
                                                        <span className="text-gray-500">-</span>
                                                        <input
                                                            type="text"
                                                            placeholder="Número de serie"
                                                            value={numeroSerie}
                                                            onChange={(e) => setNumeroSerie(e.target.value)}
                                                            variant="bordered"
                                                            size="sm"
                                                            required
                                                            className="w-full p-2 rounded-md border dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                        />
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Serie completa: <strong>{numeroSerieCompleto}</strong>
                                                    </p>
                                                </div>

                                                <div className="space-y-2 mt-2">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Fecha de Instalación
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={fechaInstalacion}
                                                        onChange={(e) => setFechaInstalacion(e.target.value)}
                                                        variant="bordered"
                                                        size="sm"
                                                        className="w-full p-2 rounded-md border dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                {/* Marca */}
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Marca
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ej. AquaTech"
                                                        value={marca}
                                                        onChange={(e) => setMarca(e.target.value)}
                                                        className="w-full p-2 rounded-md border dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                    />
                                                </div>
                                                {/* Modelo */}
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Modelo
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ej. AT-150"
                                                        value={modelo}
                                                        onChange={(e) => setModelo(e.target.value)}
                                                        className="w-full p-2 rounded-md border dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                    />
                                                </div>
                                            </div>

                                            {/* Lectura base y capacidad máxima */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Lectura base del medidor (m³) <span className="text-gray-400 font-normal">— Opcional</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="any"
                                                        placeholder="Ej. 0 o 1234.56"
                                                        value={lecturaBase}
                                                        onChange={(e) => setLecturaBase(e.target.value)}
                                                        className="w-full p-2 rounded-md border dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                    />
                                                    <p className="text-xs text-gray-400">Valor del totalizador al instalar el medidor. Se usará como punto de partida para el primer cálculo de consumo.</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Capacidad máxima del totalizador (m³) <span className="text-gray-400 font-normal">— Opcional</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        placeholder="99999"
                                                        value={capacidadMaxima}
                                                        onChange={(e) => setCapacidadMaxima(e.target.value)}
                                                        className="w-full p-2 rounded-md border dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                    />
                                                    <p className="text-xs text-gray-400">Límite del dial antes de dar vuelta a cero. El estándar para estos medidores es 99,999.</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mt-2">
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Comentarios de Ubicación
                                                </label>
                                                <textarea
                                                    type="text"
                                                    placeholder="ej. Frente a la casa, junto al poste..."
                                                    value={ubicacion}
                                                    onChange={(e) => setUbicacion(e.target.value)}
                                                    variant="bordered"
                                                    size="sm"
                                                    className="w-full p-2 rounded-md border dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                    required
                                                />
                                            </div>
                                        </CardBody>
                                    </Card>

                                    {/* Información del Cliente */}
                                    <Card className="border border-blue-200 dark:border-blue-800 h-64 mt-2">
                                        <CardBody className="space-y-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <HiLocationMarker className="w-5 h-5 text-blue-600" />
                                                Asignación de Cliente
                                            </h3>
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Busca un cliente para asignar el medidor y
                                                selecciona un cliente al que asignar el medidor. No es obligatorio, pero recomendado.
                                            </label>
                                            <BuscarCliente onClienteSeleccionado={handleClienteSeleccionado} />
                                            {clienteIdBusqueda && (
                                                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                                    <p className="text-sm text-green-600 dark:text-green-400">
                                                        ✓ Cliente seleccionado con ID: {clienteIdBusqueda}
                                                    </p>
                                                </div>
                                            )}
                                        </CardBody>
                                    </Card>

                                    {/* Coordenadas */}
                                    <Card className="border border-orange-200 dark:border-orange-800 mt-2">
                                        <CardBody className="space-y-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <HiLocationMarker className="w-5 h-5 text-orange-600" />
                                                Ubicación Geográfica
                                            </h3>
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Selecciona las coordenadas del medidor al hacer clic en el mapa o ingresa manualmente las coordenadas.
                                            </label>
                                            <SelectorCoordenadas
                                                valorInicial={{ lat: parseFloat(latitud) || 29.1180777, lng: parseFloat(longitud) || -109.9669819 }}
                                                onChange={({ lat, lng }) => {
                                                    setLatitud(lat.toFixed(6));
                                                    setLongitud(lng.toFixed(6));
                                                }}
                                            />
                                        </CardBody>
                                    </Card>

                                    
                                </form>
                            </ModalBody>
                            
                            <ModalFooter>
                                <Button
                                    color="danger"
                                    variant="light"
                                    onPress={onClose}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    onClick={handleRegistroMedidor}
                                    type="submit"
                                    form="form-registro-medidor"
                                    isDisabled={isUpdating}
                                    isLoading={isUpdating}
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

