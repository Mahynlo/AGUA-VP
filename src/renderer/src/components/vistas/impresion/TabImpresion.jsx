import React, { useState, useEffect, useMemo } from "react";
import { Button, Card, CardBody, CardHeader, Select, SelectItem, Chip, Checkbox, Divider } from "@nextui-org/react";
import { HiPrinter, HiEye, HiUsers, HiDocumentText, HiCog } from "react-icons/hi";
import { Link } from "react-router-dom";
import { useFacturas } from "../../../context/FacturasContext";

const TabImpresion = () => {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("");
  const [clientesSeleccionados, setClientesSeleccionados] = useState(new Set());
  
  // Contexto de facturas
  const { 
    facturas, 
    loading, 
    filtrarPorPeriodo,
    facturasComputadas
  } = useFacturas();

  // Generar opciones de períodos (últimos 12 meses)
  const generarOpcionesPeriodos = () => {
    const opciones = [];
    const hoy = new Date();
    
    for (let i = 0; i < 12; i++) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const periodo = fecha.toISOString().slice(0, 7); // YYYY-MM
      const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      opciones.push({
        value: periodo,
        label: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)
      });
    }
    
    return opciones;
  };

  const opcionesPeriodos = generarOpcionesPeriodos();

  // Filtrar facturas que tengan lecturas (saldo_pendiente !== null y total > 0)
  const clientesConFacturasYLecturas = useMemo(() => {
    return facturas.filter(factura => 
      factura.saldo_pendiente !== null && 
      factura.total > 0 &&
      factura.consumo_m3 > 0 // Asegurar que tenga consumo (lectura)
    );
  }, [facturas]);

  // Efecto para seleccionar todos los clientes por defecto cuando cambian las facturas
  useEffect(() => {
    if (clientesConFacturasYLecturas.length > 0) {
      const nuevosSeleccionados = new Set(clientesConFacturasYLecturas.map(factura => factura.id));
      setClientesSeleccionados(nuevosSeleccionados);
    }
  }, [clientesConFacturasYLecturas]);

  // Manejar cambio de período
  const handleCambioPeriodo = async (nuevoPeriodo) => {
    setPeriodoSeleccionado(nuevoPeriodo);
    setClientesSeleccionados(new Set()); // Limpiar selección
    if (nuevoPeriodo) {
      await filtrarPorPeriodo(nuevoPeriodo);
    }
  };

  // Manejar selección/deselección de clientes
  const handleToggleCliente = (facturaId) => {
    const nuevosSeleccionados = new Set(clientesSeleccionados);
    if (nuevosSeleccionados.has(facturaId)) {
      nuevosSeleccionados.delete(facturaId);
    } else {
      nuevosSeleccionados.add(facturaId);
    }
    setClientesSeleccionados(nuevosSeleccionados);
  };

  // Seleccionar/deseleccionar todos
  const handleToggleTodos = () => {
    if (clientesSeleccionados.size === clientesConFacturasYLecturas.length) {
      setClientesSeleccionados(new Set());
    } else {
      const todosSeleccionados = new Set(clientesConFacturasYLecturas.map(factura => factura.id));
      setClientesSeleccionados(todosSeleccionados);
    }
  };

  // Obtener facturas seleccionadas para impresión
  const facturasParaImprimir = clientesConFacturasYLecturas.filter(factura => 
    clientesSeleccionados.has(factura.id)
  );

  // Función para obtener la URL base correcta
  const getBaseUrl = () => {
    const currentUrl = window.location.href;
    const currentOrigin = window.location.origin;
    
    console.log('Current URL:', currentUrl);
    console.log('Current Origin:', currentOrigin);
    console.log('Protocol:', window.location.protocol);
    
    // En desarrollo (http://localhost:5173)
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      return currentOrigin;
    }
    
    // En producción empaquetada (file:// protocol)
    if (window.location.protocol === 'file:') {
      // Obtener la base sin el hash
      const basePath = currentUrl.split('#')[0];
      return basePath;
    }
    
    // Fallback
    return currentOrigin;
  };

  const handleImprimirRecibos = () => {
    if (facturasParaImprimir.length === 0) {
      alert('No hay clientes seleccionados para imprimir');
      return;
    }

    // Crear páginas de recibos (2 por página)
    const paginasRecibos = [];
    for (let i = 0; i < facturasParaImprimir.length; i += 2) {
      const recibosPagina = facturasParaImprimir.slice(i, i + 2);
      paginasRecibos.push(recibosPagina);
    }

    // Generar URL con datos de facturas
    const baseUrl = getBaseUrl();
    const datosFacturas = encodeURIComponent(JSON.stringify(paginasRecibos));
    const printUrl = `${baseUrl}#/recibo?print=true&facturas=${datosFacturas}`;
    
    console.log('Imprimiendo recibos para:', facturasParaImprimir.length, 'clientes');
    console.log('Páginas a imprimir:', paginasRecibos.length);
    
    window.api.printComponent(printUrl, (response) => {
      console.log(response);
    });
  };

  const handleVistaPreviaRecibos = () => {
    if (facturasParaImprimir.length === 0) {
      alert('No hay clientes seleccionados para vista previa');
      return;
    }

    // Crear páginas de recibos (2 por página)
    const paginasRecibos = [];
    for (let i = 0; i < facturasParaImprimir.length; i += 2) {
      const recibosPagina = facturasParaImprimir.slice(i, i + 2);
      paginasRecibos.push(recibosPagina);
    }

    // Generar URL con datos de facturas para vista previa
    const baseUrl = getBaseUrl();
    const datosFacturas = encodeURIComponent(JSON.stringify(paginasRecibos));
    const previewUrl = `${baseUrl}#/recibo?print=true&facturas=${datosFacturas}`;
    
    console.log('Vista previa de recibos para:', facturasParaImprimir.length, 'clientes');
    console.log('Páginas en vista previa:', paginasRecibos.length);
    console.log('Preview from URL:', previewUrl);
    
    // Usar el IPC de Electron para vista previa
    window.api.previewComponent(previewUrl, (response) => {
      console.log('Preview response:', response);
    });
  };

  // Función de prueba para verificar URLs y datos
  const testUrls = () => {
    const baseUrl = getBaseUrl();
    console.log('=== URL TEST ===');
    console.log('Base URL:', baseUrl);
    console.log('Facturas disponibles:', clientesConFacturasYLecturas.length);
    console.log('Clientes seleccionados:', clientesSeleccionados.size);
    console.log('Facturas para imprimir:', facturasParaImprimir.length);
    console.log('Datos de facturas:', facturasParaImprimir);
    console.log('Environment:', window.location.protocol === 'file:' ? 'Production (Packaged)' : 'Development');
    console.log('===============');
  };

  // Función para prueba rápida con datos mock
  const handlePruebaConDatosMock = () => {
    const facturasMock = [
      {
        id: 1,
        cliente_nombre: "Juan Alberto Munguía del Sol",
        direccion_cliente: "Domicilio conocido #123",
        cliente_ciudad: "Villa Pesqueira",
        consumo_m3: 28,
        total: 150.00,
        saldo_pendiente: 150.00,
        mes_facturado: "09",
        fecha_emision: new Date().toISOString(),
        medidor: { numero_serie: "NG-12345" },
        tarifa_nombre: "Tarifa Doméstica",
        ruta: { nombre: "13/4" }
      },
      {
        id: 2,
        cliente_nombre: "María González López",
        direccion_cliente: "Calle Principal #456",
        cliente_ciudad: "Mazatán",
        consumo_m3: 35,
        total: 200.00,
        saldo_pendiente: 200.00,
        mes_facturado: "09",
        fecha_emision: new Date().toISOString(),
        medidor: { numero_serie: "NG-67890" },
        tarifa_nombre: "Tarifa Doméstica",
        ruta: { nombre: "15/2" }
      },
      {
        id: 3,
        cliente_nombre: "Carlos Rodríguez Pérez",
        direccion_cliente: "Avenida Reforma #789",
        cliente_ciudad: "Villa Pesqueira",
        consumo_m3: 42,
        total: 250.00,
        saldo_pendiente: 250.00,
        mes_facturado: "09",
        fecha_emision: new Date().toISOString(),
        medidor: { numero_serie: "NG-11111" },
        tarifa_nombre: "Tarifa Doméstica",
        ruta: { nombre: "16/1" }
      }
    ];

    // Crear páginas de recibos (2 por página)
    const paginasRecibos = [];
    for (let i = 0; i < facturasMock.length; i += 2) {
      const recibosPagina = facturasMock.slice(i, i + 2);
      paginasRecibos.push(recibosPagina);
    }

    // Generar URL con datos de facturas
    const baseUrl = getBaseUrl();
    const datosFacturas = encodeURIComponent(JSON.stringify(paginasRecibos));
    const previewUrl = `${baseUrl}#/recibo?print=true&facturas=${datosFacturas}`;
    
    console.log('Vista previa con datos mock:', facturasMock.length, 'clientes');
    console.log('Páginas en vista previa:', paginasRecibos.length);
    console.log('URL generada:', previewUrl);
    
    window.api.previewComponent(previewUrl, (response) => {
      console.log(response);
    });
  };

  return (
    <div className="space-y-6">
      {/* Sección de selección de período */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <HiCog className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configuración de Período
            </h3>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Select
                label="Período de facturación"
                placeholder="Seleccione un período"
                selectedKeys={periodoSeleccionado ? [periodoSeleccionado] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0];
                  handleCambioPeriodo(selected);
                }}
                className="w-full"
              >
                {opcionesPeriodos.map((opcion) => (
                  <SelectItem key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
            
            <div className="flex items-end">
              <Card className="w-full">
                <CardBody className="bg-blue-50 dark:bg-blue-900/30">
                  <div className="flex items-center gap-3">
                    <HiUsers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-semibold text-blue-800 dark:text-blue-200">
                        {loading ? (
                          <span>Cargando...</span>
                        ) : (
                          <span>{clientesConFacturasYLecturas.length} clientes disponibles</span>
                        )}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-300">
                        Con facturas y lecturas
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Sección de selección de clientes */}
      {periodoSeleccionado && clientesConFacturasYLecturas.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <HiUsers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Clientes para Impresión
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <Chip 
                  color="primary" 
                  variant="flat"
                  className="text-sm"
                >
                  {clientesSeleccionados.size} de {clientesConFacturasYLecturas.length} seleccionados
                </Chip>
                <Button
                  size="sm"
                  variant="bordered"
                  onPress={handleToggleTodos}
                >
                  {clientesSeleccionados.size === clientesConFacturasYLecturas.length ? 
                    'Deseleccionar todos' : 'Seleccionar todos'
                  }
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="max-h-80 overflow-y-auto space-y-3">
              {clientesConFacturasYLecturas.map((factura) => (
                <Card
                  key={factura.id}
                  className={`transition-all duration-200 cursor-pointer ${
                    clientesSeleccionados.has(factura.id) 
                      ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                  isPressable
                  onPress={() => handleToggleCliente(factura.id)}
                >
                  <CardBody className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          isSelected={clientesSeleccionados.has(factura.id)}
                          onChange={() => handleToggleCliente(factura.id)}
                          color="primary"
                        />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {factura.cliente_nombre}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {factura.direccion_cliente}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Chip color="success" variant="flat" size="sm">
                          ${factura.total?.toFixed(2)}
                        </Chip>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {factura.consumo_m3} m³
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Mensaje cuando no hay facturas para el período */}
      {periodoSeleccionado && clientesConFacturasYLecturas.length === 0 && !loading && (
        <Card>
          <CardBody className="bg-warning-50 dark:bg-warning-900/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning-200 dark:bg-warning-800 rounded-lg">
                <HiUsers className="w-6 h-6 text-warning-600 dark:text-warning-400" />
              </div>
              <div>
                <p className="font-semibold text-warning-800 dark:text-warning-200">
                  No hay lecturas disponibles
                </p>
                <p className="text-sm text-warning-600 dark:text-warning-300">
                  No se encontraron lecturas para el período seleccionado.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Sección de acciones de impresión */}
      {facturasParaImprimir.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <HiPrinter className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Acciones de Impresión
              </h3>
            </div>
          </CardHeader>
          <CardBody className="pt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                onPress={handleVistaPreviaRecibos} 
                color="primary"
                variant="bordered"
                startContent={<HiEye />}
                size="lg"
              >
                Vista Previa de Recibos
              </Button>
              <Button 
                onPress={handleImprimirRecibos} 
                color="success"
                startContent={<HiPrinter />}
                size="lg"
              >
                Imprimir Recibos
              </Button>
            </div>
            
            <Card className="bg-blue-50 dark:bg-blue-900/30">
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {facturasParaImprimir.length}
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Recibos seleccionados
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {Math.ceil(facturasParaImprimir.length / 2)}
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Páginas a imprimir
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {facturasParaImprimir.length % 2 === 1 ? '1+1' : '2'}
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Recibos por página
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </CardBody>
        </Card>
      )}

      {/* Sección de debug/test */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <HiCog className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Herramientas de Desarrollo
            </h3>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button 
              onPress={testUrls} 
              variant="bordered"
              className="text-gray-600 border-gray-300"
            >
              🔍 Test URLs (Ver Consola)
            </Button>
            <Button 
              onPress={handlePruebaConDatosMock} 
              color="primary"
              variant="bordered"
            >
              🧪 Prueba con Datos Mock
            </Button>
            <Button 
              as={Link} 
              to="/recibo"
              variant="bordered"
              className="text-gray-600 border-gray-300"
            >
              Ir a página de recibo
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default TabImpresion;
