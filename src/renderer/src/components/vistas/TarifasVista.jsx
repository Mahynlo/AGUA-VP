import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Button, 
  Skeleton, 
  Tabs, 
  Tab, 
  Chip,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination
} from "@nextui-org/react";
import { 
  HiSearch, 
  HiCurrencyDollar, 
  HiCalendar, 
  HiTrendingUp,
  HiOutlineDocumentReport,
  HiX,
  HiCalculator,
  HiExclamationCircle
} from "react-icons/hi";
import { useTarifas } from "../../context/TarifasContext";
import RegistrarTarifa from "./tarifas/RegistrarTarifa";
import TarifaCard from "./tarifas/TarifaCard";
import { TarifaIcon } from "../../IconsApp/IconsResibos";
import { calcularTarifaConDesglose } from "../../utils/tarifaCalculadora";

export default function Tarifas() {
  const navigate = useNavigate();
  const { tarifas, pagination, loading, fetchTarifas } = useTarifas();
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
      setResultadoCalculo(resultado);
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
            <div className="p-3.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0 flex items-center justify-center">
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
                Administra, configura rangos de consumo y mantén al día las estructuras de cobro.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full xl:w-auto shrink-0">
            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-transform hover:-translate-y-1 min-w-[120px]">
              <div className="flex items-center gap-1.5 mb-1.5 text-slate-400 dark:text-zinc-500">
                <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400"><HiOutlineDocumentReport className="w-4 h-4" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Total Tarifas</span>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">{estadisticas.total}</p>
            </div>

            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-transform hover:-translate-y-1 min-w-[120px]">
              <div className="flex items-center gap-1.5 mb-1.5 text-slate-400 dark:text-zinc-500">
                <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><HiCalendar className="w-4 h-4" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Vigentes</span>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">{estadisticas.vigentes}</p>
            </div>

            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-transform hover:-translate-y-1 min-w-[120px]">
              <div className="flex items-center gap-1.5 mb-1.5 text-slate-400 dark:text-zinc-500">
                <div className="p-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400"><HiTrendingUp className="w-4 h-4" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Base Prom.</span>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">${estadisticas.promedioRango1.toFixed(2)}</p>
            </div>

            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-transform hover:-translate-y-1 min-w-[120px]">
              <div className="flex items-center gap-1.5 mb-1.5 text-slate-400 dark:text-zinc-500">
                <div className="p-1 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400"><HiCalendar className="w-4 h-4" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Por Vencer</span>
              </div>
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400 leading-none">{estadisticas.proximasAVencer}</p>
            </div>
          </div>
        </div>

        {/* ── 2. NAVEGACIÓN (TABS) Y CONTENIDO ── */}
        <div className="flex flex-col w-full flex-1">
          <Tabs
            aria-label="Secciones de tarifas"
            selectedKey={selectedTab}
            onSelectionChange={handleTabChange}
            variant="underlined"
            classNames={{
              base: "w-full border-b border-slate-200 dark:border-zinc-800 mb-6",
              tabList: "gap-6 w-full relative rounded-none p-0",
              cursor: "w-full bg-emerald-600 dark:bg-emerald-500 h-[2px]",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-emerald-600 dark:group-data-[selected=true]:text-emerald-400 group-data-[selected=true]:font-bold text-slate-500 dark:text-zinc-400 font-medium text-sm transition-colors"
            }}
          >
            {/* ── TAB 1: LISTA DE TARIFAS ── */}
            <Tab
              key="tarifas"
              title={
                <div className="flex items-center gap-2">
                  <HiCurrencyDollar className="text-lg" />
                  <span>Tarifas</span>
                </div>
              }
            >
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
                        <div className="flex justify-center mt-auto py-6 border-t border-slate-100 dark:border-zinc-800/50">
                          <Pagination
                            total={totalPaginas}
                            page={paginaActual}
                            onChange={setPaginaActual}
                            showControls
                            color="default"
                            variant="flat"
                            classNames={{
                              cursor: "bg-emerald-600 text-white font-bold shadow-md",
                            }}
                          />
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
            </Tab>

            {/* ── TAB 2: CALCULADORA ── */}
            <Tab
              key="calculadora"
              title={
                <div className="flex items-center gap-2">
                  <HiCalculator className="text-lg" />
                  <span>Calculadora</span>
                </div>
              }
            >
              <div className="animate-in fade-in duration-500 flex justify-center py-4">
                <div className="w-full max-w-5xl bg-slate-50/40 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-[2rem] p-6 sm:p-10 flex flex-col gap-8 shadow-sm">
                  
                  <div className="flex flex-col gap-1.5 border-b border-slate-200 dark:border-zinc-800 pb-6">
                    <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                      Simulador de Cobro
                    </h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                      Selecciona una tarifa e ingresa el consumo para ver el desglose exacto aplicando la lógica oficial.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                    <div className="lg:col-span-5 flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 ml-1">Tarifa a Simular</label>
                      <Select
                        aria-label="Selecciona una tarifa"
                        placeholder="Selecciona de la lista..."
                        selectedKeys={tarifaCalculadoraId ? [tarifaCalculadoraId] : []}
                        onChange={(e) => setTarifaCalculadoraId(e.target.value)}
                        variant="flat"
                        classNames={{
                          trigger: "bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 h-[52px]",
                          value: "font-bold text-slate-700 dark:text-zinc-200"
                        }}
                      >
                        {tarifas.map((tarifa) => (
                          <SelectItem key={tarifa.id} value={tarifa.id}>{tarifa.nombre}</SelectItem>
                        ))}
                      </Select>
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 ml-1">Consumo (m³)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={consumoCalculadora}
                        onChange={(e) => setConsumoCalculadora(e.target.value)}
                        placeholder="Ej. 25"
                        className="w-full px-4 text-sm font-bold bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 shadow-sm h-[52px] outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>

                    <div className="lg:col-span-3">
                      <Button
                        onPress={handleCalcularTarifa}
                        className="w-full font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl h-[52px] shadow-sm transition-transform active:scale-95"
                      >
                        Calcular Desglose
                      </Button>
                    </div>
                  </div>

                  {errorCalculo && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold animate-in fade-in">
                      <HiExclamationCircle className="w-5 h-5 shrink-0" />
                      {errorCalculo}
                    </div>
                  )}

                  {resultadoCalculo && (
                    <div className="flex flex-col gap-6 pt-6 border-t border-slate-200 dark:border-zinc-800 animate-in slide-in-from-top-4">
                      
                      {/* KPIs de Resultados */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-950 flex flex-col gap-1 shadow-sm">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Consumo Ingresado</p>
                          <p className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{resultadoCalculo.consumo_ingresado} <span className="text-sm text-slate-400">m³</span></p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-950 flex flex-col gap-1 shadow-sm">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Consumo Facturable</p>
                          <p className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400">{resultadoCalculo.consumo_facturable} <span className="text-sm text-blue-400/70">m³</span></p>
                        </div>
                        <div className="rounded-2xl border border-emerald-500/30 p-6 bg-emerald-500/10 flex flex-col gap-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-500">Total Calculado</p>
                          <p className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">${resultadoCalculo.total.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>

                      {/* Tabla de Desglose Standard SaaS */}
                      <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
                        <Table
                          aria-label="Desglose del cálculo"
                          removeWrapper
                          classNames={{
                            th: "bg-slate-50 dark:bg-zinc-900/50 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 py-4 px-6",
                            td: "py-4 px-6 border-b border-slate-100 dark:border-zinc-800/50",
                            tr: "hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 transition-colors cursor-default"
                          }}
                        >
                          <TableHeader>
                            <TableColumn>RANGO</TableColumn>
                            <TableColumn>TIPO DE COBRO</TableColumn>
                            <TableColumn align="end">METROS (m³)</TableColumn>
                            <TableColumn align="end">PRECIO/m³</TableColumn>
                            <TableColumn align="end">SUBTOTAL</TableColumn>
                          </TableHeader>
                          <TableBody items={resultadoCalculo.detalle}>
                            {(item) => (
                              <TableRow key={`${item.consumo_min}-${item.consumo_max}`}>
                                <TableCell className="font-bold text-sm text-slate-800 dark:text-zinc-100">
                                  {item.consumo_min}{item.consumo_max != null ? ` - ${item.consumo_max}` : "+"}
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                                    {item.tipo === "base_fija" ? "Base fija" : "Cobro por tramo"}
                                  </span>
                                </TableCell>
                                <TableCell className="font-mono text-sm text-slate-600 dark:text-zinc-300">
                                  {item.metros == null ? "-" : item.metros}
                                </TableCell>
                                <TableCell className="font-mono text-sm text-slate-600 dark:text-zinc-300">
                                  ${item.precio_por_m3.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="font-mono font-black text-base text-slate-800 dark:text-zinc-100">
                                  ${item.subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                    </div>
                  )}
                </div>
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
}


