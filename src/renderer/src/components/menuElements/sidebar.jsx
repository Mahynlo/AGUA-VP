import { Sidebar } from "flowbite-react";
import { HiChartPie } from "react-icons/hi";
import React from "react";
import { useLocation, Link } from "react-router-dom";
import {
  ClientsIcon,
  AyudaIcon,
  MedidoresIcon,
} from "../../IconsApp/IconsSidebar";
import {
  TarifaIcon,
  LecturasIcon,
  PagosIcon,
  ImpresionResibosIcon,
  HistorialResibosIcon,
} from "../../IconsApp/IconsResibos";
import { useAuth } from "../../context/AuthContext";

function SidebarApp() {
  const location = useLocation();
  const { logout } = useAuth();

  // Estilos mejorados para los items del sidebar
  const itemClass = (path) =>
    `w-full flex flex-col items-center justify-center py-2 px-1 rounded-xl mb-2 transition-all duration-300 ease-in-out group
    ${location.pathname === path
      ? "bg-blue-600 text-white shadow-lg scale-105 hover:bg-blue-600 hover:text-white" // Activo: Azul, blanco, sombra, ligero zoom, hover estable
      : "text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-blue-400" // Inactivo: Gris, hover azul
    }`;

  // Clase de icono optimizada
  const getIconClass = (path) =>
    `w-6 h-6 mb-1 transition-colors duration-300
    ${location.pathname === path
      ? "text-white"
      : "text-gray-400 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400"
    }`;

  return (
    <aside className="fixed top-0 left-0 z-40 w-24 h-screen pt-16 transition-transform -translate-x-full bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700" aria-label="Sidebar">
      <Sidebar aria-label="Default sidebar example" className="-mt-4 h-dvh mt-1/3 w-24">
        <Sidebar.Items>
          <Sidebar.ItemGroup>
            <Sidebar.Item
              as={Link}
              to="/home"
              icon={() => <HiChartPie className={getIconClass("/home")} />}
              className={itemClass("/home")}
            >
              Inicio
            </Sidebar.Item>

            <Sidebar.Item
              as={Link}
              to="/clientes"
              icon={() => <ClientsIcon className={getIconClass("/clientes")} />}
              className={itemClass("/clientes")}
            >
              Clientes
            </Sidebar.Item>

            <Sidebar.Item
              as={Link}
              to="/medidores"
              icon={() => <MedidoresIcon className={getIconClass("/medidores")} />}
              className={itemClass("/medidores")}
            >
              Medidores
            </Sidebar.Item>

            <Sidebar.Item
              as={Link}
              to="/resibos/lecturas"
              icon={() => <LecturasIcon className={getIconClass("/resibos/lecturas")} />}
              className={itemClass("/resibos/lecturas")}
            >
              Lecturas
            </Sidebar.Item>

            <Sidebar.Item
              as={Link}
              to="/resibos/impresion"
              icon={() => <ImpresionResibosIcon className={getIconClass("/resibos/impresion")} />}
              className={itemClass("/resibos/impresion")}
            >
              Impresion
            </Sidebar.Item>

            <Sidebar.Item
              as={Link}
              to="/resibos/tarifas"
              icon={() => <TarifaIcon className={getIconClass("/resibos/tarifas")} />}
              className={itemClass("/resibos/tarifas")}
            >
              Tarifas
            </Sidebar.Item>

            <Sidebar.Item
              as={Link}
              to="/resibos/pagos"
              icon={() => <PagosIcon className={getIconClass("/resibos/pagos")} />}
              className={itemClass("/resibos/pagos")}
            >
              Pagos
            </Sidebar.Item>

            <Sidebar.Item
              as={Link}
              to="/resibos/historial"
              icon={() => <HistorialResibosIcon className={getIconClass("/resibos/historial")} />}
              className={itemClass("/resibos/historial")}
            >
              Historial
            </Sidebar.Item>

            <Sidebar.Item
              as={Link}
              to="/ayuda"
              icon={() => <AyudaIcon className={getIconClass("/ayuda")} />}
              className={itemClass("/ayuda")}
            >
              Ayuda
            </Sidebar.Item>
          </Sidebar.ItemGroup>
        </Sidebar.Items>
      </Sidebar>
    </aside>
  );
}

export default SidebarApp;
