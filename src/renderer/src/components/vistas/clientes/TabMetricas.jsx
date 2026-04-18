import React, { useMemo } from "react";
import { Select, SelectItem, Card, CardBody, CardHeader, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@nextui-org/react";
import { HiUsers, HiTrendingUp, HiLocationMarker, HiCalendar, HiCheckCircle, HiXCircle, HiDownload, HiChartBar } from "react-icons/hi";
import { MdSpeed } from "react-icons/md";
import ClientesPorMesChart from "../../charts/ChartClientesPorMes";
import LoadingSkeleton from "./components/LoadingSkeleton";
import { useMetricasClientes } from "../../../hooks/useMetricasClientes";
import { useClientes } from "../../../context/ClientesContext";
import { exportData } from "../../../utils/exportUtils";
import { useFeedback } from "../../../context/FeedbackContext";

// --- Sub-componente MetricCard (Premium UI) ---
const MetricCard = ({ icon: Icon, title, value, subTitle, color, chipValue }) => {
  const colorMap = {
    blue: {
      card: "bg-sky-500/10 border-sky-200/70 dark:border-sky-900/40",
      icon: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      badge: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200/70 dark:border-sky-900/50"
    },
    green: {
      card: "bg-emerald-500/10 border-emerald-200/70 dark:border-emerald-900/40",
      icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-900/50"
    },
    purple: {
      card: "bg-violet-500/10 border-violet-200/70 dark:border-violet-900/40",
      icon: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      badge: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200/70 dark:border-violet-900/50"
    },
    red: {
      card: "bg-rose-500/10 border-rose-200/70 dark:border-rose-900/40",
      icon: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200/70 dark:border-rose-900/50"
    },
    cyan: {
      card: "bg-cyan-500/10 border-cyan-200/70 dark:border-cyan-900/40",
      icon: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
      badge: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200/70 dark:border-cyan-900/50"
    },
    amber: {
      card: "bg-amber-500/10 border-amber-200/70 dark:border-amber-900/40",
      icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-900/50"
    },
    teal: {
      card: "bg-teal-500/10 border-teal-200/70 dark:border-teal-900/40",
      icon: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
      badge: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-900/50"
    },
  };

  const theme = colorMap[color] || colorMap.blue;

  return (
    <Card className={`border shadow-none rounded-2xl ${theme.card}`}>
      <CardBody className="p-5 flex flex-row items-center gap-4">
        <div className={`p-3 rounded-xl shrink-0 ${theme.icon}`}>
             <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-500 dark:text-zinc-400 truncate">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black tracking-tight leading-none text-slate-800 dark:text-zinc-100">{value}</p>
            {chipValue && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${theme.badge}`}>
                    {chipValue}
                </span>
            )}
          </div>
          {subTitle && <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 truncate">{subTitle}</p>}
        </div>
      </CardBody>
    </Card>
  );
};

export const TabMetricas = () => {
  const { clientes, estadisticasServidor } = useClientes();
  const {
    estadisticas: estadisticasHook,
    estadisticasPorCiudad,
    initialLoading,
    loading,
    tipoGrafica,
    handleCambioTipoGrafica
  } = useMetricasClientes();

  const { setSuccess } = useFeedback();

  // --- Normalización de Datos ---
  const data = useMemo(() => {
    const resumen = estadisticasServidor?.resumen || {};
    const medidores = estadisticasServidor?.medidores || {};

    const total = resumen.total_clientes ?? estadisticasHook.total ?? 0;
    const activos = resumen.clientes_activos ?? estadisticasHook.activos ?? 0;
    const nuevos = resumen.clientes_ultimo_mes ?? estadisticasHook.nuevosEsteMes ?? 0;
    const inactivos = resumen.clientes_inactivos ?? 0;
    const porcActivos = total > 0 ? ((activos / total) * 100).toFixed(1) : "0.0";

    return {
      total, activos, nuevos, inactivos, porcActivos, medidores,
      ciudades: estadisticasServidor?.distribucion?.por_ciudad || estadisticasPorCiudad || [],
      tarifas: estadisticasServidor?.distribucion?.por_tarifa || [],
      estados: estadisticasServidor?.distribucion?.por_estado || [],
      fechaActualizacion: estadisticasServidor?.fecha_generacion
        ? new Date(estadisticasServidor.fecha_generacion).toLocaleString('es-MX')
        : null
    };
  }, [estadisticasServidor, estadisticasHook, estadisticasPorCiudad]);

  // --- Lógica de Gráficas ---
  const renderChart = () => {
    switch (tipoGrafica) {
      case "registros_mes":
        return estadisticasServidor?.tendencias?.registros_ano_actual ? (
          <ClientesPorMesChart data={estadisticasServidor.tendencias.registros_ano_actual} esDataServidor={true} titulo="Registros este Año" />
        ) : null;
      case "tendencia":
        return estadisticasServidor?.tendencias?.registros_por_mes ? (
          <ClientesPorMesChart data={estadisticasServidor.tendencias.registros_por_mes} esDataServidor={true} mostrarMesCompleto={true} titulo="Tendencia Histórica" />
        ) : null;
      case "ciudades":
        return <ClientesPorMesChart data={data.ciudades.map(c => ({ mes: c.ciudad || c.nombre, cantidad: c.cantidad || c.total }))} esDataServidor={true} titulo="Distribución por Ciudad" colorPersonalizado="#8B5CF6" />;
      case "tarifas":
        return <ClientesPorMesChart data={data.tarifas.map(t => ({ mes: t.tarifa_nombre, cantidad: t.cantidad_clientes }))} esDataServidor={true} titulo="Distribución por Tarifa" colorPersonalizado="#F59E0B" />;
      default:
        return !estadisticasServidor ? <ClientesPorMesChart clientes={clientes} /> : null;
    }
  };

  if (initialLoading) return <LoadingSkeleton tipo="metricas" />;

  return (
    <div className="w-full bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10 space-y-6">

      {/* 0. Header con Exportación */}
      <div className="flex justify-end">
        <Dropdown>
          <DropdownTrigger>
            <Button
              color="default"
              className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 shadow-sm"
              startContent={<HiDownload className="text-lg" />}
            >
              Exportar Reporte
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Opciones de exportación de métricas" className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
            <DropdownItem
              key="csv"
              startContent={<span className="text-xl">📄</span>}
              className="hover:bg-slate-50 dark:hover:bg-zinc-800"
              onPress={async () => {
                const reportData = {
                  "Resumen": [{
                    Total: data.total,
                    Activos: data.activos,
                    Inactivos: data.inactivos,
                    Nuevos_Mes: data.nuevos,
                    Porcentaje_Activos: `${data.porcActivos}%`
                  }],
                  "Ciudades": data.ciudades,
                  "Tarifas": data.tarifas,
                  "Estados": data.estados
                };
                const success = await exportData(reportData, `Reporte_Metricas_Clientes_${new Date().toISOString().split('T')[0]}`, 'csv');
                if (success) setSuccess("Reporte CSV generado exitosamente");
              }}
            >
              <span className="font-semibold text-slate-700 dark:text-zinc-200">Exportar CSV (Resumen)</span>
            </DropdownItem>
            <DropdownItem
              key="excel"
              startContent={<span className="text-xl">📊</span>}
              className="hover:bg-slate-50 dark:hover:bg-zinc-800"
              onPress={async () => {
                const reportData = {
                  "Resumen": [{
                    Total: data.total,
                    Activos: data.activos,
                    Inactivos: data.inactivos,
                    Nuevos_Mes: data.nuevos,
                    Porcentaje_Activos: `${data.porcActivos}%`
                  }],
                  "Ciudades": data.ciudades,
                  "Tarifas": data.tarifas,
                  "Estados": data.estados
                };
                const success = await exportData(reportData, `Reporte_Metricas_Clientes_${new Date().toISOString().split('T')[0]}`, 'xlsx');
                if (success) setSuccess("Reporte Excel generado con múltiples hojas");
              }}
            >
              <span className="font-semibold text-slate-700 dark:text-zinc-200">Exportar Excel Completo (.xlsx)</span>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* 1. KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={HiUsers} title="Total Clientes" value={data.total} color="blue" />
        <MetricCard icon={HiCheckCircle} title="Clientes Activos" value={data.activos} color="green" chipValue={`${data.porcActivos}%`} />
        <MetricCard icon={HiCalendar} title="Nuevos este Mes" value={data.nuevos} color="purple" />
        <MetricCard icon={HiXCircle} title="Clientes Inactivos" value={data.inactivos} color="red" />
      </div>

      {/* 2. KPIs Medidores */}
      {data.medidores.clientes_con_medidores !== undefined && (
        <div className="pt-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3">
            Estado de Medición
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard icon={MdSpeed} title="Con Medidor" value={data.medidores.clientes_con_medidores} color="cyan" chipValue={`${data.medidores.porcentaje_con_medidores}%`} />
            <MetricCard icon={MdSpeed} title="Sin Medidor" value={data.medidores.clientes_sin_medidores} color="amber" />
            <MetricCard icon={MdSpeed} title="Medidores Asignados" value={data.medidores.total_medidores_asignados} color="teal" />
          </div>
        </div>
      )}

      {/* 3. Distribuciones (Grid Complejo) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-2">

        {/* Columna Izquierda: Ciudades */}
        <Card className="xl:col-span-2 border-none shadow-none bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-zinc-800">
          <CardHeader className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800/50 pb-4 pt-5 px-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-500/10 rounded-xl">
                <HiLocationMarker className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                  Distribución Por Ciudad
              </h3>
            </div>
            {loading && !initialLoading && <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>}
          </CardHeader>
          <CardBody className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.ciudades.map((ciudad, index) => {
                const nombre = ciudad.ciudad || ciudad.nombre;
                const total = ciudad.cantidad || ciudad.total;
                const porcentaje = (total / (data.total || 1)) * 100;

                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950/30 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors shadow-none"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-slate-800 dark:text-zinc-100 text-sm truncate pr-2">
                        {nombre}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200/70 dark:border-sky-900/50">
                        {porcentaje.toFixed(1)}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${porcentaje}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-zinc-400">
                      <span>Total: <strong className="text-slate-700 dark:text-zinc-300">{total}</strong></span>
                      {ciudad.activos > 0 && (
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Activos: {ciudad.activos}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Columna Derecha: Estados y Tarifas */}
        <div className="space-y-6 flex flex-col h-full">
          {/* Estados */}
          {data.estados.length > 0 && (
            <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-zinc-800 shrink-0">
              <CardHeader className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/50 pb-3 pt-4 px-5">
                <HiCheckCircle className="text-emerald-500 w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Estado de Cuenta</span>
              </CardHeader>
              <CardBody className="p-4 flex flex-wrap gap-2">
                {data.estados.map((est, i) => (
                  <Chip
                    key={i}
                    color={est.estado === "Activo" ? "success" : "danger"}
                    variant="flat"
                    className="capitalize font-bold text-xs"
                  >
                    {est.estado}: {est.cantidad}
                  </Chip>
                ))}
              </CardBody>
            </Card>
          )}

          {/* Tarifas */}
          {data.tarifas.length > 0 && (
            <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-zinc-800 flex-1 min-h-0">
              <CardHeader className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/50 pb-3 pt-4 px-5">
                <HiTrendingUp className="text-violet-500 w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Tarifas Asignadas</span>
              </CardHeader>
              <CardBody className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
                {data.tarifas.map((t, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800/50 pb-2 last:border-0 last:pb-0">
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">{t.tarifa_nombre}</p>
                      <p className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 truncate mt-0.5">{t.tarifa_descripcion}</p>
                    </div>
                    <span className="font-bold text-violet-700 dark:text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-200/70 dark:border-violet-900/50 text-xs shrink-0">
                      {t.cantidad_clientes}
                    </span>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* 4. Gráfica Principal */}
      <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-zinc-800 mt-2 overflow-visible">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-5 pt-5 border-b border-slate-100 dark:border-zinc-800/50 pb-4">
          <div className="flex items-center gap-2">
              <HiChartBar className="w-5 h-5 text-slate-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Análisis Gráfico</h3>
          </div>
          <Select
            size="sm"
            aria-label="Visualizar"
            className="w-full sm:w-56"
            selectedKeys={[tipoGrafica]}
            onChange={(e) => handleCambioTipoGrafica(e.target.value)}
            variant="flat"
            classNames={{
                trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-none h-[40px]",
                value: "font-bold text-slate-700 dark:text-zinc-200"
            }}
          >
            <SelectItem key="registros_mes">Registros Anuales</SelectItem>
            <SelectItem key="tendencia">Tendencia Histórica</SelectItem>
            <SelectItem key="ciudades">Por Ciudad</SelectItem>
            <SelectItem key="tarifas">Por Tarifa</SelectItem>
          </Select>
        </CardHeader>
        <CardBody className="p-2 sm:p-6">
          {renderChart()}
        </CardBody>
      </Card>

      {/* 5. Footer */}
      <div className="text-center text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest pt-4 mt-8">
        {data.fechaActualizacion && `Última actualización de métricas: ${data.fechaActualizacion}`}
      </div>
    </div>
  );
};