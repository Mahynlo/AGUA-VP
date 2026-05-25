import { Modal } from "flowbite-react";
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

const premiumModalTheme = {
  root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" } },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-2xl w-full"
  },
  header: {
    base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/50 px-8 py-6 rounded-t-2xl shrink-0",
    close: { base: "absolute top-6 right-6 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
  },
  body: { base: "px-8 py-6 flex-1 overflow-y-auto" },
  footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8 rounded-b-2xl shrink-0" }
};

const inputClasses = "w-full bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 h-11 text-sm font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 transition-all";
const labelClasses = "block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5";

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
      <Modal.Header >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <HiExclamation className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Factura en Convenio de Pago</h3>
            <p className="text-sm font-normal text-slate-500 dark:text-zinc-400">
              Esta factura no se cobra como pago directo
            </p>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className="space-y-4">
          <div className="border-2 border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <HiExclamation className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Esta factura esta incluida en un convenio activo
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-200/80">
                  Para mantener consistencia de saldos, registra el pago desde Cobro Integrado (consumo del periodo + parcialidades del convenio).
                </p>
              </div>
            </div>
          </div>

          <div className="border border-blue-200 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-blue-700/60 dark:text-blue-400/60 uppercase tracking-wider">Total sugerido</p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {loadingResumen
                    ? "Calculando..."
                    : `$${toMoney(resumenCobro?.sugerencia_cobro?.total || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
                </p>
              </div>
              <button
                type="button"
                disabled={loadingResumen || !resumenCobro}
                onClick={() => setModalIntegradoOpen(true)}
                className="flex items-center gap-2 px-4 h-10 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-sm disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                <HiCalculator className="w-4 h-4" />
                Cobro Integrado
              </button>
            </div>
            <p className="text-xs text-blue-700/70 dark:text-blue-300/70 mt-2">
              Este cobro aplica en una sola operacion la parte de factura y la parte de convenio.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-4">
            <h5 className="font-semibold text-slate-800 dark:text-zinc-100 mb-3 text-sm">Informacion de la Factura</h5>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">Cliente</span>
                <p className="font-medium text-slate-800 dark:text-zinc-100">{factura.cliente_nombre}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">Factura #</span>
                <p className="font-medium text-slate-800 dark:text-zinc-100">{factura.id}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">Saldo</span>
                <p className="font-bold text-slate-800 dark:text-zinc-100">
                  ${toMoney(factura.saldo_pendiente).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">Estado</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  En Convenio
                </span>
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button type="button" onClick={handleCerrarModal} className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6 h-11">
          Cerrar
        </button>
      </Modal.Footer>
    </>
  );

  const renderFormulario = () => (
    <>
      <Modal.Header>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <HiCreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Realizar Pago — Factura #{factura.id}</h3>
            <p className="text-sm font-normal text-slate-500 dark:text-zinc-400">
              Total a pagar: <span className="font-bold text-slate-800 dark:text-white">${toMoney(factura.saldo_pendiente).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
            </p>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className="space-y-5">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-slate-200 dark:border-zinc-700/50">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Cliente</p>
              <p className="font-medium text-slate-800 dark:text-zinc-100">{factura.cliente_nombre}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Saldo Pendiente</p>
              <p className="text-xl font-black text-red-600 dark:text-red-400">
                ${toMoney(formPago.monto).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div>
            <label className={labelClasses}>Cantidad entregada por el cliente*</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-zinc-400 font-semibold text-lg pointer-events-none">$</span>
              <input
                type="number"
                placeholder="0.00"
                autoFocus
                value={formPago.cantidad_entregada}
                onChange={(e) => {
                  setFormPago({ ...formPago, cantidad_entregada: e.target.value });
                  limpiarError("cantidad_entregada");
                }}
                onKeyDown={(e) => { if (e.key === "Enter") handleConfirmar(); }}
                min="0"
                step="0.01"
                className={`${inputClasses} pl-8 text-2xl font-black h-14 ${mostrarErrores && erroresCampos.cantidad_entregada ? "border-red-500" : ""}`}
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
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all active:scale-95 ${toMoney(formPago.cantidad_entregada) === montoSugerido
                    ? "bg-green-600 text-white border-green-600 shadow-sm"
                    : "bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-green-400 hover:text-green-600"
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
              <p className="text-xs text-red-500 mt-1">Ingrese un monto valido</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Metodo de pago*</label>
              <div className="relative">
                <HiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={formPago.metodo_pago}
                  onChange={(e) => {
                    setFormPago({ ...formPago, metodo_pago: e.target.value });
                    limpiarError("metodo_pago");
                  }}
                  className={`${inputClasses} pl-9 ${mostrarErrores && erroresCampos.metodo_pago ? "border-red-500" : ""}`}
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClasses}>Fecha de pago*</label>
              <input
                type="date"
                value={formPago.fecha_pago}
                onChange={(e) => {
                  setFormPago({ ...formPago, fecha_pago: e.target.value });
                  limpiarError("fecha_pago");
                }}
                className={`${inputClasses} ${mostrarErrores && erroresCampos.fecha_pago ? "border-red-500" : ""}`}
              />
              {mostrarErrores && erroresCampos.fecha_pago && (
                <p className="text-xs text-red-500 mt-1">Ingrese una fecha de pago valida</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className={labelClasses}>Comentario (Opcional)</label>
              <input
                type="text"
                placeholder="Nota..."
                maxLength={MAX_COMENTARIO}
                value={formPago.comentario}
                onChange={(e) => {
                  setFormPago({ ...formPago, comentario: e.target.value });
                  limpiarError("comentario");
                }}
                className={`${inputClasses} ${mostrarErrores && erroresCampos.comentario ? "border-red-500" : ""}`}
              />
              <p className={`text-[11px] mt-1 ${mostrarErrores && erroresCampos.comentario ? "text-red-500" : "text-slate-500 dark:text-zinc-400"}`}>
                {String(formPago.comentario || "").length}/{MAX_COMENTARIO}
              </p>
            </div>
          </div>

          {cambio > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3 flex justify-between items-center">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium">
                <HiExclamation className="w-5 h-5" />
                <span>Cambio a entregar:</span>
              </div>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                ${toMoney(cambio).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button type="button" onClick={handleCerrarModal} className="font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl px-6 h-11">
          Cancelar
        </button>
        <button type="button" onClick={handleConfirmar} className="font-bold bg-green-600 text-white rounded-xl px-8 h-11 shadow-sm hover:bg-green-700 transition-colors">
          Cobrar
        </button>
      </Modal.Footer>
    </>
  );

  const renderConfirmacion = () => (
    <>
      <Modal.Header>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <HiExclamation className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Confirmar Pago — Factura #{factura.id}</h3>
            <p className="text-sm font-normal text-slate-500 dark:text-zinc-400">
              Revise los datos antes de procesar el pago
            </p>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/50 rounded-2xl p-5">
            <h4 className="font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-2 mb-4 text-sm">
              <HiUser className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Resumen del Pago
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">Cliente</span>
                <p className="font-semibold text-slate-800 dark:text-zinc-100">{factura.cliente_nombre}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">Saldo Pendiente</span>
                <p className="text-lg font-black text-red-600 dark:text-red-400">
                  ${toMoney(factura.saldo_pendiente).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">Cantidad Entregada</span>
                <p className="text-lg font-black text-green-600 dark:text-green-400">
                  ${toMoney(formPago.cantidad_entregada).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">Metodo de Pago</span>
                <p className="font-semibold text-slate-800 dark:text-zinc-100">{formPago.metodo_pago}</p>
              </div>
            </div>

            {cambio > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-700/50">
                <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3">
                  <HiCurrencyDollar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-xs font-bold text-amber-700/60 dark:text-amber-400/60 uppercase tracking-wider">Cambio a entregar</p>
                    <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                      ${toMoney(cambio).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-700/50">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Comentarios</span>
              <p className="text-sm text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-700/50">
                {formPago.comentario || "Sin comentarios"}
              </p>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button type="button" onClick={handleVolverFormulario} className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6 h-11">
          Volver al Formulario
        </button>
        <button type="button" onClick={handleProcesarPago} className="font-bold bg-blue-600 text-white rounded-xl px-8 h-11 shadow-sm hover:bg-blue-700 transition-colors">
          Confirmar y Procesar Pago
        </button>
      </Modal.Footer>
    </>
  );

  const renderProcesando = () => (
    <>
      <Modal.Header>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <HiCurrencyDollar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Procesando Pago...</h3>
            <p className="text-sm font-normal text-slate-500 dark:text-zinc-400">Por favor espere</p>
          </div>
        </div>
      </Modal.Header>
      <Modal.Body>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
          <p className="text-slate-500 dark:text-zinc-400">Procesando el pago...</p>
        </div>
      </Modal.Body>
    </>
  );

  const renderExito = () => (
    <>
      <Modal.Header>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <HiCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Pago Realizado con Exito</h3>
            <p className="text-sm font-normal text-slate-500 dark:text-zinc-400">El pago se proceso correctamente</p>
          </div>
        </div>
      </Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-800/30 flex flex-col items-center text-center">
            <div className="rounded-full bg-green-500 p-3 mb-3">
              <HiCheck className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-black text-green-700 dark:text-green-400 mb-1">
              ${toMoney(formPago.cantidad_entregada).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-green-600 dark:text-green-300 text-sm">Monto registrado</p>

            {cambio > 0 && (
              <div className="mt-4 p-3 bg-white dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700/50 w-full">
                <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Cambio Entregado</p>
                <p className="text-xl font-black text-slate-800 dark:text-zinc-100">
                  ${toMoney(cambio).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={generandoComprobante}
            onClick={handleImprimirComprobante}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-slate-200 dark:border-zinc-700/50 bg-slate-50 dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-60"
          >
            {generandoComprobante
              ? <><div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-600 rounded-full animate-spin" /> Generando comprobante...</>
              : <><HiDocumentText className="w-4 h-4" /> Imprimir Comprobante de Pago</>
            }
          </button>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" onClick={handleCerrarModal} className="w-full font-bold bg-blue-600 text-white rounded-xl px-8 h-11 shadow-sm hover:bg-blue-700 transition-colors">
          Finalizar
        </button>
      </Modal.Footer>
    </>
  );

  const renderError = () => (
    <>
      <Modal.Body>
        <div className="flex flex-col items-center text-center space-y-4 py-8">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
            <HiX className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Error al Procesar</h3>
          <p className="text-slate-600 dark:text-zinc-300">{resultadoPago?.mensaje || "Error inesperado"}</p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" onClick={handleReintentar} className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6 h-11">
          Reintentar
        </button>
        <button type="button" onClick={handleCerrarModal} className="font-bold bg-red-600 text-white rounded-xl px-8 h-11 shadow-sm">
          Cerrar
        </button>
      </Modal.Footer>
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
        show={isOpen}
        onClose={estadoPago === "procesando" ? undefined : handleCerrarModal}
        theme={premiumModalTheme}
        dismissible={estadoPago !== "procesando"}
      >
        {renderContenido()}
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
