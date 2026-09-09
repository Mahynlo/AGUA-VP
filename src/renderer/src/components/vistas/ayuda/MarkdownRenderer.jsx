import React, { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {
  HiOutlineClipboardCopy,
  HiCheck,
  HiInformationCircle,
  HiLightBulb,
  HiExclamation,
  HiExclamationCircle,
  HiLink,
  HiZoomIn,
  HiX
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

// Componente para imágenes con soporte de rutas relativas y Lightbox Zoom
const DocImage = ({ src, alt, ...props }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!src) return;
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
          } else {
            setImgSrc(src);
          }
        })
        .catch((err) => {
          console.warn("Error cargando imagen vía IPC:", err);
          setImgSrc(src);
        })
        .finally(() => setLoading(false));
    } else {
      setImgSrc(src);
    }
  }, [src]);

  return (
    <>
      <figure className="my-6 mx-auto max-w-full">
        <div
          onClick={() => setIsModalOpen(true)}
          className="relative group cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-slate-100/50 dark:bg-zinc-900/50 shadow-md hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300"
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center bg-slate-100 dark:bg-zinc-900 animate-pulse">
              <span className="text-xs font-bold text-slate-400">Cargando captura...</span>
            </div>
          ) : (
            <img
              src={imgSrc}
              alt={alt || "Captura del sistema"}
              loading="lazy"
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
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Componente para bloques de código con botón de copiado
const CodeBlock = ({ children, className }) => {
  const [copied, setCopied] = useState(false);
  const language = (className || '').replace('language-', '') || 'texto';

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
    <div className="relative my-6 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg group">
      {/* Cabecera del bloque */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 text-xs font-mono text-slate-400">
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
      <pre className="p-4 text-slate-100 font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed custom-scrollbar">
        {children}
      </pre>
    </div>
  );
};

// Componente para Blockquotes con soporte de GitHub Callouts ([!NOTE], [!TIP], etc.)
const CalloutBlockquote = ({ children }) => {
  const rawChildren = React.Children.toArray(children);
  const firstChild = rawChildren[0];
  const firstText = typeof firstChild === 'string' ? firstChild : firstChild?.props?.children;
  const textStr = Array.isArray(firstText) ? firstText.join('') : String(firstText || '');

  let calloutType = null;
  if (textStr.includes('[!NOTE]')) calloutType = 'note';
  else if (textStr.includes('[!TIP]')) calloutType = 'tip';
  else if (textStr.includes('[!IMPORTANT]')) calloutType = 'important';
  else if (textStr.includes('[!WARNING]')) calloutType = 'warning';
  else if (textStr.includes('[!CAUTION]')) calloutType = 'caution';

  const config = {
    note: {
      title: 'Nota informativa',
      icon: <HiInformationCircle className="w-5 h-5 text-blue-500" />,
      border: 'border-blue-500/60 bg-blue-50/60 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200'
    },
    tip: {
      title: 'Consejo práctico',
      icon: <HiLightBulb className="w-5 h-5 text-emerald-500" />,
      border: 'border-emerald-500/60 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
    },
    important: {
      title: 'Importante',
      icon: <HiExclamation className="w-5 h-5 text-amber-500" />,
      border: 'border-amber-500/60 bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200'
    },
    warning: {
      title: 'Advertencia',
      icon: <HiExclamationCircle className="w-5 h-5 text-orange-500" />,
      border: 'border-orange-500/60 bg-orange-50/60 dark:bg-orange-950/20 text-orange-900 dark:text-orange-200'
    },
    caution: {
      title: 'Precaución',
      icon: <HiExclamationCircle className="w-5 h-5 text-rose-500" />,
      border: 'border-rose-500/60 bg-rose-50/60 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
    }
  };

  if (calloutType && config[calloutType]) {
    const active = config[calloutType];
    return (
      <div className={`border-l-4 rounded-r-2xl p-4 my-6 shadow-sm ${active.border}`}>
        <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider mb-2">
          {active.icon}
          <span>{active.title}</span>
        </div>
        <div className="text-sm font-medium leading-relaxed prose-p:my-1">
          {children}
        </div>
      </div>
    );
  }

  // Blockquote estándar
  return (
    <blockquote className="border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 py-3 px-5 rounded-r-2xl my-6 text-slate-700 dark:text-zinc-300 italic font-medium shadow-sm">
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

    // ── IMÁGENES CON CAPTION Y LIGHTBOX ZOOM ──
    img: (props) => <DocImage {...props} />,

    // ── TABLAS ──
    table: ({ children }) => (
      <div className="overflow-x-auto my-6 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm bg-white dark:bg-zinc-900">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
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
      <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors last:border-0">
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
