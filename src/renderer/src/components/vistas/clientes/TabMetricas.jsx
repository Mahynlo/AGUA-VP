import React, { useMemo } from "react";
import { Select, SelectItem, Card, CardBody, CardHeader, Chip } from "@nextui-org/react";
import { HiUsers, HiTrendingUp, HiLocationMarker, HiCalendar, HiCheckCircle, HiXCircle } from "react-icons/hi";
import { MdSpeed } from "react-icons/md";
import ClientesPorMesChart from "../../charts/ChartClientesPorMes";
import LoadingSkeleton from "./components/LoadingSkeleton";
import { useMetricasClientes } from "../../../hooks/useMetricasClientes";
import { useClientes } from "../../../context/ClientesContext";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@nextui-org/react";
import { HiDownload } from "react-icons/hi";
import { exportData } from "../../../utils/exportUtils";
import { useFeedback } from "../../../context/FeedbackContext";

// --- Sub-componente MetricCard (Sin cambios, ya funcionaba bien) ---
const MetricCard = ({ icon: Icon, title, value, subTitle, color, chipValue }) => {
  const colorMap = {
    blue: "from-blue-50 to-blue-100 text-blue-600 dark:from-blue-900/20 dark:to-blue-800/20",
    green: "from-green-50 to-green-100 text-green-600 dark:from-green-900/20 dark:to-green-800/20",
    purple: "from-purple-50 to-purple-100 text-purple-600 dark:from-purple-900/20 dark:to-purple-800/20",
    red: "from-red-50 to-red-100 text-red-600 dark:from-red-900/20 dark:to-red-800/20",
    cyan: "from-cyan-50 to-cyan-100 text-cyan-600 dark:from-cyan-900/20 dark:to-cyan-800/20",
    amber: "from-amber-50 to-amber-100 text-amber-600 dark:from-amber-900/20 dark:to-amber-800/20",
    teal: "from-teal-50 to-teal-100 text-teal-600 dark:from-teal-900/20 dark:to-teal-800/20",
  };

  const colorClass = colorMap[color] || colorMap.blue;
  const textColor = colorClass.split(" ")[2];

  return (
    <Card className={`bg-gradient-to-br ${colorClass} border-none shadow-sm`}>
      <CardBody className="text-center p-6">
        <Icon className={`w-12 h-12 mx-auto mb-3 ${textColor}`} />
        <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{title}</p>
        {subTitle && <p className="text-xs text-gray-500 mt-1">{subTitle}</p>}
        {chipValue && (
          <Chip size="sm" className={`mt-2 bg-white/50 dark:bg-black/20 border border-${color}-200 dark:border-${color}-800`} variant="flat">
            {chipValue}
          </Chip>
        )}
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
    <div className="space-y-6 p-4 animate-fade-in">

      {/* 0. Header con Exportación */}
      <div className="flex justify-end mb-2">
        <Dropdown>
          <DropdownTrigger>
            <Button
              color="success"
              className="text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md"
              startContent={<HiDownload className="text-lg" />}
            >
              Exportar Reporte
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Opciones de exportación de métricas">
            <DropdownItem
              key="csv"
              startContent={<span className="text-xl">📄</span>}
              onPress={async () => {
                // Preparar datos para reporte
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
              Exportar CSV (Resumen)
            </DropdownItem>
            <DropdownItem
              key="excel"
              startContent={<span className="text-xl">📊</span>}
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
              Exportar Excel Completo (.xlsx)
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* 1. KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={HiUsers} title="Total Clientes" value={data.total} color="blue" />
        <MetricCard icon={HiCheckCircle} title="Clientes Activos" value={data.activos} color="green" chipValue={`${data.porcActivos}% Activos`} />
        <MetricCard icon={HiCalendar} title="Nuevos este Mes" value={data.nuevos} color="purple" />
        <MetricCard icon={HiXCircle} title="Clientes Inactivos" value={data.inactivos} color="red" />
      </div>

      {/* 2. KPIs Medidores */}
      {data.medidores.clientes_con_medidores !== undefined && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-4">Estado de Medición</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard icon={MdSpeed} title="Con Medidor" value={data.medidores.clientes_con_medidores} color="cyan" chipValue={`${data.medidores.porcentaje_con_medidores}%`} />
            <MetricCard icon={MdSpeed} title="Sin Medidor" value={data.medidores.clientes_sin_medidores} color="amber" />
            <MetricCard icon={MdSpeed} title="Medidores Asignados" value={data.medidores.total_medidores_asignados} color="teal" />
          </div>
        </>
      )}

      {/* 3. Distribuciones (Grid Complejo) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* === MEJORA AQUÍ: Columna Izquierda: Ciudades con Dark Mode Optimizado === */}
        <Card className="xl:col-span-2 bg-white dark:bg-gray-800 border-none shadow-md">
          <CardHeader className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <HiLocationMarker className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Por Ciudad</h3>
            </div>
            {loading && !initialLoading && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.ciudades.map((ciudad, index) => {
                const nombre = ciudad.ciudad || ciudad.nombre;
                const total = ciudad.cantidad || ciudad.total;
                const porcentaje = (total / (data.total || 1)) * 100;

                return (
                  <div
                    key={index}
                    className="
                      p-3 rounded-xl border transition-all duration-200
                      bg-white border-gray-200 hover:bg-gray-50 hover:shadow-sm
                      dark:bg-gray-800/50 dark:border-gray-700 dark:hover:bg-gray-700/50
                    "
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-700 dark:text-gray-200 text-sm truncate pr-2">
                        {nombre}
                      </span>
                      {/* Chip de Porcentaje Optimizado para Dark Mode */}
                      <span className="
                        text-xs font-mono font-bold px-2 py-1 rounded-md
                        bg-blue-50 text-blue-700
                        dark:bg-blue-500/10 dark:text-blue-300
                      ">
                        {porcentaje.toFixed(1)}%
                      </span>
                    </div>

                    {/* Barra de Progreso Optimizada */}
                    <div className="w-full h-2 rounded-full mb-2 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 dark:bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${porcentaje}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Total: <strong className="text-gray-700 dark:text-gray-300">{total}</strong></span>
                      {ciudad.activos > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          <span className="text-green-600 dark:text-green-400 font-medium">Activos: {ciudad.activos}</span>
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
        <div className="space-y-6">
          {/* Estados */}
          {data.estados.length > 0 && (
            <Card className="dark:bg-gray-800 border-none shadow-md">
              <CardHeader className="font-semibold gap-2 border-b border-gray-100 dark:border-gray-700">
                <HiCheckCircle className="text-green-600 dark:text-green-400" />
                <span className="dark:text-white">Estado de Cuenta</span>
              </CardHeader>
              <CardBody className="flex flex-wrap gap-2">
                {data.estados.map((est, i) => (
                  <Chip
                    key={i}
                    color={est.estado === "Activo" ? "success" : "danger"}
                    variant="flat"
                    className="capitalize border dark:border-transparent"
                  >
                    {est.estado}: {est.cantidad}
                  </Chip>
                ))}
              </CardBody>
            </Card>
          )}

          {/* Tarifas */}
          {data.tarifas.length > 0 && (
            <Card className="flex-1 dark:bg-gray-800 border-none shadow-md">
              <CardHeader className="font-semibold gap-2 border-b border-gray-100 dark:border-gray-700">
                <HiTrendingUp className="text-purple-600 dark:text-purple-400" />
                <span className="dark:text-white">Tarifas</span>
              </CardHeader>
              <CardBody className="space-y-3">
                {data.tarifas.map((t, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.tarifa_nombre}</p>
                      <p className="text-[10px] text-gray-400">{t.tarifa_descripcion}</p>
                    </div>
                    <span className="font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded text-xs">
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
      <Card className="overflow-visible dark:bg-gray-800 border-none shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 pt-6">
          <h3 className="text-lg font-semibold dark:text-white">Análisis Gráfico</h3>
          <Select
            size="sm"
            label="Visualizar"
            className="w-full sm:w-48"
            selectedKeys={[tipoGrafica]}
            onChange={(e) => handleCambioTipoGrafica(e.target.value)}
          >
            <SelectItem key="registros_mes">Registros Anuales</SelectItem>
            <SelectItem key="tendencia">Tendencia Histórica</SelectItem>
            <SelectItem key="ciudades">Por Ciudad</SelectItem>
            <SelectItem key="tarifas">Por Tarifa</SelectItem>
          </Select>
        </CardHeader>
        <CardBody className="px-6 pb-6">
          {renderChart()}
        </CardBody>
      </Card>

      {/* 5. Footer */}
      <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        {data.fechaActualizacion && `Última actualización de métricas: ${data.fechaActualizacion}`}
      </div>
    </div>
  );
};