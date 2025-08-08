import { Select, SelectItem, Card, CardBody, CardHeader, Chip, Skeleton } from "@nextui-org/react";
import React, { useEffect, useState, useMemo } from "react";
import { HiUsers, HiTrendingUp, HiLocationMarker, HiCalendar } from "react-icons/hi";
import ClientesRegistradosChart from "../../charts/ClientesRegistrados";
import ClientesPorMesChart from "../../charts/ChartClientesPorMes";
import { useClientes } from "../../../context/ClientesContext";

export const TabMetricas = () => {
  const { clientes, loading, initialLoading } = useClientes();
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("6meses");

  // Componente de loading elegante para métricas
  const LoadingSkeleton = () => (
    <div className="space-y-6 p-4">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <Skeleton className="w-48 h-8 rounded-lg" />
          <Skeleton className="w-64 h-4 rounded-lg" />
        </div>
        <Skeleton className="w-32 h-10 rounded-lg" />
      </div>

      {/* Estadísticas skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="w-24 h-4 rounded-lg" />
                  <Skeleton className="w-16 h-8 rounded-lg" />
                </div>
                <Skeleton className="w-12 h-12 rounded-full" />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="w-48 h-6 rounded-lg" />
          </CardHeader>
          <CardBody>
            <Skeleton className="w-full h-64 rounded-lg" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="w-48 h-6 rounded-lg" />
          </CardHeader>
          <CardBody>
            <Skeleton className="w-full h-64 rounded-lg" />
          </CardBody>
        </Card>
      </div>
    </div>
  );

  // Solo mostrar skeleton en la carga inicial para evitar parpadeos
  if (initialLoading) {
    return <LoadingSkeleton />;
  }

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    if (!clientes || clientes.length === 0) {
      return {
        totalClientes: 0,
        clientesActivos: 0,
        clientesNuevos: 0,
        ciudades: [],
        crecimientoMensual: 0,
        porcentajeActivos: 0
      };
    }

    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

    // Clientes nuevos este mes
    const clientesNuevos = clientes.filter(cliente => {
      if (cliente.fechaRegistro) {
        const fechaRegistro = new Date(cliente.fechaRegistro);
        return fechaRegistro >= inicioMes;
      }
      return false;
    }).length;

    // Clientes del mes anterior
    const clientesMesAnterior = clientes.filter(cliente => {
      if (cliente.fechaRegistro) {
        const fechaRegistro = new Date(cliente.fechaRegistro);
        return fechaRegistro >= mesAnterior && fechaRegistro <= finMesAnterior;
      }
      return false;
    }).length;

    // Calcular crecimiento mensual
    const crecimientoMensual = clientesMesAnterior > 0 
      ? ((clientesNuevos - clientesMesAnterior) / clientesMesAnterior * 100)
      : clientesNuevos > 0 ? 100 : 0;

    const clientesActivos = clientes.filter(cliente => 
      cliente.estado_cliente === "Activo" || !cliente.estado_cliente
    ).length;

    const ciudades = [...new Set(clientes.map(cliente => cliente.ciudad))].filter(Boolean);
    const porcentajeActivos = (clientesActivos / clientes.length * 100);

    return {
      totalClientes: clientes.length,
      clientesActivos,
      clientesNuevos,
      ciudades,
      crecimientoMensual,
      porcentajeActivos
    };
  }, [clientes]);

  // Estadísticas por ciudad
  const estadisticasPorCiudad = useMemo(() => {
    if (!clientes || clientes.length === 0) return [];

    const ciudadStats = {};
    
    clientes.forEach(cliente => {
      const ciudad = cliente.ciudad || "Sin ciudad";
      if (!ciudadStats[ciudad]) {
        ciudadStats[ciudad] = {
          nombre: ciudad,
          total: 0,
          activos: 0,
          inactivos: 0,
          porcentaje: 0
        };
      }
      
      ciudadStats[ciudad].total++;
      if (cliente.estado_cliente === "Activo" || !cliente.estado_cliente) {
        ciudadStats[ciudad].activos++;
      } else {
        ciudadStats[ciudad].inactivos++;
      }
    });

    // Calcular porcentajes
    Object.values(ciudadStats).forEach(ciudad => {
      ciudad.porcentaje = (ciudad.total / clientes.length * 100);
    });

    return Object.values(ciudadStats).sort((a, b) => b.total - a.total);
  }, [clientes]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando métricas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardBody className="text-center p-6">
            <HiUsers className="w-12 h-12 mx-auto mb-3 text-blue-600" />
            <p className="text-3xl font-bold text-blue-600">{estadisticas.totalClientes}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Total de Clientes</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardBody className="text-center p-6">
            <HiUsers className="w-12 h-12 mx-auto mb-3 text-green-600" />
            <p className="text-3xl font-bold text-green-600">{estadisticas.clientesActivos}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Clientes Activos</p>
            <Chip size="sm" color="success" variant="flat" className="mt-2">
              {estadisticas.porcentajeActivos.toFixed(1)}%
            </Chip>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardBody className="text-center p-6">
            <HiCalendar className="w-12 h-12 mx-auto mb-3 text-purple-600" />
            <p className="text-3xl font-bold text-purple-600">{estadisticas.clientesNuevos}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Nuevos este Mes</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardBody className="text-center p-6">
            <HiTrendingUp className="w-12 h-12 mx-auto mb-3 text-orange-600" />
            <p className={`text-3xl font-bold ${estadisticas.crecimientoMensual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {estadisticas.crecimientoMensual > 0 ? '+' : ''}{estadisticas.crecimientoMensual.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Crecimiento Mensual</p>
          </CardBody>
        </Card>
      </div>

      {/* Estadísticas por ciudad */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HiLocationMarker className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Distribución por Ciudad</h3>
            {loading && !initialLoading && (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {estadisticasPorCiudad.map((ciudad, index) => (
              <Card key={index} className="border border-gray-200 dark:border-gray-700">
                <CardBody className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{ciudad.nombre}</h4>
                    <Chip size="sm" color="primary" variant="flat">
                      {ciudad.porcentaje.toFixed(1)}%
                    </Chip>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Total:</span>
                      <span className="font-medium">{ciudad.total}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Activos:</span>
                      <span className="font-medium text-green-600">{ciudad.activos}</span>
                    </div>
                    
                    {ciudad.inactivos > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-red-600">Inactivos:</span>
                        <span className="font-medium text-red-600">{ciudad.inactivos}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Barra de progreso */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${ciudad.porcentaje}%` }}
                      ></div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center w-full">
              <h3 className="text-lg font-semibold">Clientes Registrados</h3>
              <Select
                size="sm"
                className="w-32"
                selectedKeys={[periodoSeleccionado]}
                onSelectionChange={(keys) => setPeriodoSeleccionado(Array.from(keys)[0])}
              >
                <SelectItem key="3meses" value="3meses">3 meses</SelectItem>
                <SelectItem key="6meses" value="6meses">6 meses</SelectItem>
                <SelectItem key="12meses" value="12meses">12 meses</SelectItem>
              </Select>
            </div>
          </CardHeader>
          <CardBody>
            <ClientesRegistradosChart clientes={clientes} periodo={periodoSeleccionado} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Tendencia Mensual</h3>
          </CardHeader>
          <CardBody>
            <ClientesPorMesChart clientes={clientes} />
          </CardBody>
        </Card>
      </div>

      {/* Resumen ejecutivo */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Resumen Ejecutivo</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{estadisticas.ciudades.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Ciudades Atendidas</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {estadisticas.totalClientes > 0 ? (estadisticas.totalClientes / estadisticas.ciudades.length).toFixed(1) : 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Promedio por Ciudad</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {estadisticas.porcentajeActivos.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Tasa de Actividad</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

