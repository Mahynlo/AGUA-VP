import { useState, useEffect } from "react";
import { Card, CardBody, Button, Badge, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Select, SelectItem, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import { FlechaReturnIcon } from "../../../IconsApp/IconsAppSystem";
import { useNavigate } from "react-router-dom";

const TabFacturas = () => {
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState([]);
  const [facturasFiltradas, setFacturasFiltradas] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [modalPago, setModalPago] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [formPago, setFormPago] = useState({
    monto: "",
    metodoPago: "",
    observaciones: ""
  });

  // Datos de ejemplo - en producción vendrían del contexto o API
  const facturasEjemplo = [
    {
      id: 1,
      cliente: "Juan Pérez",
      fechaEmision: "2025-01-15",
      fechaVencimiento: "2025-02-15",
      consumo: 45.5,
      totalPagar: 850.00,
      saldoPendiente: 850.00,
      estado: "Pendiente"
    },
    {
      id: 2,
      cliente: "María García",
      fechaEmision: "2025-01-10",
      fechaVencimiento: "2025-02-10",
      consumo: 32.8,
      totalPagar: 620.00,
      saldoPendiente: 0.00,
      estado: "Pagado"
    },
    {
      id: 3,
      cliente: "Carlos López",
      fechaEmision: "2024-12-15",
      fechaVencimiento: "2025-01-15",
      consumo: 67.2,
      totalPagar: 1250.00,
      saldoPendiente: 1250.00,
      estado: "Vencida"
    }
  ];

  useEffect(() => {
    setFacturas(facturasEjemplo);
    setFacturasFiltradas(facturasEjemplo);
  }, []);

  useEffect(() => {
    if (filtroEstado === "todas") {
      setFacturasFiltradas(facturas);
    } else {
      setFacturasFiltradas(facturas.filter(f => f.estado.toLowerCase() === filtroEstado));
    }
  }, [filtroEstado, facturas]);

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "Pagado": return "success";
      case "Pendiente": return "warning";
      case "Vencida": return "danger";
      default: return "default";
    }
  };

  const handleVerDetalle = (factura) => {
    setFacturaSeleccionada(factura);
    setModalDetalle(true);
  };

  const handlePagar = (factura) => {
    setFacturaSeleccionada(factura);
    setFormPago({
      monto: factura.saldoPendiente.toString(),
      metodoPago: "",
      observaciones: ""
    });
    setModalPago(true);
  };

  const handleConfirmarPago = () => {
    // Validaciones
    const monto = parseFloat(formPago.monto);
    if (monto <= 0 || monto > facturaSeleccionada.saldoPendiente) {
      alert("El monto debe ser mayor a 0 y no exceder el saldo pendiente");
      return;
    }
    if (!formPago.metodoPago) {
      alert("Debe seleccionar un método de pago");
      return;
    }

    // Simular aplicación del pago
    const facturaActualizada = {
      ...facturaSeleccionada,
      saldoPendiente: facturaSeleccionada.saldoPendiente - monto,
      estado: (facturaSeleccionada.saldoPendiente - monto) <= 0 ? "Pagado" : "Pendiente"
    };

    const facturasActualizadas = facturas.map(f => 
      f.id === facturaSeleccionada.id ? facturaActualizada : f
    );

    setFacturas(facturasActualizadas);
    setModalPago(false);
    setFacturaSeleccionada(null);
    setFormPago({ monto: "", metodoPago: "", observaciones: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Facturas</h1>
        <Button color="gray" onClick={() => navigate(-1)}>
          <FlechaReturnIcon className="w-6 h-6" />
          <span className="ml-2">Volver</span>
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardBody>
          <div className="flex gap-4 items-center">
            <span className="text-sm font-medium">Filtrar por estado:</span>
            <Select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-48"
              size="sm"
            >
              <SelectItem key="todas" value="todas">Todas</SelectItem>
              <SelectItem key="pendiente" value="pendiente">Pendiente</SelectItem>
              <SelectItem key="pagado" value="pagado">Pagado</SelectItem>
              <SelectItem key="vencida" value="vencida">Vencida</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Tabla de facturas */}
      <Card>
        <CardBody>
          <Table aria-label="Lista de facturas">
            <TableHeader>
              <TableColumn>CLIENTE</TableColumn>
              <TableColumn>FECHA EMISIÓN</TableColumn>
              <TableColumn>CONSUMO (m³)</TableColumn>
              <TableColumn>TOTAL</TableColumn>
              <TableColumn>SALDO PENDIENTE</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody>
              {facturasFiltradas.map((factura) => (
                <TableRow key={factura.id}>
                  <TableCell>{factura.cliente}</TableCell>
                  <TableCell>{factura.fechaEmision}</TableCell>
                  <TableCell>{factura.consumo}</TableCell>
                  <TableCell>${factura.totalPagar.toFixed(2)}</TableCell>
                  <TableCell>${factura.saldoPendiente.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge color={getEstadoColor(factura.estado)}>
                      {factura.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="bordered"
                        onClick={() => handleVerDetalle(factura)}
                      >
                        Ver Detalle
                      </Button>
                      {factura.saldoPendiente > 0 && (
                        <Button
                          size="sm"
                          color="primary"
                          onClick={() => handlePagar(factura)}
                        >
                          Pagar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Modal de detalle de factura */}
      <Modal isOpen={modalDetalle} onClose={() => setModalDetalle(false)} size="lg">
        <ModalContent>
          <ModalHeader>
            <h3>Detalle de Factura #{facturaSeleccionada?.id}</h3>
          </ModalHeader>
          <ModalBody>
            {facturaSeleccionada && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold">Cliente:</span>
                    <p>{facturaSeleccionada.cliente}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Estado:</span>
                    <Badge color={getEstadoColor(facturaSeleccionada.estado)}>
                      {facturaSeleccionada.estado}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-semibold">Fecha de emisión:</span>
                    <p>{facturaSeleccionada.fechaEmision}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Fecha de vencimiento:</span>
                    <p>{facturaSeleccionada.fechaVencimiento}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Consumo:</span>
                    <p>{facturaSeleccionada.consumo} m³</p>
                  </div>
                  <div>
                    <span className="font-semibold">Total a pagar:</span>
                    <p>${facturaSeleccionada.totalPagar.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Saldo pendiente:</span>
                    <p className="text-red-600 font-bold">${facturaSeleccionada.saldoPendiente.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setModalDetalle(false)}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de pago */}
      <Modal isOpen={modalPago} onClose={() => setModalPago(false)}>
        <ModalContent>
          <ModalHeader>
            <h3>Realizar Pago - Factura #{facturaSeleccionada?.id}</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <span className="font-semibold">Cliente:</span>
                <p>{facturaSeleccionada?.cliente}</p>
              </div>
              <div>
                <span className="font-semibold">Saldo pendiente:</span>
                <p className="text-red-600 font-bold">${facturaSeleccionada?.saldoPendiente.toFixed(2)}</p>
              </div>
              
              <Input
                label="Monto a pagar"
                type="number"
                value={formPago.monto}
                onChange={(e) => setFormPago({...formPago, monto: e.target.value})}
                startContent="$"
                max={facturaSeleccionada?.saldoPendiente}
              />
              
              <Select
                label="Método de pago"
                value={formPago.metodoPago}
                onChange={(e) => setFormPago({...formPago, metodoPago: e.target.value})}
              >
                <SelectItem key="efectivo" value="efectivo">Efectivo</SelectItem>
                <SelectItem key="transferencia" value="transferencia">Transferencia Bancaria</SelectItem>
                <SelectItem key="tarjeta" value="tarjeta">Tarjeta de Crédito/Débito</SelectItem>
                <SelectItem key="cheque" value="cheque">Cheque</SelectItem>
              </Select>
              
              <Input
                label="Observaciones (opcional)"
                value={formPago.observaciones}
                onChange={(e) => setFormPago({...formPago, observaciones: e.target.value})}
                placeholder="Notas adicionales sobre el pago"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setModalPago(false)}>
              Cancelar
            </Button>
            <Button color="primary" onClick={handleConfirmarPago}>
              Confirmar Pago
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default TabFacturas;
