import { Link, useNavigate } from "react-router-dom";
import { Button } from "flowbite-react";
import { FlechaReturnIcon } from "../../IconsApp/IconsAppSystem";
import React, { useRef, useState } from "react";

const Impresion = () => {
  const navigate = useNavigate(); // Hook de navegación
  const [isPreview, setIsPreview] = useState(false);
  const fechaHora = new Date().toLocaleString();


  const handleImprimirRecibo = () => {
    window.api.printComponent('http://localhost:5173/#/recibo', (response) => {
      console.log(response);
    });
  };

  const handleVistaPreviaRecibo = () => {
    window.api.previewComponent('http://localhost:5173/#/recibo', (response) => {
      console.log(response);
    });
  };


  const handleImprimirReporte = () => {
    window.api.printReport('http://localhost:5173/#/reporteLecturas', (response) => {
      console.log(response);
    });
  };

  const handleVistaPreviaReporte = () => {
    window.api.previewReport('http://localhost:5173/#/reporteLecturas', (response) => {
      console.log(response);
    }
    );
  };

  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        <Button color="gray" className="mb-4" onClick={() => navigate(-1)}>
          <FlechaReturnIcon className="w-6 h-6" />
          <span className="mr-2">Volver</span>
        </Button>
        Impresion
      </div>

      <div>
        <h1>Impresión y Vista Previa</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Button onClick={handleVistaPreviaRecibo} color="blue">Vista Previa Recibo</Button>
          <Button onClick={handleImprimirRecibo}>Imprimir Recibo</Button>

          <Button onClick={handleVistaPreviaReporte} color="blue">Vista Previa Reporte</Button>
          <Button onClick={handleImprimirReporte}>Imprimir Reporte</Button>
        </div>


        <Link to="/recibo" className="block mt-2 text-blue-500 hover:underline">
          Ir a la página de recibo
        </Link>

        <Link to="/reporteLecturas" className="block mt-2 text-blue-500 hover:underline">
          Ir a la página de reporte de lecturas
        </Link>

      </div>
    </div>
  );
};

export default Impresion;

