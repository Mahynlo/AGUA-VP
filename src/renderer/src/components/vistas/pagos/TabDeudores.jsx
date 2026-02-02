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
import ModalParcialidadesConvenio from "./ModalParcialidadesConvenio";

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
  const [showParcialidadesModal, setShowParcialidadesModal] = useState(false);
  const [selectedDeudor, setSelectedDeudor] = useState(null);
  const [selectedConvenioId, setSelectedConvenioId] = useState(null);

  // Estados de UI
  const [search, setSearch] = useState("");
  const [filtroGravedad, setFiltroGravedad] = useState("All");
  const [filtroEstado, setFiltroEstado] = useState("All"); // NUEVO: Filtro por estado del servicio
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

      // DEBUG: Ver estructura de datos
      if (lista.length > 0) {
        console.log("Primer candidato (estructura):", lista[0]);
        console.log("Medidor del primer candidato:", lista[0]?.medidor);
      }

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
    if (!confirm(`¿Confirmar reconexión para ${deudor.cliente?.nombre}?`)) return;

    try {
      setLoading(true);
      const result = await window.api.deudores.registrarReconexion(token, {
        medidor_id: deudor.medidor.id,
        observaciones: "Reconexión manual desde panel"
      });

      console.log("Reconexión exitosa:", result);
      alert("Servicio reconectado exitosamente");
      fetchData(); // Recargar
    } catch (error) {
      console.error("Error reconectando:", error);

      // Extraer mensaje de error del backend
      let errorMsg = "Error al reconectar servicio";

      if (error.message) {
        // Si el error contiene información del backend
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
    } finally {
      setLoading(false);
    }
  };


  // --- LÓGICA DE PROCESAMIENTO ---
  const deudoresEnriquecidos = useMemo(() => {
    const hoy = new Date();

    return candidatos.map(d => {
      // Usar fecha_vencimiento del API (campo de compatibilidad)
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

      // Si ya está cortado, sobrescribir gravedad visual
      // CORREGIDO: El campo es 'estado_servicio' no 'estado'
      const isCortado = d.medidor?.estado === "Cortado" || d.medidor?.estado_servicio === "Cortado";

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

      // Filtro por estado del servicio (incluye convenio)
      const matchesEstado = filtroEstado === "All" ||
        (filtroEstado === "Activo" && !item.isCortado && !item.tiene_convenio) ||
        (filtroEstado === "Cortado" && item.isCortado) ||
        (filtroEstado === "Convenio" && item.tiene_convenio);

      return matchesSearch && matchesGravedad && matchesEstado;
    });
  }, [deudoresEnriquecidos, search, filtroGravedad, filtroEstado]);

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

      {/* 1. HEADER (Fuera de Card, igual que Facturas) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Cartera Vencida y Cortes
          </h1>
          <p className="text-small text-gray-500 mt-1">Gestión de morosidad y cortes de servicio</p>
        </div>
        <div className="flex gap-2">
          <Button
            startContent={<HiCog className="w-5 h-5" />}
            variant="flat"
            onPress={() => setShowConfigModal(true)}
          >
            Configuración
          </Button>
          <Button
            startContent={<HiRefresh className="w-5 h-5" />}
            color="primary"
            onPress={fetchData}
            isLoading={loading}
          >
            {loading ? "Cargando..." : "Recargar Datos"}
          </Button>
          <Button
            color="default"
            variant="bordered"
            onPress={() => navigate(-1)}
          >
            <FlechaReturnIcon className="w-5 h-5" />
            <span className="ml-2 hidden md:inline">Volver</span>
          </Button>
        </div>
      </div>

      {/* 3. FILTROS (Card Independiente con Header) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Filtros y Búsqueda</h3>
            {loading && (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Buscador (2 columnas) */}
            <div className="lg:col-span-2">
              <div className="relative w-full flex">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <SearchIcon className="inline-block mr-2" />
                </span>
                <input
                  placeholder="Buscar cliente o dirección..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Filtro Gravedad */}
            <Select
              label="Gravedad"
              placeholder="Todas"
              selectedKeys={[filtroGravedad]}
              onSelectionChange={(keys) => {
                setFiltroGravedad(Array.from(keys)[0] || "All");
                setCurrentPage(1);
              }}
              startContent={<HiExclamation className="text-gray-400" />}
            >
              <SelectItem key="All" value="All">Todas</SelectItem>
              <SelectItem key="Crítico" value="Crítico" color="danger">Críticos</SelectItem>
              <SelectItem key="Moderado" value="Moderado" color="warning">Moderados</SelectItem>
              <SelectItem key="Leve" value="Leve" color="success">Leves</SelectItem>
            </Select>

            {/* Filtro Estado Servicio */}
            <Select
              label="Estado Servicio"
              placeholder="Todos"
              selectedKeys={[filtroEstado]}
              onSelectionChange={(keys) => {
                setFiltroEstado(Array.from(keys)[0] || "All");
                setCurrentPage(1);
              }}
              startContent={<HiFilter className="text-gray-400" />}
            >
              <SelectItem key="All" value="All">Todos</SelectItem>
              <SelectItem key="Activo" value="Activo">Activos (con déuda)</SelectItem>
              <SelectItem key="Cortado" value="Cortado">Cortados</SelectItem>
              <SelectItem key="Convenio" value="Convenio">En Convenio</SelectItem>
            </Select>

            {/* Rows Per Page */}
            <Select
              label="Por página"
              selectedKeys={[rowsPerPage.toString()]}
              onSelectionChange={(keys) => {
                setRowsPerPage(Number(Array.from(keys)[0]));
                setCurrentPage(1);
              }}
            >
              <SelectItem key="5" value="5">5</SelectItem>
              <SelectItem key="10" value="10">10</SelectItem>
              <SelectItem key="15" value="15">15</SelectItem>
              <SelectItem key="20" value="20">20</SelectItem>
            </Select>
          </div>

          <div className="flex justify-between items-center mt-4 text-sm text-gray-600 dark:text-gray-400">
            <span>
              Mostrando {paginatedData.length} de {filteredData.length} deudores
              {filteredData.length !== candidatos.length && ` (filtrado de ${candidatos.length} total)`}
            </span>
          </div>
        </CardBody>
      </Card >



      {/* LISTA DE TARJETAS */}
      < div className="flex flex-col gap-3 min-h-[300px]" >
        {
          loading ? (
            <div className="flex justify-center items-center h-40" >
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-800 uppercase tracking-tight text-sm">
                            {item.cliente_nombre}
                          </span>
                          {item.isCortado && <Chip size="sm" color="danger" variant="flat">CORTADO</Chip>}
                          {item.tiene_convenio && <Chip size="sm" color="success" variant="flat">CONVENIO</Chip>}
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
                        className: item.isCortado ? "bg-gray-200 text-gray-400 grayscale" :
                          (item.tiene_convenio ? "bg-green-100 text-green-600" :
                            (item.colorGravedad === 'danger' ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600")),
                        name: item.cliente_nombre?.charAt(0)
                      }}
                    />
                  </div>

                  {/* 2. Información de Deuda y Tiempo */}
                  <div className="flex flex-col md:flex-row gap-6 md:w-1/3 justify-center w-full">
                    {/* Monto */}
                    <div className="flex flex-col items-center md:items-start min-w-[100px]">
                      <span className="text-[10px] uppercase font-bold text-gray-400">
                        {item.tiene_convenio ? "Saldo Convenio" : "Saldo Pendiente"}
                      </span>
                      <span className={`text-xl font-black ${item.tiene_convenio ? 'text-green-600' : 'text-gray-800'}`}>
                        ${item.tiene_convenio ? item.convenio?.saldo_restante?.toLocaleString() : item.saldo_pendiente?.toLocaleString()}
                      </span>
                      {item.tiene_convenio && (
                        <span className="text-[9px] text-green-600 mt-0.5">
                          {item.convenio?.parcialidades} cuotas
                        </span>
                      )}
                    </div>

                    {/* Tiempo de Retraso con Barra */}
                    <div className="flex flex-col w-full md:w-32">
                      <div className="flex justify-between text-[10px] font-bold mb-1">
                        <span className={
                          item.tiene_convenio ? 'text-green-600' :
                            (item.isCortado ? 'text-gray-500' :
                              item.colorGravedad === 'danger' ? 'text-red-600' :
                                item.colorGravedad === 'warning' ? 'text-orange-500' : 'text-green-600')
                        }>
                          {item.dias_retraso} días
                        </span>
                        <span className="text-gray-400">Retraso</span>
                      </div>
                      <Progress
                        size="sm"
                        value={item.dias_retraso > 120 ? 100 : (item.dias_retraso / 120) * 100}
                        color={item.tiene_convenio ? "success" : (item.isCortado ? "default" : item.colorGravedad)}
                        aria-label="Gravedad de deuda"
                        className="h-1.5"
                      />
                      <span className="text-[9px] text-gray-400 mt-1">
                        Acción: <b>{item.accion_sugerida}</b>
                      </span>
                    </div>
                  </div>

                  {/* 3. Acciones y Estado */}
                  <div className="flex items-center gap-4 md:w-1/3 justify-end border-t md:border-t-0 pt-3 md:pt-0 w-full mt-2 md:mt-0">

                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100 ml-auto md:ml-0">

                      {/* Botón Convenio - Condicional según si ya tiene convenio */}
                      {item.tiene_convenio ? (
                        <Tooltip
                          content={
                            <div className="px-1 py-2">
                              <div className="text-small font-bold">Convenio Activo</div>
                              <div className="text-tiny">Saldo: ${item.convenio?.saldo_restante?.toLocaleString()}</div>
                              <div className="text-tiny">Parcialidades: {item.convenio?.parcialidades_pendientes}/{item.convenio?.total_parcialidades}</div>
                            </div>
                          }
                        >
                          <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            onPress={() => {
                              console.log('Abriendo modal para convenio:', item.convenio?.id);
                              setSelectedConvenioId(item.convenio?.id);
                              setShowParcialidadesModal(true);
                            }}
                          >
                            Ver Convenio
                          </Button>
                        </Tooltip>
                      ) : null}

                      <div className="w-px h-4 bg-gray-300 mx-1"></div>

                      {item.isCortado ? (
                        <Tooltip content="Reconectar Servicio" color="success">
                          <Button isIconOnly size="sm" variant="flat" color="success" onPress={() => handleReconectar(item)}>
                            <HiCheckCircle className="w-5 h-5" />
                          </Button>
                        </Tooltip>
                      ) : (
                        <Tooltip content="Generar Corte" color="danger">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            color="danger"
                            onPress={() => {
                              if (item.isCortado) {
                                alert("El servicio ya está cortado");
                                return;
                              }
                              setSelectedDeudor(item);
                              setShowCorteModal(true);
                            }}
                          >
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
      </div >

      {/* Paginación */}
      {
        totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination
              total={totalPages}
              page={currentPage}
              onChange={setCurrentPage}
              showControls
              showShadow
              color="primary"
            />
          </div>
        )
      }

      {/* MODALS */}
      <ModalConfiguracionCortes isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />

      <ModalRealizarCorte
        isOpen={showCorteModal}
        onClose={() => setShowCorteModal(false)}
        selectedDeudor={selectedDeudor}
        onSuccess={fetchData}
      />

      {/* Modal de Convenio */}
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
          fetchData(); // Recargar lista
        }}
      />

      {/* Modal de Parcialidades de Convenio */}
      <ModalParcialidadesConvenio
        isOpen={showParcialidadesModal}
        onClose={() => {
          setShowParcialidadesModal(false);
          setSelectedConvenioId(null);
        }}
        convenioId={selectedConvenioId}
        onPagoExitoso={() => {
          fetchData(); // Recargar lista después de pagar parcialidad
        }}
      />
    </div >
  );
};

export default TabDeudores;