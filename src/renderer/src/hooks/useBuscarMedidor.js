/**
 * Hook para búsqueda de medidores con debounce
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useMedidores } from "../context/MedidoresContext";
import { 
  obtenerMedidoresCliente, 
  obtenerEstadoMedidor,
  buscarMedidores 
} from "../utils/medidorUtils";

export const useBuscarMedidor = (clienteId, onMedidorSeleccionado, onLiberarMedidor) => {
  const { allMedidores, actualizarMedidores } = useMedidores();
  
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [medidoresSeleccionados, setMedidoresSeleccionados] = useState([]);
  const [medidoresLiberados, setMedidoresLiberados] = useState(new Set());
  const [isSearching, setIsSearching] = useState(false);

  // Medidores ya asignados al cliente
  const medidoresAsignadosCliente = useMemo(() => 
    obtenerMedidoresCliente(allMedidores, clienteId),
    [allMedidores, clienteId]
  );

  // Búsqueda con debounce
  useEffect(() => {
    if (busqueda.trim() === "") {
      setResultados([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      const filtrados = buscarMedidores(allMedidores, busqueda);
      setResultados(filtrados);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [busqueda, allMedidores]);

  // Seleccionar medidor
  const seleccionarMedidor = useCallback((medidor) => {
    if (medidor.cliente_id && medidor.cliente_id !== clienteId) return;

    const yaSeleccionado = medidoresSeleccionados.some(m => m.id === medidor.id);
    if (!yaSeleccionado) {
      const nuevosSeleccionados = [...medidoresSeleccionados, medidor];
      setMedidoresSeleccionados(nuevosSeleccionados);
      onMedidorSeleccionado?.(nuevosSeleccionados.map(m => m.id));
    }

    setBusqueda("");
    setResultados([]);
  }, [medidoresSeleccionados, onMedidorSeleccionado, clienteId]);

  // Quitar medidor seleccionado
  const quitarMedidor = useCallback((id) => {
    const nuevos = medidoresSeleccionados.filter(m => m.id !== id);
    setMedidoresSeleccionados(nuevos);
    onMedidorSeleccionado?.(nuevos.map(m => m.id));
  }, [medidoresSeleccionados, onMedidorSeleccionado]);

  // Manejar liberación de medidores
  const manejarLiberacion = useCallback((medidorId) => {
    setMedidoresLiberados(prev => {
      const nuevoSet = new Set(prev);
      if (nuevoSet.has(medidorId)) {
        nuevoSet.delete(medidorId);
      } else {
        nuevoSet.add(medidorId);
      }
      onLiberarMedidor?.(Array.from(nuevoSet));
      return nuevoSet;
    });
  }, [onLiberarMedidor]);

  // Limpiar búsqueda
  const limpiarBusqueda = () => {
    setBusqueda("");
    setResultados([]);
  };

  // Obtener estado de un medidor
  const getEstadoMedidor = useCallback((medidor) => {
    return obtenerEstadoMedidor(medidor, clienteId);
  }, [clienteId]);

  return {
    // Estado
    busqueda,
    resultados,
    medidoresSeleccionados,
    medidoresAsignadosCliente,
    medidoresLiberados,
    isSearching,

    // Handlers
    setBusqueda,
    seleccionarMedidor,
    quitarMedidor,
    manejarLiberacion,
    limpiarBusqueda,
    getEstadoMedidor,

    // Utilidades
    actualizarMedidores
  };
};
