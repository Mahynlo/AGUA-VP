import { useState, useEffect } from "react";
import { Avatar } from "@nextui-org/avatar";
import { Chip } from "@nextui-org/chip";
import { Card, CardBody, CardHeader, Button, Badge, Tooltip } from "@nextui-org/react";
import {
  HiUser, HiMail, HiShieldCheck, HiKey, HiDesktopComputer,
  HiClock, HiCheckCircle, HiExclamationCircle, HiGlobeAlt, HiInformationCircle,
  HiCamera, HiTrash
} from "react-icons/hi";
import defaultAvatar from "../../assets/images/Avatar.png";
import { useAuth } from "../../context/AuthContext";
import { formatUTCtoHermosilloSoloFecha, formatUTCtoHermosilloHora } from "../../utils/formatFecha";

// Componente reutilizable para Input con Icono (Premium UI)
const IconInput = ({ label, icon: Icon, type = "text", value, readOnly, placeholder, onChange, iconColor = "text-blue-500" }) => (
  <div className="w-full">
    <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">
      {label}
    </label>
    <div className="relative w-full flex items-center group">
      <span className={`absolute left-3 flex items-center justify-center pointer-events-none transition-colors duration-200 
        ${readOnly ? 'text-slate-400 dark:text-zinc-600' : 'text-slate-400 dark:text-zinc-500 group-focus-within:' + iconColor}`}
      >
        <Icon className="w-5 h-5" />
      </span>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          w-full pl-10 pr-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 resize-none h-11
          border border-slate-200 dark:border-zinc-700 shadow-sm
          ${readOnly
            ? 'bg-slate-50 dark:bg-zinc-800/30 text-slate-500 dark:text-zinc-500 cursor-default select-none focus:outline-none'
            : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-950'
          }
        `}
      />
    </div>
  </div>
);

export default function PerfilPage() {
  const { user, sesiones, obtenerSesionesActivas, logout } = useAuth();
  const [closingSession, setClosingSession] = useState(null);

  // Avatar por usuario
  const avatarKey = user?.id ? `user_avatar_${user.id}` : null;
  const [avatarSrc, setAvatarSrc] = useState(() => {
    if (!avatarKey) return null;
    return localStorage.getItem(avatarKey) || null;
  });
  const [changingAvatar, setChangingAvatar] = useState(false);

  const handleChangeAvatar = async () => {
    setChangingAvatar(true);
    try {
      const result = await window.api.selectLogo();
      if (result?.success && avatarKey) {
        localStorage.setItem(avatarKey, result.data);
        setAvatarSrc(result.data);
      }
    } catch (err) {
      console.error("Error seleccionando avatar:", err);
    } finally {
      setChangingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    if (avatarKey) {
      localStorage.removeItem(avatarKey);
      setAvatarSrc(null);
    }
  };

  useEffect(() => {
    if (user?.id) {
      obtenerSesionesActivas(user.id);
    }
  }, [user, obtenerSesionesActivas]);

  // Estados para cambio de contraseña
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState({ type: "", text: "" });

  const displaySessions = sesiones || [];

  const handlePassChange = (e, field) => {
    setPasswords(prev => ({ ...prev, [field]: e.target.value }));
    if (passMessage.text) setPassMessage({ type: "", text: "" });
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      setPassMessage({ type: "error", text: "Las contraseñas nuevas no coinciden." });
      return;
    }
    if (passwords.new.length < 6) {
      setPassMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }
    if (passwords.current === passwords.new) {
      setPassMessage({ type: "error", text: "La nueva contraseña debe ser diferente a la actual." });
      return;
    }

    setPassLoading(true);
    setPassMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setPassMessage({ type: "error", text: "Sesión expirada. Vuelve a iniciar sesión." });
        return;
      }

      const res = await window.api.changePassword(
        {
          contraseñaActual: passwords.current,
          contraseñaNueva: passwords.new,
          confirmarContraseñaNueva: passwords.confirm
        },
        token
      );

      if (res?.success) {
        setPassMessage({
          type: "success",
          text: "¡Contraseña actualizada! Cerrando sesión por seguridad..."
        });
        setPasswords({ current: "", new: "", confirm: "" });
        setTimeout(() => logout(), 2500);
      } else {
        const msg = res?.error || res?.message || "Ocurrió un error al actualizar la contraseña.";
        setPassMessage({ type: "error", text: msg });
      }
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      setPassMessage({ type: "error", text: "Error de conexión con el servidor. Intenta nuevamente." });
    } finally {
      setPassLoading(false);
    }
  };

  const handleCloseSession = async (sesionId) => {
    setClosingSession(sesionId);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await window.api.closeSpecificSession(sesionId, token);

      if (response.success) {
        window.location.reload();
      } else {
        alert("Error: " + response.message);
      }
    } catch (error) {
      console.error("Error cerrar sesión:", error);
    } finally {
      setClosingSession(null);
    }
  };

  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-24 scroll-smooth">
      <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300 w-full">

        {/* ── HEADER DEL MÓDULO ── */}
        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-6">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl shrink-0">
                      <HiUser className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                          Mi Perfil
                      </h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-1">
                          Gestión de cuenta y configuración de seguridad
                      </p>
                  </div>
              </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── COLUMNA IZQUIERDA: Tarjeta de Identidad (4 columnas) ── */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 relative overflow-hidden">
              {/* Background cover color */}
              <div className="h-24 bg-slate-100 dark:bg-zinc-800/50 w-full absolute top-0 left-0 border-b border-slate-200 dark:border-zinc-700/50"></div>
              
              <CardBody className="p-6 pt-12 text-center relative z-10 flex flex-col items-center">
                
                {/* Avatar */}
                <div className="relative mb-4 mt-2">
                  <Avatar
                    src={avatarSrc || defaultAvatar}
                    className="w-28 h-28 text-large border-4 border-white dark:border-zinc-900 shadow-md bg-slate-200 dark:bg-zinc-800"
                  />
                  <Badge
                    content=""
                    color="success"
                    shape="circle"
                    placement="bottom-right"
                    className="w-5 h-5 border-2 border-white dark:border-zinc-900 shadow-sm"
                  >
                    <div className="w-full h-full rounded-full"></div>
                  </Badge>
                </div>

                <h2 className="text-xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none mb-1">
                  {user?.nombre}
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-5">
                  @{user?.username}
                </p>

                <Chip 
                    size="sm" 
                    variant="flat" 
                    color="success" 
                    className="mb-6 font-bold text-[10px] uppercase tracking-widest px-2"
                    startContent={<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />}
                >
                  En línea
                </Chip>

                <div className="w-full bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-6 border border-slate-100 dark:border-zinc-800 text-left flex justify-between items-center shadow-inner">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Membro Desde</span>
                  <span className="font-bold text-sm text-slate-700 dark:text-zinc-300">
                    {user?.fecha_creacion ? formatUTCtoHermosilloSoloFecha(user.fecha_creacion) : 'N/A'}
                  </span>
                </div>

                <div className="flex gap-2 w-full">
                  <Button
                    onPress={handleChangeAvatar}
                    isLoading={changingAvatar}
                    className="flex-1 font-bold bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-colors"
                    startContent={!changingAvatar && <HiCamera className="text-lg" />}
                  >
                    {changingAvatar ? "Cargando..." : "Cambiar foto"}
                  </Button>
                  {avatarSrc && (
                    <Button
                      isIconOnly
                      onPress={handleRemoveAvatar}
                      className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Eliminar foto"
                    >
                      <HiTrash className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* ── COLUMNA DERECHA: Detalles y Configuración (8 columnas) ── */}
          <div className="lg:col-span-8 space-y-6">

            {/* SECCIÓN 1: Información Personal (Read-Only) */}
            <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
              <CardHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-2.5">
                  <HiInformationCircle className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">Datos de Identidad</h3>
                </div>
              </CardHeader>
              
              <CardBody className="p-6 bg-slate-50/50 dark:bg-black/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <IconInput
                    label="Nombre Completo"
                    icon={HiUser}
                    value={user?.nombre || ''}
                    readOnly
                  />
                  <IconInput
                    label="Usuario de Acceso"
                    icon={HiShieldCheck}
                    value={user?.username || ''}
                    readOnly
                  />
                  <div className="md:col-span-2">
                    <IconInput
                      label="Correo Electrónico Principal"
                      icon={HiMail}
                      value={user?.correo || ''}
                      readOnly
                    />
                  </div>

                  {/* Rol Info Block */}
                  <div className="md:col-span-2 mt-2">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">
                        Nivel de Privilegios
                    </label>
                    <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
                      <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <HiShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 dark:text-zinc-100 capitalize">{user?.rol || 'No asignado'}</p>
                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 mt-0.5">
                            {user?.rol === 'superadmin' ? 'Acceso total y control absoluto del sistema.' : 
                             user?.rol === 'administrador' ? 'Permisos administrativos y reportes avanzados.' : 
                             'Permisos operativos básicos.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* SECCIÓN 2: Seguridad (Formulario Password) */}
            <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
              <CardHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-2.5">
                  <HiKey className="w-5 h-5 text-orange-500" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">Seguridad y Credenciales</h3>
                </div>
              </CardHeader>
              
              <CardBody className="p-6 bg-slate-50/50 dark:bg-black/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <IconInput
                      type="password"
                      label="Contraseña Actual"
                      icon={HiKey}
                      iconColor="text-orange-500"
                      placeholder="••••••••"
                      value={passwords.current}
                      onChange={(e) => handlePassChange(e, 'current')}
                    />
                  </div>
                  <IconInput
                    type="password"
                    label="Nueva Contraseña"
                    icon={HiKey}
                    iconColor="text-blue-500"
                    placeholder="••••••••"
                    value={passwords.new}
                    onChange={(e) => handlePassChange(e, 'new')}
                  />
                  <IconInput
                    type="password"
                    label="Confirmar Contraseña"
                    icon={HiKey}
                    iconColor="text-blue-500"
                    placeholder="••••••••"
                    value={passwords.confirm}
                    onChange={(e) => handlePassChange(e, 'confirm')}
                  />
                </div>

                {/* Mensajes de Error/Éxito */}
                {passMessage.text && (
                  <div className={`mt-5 p-3.5 rounded-xl text-sm font-bold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 border ${
                    passMessage.type === 'error'
                      ? 'bg-red-50 text-red-600 border-red-200/60 dark:bg-red-900/10 dark:border-red-900/50'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200/60 dark:bg-emerald-900/10 dark:border-emerald-900/50'
                    }`}>
                    {passMessage.type === 'error' ? <HiExclamationCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <HiCheckCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                    <p>{passMessage.text}</p>
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <Button
                    color="primary"
                    className="font-bold shadow-md shadow-blue-500/30 px-8 h-11 w-full sm:w-auto"
                    onPress={handleChangePassword}
                    isLoading={passLoading}
                    isDisabled={!passwords.current || !passwords.new || !passwords.confirm}
                  >
                    Actualizar Contraseña
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* SECCIÓN 3: Sesiones Activas */}
            <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
              <CardHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-2.5">
                  <HiDesktopComputer className="w-5 h-5 text-emerald-500" />
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider leading-tight">Dispositivos Conectados</h3>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-500 mt-0.5">Controla las sesiones activas en tu cuenta</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardBody className="p-6 bg-slate-50/50 dark:bg-black/10">
                {displaySessions.length > 0 ? (
                  <div className="space-y-4">
                    {displaySessions.map((sesion, i) => (
                      <div
                        key={i}
                        className={`flex flex-col p-5 rounded-2xl border transition-colors shadow-sm gap-4
                          ${sesion.actual
                            ? 'bg-white dark:bg-zinc-900 border-blue-200 dark:border-blue-900/50'
                            : 'bg-slate-50 dark:bg-zinc-800/30 border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600'
                          }`}
                      >
                        {/* Fila superior: ícono + nombre + badge actual + botón */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl shadow-sm shrink-0 ${sesion.actual ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 border border-slate-100 dark:border-zinc-700'}`}>
                              <HiDesktopComputer className="text-xl" />
                            </div>
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <p className="font-bold text-slate-800 dark:text-zinc-100 text-sm truncate">{sesion.dispositivo || 'Dispositivo desconocido'}</p>
                                {sesion.actual && (
                                  <Chip size="sm" color="primary" variant="flat" className="h-5 text-[9px] font-bold tracking-wider uppercase px-1">Este dispositivo</Chip>
                                )}
                              </div>
                              {sesion.direccion_ip && (
                                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                                  <HiGlobeAlt className="shrink-0 text-slate-400" />
                                  <span>IP: {sesion.direccion_ip}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {!sesion.actual ? (
                            <Button
                              size="sm"
                              color="danger"
                              variant="flat"
                              className="font-bold shrink-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100"
                              onPress={() => handleCloseSession(sesion.id)}
                              isLoading={closingSession === sesion.id}
                            >
                              Cerrar Sesión
                            </Button>
                          ) : (
                            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md shrink-0">
                              Activa
                            </div>
                          )}
                        </div>

                        {/* Fila de detalles de tiempo */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-500 dark:text-zinc-400 pt-3 border-t border-slate-100 dark:border-zinc-800/50">
                          <div className="flex items-center gap-1.5">
                            <HiClock className="shrink-0 text-slate-400" />
                            <span>Iniciada: <strong className="text-slate-700 dark:text-zinc-300 font-medium">{formatUTCtoHermosilloHora(sesion.fecha_inicio)}</strong></span>
                          </div>
                          {sesion.ultimo_uso && (
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                              <span>Último uso: <strong className="text-slate-700 dark:text-zinc-300 font-medium">{formatUTCtoHermosilloHora(sesion.ultimo_uso)}</strong></span>
                            </div>
                          )}
                          
                          {/* Info User Agent */}
                          {sesion.user_agent && (
                            <Tooltip content={sesion.user_agent} placement="top" classNames={{ content: "max-w-xs text-xs font-medium" }}>
                              <div className="flex items-center gap-1.5 cursor-help ml-auto">
                                <HiInformationCircle className="shrink-0 text-slate-400" />
                                <span className="truncate max-w-[120px] sm:max-w-[200px]">
                                  Navegador Info
                                </span>
                              </div>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-zinc-900/50">
                    <HiShieldCheck className="text-5xl text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-600 dark:text-zinc-300 mb-1">Todo seguro</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-500">No hay otras sesiones activas en este momento.</p>
                  </div>
                )}
              </CardBody>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}

