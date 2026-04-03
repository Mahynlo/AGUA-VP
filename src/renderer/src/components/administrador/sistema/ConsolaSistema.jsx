/**
 * ConsolaSistema — Consola de administración del sistema
 *
 * Agrupa todos los paneles de administración del sistema:
 *  - Info del Sistema (estado general)
 *  - Logs (visor en tiempo real)
 *  - Backups (gestión de respaldos)
 *  - Base de Datos (info + migraciones)
 *  - Actualizaciones (verificar/descargar/instalar)
 */

import { useState } from "react";
import { Tabs, Tab, Chip } from "@nextui-org/react";
import {
  HiChartBar, HiClipboardList, HiSave, HiDatabase, HiRefresh
} from "react-icons/hi";

import ErrorBoundary from "./ErrorBoundary";
import PanelInfoSistema from "./PanelInfoSistema";
import PanelLogs from "./PanelLogs";
import PanelBackups from "./PanelBackups";
import PanelBaseDatos from "./PanelBaseDatos";
import PanelActualizaciones from "./PanelActualizaciones";

export default function ConsolaSistema() {
  const [activeTab, setActiveTab] = useState("info");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Consola del Sistema
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monitoreo, mantenimiento y configuración del sistema
          </p>
        </div>
        <Chip variant="flat" color="warning" size="sm">
          Solo Administradores
        </Chip>
      </div>

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
        variant="bordered"
        color="primary"
        classNames={{
          tabList: "gap-4",
          tab: "h-10",
        }}
      >
        <Tab
          key="info"
          title={
            <div className="flex items-center gap-2">
              <HiChartBar className="w-4 h-4" />
              <span>Sistema</span>
            </div>
          }
        >
          <div className="mt-3">
            <ErrorBoundary>
              <PanelInfoSistema />
            </ErrorBoundary>
          </div>
        </Tab>

        <Tab
          key="logs"
          title={
            <div className="flex items-center gap-2">
              <HiClipboardList className="w-4 h-4" />
              <span>Logs</span>
            </div>
          }
        >
          <div className="mt-3">
            <ErrorBoundary>
              <PanelLogs />
            </ErrorBoundary>
          </div>
        </Tab>

        <Tab
          key="backups"
          title={
            <div className="flex items-center gap-2">
              <HiSave className="w-4 h-4" />
              <span>Backups</span>
            </div>
          }
        >
          <div className="mt-3">
            <ErrorBoundary>
              <PanelBackups />
            </ErrorBoundary>
          </div>
        </Tab>

        <Tab
          key="basedatos"
          title={
            <div className="flex items-center gap-2">
              <HiDatabase className="w-4 h-4" />
              <span>Base de Datos</span>
            </div>
          }
        >
          <div className="mt-3">
            <ErrorBoundary>
              <PanelBaseDatos />
            </ErrorBoundary>
          </div>
        </Tab>

        <Tab
          key="actualizaciones"
          title={
            <div className="flex items-center gap-2">
              <HiRefresh className="w-4 h-4" />
              <span>Actualizaciones</span>
            </div>
          }
        >
          <div className="mt-3">
            <ErrorBoundary>
              <PanelActualizaciones />
            </ErrorBoundary>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
