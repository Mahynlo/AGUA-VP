import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HiX, HiPrinter, HiDownload, HiArrowLeft, HiRefresh, HiDocumentText } from 'react-icons/hi';
import { Button, Spinner } from '@nextui-org/react';
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
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);
const IconVertical = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

// initialMode: 'preview' (default) | 'print'
const ModalImprimir = ({ pdfUrl, printUrl, onClose, initialMode = 'preview' }) => {
    const [showPrint, setShowPrint] = useState(initialMode === 'print');

    // Print options state
    const [printers, setPrinters] = useState([]);
    const [loadingPrinters, setLoadingPrinters] = useState(false);
    const [selectedPrinter, setSelectedPrinter] = useState('');
    const [landscape, setLandscape] = useState(true);
    const [copies, setCopies] = useState(1);
    const [pageSize, setPageSize] = useState('Letter');
    const [isPrinting, setIsPrinting] = useState(false);
    const [printError, setPrintError] = useState(null);
    const [printSuccess, setPrintSuccess] = useState(null);

    const { setSuccess, setError } = useFeedback();
    const { theme } = useTheme();

    // Limpia el archivo temporal y la caché de ventana al cerrar el modal
    const handleClose = useCallback(() => {
        if (pdfUrl) window.api?.deleteTempPdf?.(pdfUrl);
        onClose();
    }, [pdfUrl, onClose]);
    const effectiveTheme = useMemo(() => {
        if (theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return theme;
    }, [theme]);

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

    // Load printers lazily when the print panel first opens
    useEffect(() => {
        if (showPrint && printers.length === 0) {
            loadPrinters();
        }
    }, [showPrint]);

    useEffect(() => {
        const onKeyDown = (e) => { if (e.key === 'Escape') handleClose(); };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleClose]);

    const handlePrint = async () => {
        if (!pdfUrl || isPrinting) return;
        setIsPrinting(true);
        setPrintError(null);
        setPrintSuccess(null);
        try {
            await window.api.printSilent(pdfUrl, { printer: selectedPrinter, landscape, copies, pageSize });
            const msg = `Enviado a "${selectedPrinter || 'impresora predeterminada'}" — ${copies} ${copies === 1 ? 'copia' : 'copias'}`;
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
    };

    const handlePrintOS = async () => {
        if (!printUrl || isPrinting) return;
        setIsPrinting(true);
        try {
            await window.api.printComponent(printUrl, () => {});
            handleClose();
        } catch (err) {
            console.error('Error al imprimir con diálogo:', err);
            setError('No se pudo abrir el diálogo de impresión.', 'Error de impresión');
        } finally {
            setIsPrinting(false);
        }
    };

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

    const labelCls = "text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 block mb-1.5 ml-1";
    const inputCls = "w-full bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none focus:border-indigo-500 transition-all duration-200 shadow-none h-11 px-3.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 outline-none";
    const segmentWrap = "flex rounded-xl p-1 gap-1 border border-slate-200/80 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-900";
    const segmentBase = "flex-1 py-2 text-[11px] uppercase tracking-wider font-bold transition-all duration-200 focus:outline-none flex items-center justify-center gap-1.5 rounded-lg";
    const segmentActive = "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm border border-slate-200/80 dark:border-zinc-700";
    const segmentInactive = "text-slate-600 dark:text-zinc-400 font-medium hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/40 dark:hover:bg-zinc-800/40";

    return (
        <div className="fixed top-16 inset-x-0 bottom-0 z-[9990] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 p-3 sm:p-4 lg:p-6 select-none animate-in fade-in duration-200">
            <div className="w-full max-w-7xl h-full max-h-[calc(100vh-5.5rem)] rounded-[2rem] flex flex-col overflow-hidden shadow-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 my-auto">

                {/* Header */}
                <div className="flex items-center justify-between px-6 sm:px-8 py-4 shrink-0 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
                    <div className="flex items-center gap-3.5">
                        {showPrint ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setShowPrint(false)}
                                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-all flex items-center justify-center"
                                    title="Volver a vista previa"
                                    aria-label="Volver a vista previa"
                                >
                                    <HiArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
                                    <HiPrinter className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                                        Imprimir Documento
                                    </h2>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                                        Configuración de salida y hardware
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
                                    <HiDocumentText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                                        Vista Previa del Documento
                                    </h2>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">
                                        Visualizador PDF de Alta Definición
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5">
                        {!showPrint && (
                            <>
                                <Button
                                    variant="flat" 
                                    size="sm"
                                    onPress={handleSavePdf}
                                    className="font-bold text-slate-700 dark:text-zinc-200 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl h-10 px-4 text-xs transition-all"
                                    startContent={<HiDownload className="text-base" />}
                                >
                                    <span className="hidden sm:inline">Guardar PDF</span>
                                </Button>
                                <Button
                                    size="sm"
                                    onPress={() => setShowPrint(true)}
                                    isDisabled={!printUrl}
                                    startContent={<HiPrinter className="text-base" />}
                                    className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-5 text-xs shadow-sm shadow-indigo-500/20 transition-all"
                                >
                                    Imprimir
                                </Button>
                                <div className="w-px h-6 mx-1 bg-slate-200 dark:border-zinc-800" />
                            </>
                        )}
                        <button
                            type="button"
                            onClick={handleClose}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                            aria-label="Cerrar modal"
                            title="Cerrar"
                        >
                            <HiX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col sm:flex-row overflow-hidden bg-slate-50/50 dark:bg-black/20">

                    {/* Print options panel — only visible in print mode */}
                    {showPrint && (
                        <div className="w-full sm:w-80 shrink-0 flex flex-col border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                            <div className="p-6 sm:p-7 space-y-5 flex-1 overflow-y-auto">

                                {/* Impresora */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5 ml-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Impresora</span>
                                        <button
                                            type="button"
                                            onClick={loadPrinters}
                                            disabled={loadingPrinters}
                                            title="Actualizar lista de impresoras"
                                            className="p-1 rounded-md text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 transition-colors focus:outline-none"
                                        >
                                            <HiRefresh className={`w-3.5 h-3.5 ${loadingPrinters ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>

                                    {loadingPrinters ? (
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-zinc-500 h-11 px-3 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-900/60">
                                            <Spinner size="sm" color="default" /> Cargando impresoras...
                                        </div>
                                    ) : printers.length === 0 ? (
                                        <div className="text-xs font-bold text-rose-600 bg-rose-500/10 border border-rose-500/20 dark:text-rose-400 rounded-xl h-11 flex items-center px-3">
                                            No se encontraron impresoras.
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <select
                                                value={selectedPrinter}
                                                onChange={e => { setSelectedPrinter(e.target.value); setPrintSuccess(null); setPrintError(null); }}
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
                                                type="button"
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
                                            type="button"
                                            onClick={() => setLandscape(true)}
                                            className={`${segmentBase} ${landscape ? segmentActive : segmentInactive}`}
                                        >
                                            <IconHorizontal /> Horizontal
                                        </button>
                                        <button
                                            type="button"
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
                                            type="button"
                                            onClick={() => setCopies(c => Math.max(1, c - 1))}
                                            className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black transition-colors focus:outline-none bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 border border-slate-200/80 dark:border-zinc-700"
                                        >−</button>
                                        <input
                                            type="number" value={copies} readOnly
                                            className="w-16 h-11 text-center text-lg font-mono font-black tabular-nums bg-transparent border-none outline-none text-slate-800 dark:text-zinc-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setCopies(c => Math.min(99, c + 1))}
                                            className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black transition-colors focus:outline-none bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 border border-slate-200/80 dark:border-zinc-700"
                                        >+</button>
                                    </div>
                                </div>

                            </div>

                            {/* Footer del panel de opciones */}
                            <div className="p-6 pt-4 border-t border-slate-100 dark:border-zinc-800/80 space-y-3 bg-white dark:bg-zinc-950 shrink-0">
                                {printSuccess && (
                                    <div className="p-3 mb-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 leading-tight flex items-start gap-2">
                                        <span className="text-base leading-none mt-px">✓</span>
                                        <span>{printSuccess}</span>
                                    </div>
                                )}
                                {printError && (
                                    <div className="p-3 mb-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] font-bold text-rose-600 dark:text-rose-400 leading-tight">
                                        {printError}
                                    </div>
                                )}
                                <Button
                                    onPress={handlePrint}
                                    isLoading={isPrinting}
                                    isDisabled={isPrinting || !pdfUrl || printers.length === 0}
                                    startContent={!isPrinting && <HiPrinter className="text-lg" />}
                                    className="w-full font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 shadow-sm transition-all"
                                >
                                    {isPrinting ? 'Imprimiendo...' : 'Imprimir Ahora'}
                                </Button>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="flat"
                                        onPress={handlePrintOS}
                                        isDisabled={isPrinting || !printUrl}
                                        className="font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-xl h-10 text-xs transition-all"
                                    >
                                        Diálogo OS
                                    </Button>
                                    <Button
                                        variant="flat"
                                        onPress={handleSavePdf}
                                        startContent={<HiDownload className="text-sm opacity-70" />}
                                        className="font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-xl h-10 text-xs transition-all"
                                    >
                                        Guardar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PDF Viewer — siempre montado, nunca se desmonta al cambiar de modo */}
                    <div className="flex-1 overflow-hidden relative">
                        <PDFViewer
                            config={{
                                src: pdfUrl,
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
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalImprimir;
