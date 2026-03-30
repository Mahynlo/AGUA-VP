import { useState, useMemo } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Select,
  SelectItem,
  User,
  Pagination,
  Tooltip,
  Progress,
  Spinner,
  Skeleton
} from "@nextui-org/react";
import { FlechaReturnIcon } from "../../../IconsApp/IconsAppSystem";
import { SearchIcon } from "../../../IconsApp/IconsSidebar";
import { HiExclamation, HiBan, HiFilter, HiCog, HiCheckCircle, HiRefresh, HiDocumentText, HiClipboardList, HiX } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useDeudores } from "../../../context/DeudoresContext";

// Modals
import ModalConfiguracionCortes from "./modals/ModalConfiguracionCortes";
import ModalRealizarCorte from "./modals/ModalRealizarCorte";
import ModalCrearConvenio from "./modals/ModalCrearConvenio";
import ModalParcialidadesConvenio from "./ModalParcialidadesConvenio";

// Componente LoadingSkeleton premium
const LoadingSkeleton = () => (
  <div className="space-y-6 w-full animate-in fade-in">
    <Card className="border-none shadow-sm rounded-2xl">
      <CardBody className="p-6 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <div className="flex gap-2">
              <Skeleton className="h-10 w-32 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </CardBody>
    </Card>
    <Card className="border-none shadow-sm rounded-2xl">
      <CardBody className="p-0">
          <Skeleton className="h-12 w-full rounded-none border-b border-gray-100" />
          {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-none border-b border-gray-50" />
          ))}
      </CardBody>
    </Card>
  </div>
);

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
      const matchesSearch = search === "" ||
        item.cliente_nombre?.toLowerCase().includes(search.toLowerCase()) ||
        item.direccion_cliente?.toLowerCase().includes(search.toLowerCase());

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

  const selectClassNames = {
    trigger: "bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors h-11",
    value: "font-medium text-slate-700 dark:text-zinc-200 text-sm"
  };

  if (!candidatos.length && loading) { // Solo si es la primera carga real
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">

      {/* ── 1. HEADER Y FILTROS ── */}
      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 dark:bg-red-500/20 rounded-xl">
              <HiExclamation className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                    Cartera Vencida y Cortes
                </h3>
                {loading && (
                    <Spinner size="sm" color="danger" className="w-4 h-4 ml-1" />
                )}
              </div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                  Gestión de morosidad y convenios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <Button
              color="default"
              variant="flat"
              onPress={() => navigate(-1)}
              className="bg-slate-100 dark:bg-zinc-800 font-bold text-slate-600 dark:text-zinc-300"
              startContent={<FlechaReturnIcon className="w-5 h-5" />}
              isIconOnly
              title="Volver"
            />
            <Button
              color="primary"
              variant="flat"
              className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold"
              onPress={fetchDeudores}
              startContent={!loading && <HiRefresh className="text-lg" />}
              isLoading={loading}
            >
              Recargar
            </Button>
            <Button
              color="primary"
              className="font-bold shadow-md shadow-blue-500/30"
              onPress={() => setShowConfigModal(true)}
              startContent={<HiCog className="text-lg" />}
            >
              Configuración
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-6 bg-slate-50/50 dark:bg-black/10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            
            {/* Buscador */}
            <div className="lg:col-span-5 relative w-full flex items-center">
              <span className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                <SearchIcon className="w-5 h-5" />
              </span>
              <input
                placeholder="Buscar cliente o dirección..."
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                }}
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

            {/* Filtro Gravedad */}
            <div className="lg:col-span-3">
                <Select
                    placeholder="Todas las gravedades"
                    selectedKeys={[filtroGravedad]}
                    onSelectionChange={(keys) => {
                        setFiltroGravedad(Array.from(keys)[0] || "All");
                        setCurrentPage(1);
                    }}
                    startContent={<HiExclamation className="text-slate-400" />}
                    aria-label="Filtrar por Gravedad"
                    variant="bordered"
                    classNames={selectClassNames}
                >
                    <SelectItem key="All" value="All">Todas</SelectItem>
                    <SelectItem key="Crítico" value="Crítico" className="text-red-600 font-medium">Críticos (+90 días)</SelectItem>
                    <SelectItem key="Moderado" value="Moderado" className="text-orange-500 font-medium">Moderados (+30 días)</SelectItem>
                    <SelectItem key="Leve" value="Leve" className="text-emerald-600 font-medium">Leves</SelectItem>
                </Select>
            </div>

            {/* Filtro Estado Servicio */}
            <div className="lg:col-span-3">
                <Select
                    placeholder="Todos los estados"
                    selectedKeys={[filtroEstado]}
                    onSelectionChange={(keys) => {
                        setFiltroEstado(Array.from(keys)[0] || "All");
                        setCurrentPage(1);
                    }}
                    startContent={<HiFilter className="text-slate-400" />}
                    aria-label="Filtrar por Estado"
                    variant="bordered"
                    classNames={selectClassNames}
                >
                    <SelectItem key="All" value="All">Todos</SelectItem>
                    <SelectItem key="Activo" value="Activo">Activos (Con Deuda)</SelectItem>
                    <SelectItem key="Cortado" value="Cortado">Servicios Cortados</SelectItem>
                    <SelectItem key="Convenio" value="Convenio">En Convenio</SelectItem>
                </Select>
            </div>

            {/* Botón Limpiar */}
            <div className="lg:col-span-1 flex justify-end">
                {hasActiveFilters ? (
                    <Button 
                        variant="flat" 
                        color="default"
                        onPress={clearFilters}
                        className="w-full font-bold text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm h-11 min-w-0"
                        isIconOnly
                        title="Limpiar filtros"
                    >
                        <HiFilter className="text-slate-400 text-lg" />
                    </Button>
                ) : (
                    <div className="w-full h-11"></div> 
                )}
            </div>

          </div>
        </CardBody>
      </Card>

      {/* ── 2. LISTA DE DEUDORES (Vista de Filas) ── */}
      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
        
        {/* Cabecera interna de tabla */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4">
            <span className="text-sm font-bold text-slate-600 dark:text-zinc-400">
                Mostrando <span className="text-red-600 dark:text-red-400">{paginatedData.length}</span> de <span className="text-slate-800 dark:text-zinc-200">{filteredData.length}</span> deudores
                {filteredData.length !== candidatos.length && ` (filtrado de ${candidatos.length})`}
            </span>

            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
                    Filas por página:
                </span>
                <Select
                    size="sm"
                    aria-label="Por página"
                    className="w-24"
                    variant="bordered"
                    selectedKeys={[rowsPerPage.toString()]}
                    onSelectionChange={(keys) => {
                        setRowsPerPage(Number(Array.from(keys)[0]));
                        setCurrentPage(1);
                    }}
                    classNames={{
                        trigger: "bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 shadow-sm rounded-lg",
                        value: "font-bold text-slate-700 dark:text-zinc-300"
                    }}
                >
                    <SelectItem key="5" value="5">5</SelectItem>
                    <SelectItem key="10" value="10">10</SelectItem>
                    <SelectItem key="15" value="15">15</SelectItem>
                    <SelectItem key="20" value="20">20</SelectItem>
                    <SelectItem key="50" value="50">50</SelectItem>
                </Select>
            </div>
        </div>

        <CardBody className="p-0">
            {paginatedData.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-center mb-4">
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
                            ${item.isCortado ? 'bg-slate-50/50 dark:bg-zinc-800/20' : 'hover:bg-slate-50/30 dark:hover:bg-zinc-800/10'}`}
                        >
                            {/* Barra indicadora lateral */}
                            <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-md ${getRowBorderColor(item)} opacity-80`}></div>

                            {/* 1. Información del Cliente */}
                            <div className="flex items-center gap-4 lg:w-1/3 pl-3">
                                <User
                                    name={
                                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                            <span className={`font-bold text-sm truncate max-w-[180px] sm:max-w-[250px] ${item.isCortado ? 'text-slate-500 dark:text-zinc-400 line-through decoration-slate-400/50' : 'text-slate-800 dark:text-zinc-100'}`}>
                                                {item.cliente_nombre}
                                            </span>
                                        </div>
                                    }
                                    description={
                                        <div className="flex flex-col gap-1.5 mt-1">
                                            <span className="text-[11px] font-medium text-slate-500 truncate max-w-[250px]">
                                                {item.direccion_cliente}
                                            </span>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {item.isCortado && (
                                                    <Chip size="sm" className="bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold text-[9px] uppercase tracking-widest px-1 h-5 border border-slate-200 dark:border-zinc-700">
                                                        CORTADO
                                                    </Chip>
                                                )}
                                                {item.tiene_convenio && (
                                                    <Chip size="sm" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold text-[9px] uppercase tracking-widest px-1 h-5 border border-emerald-200 dark:border-emerald-800/50">
                                                        CONVENIO
                                                    </Chip>
                                                )}
                                            </div>
                                        </div>
                                    }
                                    avatarProps={{
                                        radius: "md",
                                        size: "sm",
                                        className: `font-bold text-sm ${
                                            item.isCortado ? "bg-slate-200 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500" :
                                            item.tiene_convenio ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400" :
                                            item.colorGravedad === 'danger' ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" : 
                                            item.colorGravedad === 'warning' ? "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400" : 
                                            "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                                        }`,
                                        name: item.cliente_nombre?.charAt(0) || "?"
                                    }}
                                />
                            </div>

                            {/* 2. Información de Deuda y Tiempo */}
                            <div className="flex flex-row gap-6 lg:w-1/3 justify-start sm:justify-center w-full pl-12 lg:pl-0">
                                
                                {/* Monto */}
                                <div className="flex flex-col items-start min-w-[100px]">
                                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 dark:text-zinc-500 mb-0.5">
                                        {item.tiene_convenio ? "Saldo Convenio" : "Deuda Total"}
                                    </span>
                                    <span className={`text-xl font-black tracking-tight ${item.tiene_convenio ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-zinc-100'}`}>
                                        ${item.tiene_convenio ? item.convenio?.saldo_restante?.toLocaleString("es-MX", {minimumFractionDigits: 2}) : item.saldo_pendiente?.toLocaleString("es-MX", {minimumFractionDigits: 2})}
                                    </span>
                                    {item.tiene_convenio && (
                                        <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
                                            {item.convenio?.parcialidades_pendientes} cuotas restantes
                                        </span>
                                    )}
                                </div>

                                {/* Tiempo de Retraso con Barra */}
                                <div className="flex flex-col w-full max-w-[140px]">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5">
                                        <span className={
                                            item.tiene_convenio ? 'text-emerald-600 dark:text-emerald-400' :
                                            item.isCortado ? 'text-slate-500 dark:text-zinc-400' :
                                            item.colorGravedad === 'danger' ? 'text-red-600 dark:text-red-400' :
                                            item.colorGravedad === 'warning' ? 'text-orange-500 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'
                                        }>
                                            {item.dias_retraso} días
                                        </span>
                                        <span className="text-slate-400 dark:text-zinc-500">Retraso</span>
                                    </div>
                                    <Progress
                                        size="sm"
                                        value={item.dias_retraso > 120 ? 100 : (item.dias_retraso / 120) * 100}
                                        color={item.tiene_convenio ? "success" : (item.isCortado ? "default" : item.colorGravedad === 'danger' ? 'danger' : item.colorGravedad === 'warning' ? 'warning' : 'primary')}
                                        aria-label="Gravedad de deuda"
                                        className="h-1.5"
                                        classNames={{ track: "bg-slate-100 dark:bg-zinc-800" }}
                                    />
                                    <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 mt-1.5 truncate">
                                        Sugerido: <span className="font-bold text-slate-700 dark:text-zinc-300">{item.accion_sugerida}</span>
                                    </span>
                                </div>
                            </div>

                            {/* 3. Acciones y Estado */}
                            <div className="flex flex-wrap items-center gap-2 lg:w-1/3 justify-end w-full pl-12 lg:pl-0">

                                {/* Botón Convenio */}
                                {item.tiene_convenio ? (
                                    <Tooltip
                                        content={
                                            <div className="px-1 py-2">
                                                <div className="text-xs font-bold mb-1">Convenio Activo</div>
                                                <div className="text-[11px] font-medium text-slate-500">Saldo: ${item.convenio?.saldo_restante?.toLocaleString()}</div>
                                                <div className="text-[11px] font-medium text-slate-500">Avance: {item.convenio?.total_parcialidades - item.convenio?.parcialidades_pendientes}/{item.convenio?.total_parcialidades} cuotas</div>
                                            </div>
                                        }
                                        classNames={{content: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl"}}
                                    >
                                        <Button
                                            size="sm"
                                            className="font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
                                            variant="flat"
                                            startContent={<HiDocumentText />}
                                            onPress={() => {
                                                setSelectedConvenioId(item.convenio?.id);
                                                setShowParcialidadesModal(true);
                                            }}
                                        >
                                            Ver Convenio
                                        </Button>
                                    </Tooltip>
                                ) : (
                                    <Tooltip content="Crear Convenio de Pago" classNames={{content: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl font-medium text-xs"}}>
                                        <Button
                                            size="sm"
                                            color="primary"
                                            variant="flat"
                                            className="font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                                            startContent={<HiDocumentText />}
                                            onPress={() => {
                                                setSelectedDeudor(item);
                                                setShowConvenioModal(true);
                                            }}
                                        >
                                            Crear Convenio
                                        </Button>
                                    </Tooltip>
                                )}

                                <div className="w-px h-6 bg-slate-200 dark:bg-zinc-700 mx-1 hidden sm:block"></div>

                                {/* Botón Corte / Reconectar */}
                                {item.isCortado ? (
                                    <Tooltip content="Reconectar Servicio" color="success" classNames={{content: "font-bold text-xs"}}>
                                        <Button 
                                            size="sm" 
                                            variant="flat" 
                                            color="success" 
                                            className="font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 shadow-sm"
                                            onPress={() => handleReconectar(item)}
                                            startContent={<HiCheckCircle className="text-lg" />}
                                        >
                                            Reconectar
                                        </Button>
                                    </Tooltip>
                                ) : (
                                    <Tooltip content="Generar orden de corte" color="danger" classNames={{content: "font-bold text-xs"}}>
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="danger"
                                            className="font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 shadow-sm"
                                            startContent={<HiBan className="text-lg" />}
                                            onPress={() => {
                                                if (item.isCortado) {
                                                    alert("El servicio ya está cortado");
                                                    return;
                                                }
                                                setSelectedDeudor(item);
                                                setShowCorteModal(true);
                                            }}
                                        >
                                            Cortar
                                        </Button>
                                    </Tooltip>
                                )}
                            </div>

                        </div>
                    ))}
                </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="flex justify-center p-4 bg-slate-50/50 dark:bg-zinc-900">
                    <Pagination
                        total={totalPages}
                        page={currentPage}
                        onChange={setCurrentPage}
                        showControls
                        color="primary"
                        variant="light"
                        classNames={{
                            cursor: "bg-blue-600 text-white font-bold shadow-md",
                        }}
                    />
                </div>
            )}
        </CardBody>
      </Card>

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