import React, { useState, useEffect } from 'react';
import { Modal } from "flowbite-react";
import { HiSpeakerphone, HiRefresh, HiCheck, HiPencilAlt, HiInformationCircle } from "react-icons/hi";

const anuncioModalTheme = {
  root: {
    base: "fixed top-0 right-0 left-0 z-[100000] h-modal h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full",
    show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" }
  },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-3xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-2xl w-full"
  },
  header: {
    base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/50 px-8 pb-4 pt-6 rounded-t-3xl shrink-0",
    close: { base: "absolute top-5 right-5 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
  },
  body: { base: "px-8 py-6 flex-1 overflow-y-auto" },
  footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8 rounded-b-3xl shrink-0" }
};

const MENSAJE_POR_DEFECTO = "Cuidemos el agua para las futuras generaciones. Reporte cualquier fuga o problema en su medidor al teléfono de la oficina municipal.";
const MAX_CARACTERES = 150;

const ModalAnuncioRecibo = ({ isOpen, onClose, onSave }) => {
  const [anuncio, setAnuncio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const anuncioGuardado = localStorage.getItem('anuncio_recibo');
      const mensajeInicial = anuncioGuardado || MENSAJE_POR_DEFECTO;
      setAnuncio(mensajeInicial);
      setHasChanges(false);
    }
  }, [isOpen]);

  const handleAnuncioChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_CARACTERES) {
      setAnuncio(value);
      setHasChanges(true);
    }
  };

  const handleGuardar = async () => {
    setIsLoading(true);
    try {
      const anuncioFinal = anuncio.trim() || MENSAJE_POR_DEFECTO;
      localStorage.setItem('anuncio_recibo', anuncioFinal);
      onSave(anuncioFinal);
      setHasChanges(false);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestaurarDefecto = () => {
    setAnuncio(MENSAJE_POR_DEFECTO);
    setHasChanges(true);
  };

  const handleCancelar = () => {
    const anuncioGuardado = localStorage.getItem('anuncio_recibo');
    setAnuncio(anuncioGuardado || MENSAJE_POR_DEFECTO);
    setHasChanges(false);
    onClose();
  };

  const caracteresUsados = anuncio.length;
  const caracteresRestantes = MAX_CARACTERES - caracteresUsados;
  const pct = (caracteresUsados / MAX_CARACTERES) * 100;
  const barColor = caracteresRestantes < 20
    ? "bg-red-500"
    : caracteresRestantes < 50
    ? "bg-yellow-500"
    : "bg-slate-800 dark:bg-zinc-200";

  return (
    <Modal
      show={isOpen}
      onClose={handleCancelar}
      theme={anuncioModalTheme}
      dismissible={!isLoading}
    >
      {/* ── HEADER ── */}
      <Modal.Header>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl shrink-0">
            <HiSpeakerphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
              Aviso en Recibos
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
              Este mensaje se imprimirá en todos los tickets
            </p>
          </div>
        </div>
      </Modal.Header>

      {/* ── BODY ── */}
      <Modal.Body>
        <div className="flex flex-col gap-5">
          {/* Vista previa */}
          <div className="relative bg-orange-500/10 rounded-2xl p-5 overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 rounded-l-2xl" />
            <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <HiInformationCircle className="w-4 h-4" /> Vista Previa
            </p>
            <p className={`text-sm font-medium italic leading-relaxed pl-1 ${anuncio ? 'text-orange-900 dark:text-orange-100' : 'text-orange-700/60 dark:text-orange-300/60'}`}>
              "{anuncio || "El anuncio aparecerá aquí..."}"
            </p>
          </div>

          {/* Editor */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 ml-1">
              Mensaje del anuncio
            </label>
            <div className="relative flex items-start">
              <span className="absolute left-3 top-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none">
                <HiPencilAlt className="w-5 h-5" />
              </span>
              <textarea
                value={anuncio}
                onChange={handleAnuncioChange}
                rows={4}
                maxLength={MAX_CARACTERES}
                placeholder="Escribe el anuncio aquí..."
                className="w-full pl-10 pr-4 py-3 text-sm font-medium rounded-xl resize-none transition-all bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 text-slate-800 dark:text-zinc-100"
              />
            </div>

            {/* Barra de caracteres */}
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                Caracteres Disponibles
              </span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                caracteresRestantes < 20
                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"
              }`}>
                {caracteresRestantes} / {MAX_CARACTERES}
              </span>
            </div>
            <div className="h-1.5 mx-1 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Restaurar defecto */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex-1 min-w-0 px-1">
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">
                Mensaje por defecto
              </h4>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 truncate pr-4">
                {MENSAJE_POR_DEFECTO}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRestaurarDefecto}
              disabled={isLoading || anuncio === MENSAJE_POR_DEFECTO}
              className="inline-flex items-center gap-1.5 shrink-0 font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 disabled:opacity-40 rounded-xl px-4 h-9 transition-colors"
            >
              <HiRefresh className="w-3.5 h-3.5" />
              Restaurar
            </button>
          </div>
        </div>
      </Modal.Body>

      {/* ── FOOTER ── */}
      <Modal.Footer>
        <button
          type="button"
          onClick={handleCancelar}
          disabled={isLoading}
          className="font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 rounded-xl px-6 h-10 text-sm transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleGuardar}
          disabled={!hasChanges || isLoading}
          className="inline-flex items-center gap-2 font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 disabled:opacity-50 rounded-xl px-8 h-10 text-sm shadow-sm transition-all active:scale-95"
        >
          {isLoading
            ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 dark:border-zinc-950/30 border-t-white dark:border-t-zinc-950 animate-spin" />Guardando...</>
            : <><HiCheck className="w-4 h-4" />Guardar Cambios</>
          }
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalAnuncioRecibo;
