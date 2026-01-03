// hooks/useRutaForm.js
// Hook compartido para manejar formularios de rutas (Registrar y Editar)

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRutas } from "../context/RutasContext";
import { useFeedback } from "../context/FeedbackContext";
import { 
  validarCamposRuta, 
  generarMensajeError, 
  prepararDatosRuta,
  prepararDatosActualizacion 
} from "../utils/rutaUtils";

/**
 * Hook personalizado para manejar la lógica del formulario de rutas
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.modoEdicion - Si está en modo edición (true) o registro (false)
 * @param {Object} options.rutaInicial - Datos iniciales de la ruta (solo para edición)
 * @param {boolean} options.isOpen - Estado del modal (para cargar datos en edición)
 * @param {Function} options.onSuccess - Callback al completar exitosamente
 * @returns {Object} - Estados y funciones del formulario
 */
export function useRutaForm({ modoEdicion = false, rutaInicial = null, isOpen = true, onSuccess }) {
  const { user } = useAuth();
  const { actualizarRutas, obtenerInfoRuta } = useRutas();
  const { setSuccess, setError } = useFeedback();

  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [puntosRuta, setPuntosRuta] = useState([]);
  const [puntosOriginales, setPuntosOriginales] = useState([]);
  const [rutaCalculada, setRutaCalculada] = useState(null);
  const [dibujar, setDibujar] = useState(false);
  const [erroresCampos, setErroresCampos] = useState({});
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar datos iniciales en modo edición y resetear estados al abrir
  useEffect(() => {
    if (isOpen) {
      // Fix: Resetear estado de guardado al abrir el modal
      setIsSaving(false);
      setMostrarErrores(false);
      
      if (modoEdicion && rutaInicial) {
        cargarDatosRuta();
      }
    }
  }, [modoEdicion, rutaInicial, isOpen]);

  /**
   * Carga los datos de una ruta existente para edición
   */
  const cargarDatosRuta = async () => {
    setIsLoading(true);
    try {
      const info = await obtenerInfoRuta(rutaInicial.id);
      
      setNombre(info.nombre || "");
      setDescripcion(info.descripcion || "");
      
      // Cargar puntos existentes
      const puntosExistentes = info.puntos.map(p => ({
        id: p.medidor_id,
        lat: parseFloat(p.latitud),
        lng: parseFloat(p.longitud),
        orden: p.orden
      }));
      
      setPuntosRuta(puntosExistentes);
      setPuntosOriginales(puntosExistentes);
      
      // Si hay puntos, calcular la ruta
      if (puntosExistentes.length >= 2) {
        await calcularRutaInicial(puntosExistentes);
      }
    } catch (error) {
      console.error("Error al cargar ruta:", error);
      setError("No se pudo cargar la información de la ruta", modoEdicion ? "Editar Ruta" : "Registro de Rutas");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Calcula la ruta inicial (usado en modo edición)
   */
  const calcularRutaInicial = async (puntos) => {
    try {
      const resultado = await window.api.calcularRuta(puntos);
      setRutaCalculada(resultado);
      setDibujar(true);
    } catch (error) {
      console.error("Error al calcular ruta:", error);
    }
  };

  /**
   * Agrega un punto a la ruta
   */
  const handleAgregarPunto = useCallback((punto) => {
    setPuntosRuta((prev) => [...prev, punto]);
    setDibujar(false); // Resetear para recalcular
  }, []);

  /**
   * Elimina un punto de la ruta por su índice
   */
  const eliminarPuntoRuta = useCallback((index) => {
    setPuntosRuta((prev) => prev.filter((_, i) => i !== index));
    setDibujar(false); // Resetear para recalcular
  }, []);

  /**
   * Limpia el error de un campo específico
   */
  const limpiarError = useCallback((campo) => {
    setErroresCampos(prev => ({
      ...prev,
      [campo]: false
    }));
  }, []);

  /**
   * Dibuja/calcula la ruta basándose en los puntos seleccionados
   */
  const handleDibujarRuta = async () => {
    try {
      const resultado = await window.api.calcularRuta(puntosRuta);
      setRutaCalculada(resultado);
      setDibujar(true);
    } catch (error) {
      console.error("Error al calcular ruta:", error);
      setError(
        `No se pudo calcular la ruta. Añade puntos al mapa -> ${error.message}`,
        modoEdicion ? "Editar Ruta" : "Registro de Rutas"
      );
    }
  };

  /**
   * Reinicia el estado de la ruta
   */
  const reiniciarRuta = useCallback(() => {
    setPuntosRuta(modoEdicion ? puntosOriginales : []);
    setRutaCalculada(null);
    setDibujar(false);
  }, [modoEdicion, puntosOriginales]);

  /**
   * Resetea todos los campos del formulario
   */
  const resetearFormulario = useCallback(() => {
    setNombre("");
    setDescripcion("");
    setPuntosRuta([]);
    setPuntosOriginales([]);
    setRutaCalculada(null);
    setDibujar(false);
    setErroresCampos({});
    setMostrarErrores(false);
    setIsSaving(false);
  }, []);

  /**
   * Valida los campos del formulario
   */
  const validarFormulario = () => {
    const errores = validarCamposRuta({
      nombre,
      descripcion,
      puntosRuta,
      rutaCalculada
    });

    if (Object.keys(errores).length > 0) {
      setErroresCampos(errores);
      setMostrarErrores(true);
      const mensaje = generarMensajeError(errores);
      setError(mensaje, modoEdicion ? "Editar Ruta" : "Registro de Rutas");
      return false;
    }

    setErroresCampos({});
    return true;
  };

  /**
   * Guarda una nueva ruta
   */
  const guardarNuevaRuta = async () => {
    try {
      const token_session = localStorage.getItem("token");
      
      const ruta = prepararDatosRuta({
        nombre,
        descripcion,
        puntosRuta,
        rutaCalculada,
        userId: user?.id
      });

      const response = await window.api.registerRuta({ ruta, token_session });

      if (response.success) {
        setSuccess("Ruta registrada exitosamente.", "Registro de Rutas");
        
        setTimeout(async () => {
          resetearFormulario();
          await actualizarRutas();
          onSuccess?.();
        }, 2000);
        
        return true;
      } else {
        setError(response.message || "No se pudo registrar la ruta.", "Registro de Rutas");
        return false;
      }
    } catch (err) {
      console.error("Error al guardar ruta:", err);
      setError("Ocurrió un error al registrar la ruta.", "Registro de Rutas");
      return false;
    }
  };

  /**
   * Actualiza una ruta existente
   */
  const actualizarRutaExistente = async () => {
    try {
      const token_session = localStorage.getItem("token");
      
      const rutaActualizada = prepararDatosActualizacion({
        nombre,
        descripcion,
        puntosRuta,
        rutaCalculada
      });

      console.log("📤 Enviando actualización de ruta:", rutaActualizada);
      const response = await window.api.modificarRuta(
        token_session, 
        rutaInicial.id, 
        rutaActualizada
      );
      console.log("📥 Respuesta recibida:", response);

      if (response && response.success) {
        setSuccess("Ruta actualizada exitosamente.", "Editar Ruta");
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        await actualizarRutas();
        
        setTimeout(() => {
          onSuccess?.();
        }, 500);
        
        return true;
      } else {
        const errorMsg = response?.message || "No se pudo actualizar la ruta. Respuesta inesperada del servidor.";
        console.error("❌ Error al actualizar:", errorMsg, response);
        setError(errorMsg, "Editar Ruta");
        return false;
      }
    } catch (err) {
      console.error("Error al actualizar ruta:", err);
      setError("Ocurrió un error al actualizar la ruta.", "Editar Ruta");
      return false;
    }
  };

  /**
   * Guarda la ruta (nueva o actualización según el modo)
   */
  const guardarRuta = async () => {
    setMostrarErrores(true);
    setIsSaving(true);

    try {
      // Validar formulario
      if (!validarFormulario()) {
        setIsSaving(false);
        return false;
      }

      // Guardar según el modo
      const exito = modoEdicion 
        ? await actualizarRutaExistente() 
        : await guardarNuevaRuta();

      if (!exito) {
        setIsSaving(false);
      }

      return exito;
    } catch (error) {
       console.error("Error en guardarRuta:", error);
       setIsSaving(false);
       return false;
    }
  };

  return {
    // Estados
    nombre,
    setNombre,
    descripcion,
    setDescripcion,
    puntosRuta,
    rutaCalculada,
    dibujar,
    erroresCampos,
    mostrarErrores,
    isLoading,
    isSaving,

    // Funciones
    handleAgregarPunto,
    eliminarPuntoRuta,
    limpiarError,
    handleDibujarRuta,
    reiniciarRuta,
    resetearFormulario,
    guardarRuta
  };
}
