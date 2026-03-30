import React, { useState, useEffect, useMemo } from 'react';
import { HiX, HiPrinter, HiDownload, HiDocumentText } from 'react-icons/hi';
import { Button } from '@nextui-org/react';

// ── react-pdf-viewer ────────────────────────────────────────
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

// Worker: importar como URL estática vía Vite (?url suffix)
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.js?url';

// Tema de la app
import { useTheme } from '@renderer/theme/useTheme';

// ── Localización en español ─────────────────────────────────
const esEs = {
    core: {
        askingPassword: {
            requirePasswordToOpen: 'Este documento requiere una contraseña para abrirlo',
            submit: 'Enviar',
        },
        wrongPassword: {
            tryAgain: 'La contraseña es incorrecta. Inténtelo de nuevo',
        },
        pageLabel: 'Página {{pageIndex}}',
    },
    defaultLayout: {
        thumbnail: 'Miniaturas',
        bookmark: 'Marcadores',
        attachment: 'Adjuntos',
    },
    toolbar: {
        moreActions: 'Más acciones',
    },
    zoom: {
        actualSize: 'Tamaño real',
        pageFit: 'Ajustar página',
        pageWidth: 'Ancho de página',
        zoomDocument: 'Zoom del documento',
        zoomIn: 'Acercar',
        zoomOut: 'Alejar',
    },
    pageNavigation: {
        enterPageNumber: 'Ingrese un número de página',
        goToFirstPage: 'Primera página',
        goToLastPage: 'Última página',
        goToNextPage: 'Página siguiente',
        goToPreviousPage: 'Página anterior',
    },
    print: {
        cancel: 'Cancelar',
        close: 'Cerrar',
        disallowPrint: 'Este documento no permite la impresión',
        preparingDocument: 'Preparando documento…',
        print: 'Imprimir',
    },
    search: {
        close: 'Cerrar',
        enterToSearch: 'Presione Enter para buscar',
        matchCase: 'Coincidir mayúsculas',
        nextMatch: 'Siguiente coincidencia',
        previousMatch: 'Coincidencia anterior',
        search: 'Buscar',
        wholeWords: 'Palabras completas',
    },
    open: {
        openFile: 'Abrir archivo',
    },
    download: {
        download: 'Descargar',
    },
    fullScreen: {
        enterFullScreen: 'Pantalla completa',
        exitFullScreen: 'Salir de pantalla completa',
    },
    properties: {
        author: 'Autor',
        close: 'Cerrar',
        creationDate: 'Fecha de creación',
        creator: 'Creador',
        fileName: 'Nombre del archivo',
        fileSize: 'Tamaño del archivo',
        keywords: 'Palabras clave',
        modificationDate: 'Fecha de modificación',
        pageCount: 'Número de páginas',
        pdfProducer: 'Productor PDF',
        pdfVersion: 'Versión PDF',
        showProperties: 'Mostrar propiedades',
        subject: 'Asunto',
        title: 'Título',
    },
    rotate: {
        rotateBackward: 'Girar a la izquierda',
        rotateForward: 'Girar a la derecha',
    },
    scrollMode: {
        dualPage: 'Doble página',
        dualPageCover: 'Doble página con portada',
        horizontalScrolling: 'Desplazamiento horizontal',
        pageScrolling: 'Desplazamiento por página',
        singlePage: 'Página única',
        verticalScrolling: 'Desplazamiento vertical',
        wrappedScrolling: 'Desplazamiento continuo',
    },
    selectionMode: {
        handTool: 'Herramienta de mano',
        textSelectionTool: 'Herramienta de selección de texto',
    },
};

