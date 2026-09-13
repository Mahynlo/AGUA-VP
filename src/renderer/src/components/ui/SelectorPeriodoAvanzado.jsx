import React, { useMemo, useState, useEffect, useRef } from "react";
import { Button, Chip } from "@heroui/react";
import {
  HiCalendar,
  HiChevronLeft,
  HiChevronRight,
  HiChevronDown,
} from "react-icons/hi";
import {
  generarCatalogoPeriodos,
  formatearPeriodo,
  obtenerPeriodoActual,
} from "../../utils/periodoUtils";

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
  const currentYear = String(new Date().getFullYear());
  const [isOpen, setIsOpen] = useState(false);
  const [yearFilter, setYearFilter] = useState(currentYear);
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

  const years = useMemo(
    () => [...new Set(periodos.map((p) => p.year))],
    [periodos]
  );

  const periodosFiltrados = useMemo(
    () => periodos.filter((p) => p.year === yearFilter),
    [periodos, yearFilter]
  );

  const currentIndex = periodos.findIndex((p) => p.value === value);
  const periodoAnterior = currentIndex >= 0 ? periodos[currentIndex + 1]?.value : null;
  const periodoSiguiente = currentIndex > 0 ? periodos[currentIndex - 1]?.value : null;
  const periodoActualLabel = formatearPeriodo(value) || placeholder;
  const esPeriodoActual = value === obtenerPeriodoActual();

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

  return (
    <div className={`relative ${className}`} ref={containerRef}>
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

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-[350px] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header del Popover */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <HiCalendar className="text-blue-600 dark:text-blue-400 w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                {label}
              </p>
            </div>
            {esSiguiente ? (
              <Chip size="sm" className="bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-[9px] uppercase tracking-widest px-2 h-5 border border-blue-500/20">
                Siguiente Período
              </Chip>
            ) : tieneFacturasActual ? (
              infoActual?.vencida ? (
                <Chip size="sm" className="bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-[9px] uppercase tracking-widest px-2 h-5 border border-amber-500/25">
                  Facturas (Vencidas)
                </Chip>
              ) : (
                <Chip size="sm" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] uppercase tracking-widest px-2 h-5 border border-emerald-500/20">
                  Facturas (Vigentes)
                </Chip>
              )
            ) : esCompletado ? (
              <Chip size="sm" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] uppercase tracking-widest px-2 h-5 border border-emerald-500/20">
                Lecturas Registradas
              </Chip>
            ) : esPeriodoActual ? (
              <Chip size="sm" className="bg-slate-500/10 text-slate-600 dark:text-zinc-400 font-bold text-[9px] uppercase tracking-widest px-2 h-5">
                Mes Actual
              </Chip>
            ) : null}
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* Filtro de Año */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                Año fiscal
              </label>
              <div className="relative">
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full h-11 pl-3 pr-8 text-sm font-semibold rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <HiChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Selector de Período (Mes) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                Mes facturado
              </label>
              <div className="relative">
                <select
                  value={value || ""}
                  onChange={(e) => {
                    onChange(e.target.value);
                    setIsOpen(false);
                  }}
                  className="w-full h-11 pl-3 pr-8 text-sm font-semibold rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                >
                  <option value="">{placeholder}</option>
                  {periodosFiltrados.map((periodo) => {
                    const infoMes = periodosInfo[periodo.value];
                    const isSig = siguientePeriodo && periodo.value === siguientePeriodo;
                    const hasFacturas = infoMes?.tieneFacturas;
                    const isVencido = infoMes?.vencida;
                    const isComp = infoMes?.completado || infoMes?.estado === 'completado';
                    const isParc = infoMes?.estado === 'parcial' || (!isComp && Number(infoMes?.totalLecturas || 0) > 0);

                    let statusText = "";
                    if (isSig) statusText = " (⚡ Siguiente)";
                    else if (hasFacturas) statusText = isVencido ? " (⚠️ Facturado - Vencido)" : " (✓ Facturado - Vigente)";
                    else if (isComp) statusText = " (✓ Completado)";
                    else if (isParc) statusText = " (● En Progreso)";

                    return (
                      <option key={periodo.value} value={periodo.value}>
                        {periodo.label}{statusText}
                      </option>
                    );
                  })}
                </select>
                <HiChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Navegación Rápida */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800/80 mt-1">
              <Button
                variant="ghost"
                startContent={<HiChevronLeft className="w-4 h-4" />}
                onPress={() => handleNavegar(periodoAnterior)}
                isDisabled={isDisabled || !periodoAnterior}
                className="flex-1 font-bold text-xs bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl"
              >
                Anterior
              </Button>
              <Button
                variant="ghost"
                endContent={<HiChevronRight className="w-4 h-4" />}
                onPress={() => handleNavegar(periodoSiguiente)}
                isDisabled={isDisabled || !periodoSiguiente}
                className="flex-1 font-bold text-xs bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl"
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectorPeriodoAvanzado;
