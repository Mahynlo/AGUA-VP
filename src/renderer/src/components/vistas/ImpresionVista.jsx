import { Link, useNavigate } from "react-router-dom";
import { Button } from "flowbite-react";
import { FlechaReturnIcon } from "../../IconsApp/IconsAppSystem";
import React, { useRef, useState } from "react";

const Impresion = () => {
  const navigate = useNavigate(); // Hook de navegación
  const [isPreview, setIsPreview] = useState(false);
  const fechaHora = new Date().toLocaleString();

  // Función de prueba para verificar URLs
  const testUrls = () => {
    const baseUrl = getBaseUrl();
    console.log('=== URL TEST ===');
    console.log('Base URL:', baseUrl);
    console.log('Recibo URL:', `${baseUrl}#/recibo?print=true`);
    console.log('Reporte URL:', `${baseUrl}#/reporteLecturas?print=true`);
    console.log('Environment:', window.location.protocol === 'file:' ? 'Production (Packaged)' : 'Development');
    console.log('===============');
  };

  // Ejecutar test al cargar el componente
  React.useEffect(() => {
    testUrls();
  }, []);

  // Función para obtener la URL base correcta
  const getBaseUrl = () => {
    const currentUrl = window.location.href;
    const currentOrigin = window.location.origin;
    
    console.log('Current URL:', currentUrl);
    console.log('Current Origin:', currentOrigin);
    console.log('Protocol:', window.location.protocol);
    
    // En desarrollo (http://localhost:5173)
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      return currentOrigin;
    }
    
    // En producción empaquetada (file:// protocol)
    if (window.location.protocol === 'file:') {
      // Obtener la base sin el hash
      const basePath = currentUrl.split('#')[0];
      return basePath;
    }
    
    // Fallback
    return currentOrigin;
  };

  const handleImprimirRecibo = () => {
    // Usar la URL actual de la aplicación en lugar de localhost hardcodeado
    const baseUrl = getBaseUrl();
    const printUrl = `${baseUrl}#/recibo?print=true`;
    console.log('Printing URL:', printUrl);
    window.api.printComponent(printUrl, (response) => {
      console.log(response);
    });
  };

  const handleVistaPreviaRecibo = () => {
    // Usar la URL actual de la aplicación en lugar de localhost hardcodeado
    const baseUrl = getBaseUrl();
    const previewUrl = `${baseUrl}#/recibo?print=true`;
    console.log('Preview URL:', previewUrl);
    window.api.previewComponent(previewUrl, (response) => {
      console.log(response);
    });
  };

  const handleImprimirReporte = () => {
    // Usar la URL actual de la aplicación en lugar de localhost hardcodeado
    const baseUrl = getBaseUrl();
    const printUrl = `${baseUrl}#/reporteLecturas?print=true`;
    console.log('Printing report URL:', printUrl);
    window.api.printReport(printUrl, (response) => {
      console.log(response);
    });
  };

  const handleVistaPreviaReporte = () => {
    // Usar la URL actual de la aplicación en lugar de localhost hardcodeado
    const baseUrl = getBaseUrl();
    const previewUrl = `${baseUrl}#/reporteLecturas?print=true`;
    console.log('Preview report URL:', previewUrl);
    window.api.previewReport(previewUrl, (response) => {
      console.log(response);
    });
  };

  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div className="w-full h-full bg-white overflow-x-hidden gap-4 p-4 rounded-lg shadow-md dark:bg-gray-800">
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
          
          <Button onClick={testUrls} color="gray" className="col-span-full">
            🔍 Test URLs (Ver Consola)
          </Button>
        </div>


        <Link to="/recibo" className="block mt-2 text-blue-500 hover:underline">
          Ir a la página de recibo
        </Link>

        <Link to="/reporteLecturas" className="block mt-2 text-blue-500 hover:underline">
          Ir a la página de reporte de lecturas
        </Link>

      </div>
      </div>
      

      
    </div>
  );
};

export default Impresion;

