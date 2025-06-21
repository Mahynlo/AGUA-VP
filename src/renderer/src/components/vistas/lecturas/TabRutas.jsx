import { Link, useNavigate } from "react-router-dom";
import { Button } from "flowbite-react";
import { FlechaReturnIcon } from "../../../IconsApp/IconsAppSystem";
import CarruselLecturasModal from "./CarruselLecturasModal";
const TabRutas = () => {
    const navigate = useNavigate(); // Hook de navegación
    return (
        <div className="tab-rutas">


            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Rutas</h1>
                <Button color="gray" className="mb-6" onClick={() => navigate(-1)}>
                    <FlechaReturnIcon className="w-6 h-6" />
                    <span className="ml-2">Volver</span>
                </Button>
            </div>

            {/* cards de rutas*/}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-transform hover:scale-[1.01]">
                    {/* Imagen */}
                    <div className="h-48 overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?auto=format&fit=crop&w=1470&q=80"
                            alt="Ruta 1"
                            className="object-cover w-full h-full"
                        />
                    </div>

                    {/* Contenido */}
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                                Ruta número 1
                            </h2>
                            <div className="flex items-center gap-1 text-yellow-500">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    className="w-5 h-5"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10.788 3.21c.448-1.077 1.976-1.077 
                                        2.424 0l2.082 5.007 5.404.433c1.164.093 
                                        1.636 1.545.749 2.305l-4.117 3.527 
                                        1.257 5.273c.271 1.136-.964 
                                        2.033-1.96 1.425L12 18.354 
                                        7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273
                                        -4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 
                                        2.082-5.006z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    5.0
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                            Este es un ejemplo de una ruta que puedes reservar para realizar lecturas de medidores. Puedes ver más detalles y reservarla si lo deseas.
                        </p>
                        <button
                            className="w-full bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
                            type="button"
                        >
                            Ver Detalles
                        </button>
                        <button
                            className="w-full mt-2 bg-green-700 hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors"
                            type="button"
                        >
                            Editar Ruta
                        </button>
                        <div className='mt-4'>
                            <CarruselLecturasModal />
                        </div>
                        

                    </div>
                </div>
                
            </div>


        </div>
    );
}


export default TabRutas;