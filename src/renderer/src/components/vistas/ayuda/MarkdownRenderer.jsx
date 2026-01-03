import React from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export const MarkdownRenderer = ({ content }) => {
  const customComponents = {
    h1: ({ children }) => <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-6 first:mt-0">{children}</h1>,
    h2: ({ children }) => <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">{children}</h3>,
    h4: ({ children }) => <h4 className="text-lg font-semibold text-gray-800 dark:text-white mt-4 mb-2">{children}</h4>,
    p: ({ children }) => <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{children}</p>,
    strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
    ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2 ml-4">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2 ml-4">{children}</ol>,
    li: ({ children }) => <li className="text-gray-700 dark:text-gray-300">{children}</li>,
    code: ({ children, inline }) => 
      inline ? 
        <code className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded text-sm">{children}</code> :
        <code className="block bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-4 rounded-lg overflow-x-auto text-sm">{children}</code>,
    pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>,
    a: ({ children, href }) => <a href={href} className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
    hr: () => <hr className="my-8 border-gray-300 dark:border-gray-600" />,
    blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4 bg-blue-50 dark:bg-blue-900/20 py-2 rounded">{children}</blockquote>,
    table: ({ children }) => <div className="overflow-x-auto my-4"><table className="min-w-full border border-gray-300 dark:border-gray-600">{children}</table></div>,
    thead: ({ children }) => <thead className="bg-gray-100 dark:bg-gray-800">{children}</thead>,
    th: ({ children }) => <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold">{children}</th>,
    td: ({ children }) => <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{children}</td>,
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
