import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiCash,
  HiUserGroup,
  HiDocumentText,
  HiCalculator,
  HiEye,
  HiFilter,
  HiX,
  HiPrinter,
  HiSearch,
  HiPhone,
  HiMail,
  HiLocationMarker,
  HiChevronLeft,
  HiChevronRight,
  HiChevronDown
} from "react-icons/hi";
import { useClientes } from "../../../context/ClientesContext";
import { usePagos } from "../../../context/PagosContext";
import { useFeedback } from "../../../context/FeedbackContext";
import ModalPagoDistribuidoCliente from "./ModalPagoDistribuidoCliente";
import ModalPagoRapido from "./ModalPagoRapido";
import ModalDetalleCobranzaCliente from "./ModalDetalleCobranzaCliente";
import ModalSeleccionPeriodoRapido from "./ModalSeleccionPeriodoRapido";
import ModalImprimir from "../impresion/components/ModalImprimir";
import { formatearPeriodo, obtenerPeriodoActual } from "../../../utils/periodoUtils";

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

// ── ESTILOS COMPARTIDOS ───────────────────────────────────────────────────────
const SELECT_CLS = "w-full h-[52px] pl-4 pr-8 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-none appearance-none cursor-pointer";

// ── SPINNER CSS PURO (sin librería) ───────────────────────────────────────────
function LoadingSpinner({ className = "w-4 h-4" }) {
  return (
    <div className={`${className} border-2 border-slate-300 dark:border-zinc-600 border-t-emerald-500 rounded-full animate-spin`} />
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
  const active = "bg-slate-800 text-white dark:bg-zinc-200 dark:text-slate-900 shadow-sm";
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

// ── AVATAR + NOMBRE (reemplaza User de NextUI) ────────────────────────────────
function ClienteUser({ nombre, numeroPredio, id }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm flex items-center justify-center shrink-0">
        <span className="text-sm font-bold text-slate-600 dark:text-zinc-300">
          {nombre?.charAt(0)?.toUpperCase() || "C"}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-sm text-slate-800 dark:text-zinc-100 leading-tight">{nombre}</span>
        <span className="font-medium text-[11px] text-slate-500">
          {numeroPredio && numeroPredio !== "-" ? `Predio #${numeroPredio} · ID: ${id}` : `ID: ${id}`}
        </span>
      </div>
    </div>
  );
}

// ── BOTÓN IMPRIMIR DEUDORES CON OPCIONES DE ORDEN ─────────────────────────────
const OPCIONES_ORDEN_DEUDORES = [
  { key: "mayor", label: "Mayor deudor primero", icon: "💰" },
  { key: "menor", label: "Menor deudor primero", icon: "🪙" },
  { key: "predio", label: "Por número de predio", icon: "🏠" },
];

function ImprimirDeudoresDropdown({ onImprimir, loading }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl px-5 h-[44px] shadow-sm flex items-center gap-2 transition-colors disabled:opacity-60"
      >
        {loading ? <LoadingSpinner className="w-4 h-4" /> : <HiPrinter className="text-lg" />}
        Imprimir Deudores
        <HiChevronDown className="w-4 h-4 opacity-70" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-60 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden">
            <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800">
              Ordenar impresión por
            </div>
            {OPCIONES_ORDEN_DEUDORES.map((op) => (
              <button
                key={op.key}
                onClick={() => { onImprimir(op.key); setOpen(false); }}
                className="w-full px-4 py-3 flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-left"
              >
                <span className="text-lg">{op.icon}</span>
                {op.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const TabCobranzaCliente = () => {
  const { fetchClientes } = useClientes();
  const { registrarPagoDistribuido, loading: loadingPagos, fetchPagos } = usePagos();
  const { setSuccess, setError } = useFeedback();

  const [clientes, setClientes] = useState([]);
  const [clientesPagination, setClientesPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 10 });
  const [facturasHistorial, setFacturasHistorial] = useState([]);
  const [pagosHistorial, setPagosHistorial] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingFacturas, setLoadingFacturas] = useState(false);
  const [loadingPagosHistorial, setLoadingPagosHistorial] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filtroRanking, setFiltroRanking] = useState("deuda_desc");
  const [modalSeleccionPeriodoRapido, setModalSeleccionPeriodoRapido] = useState(false);
  const [modalPagoRapidoOpen, setModalPagoRapidoOpen] = useState(false);
  const [periodoPagoRapido, setPeriodoPagoRapido] = useState(obtenerPeriodoActual());
  const [pdfUrl, setPdfUrl] = useState(null);
  const [printUrl, setPrintUrl] = useState(null);
  const [modoPdf, setModoPdf] = useState(null);
  const [loadingImprimirDeudores, setLoadingImprimirDeudores] = useState(false);

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [facturaSeleccionadaDetalle, setFacturaSeleccionadaDetalle] = useState(null);
  const [pagoSeleccionadoDetalle, setPagoSeleccionadoDetalle] = useState(null);
  const [anioFiltroDetalle, setAnioFiltroDetalle] = useState("all");
  const [periodoFiltroDetalle, setPeriodoFiltroDetalle] = useState("all");
  const [anioFiltroPagosDetalle, setAnioFiltroPagosDetalle] = useState("all");
  const [periodoFiltroPagosDetalle, setPeriodoFiltroPagosDetalle] = useState("all");
  const [detalleTab, setDetalleTab] = useState("facturas");
  const [modalOpen, setModalOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const cargarClientes = useCallback(async () => {
    setLoadingClientes(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No se encontró token de sesión");

      const limit = 200;
      let page = 1;
      let totalPages = 1;
      const acumulados = [];

      while (page <= totalPages) {
        const response = await fetchClientes({
          page,
          limit,
          search: debouncedSearch
        });

        if (response?.data && Array.isArray(response.data)) {
          acumulados.push(...response.data);
          totalPages = response?.pagination?.totalPages || 1;
          page += 1;
        } else if (Array.isArray(response)) {
          acumulados.push(...response);
          break;
        } else {
          break;
        }
      }

      setClientes(acumulados);
    } catch (error) {
      setClientes([]);
      setError(error?.message || "No se pudo cargar la lista de clientes", "Cobranza");
    } finally {
      setLoadingClientes(false);
    }
  }, [debouncedSearch, fetchClientes, setError]);

  const cargarFacturasHistorial = useCallback(async () => {
    setLoadingFacturas(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No se encontró token de sesión");

      const limit = 200;
      let page = 1;
      let totalPages = 1;
      const acumuladas = [];

      while (page <= totalPages) {
        const response = await window.api.fetchFacturas(token, { page, limit, search: "", estado: "" });
        if (response?.facturas && Array.isArray(response.facturas)) {
          acumuladas.push(...response.facturas);
          totalPages = response?.pagination?.totalPages || 1;
          page += 1;
        } else if (Array.isArray(response)) {
          acumuladas.push(...response);
          break;
        } else {
          break;
        }
      }

      setFacturasHistorial(acumuladas);
    } catch (error) {
      setFacturasHistorial([]);
      setError(error?.message || "No se pudo cargar el historial de facturas", "Cobranza");
    } finally {
      setLoadingFacturas(false);
    }
  }, [setError]);

  const cargarPagosHistorial = useCallback(async () => {
    setLoadingPagosHistorial(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No se encontró token de sesión");

      const limit = 200;
      let page = 1;
      let totalPages = 1;
      const acumulados = [];

      while (page <= totalPages) {
        const response = await window.api.fetchPagos(token, { page, limit, search: "", metodo_pago: "" });
        if (response?.pagos && Array.isArray(response.pagos)) {
          acumulados.push(...response.pagos);
          totalPages = response?.pagination?.totalPages || 1;
          page += 1;
        } else if (Array.isArray(response)) {
          acumulados.push(...response);
          break;
        } else {
          break;
        }
      }

      setPagosHistorial(acumulados);
    } catch (error) {
      setPagosHistorial([]);
      setError(error?.message || "No se pudo cargar el historial de pagos", "Cobranza");
    } finally {
      setLoadingPagosHistorial(false);
    }
  }, [setError]);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  useEffect(() => {
    cargarFacturasHistorial();
  }, [cargarFacturasHistorial]);

  useEffect(() => {
    cargarPagosHistorial();
  }, [cargarPagosHistorial]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, rowsPerPage, filtroRanking]);

  const facturasPorCliente = useMemo(() => {
    const map = new Map();
    facturasHistorial.forEach((factura) => {
      const clienteId = Number(factura.cliente_id);
      if (!map.has(clienteId)) {
        map.set(clienteId, []);
      }
      map.get(clienteId).push(factura);
    });
    return map;
  }, [facturasHistorial]);

  const ultimoPagoPorFactura = useMemo(() => {
    const map = new Map();
    pagosHistorial.forEach((pago) => {
      const facturaId = Number(pago.factura_id);
      const fechaPago = pago.fecha_pago || pago.fecha_creacion || null;
      if (!fechaPago) return;
      if (!map.has(facturaId) || new Date(fechaPago).getTime() > new Date(map.get(facturaId)).getTime()) {
        map.set(facturaId, fechaPago);
      }
    });
    return map;
  }, [pagosHistorial]);

  const clientesTabla = useMemo(() => {
    return clientes.map((cliente) => {
      const facturasCliente = sortFacturasFIFO(facturasPorCliente.get(Number(cliente.id)) || []);
      const deudaTotal = facturasCliente.reduce((acc, f) => toMoney(acc + f.saldo_pendiente), 0);
      const facturasPendientes = facturasCliente.filter((f) => toMoney(f.saldo_pendiente) > 0 && String(f.estado || "").toLowerCase() !== "pagado").length;
      const facturaMasAntiguaPendiente = facturasCliente.find((f) => toMoney(f.saldo_pendiente) > 0 && String(f.estado || "").toLowerCase() !== "pagado");

      return {
        cliente_id: Number(cliente.id),
        cliente_nombre: cliente.nombre,
        numero_predio: cliente.numero_predio || "-",
        direccion: cliente.direccion || "-",
        telefono: cliente.telefono || "-",
        correo: cliente.correo || "-",
        estado_cliente: cliente.estado_cliente || "Activo",
        deuda_total: deudaTotal,
        total_facturas: facturasCliente.length,
        facturas_pendientes: facturasPendientes,
        facturas_pagadas: facturasCliente.filter((f) => String(f.estado || "").toLowerCase().includes("pagad") || toMoney(f.saldo_pendiente) <= 0).length,
        facturas_vencidas: facturasCliente.filter((f) => String(f.estado || "").toLowerCase().includes("vencid")).length,
        factura_mas_antigua_pendiente: facturaMasAntiguaPendiente || null,
        facturas: facturasCliente
      };
    });
  }, [clientes, facturasPorCliente]);

  const clientesTablaOrdenada = useMemo(() => {
    const data = [...clientesTabla];

    const parsePredio = (predio) => {
      const str = String(predio ?? "").trim();
      const onlyDigits = str.replace(/\D/g, "");
      if (!onlyDigits) return Number.MAX_SAFE_INTEGER;
      const num = Number(onlyDigits);
      return Number.isFinite(num) ? num : Number.MAX_SAFE_INTEGER;
    };

    switch (filtroRanking) {
      case "deuda_asc":
        data.sort((a, b) => a.deuda_total - b.deuda_total);
        break;
      case "vencidas_desc":
        data.sort((a, b) => {
          if (b.facturas_vencidas !== a.facturas_vencidas) return b.facturas_vencidas - a.facturas_vencidas;
          return b.deuda_total - a.deuda_total;
        });
        break;
      case "pagadas_desc":
        data.sort((a, b) => {
          if (b.facturas_pagadas !== a.facturas_pagadas) return b.facturas_pagadas - a.facturas_pagadas;
          return b.total_facturas - a.total_facturas;
        });
        break;
      case "predio_asc":
        data.sort((a, b) => {
          const predioA = parsePredio(a.numero_predio);
          const predioB = parsePredio(b.numero_predio);
          if (predioA !== predioB) return predioA - predioB;
          return String(a.numero_predio || "").localeCompare(String(b.numero_predio || ""), "es", { numeric: true, sensitivity: "base" });
        });
        break;
      case "nombre_asc":
        data.sort((a, b) => String(a.cliente_nombre || "").localeCompare(String(b.cliente_nombre || ""), "es", { sensitivity: "base" }));
        break;
      case "deuda_desc":
      default:
        data.sort((a, b) => b.deuda_total - a.deuda_total);
        break;
    }

    return data;
  }, [clientesTabla, filtroRanking]);

  const clientesTablaPaginada = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return clientesTablaOrdenada.slice(start, start + rowsPerPage);
  }, [clientesTablaOrdenada, currentPage, rowsPerPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(clientesTablaOrdenada.length / rowsPerPage));
  }, [clientesTablaOrdenada.length, rowsPerPage]);

  useEffect(() => {
    setClientesPagination({
      total: clientesTablaOrdenada.length,
      totalPages,
      page: Math.min(currentPage, totalPages),
      limit: rowsPerPage
    });
  }, [clientesTablaOrdenada.length, currentPage, rowsPerPage, totalPages]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const resumen = useMemo(() => {
    const totalClientes = clientesPagination.total || 0;
    const clientesConDeuda = Array.from(facturasPorCliente.keys()).length;
    const deudaTotal = facturasHistorial.reduce((acc, f) => toMoney(acc + f.saldo_pendiente), 0);
    const facturasTotales = facturasHistorial.length;

    return {
      clientes_total: totalClientes,
      clientes_con_deuda: clientesConDeuda,
      facturas: facturasTotales,
      deuda: deudaTotal
    };
  }, [clientesPagination.total, facturasPorCliente, facturasHistorial]);

  const abrirModalCobro = (cliente) => {
    setClienteSeleccionado(cliente);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setClienteSeleccionado(null);
  };

  const abrirDetalleCliente = (cliente) => {
    setClienteDetalle(cliente);
    setFacturaSeleccionadaDetalle(null);
    setPagoSeleccionadoDetalle(null);
    setAnioFiltroDetalle("all");
    setPeriodoFiltroDetalle("all");
    setAnioFiltroPagosDetalle("all");
    setPeriodoFiltroPagosDetalle("all");
    setDetalleTab("facturas");
    setDetalleOpen(true);
  };

  const cerrarDetalleCliente = () => {
    setDetalleOpen(false);
    setClienteDetalle(null);
    setFacturaSeleccionadaDetalle(null);
    setPagoSeleccionadoDetalle(null);
    setAnioFiltroDetalle("all");
    setPeriodoFiltroDetalle("all");
    setAnioFiltroPagosDetalle("all");
    setPeriodoFiltroPagosDetalle("all");
    setDetalleTab("facturas");
  };

  const procesarCobroDistribuido = async (payload) => {
    if (!clienteSeleccionado) return;

    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

    const aplicaciones = Array.isArray(payload?.preview?.aplicaciones) ? payload.preview.aplicaciones : [];
    if (aplicaciones.length === 0) {
      throw new Error("No hay facturas con monto aplicable para registrar el cobro.");
    }

    const result = await registrarPagoDistribuido({
      cliente_id: clienteSeleccionado.cliente_id,
      fecha_pago: payload.fecha_pago,
      cantidad_entregada: payload.cantidad_entregada,
      metodo_pago: payload.metodo_pago,
      comentario: payload.comentario || null,
      modificado_por: usuario.id || 1
    });

    const responseData = result?.data?.data || result?.data || {};
    const responseDataNested = responseData?.data || {};

    const aplicacionesRaw =
      (Array.isArray(responseData?.aplicaciones) ? responseData.aplicaciones : null)
      || (Array.isArray(responseDataNested?.aplicaciones) ? responseDataNested.aplicaciones : []);

    let pagosCreados = aplicacionesRaw
      .map((item) => ({
        factura_id: Number(item?.factura_id ?? item?.id_factura),
        monto_aplicado: Number(item?.monto_aplicado ?? item?.monto ?? item?.cantidad_entregada ?? 0)
      }))
      .filter((item) =>
        Number.isFinite(item.factura_id) &&
        item.factura_id > 0 &&
        Number.isFinite(item.monto_aplicado) &&
        item.monto_aplicado > 0
      );

    const facturasAfectadas = Number(responseData?.facturas_afectadas ?? responseDataNested?.facturas_afectadas ?? 0);
    const pagosIdsCount =
      (Array.isArray(responseData?.pagos_ids) ? responseData.pagos_ids.length : 0)
      || (Array.isArray(responseDataNested?.pagos_ids) ? responseDataNested.pagos_ids.length : 0);

    if (pagosCreados.length === 0 && (facturasAfectadas > 0 || pagosIdsCount > 0)) {
      pagosCreados = aplicaciones
        .map((item) => ({
          factura_id: Number(item?.factura_id),
          monto_aplicado: Number(item?.monto_aplicado || 0)
        }))
        .filter((item) =>
          Number.isFinite(item.factura_id) &&
          item.factura_id > 0 &&
          Number.isFinite(item.monto_aplicado) &&
          item.monto_aplicado > 0
        );
    }

    if (pagosCreados.length === 0) {
      console.error("Respuesta inesperada de pago distribuido", { result, responseData, responseDataNested });
      throw new Error(result?.message || "El endpoint distribuido no devolvió aplicaciones válidas para este cobro.");
    }

      await Promise.all([
        cargarFacturasHistorial(),
        cargarPagosHistorial(),
        cargarClientes(),
        fetchPagos()
      ]);

      setSuccess(
        `Cobro aplicado en ${pagosCreados.length} factura(s).`,
        "Cobranza"
      );
      return {
        success: true,
        data: {
          facturas_afectadas: pagosCreados.length,
          aplicaciones: pagosCreados
        }
      };
  };

  const abrirModalSeleccionPeriodoRapido = () => {
    setPeriodoPagoRapido(obtenerPeriodoActual());
    setModalSeleccionPeriodoRapido(true);
  };

  const confirmarPeriodoPagoRapido = () => {
    setModalSeleccionPeriodoRapido(false);
    setModalPagoRapidoOpen(true);
  };

  const refrescarCobranzaTrasPagoRapido = async () => {
    await Promise.all([
      cargarFacturasHistorial(),
      cargarPagosHistorial(),
      cargarClientes(),
      fetchPagos()
    ]);
  };

  const construirPayloadDeudoresMayores = useCallback((orden = "mayor") => {
    const parsePredio = (predio) => {
      const onlyDigits = String(predio ?? "").replace(/\D/g, "");
      if (!onlyDigits) return Number.MAX_SAFE_INTEGER;
      const num = Number(onlyDigits);
      return Number.isFinite(num) ? num : Number.MAX_SAFE_INTEGER;
    };

    const deudores = clientesTablaOrdenada
      .filter((cliente) => Number(cliente.deuda_total || 0) > 0)
      .map((cliente) => {
        const facturasConDeuda = (cliente.facturas || []).filter((f) => {
          const saldo = toMoney(f?.saldo_pendiente);
          const estado = String(f?.estado || "").toLowerCase();
          return saldo > 0 && !estado.includes("pagad");
        });

        const mesesDeuda = Array.from(
          new Set(
            facturasConDeuda
              .map((f) => f?.periodo || f?.periodo_mes || f?.mes)
              .filter(Boolean)
          )
        ).sort();

        const medidor =
          facturasConDeuda[0]?.medidor_numero_serie ||
          facturasConDeuda[0]?.numero_serie ||
          facturasConDeuda[0]?.medidor?.numero_serie ||
          cliente.facturas?.[0]?.medidor_numero_serie ||
          cliente.facturas?.[0]?.numero_serie ||
          "S/N";

        return {
          cliente_id: cliente.cliente_id,
          numero_predio: cliente.numero_predio,
          nombre: cliente.cliente_nombre,
          numero_serie: medidor,
          meses_deuda: mesesDeuda,
          recibos_con_deuda: facturasConDeuda.length,
          total_adeudo: toMoney(cliente.deuda_total),
          facturas: facturasConDeuda.map((f) => ({
            id: f.id,
            periodo: f.periodo || f.periodo_mes || f.mes,
            estado: f.estado,
            saldo_pendiente: toMoney(f.saldo_pendiente)
          }))
        };
      })
      .sort((a, b) => {
        if (orden === "predio") {
          const pa = parsePredio(a.numero_predio);
          const pb = parsePredio(b.numero_predio);
          if (pa !== pb) return pa - pb;
          return String(a.numero_predio || "").localeCompare(String(b.numero_predio || ""), "es", { numeric: true, sensitivity: "base" });
        }
        if (orden === "menor") return Number(a.total_adeudo || 0) - Number(b.total_adeudo || 0);
        return Number(b.total_adeudo || 0) - Number(a.total_adeudo || 0); // "mayor"
      });

    return {
      deudores,
      orden,
      generated_at: new Date().toISOString(),
      fuente: "cobranza_cliente"
    };
  }, [clientesTablaOrdenada]);

  const handleImprimirMayoresDeudores = useCallback(async (orden = "mayor") => {
    const payload = construirPayloadDeudoresMayores(orden);
    if (!payload.deudores.length) {
      setError("No hay deudores con saldo pendiente para imprimir.", "Cobranza");
      return;
    }

    setLoadingImprimirDeudores(true);
    try {
      const dataKey = await window.api.savePrintData(JSON.stringify(payload));
      const { protocol, origin, href } = window.location;
      const params = `print=true&dataKey=${dataKey}`;

      const url = protocol === "file:"
        ? `${href.split("#")[0]}#/reporteDeudoresMayores?${params}`
        : `${origin}/#/reporteDeudoresMayores?${params}`;

      const response = await window.api.previewComponent(url);
      if (response?.success && response?.path) {
        setPrintUrl(url);
        setPdfUrl(response.path);
        setModoPdf("imprimir");
      } else {
        setError("No se pudo preparar el reporte para impresión.", "Cobranza");
      }
    } catch (error) {
      console.error("Error al preparar impresión de deudores:", error);
      setError("Error al generar el reporte de deudores.", "Cobranza");
    } finally {
      setLoadingImprimirDeudores(false);
    }
  }, [construirPayloadDeudoresMayores, setError]);

  const facturaDetalleSeleccionada = useMemo(() => {
    if (!clienteDetalle || !facturaSeleccionadaDetalle) return null;
    return clienteDetalle.facturas.find((f) => String(f.id) === String(facturaSeleccionadaDetalle)) || null;
  }, [clienteDetalle, facturaSeleccionadaDetalle]);

  const facturasMapDetalle = useMemo(() => {
    const map = new Map();
    (clienteDetalle?.facturas || []).forEach((f) => {
      map.set(Number(f.id), f);
    });
    return map;
  }, [clienteDetalle]);

  const pagosClienteDetalle = useMemo(() => {
    if (!clienteDetalle) return [];

    const facturasIds = new Set((clienteDetalle.facturas || []).map((f) => Number(f.id)));
    return [...pagosHistorial]
      .filter((pago) => facturasIds.has(Number(pago.factura_id)))
      .sort((a, b) => {
        const fechaA = new Date(a.fecha_pago || a.fecha_creacion || 0).getTime();
        const fechaB = new Date(b.fecha_pago || b.fecha_creacion || 0).getTime();
        return fechaB - fechaA;
      });
  }, [clienteDetalle, pagosHistorial]);

  const extraerPeriodoPago = useCallback((pago) => {
    const factura = facturasMapDetalle.get(Number(pago.factura_id));
    if (factura?.periodo && /^\d{4}-\d{2}$/.test(factura.periodo)) {
      return factura.periodo;
    }

    const fecha = pago?.fecha_pago || pago?.fecha_creacion;
    if (!fecha) return null;

    const parsed = new Date(fecha);
    if (Number.isNaN(parsed.getTime())) return null;
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, [facturasMapDetalle]);

  const aniosPagosClienteDetalle = useMemo(() => {
    const anios = new Set();
    pagosClienteDetalle.forEach((p) => {
      const periodo = extraerPeriodoPago(p);
      if (!periodo) return;
      anios.add(periodo.slice(0, 4));
    });
    return Array.from(anios).sort((a, b) => Number(b) - Number(a));
  }, [pagosClienteDetalle, extraerPeriodoPago]);

  const periodosPagosClienteDetalle = useMemo(() => {
    const periodos = new Set();
    pagosClienteDetalle.forEach((p) => {
      const periodo = extraerPeriodoPago(p);
      if (!periodo) return;
      if (anioFiltroPagosDetalle !== "all" && !periodo.startsWith(`${anioFiltroPagosDetalle}-`)) return;
      periodos.add(periodo);
    });
    return Array.from(periodos).sort((a, b) => b.localeCompare(a));
  }, [pagosClienteDetalle, extraerPeriodoPago, anioFiltroPagosDetalle]);

  const pagosClienteDetalleFiltrados = useMemo(() => {
    const porAnio = anioFiltroPagosDetalle === "all"
      ? pagosClienteDetalle
      : pagosClienteDetalle.filter((p) => {
        const periodo = extraerPeriodoPago(p);
        return periodo?.slice(0, 4) === anioFiltroPagosDetalle;
      });

    if (periodoFiltroPagosDetalle === "all") {
      return porAnio;
    }

    return porAnio.filter((p) => extraerPeriodoPago(p) === periodoFiltroPagosDetalle);
  }, [pagosClienteDetalle, extraerPeriodoPago, anioFiltroPagosDetalle, periodoFiltroPagosDetalle]);

  const pagoDetalleSeleccionado = useMemo(() => {
    if (!pagoSeleccionadoDetalle) return null;
    return pagosClienteDetalleFiltrados.find((p) => String(p.id) === String(pagoSeleccionadoDetalle)) || null;
  }, [pagosClienteDetalleFiltrados, pagoSeleccionadoDetalle]);

  const resumenPagosClienteDetalle = useMemo(() => {
    const totalPagos = pagosClienteDetalleFiltrados.length;
    const montoTotal = pagosClienteDetalleFiltrados.reduce((acc, p) => toMoney(acc + Number(p.monto || p.cantidad_entregada || 0)), 0);
    const ultimoPago = pagosClienteDetalleFiltrados[0] || null;

    return {
      totalPagos,
      montoTotal,
      ultimoPago
    };
  }, [pagosClienteDetalleFiltrados]);

  const extraerAnioFactura = useCallback((factura) => {
    if (factura?.periodo && /^\d{4}-\d{2}$/.test(factura.periodo)) {
      return factura.periodo.slice(0, 4);
    }
    if (factura?.fecha_emision) {
      return String(new Date(factura.fecha_emision).getFullYear());
    }
    return null;
  }, []);

  const aniosClienteDetalle = useMemo(() => {
    const anios = new Set();
    (clienteDetalle?.facturas || []).forEach((f) => {
      const anio = extraerAnioFactura(f);
      if (anio) anios.add(anio);
    });
    return Array.from(anios).sort((a, b) => Number(b) - Number(a));
  }, [clienteDetalle, extraerAnioFactura]);

  const periodosClienteDetalle = useMemo(() => {
    const periodos = new Set();
    (clienteDetalle?.facturas || []).forEach((f) => {
      if (!f.periodo || !/^\d{4}-\d{2}$/.test(f.periodo)) return;
      if (anioFiltroDetalle !== "all" && !f.periodo.startsWith(`${anioFiltroDetalle}-`)) return;
      periodos.add(f.periodo);
    });
    return Array.from(periodos).sort((a, b) => b.localeCompare(a));
  }, [clienteDetalle, anioFiltroDetalle]);

  const facturasDetalleFiltradas = useMemo(() => {
    const data = clienteDetalle?.facturas || [];

    const porAnio = anioFiltroDetalle === "all"
      ? data
      : data.filter((f) => extraerAnioFactura(f) === anioFiltroDetalle);

    if (periodoFiltroDetalle === "all") {
      return porAnio;
    }

    return porAnio.filter((f) => f.periodo === periodoFiltroDetalle);
  }, [clienteDetalle, extraerAnioFactura, anioFiltroDetalle, periodoFiltroDetalle]);

  const formatFecha = (fecha) => {
    if (!fecha) return "No registrada";
    return new Date(fecha).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const isLoading = loadingClientes || loadingFacturas || loadingPagos || loadingPagosHistorial;
  const hasActiveFilters = search || rowsPerPage !== 10 || filtroRanking !== "deuda_desc";

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* ── 1. HEADER Y KPIs ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl p-3 shrink-0">
            <HiCalculator className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">Cobranza por Cliente</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
              Historial completo y cobro distribuido FIFO.
            </p>
          </div>
        </div>

        <div className="w-full md:w-auto flex items-center justify-end gap-3">
          <ImprimirDeudoresDropdown
            onImprimir={handleImprimirMayoresDeudores}
            loading={loadingImprimirDeudores}
          />

          <button
            onClick={abrirModalSeleccionPeriodoRapido}
            className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 h-[44px] shadow-sm flex items-center gap-2 transition-colors hover:bg-slate-800 dark:hover:bg-zinc-100"
          >
            <HiCalculator className="text-lg" />
            Modo Rápido
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1 w-full">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Total Clientes</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400"><HiUserGroup className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">{resumen.clientes_total.toLocaleString("es-MX")}</p>
        </div>

        <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1 w-full">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Con Deuda</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400"><HiCalculator className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">{resumen.clientes_con_deuda.toLocaleString("es-MX")}</p>
        </div>

        <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1 w-full">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Fact. Pendientes</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"><HiDocumentText className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">{resumen.facturas.toLocaleString("es-MX")}</p>
        </div>

        <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1 w-full">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Deuda Visible</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400"><HiCash className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none flex items-baseline gap-0.5">
            <span className="text-lg font-bold text-slate-400">$</span>
            {resumen.deuda.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* ── 2. FILTROS Y TABLA ── */}
      <div className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-transparent rounded-2xl overflow-hidden flex flex-col">
        
        {/* Filtros */}
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-5 relative w-full flex items-center">
              <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                <HiSearch className="w-5 h-5" />
              </span>
              <input
                placeholder="Buscar nombre, predio, correo o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-none h-[52px]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <HiX className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="lg:col-span-5">
              <select
                value={filtroRanking}
                onChange={(e) => setFiltroRanking(e.target.value)}
                aria-label="Ranking de clientes"
                className={SELECT_CLS}
              >
                <option value="deuda_desc">Más deuda primero</option>
                <option value="deuda_asc">Menos deuda primero</option>
                <option value="vencidas_desc">Más facturas vencidas</option>
                <option value="pagadas_desc">Más facturas pagadas</option>
                <option value="predio_asc">Número de predio</option>
                <option value="nombre_asc">Orden alfabético</option>
              </select>
            </div>

            <div className="lg:col-span-2 flex justify-end">
              {hasActiveFilters ? (
                <button
                  onClick={() => {
                    setSearch("");
                    setRowsPerPage(10);
                    setFiltroRanking("deuda_desc");
                  }}
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
            Mostrando <span className="text-slate-700 dark:text-zinc-200">{clientesTablaPaginada.length}</span> de <span className="text-slate-700 dark:text-zinc-200">{clientesPagination.total || 0}</span> clientes
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 hidden sm:block">
              Filas por página:
            </span>
            <select
              value={String(rowsPerPage)}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              aria-label="Clientes por página"
              className="h-[36px] px-3 text-sm font-bold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-none appearance-none cursor-pointer w-20"
            >
              {["10", "20", "30", "50"].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla nativa */}
        <div className="w-full overflow-x-auto bg-white dark:bg-zinc-950">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800">
                {["CLIENTE", "CONTACTO", "FACTURAS (HISTORIAL)", "PENDIENTES", "DEUDA TOTAL", "ACCIONES"].map((col, i, arr) => (
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
              {isLoading && clientesTablaPaginada.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <LoadingSpinner className="w-8 h-8" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 animate-pulse">
                        Cargando cobranza...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : clientesTablaPaginada.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <HiUserGroup className="w-12 h-12 opacity-20 mb-2 text-slate-400 dark:text-zinc-500" />
                      <p className="font-bold text-sm text-slate-600 dark:text-zinc-300">No hay clientes para el filtro seleccionado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                clientesTablaPaginada.map((cliente) => (
                  <tr
                    key={cliente.cliente_id}
                    className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <ClienteUser
                        nombre={cliente.cliente_nombre}
                        numeroPredio={cliente.numero_predio}
                        id={cliente.cliente_id}
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-300 max-w-[220px]">
                        {cliente.telefono && cliente.telefono !== "-" ? (
                          <div className="flex items-center gap-2 font-semibold">
                            <HiPhone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{cliente.telefono}</span>
                          </div>
                        ) : null}
                        {cliente.correo && cliente.correo !== "-" ? (
                          <div className="flex items-center gap-2">
                            <HiMail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{cliente.correo}</span>
                          </div>
                        ) : null}
                        {cliente.direccion && cliente.direccion !== "-" ? (
                          <div className="flex items-center gap-2">
                            <HiLocationMarker className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate text-slate-500 dark:text-zinc-400">{cliente.direccion}</span>
                          </div>
                        ) : null}
                        {(!cliente.telefono || cliente.telefono === "-") && (!cliente.correo || cliente.correo === "-") && (!cliente.direccion || cliente.direccion === "-") && (
                          <span className="italic text-slate-400">Sin contacto</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1.5">
                        <span className="inline-flex items-center w-fit bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md">
                          {cliente.total_facturas} en total
                        </span>
                        <div className="flex gap-3 text-[10px] font-bold uppercase tracking-widest mt-1">
                          <span className="text-emerald-600 dark:text-emerald-400">PAGADAS: {cliente.facturas_pagadas}</span>
                          <span className="text-rose-600 dark:text-rose-400">VENCIDAS: {cliente.facturas_vencidas}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`inline-flex items-center font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md ${cliente.facturas_pendientes > 0 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
                          {cliente.facturas_pendientes} Pendientes
                        </span>
                        <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                          {cliente.factura_mas_antigua_pendiente ? `Más Antigua: #${cliente.factura_mas_antigua_pendiente.id}` : "Sin deuda pendiente"}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`font-black text-lg ${cliente.deuda_total > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        ${cliente.deuda_total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirDetalleCliente(cliente)}
                          title="Ver Detalle"
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 dark:bg-zinc-800 dark:hover:bg-blue-900/30 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
                        >
                          <HiEye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => abrirModalCobro(cliente)}
                          disabled={cliente.deuda_total <= 0}
                          className="h-8 flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 font-bold rounded-lg px-3 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <HiCalculator className="w-4 h-4" />
                          Cobrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación inferior */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              Página {clientesPagination.page || currentPage} de {Math.max(1, clientesPagination.totalPages || 1)}
            </span>
            <SimplePagination
              currentPage={currentPage}
              totalPages={Math.max(1, clientesPagination.totalPages || 1)}
              onChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Modales */}
      <ModalDetalleCobranzaCliente
        isOpen={detalleOpen}
        onClose={cerrarDetalleCliente}
        clienteDetalle={clienteDetalle}
        detalleTab={detalleTab}
        setDetalleTab={setDetalleTab}
        anioFiltroDetalle={anioFiltroDetalle}
        setAnioFiltroDetalle={setAnioFiltroDetalle}
        periodoFiltroDetalle={periodoFiltroDetalle}
        setPeriodoFiltroDetalle={setPeriodoFiltroDetalle}
        facturaSeleccionadaDetalle={facturaSeleccionadaDetalle}
        setFacturaSeleccionadaDetalle={setFacturaSeleccionadaDetalle}
        aniosClienteDetalle={aniosClienteDetalle}
        periodosClienteDetalle={periodosClienteDetalle}
        facturasDetalleFiltradas={facturasDetalleFiltradas}
        ultimoPagoPorFactura={ultimoPagoPorFactura}
        facturaDetalleSeleccionada={facturaDetalleSeleccionada}
        anioFiltroPagosDetalle={anioFiltroPagosDetalle}
        setAnioFiltroPagosDetalle={setAnioFiltroPagosDetalle}
        periodoFiltroPagosDetalle={periodoFiltroPagosDetalle}
        setPeriodoFiltroPagosDetalle={setPeriodoFiltroPagosDetalle}
        setPagoSeleccionadoDetalle={setPagoSeleccionadoDetalle}
        aniosPagosClienteDetalle={aniosPagosClienteDetalle}
        periodosPagosClienteDetalle={periodosPagosClienteDetalle}
        resumenPagosClienteDetalle={resumenPagosClienteDetalle}
        pagosClienteDetalleFiltrados={pagosClienteDetalleFiltrados}
        pagoDetalleSeleccionado={pagoDetalleSeleccionado}
        toMoney={toMoney}
        formatFecha={formatFecha}
        formatearPeriodo={formatearPeriodo}
      />

      <ModalPagoDistribuidoCliente
        isOpen={modalOpen}
        onClose={cerrarModal}
        cliente={clienteSeleccionado}
        onConfirmarPago={procesarCobroDistribuido}
      />

      <ModalSeleccionPeriodoRapido
        isOpen={modalSeleccionPeriodoRapido}
        onClose={() => setModalSeleccionPeriodoRapido(false)}
        periodo={periodoPagoRapido}
        onChangePeriodo={setPeriodoPagoRapido}
        onConfirmar={confirmarPeriodoPagoRapido}
        formatearPeriodo={formatearPeriodo}
      />

      <ModalPagoRapido
        isOpen={modalPagoRapidoOpen}
        onClose={() => setModalPagoRapidoOpen(false)}
        periodo={periodoPagoRapido}
        onPagoRegistrado={refrescarCobranzaTrasPagoRapido}
      />

      {pdfUrl && modoPdf && (
        <ModalImprimir
          pdfUrl={pdfUrl}
          printUrl={printUrl}
          onClose={() => {
            setPdfUrl(null);
            setPrintUrl(null);
            setModoPdf(null);
          }}
          initialMode="print"
        />
      )}
    </div>
  );
};

export default TabCobranzaCliente;

