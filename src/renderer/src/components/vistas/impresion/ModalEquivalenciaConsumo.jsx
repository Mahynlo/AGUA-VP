import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Tabs,
    Tab,
    Spinner
} from "@nextui-org/react";
import { useState } from "react";
import { HiScale, HiBeaker, HiCollection, HiX, HiInformationCircle, HiCheckCircle } from "react-icons/hi";
import useEquivalenciaConsumo from "../../../hooks/useEquivalenciaConsumo";

// Componente de Input Personalizado (Premium UI - Token 4)
const CustomInput = ({ label, value, onChange, icon, type = "text", description, min, max, placeholder, suffix }) => {
    return (
        <div className="w-full flex flex-col gap-1.5">
            {label && (
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 ml-1">
                    {label}
                </label>
            )}
            <div className="relative w-full flex items-center">
                <span className="absolute left-4 text-slate-400 dark:text-zinc-500 flex items-center justify-center pointer-events-none">
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
                        w-full pl-11 ${suffix ? 'pr-12' : 'pr-4'} h-[52px] text-sm font-medium rounded-xl transition-all duration-200
                        bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100
                        border border-slate-200 dark:border-zinc-800
                        hover:border-slate-300 dark:hover:border-zinc-700
                        focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 focus:border-slate-400 dark:focus:border-zinc-500
                        placeholder-slate-400 dark:placeholder-zinc-500 shadow-none
                    `}
                />
                {suffix && (
                    <span className="absolute right-4 text-slate-400 dark:text-zinc-500 font-bold text-xs pointer-events-none">
                        {suffix}
                    </span>
                )}
            </div>
            {description && <p className="text-[10px] text-slate-400 dark:text-zinc-500 ml-1">{description}</p>}
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
            <Modal isOpen={isOpen} onOpenChange={onClose} size="md" placement="center" classNames={{ backdrop: "bg-slate-900/40 backdrop-blur-sm", base: "bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-2xl" }}>
                <ModalContent>
                    <ModalBody className="flex flex-col justify-center items-center h-48 py-8">
                        <Spinner size="lg" color="default" />
                        <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 animate-pulse">
                            Cargando equivalencias...
                        </p>
                    </ModalBody>
                </ModalContent>
            </Modal>
        );
    }

    if (error) {
        return (
            <Modal isOpen={isOpen} onOpenChange={onClose} size="md" placement="center" classNames={{ backdrop: "bg-slate-900/40 backdrop-blur-sm", base: "bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-2xl", header: "border-b border-slate-100 dark:border-zinc-800/50 pb-4 pt-6 px-8", footer: "border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8" }}>
                <ModalContent>
                    <ModalHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl"><HiX className="w-6 h-6" /></div>
                            <span className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">Error de Carga</span>
                        </div>
                    </ModalHeader>
                    <ModalBody className="px-8 py-6">
                        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl">
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onClose} className="font-bold text-slate-500 dark:text-zinc-400">Cerrar</Button>
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
            placement="center"
            scrollBehavior="inside"
            /* Token 2: Modal Premium SaaS */
            classNames={{
                backdrop: "bg-slate-900/40 backdrop-blur-sm",
                base: "bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-2xl",
                header: "border-b border-slate-100 dark:border-zinc-800/50 pb-4 pt-6 px-8",
                body: "px-0 py-0 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent",
                footer: "border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8",
                closeButton: "hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 text-slate-400 p-2 top-4 right-4"
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-4">
                                {/* Regla de Tintes */}
                                <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
                                    <HiScale className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    {/* Token 3: Textos principales */}
                                    <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                                        Equivalencias de Consumo
                                    </h2>
                                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                                        Configuración de mensajes para recibos
                                    </p>
                                </div>
                            </div>
                        </ModalHeader>

                        <ModalBody>
                            {/* Token 7: Pestañas de Navegación */}
                            <Tabs 
                                aria-label="Opciones de equivalencias" 
                                variant="underlined"
                                classNames={{
                                    base: "w-full px-8 pt-4",
                                    tabList: "gap-6 w-full relative rounded-none p-0 border-b border-slate-200 dark:border-zinc-800",
                                    cursor: "w-full bg-slate-800 dark:bg-zinc-200 h-[2px]",
                                    tab: "max-w-fit px-0 h-12",
                                    tabContent: "group-data-[selected=true]:text-slate-800 dark:group-data-[selected=true]:text-zinc-100 group-data-[selected=true]:font-bold text-slate-500 dark:text-zinc-400 font-medium text-sm transition-colors"
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
                                    <div className="px-8 py-6 flex flex-col gap-8">
                                        <div className="flex items-center gap-2">
                                            <HiInformationCircle className="w-5 h-5 text-slate-400 dark:text-zinc-500" />
                                            <h4 className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                                                Ingrese un valor para probar
                                            </h4>
                                        </div>
                                        
                                        <div className="flex flex-col md:flex-row items-start gap-4">
                                            <div className="flex-1 w-full">
                                                <CustomInput
                                                    type="number"
                                                    placeholder="Ej: 25"
                                                    value={consumoPrueba}
                                                    onChange={(e) => setConsumoPrueba(parseInt(e.target.value) || 0)}
                                                    icon={<HiBeaker className="w-5 h-5 text-slate-400" />}
                                                    suffix="m³"
                                                    min={0}
                                                    max={1000}
                                                />
                                            </div>
                                            <div className="w-full md:w-auto shrink-0 mt-0">
                                                {/* Token 4: Botón Primario */}
                                                <Button
                                                    onPress={handlePrueba}
                                                    startContent={<HiCheckCircle className="text-lg" />}
                                                    className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-8 shadow-sm h-[52px] w-full md:w-auto"
                                                >
                                                    Generar Mensaje
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Caja de Resultado con Regla de Tintes */}
                                        <div className={`p-6 rounded-2xl transition-all duration-300 min-h-[120px] flex items-center ${
                                            frasePrueba 
                                                ? "bg-emerald-500/10" 
                                                : "bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800"
                                        }`}>
                                            {frasePrueba ? (
                                                <div className="flex gap-4 items-start w-full">
                                                    <div className="p-2.5 bg-emerald-500/20 rounded-xl shrink-0">
                                                        <HiScale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                    <div className="flex flex-col gap-1.5 flex-1 pt-1">
                                                        <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest">
                                                            Resultado en Recibo
                                                        </p>
                                                        <p className="text-base font-semibold text-emerald-900 dark:text-emerald-100 italic leading-relaxed">
                                                            "{frasePrueba}"
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center w-full flex flex-col items-center">
                                                    <HiInformationCircle className="text-2xl text-slate-400 mb-2 opacity-50" />
                                                    <span className="text-sm font-medium text-slate-500">El mensaje generado aparecerá aquí</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Tab>

                                {/* TAB 2: Catálogo */}
                                <Tab
                                    key="frases"
                                    title={
                                        <div className="flex items-center gap-2">
                                            <HiCollection className="text-lg" />
                                            <span>Catálogo de Frases</span>
                                            <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 px-2 py-0.5 rounded-md text-[10px] font-bold ml-1">
                                                {frasesDisponibles.length}
                                            </span>
                                        </div>
                                    }
                                >
                                    {/* Token 4: Scrollbar limpio */}
                                    <div className="px-8 py-6 flex flex-col gap-3 max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                                        {frasesDisponibles.map((item, index) => (
                                            <div 
                                                key={index} 
                                                className="flex flex-col sm:flex-row sm:items-center gap-4 py-4 border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-colors px-2 rounded-lg"
                                            >
                                                {/* Rango y Categoría (Regla de Tintes) */}
                                                <div className="flex sm:flex-col gap-2 sm:w-36 shrink-0">
                                                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md w-fit whitespace-nowrap">
                                                        {item.rango_min} - {item.rango_max} m³
                                                    </span>
                                                    <span className="bg-slate-500/10 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md w-fit whitespace-nowrap">
                                                        {item.categoria}
                                                    </span>
                                                </div>
                                                
                                                {/* Divisor vertical solo en Desktop */}
                                                <div className="hidden sm:block w-px h-10 bg-slate-200 dark:bg-zinc-800"></div>
                                                
                                                {/* Frase */}
                                                <p className="text-sm font-medium text-slate-600 dark:text-zinc-300 leading-relaxed italic flex-1">
                                                    "{item.frase}"
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </Tab>
                            </Tabs>
                        </ModalBody>

                        <ModalFooter>
                            <Button
                                variant="light"
                                onPress={onClose}
                                className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6"
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
