import { Modal, ModalHeader, ModalBody, ModalFooter } from "flowbite-react";
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

const premiumModalTheme = {
  root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80 mt-10", off: "hidden" } },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-2xl w-full"
  },
  header: {
    base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/50 px-8 py-6 rounded-t-2xl shrink-0",
    close: { base: "inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer", icon: "h-5 w-5" }
  },
  body: { base: "px-8 py-6 flex-1 overflow-y-auto" },
  footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8 rounded-b-2xl shrink-0" }
};

const inputClasses = "w-full bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 h-11 text-sm font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 transition-all";
const labelClasses = "block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5";

const formatearMoneda = (monto) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(monto || 0);

const formatearFecha = (fecha) => {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
};

const ModalPagoParcialidad = ({ isOpen, onClose, parcialidad, convenio, onConfirmarPago }) => {
  const { token: authToken } = useAuth();
  const token = authToken || localStorage.getItem("token");

  const [formPago, setFormPago] = useState({ cantidad_entregada: "", metodo_pago: "Efectivo", comentario: "" });
  const [erroresCampos, setErroresCampos] = useState({});
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [estadoPago, setEstadoPago] = useState("formulario");
  const [resultadoPago, setResultadoPago] = useState(null);

  const sugerenciasPago = useMemo(() => {
    if (!parcialidad?.monto_esperado) return [];
    const monto = parseFloat(parcialidad.monto_esperado);
    const sugerencias = new Set();
    sugerencias.add(monto);
    if (monto % 10 !== 0) sugerencias.add(Math.ceil(monto / 10) * 10);
    if (monto % 50 !== 0) sugerencias.add(Math.ceil(monto / 50) * 50);
    if (monto % 100 !== 0) sugerencias.add(Math.ceil(monto / 100) * 100);
    [20, 50, 100, 200, 500, 1000].forEach((b) => { if (b > monto) sugerencias.add(b); });
    return Array.from(sugerencias).sort((a, b) => a - b).slice(0, 5);
  }, [parcialidad]);

  const cambio = useMemo(() => {
    if (!formPago.cantidad_entregada || !parcialidad?.monto_esperado) return 0;
    return Math.max(0, parseFloat(formPago.cantidad_entregada) - parseFloat(parcialidad.monto_esperado));
  }, [formPago.cantidad_entregada, parcialidad]);

  useEffect(() => {
    if (isOpen && parcialidad) {
      setFormPago({ cantidad_entregada: "", metodo_pago: "Efectivo", comentario: "" });
      setErroresCampos({});
      setMostrarErrores(false);
      setEstadoPago("formulario");
      setResultadoPago(null);
    }
  }, [isOpen, parcialidad]);

  const handleConfirmar = async () => {
    setMostrarErrores(true);
    const nuevosErrores = {};
    if (!formPago.cantidad_entregada || parseFloat(formPago.cantidad_entregada) <= 0) nuevosErrores.cantidad_entregada = true;
    if (!formPago.metodo_pago) nuevosErrores.metodo_pago = true;

    const montoEsperado = parseFloat(parcialidad.monto_esperado);
    const cantidadEntregada = parseFloat(formPago.cantidad_entregada);
    if (cantidadEntregada < montoEsperado) {
      nuevosErrores.cantidad_entregada = true;
      alert(`La cantidad entregada debe ser al menos ${formatearMoneda(montoEsperado)}`);
      return;
    }
    if (Object.keys(nuevosErrores).length > 0) { setErroresCampos(nuevosErrores); return; }

    setEstadoPago("procesando");
    try {
      const dataPago = {
        parcialidad_id: parcialidad.id,
        cantidad_entregada: parseFloat(formPago.cantidad_entregada),
        metodo_pago: formPago.metodo_pago,
        comentario: formPago.comentario || null
      };
      const resultado = await window.api.deudores.pagarParcialidad(token, dataPago);
      setResultadoPago(resultado);
      setEstadoPago("exitoso");
      setTimeout(() => {
        if (onConfirmarPago) onConfirmarPago(resultado);
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error al pagar parcialidad:", error);
      setEstadoPago("error");
      setResultadoPago({ error: error.message || "Error al procesar el pago" });
    }
  };

  if (!parcialidad) return null;

  return (
    <Modal
      show={isOpen}
      onClose={onClose}
      size="2xl"
      theme={premiumModalTheme}
      dismissible={estadoPago === "formulario"}
    >
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <HiCurrencyDollar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
              Pagar Parcialidad #{parcialidad.numero_parcialidad}
            </h2>
            {convenio && (
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
                Cliente: {convenio.cliente_nombre}
              </p>
            )}
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        {estadoPago === "formulario" && (
          <div className="space-y-5">
            {/* Info parcialidad */}
            <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Monto a Pagar</p>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatearMoneda(parcialidad.monto_esperado)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Fecha de Vencimiento</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <HiCalendar className="text-slate-400 w-4 h-4" />
                  <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{formatearFecha(parcialidad.fecha_vencimiento)}</p>
                </div>
              </div>
            </div>

            {/* Sugerencias */}
            {sugerenciasPago.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">Sugerencias de pago:</p>
                <div className="flex flex-wrap gap-2">
                  {sugerenciasPago.map((sugerencia) => (
                    <button
                      key={sugerencia}
                      type="button"
                      onClick={() => setFormPago((prev) => ({ ...prev, cantidad_entregada: sugerencia.toString() }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${parseFloat(formPago.cantidad_entregada) === sugerencia
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-emerald-400 hover:text-emerald-600"
                        }`}
                    >
                      {formatearMoneda(sugerencia)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cantidad entregada */}
            <div>
              <label className={labelClasses}>Cantidad Entregada</label>
              <div className="relative flex items-center">
                <HiCurrencyDollar className="absolute left-3.5 text-slate-400 pointer-events-none w-5 h-5" />
                <input
                  type="number"
                  placeholder="0.00"
                  value={formPago.cantidad_entregada}
                  onChange={(e) => {
                    setFormPago((prev) => ({ ...prev, cantidad_entregada: e.target.value }));
                    if (erroresCampos.cantidad_entregada) setErroresCampos((prev) => ({ ...prev, cantidad_entregada: false }));
                  }}
                  className={`${inputClasses} pl-10 h-12 text-lg font-black ${mostrarErrores && erroresCampos.cantidad_entregada ? "border-rose-500 focus:ring-rose-500/20" : "focus:ring-emerald-500/20 focus:border-emerald-500"}`}
                />
              </div>
              {mostrarErrores && erroresCampos.cantidad_entregada && (
                <p className="text-xs font-semibold text-rose-500 mt-1">Ingrese una cantidad válida</p>
              )}
            </div>

            {/* Método de pago */}
            <div>
              <label className={labelClasses}>Método de Pago</label>
              <div className="relative flex items-center">
                <HiCreditCard className="absolute left-3.5 text-slate-400 pointer-events-none w-5 h-5" />
                <select
                  value={formPago.metodo_pago}
                  onChange={(e) => setFormPago((prev) => ({ ...prev, metodo_pago: e.target.value }))}
                  className={`${inputClasses} pl-10`}
                >
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
              <input
                type="text"
                placeholder="Agregar nota..."
                value={formPago.comentario}
                onChange={(e) => setFormPago((prev) => ({ ...prev, comentario: e.target.value }))}
                className={inputClasses}
              />
            </div>

            {/* Cambio */}
            {cambio > 0 && (
              <div className="bg-amber-500/10 dark:bg-amber-900/20 border border-amber-500/20 rounded-xl p-4 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Cambio a devolver:</span>
                <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{formatearMoneda(cambio)}</span>
              </div>
            )}
          </div>
        )}

        {estadoPago === "procesando" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-300 border-t-emerald-600" />
            <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">Procesando pago...</p>
          </div>
        )}

        {estadoPago === "exitoso" && resultadoPago && (
          <div className="bg-emerald-500/10 dark:bg-emerald-900/20 border border-emerald-500/20 rounded-2xl p-6">
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="rounded-full bg-emerald-500 text-white p-3 shadow-sm">
                <HiCheck className="text-3xl w-7 h-7" />
              </div>
              <div>
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">¡Pago Exitoso!</p>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-2">
                  Monto aplicado: <span className="font-bold text-slate-800 dark:text-zinc-100">{formatearMoneda(resultadoPago.monto_aplicado)}</span>
                </p>
                {resultadoPago.cambio > 0 && (
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">Cambio: {formatearMoneda(resultadoPago.cambio)}</p>
                )}
                {resultadoPago.convenio_completado && (
                  <span className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <HiCheck className="w-3.5 h-3.5" /> ¡Convenio Completado!
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {estadoPago === "error" && resultadoPago && (
          <div className="bg-rose-500/10 dark:bg-rose-900/20 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-600 dark:text-rose-400 font-medium text-sm">
            <HiX className="text-xl shrink-0" />
            <span>{resultadoPago.error}</span>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {estadoPago === "formulario" && (
          <>
            <button
              type="button"
              onClick={onClose}
              className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6 h-11 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmar}
              className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 h-11 shadow-sm transition-colors"
            >
              Confirmar Pago
            </button>
          </>
        )}
        {estadoPago === "error" && (
          <button
            type="button"
            onClick={onClose}
            className="font-bold bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 rounded-xl px-8 h-11 transition-colors"
          >
            Cerrar
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default ModalPagoParcialidad;
