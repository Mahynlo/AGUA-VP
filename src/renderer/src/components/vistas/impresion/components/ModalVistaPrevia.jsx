
import React, { useState, useEffect } from 'react';
import { HiX, HiPrinter, HiRefresh } from 'react-icons/hi';

// Icono de página horizontal
const IconLandscape = () => (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="26" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
        <line x1="5" y1="6" x2="23" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="5" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="5" y1="14" x2="16" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

// Icono de página vertical
const IconPortrait = () => (
    <svg width="20" height="28" viewBox="0 0 20 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="18" height="26" rx="2" stroke="currentColor" strokeWidth="2"/>
        <line x1="4" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4" y1="16" x2="11" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

const PAGE_SIZES = [
    { value: 'Letter', label: 'Carta', sub: '21.6 × 27.9 cm' },
    { value: 'Legal',  label: 'Oficio', sub: '21.6 × 35.6 cm' },
    { value: 'A4',     label: 'A4',    sub: '21.0 × 29.7 cm' },
];

const ModalVistaPrevia = ({ pdfUrl, printUrl, onClose }) => {
    const [printers, setPrinters]             = useState([]);
    const [selectedPrinter, setSelectedPrinter] = useState('');
    const [landscape, setLandscape]           = useState(true);
    const [pageSize, setPageSize]             = useState('Letter');
    const [copies, setCopies]                 = useState(1);
    const [isPrinting, setIsPrinting]         = useState(false);
    const [loadingPrinters, setLoadingPrinters] = useState(true);

    // Cargar impresoras del sistema al abrir
    useEffect(() => {
        if (!pdfUrl) return;
        setLoadingPrinters(true);
        window.api.getPrinters()
            .then(list => {
                const sorted = (list || []).sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
                setPrinters(sorted);
                const def = sorted.find(p => p.isDefault);
                setSelectedPrinter(def?.name || sorted[0]?.name || '');
            })
            .catch(err => { console.error('Error cargando impresoras:', err); setPrinters([]); })
            .finally(() => setLoadingPrinters(false));
    }, [pdfUrl]);

    const handlePrint = async () => {
        if (!printUrl || isPrinting) return;
        setIsPrinting(true);
        try {
            await window.api.printSilent(printUrl, {
                printer: selectedPrinter,
                landscape,
                copies,
                pageSize
            });
            onClose();
        } catch (err) {
            console.error('Error al imprimir:', err);
            alert('Error al imprimir: ' + err);
        } finally {
            setIsPrinting(false);
        }
    };

    if (!pdfUrl) return null;

    const canPrint = !isPrinting && !!printUrl && printers.length > 0 && !loadingPrinters;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">

                {/* ── Header ───────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg text-white">
                            <HiPrinter size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-800 leading-tight">Imprimir</h2>
                            <p className="text-xs text-gray-500">Configure las opciones antes de imprimir</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-red-500"
                    >
                        <HiX size={18} />
                    </button>
                </div>

                {/* ── Body ─────────────────────────────────────────── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Columna izquierda: visor del PDF */}
                    <div className="flex-1 bg-gray-300 overflow-hidden">
                        <iframe
                            src={pdfUrl}
                            className="w-full h-full border-none"
                            title="Vista Previa de Impresión"
                        />
                    </div>

                    {/* Columna derecha: panel de configuración */}
                    <div className="w-72 bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-5 space-y-5">

                            {/* ── Impresora ── */}
                            <section>
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Impresora
                                </p>
                                {loadingPrinters ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-400 py-1">
                                        <HiRefresh className="animate-spin w-4 h-4 shrink-0" />
                                        <span>Buscando impresoras…</span>
                                    </div>
                                ) : printers.length === 0 ? (
                                    <p className="text-sm text-red-500">No se encontraron impresoras</p>
                                ) : (
                                    <select
                                        value={selectedPrinter}
                                        onChange={e => setSelectedPrinter(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        {printers.map(p => (
                                            <option key={p.name} value={p.name}>
                                                {p.name}{p.isDefault ? '  ✓' : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </section>

                            {/* ── Orientación ── */}
                            <section>
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Orientación
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Horizontal', value: true,  Icon: IconLandscape },
                                        { label: 'Vertical',   value: false, Icon: IconPortrait  },
                                    ].map(({ label, value, Icon }) => (
                                        <button
                                            key={label}
                                            onClick={() => setLandscape(value)}
                                            className={`flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-all ${
                                                landscape === value
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <Icon />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* ── Tamaño de papel ── */}
                            <section>
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Tamaño de papel
                                </p>
                                <div className="space-y-1">
                                    {PAGE_SIZES.map(({ value, label, sub }) => (
                                        <button
                                            key={value}
                                            onClick={() => setPageSize(value)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                                                pageSize === value
                                                    ? 'bg-blue-50 text-blue-700'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {/* Radio visual */}
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                pageSize === value ? 'border-blue-500' : 'border-gray-300'
                                            }`}>
                                                {pageSize === value && (
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <span className="font-medium">{label}</span>
                                                <span className="text-[11px] text-gray-400 ml-1">({sub})</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* ── Copias ── */}
                            <section>
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Copias
                                </p>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setCopies(c => Math.max(1, c - 1))}
                                        disabled={copies <= 1}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-lg transition-colors"
                                    >−</button>
                                    <span className="text-xl font-bold text-gray-800 w-8 text-center tabular-nums">
                                        {copies}
                                    </span>
                                    <button
                                        onClick={() => setCopies(c => Math.min(99, c + 1))}
                                        disabled={copies >= 99}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-lg transition-colors"
                                    >+</button>
                                </div>
                            </section>

                        </div>

                        {/* ── Botones de acción ── */}
                        <div className="p-4 border-t border-gray-100 space-y-2 shrink-0">
                            <button
                                onClick={handlePrint}
                                disabled={!canPrint}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                                    canPrint
                                        ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-md shadow-blue-200'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {isPrinting ? (
                                    <>
                                        <HiRefresh className="animate-spin w-4 h-4" />
                                        Imprimiendo…
                                    </>
                                ) : (
                                    <>
                                        <HiPrinter className="w-4 h-4" />
                                        Imprimir
                                    </>
                                )}
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full px-4 py-2 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalVistaPrevia;
