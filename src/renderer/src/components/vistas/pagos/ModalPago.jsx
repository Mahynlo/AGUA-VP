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
  Chip
} from "@nextui-org/react";
import { useState, useEffect, useMemo } from "react";
import ModalVistaPrevia from "../impresion/components/ModalVistaPrevia";
import ModalPagoIntegradoConvenio from "./ModalPagoIntegradoConvenio";
import {
  HiCurrencyDollar,
  HiCreditCard,
  HiUser,
  HiExclamation,
  HiCheck,
  HiX,
  HiCash,
  HiDocumentText,
  HiCalculator
} from "react-icons/hi";

const toMoney = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100) / 100;
};

const MAX_COMENTARIO = 500;

const isValidPaymentDate = (fecha) => {
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const parsed = new Date(`${fecha}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
};

const ModalPago = ({ isOpen, onClose, factura, onConfirmarPago, onPagoRegistrado }) => {
  const [formPago, setFormPago] = useState({
    monto: "",
    cantidad_entregada: "",
    metodo_pago: "Efectivo",
    comentario: "",
    fecha_pago: new Date().toISOString().split("T")[0]
  });

  const [erroresCampos, setErroresCampos] = useState({});
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [estadoPago, setEstadoPago] = useState("formulario");
  const [resultadoPago, setResultadoPago] = useState(null);

  const [comprobanteUrl, setComprobanteUrl] = useState(null);
  const [comprobantePrintUrl, setComprobantePrintUrl] = useState(null);
  const [generandoComprobante, setGenerandoComprobante] = useState(false);

  const [resumenCobro, setResumenCobro] = useState(null);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [modalIntegradoOpen, setModalIntegradoOpen] = useState(false);

  const sugerenciasPago = useMemo(() => {
    if (!factura?.saldo_pendiente) return [];
    const monto = toMoney(factura.saldo_pendiente);
    const sugerencias = new Set([monto]);

    if (monto % 10 !== 0) sugerencias.add(Math.ceil(monto / 10) * 10);
    if (monto % 50 !== 0) sugerencias.add(Math.ceil(monto / 50) * 50);
    if (monto % 100 !== 0) sugerencias.add(Math.ceil(monto / 100) * 100);

    [20, 50, 100, 200, 500, 1000].forEach((billete) => {
      if (billete > monto) sugerencias.add(billete);
    });

    return Array.from(sugerencias).sort((a, b) => a - b).slice(0, 5);
  }, [factura]);

  useEffect(() => {
    if (!isOpen || !factura) return;

    const esConvenio = factura.estado === "En Convenio" || !!factura.convenio_id;
    if (esConvenio) {
      setEstadoPago("bloqueado_convenio");
      const medidorId = factura.medidor_id || factura.medidor?.id || null;
      if (medidorId) {
        cargarResumenCobroConvenio(medidorId);
      } else {
        setResumenCobro(null);
      }
      return;
    }

    setFormPago({
      monto: factura.saldo_pendiente?.toString() || "",
      cantidad_entregada: "",
      metodo_pago: "Efectivo",
      comentario: "",
      fecha_pago: new Date().toISOString().split("T")[0]
    });
    setErroresCampos({});
    setMostrarErrores(false);
    setEstadoPago("formulario");
    setResultadoPago(null);
    setResumenCobro(null);
  }, [isOpen, factura]);

  const cargarResumenCobroConvenio = async (medidorId) => {
    setLoadingResumen(true);
    try {
      const token = localStorage.getItem("token");
      const resumen = await window.api.deudores.fetchResumenCobroConvenio(token, medidorId);
      setResumenCobro(resumen);
    } catch (error) {
      console.error("Error cargando resumen de cobro de convenio:", error);
      setResumenCobro(null);
    } finally {
      setLoadingResumen(false);
    }
  };

  const limpiarError = (campo) => {
    if (erroresCampos[campo]) {
      setErroresCampos((prev) => ({ ...prev, [campo]: false }));
    }
  };

  const handleCerrarModal = () => {
    setFormPago({
      monto: "",
      cantidad_entregada: "",
      metodo_pago: "Efectivo",
      comentario: "",
      fecha_pago: new Date().toISOString().split("T")[0]
    });
    setErroresCampos({});
    setMostrarErrores(false);
    setEstadoPago("formulario");
    setResultadoPago(null);
    setComprobanteUrl(null);
    setComprobantePrintUrl(null);
    setModalIntegradoOpen(false);
    onClose();
  };

  const handleConfirmar = () => {
    setMostrarErrores(true);
    const nuevosErrores = {};

    if (!formPago.cantidad_entregada || toMoney(formPago.cantidad_entregada) <= 0) {
      nuevosErrores.cantidad_entregada = true;
    }

    if (!formPago.metodo_pago) {
      nuevosErrores.metodo_pago = true;
    }

    if (!isValidPaymentDate(formPago.fecha_pago)) {
      nuevosErrores.fecha_pago = true;
    }

    if (String(formPago.comentario || "").length > MAX_COMENTARIO) {
      nuevosErrores.comentario = true;
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresCampos(nuevosErrores);
      return;
    }

    setEstadoPago("confirmacion");
  };

  const handleProcesarPago = async () => {
    if (!isValidPaymentDate(formPago.fecha_pago) || String(formPago.comentario || "").length > MAX_COMENTARIO) {
      setMostrarErrores(true);
      setErroresCampos((prev) => ({
        ...prev,
        ...(isValidPaymentDate(formPago.fecha_pago) ? {} : { fecha_pago: true }),
        ...(String(formPago.comentario || "").length > MAX_COMENTARIO ? { comentario: true } : {})
      }));
      setEstadoPago("formulario");
      return;
    }

    setEstadoPago("procesando");
    try {
      const resultado = await onConfirmarPago(formPago);
      setResultadoPago({ exito: true, detalles: resultado });
      setEstadoPago("exito");
    } catch (error) {
      setResultadoPago({ exito: false, mensaje: error.message || "Error al procesar pago" });
      setEstadoPago("error");
    }
  };

  const handleVolverFormulario = () => {
    setEstadoPago("formulario");
    setMostrarErrores(false);
  };

  const handleReintentar = () => {
    setEstadoPago("confirmacion");
  };

  const handlePagoIntegradoExitoso = async () => {
    setModalIntegradoOpen(false);
    if (onPagoRegistrado) {
      await onPagoRegistrado();
    }
    handleCerrarModal();
  };

  const handleImprimirComprobante = async () => {
    if (!factura || generandoComprobante) return;
    setGenerandoComprobante(true);
    try {
      const saldoPendiente = toMoney(factura.saldo_pendiente || factura.total || 0);
      const cantidadEntregada = toMoney(formPago.cantidad_entregada || 0);
      const montoAplicado = Math.min(cantidadEntregada, saldoPendiente);
      const cambioCalculado = Math.max(0, cantidadEntregada - saldoPendiente);
      const saldoRestante = Math.max(0, saldoPendiente - cantidadEntregada);

      const datos = {
        folio_pago: resultadoPago?.detalles?.pago_id || "—",
        factura: {
          id: factura.id,
          cliente_nombre: factura.cliente_nombre,
          direccion_cliente: factura.direccion_cliente || "",
          periodo: factura.periodo || factura.mes_facturado || "—",
          tarifa_nombre: factura.tarifa_nombre || "—",
          consumo_m3: factura.consumo_m3 ?? "—",
          total: factura.total ?? factura.saldo_pendiente,
          saldo_restante: saldoRestante
        },
        pago: {
          monto: montoAplicado,
          cantidad_entregada: cantidadEntregada,
          metodo_pago: formPago.metodo_pago,
          comentario: formPago.comentario || "",
          fecha_pago: formPago.fecha_pago
        },
        cambio: cambioCalculado,
        fecha_hora_emision: new Date().toISOString()
      };

      const dataKey = await window.api.savePrintData(JSON.stringify(datos));
      const { protocol, origin, href } = window.location;
      const printUrl = protocol === "file:"
        ? `${href.split("#")[0]}#/comprobante-pago?print=true&dataKey=${dataKey}`
        : `${origin}/#/comprobante-pago?print=true&dataKey=${dataKey}`;

      const response = await window.api.previewComponent(printUrl);
      if (response?.success && response?.path) {
        setComprobantePrintUrl(printUrl);
        setComprobanteUrl(response.path);
      }
    } catch (err) {
      console.error("Error generando comprobante:", err);
      alert("Error al generar el comprobante: " + err);
    } finally {
      setGenerandoComprobante(false);
    }
  };

  if (!factura) return null;

  const cambio = toMoney(formPago.cantidad_entregada) - toMoney(factura.saldo_pendiente || 0);

  const renderBloqueadoConvenio = () => (
    <>
      <ModalHeader className="flex items-center gap-3 text-xl font-bold">
        <div className="p-2 bg-warning-100 dark:bg-warning-900 rounded-lg">
          <HiExclamation className="w-6 h-6 text-warning-600 dark:text-warning-400" />
        </div>
        <div>
          <h3>Factura en Convenio de Pago</h3>
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
            Esta factura no se cobra como pago directo
          </p>
        </div>
      </ModalHeader>

      <ModalBody className="space-y-6">
        <Card className="border-2 border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-950">
          <CardBody className="space-y-4">
            <div className="flex items-start gap-3">
              <HiExclamation className="w-6 h-6 text-warning-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-warning-900 dark:text-warning-100 mb-2">
                  Esta factura esta incluida en un convenio activo
                </h4>
                <p className="text-sm text-warning-800 dark:text-warning-200">
                  Para mantener consistencia de saldos, registra el pago desde Cobro Integrado (consumo del periodo + parcialidades del convenio).
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-blue-700 dark:text-blue-300">Total sugerido</p>
                <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {loadingResumen
                    ? "Calculando..."
                    : `$${toMoney(resumenCobro?.sugerencia_cobro?.total || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
                </p>
              </div>
              <Button
                color="primary"
                variant="flat"
                startContent={<HiCalculator className="w-4 h-4" />}
                isDisabled={loadingResumen || !resumenCobro}
                onPress={() => setModalIntegradoOpen(true)}
              >
                Cobro Integrado
              </Button>
            </div>
            <p className="text-xs text-blue-700/90 dark:text-blue-200/90">
              Este cobro aplica en una sola operacion la parte de factura y la parte de convenio.
            </p>
          </CardBody>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardBody>
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">Informacion de la Factura</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Cliente:</span>
                <p className="font-medium text-gray-900 dark:text-white">{factura.cliente_nombre}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Factura #:</span>
                <p className="font-medium text-gray-900 dark:text-white">{factura.id}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Saldo:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  ${toMoney(factura.saldo_pendiente).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Estado:</span>
                <Chip color="success" variant="flat" size="sm">En Convenio</Chip>
              </div>
            </div>
          </CardBody>
        </Card>
      </ModalBody>

      <ModalFooter>
        <Button color="default" variant="light" onPress={handleCerrarModal}>Cerrar</Button>
      </ModalFooter>
    </>
  );

  const renderFormulario = () => (
    <>
      <ModalHeader className="flex items-center gap-3 text-xl font-bold">
        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
          <HiCreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3>Realizar Pago - Factura #{factura.id}</h3>
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
            Total a pagar: <span className="font-bold text-gray-800 dark:text-white">${toMoney(factura.saldo_pendiente).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
          </p>
        </div>
      </ModalHeader>

      <ModalBody className="space-y-6">
        <Card className="border border-green-200 dark:border-green-800 shadow-sm">
          <CardBody className="space-y-5">
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Cliente</p>
                <p className="font-medium text-gray-800 dark:text-gray-200">{factura.cliente_nombre}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-semibold">Saldo Pendiente</p>
                <p className="text-xl font-bold text-red-600">${toMoney(formPago.monto).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Cantidad entregada por el cliente*
              </label>
              <div className="relative w-full flex">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg">
                  $
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  autoFocus
                  value={formPago.cantidad_entregada}
                  onChange={(e) => {
                    setFormPago({ ...formPago, cantidad_entregada: e.target.value });
                    limpiarError("cantidad_entregada");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirmar();
                  }}
                  min="0"
                  step="0.01"
                  className={`border ${mostrarErrores && erroresCampos.cantidad_entregada ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-600 focus:border-green-500"} text-gray-800 text-2xl font-bold rounded-xl pl-8 pr-4 py-3 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:border-gray-600 dark:text-white transition-all`}
                />
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {sugerenciasPago.map((montoSugerido) => (
                  <button
                    key={montoSugerido}
                    type="button"
                    onClick={() => {
                      setFormPago({ ...formPago, cantidad_entregada: montoSugerido.toString() });
                      limpiarError("cantidad_entregada");
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all transform active:scale-95 border ${toMoney(formPago.cantidad_entregada) === montoSugerido
                      ? "bg-green-600 text-white border-green-600 shadow-md"
                      : "bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:border-green-400 hover:text-green-600"
                      }`}
                  >
                    <span className="flex items-center gap-1">
                      <HiCash className={toMoney(formPago.cantidad_entregada) === montoSugerido ? "text-white" : "text-green-500"} />
                      ${montoSugerido}
                    </span>
                  </button>
                ))}
              </div>

              {mostrarErrores && erroresCampos.cantidad_entregada && (
                <p className="text-sm text-red-500 mt-1">Ingrese un monto valido</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Metodo de pago*
                </label>
                <Select
                  aria-label="Metodo de pago"
                  placeholder="Seleccionar"
                  selectedKeys={formPago.metodo_pago ? [formPago.metodo_pago] : []}
                  onChange={(e) => {
                    setFormPago({ ...formPago, metodo_pago: e.target.value });
                    limpiarError("metodo_pago");
                  }}
                  color="primary"
                  variant="bordered"
                  startContent={<HiCreditCard className="text-gray-400" />}
                  className="w-full"
                >
                  <SelectItem key="Efectivo" value="Efectivo" startContent={<HiCash />}>Efectivo</SelectItem>
                  <SelectItem key="Transferencia" value="Transferencia" startContent={<HiCreditCard />}>Transferencia</SelectItem>
                  <SelectItem key="Tarjeta" value="Tarjeta" startContent={<HiCreditCard />}>Tarjeta</SelectItem>
                  <SelectItem key="Cheque" value="Cheque" startContent={<HiDocumentText />}>Cheque</SelectItem>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Fecha de pago*
                </label>
                <input
                  type="date"
                  value={formPago.fecha_pago}
                  onChange={(e) => {
                    setFormPago({ ...formPago, fecha_pago: e.target.value });
                    limpiarError("fecha_pago");
                  }}
                  className={`border ${mostrarErrores && erroresCampos.fecha_pago ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"} rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:border-gray-600 dark:text-white`}
                />
                {mostrarErrores && erroresCampos.fecha_pago && (
                  <p className="text-sm text-red-500 mt-1">Ingrese una fecha de pago valida</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Comentario (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Nota..."
                  maxLength={MAX_COMENTARIO}
                  className={`border ${mostrarErrores && erroresCampos.comentario ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"} rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:border-gray-600 dark:text-white`}
                  value={formPago.comentario}
                  onChange={(e) => {
                    setFormPago({ ...formPago, comentario: e.target.value });
                    limpiarError("comentario");
                  }}
                />
                <p className={`text-[11px] mt-1 ${mostrarErrores && erroresCampos.comentario ? "text-red-500" : "text-slate-500 dark:text-zinc-400"}`}>
                  {String(formPago.comentario || "").length}/{MAX_COMENTARIO}
                </p>
              </div>
            </div>

            {cambio > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3 flex justify-between items-center animate-pulse-once">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-medium">
                  <HiExclamation className="w-5 h-5" />
                  <span>Cambio a entregar:</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  ${toMoney(cambio).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </CardBody>
        </Card>
      </ModalBody>

      <ModalFooter>
        <Button color="danger" variant="light" onPress={handleCerrarModal}>Cancelar</Button>
        <Button color="primary" onPress={handleConfirmar} className="font-bold px-8" shadow>
          Cobrar
        </Button>
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
          <h3>Confirmar Pago - Factura #{factura.id}</h3>
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
            Revise los datos antes de procesar el pago
          </p>
        </div>
      </ModalHeader>

      <ModalBody className="space-y-6">
        <Card className="border border-blue-200 dark:border-blue-800">
          <CardBody className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <HiUser className="w-5 h-5 text-blue-600" />
              Resumen del Pago
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cliente</label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{factura.cliente_nombre}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Saldo Pendiente</label>
                <p className="text-lg font-bold text-red-600">${toMoney(factura.saldo_pendiente).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad Entregada</label>
                <p className="text-lg font-bold text-green-600">${toMoney(formPago.cantidad_entregada).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Metodo de Pago</label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{formPago.metodo_pago}</p>
              </div>
            </div>

            {cambio > 0 && (
              <Card className="border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/30">
                <CardBody>
                  <div className="flex items-center gap-3">
                    <HiCurrencyDollar className="w-6 h-6 text-warning-600" />
                    <div>
                      <p className="text-sm font-semibold text-warning-700 dark:text-warning-300">Cambio a entregar:</p>
                      <p className="text-xl font-bold text-warning-600 dark:text-warning-400">
                        ${toMoney(cambio).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Comentarios</label>
              <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                {formPago.comentario || "Sin comentarios"}
              </p>
            </div>
          </CardBody>
        </Card>
      </ModalBody>

      <ModalFooter>
        <Button color="default" variant="light" onPress={handleVolverFormulario}>Volver al Formulario</Button>
        <Button color="primary" onPress={handleProcesarPago} className="font-medium">Confirmar y Procesar Pago</Button>
      </ModalFooter>
    </>
  );

  const renderProcesando = () => (
    <>
      <ModalHeader className="flex items-center gap-3 text-xl font-bold">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <HiCurrencyDollar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3>Procesando Pago...</h3>
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Por favor espere</p>
        </div>
      </ModalHeader>
      <ModalBody className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Procesando el pago...</p>
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
          <h3>Pago Realizado con Exito</h3>
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">El pago se proceso correctamente</p>
        </div>
      </ModalHeader>
      <ModalBody className="space-y-6">
        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-100 dark:border-green-800 flex flex-col items-center text-center">
          <HiCheck className="w-16 h-16 text-green-500 mb-2" />
          <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-1">
            ${toMoney(formPago.cantidad_entregada).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-green-600 dark:text-green-300">Monto registrado</p>

          {cambio > 0 && (
            <div className="mt-4 p-3 bg-white dark:bg-zinc-800 rounded-lg shadow-sm w-full">
              <p className="text-sm text-gray-500">Cambio Entregado</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                ${toMoney(cambio).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>

        <Button
          color="default"
          variant="flat"
          className="w-full font-medium"
          startContent={generandoComprobante ? null : <HiDocumentText className="w-4 h-4" />}
          isLoading={generandoComprobante}
          onPress={handleImprimirComprobante}
        >
          {generandoComprobante ? "Generando comprobante..." : "Imprimir Comprobante de Pago"}
        </Button>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onPress={handleCerrarModal} className="w-full font-bold">Finalizar</Button>
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
          <h3 className="text-xl font-bold text-red-600">Error al Procesar</h3>
          <p className="text-gray-600 dark:text-gray-300">{resultadoPago?.mensaje || "Error inesperado"}</p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="default" variant="light" onPress={handleReintentar}>Reintentar</Button>
        <Button color="danger" onPress={handleCerrarModal}>Cerrar</Button>
      </ModalFooter>
    </>
  );

  const renderContenido = () => {
    if (estadoPago === "bloqueado_convenio") return renderBloqueadoConvenio();
    if (estadoPago === "confirmacion") return renderConfirmacion();
    if (estadoPago === "procesando") return renderProcesando();
    if (estadoPago === "exito") return renderExito();
    if (estadoPago === "error") return renderError();
    return renderFormulario();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={estadoPago === "procesando" ? undefined : handleCerrarModal}
        size="2xl"
        backdrop="blur"
        scrollBehavior="inside"
        isDismissable={estadoPago !== "procesando"}
        classNames={{
          backdrop: "bg-black/60 backdrop-blur-sm",
          modal: "bg-white dark:bg-zinc-900 rounded-xl shadow-2xl",
          closeButton: "hover:bg-red-600 hover:text-white text-gray-600"
        }}
      >
        <ModalContent>{renderContenido()}</ModalContent>
      </Modal>

      <ModalPagoIntegradoConvenio
        isOpen={modalIntegradoOpen}
        onClose={() => setModalIntegradoOpen(false)}
        resumenCobro={resumenCobro}
        convenioId={factura?.convenio_id}
        onPagoExitoso={handlePagoIntegradoExitoso}
      />

      {comprobanteUrl && (
        <ModalVistaPrevia
          pdfUrl={comprobanteUrl}
          printUrl={comprobantePrintUrl}
          onClose={() => {
            setComprobanteUrl(null);
            setComprobantePrintUrl(null);
          }}
        />
      )}
    </>
  );
};

export default ModalPago;
