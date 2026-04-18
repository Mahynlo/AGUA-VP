import { Button } from "@nextui-org/react";
import { FlechaReturnIcon } from "../../../IconsApp/IconsAppSystem";
import { useNavigate } from "react-router-dom";
import ReporteFinancieroEstado from "../impresion/components/ReporteFinancieroEstado";

const TabEstadisticas = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-6">
      
      <ReporteFinancieroEstado />
    </div>
  );
};

export default TabEstadisticas;
