import React from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export const MarkdownRenderer = ({ content }) => {
  const customComponents = {
    // ── TÍTULOS ──
    h1: ({ children }) => (
      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-8 mb-6 leading-tight first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-zinc-100 tracking-tight mt-10 mb-5 leading-snug border-b border-slate-200 dark:border-zinc-800 pb-2">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100 tracking-tight mt-8 mb-4">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg font-bold text-slate-700 dark:text-zinc-300 mt-6 mb-3 uppercase tracking-wider text-[13px]">
        {children}
      </h4>
    ),

    // ── PÁRRAFOS Y TEXTO ──
    p: ({ children }) => (
      <p className="text-slate-600 dark:text-zinc-400 mb-5 leading-relaxed text-[15px] sm:text-base font-medium">
        {children}
      </p>
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>
    ),

    // ── LISTAS ──
    ul: ({ children }) => (
      <ul className="list-disc list-outside mb-6 space-y-2 ml-5 text-slate-600 dark:text-zinc-400 marker:text-slate-400 dark:marker:text-zinc-500 text-[15px] sm:text-base font-medium">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-outside mb-6 space-y-2 ml-5 text-slate-600 dark:text-zinc-400 marker:font-bold marker:text-slate-500 dark:marker:text-zinc-500 text-[15px] sm:text-base font-medium">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="pl-1">{children}</li>,

    // ── CÓDIGO (INLINE Y BLOQUE) ──
    code: ({ children, inline, className, ...props }) => 
      inline ? (
        // Código suelto dentro del texto (Ej: `npm install`)
        <code className="font-mono text-[13px] bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 px-1.5 py-0.5 rounded-md font-bold border border-slate-200 dark:border-zinc-700" {...props}>
          {children}
        </code>
      ) : (
        // El texto de código puro dentro de un bloque <pre>
        <code className={`font-mono text-sm ${className || ''}`} {...props}>
          {children}
        </code>
      ),
    pre: ({ children }) => (
      // El bloque negro/oscuro que envuelve el código (Estilo Terminal)
      <pre className="bg-slate-900 dark:bg-black text-slate-50 p-5 rounded-2xl overflow-x-auto mb-6 shadow-lg border border-slate-800 dark:border-zinc-800 custom-scrollbar leading-relaxed">
        {children}
      </pre>
    ),

    // ── ENLACES Y SEPARADORES ──
    a: ({ children, href }) => (
      <a 
        href={href} 
        className="text-blue-600 dark:text-blue-400 font-bold hover:text-blue-500 decoration-blue-300 dark:decoration-blue-800 underline underline-offset-4 transition-colors" 
        target="_blank" 
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    hr: () => <hr className="my-10 border-slate-200 dark:border-zinc-800" />,

    // ── CITAS (NOTAS/ALERTAS) ──
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-500/50 py-3 px-5 rounded-r-2xl my-6 text-slate-700 dark:text-zinc-300 italic font-medium shadow-sm">
        {children}
      </blockquote>
    ),

    // ── TABLAS ──
    table: ({ children }) => (
      <div className="overflow-x-auto my-8 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
        {children}
      </thead>
    ),
    th: ({ children }) => (
      <th className="px-4 py-3 font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800/50 text-slate-600 dark:text-zinc-300 font-medium">
        {children}
      </td>
    ),
    tr: ({ children }) => (
      <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors last:border-0 group">
        {children}
      </tr>
    ),
  };

  return (
    <ReactMarkdown 
      components={customComponents}
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
    >
      {content}
    </ReactMarkdown>
  );
};
