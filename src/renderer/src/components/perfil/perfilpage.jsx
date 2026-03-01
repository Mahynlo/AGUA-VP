import { useState, useEffect } from "react";
import { Avatar } from "@nextui-org/avatar";
import { Chip } from "@nextui-org/chip";
import { Card, CardBody, CardHeader, Button, Badge, Spinner, Tooltip } from "@nextui-org/react";
import {
  HiUser, HiMail, HiShieldCheck, HiKey, HiDesktopComputer,
  HiClock, HiCheckCircle, HiExclamationCircle, HiLocationMarker,
  HiChip, HiGlobeAlt, HiInformationCircle
} from "react-icons/hi";
import AvatarPerfil from "../../assets/images/Avatar.png";
import { useAuth } from "../../context/AuthContext";
import { formatUTCtoHermosilloSoloFecha, formatUTCtoHermosilloHora } from "../../utils/formatFecha";

// Componente reutilizable para Input con Icono (Estilo Consistente)
const IconInput = ({ label, icon: Icon, type = "text", value, readOnly, placeholder, onChange, iconColor = "text-blue-600" }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <div className="relative w-full flex group">
      <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${readOnly ? 'text-gray-400' : 'text-gray-500 group-focus-within:text-blue-500'} dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 pr-2 py-1 transition-colors duration-200`}>
        <Icon className={`text-lg ${readOnly ? 'opacity-70' : ''} ${iconColor}`} />
      </span>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          w-full pl-12 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-200
          ${readOnly
            ? 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-400 cursor-default'
            : 'bg-white text-gray-700 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:focus:border-blue-400 dark:focus:ring-blue-900/30'
          }
        `}
      />
    </div>
  </div>
);

