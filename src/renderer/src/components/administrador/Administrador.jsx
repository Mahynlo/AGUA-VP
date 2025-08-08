import { useState } from "react";
import { Tabs, Tab } from "@nextui-org/react";
import { 
  DashboardIcon, 
  GestionClientesIcon, 
  GestionMedidoresIcon, 
  LecturasAdminIcon,
  FacturacionAdminIcon,
  PagosAdminIcon,
  TarifasAdminIcon,
  ConfiguracionAdminIcon,
  MantenimientoIcon,
  UsuariosAdminIcon
} from "../../IconsApp/IconsAdmin";

// Importar componentes
import DashboardAdmin from "./DashboardAdmin";
import GestionClientes from "./GestionClientes";
import GestionMedidores from "./GestionMedidores";
import GestionUsuarios from "./GestionUsuarios";

export default function Administrador() {
  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div className="w-full h-full bg-white overflow-x-hidden gap-4 p-2 rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex w-full flex-col">
          <Tabs
            aria-label="Panel de Administración"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-[#22d3ee]",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-[#06b6d4]",
            }}
            color="primary"
            variant="underlined"
            placement="top"
          >
            <Tab
              key="dashboard"
              title={
                <div className="flex items-center gap-2">
                  <DashboardIcon className="w-5 h-5" />
                  <span>Dashboard</span>
                </div>
              }
            >
              <DashboardAdmin />
            </Tab>
            
            <Tab
              key="clientes"
              title={
                <div className="flex items-center gap-2">
                  <GestionClientesIcon className="w-5 h-5" />
                  <span>Clientes</span>
                </div>
              }
            >
              <GestionClientes />
            </Tab>
            
            <Tab
              key="medidores"
              title={
                <div className="flex items-center gap-2">
                  <GestionMedidoresIcon className="w-5 h-5" />
                  <span>Medidores</span>
                </div>
              }
            >
              <GestionMedidores />
            </Tab>
            
            <Tab
              key="lecturas"
              title={
                <div className="flex items-center gap-2">
                  <LecturasAdminIcon className="w-5 h-5" />
                  <span>Lecturas</span>
                </div>
              }
            >
              <div className="p-4">
                <h2 className="text-2xl font-bold mb-4">Gestión de Lecturas</h2>
                <p>Componente en desarrollo...</p>
              </div>
            </Tab>
            
            <Tab
              key="facturacion"
              title={
                <div className="flex items-center gap-2">
                  <FacturacionAdminIcon className="w-5 h-5" />
                  <span>Facturación</span>
                </div>
              }
            >
              <div className="p-4">
                <h2 className="text-2xl font-bold mb-4">Sistema de Facturación</h2>
                <p>Componente en desarrollo...</p>
              </div>
            </Tab>
            
            <Tab
              key="pagos"
              title={
                <div className="flex items-center gap-2">
                  <PagosAdminIcon className="w-5 h-5" />
                  <span>Pagos</span>
                </div>
              }
            >
              <div className="p-4">
                <h2 className="text-2xl font-bold mb-4">Gestión de Pagos</h2>
                <p>Componente en desarrollo...</p>
              </div>
            </Tab>
            
            <Tab
              key="tarifas"
              title={
                <div className="flex items-center gap-2">
                  <TarifasAdminIcon className="w-5 h-5" />
                  <span>Tarifas</span>
                </div>
              }
            >
              <div className="p-4">
                <h2 className="text-2xl font-bold mb-4">Gestión de Tarifas</h2>
                <p>Componente en desarrollo...</p>
              </div>
            </Tab>
            
            <Tab
              key="mantenimiento"
              title={
                <div className="flex items-center gap-2">
                  <MantenimientoIcon className="w-5 h-5" />
                  <span>Mantenimiento</span>
                </div>
              }
            >
              <div className="p-4">
                <h2 className="text-2xl font-bold mb-4">Módulo de Mantenimiento</h2>
                <p>Componente en desarrollo...</p>
              </div>
            </Tab>
            
            <Tab
              key="configuracion"
              title={
                <div className="flex items-center gap-2">
                  <ConfiguracionAdminIcon className="w-5 h-5" />
                  <span>Configuración</span>
                </div>
              }
            >
              <div className="p-4">
                <h2 className="text-2xl font-bold mb-4">Configuración del Sistema</h2>
                <p>Componente en desarrollo...</p>
              </div>
            </Tab>
            
            <Tab
              key="usuarios"
              title={
                <div className="flex items-center gap-2">
                  <UsuariosAdminIcon className="w-5 h-5" />
                  <span>Usuarios</span>
                </div>
              }
            >
              <GestionUsuarios />
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
