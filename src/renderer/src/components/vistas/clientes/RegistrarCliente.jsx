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
import { AgregarClienteIcon } from "../../../IconsApp/IconsSidebar";
import { useAuth } from "../../../context/AuthContext";
import { useClientes } from "../../../context/ClientesContext";

export default function RegistrarClientes() {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const pueblos = [
        { key: "Nacori Grande", label: "Nacori Grande" },
        { key: "Matape", label: "Matape" },
        { key: "Adivino", label: "Adivino" },
    ];
    const { user } = useAuth();
    const { actualizarClientes } = useClientes();

    const [nombre, setNombre] = useState("");
    const [direccion, setDireccion] = useState("");
    const [telefono, setTelefono] = useState("");
    const [ciudad, setCiudad] = useState("");
    const [correo, setCorreo] = useState("");
    const [estadoCliente, setEstadoCliente] = useState("");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleRegistroCliente = async () => {
        setError("");
        setSuccess("");

        // Validaciones de campos
        if (!nombre || !direccion || !telefono || !ciudad || !correo) {
            setError("Todos los campos son obligatorios.");
            return;
        }
        //console.log("Datos enviados al proceso principal:", { nombre, direccion, telefono, ciudad, correo, estadoCliente: "Activo", modificado_por: user.id });
        try {
            const response = await window.api.registerClient({
                nombre,
                direccion,
                telefono,
                ciudad,
                correo,
                estado_cliente: "Activo",
                modificado_por: user.id,
            });
            //console.log("Respuesta del servidor:", response);

            if (response.success) {
                setSuccess("Cliente registrado exitosamente.");
                setTimeout(() => {
                    setSuccess("");
                    setNombre("");
                    setDireccion("");
                    setTelefono("");
                    setCiudad("");
                    setCorreo("");
                    onClose(); // Cierra el modal automáticamente
                    actualizarClientes(); // Actualiza la lista de clientes
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
                aria-label="Editar"
                color="primary"
                className="ml-2 min-w-[50px] px-8 py-2"
                onPress={onOpen}
            >
                <AgregarClienteIcon />
                Nuevo Cliente
            </Button>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="4xl" backdrop="transparent"
                scrollBehavior="inside"
                
                classNames={{
                    header: "dark:border-b-[1px] dark:border-[#6879bd] border-b-[1px] border-gray-400",
                    footer: "dark:border-t-[1px] dark:border-[#6879bd] border-t-[1px] border-gray-400",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="text-2xl font-bold text-gray-900 bg-gray-300 dark:bg-gray-700 dark:text-white">
                                Registrar Cliente
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

                                <form onSubmit={(e) => { e.preventDefault(); handleRegistroCliente(); }}>
                                    <div className="grid gap-6 mb-6 md:grid-cols-2 mt-2 ">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                Nombres
                                            </label>
                                            <input
                                                type="text"
                                                className="bg-gray-50 border rounded-xl dark:border-gray-500 text-gray-900 text-sm  block w-full p-2.5 dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                placeholder="John"
                                                value={nombre}
                                                onChange={(e) => setNombre(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                Dirección
                                            </label>
                                            <input
                                                type="text"
                                                className="bg-gray-50 border rounded-xl dark:border-gray-500 text-gray-900 text-sm  block w-full p-2.5 dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                value={direccion}
                                                onChange={(e) => setDireccion(e.target.value)}
                                                placeholder="Calle 123"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                Pueblo
                                            </label>
                                            <Select
                                                className="border rounded-xl dark:border-gray-500 border-gray-600"
                                                value={ciudad}
                                                placeholder="Selecciona un pueblo"
                                                onChange={(e) => setCiudad(e.target.value)}
                                                color="default"
                                                aria-label="Pueblo"
                                            >
                                                {pueblos.map((pueblo) => (
                                                    <SelectItem key={pueblo.key}>{pueblo.label}</SelectItem>
                                                ))}
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                Teléfono
                                            </label>
                                            <input
                                                type="tel"
                                                className="bg-gray-50 border rounded-xl dark:border-gray-500 text-gray-900 text-sm  block w-full p-2.5 dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                placeholder="123-456-7890"
                                                value={telefono}
                                                onChange={(e) => setTelefono(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                Correo Electrónico
                                            </label>
                                            <input
                                                type="email"
                                                className="bg-gray-50 border rounded-xl dark:border-gray-500 text-gray-900 text-sm  block w-full p-2.5 dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                placeholder="email@example.com"
                                                value={correo}
                                                onChange={(e) => setCorreo(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none font-medium rounded-xl text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700"
                                    >
                                        Registrar
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

