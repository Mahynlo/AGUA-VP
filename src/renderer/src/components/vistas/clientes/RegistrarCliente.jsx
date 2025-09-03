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
    CardBody,
    Textarea
} from "@nextui-org/react";
import { useState, useEffect } from "react";
import { AgregarClienteIcon } from "../../../IconsApp/IconsClientes";
import { useAuth } from "../../../context/AuthContext";
import { useClientes } from "../../../context/ClientesContext";
import { useTarifas } from "../../../context/TarifasContext";
import { useFeedback } from "../../../context/FeedbackContext";
import { HiUser, HiLocationMarker, HiPhone, HiMail, HiPlus, HiCurrencyDollar } from "react-icons/hi";

export default function RegistrarClientes({ onSuccess, onError }) {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const pueblos = [
        { key: "Nacori Grande", label: "Nacori Grande" },
        { key: "Matape", label: "Matape" },
        { key: "Adivino", label: "Adivino" },
    ];
    const { user } = useAuth();
    const { actualizarClientes } = useClientes();
    const { tarifas, loading } = useTarifas();

    const [nombre, setNombre] = useState("");
    const [direccion, setDireccion] = useState("");
    const [telefono, setTelefono] = useState("");
    const [ciudad, setCiudad] = useState("");
    const [correo, setCorreo] = useState("");
    const [tarifaSeleccionada, setTarifaSeleccionada] = useState("");
    const [estadoCliente, setEstadoCliente] = useState("");
    const { setSuccess, setError } = useFeedback();
    const [isUpdating, setIsUpdating] = useState(false);
    const [erroresCampos, setErroresCampos] = useState({});
    const [mostrarErrores, setMostrarErrores] = useState(false); // Para controlar cuándo mostrar errores

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
        setNombre("");
        setDireccion("");
        setTelefono("");
        setCiudad("");
        setCorreo("");
        setTarifaSeleccionada("");
        setErroresCampos({});
        setMostrarErrores(false);
        setIsUpdating(false);
        onClose();
    };



    const handleRegistroCliente = async () => {
        setError("");
        setSuccess("");
        setIsUpdating(true); // activar loading
        setMostrarErrores(true); // Activar la visualización de errores

        // Validaciones de campos espesifica si fata alguno 

        const nuevosErrores = {};

        if (!nombre) nuevosErrores.nombre = true;
        if (!direccion) nuevosErrores.direccion = true;
        if (!telefono) nuevosErrores.telefono = true;
        if (!ciudad) nuevosErrores.ciudad = true;
        if (!correo) nuevosErrores.correo = true;
        if (!tarifaSeleccionada) nuevosErrores.tarifa = true;

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
                        case "tarifa": return "Tarifa";
                        default: return campo;
                    }
                });
            setError(`Los siguientes campos son obligatorios: ${camposFaltantes.join(", ")}`, "Registro de Clientes");
            setIsUpdating(false);
            return;
        }

        setErroresCampos({}); // limpia errores si todo está lleno



        //console.log("Datos enviados al proceso principal:", { nombre, direccion, telefono, ciudad, correo, estadoCliente: "Activo", modificado_por: user.id });
        try {

            const tokensession = localStorage.getItem("token");
            const response = await window.api.registerClient({
                cliente: {
                    nombre,
                    direccion,
                    telefono,
                    ciudad,
                    correo,
                    tarifa_id: tarifaSeleccionada,
                    estado_cliente: "Activo",
                    modificado_por: user.id,
                },
                token_session: tokensession,  // Asegúrate de tener este valor
            });

            //console.log("Respuesta del servidor:", response);

            if (response.success) {
                setSuccess("Cliente registrado exitosamente.", "Registro de Clientes");
                setTimeout(() => {
                    //setSuccess("");
                    setNombre("");
                    setDireccion("");
                    setTelefono("");
                    setCiudad("");
                    setCorreo("");
                    setTarifaSeleccionada("");
                    setErroresCampos({}); // Limpiar errores
                    setMostrarErrores(false); // Resetear visualización de errores
                    onClose(); // Cierra el modal automáticamente
                    actualizarClientes(); // Actualiza la lista de clientes
                    setIsUpdating(false); // desactivar al finalizar todo
                }, 2000);
            } else {
                setError(response.message, "Registro de Clientes");
                setIsUpdating(false); // desactivar al finalizar todo
            }
        } catch (err) {
            setError("Ocurrió un error en el registro. Intenta nuevamente.", "Registro de Clientes");
            setIsUpdating(false); // desactivar al finalizar todo
        }
    };

    return (
        <>
            <Button
                aria-label="Registrar Cliente"
                color="primary"
                variant="solid"
                startContent={<HiPlus className="w-4 h-4" />}
                className="font-medium"
                onPress={onOpen}
            >
                Nuevo Cliente
            </Button>

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
                    modal: "bg-white dark:bg-gray-800 rounded-lg shadow-lg",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex items-center gap-2 text-xl font-bold">
                                <HiUser className="w-6 h-6 text-blue-600" />
                                Registrar Nuevo Cliente
                            </ModalHeader>

                            <ModalBody className="space-y-6">
                                <form id="form-registro-cliente" onSubmit={(e) => { e.preventDefault(); handleRegistroCliente(); }}>

                                    {/* Información Personal */}
                                    <Card className="border border-blue-200 dark:border-blue-800">
                                        <CardBody className="space-y-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <HiUser className="w-5 h-5 text-blue-600" />
                                                Información Personal
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
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
                                                        selectedKeys={ciudad ? [ciudad] : []}
                                                        onSelectionChange={(keys) => {
                                                            const selectedKey = Array.from(keys)[0];
                                                            setCiudad(selectedKey || "");
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

                                                {/* Tarifa */}
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Tarifa*
                                                    </label>
                                                    <Select
                                                        aria-label="Tarifa"
                                                        placeholder={loading ? "Cargando tarifas..." : "Selecciona una tarifa"}
                                                        selectedKeys={tarifaSeleccionada ? [tarifaSeleccionada] : []}
                                                        onSelectionChange={(keys) => {
                                                            const selectedKey = Array.from(keys)[0];
                                                            setTarifaSeleccionada(selectedKey || "");
                                                            limpiarError('tarifa');
                                                        }}
                                                        color="primary"
                                                        variant="bordered"
                                                        size="md"
                                                        isRequired
                                                        isLoading={loading}
                                                        isDisabled={loading || !tarifas || tarifas.length === 0}
                                                        className="w-full"
                                                        startContent={<HiCurrencyDollar className="text-gray-400 text-lg" />}
                                                        isInvalid={mostrarErrores && erroresCampos.tarifa}
                                                        errorMessage={mostrarErrores && erroresCampos.tarifa && "La tarifa es requerida"}
                                                    >
                                                        {!loading && tarifas && Array.isArray(tarifas) && tarifas.length > 0 ? (
                                                            tarifas.map((tarifa) => {
                                                                const tarifaId = tarifa.id?.toString();
                                                                const nombreTarifa = tarifa.nombre;
                                                                const descripcion = tarifa.descripcion;
                                                                
                                                                return (
                                                                    <SelectItem 
                                                                        key={tarifaId} 
                                                                        textValue={`${nombreTarifa} - ${descripcion}`}
                                                                    >
                                                                        {nombreTarifa} - {descripcion}
                                                                    </SelectItem>
                                                                );
                                                            })
                                                        ) : loading ? (
                                                            <SelectItem key="loading" isDisabled>
                                                                Cargando tarifas...
                                                            </SelectItem>
                                                        ) : (
                                                            <SelectItem key="no-tarifas" isDisabled>
                                                                No hay tarifas disponibles
                                                            </SelectItem>
                                                        )}
                                                    </Select>
                                                </div>
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
                                    onClick={handleRegistroCliente}
                                    type="submit"
                                    form="form-registro-cliente"
                                    isDisabled={isUpdating}
                                    isLoading={isUpdating}
                                >
                                    {isUpdating ? "Registrando..." : "Registrar Cliente"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}

