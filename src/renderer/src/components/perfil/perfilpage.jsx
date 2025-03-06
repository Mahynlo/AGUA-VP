import { Chip } from "@nextui-org/chip";
import { Avatar } from "@nextui-org/avatar";
import AvatarPerfil from '../../assets/images/Avatar.png'
import { useAuth } from "../../context/AuthContext";
function PerfilPage() {
    const { user } = useAuth();
    return (

        <div className="p-4 sm:ml-64 pt-20 dark:bg-gray-900  min-h-screen">

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Perfil</h1>
            <div className="md:flex no-wrap md:-mx-2 dark:bg-gray-900 mt-4">

                <div className="w-full md:w-3/12 md:mx-2">

                    <div className="bg-gray-100 p-3 border-t-4 border-green-400 dark:bg-gray-800 rounded-lg">
                        <div className="image overflow-hidden">
                            <Avatar
                                className="w-20 h-20 text-large"
                                src={AvatarPerfil}
                            />
                        </div>
                        <h1 className="text-gray-900 font-bold text-xl leading-8 my-1 dark:text-white">Bonnie Green</h1>
                        
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
                    </div>


                </div>
                <div className="w-full md:w-9/12 mx-2 h-64 ">

                    <div className="bg-gray-100 p-3 shadow-sm  dark:bg-gray-800 rounded-lg">
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
                            <div className="grid md:grid-cols-2 text-sm">
                                <div className="grid grid-cols-2">
                                    <div className="px-4 py-2 font-semibold">Nombres:</div>
                                    <div className="px-4 py-2">Jane</div>
                                </div>
                                <div className="grid grid-cols-2">
                                    <div className="px-4 py-2 font-semibold">Apellidos:</div>
                                    <div className="px-4 py-2">Doe</div>
                                </div>
                            

                                <div className="grid grid-cols-2">
                                    <div className="px-4 py-2 font-semibold">Correo electronico:</div>
                                    <div className="px-4 py-2">
                                        <a className="text-blue-800 dark:text-blue-300" href="mailto:jane@example.com">{user.correo}</a>
                                    </div>
                                </div>
                               
                            </div>
                        </div>

                    </div>




                    <div className="bg-gray-100 p-3 shadow-sm rounded-lg dark:bg-gray-800 mt-4">

                        <div className="grid grid-cols-2 dark:bg-gray-800 ">
                            <div>
                                <div className="flex items-center space-x-2 font-semibold text-gray-900 leading-8 mb-3 dark:text-white">
                                    <span className="text-green-500">
                                        <svg className="h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </span>
                                    <span className="tracking-wide">Inicios de secion</span>
                                </div>
                                <ul className="list-inside space-y-2">
                                    <li>
                                        <div className="text-teal-600 dark:text-teal-300">Inicio de Seccion</div>
                                        <div className="text-gray-500 text-xs dark:text-white">March 2020 - Now</div>
                                    </li>
                                    <li>
                                        <div className="text-teal-600 dark:text-teal-300">Inicio de Seccion</div>
                                        <div className="text-gray-500 text-xs dark:text-white">March 2020 - Now</div>
                                    </li>
                                    <li>
                                        <div className="text-teal-600 dark:text-teal-300">Inicio de Seccion</div>
                                        <div className="text-gray-500 text-xs dark:text-white">March 2020 - Now</div>
                                    </li>
                                    <li>
                                        <div className="text-teal-600 dark:text-teal-300">Inicio de Seccion</div>
                                        <div className="text-gray-500 text-xs dark:text-white">March 2020 - Now</div>
                                    </li>
                                </ul>
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

    );
}

export default PerfilPage;