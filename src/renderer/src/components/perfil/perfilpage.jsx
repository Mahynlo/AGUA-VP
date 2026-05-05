import { useState, useEffect } from "react";
import { Avatar } from "@nextui-org/avatar";
import { Chip } from "@nextui-org/chip";
import { Button, Badge, Tooltip, Spinner } from "@nextui-org/react";
import {
  HiUser, HiMail, HiShieldCheck, HiKey, HiDesktopComputer,
  HiClock, HiCheckCircle, HiExclamationCircle, HiGlobeAlt, HiInformationCircle,
  HiCamera, HiTrash, HiEye, HiEyeOff, HiBan
} from "react-icons/hi";
import defaultAvatar from "../../assets/images/Avatar.png";
import { useAuth } from "../../context/AuthContext";
import { formatUTCtoHermosilloSoloFecha, formatUTCtoHermosilloHora } from "../../utils/formatFecha";

// Componente reutilizable para Input con Icono (Premium UI - Token 4)
const IconInput = ({ label, icon: Icon, type = "text", value, readOnly, placeholder, onChange, iconColor = "text-blue-500", endContent }) => (
  <div className="w-full flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
      {label}
    </label>
    <div className="relative w-full flex items-center group">
      <span className={`absolute left-4 flex items-center justify-center pointer-events-none transition-colors duration-200 
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
          w-full pl-11 ${endContent ? 'pr-12' : 'pr-4'} py-3 text-sm font-medium rounded-xl transition-all duration-200 resize-none h-[52px]
          border border-slate-200 dark:border-zinc-800 shadow-none
          ${readOnly
            ? 'bg-slate-50/50 dark:bg-zinc-900/30 text-slate-500 dark:text-zinc-500 cursor-default select-none focus:outline-none'
            : 'bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
          }
        `}
      />
      {endContent && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {endContent}
        </div>
      )}
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
        window.dispatchEvent(new CustomEvent('user-avatar-changed', { detail: { key: avatarKey } }));
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
      window.dispatchEvent(new CustomEvent('user-avatar-changed', { detail: { key: avatarKey } }));
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
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  const displaySessions = sesiones || [];

  const handlePassChange = (e, field) => {
    setPasswords(prev => ({ ...prev, [field]: e.target.value }));
    if (passMessage.text) setPassMessage({ type: "", text: "" });
  };

  const getPasswordIssues = (value) => {
    const issues = [];
    if (value.length < 8) issues.push('Debe tener al menos 8 caracteres.');
    if (!/[a-z]/.test(value)) issues.push('Incluye una letra minúscula.');
    if (!/[A-Z]/.test(value)) issues.push('Incluye una letra mayúscula.');
    if (!/[0-9]/.test(value)) issues.push('Incluye un número.');
    if (!/[@$!%*?&#]/.test(value)) issues.push('Incluye un caracter especial (@$!%*?&#).');
    return issues;
  };

  const handleChangePassword = async () => {
    const passwordIssues = getPasswordIssues(passwords.new);
    if (passwordIssues.length > 0) {
      setPassMessage({ type: "error", text: passwordIssues[0] });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPassMessage({ type: "error", text: "Las contraseñas nuevas no coinciden." });
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

  const toggleShowPassword = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
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
    // CONTENEDOR PRINCIPAL
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20 scroll-smooth">
      
      {/* CONTENEDOR MAESTRO DE LA VISTA */}
      <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-10 animate-in fade-in duration-500">

        {/* ── HEADER DEL MÓDULO ── */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-8 border-b border-slate-100 dark:border-zinc-800/80 pb-8">
          <div className="flex gap-4 items-start shrink-0">
            <div className="p-3.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0 flex items-center justify-center">
              <HiUser className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1 pt-0.5">
              <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                Mi Perfil
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Gestión de cuenta, preferencias y configuración de seguridad.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── COLUMNA IZQUIERDA: Tarjeta de Identidad (4 columnas) ── */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl relative overflow-hidden flex flex-col items-center">
              {/* Background cover color */}
              <div className="h-28 bg-slate-200/50 dark:bg-zinc-800/50 w-full absolute top-0 left-0 border-b border-slate-200 dark:border-zinc-700/50"></div>
              
              <div className="p-8 pt-14 text-center relative z-10 flex flex-col items-center w-full">
                
                {/* Avatar */}
                <div className="relative mb-5 mt-2">
                  <Avatar
                    src={avatarSrc || defaultAvatar}
                    className="w-32 h-32 text-large border-4 border-white dark:border-zinc-900 shadow-md bg-slate-200 dark:bg-zinc-800"
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

                <h2 className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none mb-1.5">
                  {user?.nombre}
                </h2>
                <p className="text-sm font-bold text-slate-400 dark:text-zinc-500 mb-5">
                  @{user?.username}
                </p>

                <Chip 
                    size="sm" 
                    variant="flat" 
                    className="mb-8 font-bold text-[10px] uppercase tracking-widest px-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    startContent={<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />}
                >
                  En línea
                </Chip>

                <div className="w-full bg-white dark:bg-zinc-900 rounded-xl p-4 mb-6 border border-slate-200 dark:border-zinc-800 flex justify-between items-center shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Miembro Desde</span>
                  <span className="font-bold text-sm text-slate-700 dark:text-zinc-300">
                    {user?.fecha_creacion ? formatUTCtoHermosilloSoloFecha(user.fecha_creacion) : 'N/A'}
                  </span>
                </div>

                <div className="flex gap-3 w-full">
                  <Button
                    onPress={handleChangeAvatar}
                    isLoading={changingAvatar}
                    className="flex-1 font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl shadow-sm h-11 transition-transform active:scale-95"
                    startContent={!changingAvatar && <HiCamera className="text-lg" />}
                  >
                    {changingAvatar ? "Cargando..." : "Cambiar foto"}
                  </Button>
                  {avatarSrc && (
                    <Tooltip content="Eliminar foto" color="danger" classNames={{content: "font-bold text-xs"}}>
                      <Button
                        isIconOnly
                        onPress={handleRemoveAvatar}
                        className="bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded-xl h-11 transition-colors border border-transparent"
                      >
                        <HiTrash className="w-5 h-5" />
                      </Button>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── COLUMNA DERECHA: Detalles y Configuración (8 columnas) ── */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* SECCIÓN 1: Información Personal (Read-Only) */}
            <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800/80 pb-4">
                <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                  <HiInformationCircle className="w-5 h-5" />
                </div>
                <h3 className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                  Datos de Identidad
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="md:col-span-2 flex flex-col gap-1.5 mt-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                      Nivel de Privilegios
                  </label>
                  <div className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
                    <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
                      <HiShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-black text-slate-800 dark:text-zinc-100 uppercase tracking-widest">{user?.rol || 'No asignado'}</p>
                      <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                          {user?.rol === 'superadmin' ? 'Acceso total y control absoluto del sistema.' : 
                           user?.rol === 'administrador' ? 'Permisos administrativos y reportes avanzados.' : 
                           'Permisos operativos básicos y limitados.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: Seguridad (Formulario Password) */}
            <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800/80 pb-4">
                <div className="p-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg">
                  <HiKey className="w-5 h-5" />
                </div>
                <h3 className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                  Seguridad y Credenciales
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <IconInput
                    type={showPasswords.current ? "text" : "password"}
                    label="Contraseña Actual"
                    icon={HiKey}
                    iconColor="text-orange-500"
                    placeholder="••••••••"
                    value={passwords.current}
                    onChange={(e) => handlePassChange(e, 'current')}
                    endContent={
                      <button
                        type="button"
                        onClick={() => toggleShowPassword('current')}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-zinc-200"
                      >
                        {showPasswords.current ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
                      </button>
                    }
                  />
                </div>
                <IconInput
                  type={showPasswords.new ? "text" : "password"}
                  label="Nueva Contraseña"
                  icon={HiKey}
                  iconColor="text-blue-500"
                  placeholder="••••••••"
                  value={passwords.new}
                  onChange={(e) => handlePassChange(e, 'new')}
                  endContent={
                    <button
                      type="button"
                      onClick={() => toggleShowPassword('new')}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-zinc-200"
                    >
                      {showPasswords.new ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
                    </button>
                  }
                />
                <IconInput
                  type={showPasswords.confirm ? "text" : "password"}
                  label="Confirmar Contraseña"
                  icon={HiKey}
                  iconColor="text-blue-500"
                  placeholder="••••••••"
                  value={passwords.confirm}
                  onChange={(e) => handlePassChange(e, 'confirm')}
                  endContent={
                    <button
                      type="button"
                      onClick={() => toggleShowPassword('confirm')}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-zinc-200"
                    >
                      {showPasswords.confirm ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
                    </button>
                  }
                />

                <div className="md:col-span-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3.5 text-[11px] font-bold text-slate-500 dark:text-zinc-400 shadow-sm flex items-center gap-2">
                  <HiInformationCircle className="w-4 h-4 shrink-0" />
                  <span>Requisitos: mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial.</span>
                </div>

                {/* Mensajes de Error/Éxito */}
                {passMessage.text && (
                  <div className={`md:col-span-2 p-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border ${
                    passMessage.type === 'error'
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    }`}>
                    {passMessage.type === 'error' ? <HiExclamationCircle className="w-5 h-5 shrink-0" /> : <HiCheckCircle className="w-5 h-5 shrink-0" />}
                    <p>{passMessage.text}</p>
                  </div>
                )}

                <div className="md:col-span-2 flex justify-end mt-2">
                  <Button
                    className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-8 h-[52px] shadow-sm transition-transform active:scale-95 w-full sm:w-auto"
                    onPress={handleChangePassword}
                    isLoading={passLoading}
                    isDisabled={!passwords.current || !passwords.new || !passwords.confirm}
                  >
                    Actualizar Contraseña
                  </Button>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: Sesiones Activas */}
            <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800/80 pb-4">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <HiDesktopComputer className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest leading-tight">Dispositivos Conectados</h3>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                {displaySessions.length > 0 ? (
                  displaySessions.map((sesion, i) => (
                    <div
                      key={i}
                      className={`flex flex-col p-5 rounded-2xl border transition-colors shadow-sm gap-4
                        ${sesion.actual
                          ? 'bg-white dark:bg-zinc-950 border-emerald-200/50 dark:border-emerald-900/30 ring-1 ring-emerald-500/10'
                          : 'bg-white/50 dark:bg-zinc-900/30 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                        }`}
                    >
                      {/* Fila superior: ícono + nombre + badge actual + botón */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`p-3 rounded-xl shadow-sm shrink-0 ${sesion.actual ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700'}`}>
                            <HiDesktopComputer className="text-xl" />
                          </div>
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="font-bold text-slate-800 dark:text-zinc-100 text-sm truncate">{sesion.dispositivo || 'Dispositivo desconocido'}</p>
                              {sesion.actual && (
                                <Chip size="sm" className="h-5 px-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold tracking-widest uppercase border border-emerald-500/20">Este dispositivo</Chip>
                              )}
                            </div>
                            {sesion.direccion_ip && (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-slate-400 dark:text-zinc-500 tracking-wider">
                                <HiGlobeAlt className="shrink-0" />
                                <span>IP: {sesion.direccion_ip}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {!sesion.actual ? (
                          <Button
                            size="sm"
                            className="font-bold shrink-0 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded-lg h-9 px-3"
                            onPress={() => handleCloseSession(sesion.id)}
                            isLoading={closingSession === sesion.id}
                            startContent={closingSession !== sesion.id && <HiBan className="w-4 h-4" />}
                          >
                            Cerrar Sesión
                          </Button>
                        ) : (
                          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1.5 rounded-lg shrink-0">
                            Activa
                          </div>
                        )}
                      </div>

                      {/* Fila de detalles de tiempo */}
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-500 dark:text-zinc-400 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                        <div className="flex items-center gap-1.5">
                          <HiClock className="shrink-0 text-slate-400 dark:text-zinc-500" />
                          <span>Iniciada: <strong className="text-slate-700 dark:text-zinc-300 font-bold">{formatUTCtoHermosilloHora(sesion.fecha_inicio)}</strong></span>
                        </div>
                        {sesion.ultimo_uso && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                            <span>Último uso: <strong className="text-slate-700 dark:text-zinc-300 font-bold">{formatUTCtoHermosilloHora(sesion.ultimo_uso)}</strong></span>
                          </div>
                        )}
                        
                        {/* Info User Agent */}
                        {sesion.user_agent && (
                          <Tooltip content={sesion.user_agent} placement="top" classNames={{ content: "max-w-xs text-[10px] font-bold" }}>
                            <div className="flex items-center gap-1.5 cursor-help ml-auto">
                              <HiInformationCircle className="shrink-0 text-slate-400 dark:text-zinc-500" />
                              <span className="truncate max-w-[120px] sm:max-w-[200px] font-medium">
                                Navegador Info
                              </span>
                            </div>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-zinc-900/50">
                    <HiShieldCheck className="text-4xl text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-600 dark:text-zinc-300 mb-1">Todo seguro</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-500">No hay otras sesiones activas en este momento.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
