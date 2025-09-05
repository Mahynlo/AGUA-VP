import { useState } from "react";
import { Button } from "flowbite-react";
import useEquivalenciaConsumo from "../../../hooks/useEquivalenciaConsumo";

const PruebaEquivalencias = () => {
  const { probarEquivalencia } = useEquivalenciaConsumo();
  const [consumos] = useState([0, 3, 8, 15, 23, 28, 35, 42, 67, 89, 95, 120]);
  const [frases, setFrases] = useState({});

  const probarTodosLosConsumos = () => {
    const nuevasFrases = {};
    consumos.forEach(consumo => {
      nuevasFrases[consumo] = probarEquivalencia(consumo);
    });
    setFrases(nuevasFrases);
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
          🧪 Prueba de Equivalencias
        </h3>
        <p className="text-sm text-blue-600 dark:text-blue-300">
          Prueba cómo se verían las frases con diferentes consumos
        </p>
      </div>

      <Button onClick={probarTodosLosConsumos} color="blue">
        Probar Consumos de Ejemplo
      </Button>

      {Object.keys(frases).length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800 dark:text-gray-200">
            Resultados de las pruebas:
          </h4>
          {consumos.map(consumo => (
            <div key={consumo} className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-500 text-white px-2 py-1 rounded text-sm font-medium">
                  {consumo} m³
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                "{frases[consumo]}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PruebaEquivalencias;
