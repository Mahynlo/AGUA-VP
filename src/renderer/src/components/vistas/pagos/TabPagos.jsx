import { useState } from "react";
import { Modal, Button as FlowbiteButton, ModalHeader, ModalBody } from "flowbite-react";
import {
  HiEye,
  HiCurrencyDollar,
  HiDownload,
  HiChevronDown,
  HiX,
  HiFilter,
  HiRefresh,
  HiCash,
  HiSearch,
  HiArrowLeft,
  HiChevronLeft,
  HiChevronRight
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useTabPagos } from "../../../hooks/useTabPagos";
import { useRutas } from "../../../context/RutasContext";
import SelectorPeriodoAvanzado from "../../ui/SelectorPeriodoAvanzado";
import { formatearPeriodo } from "../../../utils/periodoUtils";
import ModalDetallePago from "./ModalDetallePago";
import { exportData } from "../../../utils/exportUtils";
import { useFeedback } from "../../../context/FeedbackContext";

const toMoney = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100) / 100;
};

const formatFechaSimple = (valor) => {
  if (!valor) return "-";
  const match = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? String(valor) : d.toLocaleDateString("es-MX");
};

const normalizarPagosParaExport = (lista) => {
  return (lista || []).map((pago, index) => ({
    "No.": index + 1,
    "Folio Pago": `#P-${pago.id}`,
    "Folio Factura": `#${pago.factura_id}`,
    "Cliente": pago.cliente_nombre || "",
    "Dirección": pago.direccion_cliente || "-",
    "Medidor": pago.medidor_numero_serie || "-",
    "Período Facturado": pago.periodo_facturado ? formatearPeriodo(pago.periodo_facturado) : "-",
    "Monto Pagado ($)": toMoney(pago.monto),
    "Cantidad Entregada ($)": toMoney(pago.cantidad_entregada),
    "Cambio ($)": toMoney(pago.cambio),
    "Método de Pago": pago.metodo_pago || "-",
    "Fecha de Pago": formatFechaSimple(pago.fecha_pago),
    "Registrado Por": pago.modificado_por_nombre || "-",
    "Comentario": pago.comentario || "-"
  }));
};

const premiumConfirmModalTheme = {
  root: {
    show: { on: "flex bg-slate-900/60 dark:bg-black/80 mt-10", off: "hidden" }
  },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-md w-full"
  },
  header: {
    base: "hidden",
    close: { base: "hidden", icon: "hidden" }
  },
  body: { base: "pt-10 pb-6 px-6 flex-1 overflow-y-auto bg-transparent" }
};