const ModalVistaPrevia = ({ pdfUrl, printUrl, onClose, onImprimir }) => {
    const [numPages, setNumPages] = useState(0);
    const { theme } = useTheme();

    // Resolver tema efectivo (system → light/dark)
    const effectiveTheme = useMemo(() => {
        if (theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return theme;
    }, [theme]);

    // Plugin de layout — se llama directamente porque defaultLayoutPlugin usa React.useMemo
    // internamente; envolverlo en useMemo externo viola las Rules of Hooks (hooks condicionales)
    const defaultLayoutPluginInstance = defaultLayoutPlugin({
        sidebarTabs: (defaultTabs) => [defaultTabs[0]],
    });

    // Cerrar con Escape
    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Guardar PDF en disco
    const handleSavePdf = async () => {
        if (!pdfUrl) return;
        try {
            await window.api.savePdf(pdfUrl);
        } catch (err) {
            console.error('Error al guardar PDF:', err);
        }
    };

    const handleDocumentLoad = (e) => {
        setNumPages(e.doc.numPages);
    };

    if (!pdfUrl) return null;

    const isDark = effectiveTheme === 'dark';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-900/70 dark:bg-black/85 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
            <div className={`w-full max-w-6xl h-full max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl ring-1 ring-white/10 ${
                isDark ? 'bg-zinc-900' : 'bg-slate-50'
            }`}>

                {/* ── Header Premium ───────────────────────────────────────── */}
                <div className={`flex items-center justify-between px-4 py-3 shrink-0 border-b ${
                    isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                            <HiDocumentText className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className={`text-base font-bold leading-tight ${isDark ? 'text-zinc-100' : 'text-slate-800'}`}>
                                Vista Previa del Documento
                            </h2>
                            {numPages > 0 ? (
                                <p className={`text-xs font-medium uppercase tracking-wider mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                                    {numPages} {numPages === 1 ? 'Página' : 'Páginas'}
                                </p>
                            ) : (
                                <p className={`text-xs font-medium uppercase tracking-wider mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-500'} animate-pulse`}>
                                    Cargando páginas...
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        
                        {/* Descargar (Móvil: Icono | Desktop: Icono + Texto) */}
                        <Button
                            variant="flat"
                            color="default"
                            size="sm"
                            onPress={handleSavePdf}
                            className="font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                            startContent={<HiDownload className="text-lg" />}
                        >
                            <span className="hidden sm:inline">Guardar PDF</span>
                        </Button>

                        {/* Imprimir → abre el modal de opciones de impresión */}
                        <Button
                            color="primary"
                            size="sm"
                            onPress={onImprimir}
                            isDisabled={!printUrl || !onImprimir}
                            startContent={<HiPrinter className="text-lg" />}
                            className="font-bold shadow-md shadow-blue-500/20"
                        >
                            Imprimir
                        </Button>

                        {/* Divisor vertical */}
                        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-zinc-700' : 'bg-slate-200'}`}></div>

                        {/* Cerrar */}
                        <Button
                            isIconOnly
                            variant="light"
                            color="danger"
                            size="sm"
                            onPress={onClose}
                            className="hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <HiX className="text-lg" />
                        </Button>
                    </div>
                </div>

                {/* ── Visor PDF ───────────────────────────────────────── */}
                {/* Un sutil contenedor interno para que el toolbar de pdf-viewer no choque visualmente con nuestro header */}
                <div className={`flex-1 overflow-hidden relative ${isDark ? 'bg-zinc-950' : 'bg-slate-100'}`}>
                    <Worker workerUrl={pdfjsWorker}>
                        <Viewer
                            fileUrl={pdfUrl}
                            defaultScale={SpecialZoomLevel.PageFit}
                            onDocumentLoad={handleDocumentLoad}
                            plugins={[defaultLayoutPluginInstance]}
                            theme={effectiveTheme}
                            localization={esEs}
                        />
                    </Worker>
                </div>
            </div>

            {/* Ocultar botón de abrir archivo del toolbar de react-pdf-viewer y ajustar sus colores para que hagan match */}
            <style>{`
                .rpv-open__input-wrapper { display: none !important; }
                
                /* Ajustes sutiles al theme de react-pdf-viewer para que se integre a la perfección con Tailwind Zinc/Slate */
                .rpv-core__viewer--dark {
                    --rpv-core__theme-bg-body: #09090b !important; /* zinc-950 */
                    --rpv-core__theme-bg-toolbar: #18181b !important; /* zinc-900 */
                    --rpv-core__theme-border-color: #27272a !important; /* zinc-800 */
                }
                .rpv-core__viewer--light {
                    --rpv-core__theme-bg-body: #f8fafc !important; /* slate-50 */
                    --rpv-core__theme-bg-toolbar: #ffffff !important; /* white */
                    --rpv-core__theme-border-color: #e2e8f0 !important; /* slate-200 */
                }
            `}</style>
        </div>
    );
};

export default ModalVistaPrevia;