export default function PerfilPage() {
  const { user, sesiones, obtenerSesionesActivas, logout } = useAuth();
  const [closingSession, setClosingSession] = useState(null);

  // Cargar sesiones al entrar al perfil
  // import { useEffect } from "react"; (Asegurar importación arriba si falta, pero ya está en linea 1)
  useEffect(() => {
    if (user?.id) {
      obtenerSesionesActivas(user.id);
    }
  }, [user]);

  // Estados para cambio de contraseña
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState({ type: "", text: "" });

  // Función para obtener sesión actual (Token)
  const getCurrentSessionId = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const decoded = JSON.parse(atob(token.split(".")[1]));
      return decoded.jti || null;
    } catch (error) {
      return null;
    }
  };

  // Mostrar todas las sesiones (incluida la actual)
  const displaySessions = sesiones || [];

  // Manejar inputs de contraseña
  const handlePassChange = (e, field) => {
    setPasswords(prev => ({ ...prev, [field]: e.target.value }));
    if (passMessage.text) setPassMessage({ type: "", text: "" }); // Limpiar errores al escribir
  };

  // Función para cambiar contraseña (conectada con la API real)
  const handleChangePassword = async () => {
    // ── Validación local básica (el backend hará la validación completa) ───
    if (passwords.new !== passwords.confirm) {
      setPassMessage({ type: "error", text: "Las contraseñas nuevas no coinciden" });
      return;
    }
    if (passwords.new.length < 8) {
      setPassMessage({ type: "error", text: "La contraseña debe tener al menos 8 caracteres" });
      return;
    }
    if (passwords.current === passwords.new) {
      setPassMessage({ type: "error", text: "La nueva contraseña debe ser diferente a la actual" });
      return;
    }

    setPassLoading(true);
    setPassMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setPassMessage({ type: "error", text: "Sesión no disponible. Vuelve a iniciar sesión." });
        return;
      }

      const res = await window.api.changePassword(
        {
          contraseñaActual:          passwords.current,
          contraseñaNueva:           passwords.new,
          confirmarContraseñaNueva: passwords.confirm
        },
        token
      );

      if (res?.success) {
        setPassMessage({
          type: "success",
          text: "Contraseña actualizada. Cerrando sesión..."
        });
        setPasswords({ current: "", new: "", confirm: "" });
        // El backend revoca todos los refresh tokens al cambiar la clave.
        // Hacemos logout para que el usuario se autentique con la nueva contraseña.
        setTimeout(() => logout(), 2000);
      } else {
        // Mostrar el error devuelto por el servidor
        const msg = res?.error || res?.message || "Error al actualizar la contraseña";
        setPassMessage({ type: "error", text: msg });
      }
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      setPassMessage({ type: "error", text: "Error de conexión. Intenta nuevamente." });
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
      <div className="min-h-full rounded-2xl p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50/50 dark:from-gray-900 dark:to-blue-950/30">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-gray-200 dark:border-gray-800 pb-6">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20">
              <HiUser className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                Mi Perfil
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
                Gestiona tu información personal y seguridad de la cuenta
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Columna Izquierda: Tarjeta de Perfil (4 columnas) */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="overflow-visible backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700 shadow-xl">
                <CardBody className="p-8 text-center relative">
                  {/* Badge de estado flotante */}
                  <div className="absolute top-4 right-4">
                    <Chip
                      color="success"
                      variant="flat"
                      size="sm"
                      classNames={{ base: "bg-green-100/50 dark:bg-green-900/30 border border-green-200 dark:border-green-800" }}
                      startContent={<span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse box-content border-2 border-transparent" />}
                    >
                      Online
                    </Chip>
                  </div>

                  <div className="relative inline-block mb-4 group">
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <Avatar
                      src={AvatarPerfil}
                      className="w-32 h-32 text-large ring-4 ring-white dark:ring-gray-800 shadow-2xl relative z-10"
                    />
                    <Badge
                      content=""
                      color="success"
                      shape="circle"
                      className="absolute bottom-2 right-2 w-5 h-5 border-2 border-white dark:border-gray-800 z-20"
                    />
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {user.nombre}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-6">
                    @{user.username}
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Miembro desde</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        {formatUTCtoHermosilloSoloFecha(user.fecha_creacion)}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-200"
                    startContent={<HiUser className="text-lg" />}
                  >
                    Editar Foto
                  </Button>
                </CardBody>
              </Card>
            </div>

            {/* Columna Derecha: Detalles y Configuración (8 columnas) */}
            <div className="lg:col-span-8 space-y-8">

              {/* Sección 1: Información Personal (Read-Only) */}
              <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <CardHeader className="px-6 pt-6 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                      <HiUser className="text-xl" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Datos Personales</h3>
                  </div>
                </CardHeader>
                <CardBody className="px-6 pb-8 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <IconInput
                    label="Nombre Completo"
                    icon={HiUser}
                    value={user.nombre}
                    readOnly
                  />
                  <IconInput
                    label="Nombre de Usuario"
                    icon={HiShieldCheck}
                    value={user.username}
                    readOnly
                  />
                  <div className="md:col-span-2">
                    <IconInput
                      label="Correo Electrónico"
                      icon={HiMail}
                      value={user.correo}
                      readOnly
                    />
                  </div>

                  {/* Chip de Rol destacado */}
                  <div className="md:col-span-2 mt-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Rol de Usuario</label>
                    <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 rounded-xl">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                        <HiShieldCheck />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{user.rol}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Permisos completos de administración</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Sección 2: Seguridad (Formulario) */}
              <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <CardHeader className="px-6 pt-6 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                      <HiKey className="text-xl" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Cambiar Contraseña</h3>
                  </div>
                </CardHeader>
                <CardBody className="px-6 pb-8 pt-4 space-y-5">
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
                      iconColor="text-gray-400"
                      placeholder="••••••••"
                      value={passwords.new}
                      onChange={(e) => handlePassChange(e, 'new')}
                    />
                    <IconInput
                      type="password"
                      label="Confirmar Contraseña"
                      icon={HiKey}
                      iconColor="text-gray-400"
                      placeholder="••••••••"
                      value={passwords.confirm}
                      onChange={(e) => handlePassChange(e, 'confirm')}
                    />
                  </div>

                  {/* Mensajes de Error/Éxito */}
                  {passMessage.text && (
                    <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${passMessage.type === 'error'
                      ? 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-800'
                      : 'bg-green-50 text-green-600 border border-green-100 dark:bg-green-900/20 dark:border-green-800'
                      }`}>
                      {passMessage.type === 'error' ? <HiExclamationCircle /> : <HiCheckCircle />}
                      {passMessage.text}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      color="primary"
                      className="font-semibold shadow-md bg-gradient-to-r from-orange-500 to-red-500 border-none"
                      onPress={handleChangePassword}
                      isLoading={passLoading}
                      isDisabled={!passwords.current || !passwords.new || !passwords.confirm}
                    >
                      Actualizar Seguridad
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* Sección 3: Sesiones Activas */}
              <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <CardHeader className="px-6 pt-6 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                      <HiDesktopComputer className="text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">Sesiones Activas</h3>
                      <p className="text-xs text-gray-500">Dispositivos donde tu cuenta está abierta actualmente</p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="px-6 pb-8 pt-4">
                  {displaySessions.length > 0 ? (
                    <div className="space-y-3">
                      {displaySessions.map((sesion, i) => (
                        <div
                          key={i}
                          className={`flex flex-col p-4 rounded-xl border transition-colors gap-3
                            ${sesion.actual
                              ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                              : 'bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                            }`}
                        >
                          {/* Fila superior: ícono + nombre + badge actual */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-full shadow-sm flex-shrink-0 ${sesion.actual ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-white dark:bg-gray-800'}`}>
                                <HiDesktopComputer className={`${sesion.actual ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'} text-lg`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{sesion.dispositivo || 'Dispositivo desconocido'}</p>
                                  {sesion.actual && (
                                    <Chip size="sm" color="primary" variant="flat" className="h-4 text-[10px] px-1">Sesión actual</Chip>
                                  )}
                                </div>
                              </div>
                            </div>
                            {!sesion.actual ? (
                              <Button
                                size="sm"
                                color="danger"
                                variant="flat"
                                className="font-medium flex-shrink-0"
                                onPress={() => handleCloseSession(sesion.id)}
                                isLoading={closingSession === sesion.id}
                              >
                                Cerrar
                              </Button>
                            ) : (
                              <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/20 px-2 py-1 rounded-lg flex-shrink-0">
                                En uso
                              </div>
                            )}
                          </div>

                          {/* Fila de detalles del dispositivo */}
                          <div className="grid grid-cols-1 gap-1 text-[11px] text-gray-500 dark:text-gray-400 pl-10">
                            {sesion.direccion_ip && (
                              <div className="flex items-center gap-1.5">
                                <HiGlobeAlt className="flex-shrink-0 text-gray-400" />
                                <span>IP: <span className="font-medium text-gray-700 dark:text-gray-300">{sesion.direccion_ip}</span></span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <HiClock className="flex-shrink-0 text-gray-400" />
                              <span>Inicio: <span className="font-medium text-gray-700 dark:text-gray-300">{formatUTCtoHermosilloHora(sesion.fecha_inicio)}</span></span>
                              {sesion.ultimo_uso && (
                                <span className="ml-2">· Última act: <span className="font-medium text-gray-700 dark:text-gray-300">{formatUTCtoHermosilloHora(sesion.ultimo_uso)}</span></span>
                              )}
                            </div>
                            {sesion.user_agent && (
                              <Tooltip content={sesion.user_agent} placement="bottom" classNames={{ content: "max-w-xs text-xs" }}>
                                <div className="flex items-center gap-1.5 cursor-help">
                                  <HiInformationCircle className="flex-shrink-0 text-gray-400" />
                                  <span className="truncate max-w-[220px]">
                                    {sesion.user_agent.length > 60
                                      ? sesion.user_agent.slice(0, 57) + '...'
                                      : sesion.user_agent}
                                  </span>
                                </div>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                      <HiShieldCheck className="text-4xl text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">Todo seguro</p>
                      <p className="text-sm text-gray-400">No hay otras sesiones activas en este momento</p>
                    </div>
                  )}
                </CardBody>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

