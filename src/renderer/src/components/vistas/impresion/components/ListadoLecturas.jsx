import React, { useState } from "react";
import { Card, CardBody, CardHeader, Chip, Spinner } from "@nextui-org/react";
import { HiUsers, HiSearch, HiLocationMarker, HiX } from "react-icons/hi";
import { IoWaterOutline } from "react-icons/io5";
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
        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-col h-full min-h-[600px]">
            
            {/* ── HEADER: Título, Filtros y Conteo ── */}
            <CardHeader className="flex flex-col gap-5 pt-6 px-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">

                {/* Fila 1: Título y Conteo */}
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl">
                            <HiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                                Padrón General
                            </h3>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                                Base de datos de lecturas
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <Chip size="sm" variant="flat" color="primary" className="font-bold text-[10px] uppercase tracking-wider px-1">
                            {filtrados.length} Registros
                        </Chip>
                    </div>
                </div>

                {/* Fila 2: Inputs de Búsqueda y Periodo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    
                    {/* Buscador */}
                    <div className="md:col-span-2 relative w-full flex items-center">
                        <span className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                            <HiSearch className="w-5 h-5" />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar usuario, medidor o localidad..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 bg-slate-50 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 shadow-sm"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                                title="Limpiar búsqueda"
                            >
                                <HiX className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Selector de Periodo */}
                    <SelectorPeriodoAvanzado
                        value={periodo}
                        onChange={setPeriodo}
                        label="Período"
                        placeholder="Seleccionar período"
                        startYear={2020}
                        size="sm"
                        isDisabled={loading}
                        className="w-full h-11"
                    />
                </div>
            </CardHeader>

            {/* ── BODY: Lista de Tarjetas ── */}
            <CardBody className="p-4 bg-slate-50/30 dark:bg-black/10">
                <div className="max-h-[500px] overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
                    
                    {/* Estado de Carga */}
                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-40 gap-4">
                            <Spinner size="md" color="primary" />
                            <p className="text-sm font-bold text-slate-500 dark:text-zinc-400 animate-pulse">Cargando padrón...</p>
                        </div>
                    ) : 
                    
                    /* Estado Vacío */
                    filtrados.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                                <HiUsers className="text-3xl text-slate-400 dark:text-zinc-500" />
                            </div>
                            <p className="text-sm font-bold text-slate-600 dark:text-zinc-300">
                                No hay registros para este periodo
                            </p>
                            <p className="text-xs font-medium text-slate-500 mt-1">
                                Intenta seleccionar un mes diferente o limpia tu búsqueda.
                            </p>
                        </div>
                    ) : (

                        /* Lista de Elementos */
                        filtrados.map((item, idx) => {
                            const lecturaAteriorValor = typeof item.lectura_anterior === 'object' ? (item.lectura_anterior?.valor ?? 0) : (item.lectura_anterior ?? 0);
                            
                            return (
                                <div
                                    key={idx}
                                    className="w-full transition-all duration-200 rounded-xl border p-3.5 border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-blue-300 dark:hover:border-zinc-600 hover:shadow-sm"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        
                                        {/* Left: Info Principal */}
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            {/* Marcador Visual Vertical */}
                                            <div className="w-1 h-10 bg-blue-500 rounded-full shrink-0"></div>

                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-slate-800 dark:text-zinc-100 mb-0.5 truncate">
                                                    {item.cliente || item.nombre}
                                                </p>
                                                
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                                                    {item._localidad && (
                                                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                                                            <HiLocationMarker className="shrink-0 text-blue-500" /> 
                                                            <span className="truncate max-w-[120px]">{item._localidad}</span>
                                                        </span>
                                                    )}
                                                    
                                                    <span className="flex items-center gap-1 shrink-0">
                                                        <span className="text-slate-400 dark:text-zinc-500">Medidor:</span> 
                                                        <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">
                                                            {item.medidor?.serie || item.medidor || "S/N"}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Lectura Anterior */}
                                        <div className="text-right flex flex-col items-end gap-1 shrink-0">
                                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-widest">
                                                Lec. Anterior
                                            </span>
                                            <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg text-blue-700 dark:text-blue-400 font-mono font-bold text-sm">
                                                <IoWaterOutline className="text-blue-500" />
                                                {lecturaAteriorValor}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardBody>
        </Card>
    );
};

export default ListadoLecturas;