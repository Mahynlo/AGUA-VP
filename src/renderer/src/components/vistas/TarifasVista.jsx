import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Skeleton } from "@heroui/react";
import { 
  HiSearch, 
  HiCurrencyDollar, 
  HiCalendar, 
  HiTrendingUp,
  HiOutlineDocumentReport,
  HiX,
  HiCalculator,
  HiExclamationCircle,
  HiChevronLeft,
  HiChevronRight,
  HiChevronDown
} from "react-icons/hi";
import { useTarifas } from "../../context/TarifasContext";
import RegistrarTarifa from "./tarifas/RegistrarTarifa";
import TarifaCard from "./tarifas/TarifaCard";
import { TarifaIcon } from "../../IconsApp/IconsResibos";
import { calcularTarifaConDesglose } from "../../utils/tarifaCalculadora";
import useEquivalenciaConsumo from "../../hooks/useEquivalenciaConsumo";

export default function Tarifas() {
  const navigate = useNavigate();
  const { tarifas, pagination, loading, fetchTarifas } = useTarifas();
  const { probarEquivalencia } = useEquivalenciaConsumo();
  const [search, setSearch] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tarifaCalculadoraId, setTarifaCalculadoraId] = useState("");
  const [consumoCalculadora, setConsumoCalculadora] = useState("");
  const [resultadoCalculo, setResultadoCalculo] = useState(null);
  const [errorCalculo, setErrorCalculo] = useState("");
  
  // Estado para la pestaña activa
  const [selectedTab, setSelectedTab] = useState(() => {
    return localStorage.getItem("tarifas_activeTab") || "tarifas";
  });

  const handleTabChange = (key) => {
    setSelectedTab(key);
    localStorage.setItem("tarifas_activeTab", key);
  };

  // Debounce para búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPaginaActual(1); // Reset a pagina 1 al buscar
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Efecto para solicitar datos paginados
  useEffect(() => {
    fetchTarifas({
      page: paginaActual,
      limit: 10,
      search: debouncedSearch
    });
  }, [paginaActual, debouncedSearch, fetchTarifas]);

  // Estadísticas calculadas sobre la página actual (visibles)
  const estadisticas = useMemo(() => {
    if (!tarifas || tarifas.length === 0) return { total: 0, vigentes: 0, proximasAVencer: 0, promedioRango1: 0 };

    const totalReal = pagination ? pagination.total : tarifas.length;
    const hoy = new Date();
    const treintaDias = new Date();
    treintaDias.setDate(treintaDias.getDate() + 30);

    let vigentes = 0;
    let proximasAVencer = 0;
    let sumaRango1 = 0;
    let contadorRango1 = 0;

    tarifas.forEach(tarifa => {
      const fechaFin = tarifa.fecha_fin ? new Date(tarifa.fecha_fin) : null;
      
      // Vigentes
      if (!fechaFin || hoy <= fechaFin) {
        vigentes++;
      }
      
      // Próximas a vencer (en los siguientes 30 días)
      if (fechaFin && fechaFin >= hoy && fechaFin <= treintaDias) {
        proximasAVencer++;
      }

      // Promedio Rango 1
      if (tarifa.rangos && tarifa.rangos.length > 0) {
        sumaRango1 += parseFloat(tarifa.rangos[0].precio_por_m3 || 0);
        contadorRango1++;
      }
    });

    return {
      total: totalReal,
      vigentes: vigentes,
      proximasAVencer: proximasAVencer,
      promedioRango1: contadorRango1 > 0 ? sumaRango1 / contadorRango1 : 0,
    };
  }, [tarifas, pagination]);

  const tarifasPaginadas = tarifas;
  const totalPaginas = pagination ? pagination.totalPages : 1;

  const tarifaCalculadoraSeleccionada = useMemo(() => {
    if (!tarifaCalculadoraId) return null;
    return tarifas.find((t) => String(t.id) === String(tarifaCalculadoraId)) || null;
  }, [tarifaCalculadoraId, tarifas]);

  const handleCalcularTarifa = () => {
    setErrorCalculo("");
    setResultadoCalculo(null);

    if (!tarifaCalculadoraSeleccionada) {
      setErrorCalculo("Selecciona una tarifa para calcular.");
      return;
    }

    if (!tarifaCalculadoraSeleccionada.rangos || tarifaCalculadoraSeleccionada.rangos.length === 0) {
      setErrorCalculo("La tarifa seleccionada no tiene rangos configurados.");
      return;
    }

    const consumo = Number(consumoCalculadora);
    if (consumoCalculadora === "" || Number.isNaN(consumo)) {
      setErrorCalculo("Ingresa un consumo válido.");
      return;
    }

    try {
      const resultado = calcularTarifaConDesglose(consumo, tarifaCalculadoraSeleccionada.rangos);
      const equivalenciaFrase = probarEquivalencia ? probarEquivalencia(consumo) : "";
      setResultadoCalculo({
        ...resultado,
        equivalenciaFrase
      });
    } catch (error) {
      setErrorCalculo(error.message || "No se pudo calcular la tarifa.");
    }
  };

  // ESTADO DE CARGA INICIAL
  if (loading && !tarifas.length && !search) {
    return (
      <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20">
        <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <div className="flex flex-col gap-2">
                <Skeleton className="w-48 h-6 rounded-lg" />
                <Skeleton className="w-72 h-4 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
               {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
               {[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20 scroll-smooth">
      <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-8 animate-in fade-in duration-500">

        {/* ── 1. HEADER Y ESTADÍSTICAS ── */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-8 border-b border-slate-100 dark:border-zinc-800/80 pb-6">
          <div className="flex gap-4 items-start shrink-0">
            <div className="p-3.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-2xl shrink-0 flex items-center justify-center">
              <TarifaIcon className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1 pt-0.5">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
                  Gestión de Tarifas
                </h1>
                {loading && (
                  <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin"></div>
                )}
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-lg leading-relaxed mt-1">
                Administra, configura rangos de consumo y mantén al día las estructuras de cobro del sistema.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full xl:w-auto shrink-0">
            {/* Total Tarifas */}
            <div className="flex flex-col justify-center p-4 bg-slate-50/60 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-zinc-900 transition-all shadow-sm min-w-[120px]">
              <div className="flex items-center gap-1.5 mb-1.5 text-slate-400 dark:text-zinc-500">
                <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"><HiOutlineDocumentReport className="w-4 h-4" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Total Tarifas</span>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">{estadisticas.total}</p>
            </div>

            {/* Vigentes */}
            <div className="flex flex-col justify-center p-4 bg-slate-50/60 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-zinc-900 transition-all shadow-sm min-w-[120px]">
              <div className="flex items-center gap-1.5 mb-1.5 text-slate-400 dark:text-zinc-500">
                <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><HiCalendar className="w-4 h-4" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Vigentes</span>
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{estadisticas.vigentes}</p>
            </div>

            {/* Base Promedio */}
            <div className="flex flex-col justify-center p-4 bg-slate-50/60 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-zinc-900 transition-all shadow-sm min-w-[120px]">
              <div className="flex items-center gap-1.5 mb-1.5 text-slate-400 dark:text-zinc-500">
                <div className="p-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400"><HiTrendingUp className="w-4 h-4" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Base Prom.</span>
              </div>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 leading-none">${estadisticas.promedioRango1.toFixed(2)}</p>
            </div>

            {/* Por Vencer */}
            <div className="flex flex-col justify-center p-4 bg-slate-50/60 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-zinc-900 transition-all shadow-sm min-w-[120px]">
              <div className="flex items-center gap-1.5 mb-1.5 text-slate-400 dark:text-zinc-500">
                <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400"><HiCalendar className="w-4 h-4" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Por Vencer</span>
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 leading-none">{estadisticas.proximasAVencer}</p>
            </div>
          </div>
        </div>

        {/* ── 2. NAVEGACIÓN (TABS) Y CONTENIDO ── */}
        <div className="flex flex-col w-full flex-1">
          <div className="w-full border-b border-slate-200 dark:border-zinc-800 mb-6">
            <nav className="flex gap-6 w-full -mb-px">
              <button
                type="button"
                onClick={() => handleTabChange("tarifas")}
                className={`flex items-center gap-2 py-3 text-sm border-b-2 transition-colors cursor-pointer shrink-0 ${
                  selectedTab === "tarifas"
                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                }`}
              >
                <HiCurrencyDollar className="text-lg" />
                <span>Tarifas</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("calculadora")}
                className={`flex items-center gap-2 py-3 text-sm border-b-2 transition-colors cursor-pointer shrink-0 ${
                  selectedTab === "calculadora"
                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                }`}
              >
                <HiCalculator className="text-lg" />
                <span>Calculadora</span>
              </button>
            </nav>
          </div>

          {selectedTab === "tarifas" && (
            <div className="animate-in fade-in duration-500 h-full flex flex-col">
                
                {/* Controles de Búsqueda y Registro */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-950 mb-8">
                  <div className="w-full sm:max-w-md relative flex items-center">
                    <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none">
                      <HiSearch className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Buscar tarifas..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPaginaActual(1);
                      }}
                      className="w-full pl-11 pr-10 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-none h-[52px]"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                      >
                        <HiX className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="w-full sm:w-auto shrink-0">
                    <RegistrarTarifa />
                  </div>
                </div>

                {/* Grid de Tarifas */}
                <div className="flex-1 flex flex-col">
                  {tarifasPaginadas.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 mb-8">
                        {tarifasPaginadas.map((tarifa) => (
                          <TarifaCard key={tarifa.id} tarifa={tarifa} />
                        ))}
                      </div>

                      {/* Paginación */}
                      {totalPaginas > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-auto py-6 border-t border-slate-100 dark:border-zinc-800/50">
                          <button
                            onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
                            disabled={paginaActual === 1}
                            className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-40 transition-colors"
                          >
                            <HiChevronLeft className="w-4 h-4" />
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
                              <button
                                key={p}
                                onClick={() => setPaginaActual(p)}
                                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                                  paginaActual === p
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))}
                            disabled={paginaActual === totalPaginas}
                            className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-40 transition-colors"
                          >
                            <HiChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Empty State Canónico */
                    <div className="border border-dashed border-slate-200 dark:border-zinc-800 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center min-h-[300px] bg-slate-50/50 dark:bg-zinc-900/30">
                      <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 shadow-sm flex items-center justify-center mb-4">
                        <HiCurrencyDollar className="text-3xl text-slate-400 dark:text-zinc-500" />
                      </div>
                      <h3 className="text-lg font-black tracking-tight text-slate-700 dark:text-zinc-200 mb-1">
                        No se encontraron tarifas
                      </h3>
                      <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                        {search ? `No hay resultados para "${search}".` : "Aún no hay tarifas registradas en el sistema."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
          )}

          {/* ── TAB 2: CALCULADORA ── */}
          {selectedTab === "calculadora" && (
            <div className="animate-in fade-in duration-500 flex justify-center py-4">
                <div className="w-full bg-slate-50/40 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-[2rem] p-6 sm:p-10 flex flex-col gap-8 shadow-sm">
                  
                  <div className="flex flex-col gap-1.5 border-b border-slate-200 dark:border-zinc-800 pb-6">
                    <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 flex items-center gap-2.5">
                      <HiCalculator className="text-emerald-600 dark:text-emerald-500 text-3xl shrink-0" />
                      <span>Simulador de Cobro</span>
                    </h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                      Selecciona una tarifa e ingresa el consumo para ver el desglose exacto aplicando la lógica oficial.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* COLUMNA IZQUIERDA: Campos de Entrada */}
                    <div className="lg:col-span-4 flex flex-col gap-6 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm animate-in fade-in">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
                        <HiCalculator className="w-5 h-5 text-slate-400" /> Parámetros
                      </h4>

                      <div className="flex flex-col gap-1.5">
                        <div className="relative">
                          <select
                            aria-label="Selecciona una tarifa"
                            value={tarifaCalculadoraId}
                            onChange={(e) => setTarifaCalculadoraId(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 text-sm font-bold rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 h-[52px] appearance-none cursor-pointer"
                          >
                            <option value="">Selecciona de la lista...</option>
                            {tarifas.map((tarifa) => (
                              <option key={tarifa.id} value={tarifa.id}>{tarifa.nombre}</option>
                            ))}
                          </select>
                          <HiChevronDown className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 ml-1">Consumo (m³)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={consumoCalculadora}
                          onChange={(e) => setConsumoCalculadora(e.target.value)}
                          placeholder="Ej. 25"
                          className="w-full px-4 text-sm font-bold bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 shadow-sm h-[52px] outline-none text-slate-800 dark:text-zinc-100"
                        />
                      </div>

                      <Button
                        onPress={handleCalcularTarifa}
                        className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-[52px] shadow-sm transition-all active:scale-95 mt-2"
                      >
                        Calcular Desglose
                      </Button>

                      {errorCalculo && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-bold animate-in fade-in">
                          <HiExclamationCircle className="w-5 h-5 shrink-0" />
                          {errorCalculo}
                        </div>
                      )}
                    </div>

                    {/* COLUMNA DERECHA: Resultados del Cálculo */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                      {resultadoCalculo ? (
                        <div className="flex flex-col gap-6 animate-in slide-in-from-top-4 duration-300">
                          {/* KPIs de Resultados */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-950 flex flex-col gap-1 shadow-sm">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Consumo Ingresado</p>
                              <p className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100 font-mono">{resultadoCalculo.consumo_ingresado} <span className="text-xs font-sans text-slate-400">m³</span></p>
                            </div>
                            <div className="rounded-2xl border border-purple-500/20 p-5 bg-purple-500/5 dark:bg-purple-950/20 flex flex-col gap-1 shadow-sm">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">Consumo Facturable</p>
                              <p className="text-xl font-black tracking-tight text-purple-600 dark:text-purple-400 font-mono">{resultadoCalculo.consumo_facturable} <span className="text-xs font-sans text-purple-400/70">m³</span></p>
                            </div>
                            <div className="rounded-2xl border border-emerald-500/30 p-5 bg-emerald-500/10 flex flex-col gap-1 shadow-sm">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Total Calculado</p>
                              <p className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">${resultadoCalculo.total.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                          </div>

                          {/* Equivalencia de Consumo */}
                          {resultadoCalculo.equivalenciaFrase && (
                            <div className="flex gap-4 items-start p-5 rounded-2xl bg-sky-500/10 border border-sky-500/20 shadow-sm">
                              <div className="p-2 bg-sky-500/20 rounded-xl text-sky-600 dark:text-sky-400 shrink-0">
                                <HiOutlineDocumentReport className="w-5 h-5" />
                              </div>
                              <div className="flex flex-col gap-0.5 pt-0.5">
                                <p className="text-[10px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-widest">
                                  Equivalencia del Consumo
                                </p>
                                <p className="text-sm font-semibold text-sky-950 dark:text-sky-100 italic leading-relaxed">
                                  "{resultadoCalculo.equivalenciaFrase}"
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Tabla de Desglose Standard SaaS */}
                          <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 dark:bg-zinc-900/50 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800">
                                <tr>
                                  <th className="py-3.5 px-5">RANGO</th>
                                  <th className="py-3.5 px-5">TIPO DE COBRO</th>
                                  <th className="py-3.5 px-5 text-right">METROS (m³)</th>
                                  <th className="py-3.5 px-5 text-right">PRECIO/m³</th>
                                  <th className="py-3.5 px-5 text-right">SUBTOTAL</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                                {resultadoCalculo.detalle?.map((item) => (
                                  <tr key={`${item.consumo_min}-${item.consumo_max}`} className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 transition-colors">
                                    <td className="py-3.5 px-5 font-bold text-sm text-slate-800 dark:text-zinc-100">
                                      {item.consumo_min}{item.consumo_max != null ? ` - ${item.consumo_max}` : "+"}
                                    </td>
                                    <td className="py-3.5 px-5">
                                      <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                                        {item.tipo === "base_fija" ? "Base fija" : "Cobro por tramo"}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-5 font-mono text-sm text-slate-600 dark:text-zinc-300 text-right">
                                      {item.metros == null ? "-" : item.metros}
                                    </td>
                                    <td className="py-3.5 px-5 font-mono text-sm text-slate-600 dark:text-zinc-300 text-right">
                                      ${item.precio_por_m3.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-3.5 px-5 font-mono font-black text-base text-slate-800 dark:text-zinc-100 text-right">
                                      ${item.subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        /* Estado vacío cuando no se ha calculado */
                        <div className="border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px] bg-white dark:bg-zinc-950 shadow-sm animate-in fade-in">
                          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 flex items-center justify-center mb-4">
                            <HiOutlineDocumentReport className="text-xl text-slate-400 dark:text-zinc-500" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-700 dark:text-zinc-200 mb-1">
                            Simulación en Espera
                          </h4>
                          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
                            Ingresa los parámetros a la izquierda y presiona "Calcular Desglose" para ver el detalle de cobro.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
