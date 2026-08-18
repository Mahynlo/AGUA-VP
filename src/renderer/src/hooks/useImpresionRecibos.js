import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useReportes } from '../context/ReportesContext'; // Importar contexto
import { useRutas } from '../context/RutasContext';
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
  const { periodosInfo, siguientePeriodo, ultimoPeriodoRegistrado, ultimoPeriodoFacturado } = useRutas();
  // Estado local UI
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("");
  const [clientesSeleccionados, setClientesSeleccionados] = useState(new Set());
  const [procesandoAccion, setProcesandoAccion] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);     // Ruta file:// del PDF temporal (para el visor)
  const [printUrl, setPrintUrl] = useState(null); // URL React original (para impresión silenciosa)
  const [modoPdf, setModoPdf] = useState(null);   // 'imprimir' | 'vista-previa' | null
  const [progresoGeneracion, setProgresoGeneracion] = useState(null); // Indicador de progreso de impresión
  
  // Nuevos estados para opciones de impresión
  const [ciudadFiltro, setCiudadFiltro] = useState("All");
  const [ordenCriterio, setOrdenCriterio] = useState("numero_predio");

  // Consumir contexto de reportes
  const { recibos, loading, cargarRecibos } = useReportes();
  const { token } = useAuth();

  // Inicializar automáticamente con el último período facturado/registrado
  useEffect(() => {
    if (!periodoSeleccionado) {
      const periodoInicial = ultimoPeriodoFacturado || ultimoPeriodoRegistrado || siguientePeriodo;
      if (periodoInicial) {
        setPeriodoSeleccionado(periodoInicial);
        const cachedToken = token || localStorage.getItem("token");
        cargarRecibos(cachedToken, periodoInicial);
      }
    }
  }, [periodoSeleccionado, ultimoPeriodoFacturado, ultimoPeriodoRegistrado, siguientePeriodo, token, cargarRecibos]);

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

  // Obtener las ciudades únicas disponibles
  const ciudadesDisponibles = useMemo(() => {
    const set = new Set();
    (recibos || []).forEach(f => {
      const city = (f.cliente_ciudad || "").trim();
      if (city) set.add(city);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, [recibos]);

  // Filtrar y ordenar los recibos
  const clientesConFacturasYLecturas = useMemo(() => {
    let list = [...recibos];
    
    // 1. Filtrar por ciudad
    if (ciudadFiltro !== "All") {
      list = list.filter(f => (f.cliente_ciudad || "").trim().toUpperCase() === ciudadFiltro.trim().toUpperCase());
    }
    
    // 2. Ordenar
    const parsePredioParts = (val) => {
        if (!val) return ["", 0];
        const match = val.match(/^([A-Za-z]*)[-\/]?(\d+)$/);
        if (match) return [match[1].toUpperCase(), parseInt(match[2], 10)];
        return [val.toUpperCase(), 0];
    };

    list.sort((a, b) => {
      if (ordenCriterio === "numero_predio") {
        const [prefA, numA] = parsePredioParts(a.numero_predio);
        const [prefB, numB] = parsePredioParts(b.numero_predio);
        if (prefA !== prefB) return prefA.localeCompare(prefB);
        return numA - numB;
      }
      if (ordenCriterio === "cliente_nombre") {
        return (a.cliente_nombre || "").localeCompare(b.cliente_nombre || "", "es", { sensitivity: "base" });
      }
      // "defecto" (no hace sort, conserva orden original)
      return 0;
    });

    return list;
  }, [recibos, ciudadFiltro, ordenCriterio]);

  // Seleccionar todos automáticamente cuando cambie la lista filtrada de recibos
  useEffect(() => {
    if (clientesConFacturasYLecturas.length > 0) {
      const nuevosSeleccionados = new Set(
        clientesConFacturasYLecturas.map(factura => factura.id)
      );
      setClientesSeleccionados(nuevosSeleccionados);
    } else {
      setClientesSeleccionados(new Set());
    }
  }, [clientesConFacturasYLecturas]);

  // Obtener facturas seleccionadas
  const facturasParaImprimir = useMemo(() => {
    return clientesConFacturasYLecturas.filter(factura => 
      clientesSeleccionados.has(factura.id)
    );
  }, [clientesConFacturasYLecturas, clientesSeleccionados]);
  
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

    // Iniciar temporizador de progreso
    const total = facturasParaImprimir.length;
    let actual = 0;
    setProgresoGeneracion({
      actual: 1,
      total,
      cliente: facturasParaImprimir[0] ? `${facturasParaImprimir[0].cliente_nombre} (${facturasParaImprimir[0].numero_predio})` : ""
    });
    
    const intervalId = setInterval(() => {
      actual += 1;
      if (actual < total) {
        setProgresoGeneracion({
          actual: actual + 1,
          total,
          cliente: facturasParaImprimir[actual] ? `${facturasParaImprimir[actual].cliente_nombre} (${facturasParaImprimir[actual].numero_predio})` : ""
        });
      } else {
        clearInterval(intervalId);
      }
    }, Math.max(80, Math.min(250, 4000 / total)));

    try {
        // Construir URL para impresión silenciosa
        const batchPrintUrl = await construirURLImpresion(facturasParaImprimir, false, ciudadFiltro);
        // Generar PDF de vista previa
        const response = await window.api.previewComponent(batchPrintUrl);

        if (response && response.success && response.path) {
          setPrintUrl(batchPrintUrl);
          setPdfUrl(response.path);
          setModoPdf('imprimir');
        }
    } catch (err) {
        console.error("Error preparing print:", err);
        alert("Hubo un error al preparar la impresión: " + err);
    } finally {
        clearInterval(intervalId);
        setProgresoGeneracion(null);
        setProcesandoAccion(null);
    }
  };

  // Vista previa de recibos
  const handleVistaPreviaRecibos = async () => {
    if (procesandoAccion) return;
    if (facturasParaImprimir.length === 0) {
      alert('No hay clientes seleccionados para vista previa');
      return;
    }

    setProcesandoAccion('vista-previa');

    // Iniciar temporizador de progreso
    const total = facturasParaImprimir.length;
    let actual = 0;
    setProgresoGeneracion({
      actual: 1,
      total,
      cliente: facturasParaImprimir[0] ? `${facturasParaImprimir[0].cliente_nombre} (${facturasParaImprimir[0].numero_predio})` : ""
    });
    
    const intervalId = setInterval(() => {
      actual += 1;
      if (actual < total) {
        setProgresoGeneracion({
          actual: actual + 1,
          total,
          cliente: facturasParaImprimir[actual] ? `${facturasParaImprimir[actual].cliente_nombre} (${facturasParaImprimir[actual].numero_predio})` : ""
        });
      } else {
        clearInterval(intervalId);
      }
    }, Math.max(80, Math.min(250, 4000 / total)));

    try {
        const previewUrl = await construirURLImpresion(facturasParaImprimir, true, ciudadFiltro);
        
        console.log('Vista previa de recibos para:', facturasParaImprimir.length, 'clientes');
        console.log('Páginas en vista previa:', estadisticas.paginasEstimadas);
        console.log('Preview from URL:', previewUrl);
        
        // NOTA: previewComponent ahora devuelve { success: true, path: 'file://...' }
        const response = await window.api.previewComponent(previewUrl);
        console.log('Preview response:', response);

        if (response && response.success && response.path) {
          setPrintUrl(previewUrl);
          setPdfUrl(response.path);
          setModoPdf('vista-previa');
        } else {
          console.warn('Respuesta inesperada del preview:', response);
        }
    } catch (err) {
        console.error("Error in preview:", err);
        alert("Hubo un error al generar la vista previa: " + err);
    } finally {
        clearInterval(intervalId);
        setProgresoGeneracion(null);
        setProcesandoAccion(null);
    }
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
    modoPdf,
    setModoPdf,
    ciudadFiltro,
    setCiudadFiltro,
    ordenCriterio,
    setOrdenCriterio,
    progresoGeneracion,
    
    // Datos computados
    clientesConFacturasYLecturas,
    facturasParaImprimir,
    estadisticas,
    ciudadesDisponibles,
    
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
