import { Modal } from "flowbite-react";
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
      size="6xl"
      theme={premiumModalTheme}
      dismissible={estadoPago === "formulario"}
    >
      <Modal.Header>
        <div className="flex items-center gap-2">
          <HiCurrencyDollar className="text-2xl text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
            Pagar Parcialidad #{parcialidad.numero_parcialidad}
          </h2>
        </div>
        {convenio && (
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
            Cliente: {convenio.cliente_nombre}
          </p>
        )}
      </Modal.Header>

      <Modal.Body>
        {estadoPago === "formulario" && (
          <div className="space-y-5">
            {/* Info parcialidad */}
            <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Monto a Pagar</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {formatearMoneda(parcialidad.monto_esperado)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Fecha de Vencimiento</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <HiCalendar className="text-slate-400 w-4 h-4" />
                  <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">{formatearFecha(parcialidad.fecha_vencimiento)}</p>
                </div>
              </div>
            </div>

            {/* Sugerencias */}
            {sugerenciasPago.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-zinc-400 mb-2">Sugerencias de pago:</p>
                <div className="flex flex-wrap gap-2">
                  {sugerenciasPago.map((sugerencia) => (
                    <button
                      key={sugerencia}
                      type="button"
                      onClick={() => setFormPago((prev) => ({ ...prev, cantidad_entregada: sugerencia.toString() }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${parseFloat(formPago.cantidad_entregada) === sugerencia
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-blue-400 hover:text-blue-600"
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
              <div className="relative">
                <HiCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="number"
                  placeholder="0.00"
                  value={formPago.cantidad_entregada}
                  onChange={(e) => {
                    setFormPago((prev) => ({ ...prev, cantidad_entregada: e.target.value }));
                    if (erroresCampos.cantidad_entregada) setErroresCampos((prev) => ({ ...prev, cantidad_entregada: false }));
                  }}
                  className={`${inputClasses} pl-9 ${mostrarErrores && erroresCampos.cantidad_entregada ? "border-red-500" : ""}`}
                />
              </div>
              {mostrarErrores && erroresCampos.cantidad_entregada && (
                <p className="text-xs text-red-500 mt-1">Ingrese una cantidad válida</p>
              )}
            </div>

            {/* Método de pago */}
            <div>
              <label className={labelClasses}>Método de Pago</label>
              <div className="relative">
                <HiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={formPago.metodo_pago}
                  onChange={(e) => setFormPago((prev) => ({ ...prev, metodo_pago: e.target.value }))}
                  className={`${inputClasses} pl-9`}
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
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Cambio a devolver:</span>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatearMoneda(cambio)}</span>
              </div>
            )}
          </div>
        )}

        {estadoPago === "procesando" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
            <p className="text-slate-500 dark:text-zinc-400">Procesando pago...</p>
          </div>
        )}

        {estadoPago === "exitoso" && resultadoPago && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-6">
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="rounded-full bg-emerald-500 p-3">
                <HiCheck className="text-4xl text-white w-8 h-8" />
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">¡Pago Exitoso!</p>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
                  Monto aplicado: {formatearMoneda(resultadoPago.monto_aplicado)}
                </p>
                {resultadoPago.cambio > 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">Cambio: {formatearMoneda(resultadoPago.cambio)}</p>
                )}
                {resultadoPago.convenio_completado && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <HiCheck className="w-3.5 h-3.5" /> ¡Convenio Completado!
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {estadoPago === "error" && resultadoPago && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl p-4 flex items-center gap-2 text-red-600 dark:text-red-400">
            <HiX className="text-xl shrink-0" />
            <span>{resultadoPago.error}</span>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        {estadoPago === "formulario" && (
          <>
            <button type="button" onClick={onClose} className="font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl px-6 h-11">
              Cancelar
            </button>
            <button type="button" onClick={handleConfirmar} className="font-bold bg-blue-600 text-white rounded-xl px-8 h-11 shadow-sm">
              Confirmar Pago
            </button>
          </>
        )}
        {estadoPago === "error" && (
          <button type="button" onClick={onClose} className="font-bold bg-red-600 text-white rounded-xl px-8 h-11">
            Cerrar
          </button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ModalPagoParcialidad;
