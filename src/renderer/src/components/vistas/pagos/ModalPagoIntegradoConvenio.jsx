import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Card,
    CardBody,
    Input,
    Select,
    SelectItem,
    Chip
} from "@nextui-org/react";
import { useEffect, useMemo, useState } from "react";
import {
    HiCurrencyDollar,
    HiCalculator,
    HiCreditCard,
    HiCheck,
    HiX
} from "react-icons/hi";
import { useAuth } from "../../../context/AuthContext";

const toMoney = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return Math.round(num * 100) / 100;
};

const formatearMoneda = (monto) => {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN"
    }).format(toMoney(monto));
};

const ModalPagoIntegradoConvenio = ({ isOpen, onClose, resumenCobro, convenioId, onPagoExitoso }) => {
    const { token: authToken } = useAuth();
    const token = authToken || localStorage.getItem("token");

    const [montoFactura, setMontoFactura] = useState("0");
    const [montoConvenio, setMontoConvenio] = useState("0");
    const [cantidadEntregada, setCantidadEntregada] = useState("");
    const [metodoPago, setMetodoPago] = useState("Efectivo");
    const [comentario, setComentario] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen) return;

        const sugerenciaFactura = toMoney(resumenCobro?.sugerencia_cobro?.monto_factura || 0);
        const sugerenciaConvenio = toMoney(resumenCobro?.sugerencia_cobro?.monto_convenio || 0);
        const sugerenciaTotal = toMoney(sugerenciaFactura + sugerenciaConvenio);

        setMontoFactura(String(sugerenciaFactura));
        setMontoConvenio(String(sugerenciaConvenio));
        setCantidadEntregada(sugerenciaTotal > 0 ? String(sugerenciaTotal) : "");
        setMetodoPago("Efectivo");
        setComentario("");
        setError(null);
        setLoading(false);
    }, [isOpen, resumenCobro]);

    const saldoFacturaDisponible = toMoney(resumenCobro?.factura_actual?.saldo_pendiente || 0);

    const totales = useMemo(() => {
        const facturaNum = toMoney(montoFactura);
        const convenioNum = toMoney(montoConvenio);
        const aplicado = toMoney(facturaNum + convenioNum);
        const entregado = toMoney(cantidadEntregada);
        const cambio = toMoney(Math.max(0, entregado - aplicado));

        return {
            facturaNum,
            convenioNum,
            aplicado,
            entregado,
            cambio
        };
    }, [montoFactura, montoConvenio, cantidadEntregada]);

    const handleConfirmar = async () => {
        setError(null);

        if (!convenioId) {
            setError("No se encontró el convenio a cobrar");
            return;
        }

        if (totales.facturaNum <= 0 && totales.convenioNum <= 0) {
            setError("Debes capturar monto para factura, convenio o ambos");
            return;
        }

        if (totales.facturaNum > 0 && !resumenCobro?.factura_actual?.id) {
            setError("No hay factura activa para aplicar el monto de consumo");
            return;
        }

        if (totales.facturaNum > saldoFacturaDisponible) {
            setError(`El monto a factura no puede exceder ${formatearMoneda(saldoFacturaDisponible)}`);
            return;
        }

        if (totales.entregado <= 0 || totales.entregado < totales.aplicado) {
            setError("La cantidad entregada debe cubrir el total aplicado");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                convenio_id: convenioId,
                monto_convenio: totales.convenioNum,
                cantidad_entregada: totales.entregado,
                metodo_pago: metodoPago,
                comentario: comentario || null
            };

            if (totales.facturaNum > 0 && resumenCobro?.factura_actual?.id) {
                payload.factura_id = resumenCobro.factura_actual.id;
                payload.monto_factura = totales.facturaNum;
            }

            const resultado = await window.api.deudores.pagarIntegradoConvenio(token, payload);

            if (onPagoExitoso) {
                await onPagoExitoso(resultado);
            }

            onClose();
        } catch (err) {
            console.error("Error en pago integrado:", err);
            setError(err.message || "Error procesando pago integrado");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <HiCalculator className="text-2xl text-primary" />
                        <span>Cobro Integrado</span>
                    </div>
                    <p className="text-sm font-normal text-default-500">
                        Cobrar consumo del periodo y parcialidades del convenio en una sola operación
                    </p>
                </ModalHeader>

                <ModalBody>
                    <Card>
                        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <p className="text-xs text-default-500">Consumo del periodo</p>
                                <p className="text-base font-semibold text-primary">
                                    {formatearMoneda(resumenCobro?.sugerencia_cobro?.monto_factura || 0)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-default-500">Parcialidad convenio</p>
                                <p className="text-base font-semibold text-success">
                                    {formatearMoneda(resumenCobro?.sugerencia_cobro?.monto_convenio || 0)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-default-500">Sugerido total</p>
                                <p className="text-base font-semibold text-warning">
                                    {formatearMoneda(resumenCobro?.sugerencia_cobro?.total || 0)}
                                </p>
                            </div>
                        </CardBody>
                    </Card>

                    <Input
                        type="number"
                        label="Monto a factura (consumo)"
                        value={montoFactura}
                        onValueChange={setMontoFactura}
                        startContent={<HiCurrencyDollar className="text-default-400" />}
                        description={
                            resumenCobro?.factura_actual
                                ? `Factura #${resumenCobro.factura_actual.id} · Saldo: ${formatearMoneda(saldoFacturaDisponible)}`
                                : "No hay factura activa del periodo"
                        }
                    />

                    <Input
                        type="number"
                        label="Monto a convenio"
                        value={montoConvenio}
                        onValueChange={setMontoConvenio}
                        startContent={<HiCurrencyDollar className="text-default-400" />}
                        description="Puedes pagar una o varias parcialidades completas"
                    />

                    <Input
                        type="number"
                        label="Cantidad entregada"
                        value={cantidadEntregada}
                        onValueChange={setCantidadEntregada}
                        startContent={<HiCurrencyDollar className="text-default-400" />}
                    />

                    <Select
                        label="Método de pago"
                        selectedKeys={[metodoPago]}
                        onChange={(e) => setMetodoPago(e.target.value)}
                        startContent={<HiCreditCard className="text-default-400" />}
                    >
                        <SelectItem key="Efectivo">Efectivo</SelectItem>
                        <SelectItem key="Transferencia">Transferencia</SelectItem>
                        <SelectItem key="Tarjeta">Tarjeta</SelectItem>
                        <SelectItem key="Cheque">Cheque</SelectItem>
                    </Select>

                    <Input
                        label="Comentario (opcional)"
                        value={comentario}
                        onValueChange={setComentario}
                    />

                    <Card className="bg-default-50">
                        <CardBody className="grid grid-cols-3 gap-3 text-center">
                            <div>
                                <p className="text-xs text-default-500">Aplicado</p>
                                <p className="font-semibold">{formatearMoneda(totales.aplicado)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-default-500">Entregado</p>
                                <p className="font-semibold">{formatearMoneda(totales.entregado)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-default-500">Cambio</p>
                                <Chip color={totales.cambio > 0 ? "warning" : "default"} variant="flat" size="sm">
                                    {formatearMoneda(totales.cambio)}
                                </Chip>
                            </div>
                        </CardBody>
                    </Card>

                    {error && (
                        <Card className="bg-danger-50 border-danger">
                            <CardBody className="flex flex-row items-center gap-2 text-danger">
                                <HiX />
                                <span className="text-sm">{error}</span>
                            </CardBody>
                        </Card>
                    )}
                </ModalBody>

                <ModalFooter>
                    <Button variant="light" onPress={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleConfirmar}
                        isLoading={loading}
                        startContent={!loading ? <HiCheck /> : null}
                    >
                        Confirmar Cobro Integrado
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ModalPagoIntegradoConvenio;
