import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Card,
    CardBody,
    Select,
    SelectItem,
    Chip,
    Input
} from "@nextui-org/react";
import { useState, useEffect, useMemo } from "react";
import {
    HiCurrencyDollar,
    HiCreditCard,
    HiCalendar,
    HiCheck,
    HiX,
    HiCash
} from "react-icons/hi";
import { useAuth } from "../../../context/AuthContext";

const ModalPagoParcialidad = ({ isOpen, onClose, parcialidad, convenio, onConfirmarPago }) => {
    const { token: authToken } = useAuth();
    const token = authToken || localStorage.getItem('token'); // Fallback
    const [formPago, setFormPago] = useState({
        cantidad_entregada: "",
        metodo_pago: "Efectivo",
        comentario: ""
    });

    const [erroresCampos, setErroresCampos] = useState({});
    const [mostrarErrores, setMostrarErrores] = useState(false);
    const [estadoPago, setEstadoPago] = useState('formulario');
    const [resultadoPago, setResultadoPago] = useState(null);

    // Sugerencias de pago
    const sugerenciasPago = useMemo(() => {
        if (!parcialidad?.monto_esperado) return [];

        const monto = parseFloat(parcialidad.monto_esperado);
        const sugerencias = new Set();

        sugerencias.add(monto);
        if (monto % 10 !== 0) sugerencias.add(Math.ceil(monto / 10) * 10);
        if (monto % 50 !== 0) sugerencias.add(Math.ceil(monto / 50) * 50);
        if (monto % 100 !== 0) sugerencias.add(Math.ceil(monto / 100) * 100);

        const billetes = [20, 50, 100, 200, 500, 1000];
        billetes.forEach(billete => {
            if (billete > monto) {
                sugerencias.add(billete);
            }
        });

        return Array.from(sugerencias).sort((a, b) => a - b).slice(0, 5);
    }, [parcialidad]);

    const cambio = useMemo(() => {
        if (!formPago.cantidad_entregada || !parcialidad?.monto_esperado) return 0;
        const entregada = parseFloat(formPago.cantidad_entregada);
        const monto = parseFloat(parcialidad.monto_esperado);
        return Math.max(0, entregada - monto);
    }, [formPago.cantidad_entregada, parcialidad]);

    useEffect(() => {
        if (isOpen && parcialidad) {
            setFormPago({
                cantidad_entregada: "",
                metodo_pago: "Efectivo",
                comentario: ""
            });
            setErroresCampos({});
            setMostrarErrores(false);
            setEstadoPago('formulario');
            setResultadoPago(null);
        }
    }, [isOpen, parcialidad]);

    const handleConfirmar = async () => {
        setMostrarErrores(true);
        const nuevosErrores = {};

        if (!formPago.cantidad_entregada || parseFloat(formPago.cantidad_entregada) <= 0) {
            nuevosErrores.cantidad_entregada = true;
        }

        if (!formPago.metodo_pago) {
            nuevosErrores.metodo_pago = true;
        }

        const montoEsperado = parseFloat(parcialidad.monto_esperado);
        const cantidadEntregada = parseFloat(formPago.cantidad_entregada);

        if (cantidadEntregada < montoEsperado) {
            nuevosErrores.cantidad_entregada = true;
            alert(`La cantidad entregada debe ser al menos ${formatearMoneda(montoEsperado)}`);
            return;
        }

        if (Object.keys(nuevosErrores).length > 0) {
            setErroresCampos(nuevosErrores);
            return;
        }

        setEstadoPago('procesando');

        try {
            const dataPago = {
                parcialidad_id: parcialidad.id,
                cantidad_entregada: parseFloat(formPago.cantidad_entregada),
                metodo_pago: formPago.metodo_pago,
                comentario: formPago.comentario || null
            };

            const resultado = await window.api.deudores.pagarParcialidad(token, dataPago);

            setResultadoPago(resultado);
            setEstadoPago('exitoso');

            setTimeout(() => {
                if (onConfirmarPago) {
                    onConfirmarPago(resultado);
                }
                onClose();
            }, 2000);

        } catch (error) {
            console.error('Error al pagar parcialidad:', error);
            setEstadoPago('error');
            setResultadoPago({ error: error.message || 'Error al procesar el pago' });
        }
    };

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(monto || 0);
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return '-';
        return new Date(fecha).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!parcialidad) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl"
            isDismissable={estadoPago === 'formulario'}
            hideCloseButton={estadoPago !== 'formulario'}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <HiCurrencyDollar className="text-2xl text-primary" />
                        <span>Pagar Parcialidad #{parcialidad.numero_parcialidad}</span>
                    </div>
                    {convenio && (
                        <p className="text-sm font-normal text-default-500">
                            Cliente: {convenio.cliente_nombre}
                        </p>
                    )}
                </ModalHeader>

                <ModalBody>
                    {estadoPago === 'formulario' && (
                        <div className="flex flex-col gap-4">
                            {/* Información de la Parcialidad */}
                            <Card>
                                <CardBody>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-default-500">Monto a Pagar</p>
                                            <p className="text-lg font-bold text-primary">
                                                {formatearMoneda(parcialidad.monto_esperado)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-default-500">Fecha de Vencimiento</p>
                                            <div className="flex items-center gap-1">
                                                <HiCalendar className="text-default-400" />
                                                <p className="text-sm">{formatearFecha(parcialidad.fecha_vencimiento)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Sugerencias de Pago */}
                            {sugerenciasPago.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Sugerencias de pago:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {sugerenciasPago.map((sugerencia) => (
                                            <Chip
                                                key={sugerencia}
                                                variant="flat"
                                                color="primary"
                                                className="cursor-pointer hover:bg-primary-100"
                                                onClick={() => setFormPago(prev => ({ ...prev, cantidad_entregada: sugerencia.toString() }))}
                                            >
                                                {formatearMoneda(sugerencia)}
                                            </Chip>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Formulario */}
                            <Input
                                type="number"
                                label="Cantidad Entregada"
                                placeholder="0.00"
                                value={formPago.cantidad_entregada}
                                onValueChange={(value) => {
                                    setFormPago(prev => ({ ...prev, cantidad_entregada: value }));
                                    if (erroresCampos.cantidad_entregada) {
                                        setErroresCampos(prev => ({ ...prev, cantidad_entregada: false }));
                                    }
                                }}
                                startContent={<HiCurrencyDollar className="text-default-400" />}
                                isInvalid={mostrarErrores && erroresCampos.cantidad_entregada}
                                errorMessage={mostrarErrores && erroresCampos.cantidad_entregada && "Ingrese una cantidad válida"}
                            />

                            <Select
                                label="Método de Pago"
                                selectedKeys={[formPago.metodo_pago]}
                                onChange={(e) => setFormPago(prev => ({ ...prev, metodo_pago: e.target.value }))}
                                startContent={<HiCreditCard className="text-default-400" />}
                            >
                                <SelectItem key="Efectivo" startContent={<HiCash />}>Efectivo</SelectItem>
                                <SelectItem key="Transferencia" startContent={<HiCreditCard />}>Transferencia</SelectItem>
                                <SelectItem key="Tarjeta" startContent={<HiCreditCard />}>Tarjeta</SelectItem>
                                <SelectItem key="Cheque" startContent={<HiCreditCard />}>Cheque</SelectItem>
                            </Select>

                            <Input
                                label="Comentario (opcional)"
                                placeholder="Agregar nota..."
                                value={formPago.comentario}
                                onValueChange={(value) => setFormPago(prev => ({ ...prev, comentario: value }))}
                            />

                            {/* Cambio */}
                            {cambio > 0 && (
                                <Card className="bg-warning-50">
                                    <CardBody>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Cambio a devolver:</span>
                                            <span className="text-lg font-bold text-warning">{formatearMoneda(cambio)}</span>
                                        </div>
                                    </CardBody>
                                </Card>
                            )}
                        </div>
                    )}

                    {estadoPago === 'procesando' && (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                            <p className="text-default-500">Procesando pago...</p>
                        </div>
                    )}

                    {estadoPago === 'exitoso' && resultadoPago && (
                        <Card className="bg-success-50">
                            <CardBody>
                                <div className="flex flex-col items-center gap-4 py-4">
                                    <div className="rounded-full bg-success p-3">
                                        <HiCheck className="text-4xl text-white" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-success">¡Pago Exitoso!</p>
                                        <p className="text-sm text-default-500 mt-2">
                                            Monto aplicado: {formatearMoneda(resultadoPago.monto_aplicado)}
                                        </p>
                                        {resultadoPago.cambio > 0 && (
                                            <p className="text-sm text-warning">
                                                Cambio: {formatearMoneda(resultadoPago.cambio)}
                                            </p>
                                        )}
                                        {resultadoPago.convenio_completado && (
                                            <Chip color="success" variant="flat" className="mt-2">
                                                ¡Convenio Completado!
                                            </Chip>
                                        )}
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    {estadoPago === 'error' && resultadoPago && (
                        <Card className="bg-danger-50">
                            <CardBody>
                                <div className="flex items-center gap-2 text-danger">
                                    <HiX className="text-xl" />
                                    <span>{resultadoPago.error}</span>
                                </div>
                            </CardBody>
                        </Card>
                    )}
                </ModalBody>

                <ModalFooter>
                    {estadoPago === 'formulario' && (
                        <>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Cancelar
                            </Button>
                            <Button color="primary" onPress={handleConfirmar}>
                                Confirmar Pago
                            </Button>
                        </>
                    )}
                    {estadoPago === 'error' && (
                        <Button color="danger" onPress={onClose}>
                            Cerrar
                        </Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ModalPagoParcialidad;
