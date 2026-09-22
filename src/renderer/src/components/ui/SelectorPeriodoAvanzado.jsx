import React, { useMemo, useState, useEffect, useRef } from "react";
import { Button, Chip, Tooltip } from "@heroui/react";
import {
  HiCalendar,
  HiChevronLeft,
  HiChevronRight,
  HiChevronDown,
  HiCheck,
  HiSparkles,
  HiOutlineClock
} from "react-icons/hi";
import {
  generarCatalogoPeriodos,
  formatearPeriodo,
  obtenerPeriodoActual,
} from "../../utils/periodoUtils";

const MESES = [
  { num: "01", corto: "Ene", nombre: "Enero" },
  { num: "02", corto: "Feb", nombre: "Febrero" },
  { num: "03", corto: "Mar", nombre: "Marzo" },
  { num: "04", corto: "Abr", nombre: "Abril" },
  { num: "05", corto: "May", nombre: "Mayo" },
  { num: "06", corto: "Jun", nombre: "Junio" },
  { num: "07", corto: "Jul", nombre: "Julio" },
  { num: "08", corto: "Ago", nombre: "Agosto" },
  { num: "09", corto: "Sep", nombre: "Septiembre" },
  { num: "10", corto: "Oct", nombre: "Octubre" },
  { num: "11", corto: "Nov", nombre: "Noviembre" },
  { num: "12", corto: "Dic", nombre: "Diciembre" }
];

