import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Spinner, 
  useDisclosure 
} from "@nextui-org/react";
import { 
  HiBookOpen, 
  HiSearch, 
  HiMenu, 
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
  const [sections, setSections] = useState({});
  const [fileContents, setFileContents] = useState({});
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentContent, setCurrentContent] = useState("");
  const [currentMetadata, setCurrentMetadata] = useState({});
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // ==========================================
  // 2. EFECTOS DE INICIALIZACIÓN
  // ==========================================
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  useEffect(() => {
    const cargarEstructura = async () => {
      setLoading(true);
      try {
        if (!window.docsApp?.listDocumentationFiles) throw new Error('API no disponible');

        const resultado = await window.docsApp.listDocumentationFiles();
        
        if (resultado.success) {
          setSections(resultado.sections);
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
        let cleanLine = line.replace(/[*#`]/g, '').trim(); 
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

  useEffect(() => {
    if (!modalSearchTerm) {
      searchResults.length > 0 && setSearchResults([]);
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

  const filteredSections = useMemo(() => {
    return Object.entries(sections).reduce((acc, [key, files]) => {
      acc[key] = [...files].sort((a, b) => (a.metadata?.orden || 999) - (b.metadata?.orden || 999));
      return acc;
    }, {});
  }, [sections]);

  // ==========================================
  // 5. RENDERIZADO
  // ==========================================

  // Pantalla de carga integrada al diseño Premium
  if (loading) {
    return (
      <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20">
        <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Spinner size="lg" color="primary" />
              <p className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest animate-pulse">
                Cargando base de conocimiento...
              </p>
            </div>
        </div>
      </div>
    );
  }

  const totalDocs = Object.values(sections).reduce((acc, f) => acc + f.length, 0);

  return (
    // CONTENEDOR PRINCIPAL: Fluido y con padding exterior
    <div className="mt-16 h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20">
      
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
      
      {/* CONTENEDOR DE LA VISTA: Ocupa el 100% de altura, sin overflow para manejar el sidebar correctamente */}
      <div className="w-full h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm flex flex-col overflow-hidden relative">
        
        {/* ── HEADER SUPERIOR ── */}
        <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-zinc-800/80 flex-shrink-0 bg-white dark:bg-zinc-950 z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                <HiBookOpen className="w-8 h-8" />
              </div>
              <div className="flex flex-col gap-0.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
                  Centro de Ayuda
                </h1>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                  Explora {totalDocs} documentos disponibles en {Object.keys(sections).length} secciones
                </p>
              </div>
            </div>

            {/* Barra de Búsqueda Estilo "DocSearch" */}
            <button 
              onClick={onOpen}
              className="w-full lg:w-72 flex items-center justify-between px-4 py-2.5 bg-slate-100/70 hover:bg-slate-200/70 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/50 rounded-xl text-sm font-medium text-slate-500 dark:text-zinc-400 transition-all duration-200 shadow-sm group"
            >
              <div className="flex items-center gap-2">
                <HiSearch className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                <span>Buscar documentación...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 font-mono text-[10px] font-bold text-slate-400 bg-white dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700 shadow-sm">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>

          </div>
        </div>

        {/* ── LAYOUT DE CUERPO (Sidebar + Contenido) ── */}
        <div className="flex flex-1 overflow-hidden relative">
          
          {/* Botón Móvil Sidebar */}
          {!sidebarOpen && (
            <button 
                className="absolute top-4 left-4 z-50 lg:hidden p-2.5 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-xl shadow-md border border-slate-200 dark:border-zinc-700" 
                onClick={() => setSidebarOpen(true)}
            >
              <HiMenu className="w-5 h-5" />
            </button>
          )}

          {/* Sidebar */}
          <div className={`
            absolute lg:relative z-40 h-full bg-slate-50 dark:bg-zinc-900/40 border-r border-slate-200 dark:border-zinc-800/80
            transition-all duration-300 ease-in-out
            ${sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full lg:w-0 lg:translate-x-0 lg:hidden'}
          `}>
            <DocsSidebar
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
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Área de Contenido Central */}
          <div className="flex-1 overflow-y-auto custom-scrollbar w-full relative bg-white dark:bg-zinc-950">
            <div className="max-w-5xl mx-auto p-6 sm:p-10 lg:p-12 min-h-full">
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
                    sections={filteredSections}
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