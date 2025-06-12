import React from "react";
import { Tabs } from "flowbite-react";
import { HiAdjustments, HiClipboardList, HiUserCircle } from "react-icons/hi";
import { MdDashboard } from "react-icons/md";
import { TabClientes } from "./TabClientes";
import { TabMetricas } from "./TabMetricas";


const Clientes = () => {
  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div className="w-full h-full bg-white overflow-x-hidden p-4 rounded-lg shadow-md dark:bg-gray-800">
        <Tabs aria-label="Default tabs" variant="default" className="bg-gray-100 dark:bg-gray-800" >
          <Tabs.Item active title="Clientes" icon={HiUserCircle} >
            <TabClientes />
          </Tabs.Item>

          <Tabs.Item title="Metricas" icon={HiAdjustments}>
            <TabMetricas />
          </Tabs.Item>

        </Tabs>
      </div>




    </div>
  )
};

export default Clientes;
