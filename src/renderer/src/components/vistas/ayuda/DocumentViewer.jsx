import React, { useState, useEffect, useMemo } from "react";
import {
  HiHome,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineClipboardCheck,
  HiOutlineClipboardCopy,
  HiTag,
  HiOutlineArrowNarrowLeft,
  HiOutlineArrowNarrowRight,
  HiMenuAlt2,
  HiChevronDown,
  HiOutlineArrowUp
} from "react-icons/hi";
import { Tooltip } from "@nextui-org/react";
import { MarkdownRenderer, slugify } from "./MarkdownRenderer";

// Extractor robusto de encabezados Markdown
const extractHeadings = (markdown) => {
  if (!markdown) return [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const headings = [];
  let inCodeBlock = false;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) return;

    // Detectar encabezados #, ##, ###, ####
    const match = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const rawTitle = match[2].trim().replace(/[*_`#]/g, "");
      const id = slugify(rawTitle);
      if (id && rawTitle) {
        headings.push({
          level,
          title: rawTitle,
          id
        });
      }
    }
  });

  return headings;
};

const DocumentViewer = ({
  currentContent = "",
  currentMetadata = {},
  selectedSection,
  selectedFile,
  currentFileIndex,
  getCurrentFiles,
  getCurrentSectionConfig,
  navegarAnterior,
  navegarSiguiente,
  navegarA
}) => {
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState("");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  const totalFiles = getCurrentFiles()?.length || 0;
  const hasMultipleFiles = totalFiles > 1;
  const sectionConfig = getCurrentSectionConfig();

  // Obtenemos los archivos anterior/siguiente para los botones inferiores
  const allFiles = getCurrentFiles() || [];
  const prevFile = currentFileIndex > 0 ? allFiles[currentFileIndex - 1] : null;
  const nextFile = currentFileIndex < totalFiles - 1 ? allFiles[currentFileIndex + 1] : null;

  const docTitle = currentMetadata.titulo || selectedFile?.replace(".md", "") || "Documento";

  // Extraer secciones de la página actual (#, ##, ###)
  const headings = useMemo(() => extractHeadings(currentContent), [currentContent]);

  // Establecer el primer encabezado como activo por defecto al cargar el documento
  useEffect(() => {
    if (headings.length > 0) {
      setActiveHeadingId(headings[0].id);
    }
  }, [headings, selectedFile]);

  // Observer de scroll para resaltar la sección visible automáticamente
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20px 0px -60% 0px",
        threshold: 0.1
      }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings, currentContent]);

  // Manejador para scroll suave a la sección
  const scrollToHeading = (id) => {
    setActiveHeadingId(id);
    setMobileTocOpen(false);
    const targetElement = document.getElementById(id);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Scroll al inicio del documento
  const scrollToTop = () => {
    if (headings.length > 0) {
      scrollToHeading(headings[0].id);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Copiar título al portapapeles
  const handleCopyTitle = () => {
    if (docTitle) {
      navigator.clipboard.writeText(docTitle);
      setCopiedTitle(true);
      setTimeout(() => setCopiedTitle(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* ── 1. BARRA SUPERIOR (BREADCRUMBS + HERRAMIENTAS) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-zinc-800">
        
        {/* Rutas de navegación estándar */}
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-zinc-400 overflow-x-auto custom-scrollbar py-1">
          <button
            onClick={() => navegarA && navegarA(null, null)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors font-medium shrink-0"
            title="Volver al Catálogo General"
          >
            <HiHome className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            <span>Ayuda</span>
          </button>

          <span className="text-slate-300 dark:text-zinc-700">/</span>

          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-zinc-300 font-semibold shrink-0">
            {sectionConfig?.icon && (
              <span className="text-blue-600 dark:text-blue-400">
                {React.cloneElement(sectionConfig.icon, { className: "w-3.5 h-3.5" })}
              </span>
            )}
            <span>{sectionConfig?.title || selectedSection}</span>
          </span>

          <span className="text-slate-300 dark:text-zinc-700">/</span>

          <span className="text-slate-800 dark:text-zinc-200 font-bold truncate max-w-[200px] sm:max-w-[320px]">
            {docTitle}
          </span>
        </nav>

        {/* Acciones y Controles Rápidos */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Botón Copiar Título */}
          <Tooltip content={copiedTitle ? "¡Copiado al portapapeles!" : "Copiar título"} placement="top">
            <button
              onClick={handleCopyTitle}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              title="Copiar título"
            >
              {copiedTitle ? (
                <HiOutlineClipboardCheck className="w-4 h-4 text-emerald-500" />
              ) : (
                <HiOutlineClipboardCopy className="w-4 h-4" />
              )}
            </button>
          </Tooltip>

          {/* Navegación < > */}
          {hasMultipleFiles && (
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-zinc-800">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mr-1 hidden sm:inline">
                {currentFileIndex + 1} de {totalFiles}
              </span>

              <button
                onClick={navegarAnterior}
                disabled={currentFileIndex === 0}
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Documento anterior"
              >
                <HiChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={navegarSiguiente}
                disabled={currentFileIndex === totalFiles - 1}
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Siguiente documento"
              >
                <HiChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. TOC EN PANTALLAS PEQUEÑAS (COLAPSABLE < lg) ── */}
      {headings.length > 0 && (
        <div className="lg:hidden bg-slate-100/80 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3 shadow-2xs">
          <button
            onClick={() => setMobileTocOpen(!mobileTocOpen)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-zinc-200"
          >
            <div className="flex items-center gap-2">
              <HiMenuAlt2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Índice del documento ({headings.length} secciones)</span>
            </div>
            <HiChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileTocOpen ? "rotate-180" : ""}`} />
          </button>

          {mobileTocOpen && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-zinc-800 space-y-1">
              {headings.map((h, i) => (
                <button
                  key={`${h.id}-${i}`}
                  onClick={() => scrollToHeading(h.id)}
                  className={`w-full text-left py-1.5 px-2 rounded-lg text-xs transition-colors truncate ${
                    activeHeadingId === h.id
                      ? "bg-blue-600 text-white font-bold shadow-2xs"
                      : h.level === 1
                      ? "font-bold text-slate-800 dark:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-800"
                      : h.level === 2
                      ? "pl-4 font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-800"
                      : "pl-6 text-slate-500 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800"
                  }`}
                >
                  {h.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 3. CONTENIDO PRINCIPAL + BARRA LATERAL DERECHA (TOC ESTILO DOCS) ── */}
      <div className="flex items-start gap-6 lg:gap-8 relative">
        
        {/* Columna Principal del Documento */}
        <div className="flex-1 min-w-0 space-y-6">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm">
            
            {/* Renderizado de Markdown */}
            <div className="prose prose-slate dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-zinc-100
              prose-h1:text-2xl sm:prose-h1:text-3xl lg:prose-h1:text-4xl prose-h1:font-black prose-h1:pb-4 prose-h1:border-b prose-h1:border-slate-100 dark:prose-h1:border-zinc-800/80 prose-h1:mb-6
              prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-sm sm:prose-p:text-base prose-p:leading-relaxed prose-p:text-slate-700 dark:prose-p:text-zinc-300
              prose-li:text-sm sm:prose-li:text-base prose-li:text-slate-700 dark:prose-li:text-zinc-300
              prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:font-semibold hover:prose-a:underline
              prose-code:bg-slate-100 dark:prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-slate-800 dark:prose-code:text-zinc-200 prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
              prose-img:rounded-2xl prose-img:border prose-img:border-slate-200 dark:prose-img:border-zinc-800 prose-img:shadow-sm
              prose-strong:font-bold prose-strong:text-slate-900 dark:prose-strong:text-zinc-100
            ">
              <MarkdownRenderer content={currentContent} />
            </div>

            {/* Tags al pie del documento */}
            {currentMetadata.tags && Array.isArray(currentMetadata.tags) && currentMetadata.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1 mr-1">
                  <HiTag className="w-3.5 h-3.5" />
                  Etiquetas:
                </span>
                {currentMetadata.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-800"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Navegación Inferior (Anterior / Siguiente) */}
          {hasMultipleFiles && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {prevFile ? (
                <button
                  onClick={navegarAnterior}
                  className="flex flex-col items-start p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-sm transition-all group text-left"
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <HiOutlineArrowNarrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    <span>Anterior</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {prevFile.metadata?.titulo || prevFile.fileName.replace(".md", "")}
                  </span>
                </button>
              ) : (
                <div />
              )}

              {nextFile ? (
                <button
                  onClick={navegarSiguiente}
                  className="flex flex-col items-end p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-sm transition-all group text-right"
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <span>Siguiente</span>
                    <HiOutlineArrowNarrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {nextFile.metadata?.titulo || nextFile.fileName.replace(".md", "")}
                  </span>
                </button>
              ) : (
                <div />
              )}
            </div>
          )}

          {/* Pie de página: Volver al Catálogo */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => navegarA && navegarA(null, null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <HiHome className="w-3.5 h-3.5" />
              <span>Volver al Catálogo de Módulos</span>
            </button>
          </div>
        </div>

        {/* ── 4. BARRA LATERAL DERECHA (TABLE OF CONTENTS / ÍNDICE) ── */}
        {headings.length > 0 && (
          <aside className="hidden lg:block w-52 xl:w-60 shrink-0 sticky top-2 space-y-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs">
              
              <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 font-bold text-xs uppercase tracking-wider">
                <HiMenuAlt2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>En esta página</span>
              </div>

              <nav className="space-y-0.5 max-h-[calc(100vh-14rem)] overflow-y-auto custom-scrollbar pr-1">
                {headings.map((heading, idx) => {
                  const isActive = activeHeadingId === heading.id;

                  return (
                    <button
                      key={`${heading.id}-${idx}`}
                      onClick={() => scrollToHeading(heading.id)}
                      className={`w-full text-left py-1.5 px-2 text-xs transition-all duration-150 rounded-lg truncate block border-l-2 ${
                        isActive
                          ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold"
                          : "border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                      } ${
                        heading.level === 1
                          ? "font-bold"
                          : heading.level === 2
                          ? "pl-3.5 font-medium"
                          : "pl-5 text-[11px] font-normal"
                      }`}
                      title={heading.title}
                    >
                      {heading.title}
                    </button>
                  );
                })}
              </nav>

              {/* Botón Ir Arriba */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800/80 flex justify-between items-center">
                <button
                  onClick={scrollToTop}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-blue-600 dark:text-zinc-500 dark:hover:text-blue-400 transition-colors"
                >
                  <HiOutlineArrowUp className="w-3 h-3" />
                  <span>Ir arriba</span>
                </button>
              </div>

            </div>
          </aside>
        )}

      </div>

    </div>
  );
};

export default DocumentViewer;
