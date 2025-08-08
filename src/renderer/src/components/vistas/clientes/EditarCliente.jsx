import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useClientes } from "../../../context/ClientesContext";
import { useMedidores } from "../../../context/MedidoresContext";
import { EliminarClienteIcon, EditIcon } from "../../../IconsApp/IconsClientes";
import {formatUTCtoHermosillo} from "../../../utils/formatFecha";
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
    Card,
    CardBody,
    Input,
    Textarea
} from "@nextui-org/react";
import { HiUser, HiLocationMarker, HiPhone, HiMail, HiCog, HiTrash } from "react-icons/hi";

import { useFeedback } from "../../../context/FeedbackContext";

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
    const [medidorAsignado, setMedidorAsignado] = useState(null);
    const [medidoresLiberados, setMedidoresLiberados] = useState(new Set()); // Usar un Set para evitar duplicados
    const [fechaRegistroCliente, setFechaRegistroCliente] = useState("");
    const [erroresCampos, setErroresCampos] = useState({});
    const [mostrarErrores, setMostrarErrores] = useState(false); // Para controlar cuándo mostrar errores
    const { setSuccess, setError } = useFeedback();

    // Función para limpiar errores cuando el usuario empiece a escribir
    const limpiarError = (campo) => {
        if (erroresCampos[campo]) {
            setErroresCampos(prev => ({
                ...prev,
                [campo]: false
            }));
        }
    };

    // Función para manejar el cierre del modal y resetear estados
    const handleCloseModal = () => {
        setErroresCampos({});
        setMostrarErrores(false);
        setIsUpdating(false);
        onClose();
    };
    
    


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
            setFechaRegistroCliente(cliente.fecha_creacion || ""); // Asume que se guarda en esa propiedad
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
        setMostrarErrores(true); // Activar la visualización de errores

    
        const nuevosErrores = {};

        if (!nombre) nuevosErrores.nombre = true;
        if (!direccion) nuevosErrores.direccion = true;
        if (!telefono) nuevosErrores.telefono = true;
        if (!ciudad) nuevosErrores.ciudad = true;
        if (!correo) nuevosErrores.correo = true;

        if (Object.keys(nuevosErrores).length > 0) {
            setErroresCampos(nuevosErrores);
            const camposFaltantes = Object.keys(nuevosErrores)
            .map((campo) => {
                switch (campo) {
                case "nombre": return "Nombre";
                case "direccion": return "Dirección";
                case "telefono": return "Teléfono";
                case "ciudad": return "Ciudad";
                case "correo": return "Correo Electrónico";
                default: return campo;
                }
            });
            setError(`Los siguientes campos son obligatorios: ${camposFaltantes.join(", ")}`, "Actualización de Cliente");
            setIsUpdating(false);
            return;
        }

        setErroresCampos({}); // limpia errores si todo está lleno
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
                    setErroresCampos({}); // Limpiar errores
                    setMostrarErrores(false); // Resetear visualización de errores
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




            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                size="4xl"
                backdrop="transparent"
                scrollBehavior="inside"
                isDismissable={false}
                isKeyboardDismissDisabled={true}
                placement="center"
                classNames={{
                    closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex items-center gap-2 text-xl font-bold">
                                <HiUser className="w-6 h-6 text-blue-600" />
                                {id ? "Editar Cliente" : "Registrar Cliente"}
                            </ModalHeader>
                            
                            <ModalBody className="space-y-6">
                                <form id="form-editar-cliente" onSubmit={(e) => { e.preventDefault(); handleActualizarCliente(); }}>
                                    
                                    {/* Información Personal */}
                                    <Card className="border border-blue-200 dark:border-blue-800">
                                        <CardBody className="space-y-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <HiUser className="w-5 h-5 text-blue-600" />
                                                Información Personal
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Nombre Completo */}
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Nombre Completo*
                                                    </label>
                                                    <div className="relative w-full flex">
                                                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600  py-2">
                                                            <HiUser className="inline-block mr-1 h-5 w-5 text-blue-600" />
                                                        </span>
                                                        <input
                                                            type="text"
                                                            placeholder="Ingresa el nombre completo"
                                                            value={nombre}
                                                            onChange={(e) => {
                                                                setNombre(e.target.value);
                                                                limpiarError('nombre');
                                                            }}
                                                            required
                                                            className={`border ${mostrarErrores && erroresCampos.nombre ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-600 focus:border-blue-500'} text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`}
                                                        />
                                                    </div>
                                                    {mostrarErrores && erroresCampos.nombre && (
                                                        <p className="text-sm text-red-500 mt-1">El nombre es requerido</p>
                                                    )}
                                                </div>

                                                {/* Correo Electrónico */}
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Correo Electrónico*
                                                    </label>
                                                    <div className="relative w-full flex">
                                                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600  py-2">
                                                            <HiMail className="inline-block mr-1 h-5 w-5 text-blue-600" />
                                                        </span>
                                                        <input
                                                            type="email"
                                                            placeholder="ejemplo@correo.com"
                                                            value={correo}
                                                            onChange={(e) => {
                                                                setCorreo(e.target.value);
                                                                limpiarError('correo');
                                                            }}
                                                            required
                                                            className={`border ${mostrarErrores && erroresCampos.correo ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-600 focus:border-blue-500'} text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`}
                                                        />
                                                    </div>
                                                    {mostrarErrores && erroresCampos.correo && (
                                                        <p className="text-sm text-red-500 mt-1">El correo electrónico es requerido</p>
                                                    )}
                                                </div>

                                                {/* Teléfono */}
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Teléfono*
                                                    </label>
                                                    <div className="relative w-full flex">
                                                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600  py-2">
                                                            <HiPhone className="inline-block mr-1 h-5 w-5 text-blue-600" />
                                                        </span>
                                                        <input
                                                            type="tel"
                                                            placeholder="(662) 1456-7890"
                                                            value={telefono}
                                                            onChange={(e) => {
                                                                setTelefono(e.target.value);
                                                                limpiarError('telefono');
                                                            }}
                                                            required
                                                            className={`border ${mostrarErrores && erroresCampos.telefono ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-600 focus:border-blue-500'} text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`}
                                                        />
                                                    </div>
                                                    {mostrarErrores && erroresCampos.telefono && (
                                                        <p className="text-sm text-red-500 mt-1">El teléfono es requerido</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Pueblo*
                                                    </label>
                                                    <Select
                                                        aria-label="Ciudad"
                                                        placeholder="Selecciona un pueblo"
                                                        value={ciudad}
                                                        defaultSelectedKeys={[ciudad]}
                                                        onChange={(e) => {
                                                            setCiudad(e.target.value);
                                                            limpiarError('ciudad');
                                                        }}
                                                        color="primary"
                                                        variant="bordered"
                                                        size="md"
                                                        isRequired
                                                        className="w-full"
                                                        startContent={<HiLocationMarker className="text-gray-400 text-lg" />}
                                                        isInvalid={mostrarErrores && erroresCampos.ciudad}
                                                        errorMessage={mostrarErrores && erroresCampos.ciudad && "La ciudad es requerida"}
                                                    >
                                                        {pueblos.map((pueblo) => (
                                                            <SelectItem key={pueblo.key}>{pueblo.label}</SelectItem>
                                                        ))}
                                                    </Select>
                                                </div>
                                            </div>
                                            {/* Información de registro */}
                                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                                    📅 Cliente registrado por: <span className="font-semibold">{user && user.nombre}</span>
                                                    {fechaRegistroCliente && (
                                                        <span className="ml-2">• Fecha: {formatUTCtoHermosillo(fechaRegistroCliente)}</span>
                                                    )}
                                                </p>
                                            </div>
                                        </CardBody>
                                    </Card>

                                    {/* Información de Dirección */}
                                    <Card className="border border-green-200 dark:border-green-800 mt-2">
                                        <CardBody className="space-y-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <HiLocationMarker className="w-5 h-5 text-green-600" />
                                                Dirección de Residencia
                                            </h3>
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Ingresa la dirección completa del cliente, incluyendo calle, número, colonia, referencias, etc.
                                            </label>
                                            
                                            <textarea
                                                label="Dirección Completa"
                                                placeholder="Ingresa la dirección completa del cliente..."
                                                value={direccion}
                                                onChange={(e) => {
                                                    setDireccion(e.target.value);
                                                    limpiarError('direccion');
                                                }}
                                                required
                                                rows="3"
                                                className={`border ${mostrarErrores && erroresCampos.direccion ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-600 focus:border-blue-500'} text-gray-600 rounded-xl pl-4 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white resize-none`}
                                            />
                                            {mostrarErrores && erroresCampos.direccion && (
                                                <p className="text-sm text-red-500 mt-1">La dirección es requerida</p>
                                            )}
                                            
                                            
                                        </CardBody>
                                    </Card>

                                    {/* Asignar Medidor */}
                                    <Card className="border border-orange-200 dark:border-orange-800 mt-2 h-[600px]">
                                        <CardBody className="space-y-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <HiCog className="w-5 h-5 text-orange-600" />
                                                Gestión de Medidor
                                            </h3>
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Asigna o modifica el medidor asociado a este cliente.
                                            </label>
                                            
                                            <BuscarMedidor
                                                clienteId={id}
                                                medidorAsignado={medidorAsignado}
                                                onLiberarMedidor={handleLiberarMedidores}
                                                onMedidorSeleccionado={(medidorId) => {
                                                    setMedidorAsignado(medidorId);
                                                }}
                                            />
                                        </CardBody>
                                    </Card>

                                    {/* Eliminar Cliente */}
                                    <Card className="border border-red-200 dark:border-red-800 mt-2">
                                        <CardBody className="space-y-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <HiTrash className="w-5 h-5 text-red-600" />
                                                Zona de Peligro
                                            </h3>
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Esta acción eliminará permanentemente el cliente y toda su información asociada.
                                            </label>
                                            
                                            <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                <Checkbox defaultSelected={false} color="danger">
                                                    Confirmo que deseo eliminar este cliente
                                                </Checkbox>
                                                <Tooltip color="danger" content="Eliminar Cliente" delay={1000}>
                                                    <Button 
                                                        color="danger" 
                                                        variant="bordered"
                                                        startContent={<HiTrash className="w-4 h-4" />}
                                                    >
                                                        Eliminar Cliente
                                                    </Button>
                                                </Tooltip>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                ⚠️ Esta acción es irreversible. Se eliminará el cliente y toda su información de registro.
                                            </p>
                                        </CardBody>
                                    </Card>
                                    
                                </form>
                            </ModalBody>
                            
                            <ModalFooter>
                                <Button
                                    color="danger"
                                    variant="light"
                                    onPress={handleCloseModal}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    onClick={handleActualizarCliente}
                                    type="submit"
                                    form="form-editar-cliente"
                                    isDisabled={isUpdating}
                                    isLoading={isUpdating}
                                >
                                    {isUpdating ? "Actualizando..." : (id ? "Actualizar Cliente" : "Registrar Cliente")}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}


