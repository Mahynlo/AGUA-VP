import React from "react";

import { HiAdjustments, HiClipboardList, HiUserCircle } from "react-icons/hi";
import { MdDashboard } from "react-icons/md";
import { TabClientes } from "./TabClientes";
import { TabMetricas } from "./TabMetricas";
import { Tabs, Tab, Card, CardBody } from "@nextui-org/react";
import { MetricasLecturaIcon } from "../../../IconsApp/IconsResibos";

const Clientes = () => {
  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div className="w-full h-full bg-white overflow-x-hidden p-4 rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex w-full flex-col">
          <Tabs
            aria-label="Options"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-[#22d3ee]",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-[#06b6d4]",
            }}
            color="primary"
            variant="underlined"
          >
            <Tab key="Clientes"
              title={
                <div className="flex items-center gap-2">
                  <HiUserCircle className="w-6 h-6" />
                  <span>Clientes</span>
                </div>
              }
            >
              <TabClientes />
            </Tab>
            <Tab key="Metricas"
              title={
                <div className="flex items-center gap-2">
                  <MetricasLecturaIcon className="w-6 h-6" />
                  <span>Metricas</span>
                </div>
              }
            >
              <TabMetricas />
            </Tab>
          </Tabs>
        </div>

      </div>




    </div>
  )
};

export default Clientes;
