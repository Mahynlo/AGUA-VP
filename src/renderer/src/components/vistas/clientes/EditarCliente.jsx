import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useClientes } from "../../../context/ClientesContext";
import { useMedidores } from "../../../context/MedidoresContext";
import { EliminarClienteIcon, EditIcon } from "../../../IconsApp/IconsClientes";
import BuscarMedidor from "./BuscarMedidor";
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
    Tooltip,
    Checkbox,
} from "@nextui-org/react";

import FeedbackMessages from "../../toast/FeedbackMessages";

export default function EditarClientes({ id }) {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const { user } = useAuth();
    const { clientes, loading, actualizarClientes } = useClientes();
    const { actualizarMedidores } = useMedidores();
    const [isUpdating, setIsUpdating] = useState(false);


    //console.log("clientes", clientes);
    const pueblos = [
        { key: "Nacori Grande", label: "Nacori Grande" },
        { key: "Matape", label: "Matape" },
        { key: "Adivino", label: "Adivino" },
    ];

    const medidores = [
        { key: 1, label: "NG-123445" },
        { key: 2, label: "MP-123499" },
        { key: 3, label: "AD-123450" },
    ];

    const [nombre, setNombre] = useState("shdhdued");
    const [direccion, setDireccion] = useState("");
    const [telefono, setTelefono] = useState("");
    const [ciudad, setCiudad] = useState("");
    const [correo, setCorreo] = useState("");
    const [estadoCliente, setEstadoCliente] = useState("Activo");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [medidorAsignado, setMedidorAsignado] = useState(null);
    const [medidoresLiberados, setMedidoresLiberados] = useState(new Set()); // Usar un Set para evitar duplicados


    const cliente = clientes.find((c) => c.id === id); //busca el cliente por id 
    // Cargar datos del cliente cuando se abre el modal
    useEffect(() => { // cuando se abre el modal
        if (id && cliente) {
            setNombre(cliente.nombre);
            setDireccion(cliente.direccion);
            setTelefono(cliente.telefono);
            setCiudad(cliente.ciudad);
            setCorreo(cliente.correo);
            setEstadoCliente(cliente.estado_cliente);
            setMedidorAsignado(cliente.id_medidor || null); // Asume que se guarda en esa propiedad
        }
    }, [id, clientes]);


    const handleLiberarMedidores = (idsActuales) => {
        const nuevoSet = new Set(idsActuales);
        setMedidoresLiberados(nuevoSet);

    };


    const handleActualizarCliente = async () => {
        setError("");
        setSuccess("");
        setIsUpdating(true); // activar loading

        if (!nombre || !direccion || !telefono || !ciudad || !correo) {
            setError("Todos los campos son obligatorios.");
            setIsUpdating(false); // desactivar loading
            return;
        }
        //console.log(clientes);
        try {
            let response;
            const tokensession = localStorage.getItem("token");

            const nuevosDatos = {
                nombre,
                direccion,
                telefono,
                ciudad,
                correo,
                estado_cliente: estadoCliente,
                // datosAnteriores: cliente, // O los datos que tenías antes de editar
                modificado_por: user.id,
                medidor_id: medidorAsignado ?? null, // Asignar el medidor seleccionado
                medidores_liberados: Array.from(medidoresLiberados), // Convertir Set a Array
            }
            console.log("nuevosDatos", nuevosDatos);
            // Actualizar cliente existente con el id cliente informacion anterior y informacion modifca por el usuario y id Usuario
            response = await window.api.updateClient({
                id,
                nuevosDatos: nuevosDatos,
                token_session: tokensession,  // Asegúrate de tener este valor
            });

            //console.log(response);

            if (response.success) {
                setSuccess(id ? "Cliente actualizado correctamente." : "Cliente registrado exitosamente.");
                setTimeout(() => {
                    onClose();
                    actualizarClientes(); // Actualizar clientes si es necesario
                    actualizarMedidores(); // Actualizar medidores si es necesario
                    setIsUpdating(false); // desactivar al finalizar todo
                }, 2000);
            } else {
                setError(response.message);
                setIsUpdating(false);
            }
        } catch (err) {
            setError("Ocurrió un error. Intenta nuevamente.");
            setIsUpdating(false);
        }
    };

    const handleSelectionChange = (e) => {
        setValuesmedidores(new Set(e.target.value.split(",")));
    };




    return (
        <>
            <Tooltip color="primary" content="Editar" delay={2000}>
                <Button
                    isIconOnly
                    aria-label="Editar"
                    color=""
                    variant="faded"

                    onPress={onOpen}
                >
                    <EditIcon />
                </Button>
            </Tooltip>


            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="4xl" backdrop="transparent"
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
                                {id ? "Editar Cliente" : "Registrar Cliente"}
                            </ModalHeader>
                            <ModalBody className="bg-gray-200 dark:bg-gray-800">
                                <FeedbackMessages
                                    success={success}
                                    error={error}
                                    setSuccess={setSuccess}
                                    setError={setError}
                                />

                                <form id="form-editar-cliente" onSubmit={(e) => { e.preventDefault(); handleActualizarCliente(); }}>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white  dark:bg-gray-800">
                                        Información del Cliente
                                    </div>
                                    <div className="grid gap-6 mb-6 md:grid-cols-2 mt-2">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nombres</label>
                                            <input
                                                type="text"
                                                className="bg-gray-50 border dark:border-gray-500 text-gray-900 text-sm rounded-xl block w-full p-2.5 dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                placeholder="John"
                                                value={nombre}
                                                onChange={(e) => setNombre(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Dirección</label>
                                            <input
                                                type="text"
                                                className="bg-gray-50 border rounded-xl dark:border-gray-500 text-gray-900 text-sm  block w-full p-2.5 dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                                                placeholder="Dirección"
                                                value={direccion}
                                                onChange={(e) => setDireccion(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Pueblo</label>
                                            <Select
                                                className="border rounded-xl dark:border-gray-500 border-gray-600"
                                                aria-label="Pueblo"
                                                value={ciudad}
                                                defaultSelectedKeys={[ciudad]}
                                                onChange={(e) => setCiudad(e.target.value)}
                                                color="default"
                                            >
                                                {pueblos.map((pueblo) => (
                                                    <SelectItem key={pueblo.key}>{pueblo.label}</SelectItem>
                                                ))}
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Teléfono</label>
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
                                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Correo Electrónico</label>
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
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white  dark:bg-gray-800">
                                        Asignar medidor
                                    </div>
                                    <BuscarMedidor
                                        clienteId={id}
                                        medidorAsignado={medidorAsignado} // si lo soporta
                                        onLiberarMedidor={handleLiberarMedidores}
                                        onMedidorSeleccionado={(medidorId) => {
                                            setMedidorAsignado(medidorId); // puede ser null si lo desasigna
                                        }}
                                    />



                                    <div className="text-2xl font-bold text-gray-900 dark:text-white  dark:bg-gray-800">
                                        Eliminar Cliente
                                    </div>
                                    <div className="grid gap-6 mb-6 md:grid-cols-2 mt-2">


                                        <Checkbox defaultSelected={false}>Estas Segro que deseas borrar el cliente?</Checkbox>
                                        <div>
                                            <Tooltip color="danger" content="Eliminar" delay={3000}>
                                                <Button aria-label="Eliminar" color="danger" variant="faded">
                                                    <EliminarClienteIcon /> Eliminar
                                                </Button>
                                            </Tooltip>
                                            <p className="mt-3">Se elminiara al usuario y su informacion de registro existente en la base de datos.</p>
                                        </div>

                                    </div>


                                </form>


                            </ModalBody>
                            <ModalFooter className="bg-gray-300 dark:bg-gray-700">
                                <Button
                                    type="submit"
                                    color="primary"
                                    form="form-editar-cliente"
                                    variant="light"
                                    isDisabled={isUpdating} // desactiva mientras actualiza
                                    className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-xl text-sm w-full sm:w-auto px-5 py-2.5"
                                >
                                    {isUpdating ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            Procesando...
                                        </span>
                                    ) : (
                                        id ? "Actualizar" : "Registrar"
                                    )}
                                </Button>

                                <Button
                                    color="danger"
                                    className="text-white bg-red-700 hover:bg-red-800 font-medium rounded-xl text-sm px-5 py-2.5"
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


