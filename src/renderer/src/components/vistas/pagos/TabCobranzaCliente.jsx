import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner
} from "@nextui-org/react";
import { HiCash, HiUserGroup, HiDocumentText, HiCalculator, HiEye, HiUser, HiCog, HiFilter, HiX } from "react-icons/hi";
import { useClientes } from "../../../context/ClientesContext";
import { usePagos } from "../../../context/PagosContext";
import { useFeedback } from "../../../context/FeedbackContext";
import ModalPagoDistribuidoCliente from "./ModalPagoDistribuidoCliente";
import ModalPagoRapido from "./ModalPagoRapido";
import SelectorPeriodoAvanzado from "../../ui/SelectorPeriodoAvanzado";
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

    const result = await registrarPagoDistribuido({
        cliente_id: clienteSeleccionado.cliente_id,
        fecha_pago: payload.fecha_pago,
        cantidad_entregada: payload.cantidad_entregada,
        metodo_pago: payload.metodo_pago,
        comentario: payload.comentario || null,
        modificado_por: usuario.id || 1
      });

      await Promise.all([
        cargarFacturasHistorial(),
        cargarPagosHistorial(),
        cargarClientes(),
        fetchPagos()
      ]);

      setSuccess(
        `Cobro aplicado en ${result?.data?.facturas_afectadas || payload?.preview?.aplicaciones?.length || 0} factura(s).`,
        "Cobranza"
      );
      return result;
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
    trigger: "bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors h-11",
    value: "font-medium text-slate-700 dark:text-zinc-200 text-sm"
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm rounded-2xl">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
              <HiUserGroup className="w-4 h-4" />
              Clientes totales
            </div>
            <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-2">{resumen.clientes_total.toLocaleString("es-MX")}</p>
          </CardBody>
        </Card>

        <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm rounded-2xl">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
              <HiCalculator className="w-4 h-4" />
              Clientes con deuda
            </div>
            <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-2">{resumen.clientes_con_deuda.toLocaleString("es-MX")}</p>
          </CardBody>
        </Card>

        <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm rounded-2xl">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
              <HiDocumentText className="w-4 h-4" />
              Facturas pendientes
            </div>
            <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-2">{resumen.facturas.toLocaleString("es-MX")}</p>
          </CardBody>
        </Card>

        <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm rounded-2xl">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
              <HiCash className="w-4 h-4" />
              Deuda total visible
            </div>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">${resumen.deuda.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
          </CardBody>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Cobranza por cliente</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-1">
              Historial completo de facturas por cliente. Cobro distribuido FIFO al pagar.
            </p>
          </div>

          <div className="w-full md:w-auto flex items-center justify-end">
            <Button
              color="success"
              variant="flat"
              className="font-bold bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
              startContent={<HiCalculator className="text-lg" />}
              onPress={abrirModalSeleccionPeriodoRapido}
              title="Modo rapido: selecciona periodo, marca los que NO pagaron y aplica al resto"
            >
              Modo rapido
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-6 bg-slate-50/50 dark:bg-black/10 border-b border-slate-100 dark:border-zinc-800/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-5 relative w-full flex items-center">
              <span className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                <SearchIcon className="w-5 h-5" />
              </span>
              <input
                placeholder="Buscar nombre, predio, direccion, correo o telefono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-sm h-11"
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
                variant="bordered"
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
                variant="bordered"
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
                  className="w-full font-bold text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm h-11 min-w-0"
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

        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4">
          <span className="text-sm font-bold text-slate-600 dark:text-zinc-400">
            Mostrando <span className="text-blue-600 dark:text-blue-400">{clientesTablaOrdenada.length}</span> de <span className="text-slate-800 dark:text-zinc-200">{clientesPagination.total || 0}</span> clientes
          </span>
        </div>

        <CardBody className="p-0">
          <Table
            aria-label="Clientes para cobranza"
            removeWrapper
            classNames={{
              base: "min-h-[420px]",
              table: "min-w-full",
              thead: "bg-slate-50 dark:bg-zinc-800/50",
              th: "bg-transparent text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px] py-3 border-b border-slate-200 dark:border-zinc-700",
              td: "py-3 border-b border-slate-100 dark:border-zinc-800/50",
              tr: "hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors cursor-default"
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
              loadingContent={<Spinner color="success" />}
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
                      <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">ID: {cliente.cliente_id} · Predio: {cliente.numero_predio}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cliente.estado_cliente}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-xs text-slate-600 dark:text-zinc-300 max-w-[220px]">
                      <div className="font-semibold">{cliente.telefono}</div>
                      <div className="truncate">{cliente.correo}</div>
                      <div className="truncate text-slate-500 dark:text-zinc-400">{cliente.direccion}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Chip size="sm" color="primary" variant="flat">{cliente.total_facturas} total</Chip>
                      <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">Pagadas: {cliente.facturas_pagadas}</div>
                      <div className="text-[10px] font-medium text-red-500 dark:text-red-400">Vencidas: {cliente.facturas_vencidas}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-700 dark:text-zinc-300">
                      <Chip size="sm" color={cliente.facturas_pendientes > 0 ? "warning" : "success"} variant="flat">{cliente.facturas_pendientes}</Chip>
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
                        color="default"
                        variant="flat"
                        startContent={<HiEye className="w-4 h-4" />}
                        onPress={() => abrirDetalleCliente(cliente)}
                      >
                        Detalle
                      </Button>

                      <Button
                        color="success"
                        variant="flat"
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
              color="success"
            />
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={detalleOpen} onClose={cerrarDetalleCliente} size="5xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span className="text-xl font-bold">Detalle de facturas del cliente</span>
            <span className="text-sm text-slate-500 dark:text-zinc-400">{clienteDetalle?.cliente_nombre} - Predio {clienteDetalle?.numero_predio}</span>
          </ModalHeader>
          <ModalBody className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Chip color="primary" variant="flat">Facturas historial: {clienteDetalle?.total_facturas || 0}</Chip>
              <Chip color="warning" variant="flat">Pendientes: {clienteDetalle?.facturas_pendientes || 0}</Chip>
              <Chip color="danger" variant="flat">Deuda total: ${toMoney(clienteDetalle?.deuda_total || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</Chip>
            </div>

            <Tabs
              selectedKey={detalleTab}
              onSelectionChange={(key) => setDetalleTab(String(key))}
              variant="underlined"
              classNames={{
                base: "w-full",
                tabList: "gap-6 w-full relative rounded-none p-0 border-b border-slate-200 dark:border-zinc-800",
                cursor: "w-full bg-blue-600 dark:bg-blue-500 h-0.5",
                tab: "max-w-fit px-0 h-11",
                tabContent: "group-data-[selected=true]:text-blue-600 dark:group-data-[selected=true]:text-blue-400 group-data-[selected=true]:font-bold text-slate-500 dark:text-zinc-400 font-medium text-sm transition-colors"
              }}
            >
              <Tab key="facturas" title={<div className="flex items-center gap-2"><HiDocumentText className="w-4 h-4" /><span>Facturas</span></div>}>
                <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-800/50 rounded-2xl mt-4">
                  <CardBody className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Select
                        label="Año"
                        selectedKeys={[anioFiltroDetalle]}
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] || "all";
                          setAnioFiltroDetalle(String(value));
                          setPeriodoFiltroDetalle("all");
                          setFacturaSeleccionadaDetalle(null);
                        }}
                      >
                        <SelectItem key="all" value="all">Todos los años</SelectItem>
                        {aniosClienteDetalle.map((anio) => (
                          <SelectItem key={anio} value={anio}>{anio}</SelectItem>
                        ))}
                      </Select>

                      <Select
                        label="Período del año"
                        selectedKeys={[periodoFiltroDetalle]}
                        isDisabled={anioFiltroDetalle === "all"}
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] || "all";
                          setPeriodoFiltroDetalle(String(value));
                          setFacturaSeleccionadaDetalle(null);
                        }}
                      >
                        <SelectItem key="all" value="all">Todos los períodos del año</SelectItem>
                        {periodosClienteDetalle.map((periodo) => (
                          <SelectItem key={periodo} value={periodo}>{formatearPeriodo(periodo)}</SelectItem>
                        ))}
                      </Select>

                      <div className="flex items-end">
                        <Button
                          variant="flat"
                          color="default"
                          className="w-full"
                          onPress={() => {
                            setAnioFiltroDetalle("all");
                            setPeriodoFiltroDetalle("all");
                            setFacturaSeleccionadaDetalle(null);
                          }}
                        >
                          Limpiar filtros
                        </Button>
                      </div>
                    </div>

                    <Table aria-label="Facturas del cliente" removeWrapper>
                      <TableHeader>
                        <TableColumn>FACTURA</TableColumn>
                        <TableColumn>PERIODO</TableColumn>
                        <TableColumn>ESTADO</TableColumn>
                        <TableColumn>TOTAL</TableColumn>
                        <TableColumn>SALDO</TableColumn>
                        <TableColumn>ULT. PAGO</TableColumn>
                        <TableColumn>ACCIONES</TableColumn>
                      </TableHeader>
                      <TableBody items={facturasDetalleFiltradas} emptyContent="No hay facturas para ese filtro">
                        {(item) => (
                          <TableRow key={item.id}>
                            <TableCell>#{item.id}</TableCell>
                            <TableCell>{item.periodo || item.mes_facturado || "Sin periodo"}</TableCell>
                            <TableCell><Chip size="sm" variant="flat">{item.estado || "Pendiente"}</Chip></TableCell>
                            <TableCell>${toMoney(item.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell>${toMoney(item.saldo_pendiente).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell>{formatFecha(ultimoPagoPorFactura.get(Number(item.id)))}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                color="primary"
                                variant="flat"
                                onPress={() => setFacturaSeleccionadaDetalle(String(item.id))}
                              >
                                Mas info
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    {facturaDetalleSeleccionada && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm pt-2">
                          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                            <p className="text-slate-500 dark:text-zinc-400">Estado</p>
                            <p className="font-bold text-slate-800 dark:text-zinc-100">{facturaDetalleSeleccionada.estado || "Pendiente"}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                            <p className="text-slate-500 dark:text-zinc-400">Periodo facturado</p>
                            <p className="font-bold text-slate-800 dark:text-zinc-100">{facturaDetalleSeleccionada.periodo || facturaDetalleSeleccionada.mes_facturado || "Sin periodo"}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                            <p className="text-slate-500 dark:text-zinc-400">Vencimiento</p>
                            <p className="font-bold text-slate-800 dark:text-zinc-100">{formatFecha(facturaDetalleSeleccionada.fecha_vencimiento)}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                            <p className="text-slate-500 dark:text-zinc-400">Consumo registrado</p>
                            <p className="font-bold text-slate-800 dark:text-zinc-100">{facturaDetalleSeleccionada.consumo_m3 ?? "-"} m3</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                            <p className="text-slate-500 dark:text-zinc-400">Fecha de lectura</p>
                            <p className="font-bold text-slate-800 dark:text-zinc-100">{formatFecha(facturaDetalleSeleccionada.fecha_lectura)}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                            <p className="text-slate-500 dark:text-zinc-400">Fecha de pago</p>
                            <p className="font-bold text-slate-800 dark:text-zinc-100">{formatFecha(ultimoPagoPorFactura.get(Number(facturaDetalleSeleccionada.id)))}</p>
                          </div>
                        </div>

                        <Card className="border border-blue-200/60 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl shadow-sm">
                          <CardBody className="p-5 space-y-4">
                            <h4 className="text-xs font-bold text-blue-700/60 dark:text-blue-500/60 uppercase tracking-wider flex items-center gap-2">
                              <HiCog className="w-4 h-4" /> Datos del Servicio
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-[11px] font-bold text-blue-700/60 dark:text-blue-500/60 uppercase tracking-wider">Medidor</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 font-mono">{facturaDetalleSeleccionada.medidor?.numero_serie || "No asignado"}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-blue-700/60 dark:text-blue-500/60 uppercase tracking-wider">Tarifa</p>
                                <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{facturaDetalleSeleccionada.tarifa_nombre || "No especificada"}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-blue-700/60 dark:text-blue-500/60 uppercase tracking-wider">Ruta</p>
                                <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{facturaDetalleSeleccionada.ruta?.nombre || "Sin ruta"}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-blue-100/50 dark:border-blue-900/30">
                              <div>
                                <p className="text-[11px] font-bold text-blue-700/60 dark:text-blue-500/60 uppercase tracking-wider">Total factura</p>
                                <p className="text-lg font-black text-slate-800 dark:text-zinc-100">${toMoney(facturaDetalleSeleccionada.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-blue-700/60 dark:text-blue-500/60 uppercase tracking-wider">Saldo pendiente</p>
                                <p className="text-lg font-black text-rose-600 dark:text-rose-400">${toMoney(facturaDetalleSeleccionada.saldo_pendiente).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      </>
                    )}
                  </CardBody>
                </Card>
              </Tab>

              <Tab key="cliente" title={<div className="flex items-center gap-2"><HiUser className="w-4 h-4" /><span>Datos del Cliente</span></div>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                    <CardBody className="p-5 space-y-4">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Identificacion</h4>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Nombre</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">{clienteDetalle?.cliente_nombre || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Numero de predio</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{clienteDetalle?.numero_predio || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Estado del cliente</p>
                        <Chip size="sm" variant="flat" color={String(clienteDetalle?.estado_cliente || "").toLowerCase() === "activo" ? "success" : "warning"}>{clienteDetalle?.estado_cliente || "Activo"}</Chip>
                      </div>
                    </CardBody>
                  </Card>

                  <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                    <CardBody className="p-5 space-y-4">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Contacto</h4>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Telefono</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{clienteDetalle?.telefono || "No registrado"}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Correo</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300 break-all">{clienteDetalle?.correo || "No registrado"}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Direccion</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{clienteDetalle?.direccion || "No registrada"}</p>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </Tab>

              <Tab key="pagos" title={<div className="flex items-center gap-2"><HiCash className="w-4 h-4" /><span>Pagos Hechos</span></div>}>
                <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-800/50 rounded-2xl mt-4">
                  <CardBody className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Select
                        label="Año"
                        selectedKeys={[anioFiltroPagosDetalle]}
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] || "all";
                          setAnioFiltroPagosDetalle(String(value));
                          setPeriodoFiltroPagosDetalle("all");
                          setPagoSeleccionadoDetalle(null);
                        }}
                      >
                        <SelectItem key="all" value="all">Todos los años</SelectItem>
                        {aniosPagosClienteDetalle.map((anio) => (
                          <SelectItem key={anio} value={anio}>{anio}</SelectItem>
                        ))}
                      </Select>

                      <Select
                        label="Período del año"
                        selectedKeys={[periodoFiltroPagosDetalle]}
                        isDisabled={anioFiltroPagosDetalle === "all"}
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] || "all";
                          setPeriodoFiltroPagosDetalle(String(value));
                          setPagoSeleccionadoDetalle(null);
                        }}
                      >
                        <SelectItem key="all" value="all">Todos los períodos del año</SelectItem>
                        {periodosPagosClienteDetalle.map((periodo) => (
                          <SelectItem key={periodo} value={periodo}>{formatearPeriodo(periodo)}</SelectItem>
                        ))}
                      </Select>

                      <div className="flex items-end">
                        <Button
                          variant="flat"
                          color="default"
                          className="w-full"
                          onPress={() => {
                            setAnioFiltroPagosDetalle("all");
                            setPeriodoFiltroPagosDetalle("all");
                            setPagoSeleccionadoDetalle(null);
                          }}
                        >
                          Limpiar filtros
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Chip color="primary" variant="flat">Pagos registrados: {resumenPagosClienteDetalle.totalPagos}</Chip>
                      <Chip color="success" variant="flat">Monto total pagado: ${toMoney(resumenPagosClienteDetalle.montoTotal).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</Chip>
                      <Chip color="warning" variant="flat">Ultimo pago: {formatFecha(resumenPagosClienteDetalle.ultimoPago?.fecha_pago || resumenPagosClienteDetalle.ultimoPago?.fecha_creacion)}</Chip>
                    </div>

                    <Table aria-label="Pagos del cliente" removeWrapper>
                      <TableHeader>
                        <TableColumn>PAGO</TableColumn>
                        <TableColumn>FACTURA</TableColumn>
                        <TableColumn>FECHA</TableColumn>
                        <TableColumn>METODO</TableColumn>
                        <TableColumn>MONTO</TableColumn>
                        <TableColumn>ACCIONES</TableColumn>
                      </TableHeader>
                      <TableBody items={pagosClienteDetalleFiltrados} emptyContent="No hay pagos registrados para ese filtro">
                        {(item) => (
                          <TableRow key={item.id}>
                            <TableCell>#{item.id}</TableCell>
                            <TableCell>#{item.factura_id || "-"}</TableCell>
                            <TableCell>{formatFecha(item.fecha_pago || item.fecha_creacion)}</TableCell>
                            <TableCell>
                              <Chip size="sm" variant="flat" color="primary">{item.metodo_pago || "No especificado"}</Chip>
                            </TableCell>
                            <TableCell>${toMoney(item.monto || item.cantidad_entregada).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                color="primary"
                                variant="flat"
                                onPress={() => setPagoSeleccionadoDetalle(String(item.id))}
                              >
                                Mas info
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    {pagoDetalleSeleccionado && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm pt-2">
                        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                          <p className="text-slate-500 dark:text-zinc-400">ID del pago</p>
                          <p className="font-bold text-slate-800 dark:text-zinc-100">#{pagoDetalleSeleccionado.id}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                          <p className="text-slate-500 dark:text-zinc-400">Factura relacionada</p>
                          <p className="font-bold text-slate-800 dark:text-zinc-100">#{pagoDetalleSeleccionado.factura_id || "-"}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                          <p className="text-slate-500 dark:text-zinc-400">Fecha de pago</p>
                          <p className="font-bold text-slate-800 dark:text-zinc-100">{formatFecha(pagoDetalleSeleccionado.fecha_pago || pagoDetalleSeleccionado.fecha_creacion)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                          <p className="text-slate-500 dark:text-zinc-400">Metodo</p>
                          <p className="font-bold text-slate-800 dark:text-zinc-100">{pagoDetalleSeleccionado.metodo_pago || "No especificado"}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                          <p className="text-slate-500 dark:text-zinc-400">Monto pagado</p>
                          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">${toMoney(pagoDetalleSeleccionado.monto || pagoDetalleSeleccionado.cantidad_entregada).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                          <p className="text-slate-500 dark:text-zinc-400">Comentario</p>
                          <p className="font-semibold text-slate-700 dark:text-zinc-300">{pagoDetalleSeleccionado.comentario || "Sin comentario"}</p>
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Tab>

            </Tabs>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={cerrarDetalleCliente}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ModalPagoDistribuidoCliente
        isOpen={modalOpen}
        onClose={cerrarModal}
        cliente={clienteSeleccionado}
        onConfirmarPago={procesarCobroDistribuido}
      />

      <Modal isOpen={modalSeleccionPeriodoRapido} onClose={() => setModalSeleccionPeriodoRapido(false)} size="lg" backdrop="opaque">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span className="text-xl font-bold">Modo rapido de pagos</span>
            <span className="text-sm text-slate-500 dark:text-zinc-400">Selecciona el periodo para aplicar pagos masivos</span>
          </ModalHeader>
          <ModalBody>
            <SelectorPeriodoAvanzado
              value={periodoPagoRapido}
              onChange={setPeriodoPagoRapido}
              placeholder="Buscar y seleccionar período"
              startYear={2020}
              size="sm"
              className="w-full"
            />
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Periodo seleccionado: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatearPeriodo(periodoPagoRapido)}</span>
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setModalSeleccionPeriodoRapido(false)}>Cancelar</Button>
            <Button color="success" onPress={confirmarPeriodoPagoRapido}>Continuar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
