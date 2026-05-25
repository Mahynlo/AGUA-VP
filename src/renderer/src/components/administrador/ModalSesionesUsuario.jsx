import { useState, useEffect, useMemo } from "react";
import { Modal } from "flowbite-react";
import { Avatar } from "@nextui-org/react";
import defaultAvatar from "../../assets/images/Avatar.png";
import {
    HiDeviceMobile, HiDesktopComputer, HiClock, HiBan,
    HiTrash, HiShieldCheck, HiGlobeAlt, HiInformationCircle,
    HiExclamationCircle, HiRefresh
} from "react-icons/hi";
import { useUsuarios } from "../../context/UsuariosContext";
import { formatUTCtoHermosilloHora } from "../../utils/formatFecha";

const sesionesModalTheme = {
    root: {
        base: "fixed top-0 right-0 left-0 z-[100000] h-modal h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full",
        show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" }
    },
    content: {
        base: "relative h-full w-full p-4 md:h-auto",
        inner: "relative flex max-h-[90dvh] flex-col rounded-3xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-3xl w-full"
    },
    header: {
        base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/80 px-8 pb-4 pt-6 rounded-t-3xl shrink-0",
        close: { base: "absolute top-5 right-5 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
    },
    body: { base: "px-8 py-6 flex-1 overflow-y-auto" },
    footer: { base: "flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/80 py-4 px-8 rounded-b-3xl shrink-0" }
};

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
        if (!dispositivo) return (
            <div className="p-2.5 bg-slate-500/10 text-slate-600 dark:text-slate-400 rounded-xl">
                <HiDesktopComputer className="w-5 h-5" />
            </div>
        );
        const dev = dispositivo.toLowerCase();
        if (dev.includes("mobile") || dev.includes("android") || dev.includes("iphone")) {
            return (
                <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                    <HiDeviceMobile className="w-5 h-5" />
                </div>
            );
        }
        return (
            <div className="p-2.5 bg-slate-500/10 text-slate-600 dark:text-slate-400 rounded-xl">
                <HiDesktopComputer className="w-5 h-5" />
            </div>
        );
    };

    return (
        <Modal
            show={isOpen}
            onClose={onClose}
            theme={sesionesModalTheme}
            dismissible
        >
            {/* ── HEADER ── */}
            <Modal.Header>
                <div className="flex items-center justify-between w-full pr-8">
                    <div className="flex items-center gap-4">
                        <Avatar
                            src={usuarioAvatarSrc || defaultAvatar}
                            size="md"
                            className="border-2 border-slate-100 dark:border-zinc-800 shadow-sm shrink-0"
                        />
                        <div className="flex flex-col gap-0.5">
                            <span className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                                Sesiones Activas
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mt-1">
                                Accesos de: <span className="text-blue-600 dark:text-blue-400">{usuario?.nombre}</span>
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        title="Recargar sesiones"
                        onClick={cargarSesiones}
                        disabled={loading}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-colors disabled:opacity-50"
                    >
                        <HiRefresh className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </Modal.Header>

            {/* ── BODY ── */}
            <Modal.Body>
                <div className="flex flex-col gap-4">
                    {/* Banner de confirmación inline */}
                    {confirmCerrar && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                            <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                                <HiExclamationCircle className="w-6 h-6 flex-shrink-0" />
                                <span className="text-sm font-bold leading-tight">
                                    {confirmCerrar === 'todas'
                                        ? `¿Cerrar TODAS las sesiones de ${usuario?.nombre}? Deberá volver a iniciar sesión.`
                                        : "¿Cerrar esta sesión? El usuario tendrá que volver a loguearse en este dispositivo."}
                                </span>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setConfirmCerrar(null)}
                                    className="font-bold text-red-700 dark:text-red-400 hover:bg-red-500/10 rounded-lg px-3 h-8 text-sm transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmarCerrar}
                                    disabled={actionLoading}
                                    className="inline-flex items-center gap-1.5 font-bold bg-red-600 text-white rounded-lg px-3 h-8 text-sm shadow-sm disabled:opacity-60 transition-colors hover:bg-red-700"
                                >
                                    {actionLoading && (
                                        <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    )}
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 opacity-70">
                            <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 dark:border-zinc-700 dark:border-t-zinc-400 rounded-full animate-spin mb-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Cargando sesiones...</span>
                        </div>
                    ) : sesiones.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/30">
                            <div className="p-4 bg-white dark:bg-zinc-800 rounded-full mb-3 shadow-sm border border-slate-100 dark:border-zinc-700">
                                <HiShieldCheck className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
                            </div>
                            <p className="font-black text-slate-700 dark:text-zinc-200 text-lg">Sin sesiones activas</p>
                            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1 max-w-[250px]">Este usuario no tiene ninguna sesión abierta en este momento.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {sesiones.map((sesion) => (
                                <div
                                    key={sesion.id}
                                    className={`flex flex-col gap-4 p-5 rounded-2xl border transition-colors
                                        ${sesion.actual
                                            ? 'bg-blue-500/5 border-blue-200/50 dark:bg-blue-900/10 dark:border-blue-900/30'
                                            : 'bg-slate-50/50 dark:bg-zinc-900/30 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                                        }`}
                                >
                                    {/* Fila principal */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {getDeviceIcon(sesion.dispositivo)}
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-sm text-slate-800 dark:text-zinc-100 truncate">
                                                        {sesion.dispositivo || "Dispositivo desconocido"}
                                                    </span>
                                                    {sesion.actual && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-bold uppercase tracking-widest">
                                                            Sesión actual
                                                        </span>
                                                    )}
                                                </div>
                                                {sesion.direccion_ip && (
                                                    <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                                                        <HiGlobeAlt className="w-3 h-3" /> {sesion.direccion_ip}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {!sesion.actual && (
                                            <button
                                                type="button"
                                                title="Revocar sesión"
                                                onClick={() => setConfirmCerrar(sesion.id)}
                                                disabled={confirmCerrar === sesion.id}
                                                className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400 flex-shrink-0 disabled:opacity-50 transition-colors"
                                            >
                                                <HiBan className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Detalles de la sesión */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 pl-14">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Inicio de sesión</span>
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300">
                                                <HiClock className="text-slate-400" />
                                                {formatUTCtoHermosilloHora(sesion.fecha_inicio)}
                                            </div>
                                        </div>

                                        {sesion.ultimo_uso && (
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Última actividad</span>
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300">
                                                    <HiClock className="text-emerald-500" />
                                                    {formatUTCtoHermosilloHora(sesion.ultimo_uso)}
                                                </div>
                                            </div>
                                        )}

                                        {sesion.user_agent && (
                                            <div className="col-span-full flex flex-col gap-0.5 mt-1">
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">User Agent</span>
                                                <div
                                                    title={sesion.user_agent}
                                                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 cursor-help truncate w-fit max-w-full"
                                                >
                                                    <HiInformationCircle className="flex-shrink-0" />
                                                    <span className="truncate">
                                                        {sesion.user_agent.length > 70
                                                            ? sesion.user_agent.slice(0, 67) + "..."
                                                            : sesion.user_agent}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal.Body>

            {/* ── FOOTER ── */}
            <Modal.Footer>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                    {sesiones.length} {sesiones.length === 1 ? 'Sesión activa' : 'Sesiones activas'}
                </span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-xl h-10 px-5 text-sm transition-colors"
                    >
                        Cerrar Panel
                    </button>
                    {sesiones.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setConfirmCerrar('todas')}
                            disabled={confirmCerrar === 'todas'}
                            className="inline-flex items-center gap-2 font-bold bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400 disabled:opacity-50 rounded-xl h-10 px-5 text-sm transition-colors"
                        >
                            <HiTrash className="w-4 h-4" />
                            Cerrar Todas
                        </button>
                    )}
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalSesionesUsuario;
