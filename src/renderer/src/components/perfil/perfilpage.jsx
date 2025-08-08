import { Avatar } from "@nextui-org/avatar";
import { Chip } from "@nextui-org/chip";
import { Card, CardBody, CardHeader, Button, Input, Divider, Badge } from "@nextui-org/react";
import { HiUser, HiMail, HiShieldCheck, HiKey, HiDesktopComputer, HiClock } from "react-icons/hi";
import AvatarPerfil from "../../assets/images/Avatar.png";
import { useAuth } from "../../context/AuthContext";
import { formatUTCtoHermosillo, formatUTCtoHermosilloSoloFecha, formatUTCtoHermosilloHora } from "../../utils/formatFecha";

export default function PerfilPage() {
  const { user, sesiones } = useAuth();

  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">

      <div className="min-h-screen rounded-lg p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <HiUser className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Mi Perfil
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gestiona tu información personal y configuraciones
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Perfil resumen */}
            <div className="lg:col-span-1">
              <Card className="h-fit backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border-0 shadow-lg">
                <CardBody className="p-6 text-center space-y-6">
                  <div className="relative">
                    <Avatar
                      src={AvatarPerfil}
                      className="w-24 h-24 mx-auto ring-4 ring-blue-500/20"
                    />
                    <Badge
                      content=""
                      color="success"
                      shape="circle"
                      className="absolute bottom-2 right-1/2 translate-x-8"
                    />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {user.username}
                    </h2>
                    <Chip
                      color="success"
                      variant="flat"
                      startContent={<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                      className="font-medium"
                    >
                      Activo
                    </Chip>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Miembro desde:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatUTCtoHermosilloSoloFecha(user.fecha_creacion)}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    startContent={<HiUser />}
                  >
                    Editar Perfil
                  </Button>
                </CardBody>
              </Card>
            </div>

            {/* Info principal */}
            <div className="lg:col-span-2 space-y-6">

              {/* Mi cuenta */}
              <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <HiUser className="text-blue-600 dark:text-blue-400 text-lg" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Información de Cuenta
                    </h3>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Nombre Completo
                      </label>
                      <Input
                        value={user.nombre}
                        isReadOnly
                        variant="flat"
                        className="bg-gray-50 dark:bg-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Nombre de Usuario
                      </label>
                      <Input
                        value={user.username}
                        isReadOnly
                        variant="flat"
                        className="bg-gray-50 dark:bg-gray-700"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Correo Electrónico
                      </label>
                      <Input
                        value={user.correo}
                        isReadOnly
                        variant="flat"
                        startContent={<HiMail className="text-gray-400" />}
                        className="bg-gray-50 dark:bg-gray-700"
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Rol */}
              <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <HiShieldCheck className="text-purple-600 dark:text-purple-400 text-lg" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Roles y Permisos
                    </h3>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <Chip
                    color="success"
                    variant="flat"
                    size="lg"
                    startContent={<HiShieldCheck />}
                    className="font-medium"
                  >
                    {user.rol}
                  </Chip>
                </CardBody>
              </Card>

              {/* Cambiar contraseña */}
              <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <HiKey className="text-orange-600 dark:text-orange-400 text-lg" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Seguridad de Cuenta
                    </h3>
                  </div>
                </CardHeader>
                <CardBody className="pt-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="password"
                      label="Contraseña actual"
                      variant="bordered"
                      placeholder="Ingresa tu contraseña actual"
                      startContent={<HiKey className="text-gray-400" />}
                    />
                    <Input
                      type="password"
                      label="Nueva contraseña"
                      variant="bordered"
                      placeholder="Ingresa tu nueva contraseña"
                      startContent={<HiKey className="text-gray-400" />}
                    />
                  </div>
                  <Input
                    type="password"
                    label="Confirmar nueva contraseña"
                    variant="bordered"
                    placeholder="Confirma tu nueva contraseña"
                    startContent={<HiKey className="text-gray-400" />}
                  />
                  <Button
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    startContent={<HiKey />}
                  >
                    Actualizar Contraseña
                  </Button>
                </CardBody>
              </Card>

              {/* Administrar sesiones */}
              <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <HiDesktopComputer className="text-green-600 dark:text-green-400 text-lg" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Sesiones Activas
                    </h3>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  {sesiones.length > 0 ? (
                    <div className="space-y-4">
                      {sesiones.map((sesion, i) => (
                        <Card key={i} className="bg-gray-50 dark:bg-gray-700/50 border-0 shadow-sm">
                          <CardBody className="p-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                  <HiDesktopComputer className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {sesion.dispositivo}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <HiClock className="text-xs" />
                                    {formatUTCtoHermosilloHora(sesion.fecha_inicio)}
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                color="danger"
                                variant="flat"
                                className="font-medium"
                              >
                                Cerrar Sesión
                              </Button>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-700 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <HiDesktopComputer className="text-gray-400 text-2xl" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        No hay sesiones activas
                      </p>
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

