import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Select,
  SelectItem,
  Pagination,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner
} from "@nextui-org/react";
import { HiCash, HiUserGroup, HiDocumentText, HiCalculator, HiEye, HiFilter, HiX } from "react-icons/hi";
import { useClientes } from "../../../context/ClientesContext";
import { usePagos } from "../../../context/PagosContext";
import { useFeedback } from "../../../context/FeedbackContext";
import ModalPagoDistribuidoCliente from "./ModalPagoDistribuidoCliente";
import ModalPagoRapido from "./ModalPagoRapido";
import ModalDetalleCobranzaCliente from "./ModalDetalleCobranzaCliente";
import ModalSeleccionPeriodoRapido from "./ModalSeleccionPeriodoRapido";
import { formatearPeriodo, obtenerPeriodoActual } from "../../../utils/periodoUtils";
import { SearchIcon } from "../../../IconsApp/IconsSidebar";

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

    // Compatibilidad defensiva: algunos builds pueden devolver solo contador/ids sin detalle de aplicaciones.
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

  const selectClassNames = {
    trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-none h-[52px]",
    value: "font-medium text-slate-700 dark:text-zinc-200 text-sm"
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-0 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 shadow-none">
          <CardBody className="p-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              <span className="p-1.5 rounded-lg bg-slate-500/10 text-slate-600 dark:text-zinc-300"><HiUserGroup className="w-4 h-4" /></span>
              Clientes totales
            </div>
            <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 mt-3">{resumen.clientes_total.toLocaleString("es-MX")}</p>
          </CardBody>
        </Card>

        <Card className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-0 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 shadow-none">
          <CardBody className="p-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600"><HiCalculator className="w-4 h-4" /></span>
              Clientes con deuda
            </div>
            <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 mt-3">{resumen.clientes_con_deuda.toLocaleString("es-MX")}</p>
          </CardBody>
        </Card>

        <Card className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-0 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 shadow-none">
          <CardBody className="p-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600"><HiDocumentText className="w-4 h-4" /></span>
              Facturas pendientes
            </div>
            <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 mt-3">{resumen.facturas.toLocaleString("es-MX")}</p>
          </CardBody>
        </Card>

        <Card className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-0 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 shadow-none">
          <CardBody className="p-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600"><HiCash className="w-4 h-4" /></span>
              Deuda total visible
            </div>
            <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 mt-3">${resumen.deuda.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
          </CardBody>
        </Card>
      </div>

      <Card className="border-none shadow-none bg-transparent rounded-2xl border border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl p-3">
              <HiCash className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">Cobranza por cliente</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
              Historial completo de facturas por cliente. Cobro distribuido FIFO al pagar.
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto flex items-center justify-end">
            <Button
              className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-8 shadow-sm"
              startContent={<HiCalculator className="text-lg" />}
              onPress={abrirModalSeleccionPeriodoRapido}
              title="Modo rapido: selecciona periodo, marca los que NO pagaron y aplica al resto"
            >
              Modo rapido
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-6 border-b border-slate-100 dark:border-zinc-800/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-5 relative w-full flex items-center">
              <span className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                <SearchIcon className="w-5 h-5" />
              </span>
              <input
                placeholder="Buscar nombre, predio, direccion, correo o telefono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-300 shadow-none h-[52px]"
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

            <div className="lg:col-span-3">
              <Select
                aria-label="Ranking de clientes"
                selectedKeys={[filtroRanking]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] || "deuda_desc";
                  setFiltroRanking(String(value));
                }}
                variant="flat"
                classNames={selectClassNames}
              >
                <SelectItem key="deuda_desc" value="deuda_desc">Mas deuda</SelectItem>
                <SelectItem key="deuda_asc" value="deuda_asc">Menos deuda</SelectItem>
                <SelectItem key="vencidas_desc" value="vencidas_desc">Mas facturas vencidas</SelectItem>
                <SelectItem key="pagadas_desc" value="pagadas_desc">Mas facturas pagadas</SelectItem>
                <SelectItem key="predio_asc" value="predio_asc">Numero de predio</SelectItem>
                <SelectItem key="nombre_asc" value="nombre_asc">Orden alfabetico</SelectItem>
              </Select>
            </div>

            <div className="lg:col-span-3">
              <Select
                aria-label="Clientes por pagina"
                selectedKeys={[String(rowsPerPage)]}
                onSelectionChange={(keys) => {
                  const value = Number(Array.from(keys)[0] || 10);
                  setRowsPerPage(value);
                }}
                variant="flat"
                classNames={selectClassNames}
              >
                <SelectItem key="10" value="10">10 clientes</SelectItem>
                <SelectItem key="20" value="20">20 clientes</SelectItem>
                <SelectItem key="30" value="30">30 clientes</SelectItem>
                <SelectItem key="50" value="50">50 clientes</SelectItem>
              </Select>
            </div>

            <div className="lg:col-span-1 flex justify-end">
              {hasActiveFilters ? (
                <Button
                  variant="flat"
                  color="default"
                  onPress={() => {
                    setSearch("");
                    setRowsPerPage(10);
                    setFiltroRanking("deuda_desc");
                  }}
                  className="w-full font-bold text-slate-600 dark:text-zinc-300 bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 shadow-none h-[52px] min-w-0 rounded-xl"
                  isIconOnly
                  title="Limpiar filtros"
                >
                  <HiFilter className="text-slate-400 text-lg" />
                </Button>
              ) : (
                <div className="w-full h-11" />
              )}
            </div>
          </div>
        </CardBody>

        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4 bg-slate-50/40 dark:bg-zinc-900/30">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            Mostrando <span className="text-slate-700 dark:text-zinc-200">{clientesTablaOrdenada.length}</span> de <span className="text-slate-700 dark:text-zinc-200">{clientesPagination.total || 0}</span> clientes
          </span>
        </div>

        <CardBody className="p-0">
          <Table
            aria-label="Clientes para cobranza"
            removeWrapper
            classNames={{
              base: "min-h-[420px]",
              table: "min-w-full",
              th: "bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 py-4",
              td: "text-sm font-medium text-slate-600 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/50 py-4",
              tr: "hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-colors cursor-default"
            }}
          >
            <TableHeader>
              <TableColumn>CLIENTE</TableColumn>
              <TableColumn>CONTACTO</TableColumn>
              <TableColumn>FACTURAS (HISTORIAL)</TableColumn>
              <TableColumn>PENDIENTES</TableColumn>
              <TableColumn>DEUDA TOTAL</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody
              items={clientesTablaPaginada}
              isLoading={isLoading}
              loadingContent={<Spinner color="default" />}
              emptyContent={
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400 dark:text-zinc-500">
                  <HiUserGroup className="w-12 h-12 opacity-20 mb-2" />
                  <p className="font-bold">No hay clientes para el filtro seleccionado</p>
                </div>
              }
            >
              {(cliente) => (
                <TableRow key={cliente.cliente_id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-slate-800 dark:text-zinc-100">{cliente.cliente_nombre}</div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">Predio: {cliente.numero_predio}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cliente.estado_cliente}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-xs text-slate-600 dark:text-zinc-300 max-w-[220px]">
                      <div className="font-semibold">Telefono: {cliente.telefono}</div>
                      <div className="truncate text-slate-500 dark:text-zinc-400">Direccion: {cliente.direccion}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Chip size="sm" variant="flat" className="bg-slate-200/50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">{cliente.total_facturas} en total</Chip>
                      <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">Pagadas: {cliente.facturas_pagadas}</div>
                      <div className="text-[10px] font-medium text-rose-500 dark:text-rose-400">Vencidas: {cliente.facturas_vencidas}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-700 dark:text-zinc-300">
                      <Chip size="sm" variant="flat" className={cliente.facturas_pendientes > 0 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}>{cliente.facturas_pendientes} en total</Chip>
                      <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                        {cliente.factura_mas_antigua_pendiente ? `Antigua #${cliente.factura_mas_antigua_pendiente.id}` : "Sin deuda pendiente"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-black text-lg ${cliente.deuda_total > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      ${cliente.deuda_total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="flat"
                        className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold"
                        startContent={<HiEye className="w-4 h-4" />}
                        onPress={() => abrirDetalleCliente(cliente)}
                      >
                        Detalle
                      </Button>

                      <Button
                        variant="flat"
                        className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold"
                        startContent={<HiCalculator className="w-4 h-4" />}
                        onPress={() => abrirModalCobro(cliente)}
                        isDisabled={cliente.deuda_total <= 0}
                      >
                        Cobrar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40">
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              Mostrando pagina {clientesPagination.page || currentPage} de {Math.max(1, clientesPagination.totalPages || 1)} · Total clientes: {clientesPagination.total || 0}
            </span>
            <Pagination
              total={Math.max(1, clientesPagination.totalPages || 1)}
              page={currentPage}
              onChange={setCurrentPage}
              showControls
              color="default"
              classNames={{ cursor: "bg-slate-800 text-white dark:bg-zinc-200 dark:text-slate-900 font-bold" }}
            />
          </div>
        </CardBody>
      </Card>

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
    </div>
  );
};

export default TabCobranzaCliente;
