import { Chip } from "@nextui-org/chip";
import { Avatar } from "@nextui-org/avatar";
import AvatarPerfil from '../../assets/images/Avatar.png'
import { useAuth } from "../../context/AuthContext";
function PerfilPage() {
    const { user, sesiones } = useAuth();
    return (

        <div className="p-4 sm:ml-64 pt-20 dark:bg-gray-900  min-h-screen">
            <div className="w-full h-full bg-white overflow-x-hidden gap-4 p-4 rounded-lg shadow-md dark:bg-gray-800">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">Perfil</h1>
                <div className="md:flex no-wrap md:-mx-2 dark:bg-gray-800 mt-4">

                    <div className="w-full md:w-3/12 md:mx-2">

                        <div className="bg-gray-100 p-3 border-t-4 border-green-400 dark:bg-gray-700 rounded-lg">
                            <div className="image overflow-hidden flex justify-center">
                                <Avatar
                                    className="w-20 h-20 text-large"
                                    src={AvatarPerfil}
                                />
                            </div>
                            <h1 className="text-gray-900 font-bold text-3xl leading-8 my-1 dark:text-white text-center mt-3">{user.username}</h1>

                            <ul
                                className="bg-gray-200 text-gray-600 hover:text-gray-700 dark:bg-gray-700 dark:text-white hover:shadow py-2 px-3 mt-3 divide-y rounded shadow-sm">
                                <li className="flex items-center py-3">
                                    <span>Estatus</span>
                                    <span className="ml-auto"><Chip color="success" className="text-white">Activo</Chip></span>
                                </li>
                                <li className="flex items-center py-3">
                                    <span>Creacion de Cuenta</span>
                                    <span className="ml-auto">Nov 07, 2016</span>
                                </li>
                            </ul>
                            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 mt-4 rounded-md shadow-sm">Editar Perfil</button>
                        </div>


                    </div>
                    <div className="w-full md:w-9/12 mx-2 h-64 ">

                        <div className="bg-gray-100 p-3 shadow-sm  dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-2 font-semibold text-gray-900 leading-8 dark:text-white">
                                <span className="text-green-500">
                                    <svg className="h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </span>
                                <span className="tracking-wide">Mi Cuenta</span>
                            </div>
                            <div className="text-gray-700 dark:text-white">
                                <div className="text-sm">
                                    <div className="grid grid-cols-2">
                                        <div className="px-4 py-2 font-semibold">Nombre Usuario:</div>
                                        <div className="py-2">{
                                            user.username.charAt(0).toUpperCase() + user.username.slice(1)
                                        }</div>
                                    </div>
                                    <div className="grid grid-cols-2">

                                    </div>


                                    <div className="grid grid-cols-2">
                                        <div className="px-4 py-2 font-semibold">Correo electronico:</div>
                                        <div className="py-2">
                                            <a className="text-blue-800 dark:text-blue-300" href="mailto:jane@example.com">{user.correo}</a>
                                        </div>
                                    </div>

                                </div>
                            </div>

                        </div>




                        <div className="bg-gray-100 p-3 shadow-sm rounded-lg dark:bg-gray-700 mt-4">

                            <div className="grid grid-cols-2 dark:bg-gray-700 ">
                                <div>
                                    <div className="flex items-center space-x-2 font-semibold text-gray-900 leading-8 mb-3 dark:text-white">
                                        <span className="text-green-500">
                                            <svg className="h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </span>
                                        <span className="tracking-wide">Inicios de sesión</span>
                                    </div>
                                    {sesiones.length > 0 ? (
                                        <ul className="list-inside space-y-2">
                                            {sesiones.map((sesion, index) => (
                                                <li key={index}>
                                                    <div className="text-teal-600 dark:text-teal-300">🖥️{sesion.dispositivo}</div>
                                                    <div className="text-gray-500 text-xs pl-8  dark:text-white">

                                                        {new Date(sesion.fecha_inicio).toLocaleString("es-MX", {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                            second: "2-digit",
                                                            hour12: false,
                                                        })}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>

                                    ) :
                                        <div className="text-gray-500 text-xs dark:text-white">No hay inicios de sesión registrados.</div>
                                    }

                                </div>
                                <div>
                                    <div className="flex items-center space-x-2 font-semibold text-gray-900 leading-8 mb-3 dark:text-white">
                                        <span className="text-green-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
                                            </svg>

                                        </span>
                                        <span className="tracking-wide">Roles</span>
                                    </div>
                                    <ul className="list-inside space-y-2">
                                        <li>
                                            <Chip color="success" variant="dot">
                                                {user.rol}
                                            </Chip>
                                        </li>

                                    </ul>
                                </div>
                            </div>

                        </div>

                    </div>

                </div>
            </div>






        </div>

    );
}

export default PerfilPage;