import React, { useState, useMemo } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from "@nextui-org/react";
import { HiClipboardCheck, HiCalculator, HiCurrencyDollar, HiViewGrid, HiCalendar, HiExclamationCircle } from "react-icons/hi";
import { useAuth } from "../../../../context/AuthContext";

const ModalCrearConvenio = ({ isOpen, onClose, selectedDeudor, onSuccess }) => {
    // const { token } = useAuth();
    const token = localStorage.getItem('token');
    const [pagoInicial, setPagoInicial] = useState("");
    const [parcialidades, setParcialidades] = useState(6);
    const [periodicidad, setPeriodicidad] = useState("mensual");
    const [loading, setLoading] = useState(false);

    if (!selectedDeudor) return null;

    const deudaTotal = selectedDeudor.deuda ? selectedDeudor.deuda.total : selectedDeudor.saldo_pendiente;

    // Calcular proyección
    const proyeccion = useMemo(() => {
        const inicial = Number(pagoInicial) || 0;
        const saldoRestante = deudaTotal - inicial;
        const cuota = parcialidades > 0 ? saldoRestante / parcialidades : 0;

        return {
            saldoRestante: saldoRestante > 0 ? saldoRestante : 0,
            cuota: cuota > 0 ? cuota : 0
        };
    }, [deudaTotal, pagoInicial, parcialidades]);

    const handleConfirm = async () => {
        if (!pagoInicial || Number(pagoInicial) <= 0) return;

        setLoading(true);
        try {
            await window.api.deudores.crearConvenio(token, {
                medidor_id: selectedDeudor.medidor.id,
                monto_inicial: Number(pagoInicial),
                numero_parcialidades: Number(parcialidades),
                periodicidad,
                observaciones: "Convenio generado desde módulo Deudores"
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error creando convenio:", error);
        } finally {
            setLoading(false);
        }
    };

    // Componente de Input Personalizado (Estilo RegistrCliente)
    const CustomInput = ({ label, value, onChange, icon, type = "text", color = "blue", prefix }) => (
        <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                {label}
            </label>
            <div className="relative w-full flex">
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2 pr-2">
                    {icon}
                </span>
                {prefix && (
                    <span className="absolute left-10 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-sm pointer-events-none">
                        {prefix}
                    </span>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder="0"
                    min={0}
                    className={`border border-gray-300 focus:ring-${color}-600 focus:border-${color}-500 text-gray-600 rounded-xl ${prefix ? 'pl-14' : 'pl-12'} pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all`}
                />
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            backdrop="blur"
            size="lg"
            classNames={{
                backdrop: "bg-black/60 backdrop-blur-sm",
                modal: "bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800",
                closeButton: "text-gray-600 dark:text-gray-300 hover:bg-red-600 hover:text-white transition-colors",
            }}
        >
            <ModalContent>
                <ModalHeader className="flex gap-3 items-center text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <HiClipboardCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Crear Convenio</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                            Plan de pagos diferidos
                        </p>
                    </div>
                </ModalHeader>
                <ModalBody className="py-6">
                    <div className="grid grid-cols-2 gap-4 mb-2">
                        <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Deuda Total</p>
                            <p className="text-xl font-black text-gray-800 dark:text-white mt-1">${deudaTotal?.toLocaleString()}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 text-center">
                            <p className="text-xs text-blue-500 dark:text-blue-400 uppercase font-bold tracking-wider">Saldo a Diferir</p>
                            <p className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">${proyeccion.saldoRestante.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <CustomInput
                            label="Pago Inicial (Enganche)"
                            type="number"
                            value={pagoInicial}
                            onChange={(e) => setPagoInicial(e.target.value)}
                            icon={<HiCurrencyDollar className="w-5 h-5 text-green-600" />}
                            color="green"
                            prefix="$"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <CustomInput
                                label="Nº de Parcialidades"
                                type="number"
                                value={parcialidades}
                                onChange={(e) => setParcialidades(Number(e.target.value))}
                                icon={<HiViewGrid className="w-5 h-5 text-purple-500" />}
                                color="purple"
                            />

                            <Select
                                label="Periodicidad"
                                selectedKeys={[periodicidad]}
                                onChange={(e) => setPeriodicidad(e.target.value)}
                                variant="bordered"
                                radius="lg"
                                labelPlacement="outside"
                                startContent={<HiCalendar className="text-gray-400" />}
                                classNames={{
                                    trigger: "h-10 bg-white dark:bg-neutral-800 hover:bg-neutral-200 border-gray-300",
                                    label: "text-sm font-medium text-gray-700 dark:text-gray-300 pb-1"
                                }}
                            >
                                <SelectItem key="mensual" value="mensual">Mensual</SelectItem>
                                <SelectItem key="quincenal" value="quincenal">Quincenal</SelectItem>
                            </Select>
                        </div>

                        {/* Validaciones Visuales */}
                        {proyeccion.saldoRestante < 0 && (
                            <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-2">
                                <HiExclamationCircle className="w-4 h-4" />
                                El pago inicial excede la deuda total.
                            </p>
                        )}

                        <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 mt-2">
                            <div className="flex items-center gap-2 mb-3 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-zinc-700 pb-2">
                                <HiCalculator className="w-5 h-5" />
                                <span className="font-bold text-sm">Resumen del Plan</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-gray-400">{parcialidades} pagos {periodicidad}es de:</span>
                                <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">${proyeccion.cuota.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter className="border-t border-gray-100 dark:border-gray-800 pt-4">
                    <Button variant="light" onPress={onClose} radius="lg">
                        Cancelar
                    </Button>
                    <Button
                        className="bg-green-600 text-white shadow-lg shadow-green-500/30"
                        onPress={handleConfirm}
                        isLoading={loading}
                        isDisabled={!pagoInicial || proyeccion.saldoRestante < 0}
                        startContent={<HiClipboardCheck className="w-4 h-4" />}
                        radius="lg"
                    >
                        Generar Convenio
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ModalCrearConvenio;