// ── SKELETON DE CARGA (animate-pulse nativo, sin librerías) ───────────────────
const LoadingSkeleton = () => (
  <div className="w-full flex flex-col gap-6">
    <div className="flex justify-between items-center pb-4">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-48 rounded-md bg-slate-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-3 w-32 rounded-md bg-slate-200 dark:bg-zinc-800 animate-pulse" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-11 w-24 rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-11 w-32 rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
      </div>
    </div>
    <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-zinc-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-[52px] w-full rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-[52px] w-full rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-[52px] w-full rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-950">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 w-full border-b border-slate-100 dark:border-zinc-800/50 flex items-center px-6 gap-4">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-1/4 rounded-md bg-slate-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-3 w-1/3 rounded-md bg-slate-200 dark:bg-zinc-800 animate-pulse" />
            </div>
            <div className="h-10 w-32 rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── SPINNER CSS PURO (sin librería) ───────────────────────────────────────────
function LoadingSpinner({ className = "w-4 h-4" }) {
  return (
    <div className={`${className} border-2 border-slate-300 dark:border-zinc-600 border-t-emerald-500 rounded-full animate-spin`} />
  );
}

// ── DROPDOWN DE EXPORTAR (estado local, sin librería) ─────────────────────────
function ExportDropdown({ onExportCSV, onExportExcel }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="font-bold bg-emerald-500/10 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-xl h-11 px-5 shadow-sm flex items-center gap-2 transition-colors border border-emerald-500/10"
      >
        <HiDownload className="text-lg" />
        Exportar
        <HiChevronDown className="w-4 h-4 opacity-70" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => { onExportCSV(); setOpen(false); }}
              className="w-full px-4 py-3 flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-left"
            >
              <span className="text-lg">📄</span>
              Exportar a CSV
            </button>
            <button
              onClick={() => { onExportExcel(); setOpen(false); }}
              className="w-full px-4 py-3 flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-left border-t border-slate-100 dark:border-zinc-800/80"
            >
              <span className="text-lg">📊</span>
              Exportar a Excel (.xlsx)
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── PAGINACIÓN SIMPLE (sin librería) ──────────────────────────────────────────
function SimplePagination({ currentPage, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  const base = "h-9 min-w-[36px] px-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center";
  const active = "bg-emerald-600 text-white shadow-md";
  const inactive = "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700";
  const disabled = "opacity-40 cursor-not-allowed";

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${base} ${currentPage === 1 ? `${inactive} ${disabled}` : inactive}`}
      >
        <HiChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`e${i}`} className="px-1 text-slate-400 text-sm select-none">…</span>
        ) : (
          <button
            key={page}
            onClick={() => onChange(page)}
            className={`${base} ${page === currentPage ? active : inactive}`}
          >
            {page}
          </button>
        )
      )}
      <button
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${base} ${currentPage === totalPages ? `${inactive} ${disabled}` : inactive}`}
      >
        <HiChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── BADGE DE MÉTODO DE PAGO (reemplaza Chip de NextUI) ────────────────────────
const METODO_COLORS = {
  success:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  primary:   "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  secondary: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  warning:   "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  default:   "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400",
};

function MetodoBadge({ metodo, getMetodoColor }) {
  const color = METODO_COLORS[getMetodoColor(metodo)] ?? METODO_COLORS.default;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${color}`}>
      {metodo || "—"}
    </span>
  );
}

// ── ESTILOS COMPARTIDOS ───────────────────────────────────────────────────────
const SELECT_CLS = "w-full h-[52px] pl-4 pr-8 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-none appearance-none cursor-pointer";

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
const TabPagos = () => {
  const navigate = useNavigate();

  const {
    pagos,
    paginatedData,
    loading,
    initialLoading,
    search,
    filtroMetodo,
    filtroPeriodo,
    cityFilter,
    ciudades,
    currentPage,
    rowsPerPage,
    totalPages,
    totalItems,
    resumen,
    handleSearch,
    handleMetodoFilterChange,
    handlePeriodoChange,
    handleCityFilterChange,
    handleRowsPerPageChange,
    setCurrentPage,
    getMetodoColor,
    actualizarPagos,
    setCityFilter
  } = useTabPagos();

  const { periodosInfo, siguientePeriodo, ultimoPeriodoRegistrado } = useRutas();
  const { setSuccess, setError } = useFeedback();

  // Estados para modales
  const [modalDetalle, setModalDetalle] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);

  // Estado para exportación premium
  const [exportModal, setExportModal] = useState({
    isOpen: false,
    format: "csv"
  });
  const [exportando, setExportando] = useState(false);

  const handleExecuteExport = async (type) => {
    setExportModal((prev) => ({ ...prev, isOpen: false }));
    setExportando(true);
    try {
      let rawData = [];
      let prefix = "";
      const token = localStorage.getItem("token");

      if (type === "page") {
        rawData = paginatedData;
        prefix = "Pagina_";
      } else if (type === "filtered") {
        prefix = "Filtrados_";
        if (token && window.api?.fetchPagos) {
          const resp = await window.api.fetchPagos(token, {
            periodo: filtroPeriodo,
            search: search,
            metodo_pago: filtroMetodo === "All" ? "" : filtroMetodo,
            ciudad: cityFilter === "All" ? "" : cityFilter,
            page: 1,
            limit: 10000
          });
          rawData = Array.isArray(resp) ? resp : (resp?.pagos || pagos);
        } else {
          rawData = pagos;
        }
      } else {
        // Todos los registros
        prefix = "Todos_";
        if (token && window.api?.fetchPagos) {
          const resp = await window.api.fetchPagos(token, {
            periodo: "",
            search: "",
            metodo_pago: "",
            ciudad: "",
            page: 1,
            limit: 20000
          });
          rawData = Array.isArray(resp) ? resp : (resp?.pagos || pagos);
        } else {
          rawData = pagos;
        }
      }

      if (!rawData || rawData.length === 0) {
        setError("No hay pagos disponibles para exportar", "Exportación");
        return;
      }

      const normalizedData = normalizarPagosParaExport(rawData);
      const format = exportModal.format;
      const filename = `Pagos_${prefix}${new Date().toISOString().split("T")[0]}`;

      const ok = await exportData(normalizedData, filename, format);
      if (ok) {
        setSuccess(`Pagos exportados correctamente en formato ${format.toUpperCase()}`);
      } else {
        setError("Error o cancelación al exportar pagos", "Exportación");
      }
    } catch (err) {
      console.error("Error al exportar pagos:", err);
      setError("Error al exportar pagos", "Exportación");
    } finally {
      setExportando(false);
    }
  };

  // Funciones de utilidad
  const periodoLabel = formatearPeriodo(filtroPeriodo);

  const obtenerInfoPagosPorFactura = (facturaId) => {
    const pagosDeFactura = pagos?.filter(pago => pago.factura_id === facturaId) || [];
    return {
      total: pagosDeFactura.length,
      montoTotal: pagosDeFactura.reduce((sum, pago) => sum + (pago.monto || 0), 0),
      pagosOrdenados: pagosDeFactura.sort((a, b) => new Date(a.fecha_creacion) - new Date(b.fecha_creacion))
    };
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const verDetalle = (pago) => {
    setPagoSeleccionado(pago);
    setModalDetalle(true);
  };

  if (initialLoading) {
    return <LoadingSkeleton />;
  }

  // Detectar si hay filtros activos para el botón de limpiar
  const hasActiveFilters = search || filtroMetodo !== "All" || cityFilter !== "All" || filtroPeriodo !== new Date().toISOString().slice(0, 7);

  const clearFilters = () => {
    handleSearch("");
    handleMetodoFilterChange(["All"]);
    setCityFilter("All");
  };

  return (
    <div className="w-full flex flex-col gap-6">

      {/* ── HEADER Y ACCIONES ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 dark:bg-emerald-900/30 rounded-2xl shrink-0">
            <HiCurrencyDollar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                Historial de Pagos
              </h3>
              {loading && !initialLoading && (
                <LoadingSpinner className="w-4 h-4 ml-1" />
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
              Periodo actual: <span className="text-emerald-600 dark:text-emerald-400 font-black">{periodoLabel}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <button
            onClick={() => navigate(-1)}
            title="Volver"
            className="bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 font-bold rounded-xl h-11 px-4 shadow-sm flex items-center gap-2 transition-colors hover:bg-slate-200 dark:hover:bg-zinc-800"
          >
            <HiArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver</span>
          </button>

          <button
            onClick={() => actualizarPagos()}
            disabled={loading}
            className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl h-11 px-5 shadow-sm flex items-center gap-2 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-60"
          >
            {loading ? <LoadingSpinner className="w-4 h-4" /> : <HiRefresh className="text-lg" />}
            Recargar
          </button>

          <ExportDropdown
            onExportCSV={() => setExportModal({ isOpen: true, format: "csv" })}
            onExportExcel={() => setExportModal({ isOpen: true, format: "xlsx" })}
          />
        </div>
      </div>

      {/* ── CONTENEDOR PRINCIPAL ── */}
      <div className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-transparent rounded-2xl overflow-hidden flex flex-col">

        {/* Filtros */}
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">

            {/* Buscador */}
            <div className="lg:col-span-3 relative w-full flex items-center">
              <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none">
                <HiSearch className="w-5 h-5" />
              </span>
              <input
                placeholder="Buscar ID, factura, cliente o medidor..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-3 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-none h-[52px]"
              />
              {search && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <HiX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro por período */}
            <div className="lg:col-span-3">
              <div className="w-full h-[52px] flex items-center">
                <SelectorPeriodoAvanzado
                  value={filtroPeriodo}
                  onChange={handlePeriodoChange}
                  placeholder="Buscar y seleccionar período"
                  startYear={2020}
                  isDisabled={loading}
                  className="w-full h-full"
                  periodosInfo={periodosInfo}
                  siguientePeriodo={siguientePeriodo}
                  ultimoPeriodoRegistrado={ultimoPeriodoRegistrado}
                />
              </div>
            </div>

            {/* Filtro por método de pago */}
            <div className="lg:col-span-2">
              <select
                value={filtroMetodo}
                onChange={(e) => handleMetodoFilterChange([e.target.value])}
                aria-label="Filtrar por método"
                className={SELECT_CLS}
              >
                <option value="All">Todos los métodos</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            {/* Filtro por ciudad */}
            <div className="lg:col-span-2">
              <select
                value={cityFilter}
                onChange={(e) => handleCityFilterChange(e.target.value)}
                aria-label="Filtrar por ciudad"
                className={SELECT_CLS}
              >
                <option value="All">Todas las ciudades</option>
                {ciudades.map((ciudad) => (
                  <option key={ciudad} value={ciudad}>{ciudad}</option>
                ))}
              </select>
            </div>

            {/* Limpiar filtros */}
            <div className="lg:col-span-2 flex justify-end">
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="w-full font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 h-[52px] rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <HiFilter className="text-lg" />
                  Limpiar
                </button>
              ) : (
                <div className="w-full h-[52px]" />
              )}
            </div>
          </div>
        </div>

        {/* Sub-header paginación */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4 bg-slate-50/40 dark:bg-zinc-900/30">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            Mostrando{" "}
            <span className="text-emerald-600 dark:text-emerald-400">{paginatedData.length}</span>
            {" "}de{" "}
            <span className="text-slate-700 dark:text-zinc-200">{totalItems}</span>
            {" "}transacciones
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 hidden sm:block">
              Filas por página:
            </span>
            <select
              value={rowsPerPage.toString()}
              onChange={handleRowsPerPageChange}
              aria-label="Filas por página"
              className="h-[36px] px-3 text-sm font-bold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-none appearance-none cursor-pointer w-20"
            >
              {["5", "10", "15", "20", "50"].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla nativa */}
        <div className="bg-white dark:bg-zinc-950 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800">
                {["DOCUMENTO", "ORDEN", "CLIENTE Y EQUIPO", "FECHA", "PAGADO / TOTAL", "RECIBIDO", "CAMBIO", "MÉTODO", "ACCIONES"].map((col, i, arr) => (
                  <th
                    key={col}
                    className={`py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 bg-transparent whitespace-nowrap ${i === arr.length - 1 ? "text-right" : "text-left"}`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <LoadingSpinner className="w-8 h-8" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 animate-pulse">
                        Cargando pagos...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <HiCash className="w-12 h-12 opacity-20 mb-3 text-slate-400 dark:text-zinc-500" />
                      <p className="font-bold text-sm text-slate-600 dark:text-zinc-300">
                        {pagos.length === 0 && !loading ? "No hay pagos en este período" : "Sin coincidencias"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((pago) => {
                  const infoPagosFactura = obtenerInfoPagosPorFactura(pago.factura_id);
                  const esPagoMultiple = infoPagosFactura.total > 1;
                  const indicePago = infoPagosFactura.pagosOrdenados.findIndex(p => p.id === pago.id) + 1;

                  return (
                    <tr
                      key={pago.id}
                      className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="font-black text-sm text-slate-800 dark:text-zinc-100">
                            <span className="text-slate-400 font-normal mr-0.5">#P-</span>{pago.id}
                          </div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded w-fit">
                            Fact: #{pago.factura_id}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded-lg shadow-sm">
                            {indicePago}<span className="text-slate-400">/{infoPagosFactura.total}</span>
                          </span>
                          {esPagoMultiple && (
                            <span className="inline-flex items-center bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded">Múltiple</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <div className="font-bold text-sm text-slate-800 dark:text-zinc-100 truncate max-w-[200px]">
                            {pago.cliente_nombre}
                          </div>
                          <div className="text-[11px] font-medium text-slate-500">
                            Medidor: <span className="font-mono text-slate-600 dark:text-zinc-400">{pago.medidor_numero_serie}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <div className="font-bold text-sm text-slate-700 dark:text-zinc-200">
                            {formatFecha(pago.fecha_pago)}
                          </div>
                          <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                            Registro: {new Date(pago.fecha_creacion || pago.fecha_pago).toLocaleDateString('es-MX', {day: '2-digit', month: '2-digit', year:'2-digit'})}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="font-black text-lg text-emerald-600 dark:text-emerald-400 tracking-tight">
                            ${pago.monto?.toLocaleString("es-MX", { minimumFractionDigits: 2 }) || '0.00'}
                          </div>
                          {esPagoMultiple && (
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              Total Factura: ${infoPagosFactura.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-bold text-sm text-slate-700 dark:text-zinc-300">
                          ${pago.cantidad_entregada?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className={`font-bold text-sm ${pago.cambio > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-slate-400 dark:text-zinc-600'}`}>
                            ${pago.cambio?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                          </div>
                          {pago.cambio > 0 && (
                            <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded uppercase tracking-widest">
                              Con Cambio
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <MetodoBadge metodo={pago.metodo_pago} getMetodoColor={getMetodoColor} />
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => verDetalle(pago)}
                            title="Ver Detalle del Pago"
                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 dark:bg-zinc-800 dark:hover:bg-blue-900/30 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
                          >
                            <HiEye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación inferior */}
        {totalPages > 1 && (
          <div className="flex justify-center p-4 border-t border-slate-100 dark:border-zinc-800/50 bg-slate-50/60 dark:bg-zinc-900/40">
            <SimplePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Modales */}
      <ModalDetallePago
        isOpen={modalDetalle}
        onClose={() => setModalDetalle(false)}
        pago={pagoSeleccionado}
        obtenerInfoPagosPorFactura={obtenerInfoPagosPorFactura}
        getMetodoColor={getMetodoColor}
      />

      {/* Modal de Configuración de Exportación */}
      <Modal
        show={exportModal.isOpen}
        onClose={() => setExportModal((prev) => ({ ...prev, isOpen: false }))}
        size="md"
        popup
        theme={premiumConfirmModalTheme}
      >
        <ModalHeader />
        <ModalBody>
          <div className="p-2">
            <div className="flex items-center gap-3 mb-4 justify-center">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <HiDownload className="w-8 h-8" />
              </div>
            </div>
            <h3 className="mb-2 text-center text-lg font-black text-slate-800 dark:text-zinc-100">
              Opciones de Exportación ({exportModal.format.toUpperCase()})
            </h3>
            <p className="mb-6 text-center text-xs font-semibold text-slate-500 dark:text-zinc-400 leading-relaxed">
              Selecciona el conjunto de datos que deseas descargar en tu archivo.
            </p>

            <div className="flex flex-col gap-3 mb-6">
              {/* Opción 1: Página Actual */}
              <button
                type="button"
                disabled={exportando}
                onClick={() => handleExecuteExport("page")}
                className="flex flex-col text-left p-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/10 dark:bg-zinc-900/30 transition-all duration-200 w-full disabled:opacity-60"
              >
                <span className="text-xs font-black text-slate-800 dark:text-zinc-100 flex items-center justify-between w-full">
                  <span>Página actual (tabla)</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
                    {paginatedData.length} registros
                  </span>
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-1">
                  Exporta únicamente las transacciones visibles en esta página.
                </span>
              </button>

              {/* Opción 2: Filtrados / Período */}
              <button
                type="button"
                disabled={exportando}
                onClick={() => handleExecuteExport("filtered")}
                className="flex flex-col text-left p-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/10 dark:bg-zinc-900/30 transition-all duration-200 w-full disabled:opacity-60"
              >
                <span className="text-xs font-black text-slate-800 dark:text-zinc-100 flex items-center justify-between w-full">
                  <span>Filtrados / Período actual</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md">
                    {totalItems} registros
                  </span>
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-1">
                  Exporta todos los pagos correspondientes al período y filtros aplicados.
                </span>
              </button>

              {/* Opción 3: Todos */}
              <button
                type="button"
                disabled={exportando}
                onClick={() => handleExecuteExport("all")}
                className="flex flex-col text-left p-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/10 dark:bg-zinc-900/30 transition-all duration-200 w-full disabled:opacity-60"
              >
                <span className="text-xs font-black text-slate-800 dark:text-zinc-100 flex items-center justify-between w-full">
                  <span>Historial completo de pagos</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 rounded-md">
                    Todos los períodos
                  </span>
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-1">
                  Exporta la totalidad de las transacciones de pago registradas en el sistema.
                </span>
              </button>
            </div>

            <div className="flex justify-center gap-3">
              <FlowbiteButton
                color="gray"
                onClick={() => setExportModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={exportando}
                className="font-bold text-slate-500"
              >
                Cancelar
              </FlowbiteButton>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default TabPagos;
