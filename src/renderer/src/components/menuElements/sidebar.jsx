import { Sidebar } from "flowbite-react";
import { HiChartPie } from "react-icons/hi";
import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { ClientsIcon, HistorialIcon, ResibosIcon, ImpresionIcon, CerrarSeccionIcon, AyudaIcon } from "../../IconsApp/IconsSidebar";

function SidebarApp() {
    const location = useLocation();

    return (
        <aside className="fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform -translate-x-full border-r sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700" aria-label="Sidebar">

            <Sidebar aria-label="Default sidebar example" >
                <Sidebar.Items className="">
                    <Sidebar.ItemGroup>

                        <Sidebar.Item as={Link} to="/" icon={HiChartPie} label="" labelColor="dark" className={location.pathname === "/" ? "flex items-center p-2 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-900 " : "flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-blue-100 dark:hover:bg-blue-700 group"}>
                            Dashboard
                        </Sidebar.Item>
                        <Sidebar.Item as={Link} to="/clientes" icon={ClientsIcon} label="" labelColor="dark" className={location.pathname === "/clientes" ? "flex items-center p-2 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-900 " : "flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-blue-100 dark:hover:bg-blue-700 group"}>
                            Clientes
                        </Sidebar.Item>
                        <Sidebar.Item as={Link} to="/resibos" icon={ResibosIcon} label="" className={location.pathname === "/resibos" ? "flex items-center p-2 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-900 " : "flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-blue-100 dark:hover:bg-blue-700 group"}>
                            Resibos
                        </Sidebar.Item>
                        <Sidebar.Item as={Link} to="/historial" icon={HistorialIcon} className={location.pathname === "/historial" ? "flex items-center p-2 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-900 " : "flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-blue-100 dark:hover:bg-blue-700 group"}>
                            Historial
                        </Sidebar.Item>
                        <Sidebar.Item as={Link} to="/impresion" icon={ImpresionIcon} className={location.pathname === "/impresion" ? "flex items-center p-2 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-900 " : "flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-blue-100 dark:hover:bg-blue-700 group"}>
                            Impresion
                        </Sidebar.Item>
                        <Sidebar.Item as={Link} to="/ayuda" icon={AyudaIcon} label="" className={location.pathname === "/ayuda" ? "flex items-center p-2 rounded-lg  bg-blue-500 dark:bg-blue-900 dark:text-white text-gray-900 " : "flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-blue-100 dark:hover:bg-blue-700 group"}>
                            Ayuda
                        </Sidebar.Item>
                        <Sidebar.Item href="#" icon={CerrarSeccionIcon} className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-red-100 dark:hover:bg-red-700 group">
                            Cerrar Sesion
                        </Sidebar.Item>

                    </Sidebar.ItemGroup>
                </Sidebar.Items>
            </Sidebar>

        </aside>

    )
}

export default SidebarApp;