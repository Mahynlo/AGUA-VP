import { Modal } from "flowbite-react";
import { useState, useEffect } from "react";
import {
  HiCurrencyDollar,
  HiCalendar,
  HiCheck,
  HiX,
  HiClock,
  HiDocumentText,
  HiCalculator
} from "react-icons/hi";
import { useAuth } from "../../../context/AuthContext";
import ModalPagoParcialidad from "./ModalPagoParcialidad";
import ModalPagoIntegradoConvenio from "./ModalPagoIntegradoConvenio";

const premiumModalTheme = {
  root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" } },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-4xl w-full"
  },
  header: {
    base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/50 px-8 py-6 rounded-t-2xl shrink-0",
    close: { base: "absolute top-6 right-6 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
  },
  body: { base: "px-8 py-6 flex-1 overflow-y-auto" },
  footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8 rounded-b-2xl shrink-0" }
};

const getEstadoBadge = (estado) => {
  switch (estado) {
    case "Pagada":
      return { cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: <HiCheck className="w-3 h-3" /> };
    case "Vencida":
      return { cls: "bg-red-500/10 text-red-600 dark:text-red-400", icon: <HiX className="w-3 h-3" /> };
    default:
      return { cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: <HiClock className="w-3 h-3" /> };
  }
};

const formatearFecha = (fecha) => {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
};

const formatearMoneda = (monto) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(monto || 0);

