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
    <div className="w-full flex flex-col gap-10 animate-in fade-in duration-300">

      {/* ── 1. ANUNCIO EN RECIBOS ── */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
              <HiSpeakerphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-0.5">
                Mensaje global impreso en tickets
              </h3>
              <p className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                Aviso / Anuncio Institucional
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalAnuncioAbierto(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-bold bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/20 border border-amber-500/20 rounded-xl px-6 h-11 text-sm transition-all active:scale-95"
          >
            <HiSpeakerphone className="text-lg" />
            Editar Anuncio
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 ml-1">
              Mensaje Actual Publicado
            </label>
            <div className="flex-1 bg-slate-50/60 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 flex items-center justify-center text-center min-h-[130px] shadow-sm">
              {anuncio ? (
                <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200 italic leading-relaxed max-w-xl">
                  "{anuncio}"
                </p>
              ) : (
                <p className="text-sm font-bold text-slate-400 dark:text-zinc-600">
                  No hay ningún mensaje configurado actualmente.
                </p>
              )}
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2.5">
              <HiInformationCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm tracking-tight">¿Para qué sirve?</h4>
            </div>
            <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed font-medium">
              Este mensaje aparecerá en el pie de página de <strong className="text-amber-950 dark:text-amber-100">todos los recibos impresos</strong>. Es el canal idóneo para avisos de mantenimiento, campañas de pago oportuno o información oficial.
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
                Datos didácticos impresos por rango de agua
              </h3>
              <p className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                Equivalencias de Consumo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalEquivalenciaAbierto(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-bold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl px-6 h-11 text-sm transition-all active:scale-95"
          >
            <HiScale className="text-lg" />
            Editar Equivalencias
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 ml-1">
              Distribución de Rangos de Consumo
            </label>
            <div className="flex-1 bg-slate-50/60 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-5">
                El sistema selecciona automáticamente una frase aleatoria basada en los metros cúbicos (m³) facturados:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col gap-2.5 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700/50 transition-colors">
                  <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md w-fit flex items-center gap-1.5">
                    <HiCheckCircle className="w-3.5 h-3.5" /> 0 - 15 m³
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-snug">Uso eficiente (Bajo)</span>
                </div>
                <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col gap-2.5 shadow-sm hover:border-amber-300 dark:hover:border-amber-700/50 transition-colors">
                  <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md w-fit flex items-center gap-1.5">
                    <HiExclamationCircle className="w-3.5 h-3.5" /> 16 - 30 m³
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-snug">Uso moderado (Medio)</span>
                </div>
                <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col gap-2.5 shadow-sm hover:border-rose-300 dark:hover:border-rose-700/50 transition-colors">
                  <div className="bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md w-fit flex items-center gap-1.5">
                    <HiTrendingUp className="w-3.5 h-3.5" /> + 30 m³
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-snug">Alerta / exceso (Alto)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2.5">
              <HiLightBulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm tracking-tight">Cultura del Agua</h4>
            </div>
            <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed font-medium">
              Las equivalencias traducen el volumen técnico en analogías cotidianas (ej: <i className="text-emerald-950 dark:text-emerald-100 font-bold">"Equivale a 50 duchas de 10 minutos"</i>). Esto promueve la conciencia ciudadana y el cuidado del recurso.
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
