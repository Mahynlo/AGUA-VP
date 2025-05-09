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
import { useState } from "react";
import { AgregarClienteIcon } from "../../../IconsApp/IconsClientes";
import {RegistrarMedidorIcon} from "../../../IconsApp/IconsMedior";
import { useClientes } from "../../../context/ClientesContext";
import { useMedidores } from "../../../context/MedidoresContext";
import BuscarCliente from "./BuscarCliente";

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

    const handleRegistroMedidor = async () => {
        setError("");
        setSuccess("");

        // Validaciones de campos
        if (!numeroSerie || !ubicacion || !fechaInstalacion || !latitud || !longitud) {
            setError("Todos los campos son obligatorios.");
            return;
        }

        if (isNaN(parseFloat(latitud)) || isNaN(parseFloat(longitud))) {
            setError("Latitud y longitud deben ser números válidos.");
            return;
        }
        

        try {
            const response = await window.api.registerMeter({
                cliente_id: clienteIdBusqueda || null, // Si no hay cliente seleccionado, se envía null
                numero_serie: numeroSerieCompleto,
                ubicacion,
                fecha_instalacion: fechaInstalacion,
                latitud,
                longitud,
                estado_medidor: estadoMedidor,
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
                }, 2000);
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError("Ocurrió un error en el registro. Intenta nuevamente.");
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
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="text-2xl font-bold text-gray-900 bg-gray-300 dark:bg-gray-700 dark:text-white">
                                Registrar Medidor
                            </ModalHeader>
                            <ModalBody className="bg-gray-200 dark:bg-gray-800">
                                {success && (
                                    <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900 dark:text-green-300">
                                        {success}
                                    </div>
                                )}
                                {error && (
                                    <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300">
                                        {error}
                                    </div>
                                )}

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
                                                Ubicación
                                            </label>
                                            <input
                                                type="text"
                                                className="bg-gray-50 border rounded-xl dark:border-gray-500 text-gray-900 text-sm block w-full p-2.5 dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
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
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                Latitud
                                            </label>
                                            <input
                                                type="text"
                                                className="bg-gray-50 border rounded-xl dark:border-gray-500 text-gray-900 text-sm block w-full p-2.5 dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                placeholder="ej. -29.1180777"
                                                value={latitud}
                                                onChange={(e) => setLatitud(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                Longitud
                                            </label>
                                            <input
                                                type="text"
                                                className="bg-gray-50 border rounded-xl dark:border-gray-500 text-gray-900 text-sm block w-full p-2.5 dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                placeholder="ej. -109.9669819"
                                                value={longitud}
                                                onChange={(e) => setLongitud(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none font-medium rounded-xl text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700"
                                    >
                                        Registrar Medidor
                                    </button>
                                </form>
                            </ModalBody>
                            <ModalFooter className="bg-gray-300 dark:bg-gray-700">
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

