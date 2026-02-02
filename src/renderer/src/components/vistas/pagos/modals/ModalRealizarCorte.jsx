import React, { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea, Select, SelectItem } from "@nextui-org/react";
import { HiBan, HiExclamation, HiChat } from "react-icons/hi";
import { useAuth } from "../../../../context/AuthContext";

// Componente de Textarea Personalizado (FUERA del componente principal)
const CustomTextarea = ({ label, value, onChange, icon }) => (
    <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            {label}
        </label>
        <div className="relative w-full flex">
            <span className="absolute left-2 top-3 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 pr-2 h-6">
                {icon}
            </span>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={3}
                className="border border-gray-300 focus:ring-red-600 focus:border-red-500 text-gray-600 rounded-xl pl-12 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all resize-none"
                placeholder="Detalles adicionales sobre la acción..."
            />
        </div>
    </div>
);

const ModalRealizarCorte = ({ isOpen, onClose, selectedDeudor, onSuccess }) => {
    // const { token } = useAuth();
    const token = localStorage.getItem('token');
    const [motivo, setMotivo] = useState("Falta de pago");
    const [observaciones, setObservaciones] = useState("");
    const [loading, setLoading] = useState(false);

    // Reset form cuando se abre el modal
    useEffect(() => {
        if (isOpen && selectedDeudor) {
            setMotivo("Falta de pago");
            setObservaciones("");
            setLoading(false);
        }
    }, [isOpen, selectedDeudor]);

    if (!selectedDeudor) return null;

    const handleConfirm = async () => {
        // Validación previa
        if (!selectedDeudor.medidor?.id) {
            console.error("Error: medidor.id no está disponible", selectedDeudor);
            alert("Error: No se pudo obtener el ID del medidor");
            return;
        }

        if (!motivo) {
            alert("Por favor seleccione un motivo");
            return;
        }

        setLoading(true);

        const payload = {
            medidor_id: selectedDeudor.medidor.id,
            motivo,
            observaciones
        };

        console.log("Enviando corte con payload:", payload);

        try {
            const result = await window.api.deudores.ejecutarCorte(token, payload);
            console.log("Corte ejecutado exitosamente:", result);
            onSuccess(); // Recargar lista
            onClose();
        } catch (error) {
            console.error("Error ejecutando corte:", error);
            alert(`Error al ejecutar el corte: ${error.message || 'Error desconocido'}`);
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
                modal: "bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800",
                closeButton: "text-gray-600 dark:text-gray-300 hover:bg-red-600 hover:text-white transition-colors",
            }}
        >
            <ModalContent>
                <ModalHeader className="flex gap-3 items-center text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                        <HiBan className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Confirmar Corte</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                            Procedimiento de suspensión
                        </p>
                    </div>
                </ModalHeader>
                <ModalBody className="py-6 space-y-5">
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800/30">
                        <div className="flex gap-3">
                            <HiExclamation className="w-6 h-6 text-red-500 flex-shrink-0" />
                            <div>
                                <p className="font-bold text-red-800 dark:text-red-300 text-sm">¿ESTÁ SEGURO DE PROCEDER?</p>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1 mb-2">
                                    Se registrará el corte de servicio para:
                                </p>
                                <div className="bg-white dark:bg-zinc-800 p-2 rounded-lg border border-red-100 dark:border-red-900/50">
                                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{selectedDeudor.cliente_nombre}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{selectedDeudor.direccion_cliente}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Select
                        label="Motivo del Corte"
                        selectedKeys={[motivo]}
                        onChange={(e) => setMotivo(e.target.value)}
                        variant="bordered"
                        color="danger"
                        radius="lg"
                        startContent={<HiExclamation className="text-gray-400" />}
                    >
                        <SelectItem key="Falta de pago" value="Falta de pago">Falta de pago</SelectItem>
                        <SelectItem key="Incumplimiento de convenio" value="Incumplimiento de convenio">Incumplimiento de convenio</SelectItem>
                        <SelectItem key="Toma clandestina" value="Toma clandestina">Toma clandestina</SelectItem>
                        <SelectItem key="Solicitud del usuario" value="Solicitud del usuario">Solicitud del usuario</SelectItem>
                    </Select>

                    <CustomTextarea
                        label="Observaciones"
                        value={observaciones}
                        onChange={setObservaciones}
                        icon={<HiChat className="w-5 h-5 text-gray-400" />}
                    />
                </ModalBody>
                <ModalFooter className="border-t border-gray-100 dark:border-gray-800 pt-4">
                    <Button variant="light" onPress={onClose} radius="lg">
                        Cancelar
                    </Button>
                    <Button
                        className="bg-red-600 text-white shadow-lg shadow-red-500/30"
                        onPress={handleConfirm}
                        isLoading={loading}
                        startContent={<HiBan className="w-4 h-4" />}
                        radius="lg"
                    >
                        Ejecutar Corte
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ModalRealizarCorte;
