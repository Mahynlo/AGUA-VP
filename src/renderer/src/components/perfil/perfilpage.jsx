import { Avatar } from "@nextui-org/avatar";
import { Chip } from "@nextui-org/chip";
import AvatarPerfil from "../../assets/images/Avatar.png";
import { useAuth } from "../../context/AuthContext";
import {formatUTCtoHermosillo,formatUTCtoHermosilloSoloFecha,formatUTCtoHermosilloHora} from "../../utils/formatFecha";
export default function PerfilPage() {
  const { user, sesiones } = useAuth();

  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-6 h-full">

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Perfil</h1>
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-14rem)] pr-1 mt-2">
          <div className="flex flex-col md:flex-row gap-6 overflow-hidden">

            {/* Perfil resumen */}
            <div className="md:w-1/3">
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl shadow text-center space-y-4">
                <Avatar src={AvatarPerfil} className="w-24 h-24 mx-auto" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user.username}</h2>
                <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-200">
                  <li className="flex justify-between">
                    <span>Estatus:</span>
                    <Chip color="success" className="text-white">Activo</Chip>
                  </li>
                  <li className="flex justify-between">
                    <span>Creación:</span>
                    <span>
                      <span>{formatUTCtoHermosillo(user.fecha_creacion)}</span>
                    </span>
                  </li>

                </ul>
                <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg shadow">
                  Editar Perfil
                </button>
              </div>
            </div>

            {/* Info principal */}
            <div className="md:w-2/3 space-y-6">
              {/* Mi cuenta */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 shadow space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  👤 Mi cuenta
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-200">
                  <div className="font-semibold">Nombre completo:</div>
                  <div>{user.nombre}</div>
                  <div className="font-semibold">Nombre Usuario:</div>
                  <div>{user.username}</div>
                  <div className="font-semibold">Correo electrónico:</div>
                  <div>
                    <a href={`mailto:${user.correo}`} className="text-blue-700 dark:text-blue-400 underline">
                      {user.correo}
                    </a>
                  </div>

                </div>
              </div>

              {/* Rol */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  🛡️ Roles
                </h3>
                <Chip color="success" variant="dot">{user.rol}</Chip>
              </div>

              {/* Cambiar contraseña */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 shadow space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  🔐 Cambiar contraseña
                </h3>
                <div className="grid gap-4 md:grid-cols-2 text-sm text-gray-700 dark:text-gray-200">
                  <div className="flex flex-col">
                    <label htmlFor="current" className="mb-1">Contraseña actual</label>
                    <input type="password" id="current" className="rounded-md p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="new" className="mb-1">Nueva contraseña</label>
                    <input type="password" id="new" className="rounded-md p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="flex flex-col md:col-span-2">
                    <label htmlFor="confirm" className="mb-1">Confirmar nueva contraseña</label>
                    <input type="password" id="confirm" className="rounded-md p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600" />
                  </div>
                </div>
                <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  Guardar cambios
                </button>
              </div>

              {/* Administrar sesiones */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 shadow space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  🧩 Administrar sesiones
                </h3>
                {sesiones.length > 0 ? (
                  <ul className="space-y-3">
                    {sesiones.map((sesion, i) => (
                      <li key={i} className="flex justify-between items-center text-sm text-gray-700 dark:text-gray-200">
                        <div>
                          <div className="font-medium text-teal-600 dark:text-teal-300">🖥️ {sesion.dispositivo}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {formatUTCtoHermosilloHora(sesion.fecha_inicio)}
                          </div>

                      

                        </div>
                        <button className="text-red-500 hover:underline text-xs">
                          Cerrar sesión
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-300">No hay sesiones activas.</p>
                )}
              </div>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

