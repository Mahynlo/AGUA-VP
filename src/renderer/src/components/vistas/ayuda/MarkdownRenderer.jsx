import React, { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import mermaid from 'mermaid';
import {
  HiOutlineClipboardCopy,
  HiCheck,
  HiInformationCircle,
  HiLightBulb,
  HiExclamation,
  HiExclamationCircle,
  HiLink,
  HiZoomIn,
  HiX,
  HiPhotograph
} from "react-icons/hi";

// Función utilitaria para generar IDs consistentes a partir de títulos
export const slugify = (text) => {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
};

// Extraer texto plano de React children recursivamente
export const extractTextFromChildren = (node) => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromChildren).join('');
  if (node?.props?.children) return extractTextFromChildren(node.props.children);
  return '';
};

// Componente para imágenes con soporte de rutas relativas, Lightbox Zoom y Placeholder Informativo
const DocImage = ({ src, alt, ...props }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    if (!src) {
      setHasError(true);
      return;
    }
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
      setImgSrc(src);
      return;
    }

    // Si es una ruta relativa local, cargar vía IPC si está disponible
    if (window.docsApp?.loadDocumentationImage) {
      setLoading(true);
      window.docsApp.loadDocumentationImage(src)
        .then((res) => {
          if (res?.success && res.dataUri) {
            setImgSrc(res.dataUri);
            setHasError(false);
          } else {
            setHasError(true);
          }
        })
        .catch((err) => {
          console.warn("Error cargando imagen vía IPC:", err);
          setHasError(true);
        })
        .finally(() => setLoading(false));
    } else {
      setImgSrc(src);
    }
  }, [src]);

  // Si la imagen aún no existe físicamente en disco, renderizamos un indicador visual profesional
  if (hasError) {
    const filename = src?.split(/[/|\\]/).pop() || "captura.png";
    return (
      <div className="my-6 p-4 sm:p-5 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 shadow-2xs group transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-800 placeholder-card avoid-break">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 border border-blue-200/60 dark:border-blue-800/40">
            <HiPhotograph className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-2xs">
                📷 Espacio Reservado para Captura
              </span>
              <code className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 bg-white/80 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-800">
                {filename}
              </code>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 leading-snug">
              {alt || "Captura de pantalla ilustrativa del sistema"}
            </p>
            <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate">
              Ruta destino: <span className="font-mono text-blue-600 dark:text-blue-400">{src}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <figure className="my-6 mx-auto max-w-full avoid-break">
        <div
          onClick={() => setIsModalOpen(true)}
          className="relative group cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-slate-100/50 dark:bg-zinc-900/50 shadow-md hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300"
        >
          {loading ? (
            <div className="h-48 flex items-center justify-center bg-slate-100 dark:bg-zinc-900 animate-pulse">
              <span className="text-xs font-bold text-slate-400">Cargando captura...</span>
            </div>
          ) : (
            <img
              src={imgSrc}
              alt={alt || "Captura del sistema"}
              loading="lazy"
              decoding="async"
              onError={() => setHasError(true)}
              className="w-full h-auto object-contain max-h-[520px] transition-transform duration-300 group-hover:scale-[1.015]"
              {...props}
            />
          )}

          {/* Overlay hover con botón de zoom */}
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="px-3.5 py-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-slate-800 dark:text-zinc-100 text-xs font-bold shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
              <HiZoomIn className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Clic para ampliar captura
            </span>
          </div>
        </div>

        {alt && (
          <figcaption className="text-center text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-2.5 px-2 leading-relaxed">
            📷 {alt}
          </figcaption>
        )}
      </figure>

      {/* Modal Lightbox de Pantalla Completa */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[90vh] bg-white dark:bg-zinc-950 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-zinc-900/80 shrink-0">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 truncate pr-4">
                {alt || "Vista ampliada de captura"}
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
                title="Cerrar vista ampliada"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido de la imagen */}
            <div className="p-3 overflow-auto flex items-center justify-center bg-slate-900/5 dark:bg-black/40">
              <img
                src={imgSrc}
                alt={alt || "Captura ampliada"}
                decoding="async"
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

let mermaidInitialized = false;
let mermaidCounter = 0;
export const chartSvgCache = new Map();

// Gestor reactivo de estado para coordinar la carga de diagramas con la vista y el sistema de impresión
const coordinatorListeners = new Set();
const pendingDiagrams = new Set();
const renderedDiagrams = new Set();
const failedDiagrams = new Set();

export const mermaidCoordinator = {
  register: (id) => {
    pendingDiagrams.add(id);
    mermaidCoordinator._notify();
  },
  markRendered: (id) => {
    pendingDiagrams.delete(id);
    renderedDiagrams.add(id);
    mermaidCoordinator._notify();
  },
  markFailed: (id) => {
    pendingDiagrams.delete(id);
    failedDiagrams.add(id);
    mermaidCoordinator._notify();
  },
  unregister: (id) => {
    pendingDiagrams.delete(id);
    mermaidCoordinator._notify();
  },
  getStatus: () => ({
    pending: pendingDiagrams.size,
    rendered: renderedDiagrams.size,
    failed: failedDiagrams.size,
    isAllDone: pendingDiagrams.size === 0
  }),
  subscribe: (fn) => {
    coordinatorListeners.add(fn);
    return () => coordinatorListeners.delete(fn);
  },
  _notify: () => {
    const status = mermaidCoordinator.getStatus();
    coordinatorListeners.forEach((fn) => {
      try { fn(status); } catch (e) {}
    });
    if (typeof window !== 'undefined') {
      window.__aguavp_mermaid_pending = status.pending;
      window.__aguavp_mermaid_rendered = status.rendered;
      window.dispatchEvent(new CustomEvent('aguavp-mermaid-status', { detail: status }));
    }
  }
};

// Cola de renderizado secuencial para evitar colisiones en el DOM interno de Mermaid
let renderQueue = Promise.resolve();

export const renderMermaidSequential = (chartText) => {
  const clean = (chartText || '').trim();
  if (!clean) return Promise.resolve('');

  if (chartSvgCache.has(clean)) {
    return Promise.resolve(chartSvgCache.get(clean));
  }

  const task = renderQueue.then(async () => {
    if (chartSvgCache.has(clean)) {
      return chartSvgCache.get(clean);
    }

    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        securityLevel: 'loose',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        logLevel: 'error',
        suppressErrorRendering: true
      });
      mermaidInitialized = true;
    }

    mermaidCounter++;
    const id = `mermaid-svg-${mermaidCounter}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      const { svg } = await mermaid.render(id, clean);
      chartSvgCache.set(clean, svg);
      return svg;
    } catch (err) {
      const errorEl = document.getElementById(id) || document.getElementById(`d${id}`);
      if (errorEl) errorEl.remove();
      throw err;
    }
  });

  // Mantener viva la cadena secuencial aunque un diagrama individual falle
  renderQueue = task.catch((err) => {
    console.warn("Aviso en cola Mermaid:", err);
  });

  return task;
};

// Componente interactivo para renderizar diagramas Mermaid en SVG vectoriales
const MermaidDiagram = ({ chart }) => {
  const cleanChart = React.useMemo(() => (chart || '').trim(), [chart]);
  const cachedSvg = React.useMemo(() => chartSvgCache.get(cleanChart), [cleanChart]);

  // Si ya está en caché, inicializar directamente con el SVG y loading = false (cero parpadeo y renderizado instantáneo)
  const [svgContent, setSvgContent] = useState(() => cachedSvg || '');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(() => !cachedSvg && Boolean(cleanChart));
  const diagramIdRef = React.useRef(null);

  if (!diagramIdRef.current) {
    diagramIdRef.current = `diag-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
  }
  const diagramId = diagramIdRef.current;

  useEffect(() => {
    let isMounted = true;

    // Si ya tenemos el SVG del caché, marcar como renderizado directamente
    if (cachedSvg) {
      setSvgContent(cachedSvg);
      setLoading(false);
      setError(null);
      mermaidCoordinator.markRendered(diagramId);
      return () => {
        mermaidCoordinator.unregister(diagramId);
      };
    }

    if (!cleanChart) {
      setError('Diagrama sin contenido');
      setLoading(false);
      mermaidCoordinator.markFailed(diagramId);
      return;
    }

    mermaidCoordinator.register(diagramId);

    renderMermaidSequential(cleanChart)
      .then((svg) => {
        if (isMounted) {
          setSvgContent(svg);
          setError(null);
          setLoading(false);
        }
        mermaidCoordinator.markRendered(diagramId);
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.message || 'Error de formato en diagrama Mermaid');
          setLoading(false);
        }
        mermaidCoordinator.markFailed(diagramId);
      });

    return () => {
      isMounted = false;
      mermaidCoordinator.unregister(diagramId);
    };
  }, [cleanChart, cachedSvg, diagramId]);

  if (error) {
    return (
      <div 
        data-mermaid-error="true"
        className="my-6 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 p-4 text-xs font-mono avoid-break"
      >
        <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 mb-2">
          <span>⚠️ Diagrama de proceso (Sintaxis no interpretada):</span>
        </div>
        <pre className="text-slate-700 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  if (loading) {
    return (
      <div 
        data-mermaid-loading="true"
        className="my-6 flex items-center justify-center p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 animate-pulse avoid-break"
      >
        <span className="text-xs font-semibold text-slate-400">Generando diagrama de proceso...</span>
      </div>
    );
  }

  return (
    <figure 
      data-mermaid-rendered="true"
      className="my-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm overflow-hidden avoid-break mermaid-diagram-figure"
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/90 text-xs font-bold text-slate-600 dark:text-zinc-300 print:hidden">
        <span className="uppercase tracking-widest text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1.5 font-sans">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          Diagrama de Proceso
        </span>
      </div>
      <div
        className="p-4 sm:p-6 overflow-x-auto flex items-center justify-center bg-white dark:bg-zinc-950/40 mermaid-svg-container [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:mx-auto"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </figure>
  );
};

