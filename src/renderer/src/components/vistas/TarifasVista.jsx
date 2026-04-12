import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, Pagination, Skeleton, Tabs, Tab } from "@nextui-org/react";
import { 
  HiSearch, 
  HiCurrencyDollar, 
  HiCalendar, 
  HiTrendingUp,
  HiOutlineDocumentReport,
  HiX
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
      setErrorCalculo("Ingresa un consumo valido.");
      return;
    }

    try {
      const resultado = calcularTarifaConDesglose(consumo, tarifaCalculadoraSeleccionada.rangos);
      setResultadoCalculo(resultado);
    } catch (error) {
      setErrorCalculo(error.message || "No se pudo calcular la tarifa.");
    }
  };

  // ESTADO DE CARGA INICIAL (Si no hay tarifas y está cargando)
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
    // CONTENEDOR PRINCIPAL: Padding exterior fluido
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20">

      {/* CONTENEDOR DE LA VISTA: 'w-full' para ocupar todo el espacio disponible */}
      <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-8">

        {/* ── 1. HEADER Y ESTADÍSTICAS ── */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          
          {/* Título de la vista */}
          <div className="flex gap-4 items-center shrink-0">
            {/* Identidad Emerald (Verde Financiero) */}
            <div className="p-3.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0 flex items-center justify-center">
              <TarifaIcon className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
                  Gestión de Tarifas
                </h1>
                {/* Loader Sutil de actualización */}
                {loading && (
                  <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin"></div>
                )}
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-lg leading-relaxed">
                Administra, configura rangos de consumo y mantén al día las estructuras de cobro.
              </p>
            </div>
          </div>

          {/* Tarjetas de Estadísticas (KPIs) - Se alinean a la derecha */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full xl:w-auto shrink-0">
            
            {/* KPI: Total Tarifas */}
            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
              <div className="flex items-center gap-1.5 mb-2 text-slate-400 dark:text-zinc-500">
                <HiOutlineDocumentReport className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Total Tarifas</span>
              </div>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-none">
                {estadisticas.total}
              </p>
            </div>

            {/* KPI: Vigentes */}
            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
              <div className="flex items-center gap-1.5 mb-2 text-slate-400 dark:text-zinc-500">
                <HiCalendar className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Vigentes</span>
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                {estadisticas.vigentes}
              </p>
            </div>

            {/* KPI: Precio Promedio (Rango 1) */}
            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
              <div className="flex items-center gap-1.5 mb-2 text-slate-400 dark:text-zinc-500">
                <HiTrendingUp className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Precio Base Prom.</span>
              </div>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 leading-none">
                ${estadisticas.promedioRango1.toFixed(2)}
              </p>
            </div>

            {/* KPI: Próximas a Vencer */}
            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
              <div className="flex items-center gap-1.5 mb-2 text-slate-400 dark:text-zinc-500">
                <HiCalendar className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Por Vencer</span>
              </div>
              <p className="text-2xl font-black text-orange-500 dark:text-orange-400 leading-none">
                {estadisticas.proximasAVencer}
              </p>
            </div>
          </div>
        </div>

        <Tabs
          aria-label="Secciones de tarifas"
          color="success"
          variant="underlined"
          classNames={{
            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-slate-200 dark:border-zinc-800",
            cursor: "w-full bg-emerald-500",
            tab: "max-w-fit px-0 h-12",
            tabContent: "group-data-[selected=true]:text-emerald-600 dark:group-data-[selected=true]:text-emerald-400 font-bold"
          }}
        >
          <Tab
            key="tarifas"
            title={
              <div className="flex items-center gap-2">
                <HiCurrencyDollar className="w-4 h-4" />
                <span>Tarifas</span>
              </div>
            }
          >
            <div className="pt-5 space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-zinc-900/30 p-2 sm:p-3 rounded-2xl border border-slate-100 dark:border-zinc-800/80">
                <div className="w-full sm:max-w-md relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
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
                    className="w-full h-11 pl-11 pr-10 text-sm font-medium rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 shadow-sm"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                    >
                      <HiX className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="w-full sm:w-auto shrink-0">
                  <RegistrarTarifa />
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                {tarifasPaginadas.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8">
                      {tarifasPaginadas.map((tarifa) => (
                        <TarifaCard key={tarifa.id} tarifa={tarifa} />
                      ))}
                    </div>

                    {totalPaginas > 1 && (
                      <div className="flex justify-center mt-auto pb-4">
                        <Pagination
                          total={totalPaginas}
                          page={paginaActual}
                          onChange={setPaginaActual}
                          color="primary"
                          showControls
                          classNames={{
                            wrapper: "gap-2 overflow-visible h-10 rounded-2xl border-none shadow-sm bg-white dark:bg-zinc-900 px-2",
                            item: "w-8 h-8 text-sm font-bold rounded-xl bg-transparent text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800",
                            cursor: "bg-emerald-600 shadow-md shadow-emerald-500/30 text-white font-bold rounded-xl",
                            prev: "rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400",
                            next: "rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400",
                          }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl bg-slate-50/50 dark:bg-zinc-900/20">
                    <div className="p-4 bg-white dark:bg-zinc-900 rounded-full shadow-sm border border-slate-100 dark:border-zinc-800 mb-4">
                      <HiCurrencyDollar className="w-10 h-10 text-slate-300 dark:text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200 mb-1">
                      No se encontraron tarifas
                    </h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-6 max-w-sm text-center">
                      {search
                        ? `No hay resultados para "${search}". Intenta con otras palabras.`
                        : "Aún no hay tarifas registradas en el sistema."}
                    </p>
                    {search && (
                      <Button
                        color="primary"
                        variant="flat"
                        startContent={<HiSearch className="w-4 h-4" />}
                        onPress={() => setSearch("")}
                        className="font-bold bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                      >
                        Limpiar búsqueda
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Tab>

          <Tab
            key="calculadora"
            title={
              <div className="flex items-center gap-2">
                <HiTrendingUp className="w-4 h-4" />
                <span>Calculadora</span>
              </div>
            }
          >
            <div className="pt-5">
              <Card className="border border-emerald-200 dark:border-emerald-900/40 shadow-sm">
                <CardBody className="p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Calculadora de Cobro</h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">
                      Selecciona una tarifa e ingresa el consumo para ver el desglose con la misma logica del calculo de deuda/factura.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Tarifa</label>
                      <select
                        value={tarifaCalculadoraId}
                        onChange={(e) => setTarifaCalculadoraId(e.target.value)}
                        className="h-11 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium"
                      >
                        <option value="">Selecciona una tarifa de la lista actual</option>
                        {tarifas.map((tarifa) => (
                          <option key={tarifa.id} value={tarifa.id}>
                            {tarifa.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Consumo (m3)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={consumoCalculadora}
                        onChange={(e) => setConsumoCalculadora(e.target.value)}
                        placeholder="Ej. 25"
                        className="h-11 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium"
                      />
                    </div>

                    <Button
                      color="success"
                      onPress={handleCalcularTarifa}
                      className="font-bold h-11"
                    >
                      Calcular desglose
                    </Button>
                  </div>

                  {errorCalculo && (
                    <div className="text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl p-3">
                      {errorCalculo}
                    </div>
                  )}

                  {resultadoCalculo && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-xl border border-slate-200 dark:border-zinc-700 p-3 bg-slate-50 dark:bg-zinc-900/40">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Consumo ingresado</p>
                          <p className="text-xl font-black text-slate-800 dark:text-zinc-100">{resultadoCalculo.consumo_ingresado} m3</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-zinc-700 p-3 bg-slate-50 dark:bg-zinc-900/40">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Consumo facturable</p>
                          <p className="text-xl font-black text-blue-600 dark:text-blue-400">{resultadoCalculo.consumo_facturable} m3</p>
                        </div>
                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 p-3 bg-emerald-50 dark:bg-emerald-900/20">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total calculado</p>
                          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">${resultadoCalculo.total.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100 dark:bg-zinc-900/80 text-slate-600 dark:text-zinc-300">
                            <tr>
                              <th className="text-left px-3 py-2 font-bold">Rango</th>
                              <th className="text-left px-3 py-2 font-bold">Tipo</th>
                              <th className="text-right px-3 py-2 font-bold">Metros</th>
                              <th className="text-right px-3 py-2 font-bold">Precio</th>
                              <th className="text-right px-3 py-2 font-bold">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resultadoCalculo.detalle.map((item, index) => (
                              <tr key={`${item.consumo_min}-${item.consumo_max}-${index}`} className="border-t border-slate-100 dark:border-zinc-800">
                                <td className="px-3 py-2 font-medium text-slate-700 dark:text-zinc-200">
                                  {item.consumo_min}{item.consumo_max != null ? ` - ${item.consumo_max}` : "+"}
                                </td>
                                <td className="px-3 py-2 text-slate-500 dark:text-zinc-400">
                                  {item.tipo === "base_fija" ? "Base fija" : "Cobro por tramo"}
                                </td>
                                <td className="px-3 py-2 text-right text-slate-700 dark:text-zinc-200">
                                  {item.metros == null ? "-" : item.metros}
                                </td>
                                <td className="px-3 py-2 text-right text-slate-700 dark:text-zinc-200">
                                  ${item.precio_por_m3.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-right font-bold text-slate-800 dark:text-zinc-100">
                                  ${item.subtotal.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </Tab>
        </Tabs>

      </div>
    </div>
  );
}




