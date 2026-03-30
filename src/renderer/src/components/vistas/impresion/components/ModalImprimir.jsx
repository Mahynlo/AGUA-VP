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
            // result.canceled → el usuario cerró el diálogo, no se muestra nada
        } catch (err) {
            console.error('Error al guardar PDF:', err);
            setError('No se pudo guardar el archivo PDF.', 'Guardar PDF');
        }
    };

    if (!pdfUrl) return null;

    const isDark = effectiveTheme === 'dark';

    // ── Estilos reutilizados ─────────────────────────────────
    const segmentActive = 'bg-blue-500 text-white';
    const segmentInactive = isDark
        ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
        : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700';
    const segmentBase = 'flex-1 py-1.5 text-xs font-bold transition-colors focus:outline-none';

    const labelCls = `text-xs font-bold uppercase tracking-wider block mb-2 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`;
    const segmentWrap = `flex rounded-xl overflow-hidden border ${isDark ? 'border-zinc-700' : 'border-slate-200'}`;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-900/70 dark:bg-black/85 p-4 sm:p-6 lg:p-8">
            <div className={`w-full max-w-7xl h-full max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl ring-1 ring-white/10 ${
                isDark ? 'bg-zinc-900' : 'bg-slate-50'
            }`}>

                {/* ── Header ───────────────────────────────── */}
                <div className={`flex items-center justify-between px-4 py-3 shrink-0 border-b ${
                    isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                    <div className="flex items-center gap-2">
                        {onVolver && (
                            <Button
                                isIconOnly variant="light" size="sm" onPress={onVolver}
                                className="text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                title="Volver a vista previa"
                            >
                                <HiArrowLeft className="w-5 h-5" />
                            </Button>
                        )}
                        <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                            <HiPrinter className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className={`text-base font-bold leading-tight ${isDark ? 'text-zinc-100' : 'text-slate-800'}`}>
                                Imprimir Documento
                            </h2>
                            {numPages > 0 && (
                                <p className={`text-xs font-medium uppercase tracking-wider mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                                    {numPages} {numPages === 1 ? 'Página' : 'Páginas'}
                                </p>
                            )}
                        </div>
                    </div>

                    <Button
                        isIconOnly variant="light" color="danger" size="sm" onPress={onClose}
                        className="hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <HiX className="text-lg" />
                    </Button>
                </div>

                {/* ── Body: panel + visor ───────────────────── */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Panel de opciones (izquierda) */}
                    <div className={`w-72 shrink-0 flex flex-col border-r ${
                        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                    }`}>
                        <div className="p-5 space-y-5 flex-1 overflow-y-auto">

                            {/* Impresora */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={labelCls} style={{ marginBottom: 0 }}>Impresora</span>
                                    <button
                                        onClick={loadPrinters}
                                        disabled={loadingPrinters}
                                        title="Actualizar lista de impresoras"
                                        className={`p-1 rounded-md transition-colors focus:outline-none ${
                                            isDark
                                                ? 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700'
                                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <HiRefresh className={`w-3.5 h-3.5 ${loadingPrinters ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                {loadingPrinters ? (
                                    <div className={`flex items-center gap-2 text-xs py-2 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                                        <Spinner size="sm" color="default" /> Cargando impresoras...
                                    </div>
                                ) : printers.length === 0 ? (
                                    <p className="text-xs text-red-500 dark:text-red-400 py-1">
                                        No se encontraron impresoras instaladas.
                                    </p>
                                ) : (
                                    <select
                                        value={selectedPrinter}
                                        onChange={e => setSelectedPrinter(e.target.value)}
                                        className={`w-full rounded-xl px-3 py-2 text-sm font-medium border outline-none cursor-pointer transition-colors ${
                                            isDark
                                                ? 'bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-blue-500'
                                                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                                        }`}
                                    >
                                        {printers.map(p => (
                                            <option key={p.name} value={p.name}>
                                                {p.displayName || p.name}{p.isDefault ? ' ★' : ''}
                                            </option>
                                        ))}
                                    </select>
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
                                        className={`${segmentBase} flex items-center justify-center gap-1.5 py-2 ${landscape ? segmentActive : segmentInactive}`}
                                    >
                                        <IconHorizontal /> Horizontal
                                    </button>
                                    <button
                                        onClick={() => setLandscape(false)}
                                        className={`${segmentBase} flex items-center justify-center gap-1.5 py-2 ${!landscape ? segmentActive : segmentInactive}`}
                                    >
                                        <IconVertical /> Vertical
                                    </button>
                                </div>
                            </div>

                            {/* Copias */}
                            <div>
                                <span className={labelCls}>Copias</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setCopies(c => Math.max(1, c - 1))}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold transition-colors focus:outline-none ${
                                            isDark
                                                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:bg-zinc-600'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
                                        }`}
                                    >
                                        −
                                    </button>
                                    <span className={`w-10 text-center text-sm font-bold tabular-nums ${isDark ? 'text-zinc-100' : 'text-slate-800'}`}>
                                        {copies}
                                    </span>
                                    <button
                                        onClick={() => setCopies(c => Math.min(99, c + 1))}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold transition-colors focus:outline-none ${
                                            isDark
                                                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:bg-zinc-600'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
                                        }`}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className={`p-4 space-y-2 border-t shrink-0 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                            {printError && (
                                <p className="text-xs text-red-500 dark:text-red-400 pb-1">{printError}</p>
                            )}

                            {/* Imprimir directo (sin diálogo) */}
                            <Button
                                color="primary"
                                className="w-full font-bold shadow-md shadow-blue-500/20"
                                onPress={handlePrint}
                                isLoading={isPrinting}
                                isDisabled={isPrinting || !printUrl || printers.length === 0}
                                startContent={!isPrinting && <HiPrinter className="text-lg" />}
                            >
                                {isPrinting ? 'Imprimiendo...' : 'Imprimir'}
                            </Button>

                            {/* Diálogo del sistema operativo */}
                            <Button
                                variant="flat"
                                size="sm"
                                className={`w-full font-bold ${
                                    isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                onPress={handlePrintOS}
                                isDisabled={isPrinting || !printUrl}
                                startContent={<HiPrinter className="text-sm opacity-60" />}
                            >
                                Diálogo del sistema
                            </Button>

                            {/* Guardar PDF */}
                            <Button
                                variant="flat"
                                size="sm"
                                className={`w-full font-bold ${
                                    isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                onPress={handleSavePdf}
                                startContent={<HiDownload className="text-sm" />}
                            >
                                Guardar PDF
                            </Button>
                        </div>
                    </div>

                    {/* Visor PDF (derecha) */}
                    <div className={`flex-1 overflow-hidden ${isDark ? 'bg-zinc-950' : 'bg-slate-100'}`}>
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

            {/* Ajuste visual del visor para que haga match con el tema de la app */}
            <style>{`
                .rpv-open__input-wrapper { display: none !important; }
                .rpv-core__viewer--dark {
                    --rpv-core__theme-bg-body: #09090b !important;
                    --rpv-core__theme-bg-toolbar: #18181b !important;
                    --rpv-core__theme-border-color: #27272a !important;
                }
                .rpv-core__viewer--light {
                    --rpv-core__theme-bg-body: #f8fafc !important;
                    --rpv-core__theme-bg-toolbar: #ffffff !important;
                    --rpv-core__theme-border-color: #e2e8f0 !important;
                }
            `}</style>
        </div>
    );
};

export default ModalImprimir;
