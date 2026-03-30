import React, { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@nextui-org/react";
import { HiSpeakerphone, HiScale, HiInformationCircle, HiLightBulb } from "react-icons/hi";
import ModalAnuncioRecibo from "./ModalAnuncioRecibo";
import ModalEquivalenciaConsumo from "./ModalEquivalenciaConsumo";
import useAnuncioRecibo from "../../../hooks/useAnuncioRecibo";

const TabConfiguracion = () => {
  const [modalAnuncioAbierto, setModalAnuncioAbierto] = useState(false);
  const [modalEquivalenciaAbierto, setModalEquivalenciaAbierto] = useState(false);
  
  // Hook personalizado para el anuncio
  const { anuncio, actualizarAnuncio } = useAnuncioRecibo();

  // Funciones para manejar el modal de anuncio
  const handleAbrirModalAnuncio = () => {
    setModalAnuncioAbierto(true);
  };

  const handleCerrarModalAnuncio = () => {
    setModalAnuncioAbierto(false);
  };

  const handleGuardarAnuncio = (nuevoAnuncio) => {
    actualizarAnuncio(nuevoAnuncio);
  };

  // Funciones para manejar el modal de equivalencias
  const handleAbrirModalEquivalencia = () => {
    setModalEquivalenciaAbierto(true);
  };

  const handleCerrarModalEquivalencia = () => {
    setModalEquivalenciaAbierto(false);
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      
      {/* 1. Sección de configuración del anuncio (Naranja) */}
      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 dark:bg-orange-500/20 rounded-xl">
              <HiSpeakerphone className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                Anuncio en Recibos
                </h3>
                <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                    Mensaje global impreso en tickets
                </p>
            </div>
          </div>
          <Button 
            onPress={handleAbrirModalAnuncio}
            color="warning"
            className="w-full sm:w-auto font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 shadow-sm"
            startContent={<HiSpeakerphone className="text-lg" />}
          >
            Editar Anuncio
          </Button>
        </CardHeader>

        <CardBody className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Previsualización del Mensaje */}
            <div className="lg:col-span-2 flex flex-col h-full">
              <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-2 block uppercase tracking-wider">
                Mensaje Actual Publicado
              </label>
              <div className="flex-1 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl p-5 shadow-inner min-h-[120px] flex items-center justify-center text-center">
                {anuncio ? (
                    <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 italic">
                        "{anuncio}"
                    </p>
                ) : (
                    <p className="text-sm font-bold text-slate-400 dark:text-zinc-600">
                        No hay ningún mensaje configurado actualmente.
                    </p>
                )}
              </div>
            </div>
            
            {/* Caja de Información Lateral */}
            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200/60 dark:border-orange-800/50 rounded-xl p-5 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                <HiInformationCircle className="w-5 h-5 text-orange-500" />
                <h4 className="font-bold text-orange-800 dark:text-orange-300 text-sm">
                  ¿Para qué sirve?
                </h4>
              </div>
              <p className="text-xs text-orange-700/80 dark:text-orange-400/80 leading-relaxed font-medium">
                Este mensaje aparecerá en el pie de página de <strong>todos los recibos impresos</strong>. Es el lugar ideal para comunicar información importante de forma masiva, como promociones vigentes, avisos de mantenimiento en la red de agua o recordatorios generales de pago oportuno.
              </p>
            </div>

          </div>
        </CardBody>
      </Card>

      {/* 2. Sección de configuración de equivalencias de consumo (Verde) */}
      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl">
              <HiScale className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                Equivalencias de Consumo
                </h3>
                <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                    Datos curiosos impresos por rango de agua
                </p>
            </div>
          </div>
          <Button 
            onPress={handleAbrirModalEquivalencia}
            color="success"
            className="w-full sm:w-auto font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm"
            startContent={<HiScale className="text-lg" />}
          >
            Editar Equivalencias
          </Button>
        </CardHeader>
        
        <CardBody className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Lista de Rangos */}
            <div className="lg:col-span-2 flex flex-col h-full">
              <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-2 block uppercase tracking-wider">
                Distribución Actual
              </label>
              <div className="flex-1 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl p-5 shadow-inner">
                <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 mb-4">
                    El sistema selecciona automáticamente una frase aleatoria basándose en los metros cúbicos (m³) consumidos por el cliente:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 dark:border-zinc-700 flex flex-col gap-1 shadow-sm">
                        <Chip size="sm" color="success" variant="flat" className="font-bold text-[10px] w-fit">0 - 15 m³</Chip>
                        <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 mt-1">Frases de uso eficiente (Bajo)</span>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 dark:border-zinc-700 flex flex-col gap-1 shadow-sm">
                        <Chip size="sm" color="warning" variant="flat" className="font-bold text-[10px] w-fit">16 - 30 m³</Chip>
                        <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 mt-1">Frases de uso moderado (Medio)</span>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 dark:border-zinc-700 flex flex-col gap-1 shadow-sm">
                        <Chip size="sm" color="danger" variant="flat" className="font-bold text-[10px] w-fit">+ 30 m³</Chip>
                        <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 mt-1">Frases de alerta/exceso (Alto)</span>
                    </div>
                </div>
              </div>
            </div>
            
            {/* Caja de Información Lateral */}
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/60 dark:border-emerald-800/50 rounded-xl p-5 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                <HiLightBulb className="w-5 h-5 text-emerald-500" />
                <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                  Cultura del Agua
                </h4>
              </div>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed font-medium">
                A veces es difícil dimensionar cuánta agua representan 10m³. Las equivalencias traducen el consumo técnico en ejemplos cotidianos (ej: <i>"Equivale a 50 duchas de 10 minutos"</i>). Esto educa al usuario, promueve la conciencia hídrica y fomenta hábitos sostenibles.
              </p>
            </div>

          </div>
        </CardBody>
      </Card>

      {/* Modales ocultos */}
      <ModalAnuncioRecibo 
        isOpen={modalAnuncioAbierto}
        onClose={handleCerrarModalAnuncio}
        onSave={handleGuardarAnuncio}
      />

      <ModalEquivalenciaConsumo 
        isOpen={modalEquivalenciaAbierto}
        onClose={handleCerrarModalEquivalencia}
      />
    </div>
  );
};

export default TabConfiguracion;