import { Modal, ModalHeader, ModalBody, ModalFooter } from "flowbite-react";
import { useEffect, useMemo, useState } from "react";
import {
  HiCreditCard,
  HiExclamation,
  HiCheck,
  HiX,
  HiUser,
  HiDocumentText
} from "react-icons/hi";
import { nowHermosilloDateStr } from "../../../utils/diasHabiles";
import { formatearPeriodo } from "../../../utils/periodoUtils";

const premiumModalTheme = {
  root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" } },
  content: {
    base: "relative h-full w-full p-1 sm:p-2 pt-16 sm:pt-20 md:h-auto",
    inner: "relative flex max-h-[calc(100dvh-4.25rem)] sm:max-h-[calc(100dvh-5.5rem)] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-[1400px] w-full"
  },
  header: {
    base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/50 px-6 py-4 rounded-t-2xl shrink-0",
    close: { base: "inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer", icon: "h-5 w-5" }
  },
  body: { base: "px-6 py-5 flex-1 overflow-y-auto custom-scrollbar" },
  footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/50 py-3 px-6 rounded-b-2xl shrink-0" }
};

const inputBaseClasses = "bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-medium text-slate-800 dark:text-zinc-100 shadow-sm";

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

  return { aplicaciones, montoAplicado, cambio };
};

// La cantidad empieza vacía: se captura lo que el cliente entregó (el botón «Total» llena la deuda completa)
const buildInitialFormPago = () => ({
  cantidad_entregada: "",
  metodo_pago: "Efectivo",
  comentario: "",
  fecha_pago: nowHermosilloDateStr()
});

