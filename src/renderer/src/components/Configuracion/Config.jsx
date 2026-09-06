

import ModoTema from "../temaApp/modoTema";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    Button,
    useDisclosure,
    Tooltip,
    Chip,
    Divider
} from "@nextui-org/react";
import { ConfiguracionIcon } from "../../IconsApp/IconsAppSystem";
import { useState, useEffect } from "react";
import { 
    HiMinus, 
    HiPlus, 
    HiRefresh, 
    HiDesktopComputer, 
    HiEye, 
    HiInformationCircle, 
    HiCog,
    HiCheckCircle
} from "react-icons/hi";

export function Config() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [zoomLevel, setZoomLevel] = useState(100);
    const [appVersion, setAppVersion] = useState("...");

    // Cargar zoom inicial al abrir
    useEffect(() => {
        if (isOpen) {
            const fetchZoom = async () => {
                if (window.api?.getZoomLevel) {
                    const level = await window.api.getZoomLevel();
                    setZoomLevel(Math.round(level * 100));
                }
                if (window.api?.getAppVersion) {
                    const version = await window.api.getAppVersion();
                    setAppVersion(version);
                }
            };
            fetchZoom();
        }
    }, [isOpen]);

    // Escuchar cambios globales (atajos de teclado / menú)
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
            const newLevel = await window.api.zoomIn();
            setZoomLevel(Math.round(newLevel * 100));
        }
    };

    const handleZoomOut = async () => {
        if (window.api?.zoomOut) {
            const newLevel = await window.api.zoomOut();
            setZoomLevel(Math.round(newLevel * 100));
        }
    };

    const handleReset = async () => {
        if (window.api?.zoomReset) {
            const newLevel = await window.api.zoomReset();
            setZoomLevel(Math.round(newLevel * 100));
        }
    };

    const getZoomStatusLabel = (level) => {
        if (level === 100) return "Predeterminado (100%)";
        if (level > 100) return `Aumentado (+${level - 100}%)`;
        return `Reducido (-${100 - level}%)`;
    };

    return (
        <>
            <Tooltip content="Configuración y Preferencias" delay={600} color="foreground" className="text-xs font-semibold">
                <Button 
                    onPress={onOpen} 
                    radius="full" 
                    variant="light" 
                    className="text-white/90 hover:text-white hover:bg-white/10 active:scale-95 transition-all w-9 h-9 min-w-9" 
                    isIconOnly
                    aria-label="Abrir Configuración"
                >
                    <ConfiguracionIcon className="w-5 h-5" />
                </Button>
            </Tooltip>

            <Drawer
                isOpen={isOpen}
                backdrop="opaque"
                onOpenChange={onOpenChange}
                placement="right"
                classNames={{
                    backdrop: "bg-slate-900/60 dark:bg-black/80 backdrop-blur-none",
                    base: "bg-white dark:bg-zinc-950 border-l border-slate-200 dark:border-zinc-800 shadow-2xl max-w-md w-full",
                    closeButton: "top-5 right-5 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl p-2 transition-colors",
                }}
            >
                <DrawerContent>
                    {(onClose) => (
                        <>
                            {/* ── HEADER ── */}
                            <DrawerHeader className="flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800/80 px-6 py-5 bg-white dark:bg-zinc-950">
                                <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                                    <HiCog className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
                                        Configuración
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
                                        Preferencias de usuario y entorno
                                    </span>
                                </div>
                            </DrawerHeader>

                            {/* ── BODY ── */}
                            <DrawerBody className="px-6 py-6 bg-slate-50/50 dark:bg-black/20 space-y-5 overflow-y-auto">

                                {/* 1. APARIENCIA & TEMA */}
                                <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                                            <HiDesktopComputer className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                                                Apariencia
                                            </p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                                                Tema Visual
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <ModoTema />
                                    </div>
                                </div>

                                {/* 2. ESCALA VISUAL (ZOOM) */}
                                <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                                                <HiEye className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                                                    Escala de Pantalla
                                                </p>
                                                <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                                                    Zoom de la Interfaz
                                                </p>
                                            </div>
                                        </div>

                                        <Chip 
                                            size="sm" 
                                            variant="flat" 
                                            className={`text-[10px] font-bold uppercase tracking-wider h-6 border ${
                                                zoomLevel === 100 
                                                    ? "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700" 
                                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40"
                                            }`}
                                        >
                                            {getZoomStatusLabel(zoomLevel)}
                                        </Chip>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-4 border border-slate-200/70 dark:border-zinc-800 space-y-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <Button
                                                isIconOnly
                                                size="md"
                                                variant="flat"
                                                onPress={handleZoomOut}
                                                isDisabled={zoomLevel <= 50}
                                                className="w-11 h-11 min-w-11 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl text-slate-700 dark:text-zinc-200 font-bold hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all"
                                                aria-label="Reducir zoom"
                                            >
                                                <HiMinus className="w-5 h-5" />
                                            </Button>

                                            <div className="flex flex-col items-center justify-center">
                                                <span className="font-mono font-black text-3xl text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
                                                    {zoomLevel}%
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
                                                    Rango 50% - 300%
                                                </span>
                                            </div>

                                            <Button
                                                isIconOnly
                                                size="md"
                                                variant="flat"
                                                onPress={handleZoomIn}
                                                isDisabled={zoomLevel >= 300}
                                                className="w-11 h-11 min-w-11 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl text-slate-700 dark:text-zinc-200 font-bold hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all"
                                                aria-label="Aumentar zoom"
                                            >
                                                <HiPlus className="w-5 h-5" />
                                            </Button>
                                        </div>

                                        <Divider className="bg-slate-200/60 dark:bg-zinc-800" />

                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            disabled={zoomLevel === 100}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none transition-all"
                                        >
                                            <HiRefresh className="w-4 h-4" />
                                            <span>Restablecer valor predeterminado (100%)</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 3. INFORMACIÓN DE VERSIÓN Y SISTEMA */}
                                <div className="bg-slate-100/70 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-4 space-y-3">
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
                                                <Chip 
                                                    size="sm" 
                                                    variant="flat" 
                                                    className="h-5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                                >
                                                    Estable
                                                </Chip>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 font-medium pl-1">
                                        <HiCheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span>AguaVP Desktop • Sistema de Gestión de Agua Potable</span>
                                    </div>
                                </div>

                            </DrawerBody>

                            {/* ── FOOTER ── */}
                            <DrawerFooter className="border-t border-slate-200 dark:border-zinc-800/80 px-6 py-4 bg-white dark:bg-zinc-950">
                                <Button 
                                    onPress={onClose} 
                                    fullWidth
                                    className="font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl h-11 text-sm transition-all"
                                >
                                    Cerrar Configuración
                                </Button>
                            </DrawerFooter>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        </>
    );
}

