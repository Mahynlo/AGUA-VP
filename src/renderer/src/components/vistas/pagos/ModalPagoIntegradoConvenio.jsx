import { Modal } from "flowbite-react";
import { useEffect, useMemo, useState } from "react";
import {
  HiCurrencyDollar,
  HiCalculator,
  HiCreditCard,
  HiCheck,
  HiX
} from "react-icons/hi";
import { useAuth } from "../../../context/AuthContext";

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
const selectClasses = "w-full bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 h-11 text-sm font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 transition-all";
const labelClasses = "block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5";

const toMoney = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100) / 100;
};

const formatearMoneda = (monto) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(toMoney(monto));

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
    return { facturaNum, convenioNum, aplicado, entregado, cambio };
  }, [montoFactura, montoConvenio, cantidadEntregada]);

  const handleConfirmar = async () => {
    setError(null);
    if (!convenioId) { setError("No se encontró el convenio a cobrar"); return; }
    if (totales.facturaNum <= 0 && totales.convenioNum <= 0) { setError("Debes capturar monto para factura, convenio o ambos"); return; }
    if (totales.facturaNum > 0 && !resumenCobro?.factura_actual?.id) { setError("No hay factura activa para aplicar el monto de consumo"); return; }
    if (totales.facturaNum > saldoFacturaDisponible) { setError(`El monto a factura no puede exceder ${formatearMoneda(saldoFacturaDisponible)}`); return; }
    if (totales.entregado <= 0 || totales.entregado < totales.aplicado) { setError("La cantidad entregada debe cubrir el total aplicado"); return; }

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
      if (onPagoExitoso) await onPagoExitoso(resultado);
      onClose();
    } catch (err) {
      console.error("Error en pago integrado:", err);
      setError(err.message || "Error procesando pago integrado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} theme={premiumModalTheme} dismissible={false}>
      <Modal.Header>
        <div className="flex items-center gap-2">
          <HiCalculator className="text-2xl text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
            Cobro Integrado
          </h2>
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
          Cobrar consumo del periodo y parcialidades del convenio en una sola operación
        </p>
      </Modal.Header>

      <Modal.Body>
        <div className="space-y-5">
          {/* Resumen sugerido */}
          <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Consumo del periodo</p>
              <p className="text-base font-semibold text-blue-600 dark:text-blue-400">
                {formatearMoneda(resumenCobro?.sugerencia_cobro?.monto_factura || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Parcialidad convenio</p>
              <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                {formatearMoneda(resumenCobro?.sugerencia_cobro?.monto_convenio || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Sugerido total</p>
              <p className="text-base font-semibold text-amber-600 dark:text-amber-400">
                {formatearMoneda(resumenCobro?.sugerencia_cobro?.total || 0)}
              </p>
            </div>
          </div>

          {/* Monto factura */}
          <div>
            <label className={labelClasses}>Monto a factura (consumo)</label>
            <div className="relative">
              <HiCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="number" value={montoFactura} onChange={(e) => setMontoFactura(e.target.value)} className={`${inputClasses} pl-9`} />
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
              {resumenCobro?.factura_actual
                ? `Factura #${resumenCobro.factura_actual.id} · Saldo: ${formatearMoneda(saldoFacturaDisponible)}`
                : "No hay factura activa del periodo"}
            </p>
          </div>

          {/* Monto convenio */}
          <div>
            <label className={labelClasses}>Monto a convenio</label>
            <div className="relative">
              <HiCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="number" value={montoConvenio} onChange={(e) => setMontoConvenio(e.target.value)} className={`${inputClasses} pl-9`} />
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Puedes pagar una o varias parcialidades completas</p>
          </div>

          {/* Cantidad entregada */}
          <div>
            <label className={labelClasses}>Cantidad entregada</label>
            <div className="relative">
              <HiCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="number" value={cantidadEntregada} onChange={(e) => setCantidadEntregada(e.target.value)} className={`${inputClasses} pl-9`} />
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <label className={labelClasses}>Método de pago</label>
            <div className="relative">
              <HiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className={`${selectClasses} pl-9`}>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Comentario */}
          <div>
            <label className={labelClasses}>Comentario (opcional)</label>
            <input type="text" value={comentario} onChange={(e) => setComentario(e.target.value)} className={inputClasses} placeholder="Nota..." />
          </div>

          {/* Totales */}
          <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Aplicado</p>
              <p className="font-semibold text-slate-800 dark:text-zinc-100">{formatearMoneda(totales.aplicado)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Entregado</p>
              <p className="font-semibold text-slate-800 dark:text-zinc-100">{formatearMoneda(totales.entregado)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Cambio</p>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${totales.cambio > 0 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-slate-200/50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"}`}>
                {formatearMoneda(totales.cambio)}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium">
              <HiX className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button type="button" onClick={onClose} className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6 h-11">
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirmar}
          disabled={loading}
          className="font-bold bg-blue-600 text-white rounded-xl px-8 h-11 shadow-sm flex items-center gap-2 disabled:opacity-70"
        >
          {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {!loading && <HiCheck className="w-4 h-4" />}
          {loading ? "Procesando..." : "Confirmar Cobro Integrado"}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalPagoIntegradoConvenio;
