import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Tooltip } from "@nextui-org/react";
import { HiDeviceMobile, HiDesktopComputer, HiCalendar, HiBan, HiTrash, HiShieldCheck } from "react-icons/hi";
import { useUsuarios } from "../../context/UsuariosContext";

const ModalSesionesUsuario = ({ isOpen, onClose, usuario }) => {
    const { fetchUserSessions, closeSession, closeAllSessions } = useUsuarios();
    const [sesiones, setSesiones] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && usuario) {
            cargarSesiones();
        }
    }, [isOpen, usuario]);

    const cargarSesiones = async () => {
        setLoading(true);
        try {
            const data = await fetchUserSessions(usuario.id);
            setSesiones(data || []);
        } catch (error) {
            console.error("Error cargando sesiones", error);
            setSesiones([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCerrarSesion = async (sessionId) => {
        if (!confirm("¿Cerrar esta sesión? El usuario tendrá que volver a loguearse en ese dispositivo.")) return;
        const success = await closeSession(sessionId);
        if (success) cargarSesiones();
    };

    const handleCerrarTodo = async () => {
        if (!confirm(`¿Cerrar TODAS las sesiones de ${usuario.nombre}?`)) return;
        const success = await closeAllSessions(usuario.id);
        if (success) {
            cargarSesiones();
        }
    };

    const getDeviceIcon = (dispositivo) => {
        if (!dispositivo) return <HiDesktopComputer className="w-5 h-5 text-gray-500" />;
        const dev = dispositivo.toLowerCase();
        if (dev.includes("mobile") || dev.includes("android") || dev.includes("iphone")) {
            return <HiDeviceMobile className="w-5 h-5 text-purple-500" />;
        }
        return <HiDesktopComputer className="w-5 h-5 text-blue-500" />;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl"
            backdrop="blur"
            scrollBehavior="inside"
            classNames={{
                backdrop: "bg-gradient-to-t mt-18 from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
                closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white"
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full">
                                    <HiShieldCheck className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold text-gray-800 dark:text-white">
                                        Sesiones Activas
                                    </span>
                                    <span className="text-sm font-normal text-gray-500">
                                        Gestionando accesos de: <span className="font-semibold text-gray-800 dark:text-gray-300">{usuario?.nombre}</span>
                                    </span>
                                </div>
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : sesiones.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                    <HiShieldCheck className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                    <p>No hay sesiones activas para este usuario.</p>
                                </div>
                            ) : (
                                <Table aria-label="Tabla de sesiones" removeWrapper>
                                    <TableHeader>
                                        <TableColumn>DISPOSITIVO</TableColumn>
                                        <TableColumn>IP</TableColumn>
                                        <TableColumn>INICIADO</TableColumn>
                                        <TableColumn align="center">ACCIONES</TableColumn>
                                    </TableHeader>
                                    <TableBody>
                                        {sesiones.map((sesion) => (
                                            <TableRow key={sesion.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getDeviceIcon(sesion.dispositivo)}
                                                        <div className="flex flex-col">
                                                            <span className="text-small font-bold capitalize">
                                                                {sesion.dispositivo || "Desconocido"}
                                                            </span>
                                                            {sesion.actual && (
                                                                <Chip size="sm" color="success" variant="flat" className="h-5 text-[10px] px-1 mt-0.5 w-fit">Sesión Actual</Chip>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-xs">{sesion.direccion_ip || "---"}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <HiCalendar />
                                                        {new Date(sesion.fecha_inicio).toLocaleString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center">
                                                        {sesion.actual ? (
                                                            <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                                En uso
                                                            </span>
                                                        ) : (
                                                            <Tooltip content="Cerrar esta sesión" color="danger">
                                                                <Button
                                                                    isIconOnly
                                                                    size="sm"
                                                                    color="danger"
                                                                    variant="light"
                                                                    onPress={() => handleCerrarSesion(sesion.id)}
                                                                >
                                                                    <HiBan className="w-5 h-5" />
                                                                </Button>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </ModalBody>
                        <ModalFooter className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                            <span className="text-xs text-gray-400">Total sesiones: {sesiones.length}</span>
                            <div className="flex gap-2">
                                <Button color="default" variant="light" onPress={onClose}>
                                    Cerrar
                                </Button>
                                {sesiones.length > 0 && (
                                    <Button
                                        color="danger"
                                        startContent={<HiTrash />}
                                        onPress={handleCerrarTodo}
                                        variant="flat"
                                    >
                                        Cerrar Todas
                                    </Button>
                                )}
                            </div>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default ModalSesionesUsuario;