const isValidPaymentDate = (fecha) => {
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const parsed = new Date(`${fecha}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
};

const fmt = (n) => `$${toMoney(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

/** Qué le pasa a una factura con este cobro (solo presentación) */
const resultadoFila = (fila) => {
  if (fila.monto_aplicado > 0 && fila.saldo_despues === 0) {
    return { texto: "Queda pagada", clase: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" };
  }
  if (fila.monto_aplicado > 0) {
    return { texto: "Abono parcial", clase: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" };
  }
  return { texto: "Sin abono", clase: "bg-slate-500/10 text-slate-500 dark:text-zinc-400 border-slate-500/20" };
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

  // Solo para mostrar: TODAS las facturas con saldo en el orden en que se aplica el pago (mismo
  // filtro y orden que buildPreview), con lo que recibe cada una. Lo que se envía sigue siendo `preview`.
  const filasDistribucion = useMemo(() => {
    if (!cliente) return [];
    const aplicadas = new Map(preview.aplicaciones.map((a) => [a.factura_id, a]));
    return sortFacturasFIFO(cliente.facturas || [])
      .filter((f) => toMoney(f.saldo_pendiente) > 0 && String(f.estado || "").toLowerCase() !== "pagado")
      .map((f, i) => {
        const saldo = toMoney(f.saldo_pendiente);
        const aplicado = aplicadas.get(f.id)?.monto_aplicado || 0;
        return {
          orden: i + 1,
          factura_id: f.id,
          periodo: f.periodo || f.mes_facturado || "Sin periodo",
          saldo_antes: saldo,
          monto_aplicado: aplicado,
          saldo_despues: toMoney(saldo - aplicado)
        };
      });
  }, [cliente, preview]);

  const deudaDespues = filasDistribucion.reduce((acc, f) => toMoney(acc + f.saldo_despues), 0);

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
      <ModalHeader>
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

      <ModalBody>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-6">
          {/* ── Columna izquierda: lo que entrega el cliente ── */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-rose-500/5 dark:bg-rose-900/10 border border-rose-500/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Deuda total</p>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400">
                ${toMoney(cliente.deuda_total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 block">
                Cantidad Entregada*
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-2xl">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formPago.cantidad_entregada}
                  onChange={(e) => setFormPago({ ...formPago, cantidad_entregada: e.target.value })}
                  className={`w-full bg-white dark:bg-zinc-950 border ${mostrarErrores && (!formPago.cantidad_entregada || toMoney(formPago.cantidad_entregada) <= 0) ? "border-rose-500 focus:ring-rose-500" : "border-slate-200 dark:border-zinc-800 focus:ring-emerald-500"} rounded-2xl pl-10 pr-4 py-3 text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  placeholder="0.00"
                />
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 block">
                  Método de pago*
                </label>
                <select
                  value={formPago.metodo_pago}
                  onChange={(e) => setFormPago({ ...formPago, metodo_pago: e.target.value })}
                  className={`${inputBaseClasses} h-[48px]`}
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 block">
                  Fecha de pago
                </label>
                <input
                  type="date"
                  value={formPago.fecha_pago}
                  onChange={(e) => setFormPago({ ...formPago, fecha_pago: e.target.value })}
                  className={`${inputBaseClasses} h-[48px] ${mostrarErrores && !isValidPaymentDate(formPago.fecha_pago) ? "border-rose-500 focus:ring-rose-500" : ""}`}
                />
                {mostrarErrores && !isValidPaymentDate(formPago.fecha_pago) && (
                  <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">Fecha inválida</p>
                )}
              </div>

              <div className="col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 block">
                  Comentario (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Nota interna del pago..."
                  value={formPago.comentario}
                  onChange={(e) => setFormPago({ ...formPago, comentario: e.target.value })}
                  className={`${inputBaseClasses} h-[48px]`}
                />
              </div>
            </div>
          </div>

          {/* ── Columna derecha: cómo se reparte el pago ── */}
          <div className="flex flex-col gap-4 min-w-0">
            {/* Resumen: recibido → se aplica → cambio */}
            <div className="grid grid-cols-3 gap-2">
              <div className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Recibido</p>
                <p className="text-lg font-black text-slate-800 dark:text-zinc-100 truncate">{fmt(formPago.cantidad_entregada || 0)}</p>
              </div>
              <div className="px-3 py-2.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                  Se aplica a {preview.aplicaciones.length} factura{preview.aplicaciones.length === 1 ? "" : "s"}
                </p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 truncate">{fmt(preview.montoAplicado)}</p>
              </div>
              <div className="px-3 py-2.5 rounded-xl bg-amber-500/5 dark:bg-amber-900/10 border border-amber-500/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Cambio a devolver</p>
                <p className="text-lg font-black text-amber-600 dark:text-amber-400 truncate">{fmt(cambio)}</p>
              </div>
            </div>

            {/* Tabla de reparto */}
            <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800">
                <h4 className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <HiDocumentText className="w-4 h-4" /> Cómo se reparte el pago
                </h4>
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1 leading-snug">
                  Se paga primero la factura <b>más antigua</b>. Cuando queda saldada, lo que sobra pasa a la siguiente, y así hasta
                  terminar el dinero. Lo que sobre al final es el cambio.
                </p>
              </div>

              <div className="overflow-auto max-h-[340px] lg:max-h-[calc(100dvh-27rem)] min-h-[200px] custom-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800">
                      {["ORDEN", "FACTURA", "PERIODO", "DEBE", "SE APLICA", "QUEDA DEBIENDO", "RESULTADO"].map((col) => (
                        <th key={col} className="sticky top-0 z-10 px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-900 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filasDistribucion.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-sm font-medium text-slate-400 dark:text-zinc-500">
                          El cliente no tiene facturas con saldo pendiente
                        </td>
                      </tr>
                    ) : (
                      filasDistribucion.map((fila) => {
                        const resultado = resultadoFila(fila);
                        const sinAbono = fila.monto_aplicado === 0;
                        return (
                          <tr key={fila.factura_id} className={`border-b border-slate-100 dark:border-zinc-800/50 ${sinAbono ? "opacity-60" : ""}`}>
                            <td className="px-3 py-2.5">
                              <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-slate-200/70 dark:bg-zinc-800 text-[11px] font-black text-slate-600 dark:text-zinc-300">
                                {fila.orden}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-zinc-100">#{fila.factura_id}</td>
                            <td className="px-3 py-2.5 font-medium text-slate-600 dark:text-zinc-300 whitespace-nowrap">{formatearPeriodo(fila.periodo)}</td>
                            <td className="px-3 py-2.5 font-mono text-slate-500 dark:text-zinc-400">{fmt(fila.saldo_antes)}</td>
                            <td className={`px-3 py-2.5 font-mono font-black ${sinAbono ? "text-slate-400 dark:text-zinc-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                              {sinAbono ? "—" : fmt(fila.monto_aplicado)}
                            </td>
                            <td className="px-3 py-2.5 font-mono font-bold text-slate-800 dark:text-zinc-100">{fmt(fila.saldo_despues)}</td>
                            <td className="px-3 py-2.5">
                              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${resultado.clase}`}>
                                {resultado.texto}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 bg-slate-100/60 dark:bg-zinc-900 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                <span className="text-slate-500 dark:text-zinc-400">
                  {preview.aplicaciones.length === 0
                    ? "Ingresa la cantidad entregada para ver cómo se reparte."
                    : `${filasDistribucion.filter((f) => f.monto_aplicado > 0 && f.saldo_despues === 0).length} de ${filasDistribucion.length} facturas quedan pagadas`}
                </span>
                <span className="text-slate-600 dark:text-zinc-300">
                  Deuda después del cobro: <span className={`font-black ${deudaDespues > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>{fmt(deudaDespues)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button type="button" onClick={handleCerrar} className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6 h-11">
          Cancelar
        </button>
        <button type="button" onClick={handleConfirmar} className="font-bold bg-slate-900 dark:bg-white text-white dark:text-zinc-950 rounded-xl px-8 h-11 shadow-sm">
          Revisar y Cobrar
        </button>
      </ModalFooter>
    </>
  );

  const renderConfirmacion = () => (
    <>
      <ModalHeader>
        <div className="flex items-center gap-4">
          <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl p-4">
            <HiExclamation className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
              Confirmar Cobro
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">Verifique los montos antes de procesar</p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-slate-600 dark:text-zinc-300">
            <div className="flex items-center gap-2">
              <HiUser className="w-5 h-5" />
              <span className="font-bold text-lg">{cliente.cliente_nombre}</span>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
              {formPago.metodo_pago} · {formPago.fecha_pago}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Total Recibido</p>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">
                ${toMoney(formPago.cantidad_entregada).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="px-4 py-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Se aplica</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{fmt(preview.montoAplicado)}</p>
            </div>
            <div className="px-4 py-3 rounded-xl bg-amber-500/5 dark:bg-amber-900/10 border border-amber-500/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Cambio</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">{fmt(cambio)}</p>
            </div>
            <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Facturas a Saldar</p>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">{preview.aplicaciones.length}</p>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
              Facturas que reciben dinero (de la más antigua a la más reciente)
            </div>
            <div className="max-h-[260px] lg:max-h-[calc(100dvh-30rem)] min-h-[120px] overflow-auto custom-scrollbar divide-y divide-slate-100 dark:divide-zinc-800/50">
              {filasDistribucion.filter((f) => f.monto_aplicado > 0).map((fila) => {
                const resultado = resultadoFila(fila);
                return (
                  <div key={fila.factura_id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-zinc-100">#{fila.factura_id}</span>
                      <span className="text-slate-500 dark:text-zinc-400">{formatearPeriodo(fila.periodo)}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{fmt(fila.monto_aplicado)}</span>
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${resultado.clase}`}>
                        {resultado.texto}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-200 dark:border-zinc-800 flex justify-end text-xs font-bold text-slate-600 dark:text-zinc-300">
              Deuda después del cobro:&nbsp;
              <span className={`font-black ${deudaDespues > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>{fmt(deudaDespues)}</span>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button type="button" onClick={() => setEstadoPago("formulario")} className="font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 rounded-xl px-6 h-11">
          Atrás
        </button>
        <button type="button" onClick={handleProcesar} className="font-bold bg-blue-600 text-white rounded-xl px-8 h-11 shadow-sm">
          Confirmar Pago
        </button>
      </ModalFooter>
    </>
  );

  const renderProcesando = () => (
    <ModalBody>
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
        <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">Procesando Transacción</h3>
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Aplicando distribución FIFO...</p>
      </div>
    </ModalBody>
  );

  const renderExito = () => (
    <>
      <ModalBody>
        <div className="py-12 flex flex-col items-center text-center">
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
              <p className="text-xl font-black text-slate-800 dark:text-zinc-100">
                {resultadoPago?.data?.facturas_afectadas || preview.aplicaciones.length} Facturas
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Monto Aplicado</p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                ${toMoney(resultadoPago?.data?.monto_aplicado || preview.montoAplicado).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <button type="button" onClick={handleCerrar} className="w-full font-bold bg-slate-900 dark:bg-white text-white dark:text-zinc-950 rounded-xl h-11 shadow-sm text-lg">
          Finalizar y Cerrar
        </button>
      </ModalFooter>
    </>
  );

  const renderError = () => (
    <>
      <ModalBody>
        <div className="py-12 flex flex-col items-center text-center">
          <div className="bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full p-6 mb-6">
            <HiX className="w-16 h-16" />
          </div>
          <h3 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 mb-2">
            Error en la transacción
          </h3>
          <p className="text-base font-medium text-rose-600 dark:text-rose-400">
            {resultadoPago?.mensaje || "Ocurrió un error inesperado al procesar."}
          </p>
        </div>
      </ModalBody>
      <ModalFooter>
        <button type="button" onClick={() => setEstadoPago("confirmacion")} className="font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 rounded-xl px-8 h-11">
          Reintentar
        </button>
        <button type="button" onClick={handleCerrar} className="font-bold bg-rose-600 text-white rounded-xl px-8 h-11 shadow-sm">
          Cancelar Cobro
        </button>
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
      show={isOpen}
      onClose={estadoPago === "procesando" ? undefined : handleCerrar}
      theme={premiumModalTheme}
      size="7xl"
      dismissible={estadoPago !== "procesando"}
    >
      {renderContenido()}
    </Modal>
  );
};

export default ModalPagoDistribuidoCliente;
