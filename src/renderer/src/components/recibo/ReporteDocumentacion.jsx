import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppLogo } from "../../context/LogoContext";
import { useNotifyPrintReady } from "../../hooks/useNotifyPrintReady";
import { MarkdownRenderer, mermaidCoordinator } from "../vistas/ayuda/MarkdownRenderer";
import 'katex/dist/katex.min.css';

const ReporteDocumentacion = () => {
  const [searchParams] = useSearchParams();
  const { logoSrc } = useAppLogo();
  const [data, setData] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isPrintReady, setIsPrintReady] = useState(false);

  // useNotifyPrintReady notifica a Electron cuando TODO (datos + Markdown + KaTeX + SVGs Mermaid) ha terminado de pintarse
  useNotifyPrintReady(isPrintReady, 400);

  // 1. Cargar datos desde IPC
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const dataKey = searchParams.get("dataKey");
      if (!dataKey) {
        console.warn("ReporteDocumentacion: No se recibió dataKey");
        if (isMounted) setIsDataLoaded(true);
        return;
      }

      try {
        const raw = await window.api.getPrintData(dataKey);
        if (raw) {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          if (isMounted && parsed && parsed.docs && parsed.docs.length > 0) {
            setData(parsed);
          }
        }
      } catch (error) {
        console.error("Error leyendo datos de impresión de documentación:", error);
      } finally {
        if (isMounted) {
          setIsDataLoaded(true);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  // Calcular cantidad esperada de diagramas Mermaid contenidos en los documentos
  const totalExpectedDiagrams = useMemo(() => {
    if (!data || !data.docs || !Array.isArray(data.docs)) return 0;
    return data.docs.reduce((acc, doc) => {
      const matches = (doc.content || '').match(/```\s*mermaid/gi);
      return acc + (matches ? matches.length : 0);
    }, 0);
  }, [data]);

  // 2. Coordinación y verificación exhaustiva de renderizado de diagramas antes de disparar la señal de impresión
  useEffect(() => {
    if (!isDataLoaded || !data || !data.docs || data.docs.length === 0) return;

    let debounceTimer = null;
    let pollInterval = null;
    let maxSafetyTimeout = null;
    let readyTriggered = false;

    const evaluateReadiness = () => {
      if (readyTriggered) return;

      // 1. Estado del coordinador de Mermaid
      const status = mermaidCoordinator.getStatus();
      const noPendingInCoordinator = status.pending === 0;

      // 2. Comprobación directa en el DOM de elementos en estado de carga (skeleton / animate-pulse)
      const loadingElements = document.querySelectorAll('[data-mermaid-loading="true"]');
      const noLoadingInDom = loadingElements.length === 0;

      // 3. Comprobación de que los SVGs esperados estén en el DOM o que el coordinador haya terminado
      const renderedFigures = document.querySelectorAll('[data-mermaid-rendered="true"]');
      const expectedMet = (totalExpectedDiagrams === 0) || 
                          (renderedFigures.length >= totalExpectedDiagrams) || 
                          (status.rendered + status.failed >= totalExpectedDiagrams);

      const isReady = noPendingInCoordinator && noLoadingInDom && expectedMet;

      if (isReady) {
        readyTriggered = true;
        if (pollInterval) clearInterval(pollInterval);
        if (debounceTimer) clearTimeout(debounceTimer);
        // Pausa de 600ms para estabilización de layout, fuentes web y dimensiones de los SVGs
        debounceTimer = setTimeout(() => {
          setIsPrintReady(true);
        }, 600);
      }
    };

    // Suscribirse a cambios en el coordinador
    const unsubscribe = mermaidCoordinator.subscribe(() => {
      evaluateReadiness();
    });

    // Polling de verificación continua cada 150ms como salvaguarda
    pollInterval = setInterval(() => {
      evaluateReadiness();
    }, 150);

    // Timeout de seguridad máximo (20 segundos)
    maxSafetyTimeout = setTimeout(() => {
      console.warn('Timeout de seguridad para impresión de documentación alcanzado');
      setIsPrintReady(true);
    }, 20000);

    // Evaluación inmediata inicial
    evaluateReadiness();

    return () => {
      unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
      if (debounceTimer) clearTimeout(debounceTimer);
      if (maxSafetyTimeout) clearTimeout(maxSafetyTimeout);
    };
  }, [isDataLoaded, data, totalExpectedDiagrams]);

  // Agrupar documentos por módulo manteniendo el orden original (Debe ir antes de cualquier return condicional)
  const modulosAgrupados = useMemo(() => {
    if (!data || !data.docs || !Array.isArray(data.docs)) return [];
    const map = new Map();
    data.docs.forEach((doc) => {
      const key = doc.seccionKey || "general";
      if (!map.has(key)) {
        map.set(key, {
          seccionKey: key,
          seccionTitulo: doc.seccionTitulo || key,
          seccionSubtitulo: doc.seccionSubtitulo || "",
          docs: []
        });
      }
      map.get(key).docs.push(doc);
    });
    return Array.from(map.values());
  }, [data]);

  if (!isDataLoaded || !data || !data.docs || data.docs.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-sans">
        Cargando manual y documentación para impresión...
      </div>
    );
  }

  const {
    alcance = "guia_actual",
    tituloPrincipal = "Documentación del Sistema AguaVP",
    subtitulo = "Manual de Operación y Procedimientos",
    fechaHoy = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }),
    incluirPortada = true,
    incluirIndice = true,
    docs = []
  } = data;

  const escudoImg = logoSrc;
  const esManualCompleto = alcance === "manual_completo";

  return (
    <div className="doc-print-root bg-white text-slate-900 font-sans min-h-screen">
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 12mm 12mm 14mm 12mm;
          }
          
          /* RESET COMPLETO DE ESTILOS DE IMPRESIÓN */
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }

          /* FONDO BLANCO ABSOLUTO */
          html, body, #root, main, #app, .doc-print-root {
            background-color: #ffffff !important;
            color: #0f172a !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Asegurar que el texto sea siempre oscuro y visible (evita texto blanco en dark mode) */
          .doc-print-root, .doc-print-root p, .doc-print-root span, .doc-print-root div, .doc-print-root li, .doc-print-root td, .doc-print-root th {
            color: #0f172a !important;
          }

          .doc-print-root {
            width: 100% !important;
            background: #ffffff !important;
          }

          /* Colores de badges y portadas */
          .bg-blue-50 { background-color: #eff6ff !important; }
          .bg-blue-600 { background-color: #2563eb !important; color: #ffffff !important; }
          .bg-blue-600 * { color: #ffffff !important; }
          .bg-blue-800 { background-color: #1e40af !important; color: #ffffff !important; }
          .bg-blue-800 * { color: #ffffff !important; }
          .bg-slate-50 { background-color: #f8fafc !important; }
          .bg-slate-100 { background-color: #f1f5f9 !important; }

          .doc-article-block {
            padding: 0 !important;
            margin: 0 !important;
          }
          .doc-article-divider {
            margin-top: 18px !important;
            padding-top: 14px !important;
            border-top: 1px dashed #cbd5e1 !important;
          }
          .page-break-after {
            break-after: page !important;
            page-break-after: always !important;
          }
          .avoid-break, 
          .callout-box, 
          .placeholder-card, 
          .table-box, 
          table, 
          tr, 
          blockquote, 
          pre, 
          figure, 
          .mermaid-diagram-figure,
          .katex-display,
          li {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .mermaid-diagram-figure {
            margin-top: 6px !important;
            margin-bottom: 8px !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .mermaid-svg-container {
            padding: 4px !important;
          }
          .mermaid-svg-container svg {
            max-width: 100% !important;
            height: auto !important;
            max-height: 180mm !important;
          }
          h1, h2, h3, h4, h5, h6 {
            break-after: avoid !important;
            page-break-after: avoid !important;
            break-inside: avoid !important;
            color: #0f172a !important;
          }
          .prose h1, h1 {
            font-size: 14pt !important;
            line-height: 1.25 !important;
            margin-top: 10px !important;
            margin-bottom: 5px !important;
            padding-bottom: 3px !important;
          }
          .prose h2, h2 {
            font-size: 12pt !important;
            line-height: 1.3 !important;
            margin-top: 9px !important;
            margin-bottom: 4px !important;
          }
          .prose h3, h3 {
            font-size: 10.5pt !important;
            line-height: 1.3 !important;
            margin-top: 7px !important;
            margin-bottom: 3px !important;
          }
          .prose h4, h4 {
            font-size: 9.5pt !important;
            line-height: 1.3 !important;
            margin-top: 5px !important;
            margin-bottom: 3px !important;
          }
          .prose p, p {
            font-size: 9pt !important;
            line-height: 1.38 !important;
            margin-bottom: 5px !important;
            orphans: 3 !important;
            widows: 3 !important;
          }
          .prose ul, .prose ol, ul, ol {
            font-size: 9pt !important;
            margin-top: 3px !important;
            margin-bottom: 5px !important;
            padding-left: 16px !important;
          }
          .prose li, li {
            margin-bottom: 2px !important;
          }
          .callout-box, blockquote {
            margin-top: 5px !important;
            margin-bottom: 5px !important;
            padding: 5px 9px !important;
            border-radius: 6px !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .placeholder-card {
            margin-top: 5px !important;
            margin-bottom: 5px !important;
            padding: 6px 9px !important;
            border-radius: 6px !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          table {
            width: 100% !important;
            font-size: 8pt !important;
            border-collapse: collapse !important;
            margin-top: 5px !important;
            margin-bottom: 6px !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          th, td {
            padding: 3px 5px !important;
            border: 1px solid #cbd5e1 !important;
          }
          th {
            background-color: #f1f5f9 !important;
            font-weight: 700 !important;
          }
          pre {
            font-size: 8pt !important;
            margin-top: 5px !important;
            margin-bottom: 5px !important;
            padding: 5px 9px !important;
            border-radius: 6px !important;
            white-space: pre-wrap !important;
            word-break: break-all !important;
            break-inside: avoid !important;
          }
          .portada-doc {
            box-sizing: border-box !important;
            min-height: 235mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            align-items: center !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            break-after: page !important;
            page-break-after: always !important;
            padding: 10mm 0 !important;
            margin: 0 !important;
          }
          .portada-modulo-doc {
            box-sizing: border-box !important;
            min-height: 235mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            align-items: center !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            break-after: page !important;
            page-break-after: always !important;
            padding: 10mm 0 !important;
            margin: 0 !important;
          }
          .indice-doc {
            box-sizing: border-box !important;
            break-after: page !important;
            page-break-after: always !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .doc-chapter-header {
            margin-bottom: 6px !important;
            padding-bottom: 3px !important;
            border-bottom: 1px solid #cbd5e1 !important;
          }
          .doc-chapter-footer {
            margin-top: 8px !important;
            padding-top: 3px !important;
            border-top: 1px solid #e2e8f0 !important;
          }
        }
        @media screen {
          .portada-doc, .portada-modulo-doc {
            min-height: 75vh;
            padding: 2rem;
            margin-bottom: 2rem;
            border: 1px solid #e2e8f0;
            border-radius: 1rem;
          }
          .doc-article-block {
            margin-bottom: 2rem;
            padding: 1.5rem;
          }
          .indice-doc {
            padding: 1.5rem;
            margin-bottom: 2rem;
            border: 1px solid #e2e8f0;
            border-radius: 1rem;
          }
        }
      `}</style>

      {/* ── 1. PORTADA PRINCIPAL INSTITUCIONAL (Para Módulo o Manual Completo) ── */}
      {alcance !== "guia_actual" && incluirPortada && (
        <div className="portada-doc page-break-after">
          {/* Cabecera Portada */}
          <div className="w-full flex justify-between items-center border-b pb-4 border-slate-200 avoid-break print-header">
            <img src={escudoImg} alt="Escudo Institucional" className="w-16 h-auto object-contain" />
            <div className="text-right">
              <h4 className="font-black text-xs uppercase tracking-widest text-slate-800">Sistema AguaVP</h4>
              <p className="text-[11px] text-slate-500 font-medium">Organismo Operador de Agua Potable</p>
            </div>
          </div>

          {/* Títulos Centrales */}
          <div className="space-y-4 max-w-xl text-center my-auto py-8 avoid-break">
            <span className="inline-block px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-blue-50 text-blue-800 border border-blue-200">
              {esManualCompleto ? "Manual General de Operación" : "Manual de Procedimientos por Módulo"}
            </span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">
              {tituloPrincipal}
            </h1>
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              {subtitulo}
            </p>
            {esManualCompleto && (
              <div className="pt-2 text-xs font-semibold text-slate-500">
                <span>Compilación Oficial • {modulosAgrupados.length} Módulos • {docs.length} Guías de Operación</span>
              </div>
            )}
          </div>

          {/* Pie de Portada */}
          <div className="w-full border-t pt-4 border-slate-200 flex justify-between text-[11px] text-slate-500 avoid-break">
            <span>Fecha de Emisión: <strong className="text-slate-700">{fechaHoy}</strong></span>
            <span>Versión del Software: <strong className="text-slate-700">1.2 Oficial</strong></span>
          </div>
        </div>
      )}

      {/* ── 2. TABLA DE CONTENIDOS / ÍNDICE ORGANIZADO POR MÓDULOS ── */}
      {alcance !== "guia_actual" && incluirIndice && docs.length > 1 && (
        <div className="indice-doc page-break-after">
          <div className="border-b-2 border-slate-900 pb-2 mb-4 flex justify-between items-baseline avoid-break">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-wider">
              Tabla de Contenidos
            </h2>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {modulosAgrupados.length} Módulos • {docs.length} Temas
            </span>
          </div>

          <div className="space-y-3.5">
            {modulosAgrupados.map((modulo, mIdx) => (
              <div key={mIdx} className="avoid-break mb-2.5">
                {/* Encabezado del Módulo en el Índice */}
                <div className="flex items-center justify-between border-b-2 border-slate-300 pb-1 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="bg-blue-800 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shrink-0">
                      Módulo {String(mIdx + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 truncate">
                      {modulo.seccionTitulo}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-2">
                    {modulo.docs.length} guías
                  </span>
                </div>

                {/* Lista de Guías de este Módulo */}
                <div className="space-y-1 pl-2.5">
                  {modulo.docs.map((doc, dIdx) => (
                    <div key={dIdx} className="flex justify-between items-baseline border-b border-slate-100 pb-0.5">
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span className="font-mono text-xs font-bold text-blue-700 shrink-0 w-4">
                          {String(dIdx + 1).padStart(2, "0")}.
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs text-slate-800 truncate">
                            {doc.titulo}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium truncate">
                            {doc.descripcion || "Guía de operación y procedimiento"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0 ml-2">
                        Guía {doc.orden || dIdx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. CUERPO PRINCIPAL CON HOJAS SEPARADORAS Y FLUJO CONTINUO ── */}
      {modulosAgrupados.map((modulo, mIdx) => (
        <section key={modulo.seccionKey} className="doc-module-section">
          
          {/* HOJA SEPARADORA DE MÓDULO (Solo para Manual Completo con múltiples módulos) */}
          {esManualCompleto && (
            <div className="portada-modulo-doc page-break-after">
              {/* Cabecera Separador */}
              <div className="w-full flex justify-between items-center border-b pb-4 border-slate-200 avoid-break print-header">
                <div className="flex items-center gap-3">
                  <img src={escudoImg} alt="Escudo Institucional" className="w-12 h-auto object-contain" />
                  <div>
                    <h5 className="font-black text-[10px] uppercase tracking-widest text-slate-800">Sistema AguaVP</h5>
                    <p className="text-[9px] text-slate-400">Manual General de Operación</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-mono text-[10px] font-bold border border-slate-200">
                  Capítulo {String(mIdx + 1).padStart(2, "0")}
                </span>
              </div>

              {/* Título Central del Módulo */}
              <div className="space-y-3 max-w-xl text-center my-auto py-6 avoid-break w-full">
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-blue-600 text-white shadow-sm">
                  MÓDULO {String(mIdx + 1).padStart(2, "0")}
                </span>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
                  {modulo.seccionTitulo}
                </h2>
                {modulo.seccionSubtitulo && (
                  <p className="text-xs font-medium text-slate-600 leading-relaxed max-w-md mx-auto">
                    {modulo.seccionSubtitulo}
                  </p>
                )}

                {/* Tarjeta de Contenido del Módulo (Grid compacto de 2 columnas para no desbordar) */}
                <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left w-full">
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 border-b pb-1 border-slate-200">
                    Contenido de este Capítulo ({modulo.docs.length} Guías)
                  </span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    {modulo.docs.map((doc, dIdx) => (
                      <div key={dIdx} className="flex items-center gap-1.5 text-slate-700 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        <span className="font-semibold truncate text-[11px]">
                          {String(dIdx + 1).padStart(2, "0")}. {doc.titulo}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pie del Separador */}
              <div className="w-full border-t pt-4 border-slate-200 flex justify-between text-[10px] text-slate-400 avoid-break">
                <span>Organismo Operador de Agua Potable AguaVP</span>
                <span>Módulo {String(mIdx + 1).padStart(2, "0")} • {modulo.seccionTitulo}</span>
              </div>
            </div>
          )}

          {/* GUÍAS DEL MÓDULO (Flujo continuo sin cortes artificiales) */}
          <div className="doc-module-guides">
            {modulo.docs.map((doc, docIndex) => (
              <article
                key={`${doc.seccionKey}-${doc.fileName}-${docIndex}`}
                className={`doc-article-block ${docIndex > 0 ? 'doc-article-divider' : ''}`}
              >
                {/* Encabezado de la Guía */}
                <header className="print-header doc-chapter-header flex justify-between items-center text-xs text-slate-500 avoid-break">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-800 uppercase tracking-wider text-[10px]">
                      AguaVP • {doc.seccionTitulo}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-semibold text-slate-600 text-[10px]">Guía #{doc.orden || docIndex + 1}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">{doc.fileName}</span>
                </header>

                {/* Contenido Markdown Renderizado */}
                <div className="prose prose-slate max-w-none">
                  <MarkdownRenderer content={doc.content} />
                </div>

                {/* Pie de Página de la Guía */}
                <footer className="doc-chapter-footer flex justify-between items-center text-[9px] text-slate-400 avoid-break">
                  <span>Sistema Integral de Agua Potable AguaVP</span>
                  <span>{doc.seccionTitulo} • {doc.titulo}</span>
                </footer>
              </article>
            ))}
          </div>

        </section>
      ))}

    </div>
  );
};

export default ReporteDocumentacion;
