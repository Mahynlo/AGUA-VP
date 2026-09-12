import React, { useState } from "react";
import { Modal } from "flowbite-react";
import { Spinner } from "@heroui/react";
import { 
  HiPrinter, 
  HiDocumentText, 
  HiBookOpen, 
  HiCollection, 
  HiCheckCircle,
  HiX
} from "react-icons/hi";

const modalTheme = {
  root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80 z-[9999]", off: "hidden" } },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-3xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-2xl w-full overflow-hidden"
  },
  header: {
    base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/80 px-8 py-5 rounded-t-3xl shrink-0 bg-slate-50/50 dark:bg-zinc-900/40",
    close: { base: "hidden" }
  },
  body: { base: "px-8 py-6 flex-1 overflow-y-auto" },
  footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/80 py-4 px-8 rounded-b-3xl shrink-0 bg-slate-50/50 dark:bg-zinc-900/40" }
};

export default function ModalImprimirDocumentacion({
  isOpen,
  onClose,
  selectedSection,
  selectedFile,
  currentMetadata = {},
  sections = {},
  filteredSections = {},
  sectionConfig = {},
  onIniciarImpresion
}) {
  const [alcance, setAlcance] = useState(selectedSection && selectedFile ? "guia_actual" : "manual_completo");
  const [incluirPortada, setIncluirPortada] = useState(true);
  const [incluirIndice, setIncluirIndice] = useState(true);
  const [preparando, setPreparando] = useState(false);

  // Sincronizar el alcance predeterminado cuando se abre el modal
  React.useEffect(() => {
    if (isOpen) {
      if (selectedSection && selectedFile) {
        setAlcance("guia_actual");
      } else if (selectedSection) {
        setAlcance("modulo_actual");
      } else {
        setAlcance("manual_completo");
      }
    }
  }, [isOpen, selectedSection, selectedFile]);

  const seccionActualInfo = sectionConfig[selectedSection] || { title: selectedSection || "Módulo" };
  const totalGuiasModulo = sections[selectedSection]?.length || 0;
  const totalGuiasSistema = Object.values(sections).reduce((acc, f) => acc + (f?.length || 0), 0);
  const totalModulos = Object.keys(filteredSections).length;

  const handleImprimir = async () => {
    setPreparando(true);
    try {
      if (onIniciarImpresion) {
        await onIniciarImpresion({
          alcance,
          seccion: selectedSection,
          archivo: selectedFile,
          incluirPortada,
          incluirIndice
        });
      }
      onClose();
    } catch (err) {
      console.error("Error al generar PDF de documentación:", err);
    } finally {
      setPreparando(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} theme={modalTheme} dismissible={false}>
      <Modal.Header>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-2xl shrink-0">
              <HiPrinter className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                Imprimir Documentación
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                Selecciona el alcance para generar el documento en papel o PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className="space-y-6">
          <div>
            <label className="block mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              1. Alcance de la Impresión
            </label>

            <div className="grid grid-cols-1 gap-3">
              {/* Opción 1: Guía Actual */}
              <div
                onClick={() => setAlcance("guia_actual")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  alcance === "guia_actual"
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm"
                    : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/40"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  alcance === "guia_actual" ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                }`}>
                  <HiDocumentText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100">
                      Guía Actual en Pantalla
                    </h3>
                    {alcance === "guia_actual" && (
                      <HiCheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 truncate mt-0.5">
                    {currentMetadata.titulo || selectedFile?.replace(".md", "") || "Documento actual"}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-1">
                    Imprime únicamente el tema que estás consultando (1 guía).
                  </p>
                </div>
              </div>

              {/* Opción 2: Módulo Completo */}
              {selectedSection && (
                <div
                  onClick={() => setAlcance("modulo_actual")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                    alcance === "modulo_actual"
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm"
                    : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/40"
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    alcance === "modulo_actual" ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                  }`}>
                    <HiCollection className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100">
                        Módulo Completo: {seccionActualInfo.title}
                      </h3>
                      {alcance === "modulo_actual" && (
                        <HiCheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mt-0.5">
                      {totalGuiasModulo} guías estructuradas en orden secuencial
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-1">
                      Compila todas las guías de este módulo en un manual temático con saltos de página.
                    </p>
                  </div>
                </div>
              )}

              {/* Opción 3: Manual Completo del Sistema */}
              <div
                onClick={() => setAlcance("manual_completo")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  alcance === "manual_completo"
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm"
                    : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/40"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  alcance === "manual_completo" ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                }`}>
                  <HiBookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100">
                      Manual Completo del Sistema AguaVP
                    </h3>
                    {alcance === "manual_completo" && (
                      <HiCheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mt-0.5">
                    {totalGuiasSistema} guías distribuidas en {totalModulos} módulos operativos
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-1">
                    Genera el manual integral de operación con portada institucional, índice general y todos los módulos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {alcance !== "guia_actual" && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                2. Opciones de Estilo y Portada
              </label>
              
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={incluirPortada}
                  onChange={(e) => setIncluirPortada(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Incluir Portada Institucional con fecha de emisión</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={incluirIndice}
                  onChange={(e) => setIncluirIndice(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Incluir Tabla de Contenidos / Índice Temático</span>
              </label>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          onClick={onClose}
          disabled={preparando}
          className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-5 h-11 text-xs transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleImprimir}
          disabled={preparando}
          className="font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 h-11 text-xs shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          {preparando ? (
            <>
              <Spinner size="sm" color="white" />
              <span>Generando documento PDF...</span>
            </>
          ) : (
            <>
              <HiPrinter className="text-base" />
              <span>Generar Documento / Imprimir</span>
            </>
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
