import React, { useState, useEffect, useMemo } from "react";
import { HiUserCircle, HiUsers, HiUserAdd, HiMap } from "react-icons/hi";
import { TabClientes } from "./components/TabClientes";
import { TabMetricas } from "./components/TabMetricas";
import { Skeleton } from "@heroui/react";
import { MetricasLecturaIcon } from "../../IconsApp/IconsResibos";
import { useClientes } from "../../context/ClientesContext";
import { EncabezadoVista, PestanasVista, Indicador, IndicadoresVista, ProveedorIndicadores } from "../../components/ui/VistaModulo";

const Clientes = () => {
  const { clientes, allClientes, pagination, estadisticasServidor, initialLoading } = useClientes();

  // Estado para la pestaña activa, recuperado de localStorage
  const [selectedTab, setSelectedTab] = useState(() => {
    return localStorage.getItem("clientes_activeTab") || "Clientes";
  });

  const handleTabChange = (key) => {
    setSelectedTab(key);
    localStorage.setItem("clientes_activeTab", key);
  };

  // Calcular estadísticas reales basadas en los datos
  const estadisticas = useMemo(() => {
    if (initialLoading) {
      return {
        total: 0,
        activos: 0,
        nuevosEsteMes: 0,
        ciudades: 0
      };
    }

    const resumen = estadisticasServidor?.resumen || {};
    const totalClientes = pagination?.total ?? resumen.total_clientes ?? allClientes?.length ?? clientes?.length ?? 0;
    const clientesBase = (allClientes && allClientes.length > 0) ? allClientes : (clientes || []);

    if (clientesBase.length > 0 || totalClientes > 0) {
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      const nuevosEsteMes = resumen.clientes_ultimo_mes ?? clientesBase.filter(cliente => {
        if (cliente.fechaRegistro) {
          const fechaRegistro = new Date(cliente.fechaRegistro);
          return fechaRegistro >= inicioMes;
        }
        return false;
      }).length;

      const ciudadesUnicas = resumen?.distribucion?.por_ciudad?.length
        ? resumen.distribucion.por_ciudad.length
        : [...new Set(clientesBase.map(cliente => cliente.ciudad).filter(Boolean))].length;

      return {
        total: totalClientes,
        activos: resumen.clientes_activos ?? clientesBase.filter(cliente => cliente.estado === "Activo" || !cliente.estado).length,
        nuevosEsteMes,
        ciudades: ciudadesUnicas
      };
    }

    return {
      total: 0,
      activos: 0,
      nuevosEsteMes: 0,
      ciudades: 0
    };
  }, [allClientes, clientes, estadisticasServidor, pagination, initialLoading]);

  // ESTADO DE CARGA INICIAL
  if (initialLoading && !clientes?.length) {
    return (
      <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20">
        <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-5 sm:p-6 lg:p-8 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="flex flex-col gap-2">
                <Skeleton className="w-48 h-6 rounded-lg" />
                <Skeleton className="w-72 h-4 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
               {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
               {[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
            </div>
        </div>
      </div>
    );
  }

  const valorKpi = (n) => (initialLoading
    ? <Skeleton className="h-7 w-14 rounded-lg bg-slate-200 dark:bg-zinc-800" />
    : n.toLocaleString('es-MX'));

  const tabs = [
    { key: "Clientes", label: "Directorio", icon: HiUserCircle, contador: estadisticas.total.toLocaleString('es-MX') },
    { key: "Metricas", label: "Análisis", icon: MetricasLecturaIcon }
  ];

  return (
    // CONTENEDOR PRINCIPAL: Padding exterior fluido y fondo gris sutil
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20 scroll-smooth">

      {/* CONTENEDOR DE LA VISTA (las pestañas colocan sus indicadores junto al título) */}
      <ProveedorIndicadores>
      <div className="w-full min-h-full min-w-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-5 sm:p-6 lg:p-8 flex flex-col">

        {/* ── 1. ENCABEZADO ── */}
        <EncabezadoVista
          icon={HiUsers}
          acento="blue"
          titulo="Gestión de Clientes"
          descripcion="Padrón de usuarios del servicio, su estado y su análisis."
        />

        {/* ── 2. NAVEGACIÓN (TABS) Y CONTENIDO ── */}
        <div className="flex flex-col w-full flex-1 min-w-0 mt-6">
          <PestanasVista tabs={tabs} activa={selectedTab} onChange={handleTabChange} acento="blue" />

          {/* CONTENIDO */}
          {selectedTab === "Clientes" && (
            <div className="h-full flex flex-col min-w-0">
              {/* Indicadores del padrón, junto al título del módulo (Análisis coloca los suyos) */}
              <IndicadoresVista>
                <Indicador icon={HiUsers} tint="bg-blue-500/10 text-blue-600 dark:text-blue-400" label="Total de clientes" value={valorKpi(estadisticas.total)} detalle="Registrados en el padrón" />
                <Indicador icon={HiUserCircle} tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" label="Activos" value={valorKpi(estadisticas.activos)} valueClass="text-emerald-600 dark:text-emerald-400" detalle="Con servicio vigente" />
                <Indicador icon={HiUserAdd} tint="bg-purple-500/10 text-purple-600 dark:text-purple-400" label="Nuevos este mes" value={valorKpi(estadisticas.nuevosEsteMes)} detalle="Altas del mes en curso" />
                <Indicador icon={HiMap} tint="bg-orange-500/10 text-orange-600 dark:text-orange-400" label="Ciudades" value={valorKpi(estadisticas.ciudades)} detalle="Localidades con clientes" />
              </IndicadoresVista>
              <TabClientes />
            </div>
          )}

          {selectedTab === "Metricas" && (
            <div className="h-full flex flex-col min-w-0">
              <TabMetricas />
            </div>
          )}
        </div>

      </div>
      </ProveedorIndicadores>
    </div>
  );
};

export default Clientes;
