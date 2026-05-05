import React, { useState, useEffect, useMemo } from 'react';
import { HiX, HiPrinter, HiDownload, HiArrowLeft, HiRefresh } from 'react-icons/hi';
import { Button, Spinner } from '@nextui-org/react';

// ── react-pdf-viewer ────────────────────────────────────────
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.js?url';
import { useTheme } from '@renderer/theme/useTheme';
import { useFeedback } from '@renderer/context/FeedbackContext';

// ─────────────────────────────────────────────────────────────
// Notificación del sistema operativo (Web Notifications API)
// ─────────────────────────────────────────────────────────────
const notifyOS = (title, body, type = 'success') => {
    if (!('Notification' in window)) return;
    const send = () => new Notification(title, { body, silent: type === 'success' });
    if (Notification.permission === 'granted') {
        send();
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => { if (p === 'granted') send(); });
    }
};

// ─────────────────────────────────────────────────────────────
// Iconos SVG para orientación (simples, sin dependencias extra)
// ─────────────────────────────────────────────────────────────
const IconHorizontal = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);
const IconVertical = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────
const ModalImprimir = ({ pdfUrl, printUrl, onClose, onVolver }) => {
    // ── Estado de impresión ──────────────────────────────────
    const [printers, setPrinters] = useState([]);
    const [loadingPrinters, setLoadingPrinters] = useState(true);
    const [selectedPrinter, setSelectedPrinter] = useState('');
    const [landscape, setLandscape] = useState(true);
    const [copies, setCopies] = useState(1);
    const [pageSize, setPageSize] = useState('Letter');
    const [isPrinting, setIsPrinting] = useState(false);
    const [printError, setPrintError] = useState(null);
    const [numPages, setNumPages] = useState(0);

    // ── Feedback ─────────────────────────────────────────────
    const { setSuccess, setError } = useFeedback();

    // ── Tema ─────────────────────────────────────────────────
    const { theme } = useTheme();
    const effectiveTheme = useMemo(() => {
        if (theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return theme;
    }, [theme]);

    // Plugin de layout — llamado directamente porque usa React.useMemo internamente
    const defaultLayoutPluginInstance = defaultLayoutPlugin({
        sidebarTabs: () => [],
    });

    // ── Cargar impresoras ────────────────────────────────────
    const loadPrinters = async () => {
        setLoadingPrinters(true);
        try {
            const list = await window.api.getPrinters();
            setPrinters(list);
            if (list.length > 0) {
                const def = list.find(p => p.isDefault) || list[0];
                setSelectedPrinter(prev => prev || def.name);
            }
        } catch (err) {
            console.error('Error al cargar impresoras:', err);
        } finally {
            setLoadingPrinters(false);
        }
    };

    useEffect(() => { loadPrinters(); }, []);

    // Cerrar con Escape
    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // ── Imprimir silencioso (sin diálogo del OS) ─────────────
    const handlePrint = async () => {
        if (!printUrl || isPrinting) return;
        setIsPrinting(true);
        setPrintError(null);
        try {
            await window.api.printSilent(printUrl, { printer: selectedPrinter, landscape, copies, pageSize });
            const msg = `Enviado a "${selectedPrinter || 'impresora predeterminada'}" — ${copies} ${copies === 1 ? 'copia' : 'copias'}`;
            setSuccess(msg, 'Impresión exitosa');
            notifyOS('Impresión enviada', msg, 'success');
            onClose();
        } catch (err) {
            console.error('Error al imprimir:', err);
            const errMsg = typeof err === 'string' ? err : 'No se pudo enviar el trabajo a la impresora.';
            setPrintError('Error al imprimir. Intente con el diálogo del sistema.');
            setError(errMsg, 'Error de impresión');
            notifyOS('Error de impresión', errMsg, 'error');
            setIsPrinting(false);
        }
    };

    // ── Imprimir con diálogo del OS ──────────────────────────
    const handlePrintOS = async () => {
        if (!printUrl || isPrinting) return;
        setIsPrinting(true);
        try {
            await window.api.printComponent(printUrl, () => {});
            onClose();
        } catch (err) {
            console.error('Error al imprimir con diálogo:', err);
            setError('No se pudo abrir el diálogo de impresión.', 'Error de impresión');
        } finally {
            setIsPrinting(false);
        }
    };

    // ── Guardar PDF ──────────────────────────────────────────
    const handleSavePdf = async () => {
        if (!pdfUrl) return;
        try {
            const result = await window.api.savePdf(pdfUrl);
            if (result?.success) {
                setSuccess('El archivo PDF fue guardado correctamente.', 'Guardar PDF');
                notifyOS('PDF guardado', 'El archivo fue guardado correctamente.', 'success');
            }
        } catch (err) {
            console.error('Error al guardar PDF:', err);
            setError('No se pudo guardar el archivo PDF.', 'Guardar PDF');
        }
    };

    if (!pdfUrl) return null;

    // ── Estilos SaaS Premium ─────────────────────────────────
    const labelCls = "text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 block mb-1.5 ml-1";
    
    // Select e Inputs (Token 4)
    const inputCls = "w-full bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 transition-all duration-200 shadow-none h-11 px-3 text-sm font-medium text-slate-800 dark:text-zinc-100 outline-none";
    
    // Segmented Controls (Corregidos con Regla de Tintes para mayor contraste)
    const segmentWrap = "flex rounded-xl p-1 gap-1 border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/80";
    const segmentBase = "flex-1 py-2 text-[11px] uppercase tracking-wider font-bold transition-all duration-200 focus:outline-none flex items-center justify-center gap-1.5 rounded-lg";
    const segmentActive = "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/30";
    const segmentInactive = "text-slate-500 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 hover:text-slate-700 dark:hover:text-zinc-200";

    return (
        /* Token 2: Modal Backdrop */
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
            
            {/* Token 2: Modal Base */}
            <div className="w-full max-w-7xl h-full max-h-[90vh] rounded-[2rem] flex flex-col overflow-hidden shadow-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">

                {/* ── Header ───────────────────────────────── */}
                <div className="flex items-center justify-between px-8 pt-6 pb-4 shrink-0 border-b border-slate-100 dark:border-zinc-800/50">
                    <div className="flex items-center gap-4">
                        {onVolver && (
                            <Button
                                isIconOnly variant="flat" size="sm" onPress={onVolver}
                                className="bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 rounded-lg h-9 w-9 shrink-0"
                                title="Volver a vista previa"
                            >
                                <HiArrowLeft className="w-4 h-4" />
                            </Button>
                        )}
                        {/* Regla de tintes */}
                        <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                            <HiPrinter className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                                Imprimir Documento
                            </h2>
                            {numPages > 0 && (
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                                    {numPages} {numPages === 1 ? 'Página a imprimir' : 'Páginas a imprimir'}
                                </p>
                            )}
                        </div>
                    </div>

                    <Button
                        isIconOnly variant="light" size="md" onPress={onClose}
                        className="hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 text-slate-400 rounded-xl"
                    >
                        <HiX className="text-xl" />
                    </Button>
                </div>

                {/* ── Body: panel + visor ───────────────────── */}
                <div className="flex-1 flex flex-col sm:flex-row overflow-hidden bg-slate-50/30 dark:bg-black/10">

                    {/* Panel de opciones (Izquierda) */}
                    <div className="w-full sm:w-80 shrink-0 flex flex-col border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-950">
                        <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">

                            {/* Impresora */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5 ml-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Impresora</span>
                                    {/* Regla de tintes para botón icon */}
                                    <button
                                        onClick={loadPrinters}
                                        disabled={loadingPrinters}
                                        title="Actualizar lista"
                                        className="p-1 rounded-md text-blue-500 hover:bg-blue-500/10 dark:hover:bg-blue-900/20 transition-colors focus:outline-none"
                                    >
                                        <HiRefresh className={`w-3.5 h-3.5 ${loadingPrinters ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                {loadingPrinters ? (
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-zinc-500 h-11 px-3 border border-slate-200 dark:border-zinc-800 rounded-xl">
                                        <Spinner size="sm" color="default" /> Cargando impresoras...
                                    </div>
                                ) : printers.length === 0 ? (
                                    <div className="text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 dark:text-red-400 rounded-xl h-11 flex items-center px-3">
                                        No se encontraron impresoras.
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <select
                                            value={selectedPrinter}
                                            onChange={e => setSelectedPrinter(e.target.value)}
                                            className={inputCls + " appearance-none"}
                                        >
                                            {printers.map(p => (
                                                <option key={p.name} value={p.name}>
                                                    {p.displayName || p.name}{p.isDefault ? ' (Predeterminada)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tamaño de papel */}
                            <div>
                                <span className={labelCls}>Tamaño de papel</span>
                                <div className={segmentWrap}>
                                    {[
                                        { value: 'Letter', label: 'Carta' },
                                        { value: 'A4',     label: 'A4'    },
                                        { value: 'Legal',  label: 'Legal' },
                                    ].map(({ value, label }) => (
                                        <button
                                            key={value}
                                            onClick={() => setPageSize(value)}
                                            className={`${segmentBase} ${pageSize === value ? segmentActive : segmentInactive}`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Orientación */}
                            <div>
                                <span className={labelCls}>Orientación</span>
                                <div className={segmentWrap}>
                                    <button
                                        onClick={() => setLandscape(true)}
                                        className={`${segmentBase} ${landscape ? segmentActive : segmentInactive}`}
                                    >
                                        <IconHorizontal /> Horizontal
                                    </button>
                                    <button
                                        onClick={() => setLandscape(false)}
                                        className={`${segmentBase} ${!landscape ? segmentActive : segmentInactive}`}
                                    >
                                        <IconVertical /> Vertical
                                    </button>
                                </div>
                            </div>

                            {/* Copias */}
                            <div>
                                <span className={labelCls}>Cantidad de Copias</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setCopies(c => Math.max(1, c - 1))}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black transition-colors focus:outline-none bg-slate-100/70 text-slate-600 hover:bg-slate-200 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                    >
                                        −
                                    </button>
                                    <input 
                                        type="number" 
                                        value={copies} 
                                        readOnly 
                                        className="w-16 h-10 text-center text-base font-black tabular-nums bg-transparent border-none outline-none text-slate-800 dark:text-zinc-100"
                                    />
                                    <button
                                        onClick={() => setCopies(c => Math.min(99, c + 1))}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black transition-colors focus:outline-none bg-slate-100/70 text-slate-600 hover:bg-slate-200 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                        </div>

                        {/* ── Acciones (Footer del sidebar) ── */}
                        <div className="p-6 pt-4 border-t border-slate-100 dark:border-zinc-800/50 space-y-3 bg-white dark:bg-zinc-950 shrink-0">
                            {printError && (
                                <div className="p-3 mb-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] font-bold text-red-600 dark:text-red-400 leading-tight">
                                    {printError}
                                </div>
                            )}

                            {/* Token 4: Botón Primario */}
                            <Button
                                onPress={handlePrint}
                                isLoading={isPrinting}
                                isDisabled={isPrinting || !printUrl || printers.length === 0}
                                startContent={!isPrinting && <HiPrinter className="text-lg" />}
                                className="w-full font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl h-[52px] shadow-sm"
                            >
                                {isPrinting ? 'Imprimiendo...' : 'Imprimir Ahora'}
                            </Button>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Botones Secundarios */}
                                <Button
                                    variant="flat"
                                    onPress={handlePrintOS}
                                    isDisabled={isPrinting || !printUrl}
                                    className="font-bold bg-slate-100/70 text-slate-700 hover:bg-slate-200 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800 rounded-xl h-11"
                                >
                                    Dialogo OS
                                </Button>

                                <Button
                                    variant="flat"
                                    onPress={handleSavePdf}
                                    startContent={<HiDownload className="text-sm opacity-70" />}
                                    className="font-bold bg-slate-100/70 text-slate-700 hover:bg-slate-200 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800 rounded-xl h-11"
                                >
                                    Guardar
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Visor PDF (Derecha) */}
                    <div className="flex-1 overflow-hidden relative">
                        <Worker workerUrl={pdfjsWorker}>
                            <Viewer
                                fileUrl={pdfUrl}
                                defaultScale={SpecialZoomLevel.PageFit}
                                onDocumentLoad={e => setNumPages(e.doc.numPages)}
                                plugins={[defaultLayoutPluginInstance]}
                                theme={effectiveTheme}
                            />
                        </Worker>
                    </div>
                </div>
            </div>

            {/* Ajuste visual del visor PDF para incrustarlo en la UI SaaS */}
            <style>{`
                .rpv-open__input-wrapper { display: none !important; }
                .rpv-core__viewer--dark {
                    --rpv-core__theme-bg-body: transparent !important;
                    --rpv-core__theme-bg-toolbar: transparent !important;
                    --rpv-core__theme-border-color: rgba(39, 39, 42, 0.5) !important; /* border-zinc-800/50 */
                }
                .rpv-core__viewer--light {
                    --rpv-core__theme-bg-body: transparent !important;
                    --rpv-core__theme-bg-toolbar: transparent !important;
                    --rpv-core__theme-border-color: rgba(241, 245, 249, 0.5) !important; /* border-slate-100/50 */
                }
            `}</style>
        </div>
    );
};

export default ModalImprimir;