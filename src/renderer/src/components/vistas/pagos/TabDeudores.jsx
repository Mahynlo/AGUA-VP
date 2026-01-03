import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Select,
  SelectItem,
  Input,
  User,
  Pagination,
  Tooltip,
  Progress,
  Spinner
} from "@nextui-org/react";
import { FlechaReturnIcon } from "../../../IconsApp/IconsAppSystem";
import { SearchIcon } from "../../../IconsApp/IconsSidebar";
import { HiExclamation, HiCurrencyDollar, HiClipboardList, HiBan, HiFilter, HiCog, HiCheckCircle, HiRefresh } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

// Modals
import ModalConfiguracionCortes from "./modals/ModalConfiguracionCortes";
import ModalRealizarCorte from "./modals/ModalRealizarCorte";
import ModalCrearConvenio from "./modals/ModalCrearConvenio";

const TabDeudores = () => {
  const navigate = useNavigate();
  // const { token } = useAuth(); // AuthContext no expone token
  const token = localStorage.getItem('token');

  // Estados de Datos
  const [candidatos, setCandidatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados de Modals
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showCorteModal, setShowCorteModal] = useState(false);
  const [showConvenioModal, setShowConvenioModal] = useState(false);
  const [selectedDeudor, setSelectedDeudor] = useState(null);

  // Estados de UI
  const [search, setSearch] = useState("");
  const [filtroGravedad, setFiltroGravedad] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // --- API CALLS ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await window.api.deudores.fetchCandidatos(token);
      // Aseguramos que sea un array
      const lista = res.candidatos || [];
      setCandidatos(lista);
    } catch (err) {
      console.error("Error fetching deudores:", err);
      setError("Error cargando lista de deudores");
      // Fallback a array vacío para no romper la UI
      setCandidatos([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchData();
  }, [token, fetchData]);

  const handleReconectar = async (deudor) => {
    // Reconexión simple directa
    if (!confirm(`¿Confirmar reconexión para ${deudor.cliente?.nombre}?`)) return;

    try {
      setLoading(true);
      await window.api.deudores.registrarReconexion(token, {
        medidor_id: deudor.medidor.id,
        observaciones: "Reconexión manual desde panel"
      });
      fetchData(); // Recargar
    } catch (error) {
      console.error("Error reconectando:", error);
      alert("Error al reconectar servicio");
    } finally {
      setLoading(false);
    }
  };


  // --- LÓGICA DE PROCESAMIENTO ---
  const deudoresEnriquecidos = useMemo(() => {
    const hoy = new Date();

    return candidatos.map(d => {
      // Ajuste para manejar diferentes estructuras de fecha si vienen de DB
      const fechaVencimiento = d.fecha_vencimiento ? new Date(d.fecha_vencimiento) : new Date(new Date().setMonth(new Date().getMonth() - 1)); // Fallback si no hay fecha

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

      // Si ya está cortado, sobrescribir gravedad visual
      const isCortado = d.medidor?.estado === "Cortado";

      return {
        ...d,
        id: d.id || d.medidor?.id, // Asegurar ID único
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
      return matchesSearch && matchesGravedad;
    });
  }, [deudoresEnriquecidos, search, filtroGravedad]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const totalDeuda = filteredData.reduce((acc, curr) => acc + curr.saldo_pendiente, 0);
    const criticos = filteredData.filter(d => d.gravedad === "Crítico").length;
    return { totalDeuda, criticos, totalDeudores: filteredData.length };
  }, [filteredData]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  return (
    <div className="space-y-6 p-4">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Cartera Vencida y Cortes
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestión de morosidad y cortes de servicio</p>
        </div>
        <div className="flex gap-2">
          <Button
            startContent={<HiCog />}
            variant="flat"
            onPress={() => setShowConfigModal(true)}
          >
            Configuración
          </Button>
          <Button
            color="primary"
            onPress={fetchData}
            isLoading={loading}
          >
            {loading ? "Cargando..." : "Recargar Datos"}
          </Button>
          <Button color="default" variant="bordered" onClick={() => navigate(-1)}>
            <FlechaReturnIcon className="w-5 h-5" />
            <span className="ml-2">Volver</span>
          </Button>
        </div>
      </div>

      {/* KPIs (Estilo Gradient) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardBody className="text-center p-6">
            <div className="flex items-center justify-center mb-2">
              <HiCurrencyDollar className="w-6 h-6 mr-2" />
              <p className="text-2xl font-bold">${estadisticas.totalDeuda.toLocaleString()}</p>
            </div>
            <p className="text-sm opacity-90">Deuda Total Visible</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardBody className="text-center p-6">
            <div className="flex items-center justify-center mb-2">
              <HiBan className="w-6 h-6 mr-2" />
              <p className="text-2xl font-bold">{estadisticas.criticos}</p>
            </div>
            <p className="text-sm opacity-90">Usuarios Críticos</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
          <CardBody className="text-center p-6">
            <div className="flex items-center justify-center mb-2">
              <HiClipboardList className="w-6 h-6 mr-2" />
              <p className="text-2xl font-bold">{estadisticas.totalDeudores}</p>
            </div>
            <p className="text-sm opacity-90">Total Casos</p>
          </CardBody>
        </Card>
      </div>

      {/* FILTROS (Estilo Card) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Filtros y Búsqueda</h3>
            {loading && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <Input
                placeholder="Buscar cliente..."
                startContent={<SearchIcon className="text-gray-400" />}
                value={search}
                onValueChange={(val) => { setSearch(val); setCurrentPage(1); }}
                variant="bordered"
                radius="lg"
              />
            </div>
            <div className="md:col-span-4">
              <Select
                label="Filtrar por Gravedad"
                selectedKeys={[filtroGravedad]}
                onChange={(e) => setFiltroGravedad(e.target.value)}
                variant="bordered"
                startContent={<HiFilter className="text-gray-400" />}
              >
                <SelectItem key="All" value="All">Mostrar Todos</SelectItem>
                <SelectItem key="Crítico" value="Crítico" startContent={<div className="w-2 h-2 rounded-full bg-red-500"></div>}>Críticos (+90 días)</SelectItem>
                <SelectItem key="Moderado" value="Moderado" startContent={<div className="w-2 h-2 rounded-full bg-orange-500"></div>}>Moderados (30-90 días)</SelectItem>
                <SelectItem key="Leve" value="Leve" startContent={<div className="w-2 h-2 rounded-full bg-green-500"></div>}>Leves (Recientes)</SelectItem>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Select
                label="Registros"
                selectedKeys={[rowsPerPage.toString()]}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                variant="bordered"
              >
                <SelectItem key="10" value="10">10 por página</SelectItem>
                <SelectItem key="25" value="25">25 por página</SelectItem>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Mostrando {paginatedData.length} de {filteredData.length} registros</span>
          </div>
        </CardBody>
      </Card>

      {/* LISTA DE TARJETAS */}
      <div className="flex flex-col gap-3 min-h-[300px]">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Spinner label="Cargando deudores..." color="danger" />
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No se encontraron deudores con estos criterios.</p>
          </div>
        ) : (
          paginatedData.map((item) => (
            <div
              key={item.id}
              className={`group relative bg-white border rounded-xl shadow-sm hover:shadow-md transition-all p-4 overflow-hidden ${item.isCortado ? 'border-red-200 bg-red-50/10' : 'border-gray-200'}`}
            >
              {/* Barra de Color Lateral */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.isCortado ? 'bg-gray-500' :
                item.colorGravedad === 'danger' ? 'bg-red-500' :
                  item.colorGravedad === 'warning' ? 'bg-orange-400' : 'bg-green-400'
                }`}></div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pl-3">

                {/* 1. Información del Cliente */}
                <div className="flex items-center gap-3 md:w-1/3">
                  <User
                    name={
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 uppercase tracking-tight text-sm">
                          {item.cliente_nombre}
                        </span>
                        {item.isCortado && <Chip size="sm" color="danger" variant="flat">CORTADO</Chip>}
                      </div>
                    }
                    description={
                      <span className="text-xs text-gray-500 block truncate max-w-[200px]">
                        {item.direccion_cliente}
                      </span>
                    }
                    avatarProps={{
                      radius: "lg",
                      size: "sm",
                      className: item.isCortado ? "bg-gray-200 text-gray-400 grayscale" : (item.colorGravedad === 'danger' ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"),
                      name: item.cliente_nombre?.charAt(0)
                    }}
                  />
                </div>

                {/* 2. Información de Deuda y Tiempo */}
                <div className="flex flex-col md:flex-row gap-6 md:w-1/3 justify-center w-full">
                  {/* Monto */}
                  <div className="flex flex-col items-center md:items-start min-w-[100px]">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Saldo Pendiente</span>
                    <span className="text-xl font-black text-gray-800">
                      ${item.saldo_pendiente?.toLocaleString()}
                    </span>
                  </div>

                  {/* Tiempo de Retraso con Barra */}
                  <div className="flex flex-col w-full md:w-32">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className={
                        item.isCortado ? 'text-gray-500' :
                          item.colorGravedad === 'danger' ? 'text-red-600' :
                            item.colorGravedad === 'warning' ? 'text-orange-500' : 'text-green-600'
                      }>
                        {item.dias_retraso} días
                      </span>
                      <span className="text-gray-400">Retraso</span>
                    </div>
                    <Progress
                      size="sm"
                      value={item.dias_retraso > 120 ? 100 : (item.dias_retraso / 120) * 100}
                      color={item.isCortado ? "default" : item.colorGravedad}
                      aria-label="Gravedad de deuda"
                      className="h-1.5"
                    />
                    <span className="text-[9px] text-gray-400 mt-1">
                      Acción Sugerida: <b>{item.accion_sugerida}</b>
                    </span>
                  </div>
                </div>

                {/* 3. Acciones y Estado */}
                <div className="flex items-center gap-4 md:w-1/3 justify-end border-t md:border-t-0 pt-3 md:pt-0 w-full mt-2 md:mt-0">

                  <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100 ml-auto md:ml-0">
                    <Tooltip content="Nuevo Convenio">
                      <Button isIconOnly size="sm" variant="light" color="primary" onPress={() => { setSelectedDeudor(item); setShowConvenioModal(true); }}>
                        <HiClipboardList className="w-5 h-5 text-blue-500" />
                      </Button>
                    </Tooltip>

                    <div className="w-px h-4 bg-gray-300 mx-1"></div>

                    {item.isCortado ? (
                      <Tooltip content="Reconectar Servicio" color="success">
                        <Button isIconOnly size="sm" variant="flat" color="success" onPress={() => handleReconectar(item)}>
                          <HiCheckCircle className="w-5 h-5" />
                        </Button>
                      </Tooltip>
                    ) : (
                      <Tooltip content="Generar Corte" color="danger">
                        <Button isIconOnly size="sm" variant="flat" color="danger" onPress={() => { setSelectedDeudor(item); setShowCorteModal(true); }}>
                          <HiBan className="w-5 h-5" />
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={setCurrentPage}
            showControls
            color="danger"
            variant="light"
          />
        </div>
      )}

      {/* MODALS */}
      <ModalConfiguracionCortes isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />

      <ModalRealizarCorte
        isOpen={showCorteModal}
        onClose={() => setShowCorteModal(false)}
        selectedDeudor={selectedDeudor}
        onSuccess={fetchData}
      />

      <ModalCrearConvenio
        isOpen={showConvenioModal}
        onClose={() => setShowConvenioModal(false)}
        selectedDeudor={selectedDeudor}
        onSuccess={fetchData}
      />

    </div>
  );
};

export default TabDeudores;