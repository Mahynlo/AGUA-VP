import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, CardHeader, Chip, Input, Button, Divider, Skeleton } from "@nextui-org/react";
import { HiSearch, HiLocationMarker, HiCog, HiCheck, HiX, HiPlus, HiUser, HiHashtag, HiPhone } from "react-icons/hi";
import MapaMedidores from "../../mapa/MapaMedidores";
import RegistrarMedidor from "./RegistrarMedidores";
import { useMedidores } from "../../../context/MedidoresContext";
import { MedidoresIcon } from "../../../IconsApp/IconsSidebar";

const Medidores = () => {
  const {
    medidores,
    medidoresAsignados,
    medidoresNoAsignados,
    filtrarMedidores,
    loading,
    initialLoading
  } = useMedidores();

  const [filtros, setFiltros] = useState({
    pueblo: "",
    numeroSerie: "",
    estado: ""
  });

  // Componente de loading elegante inspirado en MapaLecturas
  const LoadingSkeleton = () => (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div className="w-full h-full bg-white overflow-x-hidden p-6 rounded-lg shadow-md dark:bg-gray-800">
        
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="w-64 h-8 rounded-lg" />
              </div>
              <Skeleton className="w-80 h-4 rounded-lg" />
              <Skeleton className="w-32 h-10 rounded-lg" />
            </div>

            {/* Estadísticas skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="min-w-[120px]">
                  <CardBody className="text-center p-4">
                    <Skeleton className="w-8 h-8 mx-auto mb-2 rounded-lg" />
                    <Skeleton className="w-12 h-8 mx-auto mb-1 rounded-lg" />
                    <Skeleton className="w-16 h-3 mx-auto rounded-lg" />
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Layout principal skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-200px)]">
          {/* Mapa skeleton */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <Skeleton className="w-48 h-6 rounded-lg" />
              </CardHeader>
              <CardBody className="p-4">
                <Skeleton className="w-full h-full rounded-lg" />
              </CardBody>
            </Card>
          </div>

          {/* Panel lateral skeleton */}
          <div className="flex flex-col">
            <Card className="h-full">
              <CardHeader>
                <Skeleton className="w-40 h-6 rounded-lg" />
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Filtros skeleton */}
                <div className="space-y-3">
                  <Skeleton className="w-full h-10 rounded-lg" />
                  <Skeleton className="w-full h-10 rounded-lg" />
                </div>
                <Divider />
                {/* Lista skeleton */}
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className="border">
                      <CardBody className="p-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="w-3/4 h-4 rounded-lg" />
                            <Skeleton className="w-1/2 h-3 rounded-lg" />
                          </div>
                          <Skeleton className="w-12 h-6 rounded-lg" />
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  // Solo mostrar skeleton en la carga inicial para evitar parpadeos
  if (initialLoading) {
    return <LoadingSkeleton />;
  }

  // Estadísticas calculadas con memoización optimizada
  const estadisticas = useMemo(() => {
    // Si estamos en loading inicial, mostrar valores de 0 temporalmente
    if (initialLoading) {
      return {
        total: 0,
        asignados: 0,
        libres: 0,
        activos: 0,
        inactivos: 0,
        porcentajeAsignados: 0,
        porcentajeActivos: 0
      };
    }

    if (!medidores || medidores.length === 0) {
      return {
        total: 0,
        asignados: 0,
        libres: 0,
        activos: 0,
        inactivos: 0,
        porcentajeAsignados: 0,
        porcentajeActivos: 0
      };
    }

    const activos = medidores.filter(m => m.estado_medidor === "Activo").length;
    const inactivos = medidores.filter(m => m.estado_medidor === "Inactivo").length;

    return {
      total: medidores.length,
      asignados: medidoresAsignados.length,
      libres: medidoresNoAsignados.length,
      activos,
      inactivos,
      porcentajeAsignados: medidores.length > 0 ? (medidoresAsignados.length / medidores.length * 100) : 0,
      porcentajeActivos: medidores.length > 0 ? (activos / medidores.length * 100) : 0
    };
  }, [medidores, medidoresAsignados, medidoresNoAsignados, initialLoading]);

  // Filtrar medidores
  const medidoresFiltrados = useMemo(() => {
    if (!medidores) return [];

    return medidores.filter(medidor => {
      const coincidePueblo = !filtros.pueblo ||
        medidor.ubicacion?.toLowerCase().includes(filtros.pueblo.toLowerCase());
      const coincideNumero = !filtros.numeroSerie ||
        medidor.numero_serie?.toLowerCase().includes(filtros.numeroSerie.toLowerCase());
      const coincideEstado = !filtros.estado ||
        medidor.estado_medidor === filtros.estado;

      return coincidePueblo && coincideNumero && coincideEstado;
    });
  }, [medidores, filtros]);

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div className="w-full h-full bg-white overflow-x-hidden p-6 rounded-lg shadow-md dark:bg-gray-800">

        {/* Header con título y estadísticas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <MedidoresIcon className="bg-blue-600 text-white rounded-full p-2 h-12 w-12" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Gestión de Medidores
                </h1>
                {loading && !initialLoading && (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Administra y monitorea todos los medidores del sistema
              </p>
              <RegistrarMedidor />
            </div>

            {/* Estadísticas rápidas con estilos mejorados inspirados en MapaLecturas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white min-w-[120px] backdrop-blur-md border-0 shadow-xl">
                <CardBody className="text-center p-4">
                  <HiCog className="w-8 h-8 mx-auto mb-2" />
                  {initialLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto mb-1 bg-white/20" />
                  ) : (
                    <p className="text-2xl font-bold">{estadisticas.total}</p>
                  )}
                  <p className="text-xs opacity-90">Total Medidores</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white min-w-[120px] backdrop-blur-md border-0 shadow-xl">
                <CardBody className="text-center p-4">
                  <HiCheck className="w-8 h-8 mx-auto mb-2" />
                  {initialLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto mb-1 bg-white/20" />
                  ) : (
                    <p className="text-2xl font-bold">{estadisticas.asignados}</p>
                  )}
                  <div className="text-xs opacity-90">
                    Asignados
                    {!initialLoading && (
                      <Chip size="sm" color="primary" variant="flat" className="mt-1 bg-green-400/30 text-white">
                        {estadisticas.porcentajeAsignados.toFixed(1)}%
                      </Chip>
                    )}
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white min-w-[120px] backdrop-blur-md border-0 shadow-xl">
                <CardBody className="text-center p-4">
                  <HiX className="w-8 h-8 mx-auto mb-2" />
                  {initialLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto mb-1 bg-white/20" />
                  ) : (
                    <p className="text-2xl font-bold">{estadisticas.libres}</p>
                  )}
                  <p className="text-xs opacity-90">Disponibles</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white min-w-[120px] backdrop-blur-md border-0 shadow-xl">
                <CardBody className="text-center p-4">
                  <HiLocationMarker className="w-8 h-8 mx-auto mb-2" />
                  {initialLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto mb-1 bg-white/20" />
                  ) : (
                    <p className="text-2xl font-bold">{estadisticas.activos}</p>
                  )}
                  <div className="text-xs opacity-90">
                    Activos
                    {!initialLoading && (
                      <Chip size="sm" color="primary" variant="flat" className="mt-1 bg-orange-400/30 text-white">
                        {estadisticas.porcentajeActivos.toFixed(1)}%
                      </Chip>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>

        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-200px)] ">

          {/* Mapa con estilos mejorados inspirados en MapaLecturas */}
          <div className="lg:col-span-2 max-h-[750px]">
            <Card className="h-full sm:h-[750px] backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border-0 shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-full">
                    <HiLocationMarker className="text-white text-lg" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Ubicación de Medidores
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Mapa interactivo con {estadisticas.total} medidores
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="pt-0 p-0">
                <div className="h-full w-full rounded-b-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                  <MapaMedidores medidores={medidores} />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Panel lateral con estilos inspirados en MapaLecturas */}
          <div className="max-h-[750px] flex flex-col">
            <Card className="h-full backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border-0 shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full">
                    <HiCog className="text-white text-lg" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Lista de Medidores
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {estadisticas.total} medidores registrados
                    </p>
                  </div>
                  {loading && !initialLoading && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              </CardHeader>
              <CardBody className="pt-0 flex flex-col gap-4">

                {/* Filtros mejorados con estilos personalizados */}
                <div className="space-y-3">
                  {/* Input de ubicación con estilo personalizado */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      Ubicación
                    </label>
                    <div className="relative w-full flex">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                        <HiLocationMarker className="inline-block mr-1 h-5 w-5 text-blue-600" />
                      </span>
                      <input
                        type="text"
                        placeholder="Buscar por ubicación..."
                        value={filtros.pueblo}
                        onChange={(e) => handleFiltroChange('pueblo', e.target.value)}
                        className="border border-gray-300 focus:ring-blue-600 focus:border-blue-500 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Input de número de serie con estilo personalizado */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      Número de Serie
                    </label>
                    <div className="relative w-full flex">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                        <HiHashtag className="inline-block mr-1 h-5 w-5 text-blue-600" />
                      </span>
                      <input
                        type="text"
                        placeholder="Buscar por número de serie..."
                        value={filtros.numeroSerie}
                        onChange={(e) => handleFiltroChange('numeroSerie', e.target.value)}
                        className="border border-gray-300 focus:ring-blue-600 focus:border-blue-500 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={filtros.estado === "Activo" ? "solid" : "bordered"}
                      color="success"
                      onClick={() => handleFiltroChange('estado', filtros.estado === "Activo" ? "" : "Activo")}
                      className="flex-1 transition-all hover:shadow-lg"
                    >
                      <HiCheck className="w-3 h-3 mr-1" />
                      Activos
                    </Button>
                    <Button
                      size="sm"
                      variant={filtros.estado === "Inactivo" ? "solid" : "bordered"}
                      color="danger"
                      onClick={() => handleFiltroChange('estado', filtros.estado === "Inactivo" ? "" : "Inactivo")}
                      className="flex-1 transition-all hover:shadow-lg"
                    >
                      <HiX className="w-3 h-3 mr-1" />
                      Inactivos
                    </Button>
                  </div>
                </div>

                <Divider className="my-2" />

                {/* Lista de medidores con estilos mejorados */}
                <div className="flex-1 overflow-y-auto space-y-3">
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    📊 Mostrando {medidoresFiltrados.length} de {estadisticas.total} medidores
                  </div>

                  {medidoresFiltrados.map(medidor => (
                    <Card key={medidor.id} className="border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all hover:shadow-lg bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700">
                      <CardBody className="p-4">
                        {/* Header del medidor */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700 rounded-full">
                              <HiCog className="text-blue-600 dark:text-blue-300 text-sm" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <HiHashtag className="w-3 h-3 text-blue-500" />
                                {medidor.numero_serie}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1 mt-1">
                                <HiLocationMarker className="w-3 h-3 text-purple-500" />
                                {medidor.ubicacion}
                              </p>
                            </div>
                          </div>
                          <Chip
                            size="sm"
                            color={medidor.estado_medidor === "Activo" ? "success" : "danger"}
                            variant="flat"
                            className="font-semibold"
                          >
                            {medidor.estado_medidor}
                          </Chip>
                        </div>

                        {/* Información adicional */}
                        <div className="grid grid-cols-1 gap-2 mt-3">
                          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                              <HiLocationMarker className="w-3 h-3" />
                              Coordenadas:
                            </span>
                            <span className="text-xs font-semibold text-gray-800 dark:text-white">
                              {medidor.latitud?.toFixed(4)}, {medidor.longitud?.toFixed(4)}
                            </span>
                          </div>
                          
                          {medidor.cliente_id && (
                            <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <HiUser className="w-3 h-3" />
                                Cliente:
                              </span>
                              <span className="text-xs font-semibold text-gray-800 dark:text-white">
                                Asignado
                              </span>
                            </div>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  ))}

                  {medidoresFiltrados.length === 0 && (
                    <Card className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border border-gray-200 dark:border-gray-700">
                      <CardBody className="text-center py-8">
                        <HiSearch className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          No se encontraron medidores
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                          No hay medidores que coincidan con los filtros aplicados
                        </p>
                      </CardBody>
                    </Card>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Medidores;
