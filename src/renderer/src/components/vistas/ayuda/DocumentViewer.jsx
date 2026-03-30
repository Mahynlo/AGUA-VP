import React from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Breadcrumbs,
  BreadcrumbItem
} from "@nextui-org/react";
import {
  HiHome,
  HiDocumentText,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineInformationCircle
} from "react-icons/hi";
import { MarkdownRenderer } from "./MarkdownRenderer";

const DocumentViewer = ({
  currentContent,
  currentMetadata,
  selectedSection,
  selectedFile,
  currentFileIndex,
  getCurrentFiles,
  getCurrentSectionConfig,
  navegarAnterior,
  navegarSiguiente
}) => {
  const totalFiles = getCurrentFiles()?.length || 0;
  const hasMultipleFiles = totalFiles > 1;

  // Obtenemos los nombres de los archivos anterior/siguiente para los botones inferiores
  const prevFile = currentFileIndex > 0 ? getCurrentFiles()[currentFileIndex - 1] : null;
  const nextFile = currentFileIndex < totalFiles - 1 ? getCurrentFiles()[currentFileIndex + 1] : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* ── 1. HEADER Y BREADCRUMBS ── */}
      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex flex-col items-start gap-4 px-6 sm:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            
            {/* Rutas de navegación (Breadcrumbs) */}
            <div className="flex items-center gap-2 flex-1 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
              <Breadcrumbs 
                variant="solid" 
                classNames={{
                  list: "bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 shadow-inner",
                }}
                itemClasses={{
                  item: "text-slate-500 dark:text-zinc-400 data-[current=true]:text-slate-800 dark:data-[current=true]:text-zinc-100 font-medium text-xs",
                  separator: "text-slate-400 dark:text-zinc-500"
                }}
              >
                <BreadcrumbItem startContent={<HiHome className="w-4 h-4" />}>
                  Ayuda
                </BreadcrumbItem>
                <BreadcrumbItem startContent={getCurrentSectionConfig()?.icon}>
                  {getCurrentSectionConfig()?.title || selectedSection}
                </BreadcrumbItem>
                <BreadcrumbItem startContent={<HiDocumentText className="w-4 h-4" />}>
                  {currentMetadata.titulo || selectedFile.replace('.md', '')}
                </BreadcrumbItem>
              </Breadcrumbs>
            </div>

            {/* Controles superiores Anterior/Siguiente */}
            {hasMultipleFiles && (
              <div className="flex items-center gap-3 shrink-0">
                <Chip size="sm" variant="flat" className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-[10px] px-1">
                  {currentFileIndex + 1} DE {totalFiles}
                </Chip>
                <div className="flex gap-1.5">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 transition-colors"
                    onPress={navegarAnterior}
                    isDisabled={currentFileIndex === 0}
                  >
                    <HiChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 transition-colors"
                    onPress={navegarSiguiente}
                    isDisabled={currentFileIndex === totalFiles - 1}
                  >
                    <HiChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Caja de Descripción (Si el documento tiene una) */}
          {currentMetadata.descripcion && (
            <div className="w-full mt-2 p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-700/50 flex gap-3">
              <HiOutlineInformationCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-slate-600 dark:text-zinc-400 leading-relaxed">
                {currentMetadata.descripcion}
              </p>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* ── 2. CONTENIDO DEL DOCUMENTO (MARKDOWN) ── */}
      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
        <CardBody className="p-6 sm:p-10 lg:p-12">
          {/* prose-slate / prose-invert: Ajusta los colores del texto al modo claro/oscuro 
            max-w-none: Para que ocupe todo el ancho de la tarjeta
            prose-headings: Títulos más estilizados
            prose-a: Enlaces en color azul
          */}
          <div className="prose prose-slate dark:prose-invert max-w-none 
            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-800 dark:prose-headings:text-zinc-100
            prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-500
            prose-code:bg-slate-100 dark:prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-slate-800 dark:prose-code:text-zinc-200 prose-code:before:content-none prose-code:after:content-none
            prose-img:rounded-xl prose-img:border prose-img:border-slate-200 dark:prose-img:border-zinc-800
          ">
            <MarkdownRenderer content={currentContent} />
          </div>
        </CardBody>
      </Card>

      {/* ── 3. NAVEGACIÓN INFERIOR ESTILO DOCS ── */}
      {hasMultipleFiles && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          
          {/* Botón Anterior */}
          {prevFile ? (
            <button
              onClick={navegarAnterior}
              className="flex flex-col items-start p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700 transition-colors group text-left shadow-sm"
            >
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 group-hover:text-blue-500 transition-colors">
                <HiChevronLeft className="w-4 h-4" />
                Anterior
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                {prevFile.metadata?.titulo || prevFile.fileName.replace('.md', '')}
              </span>
            </button>
          ) : <div />} {/* Espaciador si no hay previo */}

          {/* Botón Siguiente */}
          {nextFile ? (
            <button
              onClick={navegarSiguiente}
              className="flex flex-col items-end p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700 transition-colors group text-right shadow-sm"
            >
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 group-hover:text-blue-500 transition-colors">
                Siguiente
                <HiChevronRight className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                {nextFile.metadata?.titulo || nextFile.fileName.replace('.md', '')}
              </span>
            </button>
          ) : <div />} {/* Espaciador si no hay siguiente */}

        </div>
      )}

    </div>
  );
};

export default DocumentViewer;
