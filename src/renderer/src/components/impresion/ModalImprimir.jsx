import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    HiX,
    HiPrinter,
    HiDownload,
    HiRefresh,
    HiDocumentText,
    HiChevronDown,
    HiChevronUp,
    HiExternalLink,
    HiCheck,
    HiDuplicate
} from 'react-icons/hi';
import { Button, Spinner } from '@heroui/react';
import { PDFViewer } from '@embedpdf/react-pdf-viewer';
import { useTheme } from '@renderer/theme/useTheme';
import { useFeedback } from '@renderer/context/FeedbackContext';

const notifyOS = (title, body, type = 'success') => {
    if (!('Notification' in window)) return;
    const send = () => new Notification(title, { body, silent: type === 'success' });
    if (Notification.permission === 'granted') {
        send();
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => { if (p === 'granted') send(); });
    }
};

const IconHorizontal = () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5 8H15M5 12H11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
);

const IconVertical = () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 6H13M7 10H13M7 14H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
);

const IconColor = () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="5" stroke="#ec4899" strokeWidth="1.6" fill="#ec4899" fillOpacity="0.2" />
        <circle cx="12" cy="8" r="5" stroke="#3b82f6" strokeWidth="1.6" fill="#3b82f6" fillOpacity="0.2" />
        <circle cx="10" cy="12" r="5" stroke="#eab308" strokeWidth="1.6" fill="#eab308" fillOpacity="0.2" />
    </svg>
);

const IconMonochrome = () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 3V17C13.866 17 17 13.866 17 10C17 6.13401 13.866 3 10 3Z" fill="currentColor" />
    </svg>
);

const SAVE_AS_PDF_VALUE = '__save_as_pdf__';

