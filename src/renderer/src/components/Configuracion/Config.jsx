import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import ModoTema from "../temaApp/modoTema";
import { ConfiguracionIcon } from "../../IconsApp/IconsAppSystem";
import { 
    HiMinus, 
    HiPlus, 
    HiRefresh, 
    HiDesktopComputer, 
    HiEye, 
    HiInformationCircle, 
    HiCog,
    HiCheckCircle,
    HiX
} from "react-icons/hi";

export function Config() {
    const [isOpen, setIsOpen] = useState(false);
    const onOpen = () => setIsOpen(true);
    const onClose = () => setIsOpen(false);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [appVersion, setAppVersion] = useState("...");

    // Cargar zoom inicial y versión al abrir el Drawer
    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                if (window.api?.getZoomLevel) {
                    try {
                        const level = await window.api.getZoomLevel();
                        setZoomLevel(Math.round(level * 100));
                    } catch (e) {
                        console.error("Error obteniendo nivel de zoom:", e);
                    }
                }
                if (window.api?.getAppVersion) {
                    try {
                        const version = await window.api.getAppVersion();
                        setAppVersion(version);
                    } catch (e) {
                        console.error("Error obteniendo versión de la app:", e);
                    }
                }
            };
            fetchData();
        }
    }, [isOpen]);

    // Cerrar con tecla Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    // Escuchar cambios globales de zoom (atajos de teclado / menú de Electron)
    useEffect(() => {
        if (!window.api?.onZoomLevelChanged) return;
        const unsubscribe = window.api.onZoomLevelChanged((newLevel) => {
            setZoomLevel(Math.round(newLevel * 100));
        });
        return () => {
            if (typeof unsubscribe === "function") unsubscribe();
        };
    }, []);

    const handleZoomIn = async () => {
        if (window.api?.zoomIn) {
            try {
                const newLevel = await window.api.zoomIn();
                setZoomLevel(Math.round(newLevel * 100));
            } catch (e) {
                console.error("Error aumentando zoom:", e);
            }
        }
    };

    const handleZoomOut = async () => {
        if (window.api?.zoomOut) {
            try {
                const newLevel = await window.api.zoomOut();
                setZoomLevel(Math.round(newLevel * 100));
            } catch (e) {
                console.error("Error reduciendo zoom:", e);
            }
        }
    };

    const handleReset = async () => {
        if (window.api?.zoomReset) {
            try {
                const newLevel = await window.api.zoomReset();
                setZoomLevel(Math.round(newLevel * 100));
            } catch (e) {
                console.error("Error restableciendo zoom:", e);
            }
        }
    };

    const getZoomStatusLabel = (level) => {
        if (level === 100) return "Predeterminado (100%)";
        if (level > 100) return `Aumentado (+${level - 100}%)`;
        return `Reducido (-${100 - level}%)`;
    };

    return (
        <>
            {/* Botón Disparador en el Navbar con estado activo */}
            <button 
                type="button"
                onClick={isOpen ? onClose : onOpen} 
                className={`w-9 h-9 min-w-9 rounded-full flex items-center justify-center cursor-pointer outline-none transition-all ${
                    isOpen 
                        ? "bg-white/25 text-white shadow-inner ring-2 ring-white/30 scale-95" 
                        : "text-white/90 hover:text-white hover:bg-white/10 active:scale-95"
                }`}
                title="Configuración y Preferencias"
                aria-label="Abrir Configuración"
            >
                <ConfiguracionIcon className="w-5 h-5" />
            </button>

            {/* Drawer renderizado estrictamente debajo del Navbar (h-16 / top-16) */}
            {isOpen && createPortal(
                <div className="fixed top-16 inset-x-0 bottom-0 z-[9990] overflow-hidden" style={{ WebkitAppRegion: "no-drag" }}>
                    {/* Backdrop Oscuro confinado bajo el navbar */}
                    <div 
                        className="fixed top-16 inset-x-0 bottom-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Contenedor del Drawer Deslizable desde la Derecha bajo el navbar */}
                    <aside 
                        role="dialog"
                        aria-modal="true"
                        aria-label="Panel de Configuración"
                        className="fixed top-16 right-0 bottom-0 w-full max-w-md bg-white dark:bg-zinc-950 border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col h-[calc(100vh-4rem)] z-[9995] animate-in slide-in-from-right duration-300 ease-out"
                    >
                        {/* ── HEADER ── */}
                        <header className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800/80 px-6 py-5 bg-white dark:bg-zinc-950 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0 flex items-center justify-center">
                                    <HiCog className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
                                        Configuración
                                    </h2>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
                                        Preferencias de usuario y entorno
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl p-2 transition-colors cursor-pointer"
                                aria-label="Cerrar panel de configuración"
                            >
                                <HiX className="w-5 h-5" />
                            </button>
                        </header>

                        {/* ── BODY CON SCROLL INDEPENDIENTE ── */}
                        <main className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50/50 dark:bg-black/20 space-y-5">
                            
                            {/* 1. APARIENCIA & TEMA */}
                            <section className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                                        <HiDesktopComputer className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                                            Apariencia
                                        </p>
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                                            Tema Visual
                                        </h3>
                                    </div>
                                </div>
                                
                                <div>
                                    <ModoTema />
                                </div>
                            </section>

                            {/* 2. ESCALA VISUAL (ZOOM) */}
                            <section className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                                            <HiEye className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                                                Escala de Pantalla
                                            </p>
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                                                Zoom de la Interfaz
                                            </h3>
                                        </div>
                                    </div>

                                    <span 
                                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                                            zoomLevel === 100 
                                                ? "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700" 
                                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40"
                                        }`}
                                    >
                                        {getZoomStatusLabel(zoomLevel)}
                                    </span>
                                </div>

                                <div className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-4 border border-slate-200/70 dark:border-zinc-800 space-y-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <button
                                            type="button"
                                            onClick={handleZoomOut}
                                            disabled={zoomLevel <= 50}
                                            className="w-11 h-11 min-w-11 flex items-center justify-center bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl text-slate-700 dark:text-zinc-200 font-bold hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer active:scale-95"
                                            aria-label="Reducir zoom"
                                            title="Reducir zoom"
                                        >
                                            <HiMinus className="w-5 h-5" />
                                        </button>

                                        <div className="flex flex-col items-center justify-center">
                                            <span className="font-mono font-black text-3xl text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
                                                {zoomLevel}%
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
                                                Rango 50% - 300%
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleZoomIn}
                                            disabled={zoomLevel >= 300}
                                            className="w-11 h-11 min-w-11 flex items-center justify-center bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl text-slate-700 dark:text-zinc-200 font-bold hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer active:scale-95"
                                            aria-label="Aumentar zoom"
                                            title="Aumentar zoom"
                                        >
                                            <HiPlus className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="h-px bg-slate-200/60 dark:bg-zinc-800 w-full" />

                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        disabled={zoomLevel === 100}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                                    >
                                        <HiRefresh className="w-4 h-4" />
                                        <span>Restablecer valor predeterminado (100%)</span>
                                    </button>
                                </div>
                            </section>

                            {/* 3. INFORMACIÓN DE VERSIÓN Y SISTEMA */}
                            <section className="bg-slate-100/70 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl shrink-0">
                                        <HiInformationCircle className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                                            Información del Sistema
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="font-mono font-bold text-sm text-slate-800 dark:text-zinc-200">
                                                v{appVersion}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                Estable
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 font-medium pl-1">
                                    <HiCheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>AguaVP Desktop • Sistema de Gestión de Agua Potable</span>
                                </div>
                            </section>

                        </main>

                        {/* ── FOOTER ── */}
                        <footer className="border-t border-slate-200 dark:border-zinc-800/80 px-6 py-4 bg-white dark:bg-zinc-950 shrink-0">
                            <button 
                                type="button"
                                onClick={onClose} 
                                className="w-full font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl h-11 text-sm transition-all flex items-center justify-center cursor-pointer active:scale-95"
                            >
                                Cerrar Configuración
                            </button>
                        </footer>
                    </aside>
                </div>,
                document.body
            )}
        </>
    );
}

export default Config;
