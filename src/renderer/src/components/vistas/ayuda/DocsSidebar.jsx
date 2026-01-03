import React from "react";
import {
  Button,
  Chip
} from "@nextui-org/react";
import {
  HiBookOpen,
  HiSearch,
  HiOutlineX,
  HiDocument,
  HiFolder
} from "react-icons/hi";

const DocsSidebar = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  onOpenSearch,
  filteredSections,
  sectionIcons,
  selectedSection,
  selectedFile,
  navegarA
}) => {
  return (
    <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} fixed lg:relative inset-y-0 left-0 z-30 w-80 transform transition-transform duration-300 ease-in-out lg:transform-none bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full`}>
      <div className="flex flex-col h-full">
        {/* Header del sidebar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HiBookOpen className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Documentación
              </h2>
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <HiOutlineX className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Botón de búsqueda */}
          <Button
            color="primary"
            variant="flat"
            startContent={<HiSearch className="w-4 h-4" />}
            onPress={onOpenSearch}
            className="w-full"
            size="md"
          >
            Buscar en la documentación...
          </Button>
        </div>

        {/* Navegación */}
        <div className="flex-1 overflow-y-auto p-4">
          {Object.keys(filteredSections).length === 0 ? (
            <div className="text-center py-8">
              <HiFolder className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No hay secciones disponibles</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(filteredSections).map(([sectionKey, files]) => {
                const sectionConfig = sectionIcons[sectionKey];
                if (!sectionConfig) return null;
                
                return (
                  <div key={sectionKey}>
                    {/* Header de sección */}
                    <div className="flex items-center justify-between mb-2 px-2">
                      <div className="flex items-center gap-2">
                        {sectionConfig.icon}
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                          {sectionConfig.title}
                        </span>
                        <Chip size="sm" variant="flat" color={sectionConfig.color}>
                          {files.length}
                        </Chip>
                      </div>
                    </div>
                    
                    {/* Lista de archivos simplificada */}
                    <div className="ml-4 space-y-1">
                      {files.map((file) => {
                        const isSelected = selectedSection === sectionKey && selectedFile === file.fileName;
                        
                        return (
                          <Button
                            key={file.fileName}
                            variant={isSelected ? "flat" : "light"}
                            color={isSelected ? sectionConfig.color : "default"}
                            size="sm"
                            className="w-full justify-start text-left"
                            onPress={() => navegarA(sectionKey, file.fileName)}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <HiDocument className="w-4 h-4 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-sm">
                                  {file.metadata?.titulo || file.fileName.replace('.md', '')}
                                </p>
                                {file.metadata?.descripcion && (
                                  <p className="text-xs opacity-70 truncate">
                                    {file.metadata.descripcion}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocsSidebar;
