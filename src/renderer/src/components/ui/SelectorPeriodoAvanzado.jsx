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
  size = "sm",
  isDisabled = false,
  className = "",
}) => {
  const currentYear = String(new Date().getFullYear());
  const [isOpen, setIsOpen] = useState(false);
  const [yearFilter, setYearFilter] = useState(currentYear);

  // Keep year filter in sync when controlled value changes from outside
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

  return (
    <div className={className}>
      <Popover
        placement="bottom-start"
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        shouldCloseOnBlur
      >
        <PopoverTrigger>
          <Button
            variant="bordered"
            size={size}
            isDisabled={isDisabled}
            className="w-full justify-between border-default-300 dark:border-default-100/20 hover:border-primary data-[hover=true]:border-primary"
            startContent={<HiCalendar className="text-primary shrink-0" />}
            endContent={
              <HiChevronDown
                className={`text-default-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            }
          >
            <span className="truncate text-left flex-1 text-sm font-medium">
              {periodoActualLabel}
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[290px] p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-default-100 dark:bg-default-50/10 border-b border-default-200 dark:border-default-100/10">
            <HiCalendar className="text-primary w-4 h-4 shrink-0" />
            <p className="text-xs font-semibold text-default-600 uppercase tracking-wide flex-1">
              {label}
            </p>
            {esPeriodoActual && (
              <Chip size="sm" color="success" variant="flat" className="text-[10px] h-5 px-1.5">
                Actual
              </Chip>
            )}
          </div>

          <div className="p-3 space-y-2.5">
            {/* Año */}
            <Select
              label="Año"
              placeholder="Seleccionar año"
              selectedKeys={[yearFilter]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                if (selected) setYearFilter(selected);
              }}
              size="sm"
              isDisabled={isDisabled}
              variant="bordered"
              disallowEmptySelection
            >
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </Select>

            {/* Período */}
            <Select
              label={label}
              placeholder={placeholder}
              selectedKeys={value ? [value] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                if (selected) {
                  onChange(selected);
                  setIsOpen(false);
                }
              }}
              startContent={<HiCalendar className="text-default-400" />}
              size="sm"
              isDisabled={isDisabled}
              disallowEmptySelection
              variant="bordered"
            >
              {periodosFiltrados.map((periodo) => (
                <SelectItem key={periodo.value} value={periodo.value}>
                  {periodo.label}
                </SelectItem>
              ))}
            </Select>

            {/* Navegación */}
            <div className="flex items-center gap-2 pt-0.5">
              <Button
                size="sm"
                variant="flat"
                color="default"
                startContent={<HiChevronLeft className="w-3.5 h-3.5" />}
                onPress={() => handleNavegar(periodoAnterior)}
                isDisabled={isDisabled || !periodoAnterior}
                className="flex-1 text-xs"
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="flat"
                color="default"
                endContent={<HiChevronRight className="w-3.5 h-3.5" />}
                onPress={() => handleNavegar(periodoSiguiente)}
                isDisabled={isDisabled || !periodoSiguiente}
                className="flex-1 text-xs"
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
