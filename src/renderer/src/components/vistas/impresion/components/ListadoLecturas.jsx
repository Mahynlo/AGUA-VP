import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/react";
import { HiUsers, HiSearch, HiLocationMarker } from "react-icons/hi";
import SelectorPeriodoAvanzado from "../../../ui/SelectorPeriodoAvanzado";

/**
 * Componente para listar lecturas (Solo lectura)
 * Muestra los datos que se usarán en el reporte
 */
const ListadoLecturas = ({
    lecturas, // Array de grupos o plano
    periodo,
    setPeriodo,
    loading
}) => {
    const [searchTerm, setSearchTerm] = useState("");

    // Aplanar datos para búsqueda si vienen agrupados
    const itemsPlanos = React.useMemo(() => {
        if (!lecturas) return [];
        // Si ya viene plano
        if (lecturas.length > 0 && (lecturas[0].cliente || lecturas[0].nombre)) return lecturas;

        // Si viene agrupado por localidad
        if (lecturas.length > 0 && lecturas[0].localidad) {
            return lecturas.flatMap(g => g.clientes.map(c => ({
                ...c,
                _localidad: g.localidad
            })));
        }
        return [];
    }, [lecturas]);

    const filtrados = itemsPlanos.filter(item => {
        const term = searchTerm.toLowerCase();
        const cliente = (item.cliente || item.nombre || "").toLowerCase();
        const medidor = (item.medidor?.serie || item.medidor || "").toLowerCase();
        const loc = (item._localidad || "").toLowerCase();
        return cliente.includes(term) || medidor.includes(term) || loc.includes(term);
    });

    return (
        <Card className="shadow-md border border-gray-200 dark:border-gray-700 h-full">
            <CardHeader className="flex flex-col gap-4 p-4 bg-gray-50 dark:bg-gray-800/50">

                {/* Title and Count */}
                <div className="flex justify-between items-center w-full">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <HiUsers className="text-blue-500" />
                        Padrón General
                    </h3>
                    <div className="flex gap-2 items-center">
                        <span className="text-sm font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                            {filtrados.length} Registros
                        </span>
                    </div>
                </div>

                {/* Filters Input Grid matches ClientesList */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    {/* Buscador Styles */}
                    <div className="md:col-span-2 relative w-full flex">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 z-10">
                            <HiSearch className="w-5 h-5 inline-block" />
                        </span>
                        <input
                            placeholder="Buscar usuario, medidor o localidad..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-gray-300 text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-all duration-200 h-10"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <SelectorPeriodoAvanzado
                        value={periodo}
                        onChange={setPeriodo}
                        label="Período"
                        placeholder="Buscar y seleccionar período"
                        startYear={2020}
                        size="sm"
                        className="w-full"
                    />
                </div>
            </CardHeader>

            <CardBody className="pt-0 px-2 pb-2 bg-white dark:bg-gray-900">
                <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-purple-200 mt-2">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : filtrados.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <p>No hay registros para este periodo</p>
                        </div>
                    ) : (
                        filtrados.map((item, idx) => (
                            <Card
                                key={idx}
                                className="border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-md transition-all duration-200 group"
                                shadow="none"
                            >
                                <CardBody className="py-3 px-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {/* Marcador Visual (Left Border equivalent) */}
                                            <div className="w-1 h-10 bg-blue-500 rounded-full"></div>

                                            <div className="flex-1">
                                                <p className="font-bold text-base text-gray-900 dark:text-white mb-0.5">
                                                    {item.cliente || item.nombre}
                                                </p>
                                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                                    {item._localidad && (
                                                        <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md text-xs">
                                                            <HiLocationMarker className="text-blue-500" /> {item._localidad}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        Medidor: <span className="font-mono text-gray-800 dark:text-gray-300">{item.medidor?.serie || item.medidor || "S/N"}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right flex flex-col items-end gap-1">
                                            <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Lectura Anterior</span>
                                            <div className="flex items-center gap-2 bg-blue-50 px-2 py-1 rounded text-blue-700 font-mono font-bold">
                                                {typeof item.lectura_anterior === 'object' ? (item.lectura_anterior?.valor ?? 0) : (item.lectura_anterior ?? 0)}
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))
                    )}
                </div>
            </CardBody>
        </Card>
    );
};

export default ListadoLecturas;
