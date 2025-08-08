import { useState, useEffect } from "react";
import { Card, CardBody, Button, Select, SelectItem } from "@nextui-org/react";
import { FlechaReturnIcon } from "../../../IconsApp/IconsAppSystem";
import { useNavigate } from "react-router-dom";

const TabEstadisticas = () => {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState("mes");
  const [estadisticas, setEstadisticas] = useState({});

  // Datos de ejemplo - en producción vendrían del contexto o API
  const estadisticasEjemplo = {
    mes: {
      totalRecaudado: 15400.00,
      totalFacturado: 18200.00,
      porcentajeCobranza: 84.6,
      pagosPendientes: 2800.00,
      facturasPagadas: 25,
      facturasVencidas: 8,
      facturasPendientes: 12,
      promedioConsumo: 42.3,
      clientesConPagos: 25,
      metodosPago: {
        "Efectivo": 6200.00,
        "Transferencia Bancaria": 5800.00,
        "Tarjeta de Crédito": 2400.00,
        "Cheque": 1000.00
      },
      evolutionMensual: [
        { mes: "Oct", recaudado: 12800, facturado: 15200 },
        { mes: "Nov", recaudado: 14200, facturado: 16800 },
        { mes: "Dic", recaudado: 13900, facturado: 17100 },
        { mes: "Ene", recaudado: 15400, facturado: 18200 }
      ]
    },
    trimestre: {
      totalRecaudado: 45500.00,
      totalFacturado: 52100.00,
      porcentajeCobranza: 87.3,
      pagosPendientes: 6600.00,
      facturasPagadas: 78,
      facturasVencidas: 15,
      facturasPendientes: 22,
      promedioConsumo: 41.8,
      clientesConPagos: 65,
      metodosPago: {
        "Efectivo": 18500.00,
        "Transferencia Bancaria": 16200.00,
        "Tarjeta de Crédito": 7800.00,
        "Cheque": 3000.00
      }
    },
    año: {
      totalRecaudado: 184200.00,
      totalFacturado: 210800.00,
      porcentajeCobranza: 87.4,
      pagosPendientes: 26600.00,
      facturasPagadas: 298,
      facturasVencidas: 45,
      facturasPendientes: 67,
      promedioConsumo: 43.1,
      clientesConPagos: 156,
      metodosPago: {
        "Efectivo": 74800.00,
        "Transferencia Bancaria": 65200.00,
        "Tarjeta de Crédito": 31200.00,
        "Cheque": 13000.00
      }
    }
  };

  useEffect(() => {
    setEstadisticas(estadisticasEjemplo[periodo]);
  }, [periodo]);

  const getColorPorcentaje = (porcentaje) => {
    if (porcentaje >= 90) return "text-green-600";
    if (porcentaje >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const calcularPorcentajeMetodo = (monto) => {
    return ((monto / estadisticas.totalRecaudado) * 100).toFixed(1);
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  };

  const formatearPorcentaje = (valor) => {
    return `${valor.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Estadísticas de Pagos</h1>
        <Button color="gray" onClick={() => navigate(-1)}>
          <FlechaReturnIcon className="w-6 h-6" />
          <span className="ml-2">Volver</span>
        </Button>
      </div>

      {/* Selector de periodo */}
      <Card>
        <CardBody>
          <div className="flex gap-4 items-center">
            <span className="text-sm font-medium">Periodo:</span>
            <Select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-48"
              size="sm"
            >
              <SelectItem key="mes" value="mes">Este mes</SelectItem>
              <SelectItem key="trimestre" value="trimestre">Este trimestre</SelectItem>
              <SelectItem key="año" value="año">Este año</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="text-center">
            <p className="text-3xl font-bold">{formatearMoneda(estadisticas.totalRecaudado || 0)}</p>
            <p className="text-sm opacity-90">Total Recaudado</p>
          </CardBody>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="text-center">
            <p className="text-3xl font-bold">{formatearMoneda(estadisticas.totalFacturado || 0)}</p>
            <p className="text-sm opacity-90">Total Facturado</p>
          </CardBody>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardBody className="text-center">
            <p className={`text-3xl font-bold`}>
              {formatearPorcentaje(estadisticas.porcentajeCobranza || 0)}
            </p>
            <p className="text-sm opacity-90">% de Cobranza</p>
          </CardBody>
        </Card>
        
        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardBody className="text-center">
            <p className="text-3xl font-bold">{formatearMoneda(estadisticas.pagosPendientes || 0)}</p>
            <p className="text-sm opacity-90">Pagos Pendientes</p>
          </CardBody>
        </Card>
      </div>

      {/* Métricas de facturas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="text-4xl font-bold text-green-600">{estadisticas.facturasPagadas || 0}</p>
            <p className="text-sm text-gray-600">Facturas Pagadas</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <p className="text-4xl font-bold text-yellow-600">{estadisticas.facturasPendientes || 0}</p>
            <p className="text-sm text-gray-600">Facturas Pendientes</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <p className="text-4xl font-bold text-red-600">{estadisticas.facturasVencidas || 0}</p>
            <p className="text-sm text-gray-600">Facturas Vencidas</p>
          </CardBody>
        </Card>
      </div>

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Métodos de pago */}
        <Card>
          <CardBody>
            <h3 className="text-xl font-bold mb-4">Distribución por Método de Pago</h3>
            <div className="space-y-3">
              {estadisticas.metodosPago && Object.entries(estadisticas.metodosPago).map(([metodo, monto]) => (
                <div key={metodo} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{metodo}</span>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{formatearMoneda(monto)}</div>
                    <div className="text-sm text-gray-500">
                      {calcularPorcentajeMetodo(monto)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Información general */}
        <Card>
          <CardBody>
            <h3 className="text-xl font-bold mb-4">Información General</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">Promedio de Consumo</span>
                <span className="font-bold text-blue-600">
                  {estadisticas.promedioConsumo || 0} m³
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">Clientes con Pagos</span>
                <span className="font-bold text-green-600">
                  {estadisticas.clientesConPagos || 0}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-medium">Eficiencia de Cobranza</span>
                <span className={`font-bold ${getColorPorcentaje(estadisticas.porcentajeCobranza || 0)}`}>
                  {formatearPorcentaje(estadisticas.porcentajeCobranza || 0)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium">Recaudo Promedio/Cliente</span>
                <span className="font-bold text-yellow-600">
                  {formatearMoneda(estadisticas.clientesConPagos ? 
                    (estadisticas.totalRecaudado / estadisticas.clientesConPagos) : 0)}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Evolución mensual (solo para periodo mes) */}
      {periodo === "mes" && estadisticas.evolutionMensual && (
        <Card>
          <CardBody>
            <h3 className="text-xl font-bold mb-4">Evolución de los Últimos 4 Meses</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {estadisticas.evolutionMensual.map((mes, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-bold text-lg mb-2">{mes.mes}</h4>
                  <div className="space-y-1">
                    <div>
                      <span className="text-sm text-gray-600">Recaudado:</span>
                      <p className="font-bold text-green-600">{formatearMoneda(mes.recaudado)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Facturado:</span>
                      <p className="font-bold text-blue-600">{formatearMoneda(mes.facturado)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Eficiencia:</span>
                      <p className={`font-bold ${getColorPorcentaje((mes.recaudado / mes.facturado) * 100)}`}>
                        {formatearPorcentaje((mes.recaudado / mes.facturado) * 100)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default TabEstadisticas;
