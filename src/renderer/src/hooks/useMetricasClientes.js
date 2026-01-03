/**
 * Hook para manejar métricas y estadísticas de clientes
 */

import { useState, useMemo } from "react";
import { useClientes } from "../context/ClientesContext";
import { 
  calcularEstadisticas, 
  calcularCrecimiento,
  calcularEstadisticasPorCiudad,
  generarDatosGraficaMeses
} from "../utils/clienteStats";

export const useMetricasClientes = () => {
  const { clientes, loading, initialLoading } = useClientes();
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("6meses");
  const [tipoGrafica, setTipoGrafica] = useState("registros_mes");

  // Estadísticas generales
  const estadisticas = useMemo(() => {
    if (initialLoading) {
      return {
        total: 0,
        activos: 0,
        nuevosEsteMes: 0,
        ciudades: 0,
        porcentajeActivos: 0
      };
    }
    return calcularEstadisticas(clientes);
  }, [clientes, initialLoading]);

  // Datos de crecimiento
  const crecimiento = useMemo(() => 
    calcularCrecimiento(clientes, periodoSeleccionado),
    [clientes, periodoSeleccionado]
  );

  // Estadísticas por ciudad
  const estadisticasPorCiudad = useMemo(() => 
    calcularEstadisticasPorCiudad(clientes),
    [clientes]
  );

  // Datos para gráfica de clientes por mes
  const datosGraficaMeses = useMemo(() => {
    const meses = periodoSeleccionado === "12meses" ? 12 : 6;
    return generarDatosGraficaMeses(clientes, meses);
  }, [clientes, periodoSeleccionado]);

  // Handler para cambio de periodo
  const handleCambioPeriodo = (periodo) => {
    setPeriodoSeleccionado(periodo);
  };

  // Handler para cambio de tipo de gráfica
  const handleCambioTipoGrafica = (tipo) => {
    setTipoGrafica(tipo);
  };

  return {
    // Datos
    estadisticas,
    crecimiento,
    estadisticasPorCiudad,
    datosGraficaMeses,
    loading,
    initialLoading,

    // Estado
    periodoSeleccionado,
    tipoGrafica,

    // Handlers
    handleCambioPeriodo,
    handleCambioTipoGrafica,
    setPeriodoSeleccionado,
    setTipoGrafica
  };
};
