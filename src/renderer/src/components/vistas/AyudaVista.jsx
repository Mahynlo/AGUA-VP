import React, { useEffect, useState } from "react";
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button,
  Input,
  Spinner,
  Divider,
  Chip,
  Breadcrumbs,
  BreadcrumbItem
} from "@nextui-org/react";
import { 
  HiBookOpen, 
  HiUsers, 
  HiCog, 
  HiChartBar, 
  HiCurrencyDollar, 
  HiPrinter,
  HiQuestionMarkCircle,
  HiLightningBolt,
  HiSearch,
  HiX,
  HiChevronLeft,
  HiChevronRight,
  HiMenu,
  HiOutlineX,
  HiHome,
  HiFolder,
  HiDocument
} from "react-icons/hi";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AyudaVista = () => {
  // Estados principales
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentContent, setCurrentContent] = useState("");
  const [currentMetadata, setCurrentMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  // Ajustar sidebar según tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Configuración de iconos para cada sección
  const sectionIcons = {
    clientes: { icon: <HiUsers className="w-5 h-5" />, color: "success", title: "Clientes" },
    medidores: { icon: <HiCog className="w-5 h-5" />, color: "warning", title: "Medidores" },
    lecturas: { icon: <HiChartBar className="w-5 h-5" />, color: "secondary", title: "Lecturas" },
    facturas: { icon: <HiCurrencyDollar className="w-5 h-5" />, color: "danger", title: "Facturas" },
    pagos: { icon: <HiCurrencyDollar className="w-5 h-5" />, color: "primary", title: "Pagos" },
    impresion: { icon: <HiPrinter className="w-5 h-5" />, color: "secondary", title: "Impresión" },
    configuracion: { icon: <HiCog className="w-5 h-5" />, color: "default", title: "Configuración" },
    faq: { icon: <HiQuestionMarkCircle className="w-5 h-5" />, color: "warning", title: "FAQ" }
  };

  // Cargar estructura de documentación al montar
  useEffect(() => {
    const cargarEstructura = async () => {
      setLoading(true);
      try {
        console.log("🔄 Cargando estructura de documentación...");
        
        if (!window.docsApp || typeof window.docsApp.listDocumentationFiles !== 'function') {
          throw new Error('API de documentación no disponible');
        }

        const resultado = await window.docsApp.listDocumentationFiles();
        
        if (resultado.success) {
          setSections(resultado.sections);
          console.log("✅ Estructura cargada:", resultado.sections);
          // Debug: Mostrar el orden de los archivos de clientes
          if (resultado.sections.clientes) {
            console.log("🔍 Orden de archivos en clientes:", 
              resultado.sections.clientes.map(f => ({
                fileName: f.fileName,
                titulo: f.metadata?.titulo,
                orden: f.metadata?.orden
              }))
            );
          }
        } else {
          throw new Error(resultado.error || 'Error desconocido al cargar documentación');
        }
      } catch (error) {
        console.error("❌ Error cargando documentación:", error);
        setSections({});
      } finally {
        setLoading(false);
      }
    };

    cargarEstructura();
  }, []);

  // Función para cargar el contenido de un archivo
  const cargarArchivo = async (section, fileName) => {
    try {
      console.log(`🔄 Cargando archivo: ${section}/${fileName}`);
      
      if (!window.docsApp || typeof window.docsApp.loadDocumentationFile !== 'function') {
        throw new Error('API de documentación no disponible');
      }

      const resultado = await window.docsApp.loadDocumentationFile(section, fileName);
      
      if (resultado.success) {
        setCurrentContent(resultado.content);
        setCurrentMetadata(resultado.metadata);
        console.log("✅ Archivo cargado:", resultado.metadata);
      } else {
        throw new Error(resultado.error || 'Error desconocido al cargar archivo');
      }
    } catch (error) {
      console.error("❌ Error cargando archivo:", error);
      setCurrentContent("# Error\n\nNo se pudo cargar el contenido del documento.");
      setCurrentMetadata({});
    }
  };

  // Navegación entre archivos
  const navegarA = async (section, fileName) => {
    if (sections[section]) {
      const files = sections[section];
      const fileIndex = files.findIndex(f => f.fileName === fileName);
      
      setSelectedSection(section);
      setSelectedFile(fileName);
      setCurrentFileIndex(fileIndex >= 0 ? fileIndex : 0);
      
      await cargarArchivo(section, fileName);
      
      // Cerrar sidebar en móvil después de seleccionar
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    }
  };

  const navegarAnterior = () => {
    const files = getCurrentFiles();
    if (files.length > 1) {
      const newIndex = currentFileIndex > 0 ? currentFileIndex - 1 : files.length - 1;
      navegarA(selectedSection, files[newIndex].fileName);
    }
  };

  const navegarSiguiente = () => {
    const files = getCurrentFiles();
    if (files.length > 1) {
      const newIndex = currentFileIndex < files.length - 1 ? currentFileIndex + 1 : 0;
      navegarA(selectedSection, files[newIndex].fileName);
    }
  };

  // Filtrar secciones según búsqueda
  const filteredSections = Object.entries(sections).reduce((acc, [sectionKey, files]) => {
    if (!searchTerm) {
      acc[sectionKey] = files;
      return acc;
    }

    const filteredFiles = files.filter(file => 
      file.metadata?.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.metadata?.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    // Mantener el orden original después del filtrado
    .sort((a, b) => (a.metadata?.orden || 999) - (b.metadata?.orden || 999));

    if (filteredFiles.length > 0) {
      acc[sectionKey] = filteredFiles;
    }

    return acc;
  }, {});

  // Estado de carga
  if (loading) {
    return (
      <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-600">Cargando documentación...</p>
          </div>
        </div>
      </div>
    );
  }

  const getCurrentFiles = () => {
    return selectedSection && sections[selectedSection] ? sections[selectedSection] : [];
  };

  const getCurrentSectionConfig = () => {
    return selectedSection ? sectionIcons[selectedSection] : null;
  };

  // Componente para renderizar Markdown
  const MarkdownRenderer = ({ content }) => {
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
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    );
  };

  // Componente Sidebar
  const Sidebar = () => (
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
          
          {/* Buscador */}
          <Input
            placeholder="Buscar en la ayuda..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            startContent={<HiSearch className="text-gray-400" />}
            endContent={
              searchTerm && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => setSearchTerm("")}
                >
                  <HiX className="w-3 h-3" />
                </Button>
              )
            }
            size="sm"
            variant="bordered"
          />
        </div>

        {/* Navegación */}
        <div className="flex-1 overflow-y-auto p-4">
          {Object.keys(filteredSections).length === 0 ? (
            <div className="text-center py-8">
              <HiSearch className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No se encontraron resultados</p>
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
                    
                    {/* Lista de archivos */}
                    <div className="ml-4 space-y-1">
                      {files.map((file) => (
                        <Button
                          key={file.fileName}
                          variant={selectedSection === sectionKey && selectedFile === file.fileName ? "flat" : "light"}
                          color={selectedSection === sectionKey && selectedFile === file.fileName ? sectionConfig.color : "default"}
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
                      ))}
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

  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div className="w-full h-full bg-white overflow-x-hidden p-6 rounded-lg shadow-md dark:bg-gray-800">
        
        {/* Header principal */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <HiBookOpen className="bg-blue-600 text-white rounded-full p-2 h-12 w-12" />
                Centro de Ayuda
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Documentación completa y guías del sistema
              </p>
            </div>
            
            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiDocument className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{Object.values(sections).reduce((acc, files) => acc + files.length, 0)}</p>
                  <p className="text-xs opacity-90">Documentos</p>
                </CardBody>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiFolder className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{Object.keys(sections).length}</p>
                  <p className="text-xs opacity-90">Secciones</p>
                </CardBody>
              </Card>
              
              {selectedSection && (
                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white min-w-[120px]">
                  <CardBody className="text-center p-4">
                    <HiLightningBolt className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{currentFileIndex + 1}</p>
                    <p className="text-xs opacity-90">Actual</p>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Layout principal */}
        <div className="flex h-[calc(100%-150px)] gap-6 relative">
          
          {/* Botón toggle para sidebar */}
          {!sidebarOpen && (
            <Button
              isIconOnly
              className="absolute top-4 left-4 z-40 lg:hidden"
              color="primary"
              variant="flat"
              onPress={() => setSidebarOpen(true)}
            >
              <HiMenu className="w-5 h-5" />
            </Button>
          )}

          {/* Sidebar */}
          <div className={`${sidebarOpen ? 'w-80' : 'w-0 lg:w-80'} transition-all duration-300 flex-shrink-0 relative`}>
            <Sidebar />
          </div>

          {/* Overlay para móvil */}
          {sidebarOpen && (
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Contenido principal */}
          <div className="flex-1 min-w-0 p-4 h-full w-[700px] overflow-y-auto">
            {selectedSection && selectedFile ? (
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
            ) : (
              /* Vista inicial cuando no hay selección */
              <div className="max-w-4xl mx-auto">
                <Card className="shadow-lg">
                  <CardBody className="text-center py-12">
                    <HiBookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Bienvenido al Centro de Ayuda
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                      Selecciona una sección en el menú lateral para comenzar a explorar la documentación.
                    </p>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-lg mx-auto">
                      {Object.entries(sections).map(([sectionKey, files]) => {
                        const sectionConfig = sectionIcons[sectionKey];
                        return (
                          <Button
                            key={sectionKey}
                            variant="flat"
                            color={sectionConfig.color}
                            className="flex flex-col items-center p-4 h-auto"
                            onPress={() => {
                              if (files.length > 0) {
                                navegarA(sectionKey, files[0].fileName);
                              }
                            }}
                          >
                            {sectionConfig.icon}
                            <span className="mt-2 text-sm">{sectionConfig.title}</span>
                            <Chip size="sm" variant="flat" color={sectionConfig.color} className="mt-1">
                              {files.length}
                            </Chip>
                          </Button>
                        );
                      })}
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AyudaVista;
