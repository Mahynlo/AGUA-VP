import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Card, 
  CardBody, 
  Button, 
  Spinner, 
  Chip, 
  useDisclosure 
} from "@nextui-org/react";
import { 
  HiBookOpen, 
  HiSearch, 
  HiMenu, 
  HiFolder, 
  HiDocument, 
  HiLightningBolt 
} from "react-icons/hi";
import 'katex/dist/katex.min.css';

// Componentes internos
import SearchModal from "./ayuda/SearchModal";
import DocsSidebar from "./ayuda/DocsSidebar";
import DocumentViewer from "./ayuda/DocumentViewer";
import WelcomeView from "./ayuda/WelcomeView";
import { sectionIcons } from "./ayuda/sectionConfig.jsx";

const AyudaVista = () => {
  // ==========================================
  // 1. ESTADOS
  // ==========================================
  // Datos y contenido
  const [sections, setSections] = useState({});
  const [fileContents, setFileContents] = useState({});
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentContent, setCurrentContent] = useState("");
  const [currentMetadata, setCurrentMetadata] = useState({});
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  
  // UI y Carga
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  
  // Búsqueda
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // ==========================================
  // 2. EFECTOS DE INICIALIZACIÓN
  // ==========================================
  
  // Ajuste responsivo del sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Atajo de teclado (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !isOpen) {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpen]);

  // Carga inicial de datos
  useEffect(() => {
    const cargarEstructura = async () => {
      setLoading(true);
      try {
        if (!window.docsApp?.listDocumentationFiles) throw new Error('API no disponible');

        const resultado = await window.docsApp.listDocumentationFiles();
        
        if (resultado.success) {
          setSections(resultado.sections);
          // Iniciar precarga de contenidos en segundo plano
          precargarContenidos(resultado.sections);
        } else {
          throw new Error(resultado.error);
        }
      } catch (error) {
        console.error("Error cargando documentación:", error);
        setSections({});
      } finally {
        setLoading(false);
      }
    };
    cargarEstructura();
  }, []);

  // ==========================================
  // 3. LÓGICA DE DATOS (Precarga y Búsqueda)
  // ==========================================

  const precargarContenidos = async (sectionsData) => {
    const contenidos = {};
    for (const [sectionKey, files] of Object.entries(sectionsData)) {
      for (const file of files) {
        try {
          const res = await window.docsApp.loadDocumentationFile(sectionKey, file.fileName);
          if (res.success) contenidos[`${sectionKey}/${file.fileName}`] = res.content;
        } catch (e) { console.warn(e); }
      }
    }
    setFileContents(contenidos);
  };

  const extraerContexto = (content, term, contextLength = 80) => {
    const contextos = [];
    const lines = content.split('\n');
    const regex = new RegExp(term, 'gi');
    
    lines.forEach((line) => {
      if (regex.test(line)) {
        let cleanLine = line.replace(/[*#`]/g, '').trim(); // Limpieza básica
        const matchIndex = cleanLine.toLowerCase().indexOf(term.toLowerCase());
        
        if (matchIndex !== -1) {
          const start = Math.max(0, matchIndex - contextLength / 2);
          const end = Math.min(cleanLine.length, matchIndex + term.length + contextLength / 2);
          let extracto = cleanLine.substring(start, end);
          if (start > 0) extracto = '...' + extracto;
          if (end < cleanLine.length) extracto = extracto + '...';
          contextos.push(extracto);
        }
      }
    });
    return contextos.slice(0, 3);
  };

  const buscarEnContenido = useCallback((term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const termLower = term.toLowerCase();
    const resultados = [];

    Object.entries(sections).forEach(([sectionKey, files]) => {
      files.forEach(file => {
        const content = fileContents[`${sectionKey}/${file.fileName}`] || '';
        const metadata = file.metadata || {};
        let score = 0;
        const matches = [];

        // Scoring
        if (metadata.titulo?.toLowerCase().includes(termLower)) {
          score += 10;
          matches.push({ type: 'titulo', text: metadata.titulo });
        }
        if (metadata.descripcion?.toLowerCase().includes(termLower)) {
          score += 5;
          matches.push({ type: 'descripcion', text: metadata.descripcion });
        }
        
        const tags = metadata.tags?.filter(t => t.toLowerCase().includes(termLower)) || [];
        if (tags.length > 0) {
          score += tags.length * 3;
          matches.push({ type: 'tags', text: tags.join(', ') });
        }

        const contentMatches = extraerContexto(content, termLower);
        if (contentMatches.length > 0) {
          score += Math.min(contentMatches.length, 20);
          matches.push(...contentMatches.map(ctx => ({ type: 'contenido', text: ctx })));
        }

        if (score > 0) {
          resultados.push({
            sectionKey,
            fileName: file.fileName,
            metadata,
            score,
            matches: matches.slice(0, 5)
          });
        }
      });
    });

    resultados.sort((a, b) => b.score - a.score);
    setSearchResults(resultados);
    setSearching(false);
  }, [sections, fileContents]);

  // Debounce para búsqueda
  useEffect(() => {
    if (!modalSearchTerm) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    const timeoutId = setTimeout(() => buscarEnContenido(modalSearchTerm), 300);
    return () => clearTimeout(timeoutId);
  }, [modalSearchTerm, buscarEnContenido]);

  // ==========================================
  // 4. NAVEGACIÓN Y CARGA DE ARCHIVOS
  // ==========================================

  const cargarArchivo = useCallback(async (section, fileName) => {
    try {
      const resultado = await window.docsApp.loadDocumentationFile(section, fileName);
      if (resultado.success) {
        setCurrentContent(resultado.content);
        setCurrentMetadata(resultado.metadata);
      } else {
        throw new Error(resultado.error);
      }
    } catch (error) {
      console.error("Error cargando archivo:", error);
      setCurrentContent("# Error\nNo se pudo cargar el documento.");
    }
  }, []);

  const navegarA = useCallback(async (section, fileName) => {
    if (sections[section]) {
      const files = sections[section];
      const fileIndex = files.findIndex(f => f.fileName === fileName);
      
      setSelectedSection(section);
      setSelectedFile(fileName);
      setCurrentFileIndex(fileIndex >= 0 ? fileIndex : 0);
      
      await cargarArchivo(section, fileName);
      
      if (window.innerWidth < 1024) setSidebarOpen(false);
    }
  }, [sections, cargarArchivo]);

  const handleSelectResult = useCallback((sectionKey, fileName) => {
    navegarA(sectionKey, fileName);
    onOpenChange(false);
    setModalSearchTerm("");
  }, [navegarA, onOpenChange]);

  // Helpers de navegación relativa (Next/Prev)
  const getCurrentFiles = useCallback(() => sections[selectedSection] || [], [selectedSection, sections]);
  const getCurrentSectionConfig = useCallback(() => selectedSection ? sectionIcons[selectedSection] : null, [selectedSection]);

  const navegarRelativo = useCallback((direction) => {
    const files = getCurrentFiles();
    if (files.length <= 1) return;
    
    let newIndex;
    if (direction === 'prev') {
        newIndex = currentFileIndex > 0 ? currentFileIndex - 1 : files.length - 1;
    } else {
        newIndex = currentFileIndex < files.length - 1 ? currentFileIndex + 1 : 0;
    }
    
    navegarA(selectedSection, files[newIndex].fileName);
  }, [currentFileIndex, selectedSection, navegarA, getCurrentFiles]);

  // Filtrado para el sidebar (ordenamiento)
  const filteredSections = useMemo(() => {
    return Object.entries(sections).reduce((acc, [key, files]) => {
      acc[key] = [...files].sort((a, b) => (a.metadata?.orden || 999) - (b.metadata?.orden || 999));
      return acc;
    }, {});
  }, [sections]);

  // ==========================================
  // 5. RENDERIZADO
  // ==========================================

  if (loading) {
    return (
      <div className="mt-16 h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:ml-24">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500">Cargando base de conocimiento...</p>
        </div>
      </div>
    );
  }

  const totalDocs = Object.values(sections).reduce((acc, f) => acc + f.length, 0);

  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-hidden p-4 sm:ml-24">
      
      <SearchModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        modalSearchTerm={modalSearchTerm}
        setModalSearchTerm={setModalSearchTerm}
        searching={searching}
        searchResults={searchResults}
        sectionIcons={sectionIcons}
        handleSelectResult={handleSelectResult}
      />
      
      {/* Contenedor Principal (Flexible y Moderno) */}
      <div className="w-full h-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
        
        {/* Header Compacto */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <HiBookOpen className="text-blue-600 h-8 w-8" />
                Centro de Ayuda
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {totalDocs} documentos disponibles en {Object.keys(sections).length} secciones
              </p>
            </div>

            <div className="flex gap-3 w-full lg:w-auto">
                <Button 
                    className="flex-1 lg:flex-none bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200"
                    startContent={<HiSearch />}
                    onPress={onOpen}
                >
                    Buscar <Chip size="sm" className="ml-2 h-5 bg-white dark:bg-black/20">Ctrl K</Chip>
                </Button>
            </div>
          </div>
        </div>

        {/* Layout Cuerpo */}
        <div className="flex flex-1 overflow-hidden relative">
          
          {/* Botón Móvil Sidebar */}
          {!sidebarOpen && (
            <Button isIconOnly className="absolute top-4 left-4 z-50 lg:hidden shadow-md" onPress={() => setSidebarOpen(true)}>
              <HiMenu />
            </Button>
          )}

          {/* Sidebar */}
          <div className={`
            absolute lg:relative z-40 h-full bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700
            transition-all duration-300 ease-in-out
            ${sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full lg:w-0 lg:translate-x-0 lg:hidden'}
          `}>
            <DocsSidebar
              // Aquí pasamos filteredSections para que funcione el ordenamiento
              filteredSections={filteredSections} 
              sectionIcons={sectionIcons}
              selectedSection={selectedSection}
              selectedFile={selectedFile}
              navegarA={navegarA}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              onOpenSearch={onOpen}
            />
          </div>

          {/* Overlay Móvil */}
          {sidebarOpen && (
            <div className="absolute inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Área de Contenido (Fluido y Centrado) */}
          <div className="flex-1 overflow-y-auto scroll-smooth w-full relative bg-white dark:bg-gray-800">
            <div className="max-w-4xl mx-auto p-6 lg:p-10 min-h-full">
              {selectedSection && selectedFile ? (
                <DocumentViewer
                  currentContent={currentContent}
                  currentMetadata={currentMetadata}
                  selectedSection={selectedSection}
                  selectedFile={selectedFile}
                  currentFileIndex={currentFileIndex}
                  getCurrentFiles={getCurrentFiles}
                  getCurrentSectionConfig={getCurrentSectionConfig}
                  navegarAnterior={() => navegarRelativo('prev')}
                  navegarSiguiente={() => navegarRelativo('next')}
                />
              ) : (
                <WelcomeView 
                    sections={filteredSections} // Usar secciones filtradas/ordenadas
                    sectionIcons={sectionIcons}
                    navegarA={navegarA}
                />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AyudaVista;