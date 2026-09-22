import { useState, useMemo } from "react";
import { Skeleton } from "@heroui/react";
import { 
  HiExclamation, 
  HiBan, 
  HiFilter, 
  HiCog, 
  HiCheckCircle, 
  HiRefresh, 
  HiDocumentText, 
  HiClipboardList, 
  HiX,
  HiSearch,
  HiArrowLeft,
  HiChevronDown,
  HiChevronLeft,
  HiChevronRight
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useDeudores } from "../../../context/DeudoresContext";
import { normalizarTexto } from "../../../utils/textUtils";

// Modals
import ModalConfiguracionCortes from "./modals/ModalConfiguracionCortes";
import ModalRealizarCorte from "./modals/ModalRealizarCorte";
import ModalCrearConvenio from "./modals/ModalCrearConvenio";
import ModalParcialidadesConvenio from "./ModalParcialidadesConvenio";

// Componente LoadingSkeleton premium (Token 8)
const LoadingSkeleton = () => (
  <div className="space-y-6 w-full animate-in fade-in">
    <div className="flex justify-between items-center pb-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-3 w-32 rounded-md" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-11 w-24 rounded-xl" />
        <Skeleton className="h-11 w-32 rounded-xl" />
      </div>
    </div>
    <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-zinc-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-[52px] w-full rounded-xl" />
          <Skeleton className="h-[52px] w-full rounded-xl" />
          <Skeleton className="h-[52px] w-full rounded-xl" />
          <Skeleton className="h-[52px] w-full rounded-xl" />
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-950">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 w-full border-b border-slate-100 dark:border-zinc-800/50 flex items-center px-6 gap-4">
             <Skeleton className="h-10 w-10 rounded-full" />
             <div className="space-y-2 flex-1">
               <Skeleton className="h-4 w-1/4 rounded-md" />
               <Skeleton className="h-3 w-1/3 rounded-md" />
             </div>
             <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SELECT_CLS = "w-full h-[52px] px-4 text-sm font-semibold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-none appearance-none cursor-pointer";

const TabDeudores = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const { deudores: candidatos, loading, fetchDeudores } = useDeudores();
  const [error, setError] = useState(null);

  // Estados de Modals
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showCorteModal, setShowCorteModal] = useState(false);
  const [showConvenioModal, setShowConvenioModal] = useState(false);
  const [showParcialidadesModal, setShowParcialidadesModal] = useState(false);
  const [selectedDeudor, setSelectedDeudor] = useState(null);
  const [selectedConvenioId, setSelectedConvenioId] = useState(null);

  // Estados de UI
  const [search, setSearch] = useState("");
  const [filtroGravedad, setFiltroGravedad] = useState("All");
  const [filtroEstado, setFiltroEstado] = useState("All"); 
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // --- API CALLS ---
  const handleReconectar = async (deudor) => {
    if (!confirm(`¿Confirmar reconexión para ${deudor.cliente?.nombre}?`)) return;

    try {
      const result = await window.api.deudores.registrarReconexion(token, {
        medidor_id: deudor.medidor.id,
        observaciones: "Reconexión manual desde panel"
      });

      console.log("Reconexión exitosa:", result);
      alert("Servicio reconectado exitosamente");
      fetchDeudores(); 
    } catch (error) {
      console.error("Error reconectando:", error);
      let errorMsg = "Error al reconectar servicio";

      if (error.message) {
        if (error.message.includes("403") || error.message.includes("Forbidden")) {
          errorMsg = `No se puede reconectar:\n\n` +
            `• El medidor tiene deuda pendiente\n` +
            `• No tiene un convenio de pago activo\n\n` +
            `Soluciones:\n` +
            `1. Crear un convenio de pago, o\n` +
            `2. Pagar la deuda completa`;
        } else {
          errorMsg = error.message;
        }
      }
      alert(errorMsg);
    }
  };

  // --- LÓGICA DE PROCESAMIENTO ---
  const deudoresEnriquecidos = useMemo(() => {
    const hoy = new Date();

    return candidatos.map(d => {
      const fechaVencimiento = d.fecha_vencimiento ? new Date(d.fecha_vencimiento) :
        (d.deuda?.fecha_mas_antigua ? new Date(d.deuda.fecha_mas_antigua) : new Date(new Date().setMonth(new Date().getMonth() - 1)));

      const diferenciaTiempo = hoy - fechaVencimiento;
      const diasRetraso = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));

      let gravedad = "Leve";
      let colorGravedad = "success";

      if (diasRetraso > 90) {
        gravedad = "Crítico";
        colorGravedad = "danger";
      } else if (diasRetraso > 30) {
        gravedad = "Moderado";
        colorGravedad = "warning";
      }

      const isCortado = d.medidor?.estado === "Cortado" || d.medidor?.estado_servicio === "Cortado";

      return {
        ...d,
        id: d.id || d.medidor?.id,
        cliente_nombre: d.cliente?.nombre || "N/A",
        direccion_cliente: d.cliente?.direccion || d.medidor?.direccion || "N/A",
        saldo_pendiente: Number(d.deuda?.total || 0),
        dias_retraso: diasRetraso > 0 ? diasRetraso : 0,
        gravedad,
        colorGravedad,
        isCortado
      };
    }).sort((a, b) => b.dias_retraso - a.dias_retraso);
  }, [candidatos]);

  // Filtros de UI
  const filteredData = useMemo(() => {
    return deudoresEnriquecidos.filter(item => {
      const term = normalizarTexto(search);
      const matchesSearch = search === "" ||
        (item.cliente_nombre && normalizarTexto(item.cliente_nombre).includes(term)) ||
        (item.direccion_cliente && normalizarTexto(item.direccion_cliente).includes(term));

      const matchesGravedad = filtroGravedad === "All" || item.gravedad === filtroGravedad;

      const matchesEstado = filtroEstado === "All" ||
        (filtroEstado === "Activo" && !item.isCortado && !item.tiene_convenio) ||
        (filtroEstado === "Cortado" && item.isCortado) ||
        (filtroEstado === "Convenio" && item.tiene_convenio);

      return matchesSearch && matchesGravedad && matchesEstado;
    });
  }, [deudoresEnriquecidos, search, filtroGravedad, filtroEstado]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // Determinar color de la barra lateral de la fila
  const getRowBorderColor = (item) => {
      if (item.isCortado) return "bg-slate-400 dark:bg-zinc-600";
      if (item.colorGravedad === 'danger') return "bg-red-500";
      if (item.colorGravedad === 'warning') return "bg-orange-500";
      return "bg-emerald-500";
  };

  const hasActiveFilters = search !== "" || filtroGravedad !== "All" || filtroEstado !== "All";

  const clearFilters = () => {
      setSearch("");
      setFiltroGravedad("All");
      setFiltroEstado("All");
      setCurrentPage(1);
  };

  if (!candidatos.length && loading) { 
    return <LoadingSkeleton />;
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500">

      {/* ── 1. HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl shrink-0">
            <HiExclamation className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                  Cartera Vencida y Cortes
              </h3>
              {loading && candidatos.length > 0 && (
                  <div className="w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin ml-1" />
              )}
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
                Gestión de morosidad, suspensiones y convenios
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="bg-slate-100/70 hover:bg-slate-200 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold rounded-xl h-[44px] px-4 min-w-0 shadow-sm flex items-center gap-2 transition-colors text-xs"
            title="Volver"
          >
            <HiArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver</span>
          </button>
          <button
            className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 font-bold rounded-xl h-[44px] px-5 shadow-sm flex items-center gap-2 transition-colors text-xs disabled:opacity-50"
            onClick={fetchDeudores}
            disabled={loading}
          >
            <HiRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            <span>Recargar</span>
          </button>
          <button
            className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 h-[44px] shadow-sm flex items-center gap-2 transition-colors hover:bg-slate-800 dark:hover:bg-zinc-100 text-xs"
            onClick={() => setShowConfigModal(true)}
          >
            <HiCog className="text-lg" />
            <span>Configuración</span>
          </button>
        </div>
      </div>

      {/* ── 2. CONTENEDOR PRINCIPAL: Filtros y Lista ── */}
      <div className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-transparent rounded-2xl overflow-hidden flex flex-col">
        
        {/* Filtros */}
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            
            {/* Buscador */}
            <div className="lg:col-span-5 relative w-full flex items-center">
              <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                <HiSearch className="w-5 h-5" />
              </span>
              <input
                placeholder="Buscar cliente o dirección..."
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                }}
                className="w-full pl-11 pr-10 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-none h-[52px]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <HiX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro Gravedad */}
            <div className="lg:col-span-3">
              <select
                value={filtroGravedad}
                onChange={(e) => {
                  setFiltroGravedad(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filtrar por Gravedad"
                className={SELECT_CLS}
              >
                <option value="All">Todas las gravedades</option>
                <option value="Crítico">Críticos (+90 días)</option>
                <option value="Moderado">Moderados (+30 días)</option>
                <option value="Leve">Leves</option>
              </select>
            </div>

            {/* Filtro Estado Servicio */}
            <div className="lg:col-span-3">
              <select
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filtrar por Estado"
                className={SELECT_CLS}
              >
                <option value="All">Todos los estados</option>
                <option value="Activo">Activos (Con Deuda)</option>
                <option value="Cortado">Servicios Cortados</option>
                <option value="Convenio">En Convenio</option>
              </select>
            </div>

            {/* Botón Limpiar */}
            <div className="lg:col-span-1 flex justify-end">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 h-[52px] rounded-xl flex items-center justify-center transition-colors"
                  title="Limpiar filtros"
                >
                  <HiFilter className="text-lg" />
                </button>
              ) : (
                <div className="w-full h-[52px]" />
              )}
            </div>

          </div>
        </div>

        {/* Sub-Header de Paginación */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4 bg-slate-50/40 dark:bg-zinc-900/30">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Mostrando <span className="text-red-600 dark:text-red-400">{paginatedData.length}</span> de <span className="text-slate-700 dark:text-zinc-200">{filteredData.length}</span> deudores
                {filteredData.length !== candidatos.length && ` (filtrado)`}
            </span>

            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 hidden sm:block">
                    Filas por página:
                </span>
                <div className="relative">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    aria-label="Por página"
                    className="h-9 pl-3 pr-7 text-xs font-bold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 appearance-none cursor-pointer"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                  <HiChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
            </div>
        </div>

        {/* Lista de Filas */}
        <div className="bg-white dark:bg-zinc-950 flex flex-col w-full">
            {paginatedData.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-center mb-4 border border-slate-100 dark:border-zinc-700">
                        <HiClipboardList className="text-3xl text-slate-400 dark:text-zinc-500" />
                    </div>
                    <p className="text-sm font-bold text-slate-600 dark:text-zinc-300">
                        {candidatos.length === 0 && !loading ? "No hay deudores registrados" : "Sin coincidencias"}
                    </p>
                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 mt-1 max-w-[250px]">
                        Intenta cambiar los filtros o recarga la página para obtener datos recientes.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col">
                    {paginatedData.map((item) => (
                        <div 
                            key={item.id} 
                            className={`relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 border-b border-slate-100 dark:border-zinc-800/50 transition-colors
                            ${item.isCortado ? 'bg-slate-50/50 dark:bg-zinc-800/20' : 'hover:bg-slate-50/80 dark:hover:bg-zinc-900/30'}`}
                        >
                            {/* Barra indicadora lateral */}
                            <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-md ${getRowBorderColor(item)} opacity-80`}></div>

                            {/* 1. Información del Cliente */}
                            <div className="flex items-center gap-3.5 lg:w-1/3 pl-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm border border-slate-200 dark:border-zinc-700 shrink-0 ${
                                    item.isCortado ? "bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500" :
                                    item.tiene_convenio ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" :
                                    item.colorGravedad === 'danger' ? "bg-red-500/10 text-red-600 dark:bg-red-900/20 dark:text-red-400" : 
                                    item.colorGravedad === 'warning' ? "bg-orange-500/10 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" : 
                                    "bg-blue-500/10 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                }`}>
                                    {item.cliente_nombre?.charAt(0) || "?"}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className={`font-black text-sm truncate max-w-[180px] sm:max-w-[250px] ${item.isCortado ? 'text-slate-500 dark:text-zinc-500 line-through decoration-slate-400/50' : 'text-slate-800 dark:text-zinc-100'}`}>
                                        {item.cliente_nombre}
                                    </span>
                                    <span className="text-[11px] font-medium text-slate-500 truncate max-w-[250px] mt-0.5">
                                        {item.direccion_cliente}
                                    </span>
                                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                        {item.isCortado && (
                                            <span className="bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
                                                CORTADO
                                            </span>
                                        )}
                                        {item.tiene_convenio && (
                                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                CONVENIO
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 2. Información de Deuda y Tiempo */}
                            <div className="flex flex-row gap-8 lg:w-1/3 justify-start sm:justify-center w-full pl-12 lg:pl-0">
                                
                                {/* Monto */}
                                <div className="flex flex-col items-start min-w-[100px]">
                                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 dark:text-zinc-500 mb-0.5">
                                        {item.tiene_convenio ? "Saldo Convenio" : "Deuda Total"}
                                    </span>
                                    <span className={`text-xl font-black tracking-tight ${item.tiene_convenio ? 'text-emerald-600 dark:text-emerald-400' : item.colorGravedad === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-zinc-100'}`}>
                                        ${item.tiene_convenio ? item.convenio?.saldo_restante?.toLocaleString("es-MX", {minimumFractionDigits: 2}) : item.saldo_pendiente?.toLocaleString("es-MX", {minimumFractionDigits: 2})}
                                    </span>
                                    {item.tiene_convenio && (
                                        <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
                                            {item.convenio?.parcialidades_pendientes} cuotas restantes
                                        </span>
                                    )}
                                </div>

                                {/* Tiempo de Retraso con Barra */}
                                <div className="flex flex-col w-full max-w-[140px] pt-1">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5">
                                        <span className={
                                            item.tiene_convenio ? 'text-emerald-600 dark:text-emerald-400' :
                                            item.isCortado ? 'text-slate-500 dark:text-zinc-400' :
                                            item.colorGravedad === 'danger' ? 'text-red-600 dark:text-red-400' :
                                            item.colorGravedad === 'warning' ? 'text-orange-500 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'
                                        }>
                                            {item.dias_retraso} días
                                        </span>
                                        <span className="text-slate-400 dark:text-zinc-500">Retraso</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-300 ${
                                                item.tiene_convenio ? "bg-emerald-500" :
                                                item.isCortado ? "bg-slate-400" :
                                                item.colorGravedad === 'danger' ? "bg-red-500" :
                                                item.colorGravedad === 'warning' ? "bg-amber-500" : "bg-emerald-500"
                                            }`}
                                            style={{ width: `${Math.min(100, (item.dias_retraso / 120) * 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-2 truncate">
                                        Sugerido: <span className="text-slate-700 dark:text-zinc-300">{item.accion_sugerida}</span>
                                    </span>
                                </div>
                            </div>

                            {/* 3. Acciones y Estado */}
                            <div className="flex flex-wrap items-center gap-2 lg:w-1/3 justify-end w-full pl-12 lg:pl-0">

                                {/* Botón Convenio */}
                                {item.tiene_convenio ? (
                                    <button
                                        className="font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-lg h-9 px-3 flex items-center gap-1.5 text-xs transition-colors"
                                        title={`Convenio Activo - Saldo: $${item.convenio?.saldo_restante?.toLocaleString()} - Avance: ${item.convenio?.total_parcialidades - item.convenio?.parcialidades_pendientes}/${item.convenio?.total_parcialidades}`}
                                        onClick={() => {
                                            setSelectedConvenioId(item.convenio?.id);
                                            setShowParcialidadesModal(true);
                                        }}
                                    >
                                        <HiDocumentText className="text-sm" />
                                        <span>Ver Convenio</span>
                                    </button>
                                ) : (
                                    <button
                                        className="font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 rounded-lg h-9 px-3 flex items-center gap-1.5 text-xs transition-colors"
                                        title="Crear Convenio de Pago"
                                        onClick={() => {
                                            setSelectedDeudor(item);
                                            setShowConvenioModal(true);
                                        }}
                                    >
                                        <HiDocumentText className="text-sm" />
                                        <span>Crear Convenio</span>
                                    </button>
                                )}

                                <div className="w-px h-6 bg-slate-200 dark:bg-zinc-700 mx-1 hidden sm:block"></div>

                                {/* Botón Corte / Reconectar */}
                                {item.isCortado ? (
                                    <button
                                        className="font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-lg h-9 px-3 flex items-center gap-1.5 text-xs transition-colors"
                                        title="Reconectar Servicio"
                                        onClick={() => handleReconectar(item)}
                                    >
                                        <HiCheckCircle className="text-base" />
                                        <span>Reconectar</span>
                                    </button>
                                ) : (
                                    <button
                                        className="font-bold bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded-lg h-9 px-3 flex items-center gap-1.5 text-xs transition-colors"
                                        title="Generar orden de corte"
                                        onClick={() => {
                                            if (item.isCortado) {
                                                alert("El servicio ya está cortado");
                                                return;
                                            }
                                            setSelectedDeudor(item);
                                            setShowCorteModal(true);
                                        }}
                                    >
                                        <HiBan className="text-base" />
                                        <span>Cortar</span>
                                    </button>
                                )}
                            </div>

                        </div>
                    ))}
                </div>
            )}

            {/* Paginación Inferior */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 bg-slate-50/60 dark:bg-zinc-900/40 border-t border-slate-100 dark:border-zinc-800">
                    <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                        Página {currentPage} de {totalPages}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-40 transition-colors"
                        >
                            <HiChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((p, idx, arr) => (
                                    <div key={p} className="flex items-center">
                                        {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-slate-400 text-xs">...</span>}
                                        <button
                                            onClick={() => setCurrentPage(p)}
                                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                                                currentPage === p
                                                    ? 'bg-red-600 text-white shadow-sm'
                                                    : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    </div>
                                ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-40 transition-colors"
                        >
                            <HiChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* MODALS */}
      <ModalConfiguracionCortes isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />

      <ModalRealizarCorte
        isOpen={showCorteModal}
        onClose={() => setShowCorteModal(false)}
        selectedDeudor={selectedDeudor}
        onSuccess={fetchDeudores}
      />

      <ModalCrearConvenio
        isOpen={showConvenioModal}
        onClose={() => {
          setShowConvenioModal(false);
          setSelectedDeudor(null);
        }}
        selectedDeudor={selectedDeudor}
        onSuccess={() => {
          setShowConvenioModal(false);
          setSelectedDeudor(null);
          fetchDeudores(); 
        }}
      />

      <ModalParcialidadesConvenio
        isOpen={showParcialidadesModal}
        onClose={() => {
          setShowParcialidadesModal(false);
          setSelectedConvenioId(null);
        }}
        convenioId={selectedConvenioId}
        onPagoExitoso={() => {
          fetchDeudores(); 
        }}
      />
    </div>
  );
};

export default TabDeudores;
