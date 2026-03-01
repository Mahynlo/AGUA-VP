import React, { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@nextui-org/react";
import { HiCog, HiSave, HiBan, HiExclamation, HiCalendar } from "react-icons/hi";

// Componente de Input Personalizado (FUERA del componente principal para evitar recreación)
const CustomInput = ({ label, value, onChange, icon, type = "text", color = "blue", description }) => (
    <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            {label}
        </label>
        <div className="relative w-full flex">
            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2 pr-2">
                {icon}
            </span>
            <input
                type={type}
                value={value}
                onChange={onChange}
                className={`border border-gray-300 focus:ring-${color}-600 focus:border-${color}-500 text-gray-600 rounded-xl pl-12 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all`}
            />
        </div>
        {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
    </div>
);

const ModalConfiguracionCortes = ({ isOpen, onClose }) => {
    const token = localStorage.getItem('token');
    const [config, setConfig] = useState({
        facturas_para_primer_aviso: 1,
        facturas_para_segundo_aviso: 2,
        facturas_para_tercer_aviso: 3,
        facturas_para_corte: 4,
        dias_gracia: 0,
        dias_vencimiento_factura: 30
    });
    const [loading, setLoading] = useState(false);

    // Cargar configuración al abrir
    useEffect(() => {
        if (isOpen && token) {
            setLoading(true);
            window.api.deudores.fetchConfiguracion(token)
                .then(res => setConfig(res))
                .catch(err => console.error("Error cargando config:", err))
                .finally(() => setLoading(false));
        }
    }, [isOpen, token]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await window.api.deudores.updateConfiguracion(token, config);
            onClose();
        } catch (error) {
            console.error("Error guardando config:", error);
            alert("Error al guardar la configuración");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            backdrop="blur"
            classNames={{
                backdrop: "bg-black/60 backdrop-blur-sm",
                base: "bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800",
                closeButton: "hover:bg-gray-100 dark:hover:bg-zinc-800",
            }}
        >
            <ModalContent>
                <ModalHeader className="flex gap-3 items-center border-b border-gray-100 dark:border-gray-800 pb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <HiCog className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Configuración de Reglas</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                            Define los umbrales para cortes y avisos
                        </p>
                    </div>
                </ModalHeader>
                <ModalBody className="py-6 space-y-6">

                    <div className="space-y-4">
                        <CustomInput
                            label="Facturas para Primer Aviso"
                            type="number"
                            value={config.facturas_para_primer_aviso}
                            onChange={(e) => setConfig({ ...config, facturas_para_primer_aviso: Number(e.target.value) })}
                            icon={<HiCog className="w-5 h-5 text-blue-600" />}
                            description="Cantidad de facturas para enviar el primer aviso"
                        />

                        <CustomInput
                            label="Facturas para Corte de Servicio"
                            type="number"
                            value={config.facturas_para_corte}
                            onChange={(e) => setConfig({ ...config, facturas_para_corte: Number(e.target.value) })}
                            icon={<HiBan className="w-5 h-5 text-red-600" />}
                            color="red"
                            description="Cantidad de facturas vencidas para generar orden de corte"
                        />

                        <CustomInput
                            label="Días de Vencimiento de Factura"
                            type="number"
                            value={config.dias_vencimiento_factura}
                            onChange={(e) => setConfig({ ...config, dias_vencimiento_factura: Number(e.target.value) })}
                            icon={<HiCalendar className="w-5 h-5 text-amber-600" />}
                            color="amber"
                            description="Días desde la emisión hasta que una factura se considera vencida (por defecto 30)"
                        />
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 flex gap-3">
                        <HiExclamation className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                                Importante
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                                Cambiar estas reglas actualizará automáticamente el estado de todos los deudores en la próxima sincronización. Asegúrese de que los valores sean correctos.
                            </p>
                        </div>
                    </div>

                </ModalBody>
                <ModalFooter className="border-t border-gray-100 dark:border-gray-800 pt-4">
                    <Button
                        color="danger"
                        variant="light"
                        onPress={onClose}
                        radius="lg"
                    >
                        Cancelar
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleSave}
                        isLoading={loading}
                        startContent={<HiSave className="w-4 h-4" />}
                        radius="lg"
                        className="shadow-lg shadow-blue-500/30"
                    >
                        Guardar Cambios
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ModalConfiguracionCortes;
