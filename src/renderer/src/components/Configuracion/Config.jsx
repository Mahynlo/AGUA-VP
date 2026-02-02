

import ModoTema from "../temaApp/modoTema";
import {
    Card,
    CardBody,
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
import { HiMinus, HiPlus, HiRefresh, HiDesktopComputer, HiEye, HiInformationCircle, HiCog } from "react-icons/hi";

export function Config() {

    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [zoomLevel, setZoomLevel] = useState(100);
    const [appVersion, setAppVersion] = useState("...");

    // Cargar zoom inicial al abrir
    useEffect(() => {
        if (isOpen) {
            const fetchZoom = async () => {
                const level = await window.api.getZoomLevel();
                setZoomLevel(Math.round(level * 100));

                const version = await window.api.getAppVersion();
                setAppVersion(version);
            };
            fetchZoom();
        }
    }, [isOpen]);

    // Escuchar cambios globales (Keyboard Shortcuts)
    useEffect(() => {
        // Suscribirse a cambios
        if (window.api.onZoomLevelChanged) {
            window.api.onZoomLevelChanged((newLevel) => {
                setZoomLevel(Math.round(newLevel * 100));
            });
        }
    }, []);

    const handleZoomIn = async () => {
        const newLevel = await window.api.zoomIn();
        setZoomLevel(Math.round(newLevel * 100));
    };

    const handleZoomOut = async () => {
        const newLevel = await window.api.zoomOut();
        setZoomLevel(Math.round(newLevel * 100));
    };

    const handleReset = async () => {
        const newLevel = await window.api.zoomReset();
        setZoomLevel(Math.round(newLevel * 100));
    };

    return (
        <>
            <Tooltip content="Configuración" delay={2000} color="foreground">
                <Button onPress={onOpen} radius="full" variant="light" className="text-gray-200 dark:text-gray-400" isIconOnly >
                    <ConfiguracionIcon className="w-6 h-6" />
                </Button>
            </Tooltip>


            <Drawer
                isOpen={isOpen}
                backdrop="transparent"
                onOpenChange={onOpenChange}
                classNames={{
                    base: " top-[80px] rounded-medium",
                    closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
                }}
            >
                <DrawerContent>
                    {(onClose) => (
                        <>
                            <DrawerHeader className="flex flex-col gap-1 border-b border-gray-200 dark:border-zinc-800 px-6 py-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded-xl">
                                        <HiCog className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                                            Configuración
                                        </span>
                                        <span className="text-sm font-normal text-gray-500">
                                            Preferencias del sistema
                                        </span>
                                    </div>
                                </div>
                            </DrawerHeader>

                            <DrawerBody className="px-6 py-6 bg-gray-50/50 dark:bg-zinc-900/50 space-y-4">

                                {/* Tema de Aplicación */}
                                <Card className="bg-white dark:bg-zinc-800 border-none shadow-sm">
                                    <CardBody className="p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                                                    <HiDesktopComputer className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">Apariencia</p>
                                                    <p className="text-xs text-gray-500">Tema de la interfaz</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <ModoTema />
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* Tamaño de Interfaz (Zoom) */}
                                <Card className="bg-white dark:bg-zinc-800 border-none shadow-sm">
                                    <CardBody className="p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                                    <HiEye className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">Escala visual</p>
                                                    <p className="text-xs text-gray-500">Ajustar tamaño (Zoom)</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl p-3 border border-gray-100 dark:border-zinc-700/50">
                                            <div className="flex items-center justify-between">
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="flat"
                                                    onPress={handleZoomOut}
                                                    isDisabled={zoomLevel <= 50}
                                                    className="bg-white dark:bg-zinc-800 shadow-sm"
                                                >
                                                    <HiMinus />
                                                </Button>

                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold text-xl text-gray-800 dark:text-white">
                                                        {zoomLevel}%
                                                    </span>
                                                </div>

                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="flat"
                                                    onPress={handleZoomIn}
                                                    isDisabled={zoomLevel >= 300}
                                                    className="bg-white dark:bg-zinc-800 shadow-sm"
                                                >
                                                    <HiPlus />
                                                </Button>
                                            </div>

                                            <Divider className="my-3" />

                                            <Button
                                                size="sm"
                                                variant="light"
                                                color="primary"
                                                startContent={<HiRefresh />}
                                                onPress={handleReset}
                                                className="w-full"
                                            >
                                                Restablecer valor predeterminado
                                            </Button>
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* Info Aplicación */}
                                <Card className="bg-transparent border border-dashed border-gray-300 dark:border-zinc-700 shadow-none">
                                    <CardBody className="p-4">
                                        <div className="flex items-center gap-3">
                                            <HiInformationCircle className="w-5 h-5 text-gray-400" />
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Versión del Sistema</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm text-gray-700 dark:text-gray-300">v{appVersion}</span>
                                                    <Chip size="sm" color="success" variant="flat" className="h-5 text-xs">Stable</Chip>
                                                </div>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>

                            </DrawerBody>
                            <DrawerFooter className="border-t border-gray-200 dark:border-zinc-800 px-6 py-4">
                                <Button color="danger" variant="light" onPress={onClose} fullWidth>
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

