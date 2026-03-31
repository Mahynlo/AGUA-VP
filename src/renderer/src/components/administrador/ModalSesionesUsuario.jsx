import { useState, useEffect, useMemo } from "react";
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, Chip, Tooltip, Avatar
} from "@nextui-org/react";
import defaultAvatar from "../../assets/images/Avatar.png";
import {
    HiDeviceMobile, HiDesktopComputer, HiClock, HiBan,
    HiTrash, HiShieldCheck, HiGlobeAlt, HiInformationCircle,
    HiExclamationCircle, HiRefresh
} from "react-icons/hi";
import { useUsuarios } from "../../context/UsuariosContext";
import { formatUTCtoHermosilloHora } from "../../utils/formatFecha";

const ModalSesionesUsuario = ({ isOpen, onClose, usuario }) => {
    const { fetchUserSessions, closeSession, closeAllSessions } = useUsuarios();
    const [sesiones, setSesiones] = useState([]);

    const usuarioAvatarSrc = useMemo(() => {
        if (!usuario?.id) return null;
        return localStorage.getItem(`user_avatar_${usuario.id}`) || null;
    }, [usuario?.id]);
    const [loading, setLoading] = useState(false);

    // Confirmación inline — evita window.confirm() que bloquea el hilo y no va con el diseño
    const [confirmCerrar, setConfirmCerrar] = useState(null);   // null | sessionId | 'todas'
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (isOpen && usuario) {
            cargarSesiones();
        } else {
            setSesiones([]);
            setConfirmCerrar(null);
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

    const handleConfirmarCerrar = async () => {
        if (!confirmCerrar) return;
        setActionLoading(true);
        try {
            let success;
            if (confirmCerrar === 'todas') {
                success = await closeAllSessions(usuario.id);
            } else {
                success = await closeSession(confirmCerrar);
            }
            if (success) await cargarSesiones();
        } finally {
            setConfirmCerrar(null);
            setActionLoading(false);
        }
    };

    const getDeviceIcon = (dispositivo) => {
        if (!dispositivo) return <HiDesktopComputer className="w-5 h-5 text-gray-400" />;
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
            size="3xl"
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
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        src={usuarioAvatarSrc || defaultAvatar}
                                        size="md"
                                        className="border-2 border-purple-200 dark:border-purple-700 shrink-0"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-xl font-bold text-gray-800 dark:text-white">
                                            Sesiones Activas
                                        </span>
                                        <span className="text-sm font-normal text-gray-500">
                                            Accesos de: <span className="font-semibold text-gray-800 dark:text-gray-300">{usuario?.nombre}</span>
                                        </span>
                                    </div>
                                </div>
                                <Tooltip content="Recargar sesiones">
                                    <Button isIconOnly size="sm" variant="light" onPress={cargarSesiones} isLoading={loading}>
                                        <HiRefresh className="w-4 h-4" />
                                    </Button>
                                </Tooltip>
                            </div>
                        </ModalHeader>

                        <ModalBody>
                            {/* Banner de confirmación inline — reemplaza window.confirm() */}
                            {confirmCerrar && (
                                <div className="flex items-center justify-between gap-3 p-3 mb-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                    <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                                        <HiExclamationCircle className="w-5 h-5 flex-shrink-0" />
                                        {confirmCerrar === 'todas'
                                            ? `¿Cerrar TODAS las sesiones de ${usuario?.nombre}? Deberá volver a iniciar sesión.`
                                            : "¿Cerrar esta sesión? El usuario tendrá que volver a loguearse en ese dispositivo."}
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <Button size="sm" variant="flat" color="default" onPress={() => setConfirmCerrar(null)}>
                                            Cancelar
                                        </Button>
                                        <Button size="sm" color="danger" onPress={handleConfirmarCerrar} isLoading={actionLoading}>
                                            Confirmar
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : sesiones.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                    <HiShieldCheck className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                    <p className="font-medium">Sin sesiones activas</p>
                                    <p className="text-sm text-gray-400 mt-1">Este usuario no tiene ninguna sesión abierta en este momento.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sesiones.map((sesion) => (
                                        <div
                                            key={sesion.id}
                                            className={`flex flex-col gap-2 p-4 rounded-xl border transition-colors
                                                ${sesion.actual
                                                    ? 'bg-blue-50/60 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                                                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800'
                                                }`}
                                        >
                                            {/* Fila principal */}
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="flex-shrink-0">
                                                        {getDeviceIcon(sesion.dispositivo)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                                                {sesion.dispositivo || "Dispositivo desconocido"}
                                                            </span>
                                                            {sesion.actual && (
                                                                <Chip size="sm" color="primary" variant="flat" className="h-4 text-[10px] px-1.5 flex-shrink-0">
                                                                    Sesión del admin
                                                                </Chip>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {!sesion.actual && (
                                                    <Tooltip content="Cerrar esta sesión" color="danger">
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            color="danger"
                                                            variant="flat"
                                                            className="flex-shrink-0"
                                                            isDisabled={confirmCerrar === sesion.id}
                                                            onPress={() => setConfirmCerrar(sesion.id)}
                                                        >
                                                            <HiBan className="w-4 h-4" />
                                                        </Button>
                                                    </Tooltip>
                                                )}
                                            </div>

                                            {/* Detalles de la sesión */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-7 text-[11px] text-gray-500 dark:text-gray-400">
                                                {sesion.direccion_ip && (
                                                    <div className="flex items-center gap-1.5">
                                                        <HiGlobeAlt className="flex-shrink-0 text-gray-400" />
                                                        <span>IP: <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{sesion.direccion_ip}</span></span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1.5">
                                                    <HiClock className="flex-shrink-0 text-gray-400" />
                                                    <span>Inicio: <span className="font-medium text-gray-700 dark:text-gray-300">{formatUTCtoHermosilloHora(sesion.fecha_inicio)}</span></span>
                                                </div>
                                                {sesion.ultimo_uso && (
                                                    <div className="flex items-center gap-1.5">
                                                        <HiClock className="flex-shrink-0 text-green-500" />
                                                        <span>Últ. actividad: <span className="font-medium text-gray-700 dark:text-gray-300">{formatUTCtoHermosilloHora(sesion.ultimo_uso)}</span></span>
                                                    </div>
                                                )}
                                                {sesion.user_agent && (
                                                    <Tooltip content={sesion.user_agent} placement="bottom" classNames={{ content: "max-w-xs text-xs" }}>
                                                        <div className="flex items-center gap-1.5 cursor-help col-span-full sm:col-span-2 truncate">
                                                            <HiInformationCircle className="flex-shrink-0 text-gray-400" />
                                                            <span className="truncate">
                                                                {sesion.user_agent.length > 70
                                                                    ? sesion.user_agent.slice(0, 67) + "..."
                                                                    : sesion.user_agent}
                                                            </span>
                                                        </div>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ModalBody>

                        <ModalFooter className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                            <span className="text-xs text-gray-400">{sesiones.length} sesión(es) activa(s)</span>
                            <div className="flex gap-2">
                                <Button color="default" variant="light" onPress={onClose}>
                                    Cerrar
                                </Button>
                                {sesiones.length > 0 && (
                                    <Button
                                        color="danger"
                                        startContent={<HiTrash />}
                                        onPress={() => setConfirmCerrar('todas')}
                                        variant="flat"
                                        isDisabled={confirmCerrar === 'todas'}
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
