import { useState, useEffect } from "react";
import { Card, CardBody, Badge, Progress, Button } from "@nextui-org/react";
import { EstadisticasIcon, AlertaIcon } from "../../IconsApp/IconsAdmin";
import { FlechaReturnIcon } from "../../IconsApp/IconsAppSystem";
import { useNavigate } from "react-router-dom";

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [metricas, setMetricas] = useState({});
  const [alertas, setAlertas] = useState([]);

  // Datos de ejemplo - en producción vendrían del contexto o API
  const datosEjemplo = {
    clientesActivos: 156,
    lecturasMes: 142,
    totalRecaudado: 28450.00,
    facturasEmitidas: 156,
    facturasPagadas: 132,
    facturasVencidas: 18,
    medidoresInactivos: 8,
    consumoPromedio: 42.3,
    eficienciaCobranza: 84.6,
    crecimientoMensual: 5.2
  };

  const alertasEjemplo = [
    { id: 1, tipo: "warning", mensaje: "18 facturas vencidas requieren atención", detalle: "Facturas con más de 30 días de vencimiento" },
    { id: 2, tipo: "danger", mensaje: "8 medidores sin lecturas en 60 días", detalle: "Medidores que requieren mantenimiento" },
    { id: 3, tipo: "info", mensaje: "5 clientes nuevos este mes", detalle: "Crecimiento de base de clientes" },
    { id: 4, tipo: "warning", mensaje: "12 lecturas pendientes de captura", detalle: "Lecturas del periodo actual" }
  ];

  useEffect(() => {
    setMetricas(datosEjemplo);
    setAlertas(alertasEjemplo);
  }, []);

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  };

  const getColorAlerta = (tipo) => {
    switch (tipo) {
      case "danger": return "danger";
      case "warning": return "warning";
      case "info": return "primary";
      default: return "default";
    }
  };

  const porcentajePago = metricas.facturasEmitidas > 0 ? 
    (metricas.facturasPagadas / metricas.facturasEmitidas) * 100 : 0;

  const porcentajeLecturas = 156 > 0 ? 
    (metricas.lecturasMes / 156) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Administrativo</h1>
        <Button color="gray" onClick={() => navigate(-1)}>
          <FlechaReturnIcon className="w-6 h-6" />
          <span className="ml-2">Volver</span>
        </Button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="text-center">
            <EstadisticasIcon className="w-8 h-8 mx-auto mb-2" />
            <p className="text-3xl font-bold">{metricas.clientesActivos || 0}</p>
            <p className="text-sm opacity-90">Clientes Activos</p>
          </CardBody>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="text-center">
            <EstadisticasIcon className="w-8 h-8 mx-auto mb-2" />
            <p className="text-3xl font-bold">{metricas.lecturasMes || 0}</p>
            <p className="text-sm opacity-90">Lecturas del Mes</p>
          </CardBody>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardBody className="text-center">
            <EstadisticasIcon className="w-8 h-8 mx-auto mb-2" />
            <p className="text-3xl font-bold">{formatearMoneda(metricas.totalRecaudado || 0)}</p>
            <p className="text-sm opacity-90">Recaudado del Mes</p>
          </CardBody>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardBody className="text-center">
            <EstadisticasIcon className="w-8 h-8 mx-auto mb-2" />
            <p className="text-3xl font-bold">{metricas.eficienciaCobranza?.toFixed(1) || 0}%</p>
            <p className="text-sm opacity-90">Eficiencia Cobranza</p>
          </CardBody>
        </Card>
      </div>

      {/* Indicadores de progreso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardBody>
            <h3 className="text-xl font-bold mb-4">Facturación vs Pagos</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Facturas Pagadas</span>
                  <span className="font-bold">{metricas.facturasPagadas}/{metricas.facturasEmitidas}</span>
                </div>
                <Progress 
                  value={porcentajePago} 
                  color="success"
                  className="mb-2"
                />
                <p className="text-sm text-gray-600">{porcentajePago.toFixed(1)}% de facturas pagadas</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{metricas.facturasPagadas}</p>
                  <p className="text-sm text-gray-600">Pagadas</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{metricas.facturasVencidas}</p>
                  <p className="text-sm text-gray-600">Vencidas</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {(metricas.facturasEmitidas || 0) - (metricas.facturasPagadas || 0) - (metricas.facturasVencidas || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Pendientes</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="text-xl font-bold mb-4">Progreso de Lecturas</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Lecturas Capturadas</span>
                  <span className="font-bold">{metricas.lecturasMes}/156</span>
                </div>
                <Progress 
                  value={porcentajeLecturas} 
                  color="primary"
                  className="mb-2"
                />
                <p className="text-sm text-gray-600">{porcentajeLecturas.toFixed(1)}% del total de medidores</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{metricas.consumoPromedio}</p>
                  <p className="text-sm text-gray-600">m³ promedio</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{metricas.medidoresInactivos}</p>
                  <p className="text-sm text-gray-600">Sin lectura</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Alertas y notificaciones */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-2 mb-4">
            <AlertaIcon className="w-6 h-6 text-orange-500" />
            <h3 className="text-xl font-bold">Alertas y Notificaciones</h3>
          </div>
          
          <div className="space-y-3">
            {alertas.map((alerta) => (
              <div 
                key={alerta.id} 
                className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <Badge color={getColorAlerta(alerta.tipo)} className="mt-1" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{alerta.mensaje}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{alerta.detalle}</p>
                </div>
                <Button size="sm" variant="bordered" color={getColorAlerta(alerta.tipo)}>
                  Ver más
                </Button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Resumen financiero rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-gray-600 mb-1">Crecimiento Mensual</p>
            <p className="text-3xl font-bold text-green-600">+{metricas.crecimientoMensual}%</p>
            <p className="text-xs text-gray-500">vs mes anterior</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-gray-600 mb-1">Promedio por Cliente</p>
            <p className="text-3xl font-bold text-blue-600">
              {formatearMoneda(metricas.clientesActivos ? (metricas.totalRecaudado / metricas.clientesActivos) : 0)}
            </p>
            <p className="text-xs text-gray-500">recaudo mensual</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-gray-600 mb-1">Medidores Activos</p>
            <p className="text-3xl font-bold text-purple-600">
              {156 - (metricas.medidoresInactivos || 0)}
            </p>
            <p className="text-xs text-gray-500">de 156 totales</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default DashboardAdmin;
