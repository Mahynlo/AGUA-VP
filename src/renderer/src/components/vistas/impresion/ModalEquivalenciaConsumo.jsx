import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Card,
    CardBody,
    Chip,
    Tabs,
    Tab,
    Spinner
} from "@nextui-org/react";
import { useState } from "react";
import { HiScale, HiBeaker, HiCollection, HiX, HiInformationCircle, HiCheckCircle } from "react-icons/hi";
import useEquivalenciaConsumo from "../../../hooks/useEquivalenciaConsumo";

// Componente de Input Personalizado (Premium UI)
const CustomInput = ({ label, value, onChange, icon, type = "text", color = "blue", description, min, max, placeholder, suffix }) => {
    const focusColors = {
        blue: "focus:ring-blue-500 focus:border-blue-500",
        green: "focus:ring-green-500 focus:border-green-500",
        emerald: "focus:ring-emerald-500 focus:border-emerald-500",
    };

    return (
        <div className="w-full">
            {label && (
                <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">
                    {label}
                </label>
            )}
            <div className="relative w-full flex items-center">
                <span className="absolute left-3 text-slate-400 dark:text-zinc-500 flex items-center justify-center">
                    {icon}
                </span>
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    min={min}
                    max={max}
                    className={`
                        w-full pl-10 ${suffix ? 'pr-12' : 'pr-4'} py-2.5 text-sm font-medium rounded-xl transition-all duration-200
                        bg-slate-50 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-100
                        border border-slate-200 dark:border-zinc-700
                        hover:bg-slate-100 dark:hover:bg-zinc-800
                        focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-zinc-900
                        placeholder-slate-400 dark:placeholder-zinc-500 shadow-sm
                        ${focusColors[color] || focusColors.blue}
                    `}
                />
                {suffix && (
                    <span className="absolute right-4 text-slate-400 dark:text-zinc-500 font-bold text-xs pointer-events-none">
                        {suffix}
                    </span>
                )}
            </div>
            {description && <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1.5 ml-1">{description}</p>}
        </div>
    );
};

const ModalEquivalenciaConsumo = ({ isOpen, onClose }) => {
    const { obtenerTodasLasFrases, probarEquivalencia, loading, error } = useEquivalenciaConsumo();
    const [consumoPrueba, setConsumoPrueba] = useState(25);
    const [frasePrueba, setFrasePrueba] = useState("");

    const frasesDisponibles = obtenerTodasLasFrases();

    const handlePrueba = () => {
        const frase = probarEquivalencia(consumoPrueba);
        setFrasePrueba(frase);
    };

    if (loading) {
        return (
            <Modal isOpen={isOpen} onOpenChange={onClose} size="md" backdrop="blur" classNames={{ base: "bg-white dark:bg-zinc-900" }}>
                <ModalContent>
                    <ModalBody className="flex flex-col justify-center items-center h-48 py-8">
                        <Spinner size="lg" color="success" />
                        <p className="mt-4 text-sm font-bold text-slate-500 dark:text-zinc-400 animate-pulse">Cargando equivalencias...</p>
                    </ModalBody>
                </ModalContent>
            </Modal>
        );
    }

    if (error) {
        return (
            <Modal isOpen={isOpen} onOpenChange={onClose} size="md" backdrop="blur" classNames={{ base: "bg-white dark:bg-zinc-900" }}>
                <ModalContent>
                    <ModalHeader className="pt-6 px-6">
                        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full"><HiX className="w-6 h-6" /></div>
                            <span className="text-lg font-bold">Error de Carga</span>
                        </div>
                    </ModalHeader>
                    <ModalBody className="px-6 pb-6">
                        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl">
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="flat" onPress={onClose} className="font-bold">Cerrar</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onClose}
            size="4xl"
            backdrop="blur"
            placement="center"
            scrollBehavior="inside"
            classNames={{
                base: "bg-white dark:bg-zinc-900 shadow-2xl",
                backdrop: "bg-zinc-900/50 backdrop-blur-sm",
                header: "border-b border-slate-100 dark:border-zinc-800",
                footer: "border-t border-slate-100 dark:border-zinc-800",
                closeButton: "hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 text-slate-400 dark:text-zinc-500 transition-colors z-50",
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 pt-6 px-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                                    <HiScale className="w-7 h-7" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                                        Equivalencias de Consumo
                                    </h2>
                                    <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-1">
                                        Configuración de mensajes para recibos
                                    </p>
                                </div>
                            </div>
                        </ModalHeader>

                        <ModalBody className="py-2 px-4 sm:px-6">
                            <Tabs 
                                aria-label="Opciones de equivalencias" 
                                color="success" 
                                variant="underlined"
                                classNames={{
                                    tabList: "gap-6 w-full relative rounded-none p-0 border-b border-slate-200 dark:border-zinc-800",
                                    cursor: "w-full bg-emerald-500",
                                    tab: "max-w-fit px-0 h-12",
                                    tabContent: "group-data-[selected=true]:text-emerald-600 dark:group-data-[selected=true]:text-emerald-400 font-bold"
                                }}
                            >
                                {/* TAB 1: Simulador */}
                                <Tab
                                    key="prueba"
                                    title={
                                        <div className="flex items-center gap-2">
                                            <HiBeaker className="text-lg" />
                                            <span>Simulador</span>
                                        </div>
                                    }
                                >
                                    <div className="py-4">
                                        <Card className="shadow-none border-none bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                                            <CardBody className="p-6">
                                                <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-5 uppercase tracking-wider flex items-center gap-2">
                                                    <HiInformationCircle className="w-4 h-4 text-blue-500" /> Ingrese un valor para probar
                                                </h4>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                                    <div className="md:col-span-8 lg:col-span-9">
                                                        <CustomInput
                                                            label="Consumo a probar"
                                                            type="number"
                                                            placeholder="Ej: 25"
                                                            value={consumoPrueba}
                                                            onChange={(e) => setConsumoPrueba(parseInt(e.target.value) || 0)}
                                                            icon={<HiBeaker className="w-5 h-5 text-emerald-500" />}
                                                            suffix="m³"
                                                            color="emerald"
                                                            min={0}
                                                            max={1000}
                                                            description="Ingrese los metros cúbicos para previsualizar el mensaje impreso."
                                                        />
                                                    </div>
                                                    <div className="md:col-span-4 lg:col-span-3 pb-[22px]">
                                                        <Button
                                                            color="success"
                                                            onPress={handlePrueba}
                                                            startContent={<HiCheckCircle className="text-lg" />}
                                                            className="w-full h-11 font-bold text-white shadow-md shadow-emerald-500/20"
                                                        >
                                                            Generar Mensaje
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className={`mt-6 p-5 rounded-xl border transition-all duration-300 min-h-[100px] flex items-center ${
                                                    frasePrueba 
                                                        ? "bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50" 
                                                        : "bg-white dark:bg-zinc-900 border-dashed border-slate-200 dark:border-zinc-700"
                                                }`}>
                                                    {frasePrueba ? (
                                                        <div className="flex gap-4 items-start w-full">
                                                            <div className="p-2 bg-emerald-100 dark:bg-emerald-800/50 rounded-full shrink-0">
                                                                <HiScale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                            </div>
                                                            <div className="space-y-1 flex-1">
                                                                <p className="text-[11px] font-bold text-emerald-700/60 dark:text-emerald-500/60 uppercase tracking-wider">
                                                                    Resultado en Recibo
                                                                </p>
                                                                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 italic leading-relaxed">
                                                                    "{frasePrueba}"
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center w-full flex flex-col items-center opacity-40">
                                                            <HiInformationCircle className="text-2xl text-slate-400 mb-2" />
                                                            <span className="text-sm font-medium text-slate-500">El mensaje generado aparecerá aquí</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </div>
                                </Tab>

                                {/* TAB 2: Catálogo */}
                                <Tab
                                    key="frases"
                                    title={
                                        <div className="flex items-center gap-2">
                                            <HiCollection className="text-lg" />
                                            <span>Catálogo de Frases</span>
                                            <Chip size="sm" color="default" variant="flat" className="ml-1 h-5 text-[10px] font-bold">
                                                {frasesDisponibles.length}
                                            </Chip>
                                        </div>
                                    }
                                >
                                    <div className="py-4">
                                        <Card className="shadow-none border-none bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                                            <CardBody className="p-4 sm:p-6">
                                                <div className="grid grid-cols-1 gap-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {frasesDisponibles.map((item, index) => (
                                                        <div 
                                                            key={index} 
                                                            className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 hover:border-emerald-300 dark:hover:border-emerald-700/50 transition-colors shadow-sm"
                                                        >
                                                            {/* Rango y Categoría */}
                                                            <div className="flex sm:flex-col gap-2 sm:w-32 shrink-0">
                                                                <Chip size="sm" color="success" variant="flat" className="font-mono font-bold w-fit">
                                                                    {item.rango_min} - {item.rango_max} m³
                                                                </Chip>
                                                                <Chip size="sm" color="default" variant="flat" className="text-[10px] font-bold uppercase tracking-wider w-fit">
                                                                    {item.categoria}
                                                                </Chip>
                                                            </div>
                                                            
                                                            {/* Divisor vertical solo en Desktop */}
                                                            <div className="hidden sm:block w-px h-10 bg-slate-100 dark:bg-zinc-800"></div>
                                                            
                                                            {/* Frase */}
                                                            <p className="text-sm font-medium text-slate-600 dark:text-zinc-300 leading-relaxed italic flex-1">
                                                                "{item.frase}"
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </div>
                                </Tab>
                            </Tabs>
                        </ModalBody>

                        <ModalFooter className="px-6 py-4">
                            <Button
                                variant="light"
                                color="default"
                                onPress={onClose}
                                className="font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                            >
                                Cerrar Panel
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default ModalEquivalenciaConsumo;