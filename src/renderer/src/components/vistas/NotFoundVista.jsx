import { Link, useNavigate } from "react-router-dom";
import { Button } from "@nextui-org/react";
import { FlechaReturnIcon } from "../../IconsApp/IconsAppSystem";

const NotFoundVista = () => {
    const navigate = useNavigate();

    return (
        // Fondo global de la aplicación
        <div className="min-h-screen w-full bg-slate-50 dark:bg-black/20 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
            
            {/* Efectos decorativos de luz de fondo (Estilo SaaS Premium) */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Tarjeta Central */}
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-10 sm:p-16 lg:p-24 max-w-3xl w-full text-center relative z-10">
                
                {/* Número Gigante 404 */}
                <h1 className="text-8xl sm:text-9xl lg:text-[12rem]  font-black text-slate-300 dark:text-zinc-900 tracking-tighter leading-none mb-6 select-none">
                    404
                </h1>
                
                {/* Mensaje */}
                <div className="mb-10">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 dark:text-zinc-100 mb-4 tracking-tight">
                        Página no encontrada
                    </h2>
                    <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                        Lo sentimos, no pudimos encontrar la ruta que buscas. Es posible que el enlace sea incorrecto o la página haya sido movida.
                    </p>
                </div>

                {/* Botones de Acción con Jerarquía Visual */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    
                    {/* Botón Secundario (Regresar) */}
                    <Button
                        onClick={() => navigate(-1)}
                        variant="flat"
                        className="w-full sm:w-auto font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 h-12 px-6 transition-colors"
                        startContent={<FlechaReturnIcon className="w-5 h-5" />}
                    >
                        Regresar
                    </Button>
                    
                    {/* Botón Principal (Ir al Inicio) */}
                    <Button
                        as={Link}
                        to="/home"
                        color="primary"
                        className="w-full sm:w-auto font-bold shadow-lg shadow-blue-500/30 h-12 px-8"
                    >
                        Ir al Inicio
                    </Button>

                </div>
            </div>
        </div>
    );
};

export default NotFoundVista;
