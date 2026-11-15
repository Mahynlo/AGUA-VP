import { Skeleton } from "@heroui/react";
import { HiDocumentText, HiChartBar } from "react-icons/hi";
import React, { useState } from "react";

import TabRutas from "./components/TabRutas";
import TabMetricas from "./components/TabMetricas";
import { useRutas } from "../../context/RutasContext";
import { EncabezadoVista, PestanasVista, ProveedorIndicadores } from "../../components/ui/VistaModulo";

import { LecturasIcon } from "../../IconsApp/IconsResibos";

// Pestañas de la vista (cada pestaña coloca sus indicadores junto al título del módulo)
const TABS = [
  { key: "lecturas", label: "Registro de Lecturas", icon: HiDocumentText },
  { key: "metricas", label: "Métricas y Reportes", icon: HiChartBar }
];

const Lecturas = () => {
  const { initialLoading } = useRutas();

  // Estado para la pestaña activa, recuperado de localStorage
  const [selectedTab, setSelectedTab] = useState(() => {
    return localStorage.getItem("lecturas_activeTab") || "lecturas";
  });

  const handleTabChange = (key) => {
    setSelectedTab(key);
    localStorage.setItem("lecturas_activeTab", key);
  };

  // ESTADO DE CARGA INICIAL
  if (initialLoading) {
    return (
      <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20">
        <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-5 sm:p-6 lg:p-8 flex flex-col gap-6 mb-12">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="flex flex-col gap-2">
              <Skeleton className="w-48 h-6 rounded-lg" />
              <Skeleton className="w-72 h-4 rounded-lg" />
            </div>
          </div>
          <Skeleton className="w-80 h-10 rounded-lg" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    // CONTENEDOR PRINCIPAL: Padding exterior fluido y fondo gris sutil
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20 scroll-smooth">

      {/* CONTENEDOR DE LA VISTA (las pestañas colocan sus indicadores junto al título) */}
      <ProveedorIndicadores>
      <div className="w-full min-h-full min-w-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-5 sm:p-6 lg:p-8 flex flex-col">

        {/* ── 1. ENCABEZADO ── */}
        <EncabezadoVista
          icon={LecturasIcon}
          acento="amber"
          titulo="Sistema de Lecturas"
          descripcion="Rutas, captura de lecturas y rendimiento operativo."
        />

        {/* ── 2. NAVEGACIÓN (TABS) Y CONTENIDO ── */}
        <div className="flex flex-col w-full flex-1 min-w-0 mt-6">
          <PestanasVista tabs={TABS} activa={selectedTab} onChange={handleTabChange} acento="amber" />

          {/* CONTENIDOS */}
          {selectedTab === "lecturas" && (
            <div className="h-full flex flex-col min-w-0">
              <TabRutas />
            </div>
          )}

          {selectedTab === "metricas" && (
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

export default Lecturas;
