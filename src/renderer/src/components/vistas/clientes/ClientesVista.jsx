import React from "react";
import { Tabs } from "flowbite-react";
import { HiAdjustments, HiClipboardList, HiUserCircle } from "react-icons/hi";
import { MdDashboard } from "react-icons/md";
import { TabClientes } from "./TabClientes";
import { TabRegistro } from "./TabRegistro";
const Clientes = () => {
  return (
    <div className="p-4 sm:ml-64 pt-20 min-h-screen">

      <Tabs aria-label="Default tabs" variant="default" className="bg-gray-100 dark:bg-gray-800" >
        <Tabs.Item active title="Clientes" icon={HiUserCircle} >
          <TabClientes/>
        </Tabs.Item>
        <Tabs.Item title="Registro"  icon={HiClipboardList}>
          <TabRegistro />
        </Tabs.Item>
        <Tabs.Item title="Metricas" icon={HiAdjustments}>
          This is <span className="font-medium text-gray-800 dark:text-white">Settings tab's associated content</span>.
          Clicking another tab will toggle the visibility of this one for the next. The tab JavaScript swaps classNamees to
          control the content visibility and styling.
        </Tabs.Item>
        <Tabs.Item title="Info" icon={HiClipboardList}>
          This is <span className="font-medium text-gray-800 dark:text-white">Contacts tab's associated content</span>.
          Clicking another tab will toggle the visibility of this one for the next. The tab JavaScript swaps classNamees to
          control the content visibility and styling.
        </Tabs.Item>
      </Tabs>

    </div>
  )
};

export default Clientes;
