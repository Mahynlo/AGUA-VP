import React, { useMemo, useState } from "react";
import { HiCheck, HiLocationMarker, HiMap, HiTable, HiCube, HiSparkles } from "react-icons/hi";

import { useMedidores } from "../../context/MedidoresContext";
import { MedidoresIcon } from "../../IconsApp/IconsSidebar";
import LoadingSkeleton from "./components/LoadingSkeleton";
import { EncabezadoVista, PestanasVista, Indicador, IndicadoresVista, ProveedorIndicadores } from "../../components/ui/VistaModulo";

// Componentes de Pestañas
import TabMapaMedidores from "./components/TabMapaMedidores";
import TabInventarioMedidores from "./components/TabInventarioMedidores";

const Medidores = () => {
  const {
    allMedidores,
    medidoresAsignados,
    medidoresNoAsignados,
    initialLoading
  } = useMedidores();

  // Estado para la pestaña activa, recuperado de localStorage
  const [selectedTab, setSelectedTab] = useState(() => {
    return localStorage.getItem("medidores_activeTab") || "mapa";
  });

  const handleTabChange = (key) => {
    setSelectedTab(key);
    localStorage.setItem("medidores_activeTab", key);
  };

  // Estadísticas calculadas desde allMedidores (dataset completo)
  const estadisticas = useMemo(() => {
    if (initialLoading) {
      return { total: 0, asignados: 0, libres: 0, activos: 0, inactivos: 0, porcentajeAsignados: 0, porcentajeActivos: 0 };
    }
    if (!allMedidores || allMedidores.length === 0) {
      return { total: 0, asignados: 0, libres: 0, activos: 0, inactivos: 0, porcentajeAsignados: 0, porcentajeActivos: 0 };
    }
    const activos = allMedidores.filter(m => m.estado_medidor === "Activo").length;
    const inactivos = allMedidores.filter(m => m.estado_medidor === "Inactivo").length;
    return {
      total: allMedidores.length,
      asignados: medidoresAsignados.length,
      libres: medidoresNoAsignados.length,
      activos,
      inactivos,
      porcentajeAsignados: allMedidores.length > 0 ? (medidoresAsignados.length / allMedidores.length * 100) : 0,
      porcentajeActivos: allMedidores.length > 0 ? (activos / allMedidores.length * 100) : 0
    };
  }, [allMedidores, medidoresAsignados, medidoresNoAsignados, initialLoading]);

  // ESTADO DE CARGA INICIAL
  if (initialLoading) {
    return (
      <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20">
        <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-5 sm:p-6 lg:p-8 flex flex-col gap-6 mb-12">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  const pct = (n) => `${n.toFixed(0)}% del total`;

  const tabs = [
    { key: "mapa", label: "Mapa y Ubicaciones", icon: HiMap },
    { key: "inventario", label: "Inventario General", icon: HiTable, contador: estadisticas.total.toLocaleString('es-MX') }
  ];

  return (
    // CONTENEDOR PRINCIPAL: Padding exterior fluido y fondo gris sutil
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20 scroll-smooth">

      {/* CONTENEDOR DE LA VISTA (las pestañas colocan sus indicadores junto al título) */}
      <ProveedorIndicadores>
      <div className="w-full min-h-full min-w-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-5 sm:p-6 lg:p-8 flex flex-col">

        {/* ── 1. ENCABEZADO ── */}
        <EncabezadoVista
          icon={MedidoresIcon}
          acento="blue"
          titulo="Gestión de Medidores"
          descripcion="Inventario de equipos, su ubicación y su asignación a predios."
        />

        {/* ── 2. NAVEGACIÓN (TABS) Y CONTENIDO ── */}
        <div className="flex flex-col w-full flex-1 min-w-0 mt-6">
          <PestanasVista tabs={tabs} activa={selectedTab} onChange={handleTabChange} acento="blue" />

          {/* CONTENIDOS */}
          {selectedTab === "mapa" && (
            <div className="h-full flex flex-col min-w-0">
              <TabMapaMedidores />
            </div>
          )}

          {selectedTab === "inventario" && (
            <div className="h-full flex flex-col min-w-0">
              {/* Indicadores del inventario, junto al título del módulo (el mapa coloca los suyos) */}
              <IndicadoresVista>
                <Indicador icon={HiCube} tint="bg-blue-500/10 text-blue-600 dark:text-blue-400" label="Total" value={estadisticas.total.toLocaleString('es-MX')} detalle="Equipos en el inventario activo" />
                <Indicador icon={HiCheck} tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" label="Asignados" value={estadisticas.asignados.toLocaleString('es-MX')} valueClass="text-emerald-600 dark:text-emerald-400" detalle={`Vinculados a un cliente · ${pct(estadisticas.porcentajeAsignados)}`} />
                <Indicador icon={HiSparkles} tint="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" label="Disponibles" value={estadisticas.libres.toLocaleString('es-MX')} detalle="Sin cliente asignado" />
                <Indicador icon={HiLocationMarker} tint="bg-orange-500/10 text-orange-600 dark:text-orange-400" label="En servicio" value={estadisticas.activos.toLocaleString('es-MX')} detalle={`Medidores activos · ${pct(estadisticas.porcentajeActivos)}`} />
              </IndicadoresVista>
              <TabInventarioMedidores />
            </div>
          )}
        </div>

      </div>
      </ProveedorIndicadores>
    </div>
  );
};

export default Medidores;