// Componente para bloques de código con botón de copiado
const CodeBlock = ({ children, className }) => {
  const [copied, setCopied] = useState(false);
  const childClass = children?.props?.className || '';
  const rawLang = (className || childClass || '').replace('language-', '').trim();
  const language = rawLang || 'texto';

  if (language === 'mermaid') {
    const rawCode = extractTextFromChildren(children);
    return <MermaidDiagram chart={rawCode} />;
  }

  const handleCopy = async () => {
    const rawCode = extractTextFromChildren(children);
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar código:", err);
    }
  };

  return (
    <div className="relative my-6 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg group avoid-break">
      {/* Cabecera del bloque */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 text-xs font-mono text-slate-400 avoid-break">
        <span className="uppercase tracking-widest text-[10px] font-bold text-slate-300">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px] font-sans font-bold"
          title="Copiar código al portapapeles"
        >
          {copied ? (
            <>
              <HiCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copiado</span>
            </>
          ) : (
            <>
              <HiOutlineClipboardCopy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>

      {/* Contenido del código */}
      <pre className="p-4 text-slate-100 font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed custom-scrollbar avoid-break">
        {children}
      </pre>
    </div>
  );
};

// Limpiar el tag [!TIPO] del árbol de elementos React recursivamente
const stripCalloutTag = (nodes) => {
  let stripped = false;

  const clean = (node) => {
    if (stripped || !node) return node;

    if (typeof node === 'string') {
      const regex = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i;
      if (regex.test(node)) {
        stripped = true;
        const cleaned = node.replace(regex, '');
        return cleaned.trim() === '' ? null : cleaned;
      }
      return node;
    }

    if (Array.isArray(node)) {
      return node.map(clean).filter(n => n !== null);
    }

    if (React.isValidElement(node) && node.props?.children) {
      const newChildren = clean(node.props.children);
      return React.cloneElement(node, {
        children: Array.isArray(newChildren) && newChildren.length === 0 ? null : newChildren
      });
    }

    return node;
  };

  return clean(nodes);
};

// Componente para Blockquotes con soporte de GitHub Callouts ([!NOTE], [!TIP], etc.)
const CalloutBlockquote = ({ children }) => {
  const fullText = extractTextFromChildren(children).trim();
  const match = fullText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);

  const calloutType = match ? match[1].toLowerCase() : null;

  const config = {
    note: {
      title: 'Nota informativa',
      icon: <HiInformationCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      border: 'border-l-4 border-blue-500 bg-blue-50/80 dark:bg-blue-950/30 text-blue-950 dark:text-blue-200'
    },
    tip: {
      title: 'Consejo práctico',
      icon: <HiLightBulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      border: 'border-l-4 border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200'
    },
    important: {
      title: 'Importante',
      icon: <HiExclamation className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      border: 'border-l-4 border-amber-500 bg-amber-50/80 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200'
    },
    warning: {
      title: 'Advertencia',
      icon: <HiExclamationCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
      border: 'border-l-4 border-orange-500 bg-orange-50/80 dark:bg-orange-950/30 text-orange-950 dark:text-orange-200'
    },
    caution: {
      title: 'Precaución',
      icon: <HiExclamationCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      border: 'border-l-4 border-rose-500 bg-rose-50/80 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200'
    }
  };

  if (calloutType && config[calloutType]) {
    const active = config[calloutType];
    const cleanedChildren = stripCalloutTag(children);

    return (
      <div className={`rounded-2xl p-4 sm:p-5 my-6 shadow-sm border ${active.border} callout-box avoid-break`}>
        <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider mb-2.5 avoid-break">
          {active.icon}
          <span>{active.title}</span>
        </div>
        <div className="text-sm font-medium leading-relaxed prose-p:my-1 text-slate-800 dark:text-zinc-200">
          {cleanedChildren}
        </div>
      </div>
    );
  }

  // Blockquote estándar
  return (
    <blockquote className="border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 py-3 px-5 rounded-r-2xl my-6 text-slate-700 dark:text-zinc-300 italic font-medium shadow-sm avoid-break">
      {children}
    </blockquote>
  );
};

