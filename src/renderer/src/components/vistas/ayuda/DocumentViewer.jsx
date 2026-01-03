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
  HiDocument,
  HiChevronLeft,
  HiChevronRight
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
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header con breadcrumbs y navegación */}
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 flex-1">
              <Breadcrumbs>
                <BreadcrumbItem>
                  <div className="flex items-center gap-1">
                    <HiHome className="w-4 h-4" />
                    Ayuda
                  </div>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <div className="flex items-center gap-1">
                    {getCurrentSectionConfig()?.icon}
                    {getCurrentSectionConfig()?.title || selectedSection}
                  </div>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <div className="flex items-center gap-1">
                    <HiDocument className="w-4 h-4" />
                    {currentMetadata.titulo || selectedFile.replace('.md', '')}
                  </div>
                </BreadcrumbItem>
              </Breadcrumbs>
            </div>

            {/* Navegación anterior/siguiente */}
            <div className="flex items-center gap-2">
              <Chip size="sm" variant="flat" color="primary">
                {currentFileIndex + 1} de {getCurrentFiles().length}
              </Chip>
              <div className="flex gap-1">
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  onPress={navegarAnterior}
                  isDisabled={getCurrentFiles().length <= 1}
                >
                  <HiChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  onPress={navegarSiguiente}
                  isDisabled={getCurrentFiles().length <= 1}
                >
                  <HiChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Información del documento */}
          {currentMetadata.descripcion && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentMetadata.descripcion}
              </p>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Contenido del documento */}
      <Card className="shadow-lg">
        <CardBody className="p-8">
          <div className="prose prose-lg max-w-none">
            <MarkdownRenderer content={currentContent} />
          </div>
        </CardBody>
      </Card>

      {/* Footer con navegación */}
      <Card className="shadow-lg">
        <CardBody className="p-4">
          <div className="flex justify-between items-center">
            <Button
              variant="flat"
              startContent={<HiChevronLeft className="w-4 h-4" />}
              onPress={navegarAnterior}
              isDisabled={getCurrentFiles().length <= 1}
            >
              Anterior
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getCurrentSectionConfig()?.title} - {currentFileIndex + 1} de {getCurrentFiles().length}
              </p>
            </div>
            
            <Button
              variant="flat"
              endContent={<HiChevronRight className="w-4 h-4" />}
              onPress={navegarSiguiente}
              isDisabled={getCurrentFiles().length <= 1}
            >
              Siguiente
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default DocumentViewer;
