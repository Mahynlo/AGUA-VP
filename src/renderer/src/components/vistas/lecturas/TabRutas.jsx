import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "flowbite-react";
import { FlechaReturnIcon } from "../../../IconsApp/IconsAppSystem";
import { SearchIcon } from "../../../IconsApp/IconsSidebar";
import ModalRegistrarRuta from "../lecturas/RegistrarRuta";
import RutaCard from "./RutaCard";

import imagenNacori from "../../../assets/images/nacori_mapa_ruta1.png";
import imagenMatape from "../../../assets/images/Matape_mapa_ruta.png";
import imagenAdivino from "../../../assets/images/Adivino_mapa_ruta.png";

// Datos simulados
const rutasMock = [
    {
        id: 1,
        nombre: "Ruta Nácori Grande 1",
        descripcion: "Ruta por el pueblo de Nácori para realizar lecturas.",
        completadas: 7,
        total: 10,
        imagen: imagenNacori,
    },
    {
        id: 2,
        nombre: "Ruta Matapé",
        descripcion: "Visita varios puntos en la región de Matapé.",
        completadas: 8,
        total: 8,
        imagen: imagenMatape,
    },
    {
        id: 3,
        nombre: "Ruta Adivino",
        descripcion: "Recorrido rural por Adivino y sus alrededores.",
        completadas: 10,
        total: 10,
        imagen: imagenAdivino,
    },
    {
        id: 4,
        nombre: "Ruta Nácori Grande 2",
        descripcion: "Segunda ruta por Nácori para completar lecturas pendientes.",
        completadas: 3,
        total: 10,
        imagen: imagenNacori,
    },
    {
        id: 5,
        nombre: "Ruta Matapé Extensión",
        descripcion: "Extensión de la ruta Matapé para cubrir más áreas.",
        completadas: 5,
        total: 10,
        imagen: imagenMatape,
    },
    {
        id: 6,
        nombre: "Ruta Adivino Norte",
        descripcion: "Nueva ruta por el norte de Adivino.",
        completadas: 2,
        total: 10,
        imagen: imagenAdivino,
    },
    {
        id: 7,
        nombre: "Ruta Nácori Grande 3",
        descripcion: "Tercera ruta por Nácori para completar lecturas.",
        completadas: 0,
        total: 10,
        imagen: imagenNacori,
    },
    {
        id: 8,
        nombre: "Ruta Matapé Sur",
        descripcion: "Ruta por el sur de Matapé.",
        completadas: 4,
        total: 10,
        imagen: imagenMatape,
    },
    {
        id: 9,
        nombre: "Ruta Adivino Oeste",
        descripcion: "Ruta por el oeste de Adivino.",
        completadas: 6,
        total: 10,
        imagen: imagenAdivino,
    },
    {
        id: 10,
        nombre: "Ruta Nácori Grande 4",
        descripcion: "Cuarta ruta por Nácori para completar lecturas.",
        completadas: 1,
        total: 10,
        imagen: imagenNacori,
    },
    
   

];

export default function TabRutas() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [filtro, setFiltro] = useState("todos"); // todos | completas | incompletas
    const [paginaActual, setPaginaActual] = useState(1);
    const [rutasPorPagina, setRutasPorPagina] = useState(4);

    useEffect(() => {
        const calcularRutasPorPantalla = () => {
            const width = window.innerWidth;

            if (width < 640) {
                setRutasPorPagina(2); // sm: 1 col
            } else if (width < 1024) {
                setRutasPorPagina(4); // md: 2 col
            } else if (width < 1280) {
                setRutasPorPagina(6); // lg: 3 col
            } else {
                setRutasPorPagina(8); // xl: 4 col
            }
        };

        calcularRutasPorPantalla();
        window.addEventListener("resize", calcularRutasPorPantalla);

        return () => window.removeEventListener("resize", calcularRutasPorPantalla);
    }, []);


    // Filtro por nombre y estado
    const rutasFiltradas = rutasMock
        .filter((ruta) =>
            ruta.nombre.toLowerCase().includes(search.toLowerCase())
        )
        .filter((ruta) => {
            if (filtro === "completas") return ruta.completadas >= ruta.total;
            if (filtro === "incompletas") return ruta.completadas < ruta.total;
            return true;
        });

    // Paginación
    const totalPaginas = Math.ceil(rutasFiltradas.length / rutasPorPagina);
    const rutasPagina = rutasFiltradas.slice(
        (paginaActual - 1) * rutasPorPagina,
        paginaActual * rutasPorPagina
    );

    const cambiarPagina = (nuevaPagina) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
            setPaginaActual(nuevaPagina);
        }
    };

    return (
        <div className="tab-rutas ">
            {/* Título y botón volver */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Rutas de toma de lecturas
                </h1>
                <Button color="gray" onClick={() => navigate(-1)}>
                    <FlechaReturnIcon className="w-6 h-6" />
                    <span className="ml-2">Volver</span>
                </Button>
            </div>

            {/* Buscador y registrar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                <div className="relative w-full md:w-1/3">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                        <SearchIcon className="w-5 h-5" />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPaginaActual(1);
                        }}
                        className="pl-10 pr-10 py-2 w-full rounded-xl border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-neutral-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                        >
                            ✕
                        </button>
                    )}
                </div>


                {/* Filtro por estado */}
                <div className="mb-2 flex gap-2">

                    {["todos", "completas", "incompletas"].map((tipo) => (
                        <button
                            key={tipo}
                            onClick={() => {
                                setFiltro(tipo);
                                setPaginaActual(1);
                            }}
                            className={`px-4 py-1 rounded-lg border ${filtro === tipo
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 dark:bg-gray-700 dark:text-white"
                                }`}
                        >
                            {tipo === "todos"
                                ? "Todas"
                                : tipo === "completas"
                                    ? "Completadas"
                                    : "Incompletas"}
                        </button>
                    ))}
                </div>
                <ModalRegistrarRuta />
            </div>




            {/* Grid de rutas */}
            {/* Grid con scroll independiente */}
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-20rem)] pr-1 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {rutasPagina.map((ruta) => (
                        <RutaCard key={ruta.id} ruta={ruta} />
                    ))}
                </div>

                {/* Sin resultados */}
                {rutasFiltradas.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
                        No se encontraron rutas con ese criterio.
                    </p>
                )}

                {/* Paginación */}
                {totalPaginas > 1 && (
                    <div className="mt-6 flex justify-center items-center gap-4">
                        <button
                            onClick={() => cambiarPagina(paginaActual - 1)}
                            disabled={paginaActual === 1}
                            className="px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded disabled:opacity-50"
                        >
                            ← Anterior
                        </button>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            Página {paginaActual} de {totalPaginas}
                        </span>
                        <button
                            onClick={() => cambiarPagina(paginaActual + 1)}
                            disabled={paginaActual === totalPaginas}
                            className="px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded disabled:opacity-50"
                        >
                            Siguiente →
                        </button>
                    </div>
                )}
            </div>



        </div>
    );
}


