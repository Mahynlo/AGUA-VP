import { Link, useNavigate } from "react-router-dom";
import { Button } from "flowbite-react";
import { FlechaReturnIcon } from "../../IconsApp/IconsAppSystem";
import { TabClientes } from "./clientes/TabClientes";
const Lecturas = () => {
  const navigate = useNavigate(); // Hook de navegación
  return (
    <div class="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div class="text-2xl font-bold text-gray-900 dark:text-white">
        <Button color="gray" className="mb-4" onClick={() => navigate(-1)}>

          <FlechaReturnIcon className="w-6 h-6" />
          <span className="mr-2">Volver</span>
        </Button>
        Lecturas
      </div>
     <TabClientes/>
      

    </div>
  )
};

export default Lecturas;