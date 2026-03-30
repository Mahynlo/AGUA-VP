import React, { useState } from "react";
import { Card, CardBody, Button, Chip, Input, Divider } from "@nextui-org/react";
import { HiBeaker, HiLightningBolt, HiCheckCircle, HiInformationCircle } from "react-icons/hi";
import useEquivalenciaConsumo from "../../../hooks/useEquivalenciaConsumo";

const PruebaEquivalencias = () => {
  const { probarEquivalencia } = useEquivalenciaConsumo();
  
  // Arreglo de pruebas masivas
  const [consumos] = useState([0, 3, 8, 15, 20, 23, 28, 35, 42, 67, 89, 95, 120]);
  const [resultadosMasivos, setResultadosMasivos] = useState([]);
  
  // Estado para prueba en tiempo real
  const [consumoPersonalizado, setConsumoPersonalizado] = useState("");
  const [resultadoPersonalizado, setResultadoPersonalizado] = useState("");

  const probarTodosLosConsumos = () => {
    // Transformamos el arreglo directamente a un formato más fácil de mapear
    const resultados = consumos.map(consumo => ({
      valor: consumo,
      frase: probarEquivalencia(consumo)
    }));
    setResultadosMasivos(resultados);
  };

  const handlePruebaPersonalizada = (value) => {
    setConsumoPersonalizado(value);
    if (value !== "" && !isNaN(value)) {
      setResultadoPersonalizado(probarEquivalencia(Number(value)));
    } else {
      setResultadoPersonalizado("");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* 1. Cabecera */}
      <Card className="border-none bg-blue-50 dark:bg-blue-900/20 shadow-sm rounded-2xl">
        <CardBody className="p-5 flex flex-row items-center gap-4">
          <div className="p-3 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl flex-shrink-0">
            <HiBeaker className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
              Laboratorio de Equivalencias
            </h3>
            <p className="text-sm text-blue-700/80 dark:text-blue-300/80">
              Verifica las frases generadas por tu hook de consumo de agua.
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* 2. Prueba Interactiva en Tiempo Real */}
        <Card className="md:col-span-5 border-none shadow-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl h-fit">
          <CardBody className="p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <HiLightningBolt className="text-amber-500" /> Prueba en Vivo
            </h4>
            
            <Input
              type="number"
              label="Ingresa un consumo (m³)"
              placeholder="Ej. 18"
              value={consumoPersonalizado}
              onValueChange={handlePruebaPersonalizada}
              variant="bordered"
              color="primary"
              size="lg"
            />

            <div className={`p-4 rounded-xl border transition-all duration-300 min-h-[80px] flex items-center ${
                resultadoPersonalizado 
                    ? "bg-slate-50 dark:bg-zinc-800/50 border-blue-200 dark:border-blue-900/30" 
                    : "bg-transparent border-dashed border-slate-200 dark:border-zinc-700"
            }`}>
              {resultadoPersonalizado ? (
                <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 italic text-center w-full">
                  "{resultadoPersonalizado}"
                </p>
              ) : (
                <div className="text-center w-full flex flex-col items-center opacity-50">
                  <HiInformationCircle className="text-xl text-slate-400 mb-1" />
                  <span className="text-xs text-slate-500">El resultado aparecerá aquí</span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* 3. Pruebas Masivas */}
        <Card className="md:col-span-7 border-none shadow-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl">
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <HiCheckCircle className="text-emerald-500" /> Batería de Pruebas
              </h4>
              <Button 
                color="primary" 
                size="sm" 
                variant="flat"
                className="font-bold"
                onPress={probarTodosLosConsumos}
              >
                Ejecutar {consumos.length} pruebas
              </Button>
            </div>

            {resultadosMasivos.length > 0 ? (
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {resultadosMasivos.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-zinc-800/30 rounded-xl border border-slate-100 dark:border-zinc-800/50 hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors"
                  >
                    <Chip 
                        size="sm" 
                        color="success" 
                        variant="flat" 
                        className="font-mono font-bold shrink-0 min-w-[55px] text-center"
                    >
                      {item.valor} m³
                    </Chip>
                    <p className="text-sm text-slate-600 dark:text-zinc-400 leading-snug">
                      {item.frase}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl opacity-60">
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                  Aún no se han ejecutado las pruebas
                </p>
              </div>
            )}
          </CardBody>
        </Card>

      </div>
    </div>
  );
};

export default PruebaEquivalencias;