const ModalParcialidadesConvenio = ({ isOpen, onClose, convenioId, onPagoExitoso }) => {
  const { token: authToken } = useAuth();
  const token = authToken || localStorage.getItem("token");
  const [convenio, setConvenio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resumenCobro, setResumenCobro] = useState(null);
  const [loadingResumen, setLoadingResumen] = useState(false);

  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [parcialidadSeleccionada, setParcialidadSeleccionada] = useState(null);
  const [modalIntegradoOpen, setModalIntegradoOpen] = useState(false);

  useEffect(() => {
    if (isOpen && convenioId) {
      cargarConvenio();
    }
  }, [isOpen, convenioId]);

  const cargarConvenio = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await window.api.deudores.obtenerConvenio(token, convenioId);
      setConvenio(data);

      const medidorId = data?.convenio?.medidor_id;
      if (medidorId) {
        await cargarResumenCobro(medidorId);
      } else {
        setResumenCobro(null);
      }
    } catch (err) {
      console.error("Error cargando convenio:", err);
      setError(err.message || "Error al cargar el convenio");
    } finally {
      setLoading(false);
    }
  };

  const cargarResumenCobro = async (medidorId) => {
    setLoadingResumen(true);
    try {
      const resumen = await window.api.deudores.fetchResumenCobroConvenio(token, medidorId);
      setResumenCobro(resumen);
    } catch (err) {
      console.error("Error cargando resumen de cobro:", err);
      setResumenCobro(null);
    } finally {
      setLoadingResumen(false);
    }
  };

  const handlePagarParcialidad = (parcialidad) => {
    setParcialidadSeleccionada(parcialidad);
    setModalPagoOpen(true);
  };

  const handlePagoExitoso = async () => {
    setModalPagoOpen(false);
    setParcialidadSeleccionada(null);
    await cargarConvenio();
    if (onPagoExitoso) onPagoExitoso();
  };

  const handlePagoIntegradoExitoso = async () => {
    setModalIntegradoOpen(false);
    await cargarConvenio();
    if (onPagoExitoso) onPagoExitoso();
  };

  return (
    <>
      <Modal show={isOpen} onClose={onClose} theme={premiumModalTheme} dismissible>
        <Modal.Header>
          <div className="flex items-center gap-2">
            <HiDocumentText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Convenio de Pago</h2>
              {convenio && (
                <p className="text-sm font-normal text-slate-500 dark:text-zinc-400">
                  {convenio.convenio.cliente_nombre} • Medidor: {convenio.convenio.numero_serie}
                </p>
              )}
            </div>
          </div>
        </Modal.Header>

        <Modal.Body>
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
              <p className="text-sm text-slate-500 dark:text-zinc-400">Cargando convenio...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-600 dark:text-red-400">
              <HiX className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {!loading && !error && convenio && (
            <div className="space-y-5">
              {/* Información del Convenio */}
              <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/50 rounded-2xl p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Estado</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${convenio.convenio.estado === "Activo" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-200/50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"}`}>
                      {convenio.convenio.estado}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Monto Total</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">{formatearMoneda(convenio.progreso.total)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Pagado</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatearMoneda(convenio.progreso.pagado)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Pendiente</p>
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatearMoneda(convenio.progreso.pendiente)}</p>
                  </div>
                </div>

                {/* Barra de Progreso */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Progreso del Convenio</p>
                    <p className="text-[10px] font-bold text-slate-600 dark:text-zinc-300">{convenio.progreso.porcentaje.toFixed(1)}%</p>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, convenio.progreso.porcentaje)}%` }}
                    />
                  </div>
                </div>

                <hr className="border-t border-slate-200 dark:border-zinc-700/50 mb-4" />

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Cobro combinado sugerido</p>
                    {loadingResumen ? (
                      <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Calculando...</p>
                    ) : (
                      <p className="text-base font-bold text-slate-800 dark:text-zinc-100">
                        {resumenCobro?.sugerencia_cobro?.total != null
                          ? formatearMoneda(resumenCobro.sugerencia_cobro.total)
                          : formatearMoneda(0)}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                      Incluye recibo del periodo + parcialidad del convenio
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={loadingResumen || !resumenCobro}
                    onClick={() => setModalIntegradoOpen(true)}
                    className="flex items-center gap-2 px-4 h-10 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-sm disabled:opacity-50 hover:bg-blue-700 transition-colors shrink-0"
                  >
                    <HiCalculator className="w-4 h-4" />
                    Cobro Integrado
                  </button>
                </div>
              </div>

              {/* Tabla de Parcialidades */}
              <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/50 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-zinc-700/50">
                        {["CUOTA", "MONTO", "VENCIMIENTO", "ESTADO", "FECHA PAGO", "ACCIÓN"].map((col) => (
                          <th key={col} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {convenio.parcialidades.map((parcialidad) => {
                        const badge = getEstadoBadge(parcialidad.estado);
                        return (
                          <tr key={parcialidad.id} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-white dark:hover:bg-zinc-900/30">
                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-zinc-100">
                              #{parcialidad.numero_parcialidad}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-zinc-300">
                              {formatearMoneda(parcialidad.monto_esperado)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                                <HiCalendar className="w-3.5 h-3.5" />
                                {formatearFecha(parcialidad.fecha_vencimiento)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.cls}`}>
                                {badge.icon}
                                {parcialidad.estado}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400 dark:text-zinc-500">
                              {parcialidad.fecha_pago ? formatearFecha(parcialidad.fecha_pago) : "-"}
                            </td>
                            <td className="px-4 py-3">
                              {parcialidad.estado === "Pendiente" && (
                                <button
                                  type="button"
                                  onClick={() => handlePagarParcialidad(parcialidad)}
                                  className="flex items-center gap-1 px-3 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-colors"
                                >
                                  <HiCurrencyDollar className="w-3.5 h-3.5" />
                                  Pagar
                                </button>
                              )}
                              {parcialidad.estado === "Pagada" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                  <HiCheck className="w-3 h-3" /> Pagada
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <button type="button" onClick={onClose} className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6 h-11">
            Cerrar
          </button>
        </Modal.Footer>
      </Modal>

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

      <ModalPagoIntegradoConvenio
        isOpen={modalIntegradoOpen}
        onClose={() => setModalIntegradoOpen(false)}
        resumenCobro={resumenCobro}
        convenioId={convenio?.convenio?.id || convenioId}
        onPagoExitoso={handlePagoIntegradoExitoso}
      />
    </>
  );
};

export default ModalParcialidadesConvenio;