const SelectorPeriodoAvanzado = ({
  value,
  onChange,
  label = "Período",
  placeholder = "Seleccionar período",
  startYear = 2020,
  isDisabled = false,
  className = "w-full h-full",
  periodosInfo = {},
  siguientePeriodo = null,
  ultimoPeriodoRegistrado = null
}) => {
  const currentActual = obtenerPeriodoActual();
  const currentActualYear = currentActual.split("-")[0];
  const [isOpen, setIsOpen] = useState(false);
  const [yearFilter, setYearFilter] = useState(() => {
    if (value) return value.split("-")[0] || currentActualYear;
    return currentActualYear;
  });
  const containerRef = useRef(null);

  // Mantiene el filtro de año sincronizado cuando el valor controlado cambia desde afuera
  useEffect(() => {
    if (value) {
      const yr = value.split("-")[0];
      if (yr) setYearFilter(yr);
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const periodos = useMemo(() => generarCatalogoPeriodos({ startYear }), [startYear]);

  const years = useMemo(() => {
    const setYears = new Set(periodos.map((p) => p.year));
    setYears.add(currentActualYear);
    return Array.from(setYears).sort((a, b) => Number(b) - Number(a));
  }, [periodos, currentActualYear]);

  const minYear = useMemo(() => Math.min(...years.map(Number)), [years]);
  const maxYear = useMemo(() => Math.max(...years.map(Number)), [years]);

  const currentIndex = periodos.findIndex((p) => p.value === value);
  const periodoAnterior = currentIndex >= 0 ? periodos[currentIndex + 1]?.value : null;
  const periodoSiguiente = currentIndex > 0 ? periodos[currentIndex - 1]?.value : null;
  const periodoActualLabel = formatearPeriodo(value) || placeholder;

  const infoActual = periodosInfo[value];
  const esSiguiente = siguientePeriodo && value === siguientePeriodo;
  const esCompletado = infoActual?.completado || infoActual?.estado === 'completado';
  const esParcial = infoActual?.estado === 'parcial' || (!esCompletado && Number(infoActual?.totalLecturas || 0) > 0);
  const tieneFacturasActual = infoActual?.tieneFacturas;

  const handleNavegar = (nuevoPeriodo) => {
    if (!nuevoPeriodo) return;
    onChange(nuevoPeriodo);
    const yr = nuevoPeriodo.split("-")[0];
    if (yr && yr !== yearFilter) setYearFilter(yr);
  };

  const handleSelectMes = (mesNum) => {
    const nuevoPeriodo = `${yearFilter}-${mesNum}`;
    onChange(nuevoPeriodo);
    setIsOpen(false);
  };

  const cambiarAno = (delta) => {
    const nuevoAno = String(Number(yearFilter) + delta);
    if (Number(nuevoAno) >= minYear && Number(nuevoAno) <= maxYear) {
      setYearFilter(nuevoAno);
    }
  };

  const handleIrMesActual = () => {
    onChange(currentActual);
    setYearFilter(currentActualYear);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${isOpen ? 'z-[999]' : 'z-20'} ${className}`} ref={containerRef}>
      {/* Botón Disparador Principal */}
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        className={`w-full h-full flex items-center justify-between px-4 bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-none ${
          isDisabled 
            ? "opacity-50 cursor-not-allowed" 
            : "hover:border-slate-300 dark:hover:border-zinc-700 cursor-pointer"
        } ${isOpen ? "border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/10" : ""}`}
      >
        <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1 mr-2">
          <HiCalendar className={`shrink-0 text-lg transition-colors ${isOpen ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-zinc-500"}`} />
          <span className={`truncate text-sm tracking-tight ${value ? "font-bold text-slate-800 dark:text-zinc-100" : "font-medium text-slate-500 dark:text-zinc-400"}`}>
            {periodoActualLabel}
          </span>
          {esSiguiente && (
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-500/20 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Siguiente
            </span>
          )}
          {tieneFacturasActual && !esSiguiente && (
            infoActual?.vencida ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-500/25 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Facturado (Vencido)
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/20 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Facturado (Vigente)
              </span>
            )
          )}
          {esCompletado && !tieneFacturasActual && !esSiguiente && (
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/20 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Completado
            </span>
          )}
          {esParcial && !tieneFacturasActual && !esSiguiente && (
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-500/20 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              En Progreso
            </span>
          )}
        </div>

        <div className="flex items-center shrink-0">
          <HiChevronDown
            className={`text-slate-400 dark:text-zinc-500 shrink-0 transition-transform duration-300 text-base ${isOpen ? "rotate-180 text-blue-500" : ""}`}
          />
        </div>
      </button>

      {/* Popover Dropdown Panel Visual (Cuadrícula 12 Meses) */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-[999] w-[360px] sm:w-[390px] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header del Popover con Navegación y Selector Directo de Año */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/50">
            <button
              type="button"
              onClick={() => cambiarAno(-1)}
              disabled={Number(yearFilter) <= minYear}
              className="p-1.5 rounded-xl hover:bg-slate-200/70 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Año anterior"
            >
              <HiChevronLeft className="w-5 h-5" />
            </button>

            {/* Selector Rápido de Año */}
            <div className="flex items-center gap-2">
              <div className="relative flex items-center group">
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="appearance-none bg-slate-200/50 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 font-black text-sm pl-3 pr-7 py-1.5 rounded-xl cursor-pointer border border-slate-300/60 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all text-center shadow-none"
                  aria-label="Seleccionar año"
                >
                  {years.map((y) => (
                    <option key={y} value={y} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-bold py-1">
                      {y} {y === currentActualYear ? "• Actual" : ""}
                    </option>
                  ))}
                </select>
                <HiChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 absolute right-2 pointer-events-none group-hover:text-blue-500 transition-colors" />
              </div>

              {yearFilter === currentActualYear && (
                <span className="hidden sm:inline-flex bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md border border-blue-500/20">
                  Actual
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => cambiarAno(1)}
              disabled={Number(yearFilter) >= maxYear}
              className="p-1.5 rounded-xl hover:bg-slate-200/70 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Año siguiente"
            >
              <HiChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Cuadrícula Visual de los 12 Meses */}
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {MESES.map((m) => {
                const periodoKey = `${yearFilter}-${m.num}`;
                const isSelected = value === periodoKey;
                const isCurrentMonth = periodoKey === currentActual;
                const infoMes = periodosInfo[periodoKey];
                const isSig = siguientePeriodo && periodoKey === siguientePeriodo;
                const hasFacturas = infoMes?.tieneFacturas;
                const isVencido = infoMes?.vencida;
                const isComp = infoMes?.completado || infoMes?.estado === 'completado';
                const isParc = infoMes?.estado === 'parcial' || (!isComp && Number(infoMes?.totalLecturas || 0) > 0);

                return (
                  <button
                    key={m.num}
                    type="button"
                    onClick={() => handleSelectMes(m.num)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-150 relative cursor-pointer group ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                        : isCurrentMonth
                          ? "bg-blue-500/5 dark:bg-blue-500/10 border-blue-300 dark:border-blue-900/50 hover:bg-blue-500/10"
                          : "bg-slate-50/50 dark:bg-zinc-900/40 border-slate-200/80 dark:border-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    {/* Nombre del mes */}
                    <span className={`text-sm font-black tracking-tight ${
                      isSelected
                        ? "text-white"
                        : "text-slate-800 dark:text-zinc-200"
                    }`}>
                      {m.corto}
                    </span>

                    {/* Estado descriptivo del mes */}
                    <div className="mt-1 flex items-center justify-center gap-1 min-h-[16px]">
                      {isSig ? (
                        <span className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                          isSelected ? "text-blue-100" : "text-blue-600 dark:text-blue-400"
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          Próximo
                        </span>
                      ) : hasFacturas ? (
                        <span className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                          isSelected 
                            ? "text-emerald-100" 
                            : isVencido 
                              ? "text-amber-600 dark:text-amber-400" 
                              : "text-emerald-600 dark:text-emerald-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? "bg-white" : isVencido ? "bg-amber-500" : "bg-emerald-500"
                          }`} />
                          {isVencido ? "Vencido" : "Facturas"}
                        </span>
                      ) : isComp ? (
                        <span className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                          isSelected ? "text-emerald-100" : "text-emerald-600 dark:text-emerald-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-emerald-500"}`} />
                          Listo
                        </span>
                      ) : isParc ? (
                        <span className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                          isSelected ? "text-amber-100" : "text-amber-600 dark:text-amber-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSelected ? "bg-white" : "bg-amber-500"}`} />
                          En curso
                        </span>
                      ) : isCurrentMonth ? (
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${
                          isSelected ? "text-blue-100" : "text-slate-400 dark:text-zinc-500"
                        }`}>
                          Mes en curso
                        </span>
                      ) : (
                        <span className={`text-[9px] font-medium ${
                          isSelected ? "text-white/70" : "text-slate-400 dark:text-zinc-500"
                        }`}>
                          {m.nombre}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Acciones de Navegación Rápida */}
            <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800/80 mt-4">
              <Button
                variant="ghost"
                onPress={() => handleNavegar(periodoAnterior)}
                isDisabled={isDisabled || !periodoAnterior}
                className="flex-1 font-bold text-xs bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl h-9"
              >
                <HiChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              
              <Button
                variant="flat"
                color="primary"
                onPress={handleIrMesActual}
                className="font-bold text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 rounded-xl h-9 px-3"
              >
                Mes Actual
              </Button>

              <Button
                variant="ghost"
                onPress={() => handleNavegar(periodoSiguiente)}
                isDisabled={isDisabled || !periodoSiguiente}
                className="flex-1 font-bold text-xs bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl h-9"
              >
                Siguiente
                <HiChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Leyenda Compacta */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800/60 text-[10px] font-bold text-slate-400 dark:text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Próximo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Facturado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> En curso / Vencido
              </span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default SelectorPeriodoAvanzado;
