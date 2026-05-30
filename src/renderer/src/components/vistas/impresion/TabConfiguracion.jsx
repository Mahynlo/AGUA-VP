import React, { useState } from "react";
import {
  HiSpeakerphone,
  HiScale,
  HiInformationCircle,
  HiLightBulb,
  HiCheckCircle,
  HiExclamationCircle,
  HiTrendingUp
} from "react-icons/hi";
import ModalAnuncioRecibo from "./ModalAnuncioRecibo";
import ModalEquivalenciaConsumo from "./ModalEquivalenciaConsumo";
import useAnuncioRecibo from "../../../hooks/useAnuncioRecibo";

const TabConfiguracion = () => {
  const [modalAnuncioAbierto, setModalAnuncioAbierto] = useState(false);
  const [modalEquivalenciaAbierto, setModalEquivalenciaAbierto] = useState(false);

  const { anuncio, actualizarAnuncio } = useAnuncioRecibo();

  const handleGuardarAnuncio = (nuevoAnuncio) => {
    actualizarAnuncio(nuevoAnuncio);
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-10">

      {/* ── HEADER ── */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
          Personalización de Recibos
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
          Configura los mensajes globales y la cultura del agua impresos en los tickets
        </p>
      </div>

      <hr className="border-slate-100 dark:border-zinc-800/80" />

      {/* ── 1. ANUNCIO EN RECIBOS ── */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl shrink-0">
              <HiSpeakerphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-0.5">
                Mensaje global impreso en tickets
              </h3>
              <p className="text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100">
                Anuncio en Recibos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalAnuncioAbierto(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-bold bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 dark:text-orange-400 dark:hover:bg-orange-500/20 rounded-xl px-6 h-11 text-sm transition-colors"
          >
            <HiSpeakerphone className="text-lg" />
            Editar Anuncio
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3 ml-1">
              Mensaje Actual Publicado
            </label>
            <div className="flex-1 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 flex items-center justify-center text-center min-h-[120px]">
              {anuncio ? (
                <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 italic">"{anuncio}"</p>
              ) : (
                <p className="text-sm font-bold text-slate-400 dark:text-zinc-600">
                  No hay ningún mensaje configurado actualmente.
                </p>
              )}
            </div>
          </div>

          <div className="bg-orange-500/10 rounded-2xl p-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <HiInformationCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h4 className="font-bold text-orange-700 dark:text-orange-300 text-sm tracking-tight">¿Para qué sirve?</h4>
            </div>
            <p className="text-xs text-orange-800/80 dark:text-orange-200/80 leading-relaxed font-medium">
              Este mensaje aparecerá en el pie de página de <strong className="text-orange-900 dark:text-orange-100">todos los recibos impresos</strong>. Es el lugar ideal para comunicar información importante de forma masiva, como promociones vigentes, avisos de mantenimiento en la red de agua o recordatorios de pago oportuno.
            </p>
          </div>
        </div>
      </div>

      <hr className="border-slate-100 dark:border-zinc-800/80" />

      {/* ── 2. EQUIVALENCIAS DE CONSUMO ── */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
              <HiScale className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-0.5">
                Datos curiosos impresos por rango de agua
              </h3>
              <p className="text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100">
                Equivalencias de Consumo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalEquivalenciaAbierto(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-bold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/20 rounded-xl px-6 h-11 text-sm transition-colors"
          >
            <HiScale className="text-lg" />
            Editar Equivalencias
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3 ml-1">
              Distribución Actual
            </label>
            <div className="flex-1 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6">
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-6">
                El sistema selecciona automáticamente una frase aleatoria basándose en los metros cúbicos (m³) consumidos por el cliente:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col gap-3 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700/50 transition-colors">
                  <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-md w-fit flex items-center gap-1.5">
                    <HiCheckCircle className="w-3.5 h-3.5" /> 0 - 15 m³
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 leading-snug">Frases de uso eficiente (Bajo)</span>
                </div>
                <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col gap-3 shadow-sm hover:border-amber-300 dark:hover:border-amber-700/50 transition-colors">
                  <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-md w-fit flex items-center gap-1.5">
                    <HiExclamationCircle className="w-3.5 h-3.5" /> 16 - 30 m³
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 leading-snug">Frases de uso moderado (Medio)</span>
                </div>
                <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col gap-3 shadow-sm hover:border-red-300 dark:hover:border-red-700/50 transition-colors">
                  <div className="bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-md w-fit flex items-center gap-1.5">
                    <HiTrendingUp className="w-3.5 h-3.5" /> + 30 m³
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 leading-snug">Frases de alerta/exceso (Alto)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/10 rounded-2xl p-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <HiLightBulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-bold text-emerald-700 dark:text-emerald-300 text-sm tracking-tight">Cultura del Agua</h4>
            </div>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 leading-relaxed font-medium">
              A veces es difícil dimensionar cuánta agua representan 10m³. Las equivalencias traducen el consumo técnico en ejemplos cotidianos (ej: <i className="text-emerald-900 dark:text-emerald-100 font-bold">"Equivale a 50 duchas de 10 minutos"</i>). Esto educa al usuario, promueve la conciencia hídrica y fomenta hábitos sostenibles.
            </p>
          </div>
        </div>
      </div>

      {/* Modales */}
      <ModalAnuncioRecibo
        isOpen={modalAnuncioAbierto}
        onClose={() => setModalAnuncioAbierto(false)}
        onSave={handleGuardarAnuncio}
      />
      <ModalEquivalenciaConsumo
        isOpen={modalEquivalenciaAbierto}
        onClose={() => setModalEquivalenciaAbierto(false)}
      />
    </div>
  );
};

export default TabConfiguracion;
