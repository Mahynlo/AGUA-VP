import { Sidebar } from "flowbite-react";
import { HiChartPie } from "react-icons/hi";
import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { ClientsIcon, ResibosIcon, CerrarSeccionIcon, AyudaIcon, MedidoresIcon } from "../../IconsApp/IconsSidebar";
import { TarifaIcon, LecturasIcon, PagosIcon, ImpresionResibosIcon, HistorialResibosIcon } from "../../IconsApp/IconsResibos";
import {CalendarioHomeIcon} from "../../IconsApp/IconsHome";
import { useAuth } from "../../context/AuthContext";
function SidebarApp() {
  const location = useLocation();
  const { logout } = useAuth();
  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen mt-20 transition-transform -translate-x-full border-r sm:translate-x-0 bg-gray-800 dark:bg-gray-800 dark:border-gray-700" aria-label="Sidebar">

      <Sidebar aria-label="Default sidebar example" className="-mt-4 h-dvh" >
        <Sidebar.Items >
          <Sidebar.ItemGroup>

            <Sidebar.Item as={Link} to="/home" icon={HiChartPie} label="" labelColor="dark" className={location.pathname === "/home" ? "flex items-center p-2 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-100  hover:bg-blue-500 dark:hover:bg-blue-900 " : "flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 group"}>
              Inicio
            </Sidebar.Item>
            <Sidebar.Item as={Link} to="/clientes" icon={ClientsIcon} label="" labelColor="dark" className={location.pathname === "/clientes" ? "flex items-center p-2 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-100 hover:bg-blue-500 dark:hover:bg-blue-900" : "flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 group"}>
              Clientes
            </Sidebar.Item>
            <Sidebar.Item as={Link} to="/medidores" icon={MedidoresIcon} label="" className={location.pathname === "/medidores" ? "flex items-center p-2 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-100 hover:bg-blue-500 dark:hover:bg-blue-900" : "flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 group"}>
              Medidores
            </Sidebar.Item>


            <Sidebar.Collapse icon={ResibosIcon} label="Resibos" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 group">
              <Sidebar.Item as={Link} to="/resibos" icon={CalendarioHomeIcon} label="" className={location.pathname === "/resibos" ? "flex items-center p-2 ml-4 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-100 hover:bg-blue-500 dark:hover:bg-blue-900" : "flex items-center p-2 ml-4 text-gray-900 rounded-lg dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 group"}>
                Resibos Calendario
              </Sidebar.Item>
              <Sidebar.Item as={Link} to="/resibos/lecturas" icon={LecturasIcon} label="" className={location.pathname === "/resibos/lecturas" ? "flex items-center p-2 ml-4 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-100 hover:bg-blue-500 dark:hover:bg-blue-900" : "flex items-center p-2 ml-4 text-gray-900 rounded-lg dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 group"}>
                Lecturas
              </Sidebar.Item>
              <Sidebar.Item as={Link} to="/resibos/impresion" icon={ImpresionResibosIcon} label="" className={location.pathname === "/resibos/impresion" ? "flex items-center p-2 ml-4 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-100 hover:bg-blue-500 dark:hover:bg-blue-900" : "flex items-center p-2 ml-4 text-gray-900 rounded-lg dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 group"}>
                Impresion
              </Sidebar.Item>
              <Sidebar.Item as={Link} to="/resibos/tarifas" icon={ TarifaIcon} label="" className={location.pathname === "/resibos/tarifas" ? "flex items-center p-2 ml-4 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-100 hover:bg-blue-500 dark:hover:bg-blue-900" : "flex items-center p-2 ml-4 text-gray-900 rounded-lg dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 group"}>
                Tarifas
              </Sidebar.Item>
              <Sidebar.Item as={Link} to="/resibos/pagos" icon={PagosIcon} label="" className={location.pathname === "/resibos/pagos" ? "flex items-center p-2 ml-4 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-100 hover:bg-blue-500 dark:hover:bg-blue-900" : "flex items-center p-2 ml-4 text-gray-900 rounded-lg dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 group"}>
                Pagos
              </Sidebar.Item>
              <Sidebar.Item as={Link} to="/resibos/historial" icon={HistorialResibosIcon} label="" className={location.pathname === "/resibos/historial" ? "flex items-center p-2 ml-4 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-100 hover:bg-blue-500 dark:hover:bg-blue-900" : "flex items-center p-2 ml-4 text-gray-900 rounded-lg dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 group"}>
                Historial
              </Sidebar.Item>

            </Sidebar.Collapse>

            <Sidebar.Item as={Link} to="/ayuda" icon={AyudaIcon} label="" className={location.pathname === "/ayuda" ? "flex items-center p-2 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-100 hover:bg-blue-500 dark:hover:bg-blue-900" : "flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 group"}>
              Ayuda
            </Sidebar.Item>
            {/*<Sidebar.Item onClick={logout} icon={CerrarSeccionIcon} className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-red-200 dark:hover:bg-red-700 group">
              Cerrar Sesion
            </Sidebar.Item>*/}

          </Sidebar.ItemGroup>
        </Sidebar.Items>
      </Sidebar>

    </aside>

  )
}

export default SidebarApp;