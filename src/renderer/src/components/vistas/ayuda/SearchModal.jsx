import React from "react";
import { Modal } from "flowbite-react";
import {
  HiSearch,
  HiX,
  HiQuestionMarkCircle,
  HiDocument,
  HiDocumentText,
  HiTag,
  HiMenuAlt2
} from "react-icons/hi";
import { HighlightText } from "./HighlightText";

const searchModalTheme = {
  root: {
    base: "fixed top-0 right-0 left-0 z-[100000] h-modal h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full",
    show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" }
  },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-3xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-3xl w-full"
  },
  header: {
    base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/50 px-6 py-5 rounded-t-3xl shrink-0 bg-slate-50/50 dark:bg-zinc-900/50",
    close: { base: "absolute top-5 right-5 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
  },
  body: { base: "p-0 flex-1 overflow-y-auto" },
  footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/50 py-4 px-6 rounded-b-3xl shrink-0 bg-slate-50/50 dark:bg-zinc-900/50" }
};

const BUSQUEDAS_FRECUENTES = ["tarifa", "medidor", "corte", "convenio", "pago"];

const SearchModal = React.memo(({
  isOpen,
  onOpenChange,
  modalSearchTerm,
  setModalSearchTerm,
  searching,
  searchResults,
  sectionIcons,
  handleSelectResult
}) => {
  return (
    <Modal
      show={isOpen}
      onClose={() => onOpenChange(false)}
      theme={searchModalTheme}
      dismissible
    >
      <Modal.Header>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl">
            <HiSearch className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-tight">
              Búsqueda Global
            </h2>
            <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
              Encuentra guías, manuales y documentación
            </p>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        {/* ── CAMPO DE BÚSQUEDA FLOTANTE ── */}
        <div className="sticky top-0 z-20 bg-white dark:bg-zinc-950 p-5 border-b border-slate-100 dark:border-zinc-800/50 shadow-sm">
          <div className="relative w-full flex items-center group">
            <span className="absolute left-4 flex items-center justify-center transition-colors duration-200 text-slate-400 dark:text-zinc-500 group-focus-within:text-blue-500">
              {searching ? (
                <div className="w-5 h-5 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
              ) : (
                <HiSearch className="w-5 h-5" />
              )}
            </span>

            <input
              autoFocus
              type="text"
              placeholder="Escribe para buscar en títulos, descripciones y contenido..."
              value={modalSearchTerm}
              onChange={(e) => setModalSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 h-14 text-sm font-medium rounded-2xl transition-all duration-200 bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 shadow-inner hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:border-blue-300 dark:hover:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-950 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />

            {modalSearchTerm && (
              <button
                onClick={() => setModalSearchTerm("")}
                className="absolute right-3 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors focus:outline-none rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800"
                aria-label="Limpiar búsqueda"
              >
                <HiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {modalSearchTerm && (
            <div className="mt-3 flex items-center justify-between px-2">
              <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                {searching ? (
                  <span className="flex items-center gap-1.5 animate-pulse">Buscando coincidencias...</span>
                ) : searchResults.length > 0 ? (
                  <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""} encontrado{searchResults.length !== 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-orange-500 dark:text-orange-400">Sin resultados</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* ── ÁREA DE RESULTADOS ── */}
        <div className="p-5">
          {!modalSearchTerm ? (

            /* ESTADO INICIAL */
            <div className="text-center py-12 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 flex items-center justify-center mb-4 shadow-sm">
                <HiSearch className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
              </div>
              <h3 className="text-base font-bold text-slate-700 dark:text-zinc-300 mb-1">
                ¿Qué estás buscando?
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-500 max-w-sm mx-auto leading-relaxed">
                El motor buscará instantáneamente en todos los módulos, tutoriales y configuraciones.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Búsquedas Frecuentes</span>
                <div className="flex flex-wrap gap-2 justify-center">
                  {BUSQUEDAS_FRECUENTES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setModalSearchTerm(term)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors border border-slate-200 dark:border-zinc-700"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          ) : searchResults.length === 0 && !searching ? (

            /* SIN RESULTADOS */
            <div className="text-center py-12 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 flex items-center justify-center mb-4 shadow-sm">
                <HiQuestionMarkCircle className="w-8 h-8 text-orange-400 dark:text-orange-500" />
              </div>
              <h3 className="text-base font-bold text-slate-700 dark:text-zinc-300 mb-1">
                No se encontraron resultados
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-500 max-w-sm mx-auto">
                No pudimos encontrar nada relacionado con "<strong className="text-slate-800 dark:text-zinc-200">{modalSearchTerm}</strong>". Intenta usar palabras clave diferentes.
              </p>
            </div>

          ) : (

            /* LISTA DE RESULTADOS */
            <div className="space-y-4">
              {searchResults.map((result, index) => {
                const sectionConfig = sectionIcons[result.sectionKey];

                return (
                  <div
                    key={`${result.sectionKey}-${result.fileName}-${index}`}
                    onClick={() => handleSelectResult(result.sectionKey, result.fileName)}
                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 transition-all cursor-pointer group"
                    style={{ animationFillMode: "both", animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-3.5 mb-3">
                      <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${sectionConfig?.color ? `bg-${sectionConfig.color}-50 text-${sectionConfig.color}-600 dark:bg-${sectionConfig.color}-900/20 dark:text-${sectionConfig.color}-400` : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                        {sectionConfig?.icon || <HiDocument className="w-5 h-5" />}
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                            {sectionConfig?.title || result.sectionKey}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          <HighlightText
                            text={result.metadata?.titulo || result.fileName.replace(".md", "")}
                            highlight={modalSearchTerm}
                          />
                        </h4>
                      </div>
                    </div>

                    {result.matches && result.matches.length > 0 && (
                      <div className="space-y-2 mt-3 pl-12">
                        {result.matches.slice(0, 3).map((match, idx) => {
                          let MatchIcon = HiMenuAlt2;
                          let matchLabel = "Contenido";
                          if (match.type === "titulo") { MatchIcon = HiDocumentText; matchLabel = "Título"; }
                          if (match.type === "descripcion") { MatchIcon = HiDocument; matchLabel = "Descripción"; }
                          if (match.type === "tags") { MatchIcon = HiTag; matchLabel = "Etiqueta"; }

                          return (
                            <div
                              key={idx}
                              className="bg-slate-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/80"
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                                  <MatchIcon className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                                  <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 hidden sm:block">
                                    {matchLabel}
                                  </span>
                                </div>
                                <p className="text-xs font-medium text-slate-600 dark:text-zinc-300 leading-relaxed line-clamp-2">
                                  <HighlightText text={match.text} highlight={modalSearchTerm} />
                                </p>
                              </div>
                            </div>
                          );
                        })}

                        {result.matches.length > 3 && (
                          <p className="text-[10px] font-bold text-blue-500/70 dark:text-blue-400/70 uppercase tracking-widest pt-1">
                            + {result.matches.length - 3} coincidencia{result.matches.length - 3 !== 1 ? "s" : ""} en este documento
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-xl px-6 h-10 text-sm transition-colors"
        >
          Cerrar Búsqueda
        </button>
      </Modal.Footer>
    </Modal>
  );
});

SearchModal.displayName = "SearchModal";

export default SearchModal;
