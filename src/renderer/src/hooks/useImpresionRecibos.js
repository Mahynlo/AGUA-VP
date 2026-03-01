import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useReportes } from '../context/ReportesContext'; // Importar contexto
import { 
  construirURLImpresion,
  calcularEstadisticas,
  generarDatosMock
} from '../utils/reciboUtils';

/**
 * Hook personalizado para manejar la lógica de impresión de recibos
 * Ahora utiliza ReportesContext para caching y persistencia
 */
const useImpresionRecibos = () => {
  // Estado local UI
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("");
  const [clientesSeleccionados, setClientesSeleccionados] = useState(new Set());
  const [procesandoAccion, setProcesandoAccion] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);   // Ruta file:// del PDF temporal (para el iframe)
  const [printUrl, setPrintUrl] = useState(null); // URL React original (para impresión silenciosa)
  
  // Consumir contexto de reportes
  const { recibos, loading, cargarRecibos } = useReportes();
  const { token } = useAuth();

  // Cambio de período
  const handleCambioPeriodo = (nuevoPeriodo) => {
    setPeriodoSeleccionado(nuevoPeriodo);
    setClientesSeleccionados(new Set());
    
    if (nuevoPeriodo) {
      // Delegar carga al contexto (maneja caché internamente)
      const cachedToken = token || localStorage.getItem("token");
      cargarRecibos(cachedToken, nuevoPeriodo);
    }
  };

  // Seleccionar todos automáticamente cuando llegan nuevos recibos
  useEffect(() => {
    if (recibos.length > 0) {
      const nuevosSeleccionados = new Set(
        recibos.map(factura => factura.id)
      );
      setClientesSeleccionados(nuevosSeleccionados);
    }
  }, [recibos]);

  // Obtener facturas seleccionadas
  const facturasParaImprimir = useMemo(() => {
    return recibos.filter(factura => 
      clientesSeleccionados.has(factura.id)
    );
  }, [recibos, clientesSeleccionados]);
  
  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    return calcularEstadisticas(facturasParaImprimir);
  }, [facturasParaImprimir]);

  // ... (Resto de handlers igual)

  // Toggle individual de cliente
  const handleToggleCliente = (facturaId) => {
    const nuevosSeleccionados = new Set(clientesSeleccionados);
    if (nuevosSeleccionados.has(facturaId)) {
      nuevosSeleccionados.delete(facturaId);
    } else {
      nuevosSeleccionados.add(facturaId);
    }
    setClientesSeleccionados(nuevosSeleccionados);
  };

  // Toggle todos los clientes
  const handleToggleTodos = () => {
    if (clientesSeleccionados.size === recibos.length) {
      setClientesSeleccionados(new Set());
    } else {
      const todosSeleccionados = new Set(
        recibos.map(factura => factura.id)
      );
      setClientesSeleccionados(todosSeleccionados);
    }
  };



  // Imprimir recibos → genera el PDF y abre el modal con panel de opciones
  // El usuario elige impresora, orientación y copias antes de imprimir (sin diálogo del OS)
  const handleImprimirRecibos = async () => {
    if (procesandoAccion) return;
    if (facturasParaImprimir.length === 0) {
      alert('No hay clientes seleccionados para imprimir');
      return;
    }

    setProcesandoAccion('imprimir');
    try {
        // Construir URL para impresión silenciosa
        const batchPrintUrl = await construirURLImpresion(facturasParaImprimir, false);
        // Generar PDF de vista previa
        const response = await window.api.previewComponent(batchPrintUrl);

        if (response && response.success && response.path) {
          setPrintUrl(batchPrintUrl);
          setPdfUrl(response.path);
        }
        setProcesandoAccion(null);
    } catch (err) {
        console.error("Error preparing print:", err);
        setProcesandoAccion(null);
        alert("Hubo un error al preparar la impresión: " + err);
    }

    setTimeout(() => setProcesandoAccion(null), 15000);
  };

  // Vista previa de recibos
  const handleVistaPreviaRecibos = async () => {
    if (procesandoAccion) return;
    if (facturasParaImprimir.length === 0) {
      alert('No hay clientes seleccionados para vista previa');
      return;
    }

    setProcesandoAccion('vista-previa');
    try {
        const previewUrl = await construirURLImpresion(facturasParaImprimir, true);
        
        console.log('Vista previa de recibos para:', facturasParaImprimir.length, 'clientes');
        console.log('Páginas en vista previa:', estadisticas.paginasEstimadas);
        console.log('Preview from URL:', previewUrl);
        
        // NOTA: previewComponent ahora devuelve { success: true, path: 'file://...' }
        const response = await window.api.previewComponent(previewUrl);
        console.log('Preview response:', response);

        if (response && response.success && response.path) {
          setPrintUrl(previewUrl); // Guardar URL para impresión silenciosa desde el modal
          setPdfUrl(response.path);
        } else {
          // Fallback legacy (si devolviera solo string)
          console.warn('Respuesta inesperada del preview:', response);
        }

        setProcesandoAccion(null);
    } catch (err) {
        console.error("Error in preview:", err);
        setProcesandoAccion(null);
        alert("Hubo un error al generar la vista previa: " + err);
    }

    // Safety timeout (extended)
    setTimeout(() => setProcesandoAccion(null), 15000);
  };

  // Prueba con datos mock
  const handlePruebaConDatosMock = () => {
    const facturasMock = generarDatosMock();
    const previewUrl = construirURLImpresion(facturasMock, true);
    
    console.log('Vista previa con datos mock:', facturasMock.length, 'clientes');
    console.log('URL generada:', previewUrl);
    
    window.api.previewComponent(previewUrl, (response) => {
      console.log(response);
    });
  };

  // Test de URLs y debug
  const handleTestUrls = () => {
    console.log('Debug info:', {
      facturas: recibos,
      seleccionados: clientesSeleccionados,
      periodo: periodoSeleccionado
    });
  };

  return {
    // Estado
    periodoSeleccionado,
    clientesSeleccionados,
    loading,
    procesandoAccion,
    pdfUrl,
    printUrl,
    
    // Datos computados
    clientesConFacturasYLecturas: recibos,
    facturasParaImprimir,
    estadisticas,
    
    // Handlers
    handleCambioPeriodo,
    handleToggleCliente,
    handleToggleTodos,
    handleImprimirRecibos,
    handleVistaPreviaRecibos,
    handlePruebaConDatosMock,
    handleTestUrls,
    setPdfUrl,
    setPrintUrl
  };
};

export default useImpresionRecibos;
