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
                wrapper: "items-start p-1 sm:p-2 pt-16 sm:pt-20 overflow-y-hidden",
                backdrop: "bg-slate-900/40 backdrop-blur-sm",
                base: "bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-2xl h-[calc(100dvh-4.25rem)] sm:h-[calc(100dvh-5.25rem)] max-h-[calc(100dvh-4.25rem)] sm:max-h-[calc(100dvh-5.25rem)]",
                header: "border-b border-slate-100 dark:border-zinc-800/50 pb-4 pt-6 px-8",
                body: "px-8 py-6 flex-1 min-h-0",
                footer: "border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8",
                closeButton: "hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 text-slate-400 p-2 top-4 right-4"
            }}
        >
            <ModalContent className="h-full">
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        src={usuarioAvatarSrc || defaultAvatar}
                                        size="md"
                                        className="border-2 border-slate-200 dark:border-zinc-700 shrink-0"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                                            Sesiones Activas
                                        </span>
                                        <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                                            Accesos de: <span className="font-semibold text-slate-800 dark:text-zinc-300">{usuario?.nombre}</span>
                                        </span>
                                    </div>
                                </div>
                                <Tooltip content="Recargar sesiones">
                                    <Button isIconOnly size="sm" variant="flat" className="bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800" onPress={cargarSesiones} isLoading={loading}>
                                        <HiRefresh className="w-4 h-4" />
                                    </Button>
                                </Tooltip>
                            </div>
                        </ModalHeader>

                        <ModalBody className="custom-scrollbar">
                            {/* Banner de confirmación inline — reemplaza window.confirm() */}
                            {confirmCerrar && (
                                <div className="flex items-center justify-between gap-3 p-3 mb-2 rounded-xl bg-red-500/10 border border-red-200 dark:border-red-900/40">
                                    <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                                        <HiExclamationCircle className="w-5 h-5 flex-shrink-0" />
                                        {confirmCerrar === 'todas'
                                            ? `¿Cerrar TODAS las sesiones de ${usuario?.nombre}? Deberá volver a iniciar sesión.`
                                            : "¿Cerrar esta sesión? El usuario tendrá que volver a loguearse en ese dispositivo."}
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <Button size="sm" variant="flat" color="default" className="bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800" onPress={() => setConfirmCerrar(null)}>
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
                                    <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : sesiones.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700">
                                    <HiShieldCheck className="w-12 h-12 mx-auto text-slate-300 dark:text-zinc-600 mb-2" />
                                    <p className="font-medium">Sin sesiones activas</p>
                                    <p className="text-sm text-slate-400 dark:text-zinc-500 mt-1">Este usuario no tiene ninguna sesión abierta en este momento.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sesiones.map((sesion) => (
                                        <div
                                            key={sesion.id}
                                            className={`flex flex-col gap-2 p-4 rounded-xl border transition-colors
                                                ${sesion.actual
                                                    ? 'bg-sky-500/10 border-sky-200 dark:border-sky-900/40'
                                                    : 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
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
                                                                <Chip size="sm" color="default" variant="flat" className="h-4 text-[10px] px-1.5 flex-shrink-0 bg-sky-500/10 text-sky-700 dark:text-sky-300">
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-7 text-[11px] text-slate-500 dark:text-zinc-400">
                                                {sesion.direccion_ip && (
                                                    <div className="flex items-center gap-1.5">
                                                        <HiGlobeAlt className="flex-shrink-0 text-slate-400 dark:text-zinc-500" />
                                                        <span>IP: <span className="font-mono font-medium text-slate-700 dark:text-zinc-300">{sesion.direccion_ip}</span></span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1.5">
                                                    <HiClock className="flex-shrink-0 text-slate-400 dark:text-zinc-500" />
                                                    <span>Inicio: <span className="font-medium text-slate-700 dark:text-zinc-300">{formatUTCtoHermosilloHora(sesion.fecha_inicio)}</span></span>
                                                </div>
                                                {sesion.ultimo_uso && (
                                                    <div className="flex items-center gap-1.5">
                                                        <HiClock className="flex-shrink-0 text-green-500" />
                                                        <span>Últ. actividad: <span className="font-medium text-slate-700 dark:text-zinc-300">{formatUTCtoHermosilloHora(sesion.ultimo_uso)}</span></span>
                                                    </div>
                                                )}
                                                {sesion.user_agent && (
                                                    <Tooltip content={sesion.user_agent} placement="bottom" classNames={{ content: "max-w-xs text-xs" }}>
                                                        <div className="flex items-center gap-1.5 cursor-help col-span-full sm:col-span-2 truncate">
                                                            <HiInformationCircle className="flex-shrink-0 text-slate-400 dark:text-zinc-500" />
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

                        <ModalFooter className="flex justify-between items-center">
                            <span className="text-xs text-slate-400 dark:text-zinc-500">{sesiones.length} sesión(es) activa(s)</span>
                            <div className="flex gap-2">
                                <Button color="default" variant="flat" onPress={onClose} className="font-bold text-slate-600 dark:text-zinc-300 bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800">
                                    Cerrar
                                </Button>
                                {sesiones.length > 0 && (
                                    <Button
                                        color="danger"
                                        startContent={<HiTrash />}
                                        onPress={() => setConfirmCerrar('todas')}
                                        variant="flat"
                                        className="font-bold"
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
