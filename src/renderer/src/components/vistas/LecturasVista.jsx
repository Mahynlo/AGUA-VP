import { Link, useNavigate } from "react-router-dom";
import { Button, Modal } from "flowbite-react";
import { Tabs, Tab, Card, CardBody } from "@nextui-org/react";
import { FlechaReturnIcon } from "../../IconsApp/IconsAppSystem";
import { useState } from "react";
import ModalLectura from "./lecturas/ModalLectura";
import CarruselLecturasModal from "./lecturas/CarruselLecturasModal";



import TabRutas from "./lecturas/TabRutas";

import { LecturasIcon,RutaLecturaIcon,MetricasLecturaIcon } from "../../IconsApp/IconsResibos";
const Lecturas = () => {
  const navigate = useNavigate(); // Hook de navegación
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div class="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div className="w-full h-full bg-white overflow-x-hidden gap-4 p-4 rounded-lg shadow-md dark:bg-gray-800">


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
            <Tab key="Rutas"
              title={
                <div className="flex items-center gap-2">
                  <RutaLecturaIcon className="w-6 h-6" />
                  <span>Rutas </span>
                </div>
              }
            >
              <TabRutas />
            </Tab>
            <Tab
              key="Lecturas"
              title={
                <div className="flex items-center gap-2">
                  <LecturasIcon className="w-6 h-6" />
                  <span>Lecturas</span>
                </div>
              }
            >
              <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Lecturas</h1>
                    <Button color="gray" className="mb-6" onClick={() => navigate(-1)}>
                      <FlechaReturnIcon className="w-6 h-6" />
                      <span className="ml-2">Volver</span>
                    </Button>
                  </div>
                  
            </Tab>
            <Tab key="Metricas"
              title={
                <div className="flex items-center gap-2">
                  <MetricasLecturaIcon className="w-6 h-6" />
                  <span>Metricas</span>
                </div>
              }
            >
              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Metricas</h1>
                    <Button color="gray" className="mb-6" onClick={() => navigate(-1)}>
                      <FlechaReturnIcon className="w-6 h-6" />
                      <span className="ml-2">Volver</span>
                    </Button>
                  </div>
                  Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
                  mollit anim id est laborum.
                
                </CardBody>
              </Card>
            </Tab>
          </Tabs>
        </div>





      </div>

    </div>
  )
};

export default Lecturas;