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

} from "@nextui-org/react";
import { Datepicker } from "flowbite-react";

import { useState } from "react";
import { AgregarClienteIcon } from "../../../IconsApp/IconsClientes";
import { RegistrarMedidorIcon } from "../../../IconsApp/IconsMedior";
import { useClientes } from "../../../context/ClientesContext";
import { useMedidores } from "../../../context/MedidoresContext";
import BuscarCliente from "./BuscarCliente";
import SelectorCoordenadas from "../../mapa/SelectorCoordenadas";

//para los iconos de los mensajes de feedback
import FeedbackMessages from "../../toast/FeedbackMessages";
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
    const [ubicacion, setUbicacion] = useState("");
    const [fechaInstalacion, setFechaInstalacion] = useState("");
    const [latitud, setLatitud] = useState("");
    const [longitud, setLongitud] = useState("");
    const [estadoMedidor, setEstadoMedidor] = useState("Activo");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const numeroSerieCompleto = `${ciudad}${numeroSerie}`;

    const [isUpdating, setIsUpdating] = useState(false);

    const handleRegistroMedidor = async () => {
        setError("");
        setSuccess("");
        setIsUpdating(true); // Indica que se está realizando una actualización

        // Validaciones de campos
        if (!numeroSerie || !ubicacion || !fechaInstalacion || !latitud || !longitud) {
            setError("Todos los campos son obligatorios.");
            setIsUpdating(false); // Indica que la actualización ha finalizado
            return;
        }

        if (isNaN(parseFloat(latitud)) || isNaN(parseFloat(longitud))) {
            setError("Latitud y longitud deben ser números válidos.");
            setIsUpdating(false); // Indica que la actualización ha finalizado
            return;
        }


        try {
            const tokensession = localStorage.getItem("token");
            const response = await window.api.registerMeter({
                medidor: {
                    cliente_id: clienteIdBusqueda || null, // Si no hay cliente seleccionado, se envía null
                    numero_serie: numeroSerieCompleto,
                    ubicacion,
                    fecha_instalacion: fechaInstalacion,
                    latitud,
                    longitud,
                    estado_medidor: estadoMedidor,
                },
                token_session: tokensession, // Asegúrate de enviar el token de sesión
            });

            //console.log("Respuesta del servidor:", response);

            if (response.success) {
                setSuccess("Medidor registrado exitosamente.");
                setTimeout(() => {
                    setSuccess("");
                    setClienteIdBusqueda(null);
                    setCiudad("");
                    setNumeroSerie("");
                    setUbicacion("");
                    setFechaInstalacion("");
                    setLatitud("");
                    setLongitud("");
                    onClose(); // Cierra el modal automáticamente
                    actualizarMedidores(); // Actualiza la lista de clientes si es necesario
                    setIsUpdating(false); // Indica que la actualización ha finalizado
                }, 2000);
            } else {
                setError(response.message);
                setIsUpdating(false); // Indica que la actualización ha finalizado
            }
        } catch (err) {
            setError("Ocurrió un error en el registro. Intenta nuevamente.");
            setIsUpdating(false); // Indica que la actualización ha finalizado
        }
    };

    return (
        <>
            <Button
                aria-label="Registrar Medidor"
                color="primary"
                className="ml-2 min-w-[50px] px-8 py-2"
                onPress={onOpen}
            >
                <RegistrarMedidorIcon />
                Nuevo Medidor
            </Button>

            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                size="4xl"
                backdrop="transparent"
                scrollBehavior="inside"
                isDismissable={false}
                isKeyboardDismissDisabled={true}
                classNames={{
                    header: "dark:border-b-[1px] dark:border-[#6879bd] border-b-[1px] border-gray-400",
                    footer: "dark:border-t-[1px] dark:border-[#6879bd] border-t-[1px] border-gray-400",
                    closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="text-2xl font-bold text-gray-900 bg-gray-300 dark:bg-gray-700 dark:text-white">
                                Registrar Medidor
                            </ModalHeader>
                            <ModalBody className="bg-gray-200 dark:bg-gray-800">
                                <FeedbackMessages
                                    success={success}
                                    error={error}
                                    setSuccess={setSuccess}
                                    setError={setError}
                                />
                                <form onSubmit={(e) => { e.preventDefault(); handleRegistroMedidor(); }}>
                                    <div className="grid gap-6 mb-6 md:grid-cols-2 mt-2">
                                        <div>
                                            <BuscarCliente onClienteSeleccionado={handleClienteSeleccionado} />
                                            {clienteId && <p>ID del cliente para registrar medidor: {clienteId}</p>}

                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                Número de Serie
                                            </label>
                                            <div className="flex gap-2">
                                                <Select
                                                    className="border rounded-xl dark:border-gray-500 border-gray-600 w-1/2"
                                                    aria-label="Pueblo"
                                                    placeholder="Pueblo"
                                                    value={ciudad}
                                                    defaultSelectedKeys={[ciudad]}
                                                    onChange={(e) => setCiudad(e.target.value)}
                                                    color="default"
                                                >
                                                    {pueblos.map((pueblo) => (
                                                        <SelectItem key={pueblo.key}>{pueblo.label}</SelectItem>
                                                    ))}
                                                </Select>
                                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                    _
                                                </label>
                                                <input
                                                    type="text"
                                                    className="bg-gray-50 border rounded-xl dark:border-gray-500 text-gray-900 text-sm block w-full p-2.5 dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                    placeholder="Número de Serie"
                                                    value={numeroSerie}
                                                    onChange={(e) => setNumeroSerie(e.target.value)}
                                                    required
                                                />

                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                Número de serie completo: <strong>{numeroSerieCompleto}</strong>
                                            </p>


                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                Comentarios de Ubicación de Medidor
                                            </label>
                                            <textarea
                                                type="text"
                                                className="bg-gray-50 border h-32 rounded-xl dark:border-gray-600 text-gray-900 text-sm block w-full p-2.5 dark:bg-neutral-800 dark:text-white"

                                                placeholder="ej. Frente a la casa"
                                                value={ubicacion}
                                                onChange={(e) => setUbicacion(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                Fecha de Instalación
                                            </label>
                                            <input
                                                type="date"
                                                className="bg-gray-50 border rounded-xl dark:border-gray-500 text-gray-900 text-sm block w-full p-2.5 dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                value={fechaInstalacion}
                                                onChange={(e) => setFechaInstalacion(e.target.value)}
                                                required
                                            />
                                        
                                        </div>
                                    </div>
                                    <SelectorCoordenadas
                                        valorInicial={{ lat: parseFloat(latitud) || 29.1180777, lng: parseFloat(longitud) || -109.9669819 }}
                                        onChange={({ lat, lng }) => {
                                            setLatitud(lat.toFixed(6));
                                            setLongitud(lng.toFixed(6));
                                        }}
                                    />


                                </form>
                            </ModalBody>
                            <ModalFooter className="bg-gray-300 dark:bg-gray-700">
                                <Button
                                    color="primary"
                                    onClick={handleRegistroMedidor}
                                    isDisabled={isUpdating}
                                    variant="light"
                                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none font-medium rounded-xl text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700"
                                >
                                    {isUpdating ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            Procesando...
                                        </span>
                                    ) : (
                                        "Registrar Medidor"
                                    )}
                                </Button>

                                <Button
                                    color="danger"
                                    className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 font-medium rounded-xl text-sm px-5 py-2.5"
                                    variant="light"
                                    onPress={onClose}

                                >
                                    Cancelar
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}

