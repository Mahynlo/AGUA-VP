import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Spinner 
} from "@heroui/react";
import { 
  HiBookOpen, 
  HiSearch, 
  HiMenu,
  HiPrinter
} from "react-icons/hi";
import 'katex/dist/katex.min.css';
import { normalizarTexto } from "../../utils/textUtils";

// Componentes internos
import HelpTitleBar from "./ayuda/HelpTitleBar";
import SearchModal from "./ayuda/SearchModal";
import DocsSidebar from "./ayuda/DocsSidebar";
import DocumentViewer from "./ayuda/DocumentViewer";
import WelcomeView from "./ayuda/WelcomeView";
import ModalImprimirDocumentacion from "./ayuda/ModalImprimirDocumentacion";
import ModalImprimir from "./impresion/components/ModalImprimir";
import { sectionIcons } from "./ayuda/sectionConfig.jsx";
import { preloadPdfViewer } from "../../utils/pdfPreloader";

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
  
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const onOpenChange = (open) => setIsOpen(typeof open === 'boolean' ? open : !isOpen);
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Estados para impresión / exportación de documentación a PDF
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [printUrl, setPrintUrl] = useState(null);
  const [modoPdf, setModoPdf] = useState(null); // 'vista-previa' | 'imprimir' | null

  // ==========================================
  // 2. EFECTOS DE INICIALIZACIÓN
  // ==========================================
  useEffect(() => {
    preloadPdfViewer();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !isOpen) {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onOpen]);

  // Actualizar título de la ventana para reflejar el Centro de Ayuda o el manual activo
  useEffect(() => {
    const prevTitle = document.title;
    if (currentMetadata?.titulo) {
      document.title = `${currentMetadata.titulo} — Centro de Ayuda AguaVP`;
    } else {
      document.title = "Centro de Ayuda - AguaVP";
    }
    return () => {
      document.title = prevTitle;
    };
  }, [currentMetadata?.titulo]);

  // ==========================================
  // 3. CARGA DE ARCHIVO Y NAVEGACIÓN
  // ==========================================
  const cargarArchivo = useCallback(async (section, fileName) => {
    try {
      const resultado = await window.docsApp.loadDocumentationFile(section, fileName);
      if (resultado.success) {
        setCurrentContent(resultado.content);
        setCurrentMetadata(resultado.metadata || {});
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

    if (!section || !fileName) {
      setCurrentContent("");
      setCurrentMetadata({});
      setCurrentFileIndex(0);
      if (window.innerWidth < 1024) setSidebarOpen(false);
      return;
    }

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
          if (res.success) {
            contenidos[`${sectionKey}/${file.fileName}`] = res.content;
          }
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
    
    const targetFile = files[newIndex];
    if (targetFile) {
      navegarA(selectedSection, targetFile.fileName);
    }
  }, [currentFileIndex, selectedSection, navegarA, getCurrentFiles]);

  // Secciones ordenadas
  const filteredSections = useMemo(() => {
    const sortedEntries = Object.entries(sections)
      .map(([key, files]) => [
        key,
        [...files].sort((a, b) => (a.metadata?.orden || 999) - (b.metadata?.orden || 999))
      ])
      .filter(([_, files]) => files.length > 0)
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
  // 5. GENERACIÓN DE DOCUMENTACIÓN EN PDF
  // ==========================================
  const handleIniciarImpresion = useCallback(async (opciones) => {
    const { alcance, seccion, archivo, incluirPortada, incluirIndice } = opciones;

    try {
      const docsList = [];
      let tituloPrincipal = "Documentación del Sistema AguaVP";
      let subtitulo = "Manual de Operación y Procedimientos";

      const obtenerContenido = async (secKey, fName) => {
        const cacheKey = `${secKey}/${fName}`;
        if (fileContents[cacheKey]) return fileContents[cacheKey];
        if (secKey === selectedSection && fName === selectedFile && currentContent) return currentContent;
        if (window.docsApp?.loadDocumentationFile) {
          try {
            const res = await window.docsApp.loadDocumentationFile(secKey, fName);
            if (res?.success) return res.content;
          } catch (e) {
            console.warn("Error cargando doc para PDF:", e);
          }
        }
        return "";
      };

      if (alcance === "guia_actual") {
        if (seccion && archivo) {
          const content = await obtenerContenido(seccion, archivo);
          const meta = currentMetadata || {};
          const secConfig = sectionIcons[seccion] || {};
          const secTitle = secConfig.title || seccion;
          const secSubtitle = secConfig.subtitle || "";
          const tituloDoc = meta.titulo || archivo.replace(".md", "");

          tituloPrincipal = tituloDoc;
          subtitulo = `${secTitle} • Guía de Operación`;

          docsList.push({
            seccionKey: seccion,
            seccionTitulo: secTitle,
            seccionSubtitulo: secSubtitle,
            fileName: archivo,
            titulo: tituloDoc,
            descripcion: meta.descripcion || "",
            orden: meta.orden || 1,
            content: content
          });
        }
      } else if (alcance === "modulo_actual") {
        const secFiles = filteredSections[seccion] || sections[seccion] || [];
        const secConfig = sectionIcons[seccion] || {};
        const secTitle = secConfig.title || seccion;
        const secSubtitle = secConfig.subtitle || "";

        tituloPrincipal = `Módulo: ${secTitle}`;
        subtitulo = `Manual de Procedimientos y Operación • ${secFiles.length} Guías`;

        for (const file of secFiles) {
          const content = await obtenerContenido(seccion, file.fileName);
          const meta = file.metadata || {};
          docsList.push({
            seccionKey: seccion,
            seccionTitulo: secTitle,
            seccionSubtitulo: secSubtitle,
            fileName: file.fileName,
            titulo: meta.titulo || file.fileName.replace(".md", ""),
            descripcion: meta.descripcion || "",
            orden: meta.orden || 1,
            content: content
          });
        }
      } else if (alcance === "manual_completo") {
        tituloPrincipal = "Manual General del Sistema AguaVP";
        subtitulo = "Guía Integral de Operación, Facturación, Cobranza y Administración";

        for (const [secKey, secFiles] of Object.entries(filteredSections)) {
          const secConfig = sectionIcons[secKey] || {};
          const secTitle = secConfig.title || secKey;
          const secSubtitle = secConfig.subtitle || "";

          for (const file of secFiles) {
            const content = await obtenerContenido(secKey, file.fileName);
            const meta = file.metadata || {};
            docsList.push({
              seccionKey: secKey,
              seccionTitulo: secTitle,
              seccionSubtitulo: secSubtitle,
              fileName: file.fileName,
              titulo: meta.titulo || file.fileName.replace(".md", ""),
              descripcion: meta.descripcion || "",
              orden: meta.orden || 1,
              content: content
            });
          }
        }
      }

      if (docsList.length === 0) {
        alert("No hay documentos seleccionados para generar el PDF.");
        return;
      }

      const payload = {
        alcance,
        tituloPrincipal,
        subtitulo,
        fechaHoy: new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }),
        incluirPortada,
        incluirIndice,
        docs: docsList
      };

      if (!window.api?.savePrintData || !window.api?.previewComponent) {
        throw new Error("La API de impresión de AguaVP no está disponible.");
      }

      const dataKey = await window.api.savePrintData(JSON.stringify(payload));
      const { protocol, origin, href } = window.location;
      const base = protocol === "file:" ? href.split("#")[0] : origin + "/";
      const hashBase = protocol === "file:" ? `${base}#` : `${origin}/#`;
      const url = `${hashBase}/reporteDocumentacion?dataKey=${dataKey}&print=true`;

      const response = await window.api.previewComponent(url, { 
        landscape: false, 
        pageNumbers: true, 
        pageSize: 'Letter' 
      });
      if (response && response.success && response.path) {
        setPrintUrl(url);
        setPdfUrl(response.path);
        setModoPdf("preview");
      } else {
        throw new Error(response?.error || "Error generando vista previa del PDF");
      }
    } catch (error) {
      console.error("Error preparando PDF de documentación:", error);
      alert("Ocurrió un error al generar el PDF de la documentación.");
    }
  }, [fileContents, selectedSection, selectedFile, currentContent, currentMetadata, filteredSections, sections]);

  // ==========================================
  // 6. RENDERIZADO
  // ==========================================

  // Pantalla de carga
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
      
      {/* CONTENEDOR DE LA VISTA DEBAJO DEL TITLEBAR */}
      <div className="flex-1 flex flex-col overflow-hidden p-1.5 sm:p-2.5">
        <div className="w-full h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
          
          {/* ── HEADER SUPERIOR RESPONSIVO ── */}
          <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 border-b border-slate-100 dark:border-zinc-800/80 flex-shrink-0 bg-white dark:bg-zinc-950 z-20">
            <div className="flex items-center justify-between gap-3">
              
              {/* Izquierda: Botón Toggle Menú + Identidad */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`p-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 shrink-0 ${
                    sidebarOpen
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
                      : "text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
                  aria-label={sidebarOpen ? "Ocultar menú lateral" : "Mostrar menú lateral"}
                  title={sidebarOpen ? "Ocultar menú lateral" : "Mostrar menú lateral"}
                >
                  <HiMenu className="w-5 h-5" />
                </button>

                <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0 hidden sm:flex items-center justify-center">
                  <HiBookOpen className="w-5 h-5" />
                </div>

                <div className="flex flex-col min-w-0">
                  <button 
                    onClick={() => navegarA(null, null)}
                    className="text-left text-base sm:text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                  >
                    Centro de Ayuda
                  </button>
                  <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 truncate hidden sm:block">
                    {totalDocs} guías en {Object.keys(sections).length} módulos
                  </p>
                </div>
              </div>

              {/* Derecha: Botón de Búsqueda e Impresión Responsivos */}
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => setPrintModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold transition-all shadow-2xs group shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-95"
                  title="Imprimir o exportar manual / guías a PDF"
                >
                  <HiPrinter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="hidden md:inline">Imprimir Manual</span>
                </button>

                <button 
                  onClick={onOpen}
                  className="flex items-center justify-between gap-2 px-3.5 py-2 bg-slate-100/80 hover:bg-slate-200/70 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-500 dark:text-zinc-400 transition-all shadow-2xs group shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  title="Buscar documentación (Ctrl+K)"
                >
                  <div className="flex items-center gap-2">
                    <HiSearch className="w-4 h-4 text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                    <span className="hidden sm:inline">Buscar en la documentación...</span>
                    <span className="sm:hidden text-xs font-semibold text-slate-600 dark:text-zinc-300">Buscar</span>
                  </div>
                  <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-950 rounded border border-slate-200 dark:border-zinc-700 shadow-2xs">
                    Ctrl+K
                  </kbd>
                </button>
              </div>

            </div>
          </div>

          {/* ── CUERPO DE LA VISTA (Sidebar + Contenido) ── */}
          <div className="flex flex-1 overflow-hidden relative">
            
            {/* Sidebar en Escritorio (Colapsable) */}
            {sidebarOpen && (
              <div className="hidden lg:block w-64 xl:w-72 shrink-0 h-full animate-in slide-in-from-left-2 duration-200">
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
            )}

            {/* Drawer Móvil / Pantallas Reducidas (Confinado estrictamente bajo el header, NUNCA tapa el navbar) */}
            {sidebarOpen && (
              <div className="lg:hidden">
                {/* Backdrop Oscuro */}
                <div 
                  className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 z-30 animate-in fade-in duration-200" 
                  onClick={() => setSidebarOpen(false)} 
                />
                {/* Drawer Flotante */}
                <div className="absolute inset-y-0 left-0 z-40 w-72 sm:w-80 h-full bg-white dark:bg-zinc-950 shadow-2xl animate-in slide-in-from-left duration-200">
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
              </div>
            )}

            {/* Área de Contenido Central */}
            <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent w-full min-w-0 bg-slate-50/50 dark:bg-zinc-950/60 p-3 sm:p-5 lg:p-7">
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
                  navegarA={navegarA}
                  onOpenPrint={() => setPrintModalOpen(true)}
                />
              ) : (
                <WelcomeView 
                  sections={filteredSections}
                  sectionIcons={sectionIcons}
                  navegarA={navegarA}
                  onOpenSearch={onOpen}
                />
              )}
            </main>

          </div>
        </div>
      </div>

      {/* Modal de Configuración de Impresión */}
      <ModalImprimirDocumentacion
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        selectedSection={selectedSection}
        selectedFile={selectedFile}
        currentMetadata={currentMetadata}
        sections={sections}
        filteredSections={filteredSections}
        sectionConfig={sectionIcons}
        onIniciarImpresion={handleIniciarImpresion}
      />

      {/* Modal Visor de PDF e Impresión Nativo de AguaVP */}
      {pdfUrl && (
        <ModalImprimir
          pdfUrl={pdfUrl}
          printUrl={printUrl}
          initialMode={modoPdf === "imprimir" ? "print" : "preview"}
          defaultLandscape={false}
          onClose={() => {
            setPdfUrl(null);
            setPrintUrl(null);
            setModoPdf(null);
          }}
        />
      )}
    </div>
  );
};

export default AyudaVista;