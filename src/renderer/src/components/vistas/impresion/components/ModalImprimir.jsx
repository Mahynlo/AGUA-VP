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
    const inputCls = "w-full bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 transition-all duration-200 shadow-none h-11 px-3 text-sm font-medium text-slate-800 dark:text-zinc-100 outline-none";
    const segmentWrap = "flex rounded-xl p-1 gap-1 border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/80";
    const segmentBase = "flex-1 py-2 text-[11px] uppercase tracking-wider font-bold transition-all duration-200 focus:outline-none flex items-center justify-center gap-1.5 rounded-lg";
    const segmentActive = "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/30";
    const segmentInactive = "text-slate-500 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 hover:text-slate-700 dark:hover:text-zinc-200";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-7xl h-full max-h-[90vh] rounded-[2rem] flex flex-col overflow-hidden shadow-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">

                {/* Header */}
                <div className="flex items-center justify-between px-8 pt-6 pb-4 shrink-0 border-b border-slate-100 dark:border-zinc-800/50">
                    <div className="flex items-center gap-4">
                        {showPrint ? (
                            <>
                                <Button
                                    isIconOnly variant="flat" size="sm" onPress={() => setShowPrint(false)}
                                    className="bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 rounded-lg h-9 w-9 shrink-0"
                                    title="Volver a vista previa"
                                >
                                    <HiArrowLeft className="w-4 h-4" />
                                </Button>
                                <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                                    <HiPrinter className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                                    Imprimir Documento
                                </h2>
                            </>
                        ) : (
                            <>
                                <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                                    <HiDocumentText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                                        Vista Previa del Documento
                                    </h2>
                                    <p className="text-xs font-medium uppercase tracking-wider mt-0.5 text-slate-500 dark:text-zinc-400">
                                        Documento listo
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {!showPrint && (
                            <>
                                <Button
                                    variant="flat" size="sm"
                                    onPress={handleSavePdf}
                                    className="font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                                    startContent={<HiDownload className="text-lg" />}
                                >
                                    <span className="hidden sm:inline">Guardar PDF</span>
                                </Button>
                                <Button
                                    color="primary" size="sm"
                                    onPress={() => setShowPrint(true)}
                                    isDisabled={!printUrl}
                                    startContent={<HiPrinter className="text-lg" />}
                                    className="font-bold shadow-md shadow-blue-500/20"
                                >
                                    Imprimir
                                </Button>
                                <div className="w-px h-6 mx-1 bg-slate-200 dark:bg-zinc-700" />
                            </>
                        )}
                        <Button
                            isIconOnly variant="light" size="md" onPress={handleClose}
                            className="hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 text-slate-400 rounded-xl"
                        >
                            <HiX className="text-xl" />
                        </Button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col sm:flex-row overflow-hidden bg-slate-50/30 dark:bg-black/10">

                    {/* Print options panel — only visible in print mode */}
                    {showPrint && (
                        <div className="w-full sm:w-80 shrink-0 flex flex-col border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-950">
                            <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">

                                {/* Impresora */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5 ml-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Impresora</span>
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
                                        >−</button>
                                        <input
                                            type="number" value={copies} readOnly
                                            className="w-16 h-10 text-center text-base font-black tabular-nums bg-transparent border-none outline-none text-slate-800 dark:text-zinc-100"
                                        />
                                        <button
                                            onClick={() => setCopies(c => Math.min(99, c + 1))}
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black transition-colors focus:outline-none bg-slate-100/70 text-slate-600 hover:bg-slate-200 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                        >+</button>
                                    </div>
                                </div>

                            </div>

                            {/* Footer del panel de opciones */}
                            <div className="p-6 pt-4 border-t border-slate-100 dark:border-zinc-800/50 space-y-3 bg-white dark:bg-zinc-950 shrink-0">
                                {printSuccess && (
                                    <div className="p-3 mb-2 rounded-xl bg-green-500/10 border border-green-500/20 text-[11px] font-bold text-green-700 dark:text-green-400 leading-tight flex items-start gap-2">
                                        <span className="text-base leading-none mt-px">✓</span>
                                        <span>{printSuccess}</span>
                                    </div>
                                )}
                                {printError && (
                                    <div className="p-3 mb-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] font-bold text-red-600 dark:text-red-400 leading-tight">
                                        {printError}
                                    </div>
                                )}
                                <Button
                                    onPress={handlePrint}
                                    isLoading={isPrinting}
                                    isDisabled={isPrinting || !pdfUrl || printers.length === 0}
                                    startContent={!isPrinting && <HiPrinter className="text-lg" />}
                                    className="w-full font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl h-[52px] shadow-sm"
                                >
                                    {isPrinting ? 'Imprimiendo...' : 'Imprimir Ahora'}
                                </Button>
                                <div className="grid grid-cols-2 gap-3">
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
