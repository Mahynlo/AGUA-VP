import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Card,
    CardBody,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Progress,
    Spinner
} from "@nextui-org/react";
import { useState, useEffect } from "react";
import {
    HiCurrencyDollar,
    HiCalendar,
    HiCheck,
    HiX,
    HiClock,
    HiDocumentText
} from "react-icons/hi";
import { useAuth } from "../../../context/AuthContext";
import ModalPagoParcialidad from "./ModalPagoParcialidad";

const ModalParcialidadesConvenio = ({ isOpen, onClose, convenioId, onPagoExitoso }) => {
    const { token: authToken } = useAuth();
    const token = authToken || localStorage.getItem('token'); // Fallback
    const [convenio, setConvenio] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estado para modal de pago
    const [modalPagoOpen, setModalPagoOpen] = useState(false);
    const [parcialidadSeleccionada, setParcialidadSeleccionada] = useState(null);

    useEffect(() => {
        console.log('ModalParcialidadesConvenio - isOpen:', isOpen, 'convenioId:', convenioId, 'token:', token ? 'OK' : 'MISSING');
        if (isOpen && convenioId) {
            cargarConvenio();
        }
    }, [isOpen, convenioId]);

    const cargarConvenio = async () => {
        console.log('Cargando convenio ID:', convenioId);
        setLoading(true);
        setError(null);

        try {
            const data = await window.api.deudores.obtenerConvenio(token, convenioId);
            console.log('Convenio cargado:', data);
            setConvenio(data);
        } catch (err) {
            console.error('Error cargando convenio:', err);
            setError(err.message || 'Error al cargar el convenio');
        } finally {
            setLoading(false);
        }
    };

    const handlePagarParcialidad = (parcialidad) => {
        setParcialidadSeleccionada(parcialidad);
        setModalPagoOpen(true);
    };

    const handlePagoExitoso = async () => {
        setModalPagoOpen(false);
        setParcialidadSeleccionada(null);

        // Recargar convenio para actualizar progreso
        await cargarConvenio();

        // Notificar al componente padre
        if (onPagoExitoso) {
            onPagoExitoso();
        }
    };

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'Pagada':
                return 'success';
            case 'Pendiente':
                return 'warning';
            case 'Vencida':
                return 'danger';
            default:
                return 'default';
        }
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return '-';
        return new Date(fecha).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(monto || 0);
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                size="4xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <HiDocumentText className="text-2xl text-primary" />
                            <span>Convenio de Pago</span>
                        </div>
                        {convenio && (
                            <p className="text-sm font-normal text-default-500">
                                Cliente: {convenio.convenio.cliente_nombre} • Medidor: {convenio.convenio.numero_serie}
                            </p>
                        )}
                    </ModalHeader>

                    <ModalBody>
                        {loading && (
                            <div className="flex justify-center items-center py-8">
                                <Spinner size="lg" label="Cargando convenio..." />
                            </div>
                        )}

                        {error && (
                            <Card className="bg-danger-50 border-danger">
                                <CardBody>
                                    <div className="flex items-center gap-2 text-danger">
                                        <HiX className="text-xl" />
                                        <span>{error}</span>
                                    </div>
                                </CardBody>
                            </Card>
                        )}

                        {!loading && !error && convenio && (
                            <div className="flex flex-col gap-4">
                                {/* Información del Convenio */}
                                <Card>
                                    <CardBody>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-xs text-default-500">Estado</p>
                                                <Chip
                                                    color={convenio.convenio.estado === 'Activo' ? 'success' : 'default'}
                                                    variant="flat"
                                                    size="sm"
                                                >
                                                    {convenio.convenio.estado}
                                                </Chip>
                                            </div>
                                            <div>
                                                <p className="text-xs text-default-500">Monto Total</p>
                                                <p className="text-sm font-semibold">{formatearMoneda(convenio.progreso.total)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-default-500">Pagado</p>
                                                <p className="text-sm font-semibold text-success">{formatearMoneda(convenio.progreso.pagado)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-default-500">Pendiente</p>
                                                <p className="text-sm font-semibold text-warning">{formatearMoneda(convenio.progreso.pendiente)}</p>
                                            </div>
                                        </div>

                                        {/* Barra de Progreso */}
                                        <div className="mt-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-xs text-default-500">Progreso del Convenio</p>
                                                <p className="text-xs font-semibold">{convenio.progreso.porcentaje.toFixed(1)}%</p>
                                            </div>
                                            <Progress
                                                value={convenio.progreso.porcentaje}
                                                color="success"
                                                className="max-w-full"
                                            />
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* Tabla de Parcialidades */}
                                <Card>
                                    <CardBody className="p-0">
                                        <Table
                                            aria-label="Tabla de parcialidades"
                                            removeWrapper
                                        >
                                            <TableHeader>
                                                <TableColumn>CUOTA</TableColumn>
                                                <TableColumn>MONTO</TableColumn>
                                                <TableColumn>VENCIMIENTO</TableColumn>
                                                <TableColumn>ESTADO</TableColumn>
                                                <TableColumn>FECHA PAGO</TableColumn>
                                                <TableColumn>ACCIÓN</TableColumn>
                                            </TableHeader>
                                            <TableBody>
                                                {convenio.parcialidades.map((parcialidad) => (
                                                    <TableRow key={parcialidad.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold">#{parcialidad.numero_parcialidad}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="font-medium">{formatearMoneda(parcialidad.monto_esperado)}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1 text-xs">
                                                                <HiCalendar className="text-default-400" />
                                                                {formatearFecha(parcialidad.fecha_vencimiento)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                color={getEstadoColor(parcialidad.estado)}
                                                                variant="flat"
                                                                size="sm"
                                                                startContent={
                                                                    parcialidad.estado === 'Pagada' ?
                                                                        <HiCheck /> :
                                                                        parcialidad.estado === 'Vencida' ?
                                                                            <HiX /> :
                                                                            <HiClock />
                                                                }
                                                            >
                                                                {parcialidad.estado}
                                                            </Chip>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-xs text-default-500">
                                                                {parcialidad.fecha_pago ? formatearFecha(parcialidad.fecha_pago) : '-'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            {parcialidad.estado === 'Pendiente' && (
                                                                <Button
                                                                    size="sm"
                                                                    color="primary"
                                                                    variant="flat"
                                                                    onPress={() => handlePagarParcialidad(parcialidad)}
                                                                    startContent={<HiCurrencyDollar />}
                                                                >
                                                                    Pagar
                                                                </Button>
                                                            )}
                                                            {parcialidad.estado === 'Pagada' && (
                                                                <Chip color="success" variant="flat" size="sm">
                                                                    <HiCheck /> Pagada
                                                                </Chip>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardBody>
                                </Card>
                            </div>
                        )}
                    </ModalBody>

                    <ModalFooter>
                        <Button
                            color="danger"
                            variant="light"
                            onPress={onClose}
                        >
                            Cerrar
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Modal de Pago de Parcialidad */}
            <ModalPagoParcialidad
                isOpen={modalPagoOpen}
                onClose={() => {
                    setModalPagoOpen(false);
                    setParcialidadSeleccionada(null);
                }}
                parcialidad={parcialidadSeleccionada}
                convenio={convenio?.convenio}
                onConfirmarPago={handlePagoExitoso}
            />
        </>
    );
};

export default ModalParcialidadesConvenio;