const ModalImprimir = ({
    pdfUrl,
    printUrl,
    onClose,
    initialMode = 'preview',
    defaultLandscape = true
}) => {
    // Layout: Panel lateral visible por defecto (estilo Chrome / Edge)
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Estado de hardware e impresoras
    const [printers, setPrinters] = useState([]);
    const [loadingPrinters, setLoadingPrinters] = useState(false);
    const [selectedDestination, setSelectedDestination] = useState('');

    // Metadatos nativos del documento (orientación real y total de páginas leídos de los bytes del PDF)
    const [totalPages, setTotalPages] = useState(1);
    const [nativeOrientation, setNativeOrientation] = useState(null); // 'landscape' | 'portrait'
    const [docDimensions, setDocDimensions] = useState(null);
    const [metadataLoaded, setMetadataLoaded] = useState(false);

    // Estado de vista previa dinámica (corte de páginas y rotación interactiva en el visor)
    const [activePdfUrl, setActivePdfUrl] = useState(pdfUrl);
    const [previewPagesCount, setPreviewPagesCount] = useState(1);
    const [isGeneratingSlice, setIsGeneratingSlice] = useState(false);

    // Opciones estándar de impresión (Browser Standard)
    const [pageOption, setPageOption] = useState('all'); // 'all' | 'custom'
    const [customPages, setCustomPages] = useState('');
    const [copies, setCopies] = useState(1);
    const [collate, setCollate] = useState(true);
    const [landscape, setLandscape] = useState(defaultLandscape);
    const [colorMode, setColorMode] = useState('color'); // 'color' | 'monochrome'
    const [pageSize, setPageSize] = useState('Letter');
    const [pagesPerSheet, setPagesPerSheet] = useState(1);
    const [scale, setScale] = useState('fit'); // 'fit' | 'noscale' | 'shrink'
    const [duplex, setDuplex] = useState(false);
    const [duplexMode, setDuplexMode] = useState('duplex'); // 'duplex' (borde largo) | 'duplexshort' (borde corto)
    const [showMoreSettings, setShowMoreSettings] = useState(false);

    // Feedback y procesamiento
    const [isPrinting, setIsPrinting] = useState(false);
    const [printError, setPrintError] = useState(null);
    const [printSuccess, setPrintSuccess] = useState(null);

    const { setSuccess, setError } = useFeedback();
    const { theme } = useTheme();

    const effectiveTheme = useMemo(() => {
        if (theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return theme;
    }, [theme]);

    // Detección de si el destino elegido es virtual PDF
    const isPdfDestination =
        selectedDestination === SAVE_AS_PDF_VALUE ||
        (typeof selectedDestination === 'string' && (
            selectedDestination.toLowerCase().includes('print to pdf') ||
            selectedDestination.toLowerCase().includes('pdf')
        ));

    // Determinar si el documento tiene una rotación manual respecto a su orientación nativa
    const isRotated = useMemo(() => {
        if (!metadataLoaded || !nativeOrientation) return false;
        return landscape !== (nativeOrientation === 'landscape');
    }, [metadataLoaded, nativeOrientation, landscape]);

    // 1. DETECCIÓN AUTOMÁTICA DE METADATOS Y ORIENTACIÓN NATIVA DEL PDF
    useEffect(() => {
        let isMounted = true;
        if (pdfUrl && window.api?.getPdfMetadata) {
            window.api.getPdfMetadata(pdfUrl).then(meta => {
                if (isMounted && meta && meta.success) {
                    if (typeof meta.pageCount === 'number' && meta.pageCount > 0) {
                        setTotalPages(meta.pageCount);
                        setPreviewPagesCount(meta.pageCount);
                    }
                    if (typeof meta.isLandscape === 'boolean') {
                        setLandscape(meta.isLandscape);
                        setNativeOrientation(meta.orientation);
                    }
                    if (meta.width && meta.height) {
                        setDocDimensions({ width: meta.width, height: meta.height });
                    }
                    setMetadataLoaded(true);
                    console.log('📄 Metadatos nativos detectados:', meta);
                }
            }).catch(e => console.warn('Error leyendo metadatos nativos del PDF:', e));
        }
        return () => { isMounted = false; };
    }, [pdfUrl]);

    const viewerContainerRef = useRef(null);
    const generatedSlicesRef = useRef([]);

    // 2. CONTROL EN TIEMPO REAL DEL MODO B/N EN EL VISOR (ESTILO NATIVO DE NAVEGADOR)
    // Inyecta el filtro de escala de grises ÚNICAMENTE en las páginas del PDF (img, canvas)
    // dentro del Shadow DOM del visor WebAssembly (<embedpdf-container>), manteniendo la barra de
    // herramientas, controles de zoom, navegación y la interfaz del modal completamente a color.
    useEffect(() => {
        const applyMonochromeStyle = () => {
            const container = viewerContainerRef.current;
            if (!container) return;

            const embedContainer = container.querySelector('embedpdf-container');
            if (!embedContainer || !embedContainer.shadowRoot) return;

            const shadow = embedContainer.shadowRoot;
            let styleTag = shadow.getElementById('aguavp-pdf-bn-filter');

            if (colorMode === 'monochrome') {
                if (!styleTag) {
                    styleTag = document.createElement('style');
                    styleTag.id = 'aguavp-pdf-bn-filter';
                    styleTag.textContent = `
                        /* Filtro monocromático de alta fidelidad aplicado estrictamente a las hojas/páginas del PDF */
                        img, canvas, [data-page-index], .pdf-page {
                            filter: grayscale(100%) contrast(108%) brightness(101%) !important;
                            transition: filter 0.15s ease-in-out;
                        }
                    `;
                    shadow.appendChild(styleTag);
                }
            } else {
                if (styleTag) {
                    styleTag.remove();
                }
            }
        };

        // Ejecución inmediata (0ms de latencia para el usuario)
        applyMonochromeStyle();

        // Observador de mutaciones para asegurar que cuando el Web Component se monte o renderice páginas,
        // el estilo se aplique o persista de inmediato
        const container = viewerContainerRef.current;
        if (!container) return;

        const observer = new MutationObserver(() => {
            applyMonochromeStyle();
        });
        observer.observe(container, { childList: true, subtree: true });

        // Intervalo de verificación suave mientras PDFium WebAssembly inicializa las páginas
        const intervalId = setInterval(applyMonochromeStyle, 200);
        const timeoutId = setTimeout(() => clearInterval(intervalId), 3000);

        return () => {
            observer.disconnect();
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, [colorMode, activePdfUrl]);

    // 3. ACTUALIZACIÓN DINÁMICA DEL VISOR (CORTE DE PÁGINAS Y ROTACIÓN EN TIEMPO REAL)
    useEffect(() => {
        let isMounted = true;
        const hasCustomPages = pageOption === 'custom' && customPages.trim().length > 0;

        // Si no hay filtro personalizado de páginas ni rotación activa, volver al PDF original
        if (!hasCustomPages && !isRotated) {
            setActivePdfUrl(pdfUrl);
            setPreviewPagesCount(totalPages);
            return;
        }

        const timer = setTimeout(async () => {
            if (!window.api?.generatePreviewSlice) return;
            setIsGeneratingSlice(true);
            try {
                const rotateAngle = isRotated ? 90 : 0;
                const res = await window.api.generatePreviewSlice({
                    fileUrl: pdfUrl,
                    pages: hasCustomPages ? customPages.trim() : 'all',
                    rotateAngle,
                    colorMode
                });
                if (isMounted && res?.success && res.url) {
                    if (res.path) {
                        generatedSlicesRef.current.push(res.path);
                    }
                    setActivePdfUrl(res.url);
                    setPreviewPagesCount(res.pageCount || 1);
                }
            } catch (err) {
                console.warn('Error generando vista previa filtrada:', err);
            } finally {
                if (isMounted) setIsGeneratingSlice(false);
            }
        }, 250);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [pdfUrl, pageOption, customPages, isRotated, totalPages, colorMode]);

    // Limpieza de cortes temporales en el desmontaje
    useEffect(() => {
        return () => {
            if (generatedSlicesRef.current.length > 0) {
                generatedSlicesRef.current.forEach(p => {
                    window.api?.deleteTempPdf?.(p);
                });
                generatedSlicesRef.current = [];
            }
        };
    }, []);

    // 3. CARGA DE IMPRESORAS INSTALADAS EN WINDOWS
    const loadPrinters = useCallback(async () => {
        setLoadingPrinters(true);
        try {
            const list = await window.api.getPrinters();
            setPrinters(list || []);
            if (list && list.length > 0) {
                const def = list.find(p => p.isDefault) || list[0];
                setSelectedDestination(prev => prev || def.name);
            } else {
                setSelectedDestination(prev => prev || SAVE_AS_PDF_VALUE);
            }
        } catch (err) {
            console.error('Error al cargar impresoras:', err);
            setSelectedDestination(prev => prev || SAVE_AS_PDF_VALUE);
        } finally {
            setLoadingPrinters(false);
        }
    }, []);

    useEffect(() => {
        loadPrinters();
    }, [loadPrinters]);

    // Limpia el PDF temporal y los cortes intermedios al cerrar
    const handleClose = useCallback(() => {
        if (pdfUrl) window.api?.deleteTempPdf?.(pdfUrl);
        if (generatedSlicesRef.current.length > 0) {
            generatedSlicesRef.current.forEach(p => {
                window.api?.deleteTempPdf?.(p);
            });
            generatedSlicesRef.current = [];
        }
        onClose();
    }, [pdfUrl, onClose]);

    // Guardar como PDF mediante diálogo nativo de Windows (con filtrado nativo de páginas, rotación y B/N)
    const handleSavePdf = useCallback(async () => {
        if (!pdfUrl) return;

        if (pageOption === 'custom' && !customPages.trim()) {
            setPrintError('Ingresa el rango de páginas que deseas guardar (ej. 1-3, 5).');
            return;
        }

        setIsPrinting(true);
        setPrintError(null);
        setPrintSuccess(null);
        try {
            const options = {
                pages: pageOption === 'custom' ? customPages.trim() : 'all',
                rotateAngle: isRotated ? 90 : 0,
                colorMode
            };
            const result = await window.api.savePdf(pdfUrl, options);
            if (result?.success) {
                const msg = pageOption === 'custom'
                    ? `Documento guardado en PDF exitosamente (páginas filtradas: ${customPages}).`
                    : 'El documento fue guardado en PDF exitosamente.';
                setPrintSuccess(msg);
                setSuccess(msg, 'Guardar PDF');
                notifyOS('PDF guardado', msg, 'success');
            }
        } catch (err) {
            console.error('Error al guardar PDF:', err);
            const errMsg = typeof err === 'string' ? err : 'No se pudo guardar el archivo PDF.';
            setPrintError(errMsg);
            setError(errMsg, 'Guardar PDF');
        } finally {
            setIsPrinting(false);
        }
    }, [pdfUrl, pageOption, customPages, isRotated, colorMode, setSuccess, setError]);

    // Enviar trabajo a la impresora física silenciosamente con SumatraPDF
    const handlePrint = useCallback(async () => {
        if (!pdfUrl || isPrinting) return;

        if (pageOption === 'custom' && !customPages.trim()) {
            setPrintError('Ingresa el rango de páginas que deseas imprimir (ej. 1-3, 5).');
            return;
        }

        setIsPrinting(true);
        setPrintError(null);
        setPrintSuccess(null);

        try {
            const config = {
                printer: isPdfDestination ? '' : selectedDestination,
                copies: isPdfDestination ? 1 : Math.max(1, copies),
                landscape,
                rotateAngle: isRotated ? 90 : 0,
                pageSize,
                colorMode,
                pages: pageOption === 'custom' ? customPages.trim() : 'all',
                duplex: duplex ? duplexMode : 'simplex',
                scale,
                collate: copies > 1 ? collate : false,
                pagesPerSheet
            };

            await window.api.printSilent(pdfUrl, config);
            const targetName = isPdfDestination ? 'Archivo PDF' : (selectedDestination || 'impresora predeterminada');
            const msg = `Trabajo enviado a "${targetName}" (${copies} ${copies === 1 ? 'copia' : 'copias'})`;
            setPrintSuccess(msg);
            setSuccess(msg, 'Impresión exitosa');
            notifyOS('Impresión enviada', msg, 'success');
        } catch (err) {
            console.error('Error al imprimir:', err);
            const errMsg = typeof err === 'string' ? err : 'No se pudo enviar el trabajo a la impresora.';
            setPrintError(errMsg);
            setError(errMsg, 'Error de impresión');
            notifyOS('Error de impresión', errMsg, 'error');
        } finally {
            setIsPrinting(false);
        }
    }, [
        pdfUrl,
        isPrinting,
        isPdfDestination,
        selectedDestination,
        copies,
        landscape,
        pageSize,
        colorMode,
        pageOption,
        customPages,
        duplex,
        duplexMode,
        scale,
        collate,
        pagesPerSheet,
        setSuccess,
        setError
    ]);

    // Acción principal (Imprimir o Guardar según el destino)
    const handlePrimaryAction = useCallback(() => {
        if (isPdfDestination) {
            handleSavePdf();
        } else {
            handlePrint();
        }
    }, [isPdfDestination, handleSavePdf, handlePrint]);

    // Imprimir mediante el diálogo del sistema operativo (Ctrl+Shift+P)
    const handlePrintOS = useCallback(async () => {
        if (!printUrl || isPrinting) return;
        setIsPrinting(true);
        try {
            await window.api.printComponent(printUrl, () => {});
            handleClose();
        } catch (err) {
            console.error('Error al imprimir con diálogo del sistema:', err);
            setError('No se pudo abrir el cuadro de diálogo del sistema.', 'Error de impresión');
        } finally {
            setIsPrinting(false);
        }
    }, [printUrl, isPrinting, handleClose, setError]);

    // Atajos de teclado estilo navegador: Esc para cerrar, Ctrl+P para imprimir, Ctrl+Shift+P para diálogo OS
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (!isPrinting) {
                    handleClose();
                }
            } else if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
                e.preventDefault();
                if (e.shiftKey) {
                    handlePrintOS();
                } else {
                    handlePrimaryAction();
                }
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleClose, handlePrintOS, handlePrimaryAction]);

    // Generadores rápidos de selección de páginas
    const setQuickPages = (type) => {
        if (type === 'odds') {
            const arr = [];
            for (let i = 1; i <= totalPages; i += 2) arr.push(i);
            setCustomPages(arr.join(', '));
        } else if (type === 'evens') {
            const arr = [];
            for (let i = 2; i <= totalPages; i += 2) arr.push(i);
            setCustomPages(arr.join(', '));
        } else if (type === 'firstHalf') {
            const half = Math.ceil(totalPages / 2);
            setCustomPages(`1-${half}`);
        } else if (type === 'secondHalf') {
            const half = Math.ceil(totalPages / 2);
            setCustomPages(`${half + 1}-${totalPages}`);
        }
        setPageOption('custom');
    };

    if (!pdfUrl) return null;

    // Tokens de estilo consistentes con aguavp-ui-system
    const labelCls = "text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 block mb-1.5 ml-0.5";
    const selectCls = "w-full bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none focus:border-indigo-500 transition-all duration-200 shadow-none h-11 px-3.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 outline-none cursor-pointer appearance-none";
    const inputCls = "w-full bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none focus:border-indigo-500 transition-all duration-200 shadow-none h-11 px-3.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 outline-none";
    const segmentWrap = "flex rounded-xl p-1 gap-1 border border-slate-200/80 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-900";
    const segmentBase = "flex-1 py-2 text-[11px] uppercase tracking-wider font-bold transition-all duration-200 focus:outline-none flex items-center justify-center gap-1.5 rounded-lg";
    const segmentActive = "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm border border-slate-200/80 dark:border-zinc-700";
    const segmentInactive = "text-slate-600 dark:text-zinc-400 font-medium hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/40 dark:hover:bg-zinc-800/40";

    return (
        <div className="fixed top-16 inset-x-0 bottom-0 z-[9990] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 p-2 sm:p-4 lg:p-6 select-none animate-in fade-in duration-200">
            <div className="w-full max-w-[1440px] h-full max-h-[calc(100vh-5.5rem)] rounded-[2rem] flex flex-col overflow-hidden shadow-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 my-auto">

                {/* ═══════════════════════════════════════════════════════════════════ */}
                {/* HEADER UNIFICADO ESTILO NAVEGADOR                                   */}
                {/* ═══════════════════════════════════════════════════════════════════ */}
                <div className="flex items-center justify-between px-6 sm:px-8 py-3.5 shrink-0 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
                    <div className="flex items-center gap-3.5">
                        <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
                            <HiPrinter className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                                    Imprimir
                                </h2>
                                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700/60">
                                    <span>{pageSize}</span>
                                    <span>•</span>
                                    <span>{landscape ? 'Horizontal' : 'Vertical'}</span>
                                    <span>•</span>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-black">{totalPages} {totalPages === 1 ? 'página' : 'páginas'}</span>
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                                Vista previa interactiva y opciones nativas de impresión
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Botón para alternar visibilidad del panel de opciones (expandir vista previa) */}
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(prev => !prev)}
                            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
                            title={sidebarOpen ? "Ocultar panel de opciones" : "Mostrar panel de opciones"}
                        >
                            <HiDocumentText className="w-4 h-4" />
                            <span>{sidebarOpen ? 'Expandir visor' : 'Configurar'}</span>
                        </button>

                        {/* Botón directo para diálogo del sistema operativo */}
                        {printUrl && (
                            <button
                                type="button"
                                onClick={handlePrintOS}
                                disabled={isPrinting}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                                title="Imprimir usando el diálogo de Windows (Ctrl+Shift+P)"
                            >
                                <HiExternalLink className="w-4 h-4" />
                                <span>Diálogo OS</span>
                            </button>
                        )}

                        <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

                        {/* Botón cerrar */}
                        <button
                            type="button"
                            onClick={handleClose}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                            aria-label="Cerrar modal"
                            title="Cerrar (Esc)"
                        >
                            <HiX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════════ */}
                {/* CUERPO PRINCIPAL: VISOR PDF + PANEL LATERAL (CHROME / EDGE DUAL)     */}
                {/* ═══════════════════════════════════════════════════════════════════ */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50/50 dark:bg-black/20 relative">

                    {/* VISOR PDF (Área central / izquierda con barra interactiva y simulación B/N en tiempo real) */}
                    <div className="flex-1 overflow-hidden relative bg-slate-200/60 dark:bg-zinc-900/80 flex flex-col">
                        
                        {/* BARRA SUPERIOR DEL VISOR NATIVO */}
                        <div className="h-10 px-4 shrink-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between z-10 select-none">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                                    <HiDocumentText className="w-4 h-4 text-indigo-500" />
                                    <span>
                                        {pageOption === 'custom' && customPages.trim()
                                            ? `Páginas seleccionadas: ${previewPagesCount} de ${totalPages}`
                                            : `${totalPages} ${totalPages === 1 ? 'página' : 'páginas'}`}
                                    </span>
                                </span>

                                {pageOption === 'custom' && customPages.trim() && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                                        Rango: {customPages}
                                    </span>
                                )}

                                {isRotated && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                                        Rotado 90°
                                    </span>
                                )}

                                {colorMode === 'monochrome' && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                                        B/N Monocromático
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {isGeneratingSlice && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mr-2">
                                        <Spinner size="sm" color="primary" />
                                        <span>Actualizando vista previa...</span>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setLandscape(prev => !prev)}
                                    title="Alternar orientación (Girar 90°)"
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 text-[10px] font-bold"
                                >
                                    <HiRefresh className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Girar 90°</span>
                                </button>
                            </div>
                        </div>

                        {/* Contenedor del PDFViewer con alcance específico a hojas del PDF */}
                        <div ref={viewerContainerRef} className="flex-1 overflow-hidden relative flex flex-col">

                            {/* Estado visual de carga */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-0 pointer-events-none">
                                <Spinner size="lg" color="primary" />
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 animate-pulse">
                                    Renderizando vista previa en alta definición...
                                </p>
                            </div>

                            {/* Motor PDFium WebAssembly conectado al archivo dinámico */}
                            <PDFViewer
                                key={activePdfUrl}
                                config={{
                                    src: activePdfUrl,
                                    theme: { preference: effectiveTheme },
                                    i18n: { defaultLocale: 'es' },
                                    disabledCategories: [
                                        'annotation',
                                        'form',
                                        'redaction',
                                        'document-print',
                                        'document-export',
                                        'insert'
                                    ]
                                }}
                                style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}
                            />
                        </div>
                    </div>

                    {/* PANEL DE OPCIONES DE IMPRESIÓN (Sidebar derecho estilo Chrome / Edge) */}
                    {sidebarOpen && (
                        <aside className="w-full md:w-[380px] lg:w-[400px] shrink-0 flex flex-col border-t md:border-t-0 md:border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-10 shadow-lg md:shadow-none animate-in slide-in-from-right-4 duration-200">
                            
                            {/* Scroll de Controles */}
                            <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto">

                                {/* 1. DESTINO (IMPRESORA O GUARDAR COMO PDF) */}
                                <div>
                                    <div className="flex items-center justify-between mb-1 ml-0.5">
                                        <span className={labelCls}>Destino</span>
                                        <button
                                            type="button"
                                            onClick={loadPrinters}
                                            disabled={loadingPrinters}
                                            title="Actualizar lista de impresoras"
                                            className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 transition-colors focus:outline-none"
                                        >
                                            <HiRefresh className={`w-3.5 h-3.5 ${loadingPrinters ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>

                                    {loadingPrinters ? (
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-zinc-500 h-11 px-3 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-900/60">
                                            <Spinner size="sm" color="default" /> Detectando impresoras...
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <select
                                                value={selectedDestination}
                                                onChange={e => {
                                                    setSelectedDestination(e.target.value);
                                                    setPrintSuccess(null);
                                                    setPrintError(null);
                                                }}
                                                className={selectCls}
                                            >
                                                <option value={SAVE_AS_PDF_VALUE}>
                                                    💾 Guardar como PDF
                                                </option>
                                                {printers.map(p => (
                                                    <option key={p.name} value={p.name}>
                                                        🖨️ {p.displayName || p.name}{p.isDefault ? ' (Predeterminada)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                                                <HiChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 2. PÁGINAS (TODO O PERSONALIZADO CON METADATOS REALES) */}
                                <div>
                                    <div className="flex items-center justify-between mb-1 ml-0.5">
                                        <span className={labelCls}>Páginas</span>
                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                            Total: {totalPages} {totalPages === 1 ? 'pág' : 'págs'}
                                        </span>
                                    </div>
                                    <div className={segmentWrap}>
                                        <button
                                            type="button"
                                            onClick={() => setPageOption('all')}
                                            className={`${segmentBase} ${pageOption === 'all' ? segmentActive : segmentInactive}`}
                                        >
                                            Todo ({totalPages})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPageOption('custom')}
                                            className={`${segmentBase} ${pageOption === 'custom' ? segmentActive : segmentInactive}`}
                                        >
                                            Personalizado
                                        </button>
                                    </div>

                                    {pageOption === 'custom' && (
                                        <div className="mt-2.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                                            <input
                                                type="text"
                                                value={customPages}
                                                onChange={e => {
                                                    // Solo caracteres válidos para rangos (ej: 1-5, 8)
                                                    const val = e.target.value.replace(/[^0-9,\s-]/g, '');
                                                    setCustomPages(val);
                                                    setPrintError(null);
                                                }}
                                                placeholder={`Ej: 1-${totalPages} o 1, 3, 5`}
                                                className={inputCls}
                                            />
                                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setQuickPages('odds')}
                                                    className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors"
                                                >
                                                    Impares
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setQuickPages('evens')}
                                                    className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors"
                                                >
                                                    Pares
                                                </button>
                                                {totalPages > 2 && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => setQuickPages('firstHalf')}
                                                            className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors"
                                                        >
                                                            1ª Mitad
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setQuickPages('secondHalf')}
                                                            className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors"
                                                        >
                                                            2ª Mitad
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 ml-0.5">
                                                Páginas disponibles: 1 a {totalPages}. Rango o números separados por comas.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* 3. COPIAS E INTERCALADO (Solo activo si es impresora física) */}
                                <div>
                                    <span className={labelCls}>Copias</span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center">
                                            <button
                                                type="button"
                                                disabled={isPdfDestination || copies <= 1}
                                                onClick={() => setCopies(c => Math.max(1, c - 1))}
                                                className="w-11 h-11 rounded-l-xl flex items-center justify-center text-lg font-black transition-colors focus:outline-none bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 border border-slate-200/80 dark:border-zinc-700 disabled:opacity-40 disabled:pointer-events-none"
                                            >−</button>
                                            <input
                                                type="number"
                                                value={isPdfDestination ? 1 : copies}
                                                readOnly
                                                className="w-14 h-11 text-center text-base font-mono font-black tabular-nums bg-slate-50 dark:bg-zinc-900 border-y border-slate-200/80 dark:border-zinc-700 outline-none text-slate-800 dark:text-zinc-100"
                                            />
                                            <button
                                                type="button"
                                                disabled={isPdfDestination || copies >= 99}
                                                onClick={() => setCopies(c => Math.min(99, c + 1))}
                                                className="w-11 h-11 rounded-r-xl flex items-center justify-center text-lg font-black transition-colors focus:outline-none bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 border border-slate-200/80 dark:border-zinc-700 disabled:opacity-40 disabled:pointer-events-none"
                                            >+</button>
                                        </div>

                                        {/* Checkbox Intercalar páginas si hay más de 1 copia */}
                                        {!isPdfDestination && copies > 1 && (
                                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-zinc-300 ml-auto select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={collate}
                                                    onChange={e => setCollate(e.target.checked)}
                                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-zinc-700 cursor-pointer"
                                                />
                                                <span>Intercalar</span>
                                            </label>
                                        )}

                                        {isPdfDestination && (
                                            <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                                                (1 copia en archivo digital)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* 4. DISEÑO / ORIENTACIÓN */}
                                <div>
                                    <div className="flex items-center justify-between mb-1 ml-0.5">
                                        <span className={labelCls}>Diseño</span>
                                        {metadataLoaded && nativeOrientation && (
                                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                                Nativo: {nativeOrientation === 'landscape' ? 'Horizontal' : 'Vertical'}
                                                {docDimensions ? ` (${docDimensions.width}×${docDimensions.height} pt)` : ''}
                                            </span>
                                        )}
                                    </div>
                                    <div className={segmentWrap}>
                                        <button
                                            type="button"
                                            onClick={() => setLandscape(false)}
                                            className={`${segmentBase} ${!landscape ? segmentActive : segmentInactive}`}
                                        >
                                            <IconVertical />
                                            <span>Vertical</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLandscape(true)}
                                            className={`${segmentBase} ${landscape ? segmentActive : segmentInactive}`}
                                        >
                                            <IconHorizontal />
                                            <span>Horizontal</span>
                                        </button>
                                    </div>
                                    {isRotated && (
                                        <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400 mt-1 ml-0.5">
                                            Rotación de 90° aplicada respecto al documento original.
                                        </p>
                                    )}
                                </div>

                                {/* 5. MODO DE COLOR (REACTIVO AL INSTANTE EN EL VISOR) */}
                                <div>
                                    <span className={labelCls}>Color</span>
                                    <div className={segmentWrap}>
                                        <button
                                            type="button"
                                            onClick={() => setColorMode('color')}
                                            className={`${segmentBase} ${colorMode === 'color' ? segmentActive : segmentInactive}`}
                                        >
                                            <IconColor />
                                            <span>A Color</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setColorMode('monochrome')}
                                            className={`${segmentBase} ${colorMode === 'monochrome' ? segmentActive : segmentInactive}`}
                                        >
                                            <IconMonochrome />
                                            <span>B/N (Gris)</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 6. MÁS OPCIONES (ACORDEÓN EXPANDIBLE) */}
                                <div className="pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowMoreSettings(prev => !prev)}
                                        className="w-full flex items-center justify-between py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors focus:outline-none"
                                    >
                                        <span>{showMoreSettings ? 'Menos opciones' : 'Más opciones'}</span>
                                        {showMoreSettings ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
                                    </button>

                                    {showMoreSettings && (
                                        <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 animate-in fade-in duration-200">
                                            
                                            {/* Tamaño de papel */}
                                            <div>
                                                <span className={labelCls}>Tamaño de papel</span>
                                                <div className="relative">
                                                    <select
                                                        value={pageSize}
                                                        onChange={e => setPageSize(e.target.value)}
                                                        className={selectCls}
                                                    >
                                                        <option value="Letter">Carta (Letter - 8.5 x 11 in)</option>
                                                        <option value="A4">A4 (210 x 297 mm)</option>
                                                        <option value="Legal">Legal / Oficio (8.5 x 14 in)</option>
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                                                        <HiChevronDown className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Páginas por hoja */}
                                            <div>
                                                <span className={labelCls}>Páginas por hoja</span>
                                                <div className={segmentWrap}>
                                                    {[1, 2, 4].map(num => (
                                                        <button
                                                            key={num}
                                                            type="button"
                                                            onClick={() => setPagesPerSheet(num)}
                                                            className={`${segmentBase} ${pagesPerSheet === num ? segmentActive : segmentInactive}`}
                                                        >
                                                            {num}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Escala */}
                                            <div>
                                                <span className={labelCls}>Escala</span>
                                                <div className="relative">
                                                    <select
                                                        value={scale}
                                                        onChange={e => setScale(e.target.value)}
                                                        className={selectCls}
                                                    >
                                                        <option value="fit">Ajustar al área imprimible (Predeterminado)</option>
                                                        <option value="noscale">Tamaño real (100%)</option>
                                                        <option value="shrink">Reducir páginas grandes</option>
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                                                        <HiChevronDown className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Impresión a doble cara (Dúplex) */}
                                            {!isPdfDestination && (
                                                <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800">
                                                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 dark:text-zinc-200 select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={duplex}
                                                            onChange={e => setDuplex(e.target.checked)}
                                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-zinc-700 cursor-pointer"
                                                        />
                                                        <span>Imprimir a doble cara (Dúplex)</span>
                                                    </label>

                                                    {duplex && (
                                                        <div className="flex gap-2 pt-1 pl-6">
                                                            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-zinc-400 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name="duplexType"
                                                                    checked={duplexMode === 'duplex'}
                                                                    onChange={() => setDuplexMode('duplex')}
                                                                    className="text-indigo-600"
                                                                />
                                                                <span>Borde largo</span>
                                                            </label>
                                                            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-zinc-400 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name="duplexType"
                                                                    checked={duplexMode === 'duplexshort'}
                                                                    onChange={() => setDuplexMode('duplexshort')}
                                                                    className="text-indigo-600"
                                                                />
                                                                <span>Borde corto</span>
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                        </div>
                                    )}
                                </div>

                            </div>

                            {/* ═══════════════════════════════════════════════════════════════════ */}
                            {/* FOOTER DEL SIDEBAR DE ACCIONES                                      */}
                            {/* ═══════════════════════════════════════════════════════════════════ */}
                            <div className="p-5 sm:p-6 pt-4 border-t border-slate-100 dark:border-zinc-800/80 space-y-3 bg-white dark:bg-zinc-950 shrink-0">
                                
                                {/* Alertas de estado */}
                                {printSuccess && (
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 leading-tight flex items-start gap-2">
                                        <HiCheck className="text-base shrink-0 mt-0.5" />
                                        <span>{printSuccess}</span>
                                    </div>
                                )}
                                {printError && (
                                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] font-bold text-rose-600 dark:text-rose-400 leading-tight">
                                        {printError}
                                    </div>
                                )}

                                {/* Botón principal (Imprimir o Guardar PDF) */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="ghost"
                                        onPress={handleClose}
                                        isDisabled={isPrinting}
                                        className="font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-xl h-11 text-xs transition-all"
                                    >
                                        Cancelar
                                    </Button>

                                    <Button
                                        onPress={handlePrimaryAction}
                                        isLoading={isPrinting}
                                        isDisabled={isPrinting || !pdfUrl || (!isPdfDestination && printers.length === 0)}
                                        className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 text-xs shadow-sm shadow-indigo-500/20 transition-all"
                                    >
                                        {!isPrinting && (
                                            isPdfDestination ? <HiDownload className="text-base" /> : <HiPrinter className="text-base" />
                                        )}
                                        <span>{isPrinting ? 'Procesando...' : (isPdfDestination ? 'Guardar PDF' : 'Imprimir')}</span>
                                    </Button>
                                </div>

                                {/* Enlace discreto a cuadro de diálogo del SO */}
                                {printUrl && (
                                    <div className="text-center pt-1">
                                        <button
                                            type="button"
                                            onClick={handlePrintOS}
                                            disabled={isPrinting}
                                            className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 dark:text-zinc-500 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                                        >
                                            Imprimir usando el diálogo de Windows (Ctrl+Shift+P)
                                        </button>
                                    </div>
                                )}

                            </div>

                        </aside>
                    )}

                </div>

            </div>
        </div>
    );
};

export default ModalImprimir;
