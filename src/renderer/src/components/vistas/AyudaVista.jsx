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
import { normalizarTexto } from "../../utils/textUtils";

// Componentes internos
import HelpTitleBar from "./ayuda/HelpTitleBar";
import SearchModal from "./ayuda/SearchModal";
import DocsSidebar from "./ayuda/DocsSidebar";
import DocumentViewer from "./ayuda/DocumentViewer";
import WelcomeView from "./ayuda/WelcomeView";
import { sectionIcons } from "./ayuda/sectionConfig.jsx";

const sectionOrder = ["clientes", "medidores", "lecturas", "facturas", "pagos", "impresion", "tarifas", "configuracion", "faq"];

const parseHashParams = () => {
  const hash = window.location.hash || '';
  const queryIndex = hash.indexOf('?');
  if (queryIndex !== -1) {
    const searchParams = new URLSearchParams(hash.substring(queryIndex));
    const section = searchParams.get('section');
    const file = searchParams.get('file');
    return { section, file };
  }
  return { section: null, file: null };
};

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

  // ==========================================
  // 3. CARGA DE ARCHIVO Y NAVEGACIÓN
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
    setSelectedSection(section);
    setSelectedFile(fileName);

    setSections((prevSections) => {
      const files = prevSections[section] || [];
      const fileIndex = files.findIndex((f) => f.fileName === fileName);
      setCurrentFileIndex(fileIndex >= 0 ? fileIndex : 0);
      return prevSections;
    });

    await cargarArchivo(section, fileName);

    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [cargarArchivo]);

  // Escuchar eventos de navegación profunda enviados desde el proceso principal
  useEffect(() => {
    if (!window.docsApp?.onNavigateToDoc) return;
    const unsubscribe = window.docsApp.onNavigateToDoc(({ section, file }) => {
      if (section && file) {
        navegarA(section, file);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [navegarA]);

  useEffect(() => {
    const cargarEstructura = async () => {
      setLoading(true);
      try {
        if (!window.docsApp?.listDocumentationFiles) throw new Error('API no disponible');

        const resultado = await window.docsApp.listDocumentationFiles();
        
        if (resultado.success) {
          setSections(resultado.sections);
          precargarContenidos(resultado.sections);

          // Verificar si se abrió con parámetros en la URL hash
          const { section: initialSection, file: initialFile } = parseHashParams();
          if (initialSection && initialFile && resultado.sections[initialSection]) {
            navegarA(initialSection, initialFile);
          }
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
  }, [navegarA]);

  // ==========================================
  // 4. LÓGICA DE DATOS (Precarga y Búsqueda)
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

  const extraerContexto = (content, termNorm, contextLength = 80) => {
    const contextos = [];
    const lines = content.split('\n');
    
    if (!termNorm) return [];

    lines.forEach((line) => {
      const normLine = normalizarTexto(line);
      const matchIndex = normLine.indexOf(termNorm);
      
      if (matchIndex !== -1) {
        let cleanLine = line.replace(/[*#`]/g, '').trim(); 
        const normCleanLine = normalizarTexto(cleanLine);
        const cleanMatchIndex = normCleanLine.indexOf(termNorm);
        
        if (cleanMatchIndex !== -1) {
          const start = Math.max(0, cleanMatchIndex - contextLength / 2);
          const end = Math.min(cleanLine.length, cleanMatchIndex + termNorm.length + contextLength / 2);
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
      searchResults.length > 0 && setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const termNorm = normalizarTexto(term);
    const resultados = [];

    Object.entries(sections).forEach(([sectionKey, files]) => {
      files.forEach(file => {
        const content = fileContents[`${sectionKey}/${file.fileName}`] || '';
        const metadata = file.metadata || {};
        let score = 0;
        const matches = [];

        if (metadata.titulo && normalizarTexto(metadata.titulo).includes(termNorm)) {
          score += 10;
          matches.push({ type: 'titulo', text: metadata.titulo });
        }
        if (metadata.descripcion && normalizarTexto(metadata.descripcion).includes(termNorm)) {
          score += 5;
          matches.push({ type: 'descripcion', text: metadata.descripcion });
        }
        
        const tags = metadata.tags?.filter(t => normalizarTexto(t).includes(termNorm)) || [];
        if (tags.length > 0) {
          score += tags.length * 3;
          matches.push({ type: 'tags', text: tags.join(', ') });
        }

        const contentMatches = extraerContexto(content, termNorm);
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
  }, [sections, fileContents, searchResults.length]);

  useEffect(() => {
    if (!modalSearchTerm) {
      if (searchResults.length > 0) setSearchResults([]);
      setSearching(false);
      return;
    }
    const timeoutId = setTimeout(() => buscarEnContenido(modalSearchTerm), 300);
    return () => clearTimeout(timeoutId);
  }, [modalSearchTerm, buscarEnContenido, searchResults.length]);

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
    const sortedEntries = Object.entries(sections)
      .map(([key, files]) => [
        key,
        [...files].sort((a, b) => (a.metadata?.orden || 999) - (b.metadata?.orden || 999))
      ])
      .sort(([sectionA], [sectionB]) => {
        const indexA = sectionOrder.indexOf(sectionA);
        const indexB = sectionOrder.indexOf(sectionB);

        if (indexA === -1 && indexB === -1) return sectionA.localeCompare(sectionB, "es");
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });

    return Object.fromEntries(sortedEntries);
  }, [sections]);

  // ==========================================
  // 5. RENDERIZADO
  // ==========================================

  // Pantalla de carga integrada al diseño Premium
  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-zinc-950 select-none">
        <HelpTitleBar onOpenSearch={null} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" color="primary" />
            <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest animate-pulse">
              Cargando base de conocimiento...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalDocs = Object.values(sections).reduce((acc, f) => acc + f.length, 0);

  return (
    // CONTENEDOR PRINCIPAL: Ventana Completa e Independiente
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100/70 dark:bg-zinc-950 select-none">
      <HelpTitleBar onOpenSearch={onOpen} />

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
      
      {/* CONTENEDOR DE LA VISTA: Ocupa el espacio restante debajo del titlebar */}
      <div className="flex-1 flex flex-col overflow-hidden p-2 sm:p-3">
        <div className="w-full h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col overflow-hidden relative animate-in fade-in duration-300">
          
          {/* ── HEADER SUPERIOR ── */}
          <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-zinc-800/80 flex-shrink-0 bg-white dark:bg-zinc-950 z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0 flex items-center justify-center">
                  <HiBookOpen className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                    Centro de Ayuda
                  </h1>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    {totalDocs} documentos disponibles en {Object.keys(sections).length} módulos
                  </p>
                </div>
              </div>

              {/* Barra de Búsqueda Estilo Premium */}
              <button 
                onClick={onOpen}
                className="w-full sm:w-72 h-[42px] flex items-center justify-between px-3.5 bg-slate-100/70 hover:bg-slate-200/70 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-500 dark:text-zinc-400 transition-all duration-200 shadow-sm group focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <div className="flex items-center gap-2">
                  <HiSearch className="w-4 h-4 text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                  <span>Buscar documentación...</span>
                </div>
                <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-950 rounded border border-slate-200 dark:border-zinc-700 shadow-sm">
                  Ctrl+K
                </kbd>
              </button>

            </div>
          </div>

          {/* ── LAYOUT DE CUERPO (Sidebar + Contenido) ── */}
          <div className="flex flex-1 overflow-hidden relative">
            
            {/* Botón Móvil Sidebar */}
            {!sidebarOpen && (
              <button 
                  className="absolute top-4 left-4 z-50 lg:hidden p-2 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-xl shadow-md border border-slate-200 dark:border-zinc-700" 
                  onClick={() => setSidebarOpen(true)}
              >
                <HiMenu className="w-4 h-4" />
              </button>
            )}

            {/* Sidebar */}
            <div className={`
              absolute lg:relative z-40 h-full bg-slate-50/50 dark:bg-zinc-900/20 border-r border-slate-100 dark:border-zinc-800/80
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
              <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 z-30 lg:hidden animate-in fade-in duration-200" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Área de Contenido Central */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent w-full relative bg-white dark:bg-zinc-950">
              <div className="max-w-5xl mx-auto p-4 sm:p-8 lg:p-10 min-h-full">
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
    </div>
  );
};

export default AyudaVista;