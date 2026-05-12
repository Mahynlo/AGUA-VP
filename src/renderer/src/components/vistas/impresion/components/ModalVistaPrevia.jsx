import React, { useState, useEffect, useMemo } from 'react';
import { HiX, HiPrinter, HiDownload, HiDocumentText } from 'react-icons/hi';
import { Button } from '@nextui-org/react';

// ── embedpdf viewer ─────────────────────────────────────────
import { PDFViewer } from '@embedpdf/react-pdf-viewer';

// Tema de la app
import { useTheme } from '@renderer/theme/useTheme';

const ModalVistaPrevia = ({ pdfUrl, printUrl, onClose, onImprimir }) => {
    const { theme } = useTheme();

    // Resolver tema efectivo (system → light/dark)
    const effectiveTheme = useMemo(() => {
        if (theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return theme;
    }, [theme]);

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
                            <p className={`text-xs font-medium uppercase tracking-wider mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                                Documento listo
                            </p>
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
    );
};

export default ModalVistaPrevia;