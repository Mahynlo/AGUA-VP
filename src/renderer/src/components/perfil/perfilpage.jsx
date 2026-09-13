import React, { useState, useEffect, useMemo } from "react";
import { Avatar, Chip, Button, Tooltip } from "@heroui/react";
import {
  HiUser, HiMail, HiShieldCheck, HiKey, HiDesktopComputer,
  HiClock, HiCheckCircle, HiExclamationCircle, HiGlobeAlt, HiInformationCircle,
  HiCamera, HiTrash, HiEye, HiEyeOff, HiBan, HiCalendar, HiCheck,
  HiLockClosed, HiSparkles, HiOutlineIdentification, HiRefresh
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

  // Tab activo
  const [selectedTab, setSelectedTab] = useState(() => {
    return localStorage.getItem("perfil_activeTab") || "identidad";
  });

  const handleTabChange = (key) => {
    setSelectedTab(key);
    localStorage.setItem("perfil_activeTab", key);
  };

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
  }, [user?.id, obtenerSesionesActivas]);

  // Estados para cambio de contraseña
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState({ type: "", text: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  const displaySessions = sesiones || [];

  // Validación de requisitos de contraseña en tiempo real
  const passwordCriteria = useMemo(() => {
    const val = passwords.new || "";
    return [
      { id: "length", label: "Mínimo 8 caracteres", ok: val.length >= 8 },
      { id: "lower", label: "1 letra minúscula", ok: /[a-z]/.test(val) },
      { id: "upper", label: "1 letra mayúscula", ok: /[A-Z]/.test(val) },
      { id: "number", label: "1 número", ok: /[0-9]/.test(val) },
      { id: "special", label: "1 carácter especial (@$!%*?&#)", ok: /[@$!%*?&#]/.test(val) },
    ];
  }, [passwords.new]);

  const isPasswordValid = passwordCriteria.every(c => c.ok);

  const handlePassChange = (e, field) => {
    setPasswords(prev => ({ ...prev, [field]: e.target.value }));
    if (passMessage.text) setPassMessage({ type: "", text: "" });
  };

  const handleChangePassword = async () => {
    if (!isPasswordValid) {
      const firstFailing = passwordCriteria.find(c => !c.ok);
      setPassMessage({ type: "error", text: firstFailing ? firstFailing.label : "Contraseña no válida." });
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
          text: "¡Contraseña actualizada exitosamente! Cerrando sesión por seguridad..."
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

  const [refreshingSessions, setRefreshingSessions] = useState(false);

  const handleRefreshSessions = async () => {
    if (!user?.id) return;
    setRefreshingSessions(true);
    try {
      await obtenerSesionesActivas(user.id);
    } catch (error) {
      console.error("Error al actualizar sesiones:", error);
    } finally {
      setRefreshingSessions(false);
    }
  };

  const handleCloseSession = async (sesionId) => {
    setClosingSession(sesionId);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await window.api.closeSpecificSession(sesionId, token);

      if (response.success) {
        if (user?.id) {
          await obtenerSesionesActivas(user.id);
        }
      } else {
        alert("Error: " + (response.message || response.error || "No se pudo cerrar la sesión"));
      }
    } catch (error) {
      console.error("Error cerrar sesión:", error);
    } finally {
      setClosingSession(null);
    }
  };

  // Rol Badge Styling
  const rolBadgeConfig = useMemo(() => {
    const rol = (user?.rol || "").toLowerCase();
    if (rol === "superadmin") {
      return {
        label: "Super Administrador",
        bg: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
        iconColor: "text-purple-600 dark:text-purple-400"
      };
    }
    if (rol === "administrador") {
      return {
        label: "Administrador",
        bg: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
        iconColor: "text-blue-600 dark:text-blue-400"
      };
    }
    return {
      label: "Operador",
      bg: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
      iconColor: "text-slate-600 dark:text-slate-400"
    };
  }, [user?.rol]);

  return (
    // CONTENEDOR PRINCIPAL
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20 scroll-smooth">
      
      {/* CONTENEDOR MAESTRO DE LA VISTA */}
      <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-8 animate-in fade-in duration-300">

        {/* ── 1. HEADER Y TARJETAS DE ESTADO (KPIs) ── */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-8 pb-2">
          
          {/* Título de la vista */}
          <div className="flex gap-4 items-start shrink-0">
            <div className="p-3.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0 flex items-center justify-center">
              <HiUser className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1 pt-0.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                Mi Perfil
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-lg mt-1 leading-relaxed">
                Gestión de cuenta institucional, credenciales de acceso y dispositivos activos.
              </p>
            </div>
          </div>

          {/* Tarjetas de Estadísticas / Estado - Se alinean a la derecha */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full xl:w-auto shrink-0">
            
            {/* KPI: Nivel de Rol */}
            <div className="flex flex-col justify-center p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1 gap-3 min-w-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Nivel / Rol</span>
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <HiShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-black text-slate-800 dark:text-zinc-100 leading-none capitalize truncate">
                {user?.rol || 'Usuario'}
              </p>
            </div>

            {/* KPI: Estado de Cuenta */}
            <div className="flex flex-col justify-center p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1 gap-3 min-w-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Estado</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <HiCheckCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                Activo
              </p>
            </div>

            {/* KPI: Sesiones Activas */}
            <div className="flex flex-col justify-center p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1 gap-3 min-w-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Sesiones</span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <HiDesktopComputer className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">
                {displaySessions.length || 1}
              </p>
            </div>

            {/* KPI: Miembro Desde */}
            <div className="flex flex-col justify-center p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1 gap-3 min-w-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Registro</span>
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <HiCalendar className="w-4 h-4" />
                </div>
              </div>
              <p className="text-sm font-black text-slate-800 dark:text-zinc-100 leading-none truncate">
                {user?.fecha_creacion ? formatUTCtoHermosilloSoloFecha(user.fecha_creacion) : 'Vigente'}
              </p>
            </div>

          </div>
        </div>

        {/* ── 2. CUERPO PRINCIPAL (2 COLUMNAS) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── COLUMNA IZQUIERDA: Tarjeta de Identidad (4 columnas) ── */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-2xl relative overflow-hidden flex flex-col items-center">
              
              {/* Banner superior decorativo */}
              <div className="h-28 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/5 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/10 w-full absolute top-0 left-0 border-b border-slate-200/80 dark:border-zinc-800"></div>
              
              <div className="p-6 sm:p-8 pt-12 text-center relative z-10 flex flex-col items-center w-full">
                
                {/* Avatar con Anillo y Beacon de Estado */}
                <div className="relative mb-4 mt-2">
                  <Avatar
                    className="w-28 h-28 text-large border-4 border-white dark:border-zinc-950 shadow-md bg-slate-200 dark:bg-zinc-800"
                  >
                    <Avatar.Image
                      src={avatarSrc || defaultAvatar}
                      alt={user?.nombre || "Avatar"}
                    />
                    <Avatar.Fallback>{(user?.nombre || "U").charAt(0).toUpperCase()}</Avatar.Fallback>
                  </Avatar>
                  <div className="absolute bottom-1 right-1 p-1 bg-white dark:bg-zinc-950 rounded-full shadow-sm">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 block border-2 border-white dark:border-zinc-950" />
                  </div>
                </div>

                {/* Nombre y Nombre de usuario */}
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none mb-1.5">
                  {user?.nombre || 'Usuario'}
                </h2>
                <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 font-mono mb-4">
                  @{user?.username || 'usuario'}
                </p>

                {/* Rol Chip */}
                <div className="mb-6">
                  <Chip 
                    size="sm" 
                    variant="ghost" 
                    className={`font-bold text-[10px] uppercase tracking-widest px-2.5 border ${rolBadgeConfig.bg}`}
                    startContent={<HiShieldCheck className={`w-3.5 h-3.5 ml-1 ${rolBadgeConfig.iconColor}`} />}
                  >
                    {rolBadgeConfig.label}
                  </Chip>
                </div>

                {/* Ficha Resumen */}
                <div className="w-full flex flex-col gap-2.5 bg-white dark:bg-zinc-900/90 rounded-xl p-4 mb-6 border border-slate-200 dark:border-zinc-800 shadow-sm text-left">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">ID Cuenta</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">#{user?.id || '—'}</span>
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-zinc-800 my-0.5" />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Correo</span>
                    <span className="font-medium text-slate-700 dark:text-zinc-300 truncate max-w-[170px]" title={user?.correo}>
                      {user?.correo || 'No registrado'}
                    </span>
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-zinc-800 my-0.5" />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Miembro Desde</span>
                    <span className="font-bold text-slate-700 dark:text-zinc-300">
                      {user?.fecha_creacion ? formatUTCtoHermosilloSoloFecha(user.fecha_creacion) : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Acciones de Foto */}
                <div className="flex gap-2.5 w-full">
                  <Button
                    onPress={handleChangeAvatar}
                    isLoading={changingAvatar}
                    className="flex-1 font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl shadow-sm h-11 text-xs transition-transform active:scale-95"
                    startContent={!changingAvatar && <HiCamera className="text-base" />}
                  >
                    {changingAvatar ? "Cargando..." : "Cambiar foto"}
                  </Button>
                  {avatarSrc && (
                    <Tooltip content="Restablecer avatar predeterminado" color="danger" classNames={{ content: "font-bold text-xs" }}>
                      <Button
                        isIconOnly
                        onPress={handleRemoveAvatar}
                        className="bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-xl h-11 w-11 transition-colors border border-transparent shrink-0"
                      >
                        <HiTrash className="w-5 h-5" />
                      </Button>
                    </Tooltip>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* ── COLUMNA DERECHA: Pestañas de Gestión (8 columnas) ── */}
          <div className="lg:col-span-8 flex flex-col w-full">
            
            <div className="w-full border-b border-slate-200 dark:border-zinc-800 mb-6 overflow-x-auto">
              <nav className="flex gap-6 sm:gap-8 w-full -mb-px">
                {/* TAB 1: DATOS DE IDENTIDAD */}
                <button
                  type="button"
                  onClick={() => handleTabChange("identidad")}
                  className={`flex items-center gap-2 py-3 text-sm border-b-2 transition-colors cursor-pointer shrink-0 ${
                    selectedTab === "identidad"
                      ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                  }`}
                >
                  <HiOutlineIdentification className="text-lg" />
                  <span>Datos de Cuenta</span>
                </button>

                {/* TAB 2: SEGURIDAD */}
                <button
                  type="button"
                  onClick={() => handleTabChange("seguridad")}
                  className={`flex items-center gap-2 py-3 text-sm border-b-2 transition-colors cursor-pointer shrink-0 ${
                    selectedTab === "seguridad"
                      ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                  }`}
                >
                  <HiKey className="text-lg" />
                  <span>Seguridad y Contraseña</span>
                </button>

                {/* TAB 3: SESIONES */}
                <button
                  type="button"
                  onClick={() => handleTabChange("sesiones")}
                  className={`flex items-center gap-2 py-3 text-sm border-b-2 transition-colors cursor-pointer shrink-0 ${
                    selectedTab === "sesiones"
                      ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                  }`}
                >
                  <HiDesktopComputer className="text-lg" />
                  <span>Dispositivos</span>
                  <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black h-5 text-[10px] px-1.5 ml-1 rounded-md border border-blue-500/20 inline-flex items-center">
                    {displaySessions.length || 1}
                  </span>
                </button>
              </nav>
            </div>

            {/* TAB 1: DATOS DE IDENTIDAD */}
            {selectedTab === "identidad" && (
              <div className="flex flex-col gap-6 pt-1 animate-in fade-in duration-300">
                  
                  {/* Card de Información de Cuenta */}
                  <div className="bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
                    <div className="flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800 pb-4">
                      <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                        <HiInformationCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest">
                          Información Institucional
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                          Datos de identidad registrados en el sistema AguaVP.
                        </p>
                      </div>
                    </div>
                    
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
                    </div>
                  </div>

                  {/* Card de Privilegios del Rol */}
                  <div className="bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-5">
                    <div className="flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800 pb-4">
                      <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                        <HiShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest">
                          Nivel de Privilegios y Alcance
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                          Permisos operativos asignados a esta cuenta.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
                      <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl shrink-0 mt-0.5">
                        <HiShieldCheck className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-black text-slate-800 dark:text-zinc-100 uppercase tracking-widest">
                            {user?.rol || 'No asignado'}
                          </p>
                          <Chip size="sm" variant="ghost" className={`text-[9px] font-bold uppercase tracking-widest h-5 px-1.5 ${rolBadgeConfig.bg}`}>
                            Nivel Activo
                          </Chip>
                        </div>
                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 leading-relaxed">
                          {user?.rol === 'superadmin' ? 'Acceso maestro: control total de usuarios, configuraciones del sistema, respaldos de base de datos y auditoría.' : 
                           user?.rol === 'administrador' ? 'Permisos administrativos: gestión completa de clientes, medidores, tarifas, facturación y reportes de recaudación.' : 
                           'Permisos operativos básicos y captura de lecturas.'}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
            )}

            {/* TAB 2: SEGURIDAD Y CONTRASEÑA */}
            {selectedTab === "seguridad" && (
              <div className="flex flex-col gap-6 pt-1 animate-in fade-in duration-300">
                  
                  <div className="bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
                    
                    <div className="flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800 pb-4">
                      <div className="p-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg">
                        <HiKey className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest">
                          Actualización de Credenciales
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                          Modifica tu contraseña periódicamente para mantener tu cuenta protegida.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* Contraseña Actual */}
                      <div className="md:col-span-2">
                        <IconInput
                          type={showPasswords.current ? "text" : "password"}
                          label="Contraseña Actual"
                          icon={HiLockClosed}
                          iconColor="text-orange-500"
                          placeholder="Ingresa tu contraseña actual"
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

                      {/* Nueva Contraseña */}
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

                      {/* Confirmar Nueva Contraseña */}
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

                      {/* Checklist dinámico de requisitos de seguridad */}
                      <div className="md:col-span-2 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 shadow-sm flex flex-col gap-2.5">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                          Requisitos de Seguridad de la Contraseña
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                          {passwordCriteria.map(item => (
                            <div 
                              key={item.id}
                              className={`flex items-center gap-2 text-xs font-semibold transition-colors duration-200 ${
                                item.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-600'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                                item.ok ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-zinc-800 text-slate-400'
                              }`}>
                                <HiCheck className="w-3 h-3" />
                              </div>
                              <span className="text-[11px]">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mensajes de Error / Éxito */}
                      {passMessage.text && (
                        <div className={`md:col-span-2 p-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border ${
                          passMessage.type === 'error'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}>
                          {passMessage.type === 'error' ? <HiExclamationCircle className="w-5 h-5 shrink-0" /> : <HiCheckCircle className="w-5 h-5 shrink-0" />}
                          <p>{passMessage.text}</p>
                        </div>
                      )}

                      {/* Botón de Guardar */}
                      <div className="md:col-span-2 flex justify-end mt-2">
                        <Button
                          className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-8 h-[50px] shadow-sm transition-transform active:scale-95 w-full sm:w-auto"
                          onPress={handleChangePassword}
                          isLoading={passLoading}
                          isDisabled={!passwords.current || !passwords.new || !passwords.confirm}
                        >
                          Actualizar Contraseña
                        </Button>
                      </div>

                    </div>
                  </div>

                </div>
            )}

            {/* TAB 3: DISPOSITIVOS Y SESIONES */}
            {selectedTab === "sesiones" && (
              <div className="flex flex-col gap-6 pt-1 animate-in fade-in duration-300">
                  
                  <div className="bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                          <HiDesktopComputer className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest">
                            Sesiones Activas y Dispositivos
                          </h3>
                          <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                            Monitorea los equipos que han iniciado sesión con tu cuenta institucional.
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="font-bold text-xs h-9 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800 self-start sm:self-auto"
                        onPress={handleRefreshSessions}
                        isLoading={refreshingSessions}
                        startContent={!refreshingSessions && <HiRefresh className="w-4 h-4" />}
                      >
                        Actualizar
                      </Button>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      {displaySessions.length > 0 ? (
                        displaySessions.map((sesion, i) => (
                          <div
                            key={i}
                            className={`flex flex-col p-5 rounded-2xl border transition-colors shadow-sm gap-4 ${
                              sesion.actual
                                ? 'bg-white dark:bg-zinc-950 border-emerald-300/60 dark:border-emerald-800/40 ring-1 ring-emerald-500/20'
                                : 'bg-white dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            {/* Fila superior: icono + nombre + badge actual + botón */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className={`p-3 rounded-xl shrink-0 ${
                                  sesion.actual 
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700'
                                }`}>
                                  <HiDesktopComputer className="text-xl" />
                                </div>
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                    <p className="font-bold text-slate-800 dark:text-zinc-100 text-sm truncate">
                                      {sesion.dispositivo || 'Dispositivo de Escritorio'}
                                    </p>
                                    {sesion.actual && (
                                      <Chip size="sm" className="h-5 px-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold tracking-widest uppercase border border-emerald-500/20">
                                        Este Dispositivo
                                      </Chip>
                                    )}
                                  </div>
                                  {sesion.direccion_ip && (
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold font-mono text-slate-400 dark:text-zinc-500">
                                      <HiGlobeAlt className="shrink-0" />
                                      <span>IP: {sesion.direccion_ip}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {!sesion.actual ? (
                                <Button
                                  size="sm"
                                  className="font-bold shrink-0 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-xl h-9 px-3 text-xs"
                                  onPress={() => handleCloseSession(sesion.id)}
                                  isLoading={closingSession === sesion.id}
                                  startContent={closingSession !== sesion.id && <HiBan className="w-4 h-4" />}
                                >
                                  Cerrar Sesión
                                </Button>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>En Línea</span>
                                </div>
                              )}
                            </div>

                            {/* Fila de detalles de tiempo */}
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-500 dark:text-zinc-400 pt-3 border-t border-slate-100 dark:border-zinc-800">
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
                              
                              {/* Info Navegador / User Agent */}
                              {sesion.user_agent && (
                                <Tooltip content={sesion.user_agent} placement="top" classNames={{ content: "max-w-xs text-[10px] font-bold" }}>
                                  <div className="flex items-center gap-1.5 cursor-help ml-auto">
                                    <HiInformationCircle className="shrink-0 text-slate-400 dark:text-zinc-500" />
                                    <span className="truncate max-w-[120px] sm:max-w-[200px] font-medium">
                                      Navegador / SO
                                    </span>
                                  </div>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/40">
                          <HiShieldCheck className="text-4xl text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
                          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1">Todo seguro</p>
                          <p className="text-xs font-medium text-slate-400 dark:text-zinc-500">No hay otras sesiones activas en este momento.</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
