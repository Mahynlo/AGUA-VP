import React, { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Chip } from "@nextui-org/react";
import { HiCog, HiSave, HiBan } from "react-icons/hi";
import { useAuth } from "../../../../context/AuthContext";

const ModalConfiguracionCortes = ({ isOpen, onClose }) => {
    // const { token } = useAuth(); 
    const token = localStorage.getItem('token');
    const [config, setConfig] = useState({
        facturas_para_primer_aviso: 1,
        facturas_para_segundo_aviso: 2,
        facturas_para_tercer_aviso: 3,
        facturas_para_corte: 4,
        dias_gracia: 0
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
            // Aquí podrías agregar un toast
        } finally {
            setLoading(false);
        }
    };

    // Componente de Input Personalizado (Estilo RegistrCliente)
    const CustomInput = ({ label, value, onChange, icon, type = "text", color = "blue" }) => (
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
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            backdrop="blur"
            classNames={{
                backdrop: "bg-black/60 backdrop-blur-sm",
                modal: "bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800",
                closeButton: "text-gray-600 dark:text-gray-300 hover:bg-red-600 hover:text-white transition-colors",
            }}
        >
            <ModalContent>
                <ModalHeader className="flex gap-3 items-center text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <HiCog className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Configuración de Reglas</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                            Define los umbrales automáticos
                        </p>
                    </div>
                </ModalHeader>
                <ModalBody className="py-6">
                    <div className="space-y-6">
                        <CustomInput
                            label="Facturas para Primer Aviso"
                            type="number"
                            value={config.facturas_para_primer_aviso}
                            onChange={(e) => setConfig({ ...config, facturas_para_primer_aviso: Number(e.target.value) })}
                            icon={<HiCog className="w-5 h-5 text-blue-600" />}
                        />

                        <CustomInput
                            label="Facturas para Corte de Servicio"
                            type="number"
                            value={config.facturas_para_corte}
                            onChange={(e) => setConfig({ ...config, facturas_para_corte: Number(e.target.value) })}
                            icon={<HiBan className="w-5 h-5 text-red-600" />}
                            color="red"
                        />

                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 flex items-start gap-3">
                            <span className="text-xl">ℹ️</span>
                            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                Cambiar estas reglas afectará a todos los usuarios en la próxima actualización de candidatos. Asegúrese de revisar la política de cortes antes de guardar.
                            </p>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter className="border-t border-gray-100 dark:border-gray-800 pt-4">
                    <Button color="danger" variant="light" onPress={onClose} radius="lg">
                        Cancelar
                    </Button>
                    <Button
                        className="bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                        onPress={handleSave}
                        isLoading={loading}
                        startContent={<HiSave className="w-4 h-4" />}
                        radius="lg"
                    >
                        Guardar Cambios
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ModalConfiguracionCortes;
