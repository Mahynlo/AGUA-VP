import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner
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

  // Clases base compartidas para inputs
  const inputBaseClasses = "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 font-medium text-slate-800 dark:text-zinc-100";

  const renderFormulario = () => (
    <>
      <ModalHeader className="flex flex-col gap-1">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl p-3">
            <HiCreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
              Cobro Distribuido
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
              {cliente.cliente_nombre} <span className="mx-2 text-slate-300 dark:text-zinc-700">•</span> ID {cliente.cliente_id}
            </p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody className="space-y-6">
        {/* Tarjeta Superior: KPIs y Entrada principal */}
        <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700">
          <div className="flex justify-between items-center mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Deuda Total</p>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400">${toMoney(cliente.deuda_total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Gigante de Cantidad */}
            <div className="lg:col-span-5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 block">
                Cantidad Entregada*
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold text-2xl">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formPago.cantidad_entregada}
                  onChange={(e) => setFormPago({ ...formPago, cantidad_entregada: e.target.value })}
                  className={`w-full bg-white dark:bg-zinc-950 border ${mostrarErrores && (!formPago.cantidad_entregada || toMoney(formPago.cantidad_entregada) <= 0) ? "border-rose-500 focus:ring-rose-500" : "border-slate-200 dark:border-zinc-800 focus:ring-emerald-500"} rounded-2xl pl-10 pr-4 py-4 text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 shadow-sm transition-all focus:outline-none focus:ring-2 focus:border-transparent`}
                  placeholder="0.00"
                />
              </div>
              
              {/* Botones de Moneda Rápidos */}
              <div className="flex flex-wrap gap-2 mt-4">
                {[50, 100, 200, 500].map((monto) => (
                  <button
                    key={monto}
                    type="button"
                    onClick={() => setFormPago({ ...formPago, cantidad_entregada: String(monto) })}
                    className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-2 py-2 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 transition-all shadow-sm"
                  >
                    ${monto}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFormPago({ ...formPago, cantidad_entregada: String(toMoney(cliente.deuda_total)) })}
                  className="flex-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl px-2 py-2 text-xs font-bold hover:bg-emerald-500/20 transition-all"
                >
                  Total
                </button>
              </div>
            </div>

            {/* Resto de Controles */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 block">
                  Método de pago*
                </label>
                <Select
                  aria-label="Método de pago"
                  selectedKeys={formPago.metodo_pago ? [formPago.metodo_pago] : []}
                  onChange={(e) => setFormPago({ ...formPago, metodo_pago: e.target.value })}
                  size="lg"
                  variant="flat"
                  classNames={{ trigger: "bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 transition-all shadow-sm h-[52px]" }}
                >
                  <SelectItem key="Efectivo" value="Efectivo">Efectivo</SelectItem>
                  <SelectItem key="Transferencia" value="Transferencia">Transferencia</SelectItem>
                  <SelectItem key="Tarjeta" value="Tarjeta">Tarjeta</SelectItem>
                  <SelectItem key="Cheque" value="Cheque">Cheque</SelectItem>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 block">
                  Fecha de pago
                </label>
                <input
                  type="date"
                  value={formPago.fecha_pago}
                  onChange={(e) => setFormPago({ ...formPago, fecha_pago: e.target.value })}
                  className={`${inputBaseClasses} bg-white dark:bg-zinc-950 shadow-sm ${mostrarErrores && !isValidPaymentDate(formPago.fecha_pago) ? "border-rose-500 focus:ring-rose-500" : "focus:ring-emerald-500"} h-[52px]`}
                />
                {mostrarErrores && !isValidPaymentDate(formPago.fecha_pago) && (
                  <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">Fecha inválida</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 block">
                  Comentario (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Nota interna del pago..."
                  value={formPago.comentario}
                  onChange={(e) => setFormPago({ ...formPago, comentario: e.target.value })}
                  className={`${inputBaseClasses} bg-white dark:bg-zinc-950 shadow-sm focus:ring-emerald-500 h-[52px]`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta Inferior: Vista Previa FIFO */}
        <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-zinc-800">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <HiDocumentText className="w-4 h-4" /> Distribución FIFO
            </h4>
          </div>
          
          <Table 
            aria-label="Vista previa FIFO" 
            removeWrapper
            classNames={{ 
              th: "bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800", 
              td: "text-sm font-medium text-slate-600 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/50 py-4" 
            }}
          >
            <TableHeader>
              <TableColumn>FACTURA</TableColumn>
              <TableColumn>PERIODO</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn>SALDO</TableColumn>
              <TableColumn className="text-right">APLICADO</TableColumn>
              <TableColumn className="text-right">RESTANTE</TableColumn>
            </TableHeader>
            <TableBody items={preview.aplicaciones} emptyContent="Ingrese un monto para visualizar la distribución automática">
              {(item) => (
                <TableRow key={item.factura_id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/30">
                  <TableCell className="font-bold text-slate-800 dark:text-zinc-100">#{item.factura_id}</TableCell>
                  <TableCell>{item.periodo}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-200/50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                      {item.estado}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-slate-500">${item.saldo_antes.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right font-mono font-black text-emerald-600 dark:text-emerald-400">${item.monto_aplicado.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-slate-800 dark:text-zinc-100">${item.saldo_despues.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Resumen Final de la Tabla (Regla de Tintes) */}
          <div className="bg-slate-100/50 dark:bg-zinc-900 p-6 flex flex-wrap items-center gap-4">
            <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide">
                Facturas: <span className="font-black ml-1">{preview.aplicaciones.length}</span>
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide">
                Aplicado: <span className="font-black ml-1">${preview.montoAplicado.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wide">
                Cambio: <span className="font-black ml-1">${cambio.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
              </p>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button 
          className="font-bold bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6" 
          onPress={handleCerrar}
        >
          Cancelar
        </Button>
        <Button 
          className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-8 shadow-sm" 
          onPress={handleConfirmar}
        >
          Revisar y Cobrar
        </Button>
      </ModalFooter>
    </>
  );

  const renderConfirmacion = () => (
    <>
      <ModalHeader className="flex items-center gap-4 border-none pb-0 pt-8 px-8">
        <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl p-4">
          <HiExclamation className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
            Confirmar Cobro
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">Verifique los montos antes de procesar</p>
        </div>
      </ModalHeader>
      
      <ModalBody className="py-8 px-8">
        <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6 text-slate-600 dark:text-zinc-300">
            <HiUser className="w-5 h-5" /> 
            <span className="font-bold text-lg">{cliente.cliente_nombre}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 dark:border-zinc-800">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Total Recibido</p>
              <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">${toMoney(formPago.cantidad_entregada).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Facturas a Saldar</p>
              <p className="text-4xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">{preview.aplicaciones.length}</p>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="border-none pb-8 px-8 pt-0">
        <Button 
          className="font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 rounded-xl px-6" 
          onPress={() => setEstadoPago("formulario")}
        >
          Atrás
        </Button>
        <Button 
          className="font-bold bg-blue-600 text-white rounded-xl px-8 shadow-sm" 
          onPress={handleProcesar}
        >
          Confirmar Pago
        </Button>
      </ModalFooter>
    </>
  );

  const renderProcesando = () => (
    <ModalBody className="flex flex-col items-center justify-center py-24">
      <Spinner size="lg" color="primary" classNames={{ circle1: "border-b-blue-600", circle2: "border-b-blue-600" }} />
      <h3 className="mt-6 text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">Procesando Transacción</h3>
      <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-2">Aplicando distribución FIFO...</p>
    </ModalBody>
  );

  const renderExito = () => (
    <>
      <ModalBody className="py-12 px-8 flex flex-col items-center text-center">
        <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full p-6 mb-6">
          <HiCheck className="w-16 h-16" />
        </div>
        <h3 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 mb-2">
          Cobro Exitoso
        </h3>
        <p className="text-base font-medium text-slate-500 dark:text-zinc-400 mb-8">
          La distribución se aplicó correctamente a la cuenta.
        </p>

        <div className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 grid grid-cols-2 gap-4 text-left">
          <div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Afectadas</p>
             <p className="text-xl font-black text-slate-800 dark:text-zinc-100">{resultadoPago?.data?.facturas_afectadas || preview.aplicaciones.length} Facturas</p>
          </div>
          <div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Monto Aplicado</p>
             <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">${toMoney(resultadoPago?.data?.monto_aplicado || preview.montoAplicado).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className="border-none pb-8 px-8 pt-0">
        <Button 
          className="w-full font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl py-6 text-lg shadow-sm" 
          onPress={handleCerrar}
        >
          Finalizar y Cerrar
        </Button>
      </ModalFooter>
    </>
  );

  const renderError = () => (
    <>
      <ModalBody className="py-12 px-8 flex flex-col items-center text-center">
        <div className="bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full p-6 mb-6">
          <HiX className="w-16 h-16" />
        </div>
        <h3 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 mb-2">
          Error en la transacción
        </h3>
        <p className="text-base font-medium text-rose-600 dark:text-rose-400">
          {resultadoPago?.mensaje || "Ocurrió un error inesperado al procesar."}
        </p>
      </ModalBody>
      <ModalFooter className="border-none pb-8 px-8 pt-0 flex justify-center gap-4">
        <Button 
          className="font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 rounded-xl px-8" 
          onPress={() => setEstadoPago("confirmacion")}
        >
          Reintentar
        </Button>
        <Button 
          className="font-bold bg-rose-600 text-white rounded-xl px-8 shadow-sm" 
          onPress={handleCerrar}
        >
          Cancelar Cobro
        </Button>
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
      backdrop="blur"
      scrollBehavior="inside"
      isDismissable={estadoPago !== "procesando"}
      classNames={{
        backdrop: "bg-slate-900/40 backdrop-blur-sm",
        base: "bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-2xl",
        header: "border-b border-slate-100 dark:border-zinc-800/50 pb-4 pt-6 px-8",
        body: "px-8 py-6",
        footer: "border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8",
        closeButton: "hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 text-slate-400 p-2 top-4 right-4"
      }}
    >
      <ModalContent>{renderContenido()}</ModalContent>
    </Modal>
  );
};

export default ModalPagoDistribuidoCliente;
