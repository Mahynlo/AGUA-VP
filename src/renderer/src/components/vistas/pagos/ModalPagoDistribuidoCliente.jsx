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
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip
} from "@nextui-org/react";
import { useEffect, useMemo, useState } from "react";
import {
  HiCreditCard,
  HiExclamation,
  HiCheck,
  HiX,
  HiCash,
  HiUser,
  HiDocumentText
} from "react-icons/hi";

const toMoney = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100) / 100;
};

const sortFacturasFIFO = (facturas = []) => {
  return [...facturas].sort((a, b) => {
    const dateA = new Date(a.fecha_emision || a.fecha_creacion || 0).getTime();
    const dateB = new Date(b.fecha_emision || b.fecha_creacion || 0).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return Number(a.id) - Number(b.id);
  });
};

const buildPreview = (facturas, montoEntregado) => {
  const sorted = sortFacturasFIFO(facturas).filter((f) => toMoney(f.saldo_pendiente) > 0 && String(f.estado || "").toLowerCase() !== "pagado");
  let restante = toMoney(montoEntregado);

  const aplicaciones = sorted.map((factura) => {
    const saldo = toMoney(factura.saldo_pendiente);
    const aplicado = restante > 0 ? toMoney(Math.min(restante, saldo)) : 0;
    restante = toMoney(restante - aplicado);

    return {
      factura_id: factura.id,
      periodo: factura.periodo || factura.mes_facturado || "Sin periodo",
      estado: factura.estado || "Pendiente",
      saldo_antes: saldo,
      monto_aplicado: aplicado,
      saldo_despues: toMoney(saldo - aplicado)
    };
  }).filter((item) => item.monto_aplicado > 0);

  const montoAplicado = aplicaciones.reduce((acc, item) => toMoney(acc + item.monto_aplicado), 0);
  const cambio = toMoney(Math.max(0, toMoney(montoEntregado) - montoAplicado));

  return {
    aplicaciones,
    montoAplicado,
    cambio
  };
};

const buildInitialFormPago = (cliente) => ({
  cantidad_entregada: cliente?.deuda_total > 0 ? String(toMoney(cliente.deuda_total)) : "",
  metodo_pago: "Efectivo",
  comentario: "",
  fecha_pago: new Date().toISOString().split("T")[0]
});

