import { Button } from "@nextui-org/react";
import { FlechaReturnIcon } from "../../../IconsApp/IconsAppSystem";
import { useNavigate } from "react-router-dom";
import ReporteFinancieroEstado from "../impresion/components/ReporteFinancieroEstado";

const TabEstadisticas = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Estadísticas de Pagos
        </h1>
        <Button variant="flat" color="default" onClick={() => navigate(-1)}>
          <FlechaReturnIcon className="w-6 h-6" />
          <span className="ml-2">Volver</span>
        </Button>
      </div>

      <ReporteFinancieroEstado />
    </div>
  );
};

export default TabEstadisticas;
