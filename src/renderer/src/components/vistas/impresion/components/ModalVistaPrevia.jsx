
import React, { useState, useEffect, useMemo } from 'react';
import { HiX, HiPrinter, HiDownload } from 'react-icons/hi';

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

const ModalVistaPrevia = ({ pdfUrl, printUrl, onClose }) => {
    const [isPrinting, setIsPrinting] = useState(false);
    const [numPages, setNumPages]     = useState(0);
    const { theme } = useTheme();

    // Resolver tema efectivo (system → light/dark)
    const effectiveTheme = useMemo(() => {
        if (theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return theme;
    }, [theme]);

    // Plugin de layout (toolbar con zoom, navegación, búsqueda)
    const defaultLayoutPluginInstance = defaultLayoutPlugin({
        sidebarTabs: (defaultTabs) => [defaultTabs[0]],
    });

    // Cerrar con Escape
    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Imprimir: abre el diálogo de impresión del sistema
    const handlePrint = async () => {
        if (!printUrl || isPrinting) return;
        setIsPrinting(true);
        try {
            await window.api.printComponent(printUrl, () => {});
        } catch (err) {
            console.error('Error al imprimir:', err);
        } finally {
            setIsPrinting(false);
        }
    };

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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className={`rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden ${
                isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>

                {/* ── Header ───────────────────────────────────────── */}
                <div className={`flex items-center justify-between mt-8 px-5 py-2.5 shrink-0 ${
                    isDark ? 'bg-gray-900' : 'bg-white border-b border-gray-200'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            <HiPrinter size={16} className="opacity-80" />
                            <h2 className="text-sm font-semibold leading-tight">Vista Previa</h2>
                            {numPages > 0 && (
                                <span className={`text-xs ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    — {numPages} página{numPages > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Guardar PDF */}
                        <button
                            onClick={handleSavePdf}
                            title="Guardar PDF"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isDark
                                    ? 'text-gray-200 hover:bg-white/10'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <HiDownload size={14} />
                            <span className="hidden sm:inline">Guardar PDF</span>
                        </button>

                        {/* Imprimir */}
                        <button
                            onClick={handlePrint}
                            disabled={isPrinting || !printUrl}
                            title="Imprimir"
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                isPrinting || !printUrl
                                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.97] text-white shadow-md shadow-blue-900/30'
                            }`}
                        >
                            <HiPrinter size={14} />
                            {isPrinting ? 'Imprimiendo…' : 'Imprimir'}
                        </button>

                        {/* Cerrar */}
                        <button
                            onClick={onClose}
                            className={`p-1.5 rounded-full transition-colors ml-1 ${
                                isDark
                                    ? 'text-gray-400 hover:text-white hover:bg-white/10'
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'
                            }`}
                        >
                            <HiX size={16} />
                        </button>
                    </div>
                </div>

                {/* ── Visor PDF (ocupa todo el espacio) ────────────── */}
                <div className="flex-1 overflow-hidden">
                    <Worker workerUrl={pdfjsWorker}>
                        <Viewer
                            fileUrl={pdfUrl}
                            defaultScale={SpecialZoomLevel.PageFit}
                            onDocumentLoad={handleDocumentLoad}
                            plugins={[defaultLayoutPluginInstance]}
                            theme={{ theme: effectiveTheme }}
                            localization={esEs}
                        />
                    </Worker>
                </div>
            </div>

            {/* Ocultar botón de abrir archivo del toolbar */}
            <style>{`
                .rpv-open__input-wrapper { display: none !important; }
            `}</style>
        </div>
    );
};

export default ModalVistaPrevia;
