import React, { useState } from "react";
import { Card, CardBody, CardHeader, Chip, Spinner } from "@nextui-org/react";
import { HiUsers, HiSearch, HiLocationMarker, HiX } from "react-icons/hi";
import { IoWaterOutline } from "react-icons/io5";
import SelectorPeriodoAvanzado from "../../../ui/SelectorPeriodoAvanzado";
import { normalizarTexto } from "../../../../utils/textUtils";
import { useRutas } from "../../../../context/RutasContext";

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
    const { periodosInfo, siguientePeriodo, ultimoPeriodoRegistrado } = useRutas();
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
        const term = normalizarTexto(searchTerm);
        const cliente = normalizarTexto(item.cliente || item.nombre);
        const medidor = normalizarTexto(item.medidor?.serie || item.medidor);
        const loc = normalizarTexto(item._localidad);
        const predio = normalizarTexto(item.numero_predio || "");
        return cliente.includes(term) || medidor.includes(term) || loc.includes(term) || predio.includes(term);
    });

    return (
        <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-sm flex flex-col h-full min-h-[600px]">
            
            {/* ── HEADER: Título, Filtros y Conteo ── */}
            <CardHeader className="flex flex-col gap-5 pt-6 px-6 pb-5 border-b border-slate-100 dark:border-zinc-800/80">

                {/* Fila 1: Título y Conteo */}
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl">
                            <HiUsers className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                                Padrón de Lecturas
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                                Base de datos para toma y cobro
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <Chip size="sm" variant="flat" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono font-black text-xs px-2 h-7 rounded-lg">
                            {filtrados.length} Registros
                        </Chip>
                    </div>
                </div>

                {/* Fila 2: Selector de Período */}
                <div className="w-full flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 ml-1">
                        Ciclo / Período del Reporte
                    </label>
                    <div className="w-full h-12">
                        <SelectorPeriodoAvanzado
                            value={periodo}
                            onChange={setPeriodo}
                            placeholder="Seleccionar período"
                            startYear={2020}
                            isDisabled={loading}
                            className="w-full h-full"
                            periodosInfo={periodosInfo}
                            siguientePeriodo={siguientePeriodo}
                            ultimoPeriodoRegistrado={ultimoPeriodoRegistrado}
                        />
                    </div>
                </div>

                {/* Fila 3: Buscador */}
                <div className="w-full flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 ml-1">
                        Buscar Registro
                    </label>
                    <div className="relative w-full flex items-center">
                        <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                            <HiSearch className="w-5 h-5" />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar usuario, medidor, predio o localidad..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-11 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-none h-[52px] transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors p-1"
                                title="Limpiar búsqueda"
                            >
                                <HiX className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </CardHeader>

            {/* ── BODY: Lista de Tarjetas ── */}
            <CardBody className="p-4 bg-slate-50/40 dark:bg-black/20 flex-1">
                <div className="max-h-[500px] overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                    
                    {/* Estado de Carga */}
                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-40 gap-3">
                            <Spinner size="md" color="primary" />
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 animate-pulse">Cargando padrón...</p>
                        </div>
                    ) : 
                    
                    /* Estado Vacío */
                    filtrados.length === 0 ? (
                        <div className="text-center py-16 flex flex-col items-center justify-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center mb-3 text-slate-400 dark:text-zinc-500">
                                <HiUsers className="text-2xl" />
                            </div>
                            <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                                No hay registros para este período
                            </p>
                            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1 max-w-xs">
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
                                    className="w-full transition-all duration-200 rounded-2xl border p-4 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-sky-300 dark:hover:border-zinc-700 hover:shadow-sm"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        
                                        {/* Left: Info Principal */}
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            {/* Marcador Visual Vertical */}
                                            <div className="w-1 h-10 bg-sky-500 rounded-full shrink-0"></div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="font-bold text-sm text-slate-800 dark:text-zinc-100 truncate">
                                                        {item.cliente || item.nombre}
                                                    </p>
                                                    {item.numero_predio && (
                                                        <span className="font-mono font-bold text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 px-1.5 py-0.5 rounded shrink-0">
                                                            #{item.numero_predio}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                                                    {item._localidad && (
                                                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                                                            <HiLocationMarker className="shrink-0 text-sky-500" /> 
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
                                            <div className="flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-xl text-sky-700 dark:text-sky-400 font-mono font-bold text-sm">
                                                <IoWaterOutline className="text-sky-500" />
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