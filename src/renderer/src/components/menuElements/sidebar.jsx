import { Sidebar, Badge } from "flowbite-react";
import { HiChartPie } from "react-icons/hi";
import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { ClientsIcon, HistorialIcon, ResibosIcon, ImpresionIcon, CerrarSeccionIcon, AyudaIcon,MedidoresIcon } from "../../IconsApp/IconsSidebar";
import { useAuth } from "../../context/AuthContext";
function SidebarApp() {
  const location = useLocation();
  const {logout} = useAuth();
  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen mt-20 transition-transform -translate-x-full border-r sm:translate-x-0 bg-gray-800 dark:bg-gray-800 dark:border-gray-700" aria-label="Sidebar">

      <Sidebar aria-label="Default sidebar example" className="-mt-4 h-dvh" >
        <Sidebar.Items >
          <Sidebar.ItemGroup>

            <Sidebar.Item as={Link} to="/home" icon={HiChartPie} label="" labelColor="dark" className={location.pathname === "/home" ? "flex items-center p-2 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-900  hover:bg-blue-500 dark:hover:bg-blue-900 " : "flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 group"}>
              Inicio
            </Sidebar.Item>
            <Sidebar.Item as={Link} to="/clientes" icon={ClientsIcon} label="" labelColor="dark" className={location.pathname === "/clientes" ? "flex items-center p-2 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-900 hover:bg-blue-500 dark:hover:bg-blue-900" : "flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 group"}>
              Clientes
            </Sidebar.Item>
            <Sidebar.Item as={Link} to="/medidores" icon={MedidoresIcon} label="" className={location.pathname === "/medidores" ? "flex items-center p-2 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-900 hover:bg-blue-500 dark:hover:bg-blue-900" : "flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 group"}>
              Medidores
            </Sidebar.Item>
            <Sidebar.Item as={Link} to="/resibos" icon={ResibosIcon} label="" className={location.pathname === "/resibos" ? "flex items-center p-2 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-900 hover:bg-blue-500 dark:hover:bg-blue-900" : "flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 group"}>
              Resibos
            </Sidebar.Item>
            <Sidebar.Item as={Link} to="/historial" icon={HistorialIcon} className={location.pathname === "/historial" ? "flex items-center p-2 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-900 hover:bg-blue-500 dark:hover:bg-blue-900" : "flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 group"}>
              Historial
            </Sidebar.Item>
            <Sidebar.Item as={Link} to="/impresion" icon={ImpresionIcon} className={location.pathname === "/impresion" ? "flex items-center p-2 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-900 hover:bg-blue-500 dark:hover:bg-blue-900" : "flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 group"}>
              Impresion
            </Sidebar.Item>
            <Sidebar.Item as={Link} to="/ayuda" icon={AyudaIcon} label="" className={location.pathname === "/ayuda" ? "flex items-center p-2 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-900 hover:bg-blue-500 dark:hover:bg-blue-900" : "flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-blue-200 dark:hover:bg-blue-700 group"}>
              Ayuda
            </Sidebar.Item>
            <Sidebar.Item  onClick={logout} icon={CerrarSeccionIcon} className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-red-200 dark:hover:bg-red-700 group">
              Cerrar Sesion
            </Sidebar.Item>
            <Sidebar.CTA>
              <div className="mb-3 flex items-center">
                <Badge color="warning">Beta</Badge>
                <button
                  aria-label="Close"
                  className="-m-1.5 ml-auto inline-flex h-6 w-6 rounded-lg bg-gray-100 p-1 text-cyan-900 hover:bg-gray-200 focus:ring-2 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                  type="button"
                >
                  <svg
                    aria-hidden
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <div className="mb-3 text-sm text-cyan-900 dark:text-gray-400">
                Aplicacion en version beta con nuevas funcionalidades y mejoras.
              </div>
              <a
                className="text-sm text-cyan-900 underline hover:text-cyan-800 dark:text-gray-400 dark:hover:text-gray-300"
                href="#"
              >
                Leer mas ...
              </a>
            </Sidebar.CTA>
          </Sidebar.ItemGroup>
        </Sidebar.Items>
      </Sidebar>

    </aside>

  )
}

export default SidebarApp;