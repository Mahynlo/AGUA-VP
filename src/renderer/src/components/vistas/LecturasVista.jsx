import { Link, useNavigate } from "react-router-dom";
import { Button } from "flowbite-react";
import { FlechaReturnIcon } from "../../IconsApp/IconsAppSystem";
import { TabClientes } from "./clientes/TabClientes";
import { useState } from "react";
import ModalLectura from "./lecturas/ModalLectura";
import CarruselLecturasModal from "./lecturas/CarruselLecturasModal";
const Lecturas = () => {
  const navigate = useNavigate(); // Hook de navegación
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div class="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div className="w-full h-full bg-white overflow-x-hidden gap-4 p-4 rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Lecturas</h1>
          <Button color="gray" className="mb-6" onClick={() => navigate(-1)}>
            <FlechaReturnIcon className="w-6 h-6" />
            <span className="ml-2">Volver</span>
          </Button>
        </div>
        <CarruselLecturasModal />

      </div>

    </div>
  )
};

export default Lecturas;