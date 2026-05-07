import React, { useMemo, useState, useEffect } from "react";
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Select,
  SelectItem,
  Chip,
} from "@nextui-org/react";
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
  className = "w-full h-full", // Estandarizado para heredar del contenedor padre
}) => {
  const currentYear = String(new Date().getFullYear());
  const [isOpen, setIsOpen] = useState(false);
  const [yearFilter, setYearFilter] = useState(currentYear);

  // Mantiene el filtro de año sincronizado cuando el valor controlado cambia desde afuera
  useEffect(() => {
    if (value) {
      const yr = value.split("-")[0];
      if (yr) setYearFilter(yr);
    }
  }, [value]);

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

  const handleNavegar = (nuevoPeriodo) => {
    if (!nuevoPeriodo) return;
    onChange(nuevoPeriodo);
    const yr = nuevoPeriodo.split("-")[0];
    if (yr && yr !== yearFilter) setYearFilter(yr);
  };

  // Clases estandarizadas para los selects internos
  const selectClassNames = {
    trigger: "bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-none",
    value: "font-bold text-slate-700 dark:text-zinc-200 text-sm"
  };

  return (
    <div className={className}>
      <Popover
        placement="bottom-start"
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        shouldCloseOnBlur
        classNames={{
          content: "p-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        }}
      >
        <PopoverTrigger>
          <button
            type="button"
            disabled={isDisabled}
            className={`w-full h-full flex items-center justify-between px-4 bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-none ${
              isDisabled 
                ? "opacity-50 cursor-not-allowed" 
                : "hover:border-slate-300 dark:hover:border-zinc-700 cursor-pointer"
            } ${isOpen ? "border-blue-500 dark:border-blue-500" : ""}`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <HiCalendar className={`shrink-0 text-lg ${isOpen ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-zinc-500"}`} />
              <span className={`truncate text-sm ${value ? "font-bold text-slate-700 dark:text-zinc-200" : "font-medium text-slate-500 dark:text-zinc-400"}`}>
                {periodoActualLabel}
              </span>
            </div>
            <HiChevronDown
              className={`text-slate-400 dark:text-zinc-500 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-500" : ""}`}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-[300px]">
          {/* Header del Popover */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <HiCalendar className="text-blue-600 dark:text-blue-400 w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                {label}
              </p>
            </div>
            {esPeriodoActual && (
              <Chip size="sm" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] uppercase tracking-widest px-1 h-5">
                Actual
              </Chip>
            )}
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* Filtro de Año */}
            <Select
              label={<span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Año fiscal</span>}
              labelPlacement="outside"
              placeholder="Seleccionar año"
              selectedKeys={[yearFilter]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                if (selected) setYearFilter(selected);
              }}
              isDisabled={isDisabled}
              variant="flat"
              disallowEmptySelection
              classNames={selectClassNames}
            >
              {years.map((year) => (
                <SelectItem key={year} value={year} className="font-semibold">
                  {year}
                </SelectItem>
              ))}
            </Select>

            {/* Selector de Período (Mes) */}
            <Select
              label={<span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Mes facturado</span>}
              labelPlacement="outside"
              placeholder={placeholder}
              selectedKeys={value ? [value] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                if (selected) {
                  onChange(selected);
                  setIsOpen(false);
                }
              }}
              isDisabled={isDisabled}
              disallowEmptySelection
              variant="flat"
              classNames={selectClassNames}
            >
              {periodosFiltrados.map((periodo) => (
                <SelectItem key={periodo.value} value={periodo.value} className="font-semibold">
                  {periodo.label}
                </SelectItem>
              ))}
            </Select>

            {/* Navegación Rápida */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800/80 mt-1">
              <Button
                variant="flat"
                startContent={<HiChevronLeft className="w-4 h-4" />}
                onPress={() => handleNavegar(periodoAnterior)}
                isDisabled={isDisabled || !periodoAnterior}
                className="flex-1 font-bold text-xs bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl"
              >
                Anterior
              </Button>
              <Button
                variant="flat"
                endContent={<HiChevronRight className="w-4 h-4" />}
                onPress={() => handleNavegar(periodoSiguiente)}
                isDisabled={isDisabled || !periodoSiguiente}
                className="flex-1 font-bold text-xs bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl"
              >
                Siguiente
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SelectorPeriodoAvanzado;