const isValidPaymentDate = (fecha) => {
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const parsed = new Date(`${fecha}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
};

const ModalPagoDistribuidoCliente = ({ isOpen, onClose, cliente, onConfirmarPago }) => {
  const [estadoPago, setEstadoPago] = useState("formulario");
  const [resultadoPago, setResultadoPago] = useState(null);

  const [formPago, setFormPago] = useState(() => buildInitialFormPago(cliente));

  const [mostrarErrores, setMostrarErrores] = useState(false);

  const preview = useMemo(() => {
    if (!cliente) return { aplicaciones: [], montoAplicado: 0, cambio: 0 };
    return buildPreview(cliente.facturas || [], formPago.cantidad_entregada || 0);
  }, [cliente, formPago.cantidad_entregada]);

  const cambio = preview.cambio;

  useEffect(() => {
    if (!isOpen || !cliente) return;
    setEstadoPago("formulario");
    setResultadoPago(null);
    setMostrarErrores(false);
    setFormPago(buildInitialFormPago(cliente));
  }, [isOpen, cliente?.cliente_id]);

  const handleCerrar = () => {
    setEstadoPago("formulario");
    setResultadoPago(null);
    setMostrarErrores(false);
    setFormPago(buildInitialFormPago(cliente));
    onClose();
  };

  const handleConfirmar = () => {
    setMostrarErrores(true);
    if (!formPago.cantidad_entregada || toMoney(formPago.cantidad_entregada) <= 0 || !formPago.metodo_pago || !isValidPaymentDate(formPago.fecha_pago)) {
      return;
    }
    if (preview.aplicaciones.length === 0) {
      return;
    }
    setEstadoPago("confirmacion");
  };

  const handleProcesar = async () => {
    if (!isValidPaymentDate(formPago.fecha_pago)) {
      setMostrarErrores(true);
      setEstadoPago("formulario");
      return;
    }

    setEstadoPago("procesando");
    try {
      const result = await onConfirmarPago({
        cantidad_entregada: toMoney(formPago.cantidad_entregada),
        metodo_pago: formPago.metodo_pago,
        comentario: formPago.comentario,
        fecha_pago: formPago.fecha_pago,
        preview
      });
      setResultadoPago(result || null);
      setEstadoPago("exito");
    } catch (error) {
      setResultadoPago({ mensaje: error?.message || "No se pudo registrar el pago distribuido" });
      setEstadoPago("error");
    }
  };

  if (!cliente) return null;

  const renderFormulario = () => (
    <>
      <ModalHeader className="flex items-center gap-3 text-xl font-bold">
        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
          <HiCreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3>Cobro Distribuido - {cliente.cliente_nombre}</h3>
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
            Cliente ID {cliente.cliente_id} · Deuda total: <span className="font-bold text-gray-800 dark:text-white">${toMoney(cliente.deuda_total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
          </p>
        </div>
      </ModalHeader>

      <ModalBody className="space-y-6">
        <Card className="border border-green-200 dark:border-green-800 shadow-sm">
          <CardBody className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Cantidad entregada*</label>
                <div className="relative w-full flex">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formPago.cantidad_entregada}
                    onChange={(e) => setFormPago({ ...formPago, cantidad_entregada: e.target.value })}
                    className={`border ${mostrarErrores && (!formPago.cantidad_entregada || toMoney(formPago.cantidad_entregada) <= 0) ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-600 focus:border-green-500"} text-gray-800 text-2xl font-bold rounded-xl pl-8 pr-4 py-3 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:border-gray-600 dark:text-white transition-all`}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Metodo de pago*</label>
                <Select
                  aria-label="Metodo de pago"
                  selectedKeys={formPago.metodo_pago ? [formPago.metodo_pago] : []}
                  onChange={(e) => setFormPago({ ...formPago, metodo_pago: e.target.value })}
                  variant="bordered"
                >
                  <SelectItem key="Efectivo" value="Efectivo">Efectivo</SelectItem>
                  <SelectItem key="Transferencia" value="Transferencia">Transferencia</SelectItem>
                  <SelectItem key="Tarjeta" value="Tarjeta">Tarjeta</SelectItem>
                  <SelectItem key="Cheque" value="Cheque">Cheque</SelectItem>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Fecha de pago</label>
                <input
                  type="date"
                  value={formPago.fecha_pago}
                  onChange={(e) => setFormPago({ ...formPago, fecha_pago: e.target.value })}
                  className={`border ${mostrarErrores && !isValidPaymentDate(formPago.fecha_pago) ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"} rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:border-gray-600 dark:text-white`}
                />
                {mostrarErrores && !isValidPaymentDate(formPago.fecha_pago) && (
                  <p className="text-xs text-red-600 mt-1">Ingrese una fecha de pago válida (YYYY-MM-DD).</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Comentario (Opcional)</label>
                <input
                  type="text"
                  placeholder="Nota..."
                  value={formPago.comentario}
                  onChange={(e) => setFormPago({ ...formPago, comentario: e.target.value })}
                  className="border border-gray-300 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[20, 50, 100, 200, 500, 1000].map((monto) => (
                <button
                  key={monto}
                  type="button"
                  onClick={() => setFormPago({ ...formPago, cantidad_entregada: String(monto) })}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all border bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:border-green-400 hover:text-green-600"
                >
                  <span className="flex items-center gap-1">
                    <HiCash className="text-green-500" />
                    ${monto}
                  </span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => setFormPago({ ...formPago, cantidad_entregada: String(toMoney(cliente.deuda_total)) })}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all border bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              >
                Pagar total deuda
              </button>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-slate-200 dark:border-zinc-800">
          <CardBody className="space-y-3">
            <div className="flex items-center gap-2">
              <HiDocumentText className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Vista previa FIFO por factura</h4>
            </div>
            <Table aria-label="Vista previa FIFO" removeWrapper>
              <TableHeader>
                <TableColumn>FACTURA</TableColumn>
                <TableColumn>PERIODO</TableColumn>
                <TableColumn>ESTADO</TableColumn>
                <TableColumn>SALDO</TableColumn>
                <TableColumn>APLICADO</TableColumn>
                <TableColumn>RESTANTE</TableColumn>
              </TableHeader>
              <TableBody items={preview.aplicaciones} emptyContent="Ingrese un monto para visualizar la distribución">
                {(item) => (
                  <TableRow key={item.factura_id}>
                    <TableCell>#{item.factura_id}</TableCell>
                    <TableCell>{item.periodo}</TableCell>
                    <TableCell><Chip size="sm" variant="flat">{item.estado}</Chip></TableCell>
                    <TableCell>${item.saldo_antes.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-emerald-600 font-semibold">${item.monto_aplicado.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>${item.saldo_despues.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Chip color="primary" variant="flat">Facturas afectadas: {preview.aplicaciones.length}</Chip>
              <Chip color="success" variant="flat">Monto aplicado: ${preview.montoAplicado.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</Chip>
              <Chip color="warning" variant="flat">Cambio: ${cambio.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</Chip>
            </div>
          </CardBody>
        </Card>
      </ModalBody>

      <ModalFooter>
        <Button color="danger" variant="light" onPress={handleCerrar}>Cancelar</Button>
        <Button color="primary" onPress={handleConfirmar}>Cobrar</Button>
      </ModalFooter>
    </>
  );

  const renderConfirmacion = () => (
    <>
      <ModalHeader className="flex items-center gap-3 text-xl font-bold">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <HiExclamation className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3>Confirmar Cobro Distribuido</h3>
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Revise los datos antes de procesar</p>
        </div>
      </ModalHeader>
      <ModalBody className="space-y-4">
        <Card className="border border-blue-200 dark:border-blue-800">
          <CardBody className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><HiUser className="w-4 h-4" /> Cliente: <span className="font-semibold">{cliente.cliente_nombre}</span></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Cantidad entregada</p>
                <p className="text-xl font-bold text-green-600">${toMoney(formPago.cantidad_entregada).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Facturas a afectar</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{preview.aplicaciones.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </ModalBody>
      <ModalFooter>
        <Button color="default" variant="light" onPress={() => setEstadoPago("formulario")}>Volver</Button>
        <Button color="primary" onPress={handleProcesar}>Confirmar y Procesar</Button>
      </ModalFooter>
    </>
  );

  const renderProcesando = () => (
    <>
      <ModalHeader className="flex items-center gap-3 text-xl font-bold">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <HiCash className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3>Procesando Cobro...</h3>
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Por favor espere</p>
        </div>
      </ModalHeader>
      <ModalBody className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4" />
      </ModalBody>
    </>
  );

  const renderExito = () => (
    <>
      <ModalHeader className="flex items-center gap-3 text-xl font-bold">
        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
          <HiCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3>Cobro Registrado con Exito</h3>
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">La distribución se aplicó correctamente</p>
        </div>
      </ModalHeader>
      <ModalBody>
        <Card className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardBody>
            <p className="text-sm text-green-700 dark:text-green-300">Facturas afectadas: {resultadoPago?.data?.facturas_afectadas || preview.aplicaciones.length}</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">Monto aplicado: ${toMoney(resultadoPago?.data?.monto_aplicado || preview.montoAplicado).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
          </CardBody>
        </Card>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onPress={handleCerrar} className="w-full font-bold">Finalizar</Button>
      </ModalFooter>
    </>
  );

  const renderError = () => (
    <>
      <ModalBody className="py-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
            <HiX className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-red-600">Error al procesar cobro</h3>
          <p className="text-gray-600 dark:text-gray-300">{resultadoPago?.mensaje || "Error inesperado"}</p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="default" variant="light" onPress={() => setEstadoPago("confirmacion")}>Reintentar</Button>
        <Button color="danger" onPress={handleCerrar}>Cerrar</Button>
      </ModalFooter>
    </>
  );

  const renderContenido = () => {
    if (estadoPago === "confirmacion") return renderConfirmacion();
    if (estadoPago === "procesando") return renderProcesando();
    if (estadoPago === "exito") return renderExito();
    if (estadoPago === "error") return renderError();
    return renderFormulario();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={estadoPago === "procesando" ? undefined : handleCerrar}
      size="5xl"
      backdrop="opaque"
      scrollBehavior="inside"
      isDismissable={estadoPago !== "procesando"}
      classNames={{
        backdrop: "bg-black/60",
        modal: "bg-white dark:bg-zinc-900 rounded-xl shadow-2xl",
        closeButton: "hover:bg-red-600 hover:text-white text-gray-600"
      }}
    >
      <ModalContent>{renderContenido()}</ModalContent>
    </Modal>
  );
};

export default ModalPagoDistribuidoCliente;