export const MarkdownRenderer = ({ content }) => {
  const customComponents = {
    // ── TÍTULOS CON ANCHORS / IDS PARA TABLA DE CONTENIDO ──
    h1: ({ children }) => {
      const text = extractTextFromChildren(children);
      const id = slugify(text);
      return (
        <h1 id={id} className="scroll-mt-8 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-8 mb-5 leading-tight first:mt-0 border-b border-slate-100 dark:border-zinc-800/80 pb-3 group">
          {children}
        </h1>
      );
    },
    h2: ({ children }) => {
      const text = extractTextFromChildren(children);
      const id = slugify(text);
      return (
        <h2 id={id} className="scroll-mt-8 text-xl sm:text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight mt-8 mb-4 leading-snug group flex items-center gap-2">
          <span>{children}</span>
        </h2>
      );
    },
    h3: ({ children }) => {
      const text = extractTextFromChildren(children);
      const id = slugify(text);
      return (
        <h3 id={id} className="scroll-mt-8 text-base sm:text-lg font-bold text-slate-800 dark:text-zinc-200 tracking-tight mt-6 mb-3 group flex items-center gap-2">
          <span>{children}</span>
        </h3>
      );
    },
    h4: ({ children }) => {
      const text = extractTextFromChildren(children);
      const id = slugify(text);
      return (
        <h4 id={id} className="scroll-mt-8 text-sm font-bold text-slate-700 dark:text-zinc-300 mt-5 mb-2 uppercase tracking-wider text-[12px]">
          {children}
        </h4>
      );
    },

    // ── PÁRRAFOS Y TEXTO ──
    p: ({ children }) => (
      <p className="text-slate-600 dark:text-zinc-400 mb-4 leading-relaxed text-sm sm:text-[15px] font-medium">
        {children}
      </p>
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-slate-900 dark:text-zinc-100">{children}</strong>
    ),

    // ── LISTAS ──
    ul: ({ children }) => (
      <ul className="list-disc list-outside mb-5 space-y-1.5 ml-5 text-slate-600 dark:text-zinc-400 marker:text-blue-500 dark:marker:text-blue-400 text-sm sm:text-[15px] font-medium">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-outside mb-5 space-y-1.5 ml-5 text-slate-600 dark:text-zinc-400 marker:font-bold marker:text-blue-600 dark:marker:text-blue-400 text-sm sm:text-[15px] font-medium">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="pl-1">{children}</li>,

    // ── CÓDIGO (INLINE Y BLOQUE) ──
    code: ({ children, inline, className, ...props }) =>
      inline ? (
        <code
          className="font-mono text-[12px] bg-slate-100 dark:bg-zinc-800 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-md font-bold border border-slate-200/80 dark:border-zinc-700/80"
          {...props}
        >
          {children}
        </code>
      ) : (
        <code className={`font-mono ${className || ''}`} {...props}>
          {children}
        </code>
      ),
    pre: ({ children, ...props }) => {
      return <CodeBlock {...props}>{children}</CodeBlock>;
    },

    // ── ENLACES Y SEPARADORES ──
    a: ({ children, href }) => (
      <a
        href={href}
        className="text-blue-600 dark:text-blue-400 font-bold hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-4 decoration-blue-300 dark:decoration-blue-700 transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    hr: () => <hr className="my-8 border-slate-200 dark:border-zinc-800" />,

    // ── CITAS Y CALLOUTS / ALERTAS ([!NOTE], [!TIP], etc.) ──
    blockquote: (props) => <CalloutBlockquote {...props} />,

    // ── IMÁGENES CON CAPTION Y LIGHTBOX ZOOM ──
    img: (props) => <DocImage {...props} />,

    // ── TABLAS ──
    table: ({ children }) => (
      <div className="overflow-x-auto my-6 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm bg-white dark:bg-zinc-900 avoid-break table-box">
        <table className="w-full text-left border-collapse text-xs sm:text-sm avoid-break">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-slate-100/80 dark:bg-zinc-800/80 border-b border-slate-200 dark:border-zinc-700">
        {children}
      </thead>
    ),
    th: ({ children }) => (
      <th className="px-4 py-3 font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider text-[10px]">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800/60 text-slate-700 dark:text-zinc-300 font-medium">
        {children}
      </td>
    ),
    tr: ({ children }) => (
      <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors last:border-0 avoid-break">
        {children}
      </tr>
    ),
  };

  return (
    <div className="text-slate-800 dark:text-zinc-200">
      <ReactMarkdown
        urlTransform={(url) => url}
        components={customComponents}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
