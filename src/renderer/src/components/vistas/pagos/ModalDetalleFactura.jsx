import { Modal } from "flowbite-react";
import {
  HiUser,
  HiCreditCard,
  HiCog,
  HiCalendar,
  HiCurrencyDollar,
  HiLocationMarker,
  HiPhone,
  HiCash,
  HiChartBar
} from "react-icons/hi";

const premiumModalTheme = {
  root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" } },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-3xl w-full"
  },
  header: {
    base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/50 px-8 py-6 rounded-t-2xl shrink-0",
    close: { base: "absolute top-6 right-6 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
  },
  body: { base: "px-6 py-6 flex-1 overflow-y-auto" },
  footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8 rounded-b-2xl shrink-0" }
};

const ModalDetalleFactura = ({ isOpen, onClose, factura }) => {
  if (!factura) return null;

  const getEstadoConfig = (estado) => {
    switch (estado?.toLowerCase()) {
      case "pagado":
        return { label: "Pagada", bg: "bg-green-500/10 dark:bg-green-500/20", iconText: "text-green-600 dark:text-green-400", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
      case "pendiente":
        return { label: "Pendiente", bg: "bg-orange-500/10 dark:bg-orange-500/20", iconText: "text-orange-600 dark:text-orange-400", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
      case "vencida":
      case "vencido":
        return { label: "Vencida", bg: "bg-red-500/10 dark:bg-red-500/20", iconText: "text-red-600 dark:text-red-400", badge: "bg-red-500/10 text-red-600 dark:text-red-400" };
      default:
        return { label: estado || "Desconocido", bg: "bg-slate-500/10 dark:bg-slate-500/20", iconText: "text-slate-600 dark:text-slate-400", badge: "bg-slate-200/50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400" };
    }
  };

  const estadoConfig = getEstadoConfig(factura.estado);

  const parseFechaLocal = (valor) => {
    if (!valor) return null;
    const match = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    const parsed = new Date(valor);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatFecha = (fecha) => {
    if (!fecha) return "No registrada";
    const parsedDate = parseFechaLocal(fecha);
    if (!parsedDate) return "No registrada";
    return parsedDate.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <Modal show={isOpen} onClose={onClose} theme={premiumModalTheme} dismissible>
      {/* HEADER */}
      <Modal.Header>
        <div className="flex items-center justify-between gap-4 w-full pr-8">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${estadoConfig.bg} ${estadoConfig.iconText}`}>
              <HiCreditCard className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                Detalle de Factura
              </h2>
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Folio: #{factura.id}
              </span>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${estadoConfig.badge}`}>
            {estadoConfig.label}
          </span>
        </div>
      </Modal.Header>

      {/* BODY */}
      <Modal.Body>
        <div className="space-y-6">
          {/* 1. Desglose Económico */}
          <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-5">
            <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-4 uppercase tracking-wider flex items-center gap-2">
              <HiCurrencyDollar className="w-4 h-4" /> Desglose Económico
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700/50">
                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Total Facturado</span>
                <span className="text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">
                  ${factura.total?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className={`p-4 rounded-xl border flex flex-col justify-center ${factura.saldo_pendiente > 0
                ? "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30"
                : "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30"
                }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${factura.saldo_pendiente > 0 ? "text-red-700/60 dark:text-red-500/60" : "text-green-700/60 dark:text-green-500/60"}`}>
                    Saldo Pendiente
                  </span>
                  {factura.saldo_pendiente <= 0 && <HiCash className="w-4 h-4 text-green-500" />}
                </div>
                <span className={`text-3xl font-black tracking-tight ${factura.saldo_pendiente > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                  ${factura.saldo_pendiente?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Fechas y Periodo */}
          <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-5">
            <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-4 uppercase tracking-wider flex items-center gap-2">
              <HiCalendar className="w-4 h-4" /> Fechas y Periodo
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6">
              <div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Periodo Facturado</span>
                <span className="text-sm font-bold text-slate-800 dark:text-zinc-100 capitalize">
                  {factura.mes_facturado || "No especificado"}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Vencimiento</span>
                <span className={`text-sm font-bold ${factura.estado?.toLowerCase().includes("vencid") ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-zinc-100"}`}>
                  {formatFecha(factura.fecha_vencimiento)}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Consumo Registrado</span>
                <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/30 w-fit">
                  <HiChartBar className="w-3.5 h-3.5" />
                  <span className="text-sm font-bold font-mono">
                    {factura.consumo_m3} <span className="text-[10px] font-semibold opacity-70">m³</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Cliente y Servicio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-5 flex flex-col">
              <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                <HiUser className="w-4 h-4" /> Datos del Cliente
              </h4>
              <div className="space-y-4 flex-1">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Nombre Completo</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-zinc-100 block">{factura.cliente_nombre}</span>
                </div>
                <div className="flex items-start gap-2">
                  <HiLocationMarker className="w-4 h-4 text-slate-400 dark:text-zinc-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Dirección</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 leading-snug block">
                      {factura.direccion_cliente || "No registrada"}
                    </span>
                  </div>
                </div>
                {factura.telefono_cliente && (
                  <div className="flex items-center gap-2">
                    <HiPhone className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" />
                    <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">{factura.telefono_cliente}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-blue-200/60 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl p-5 flex flex-col">
              <h4 className="text-xs font-bold text-blue-700/60 dark:text-blue-500/60 mb-4 uppercase tracking-wider flex items-center gap-2">
                <HiCog className="w-4 h-4" /> Datos del Servicio
              </h4>
              <div className="space-y-4 flex-1">
                <div>
                  <span className="text-[11px] font-bold text-blue-700/60 dark:text-blue-500/60 uppercase tracking-wider block mb-1">Medidor</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-zinc-100 font-mono bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-blue-100 dark:border-zinc-700 w-fit block">
                    {factura.medidor?.numero_serie || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-blue-700/60 dark:text-blue-500/60 uppercase tracking-wider block mb-1">Tarifa Aplicada</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 block">{factura.tarifa_nombre || "No especificada"}</span>
                </div>
                <div className="mt-auto pt-4 border-t border-blue-100/50 dark:border-blue-900/30">
                  <span className="text-[11px] font-bold text-blue-700/60 dark:text-blue-500/60 uppercase tracking-wider block mb-1">Ruta de Lectura</span>
                  <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 block truncate">{factura.ruta?.nombre || "Sin ruta asignada"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          onClick={onClose}
          className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6 h-11"
        >
          Cerrar
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalDetalleFactura;
