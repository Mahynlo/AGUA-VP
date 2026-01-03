import { useState, useEffect } from "react";
import { Card, CardBody, Button, Select, SelectItem } from "@nextui-org/react";
import { FlechaReturnIcon } from "../../../IconsApp/IconsAppSystem";
import { useNavigate } from "react-router-dom";

const TabEstadisticas = () => {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState("mes");
  const [estadisticas, setEstadisticas] = useState({});

  // Datos de ejemplo
  const estadisticasEjemplo = {
    mes: {
      totalRecaudado: 15400.0,
      totalFacturado: 18200.0,
      porcentajeCobranza: 84.6,
      pagosPendientes: 2800.0,
      facturasPagadas: 25,
      facturasVencidas: 8,
      facturasPendientes: 12,
      promedioConsumo: 42.3,
      clientesConPagos: 25,
      metodosPago: {
        Efectivo: 6200.0,
        "Transferencia Bancaria": 5800.0,
        "Tarjeta de Crédito": 2400.0,
        Cheque: 1000.0,
      },
      evolutionMensual: [
        { mes: "Oct", recaudado: 12800, facturado: 15200 },
        { mes: "Nov", recaudado: 14200, facturado: 16800 },
        { mes: "Dic", recaudado: 13900, facturado: 17100 },
        { mes: "Ene", recaudado: 15400, facturado: 18200 },
      ],
    },
    trimestre: {
      totalRecaudado: 45500.0,
      totalFacturado: 52100.0,
      porcentajeCobranza: 87.3,
      pagosPendientes: 6600.0,
      facturasPagadas: 78,
      facturasVencidas: 15,
      facturasPendientes: 22,
      promedioConsumo: 41.8,
      clientesConPagos: 65,
      metodosPago: {
        Efectivo: 18500.0,
        "Transferencia Bancaria": 16200.0,
        "Tarjeta de Crédito": 7800.0,
        Cheque: 3000.0,
      },
    },
    año: {
      totalRecaudado: 184200.0,
      totalFacturado: 210800.0,
      porcentajeCobranza: 87.4,
      pagosPendientes: 26600.0,
      facturasPagadas: 298,
      facturasVencidas: 45,
      facturasPendientes: 67,
      promedioConsumo: 43.1,
      clientesConPagos: 156,
      metodosPago: {
        Efectivo: 74800.0,
        "Transferencia Bancaria": 65200.0,
        "Tarjeta de Crédito": 31200.0,
        Cheque: 13000.0,
      },
    },
  };

  useEffect(() => {
    setEstadisticas(estadisticasEjemplo[periodo]);
  }, [periodo]);

  // MODIFICADO: Agregados colores dark para mejor contraste (ej. green-400 en vez de 600)
  const getColorPorcentaje = (porcentaje) => {
    if (porcentaje >= 90) return "text-green-600 dark:text-green-400";
    if (porcentaje >= 75) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const calcularPorcentajeMetodo = (monto) => {
    return ((monto / estadisticas.totalRecaudado) * 100).toFixed(1);
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(monto);
  };

  const formatearPorcentaje = (valor) => {
    return `${valor.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Estadísticas de Pagos
        </h1>
        <Button variant="flat" color="default" onClick={() => navigate(-1)}>
          <FlechaReturnIcon className="w-6 h-6" />
          <span className="ml-2">Volver</span>
        </Button>
      </div>

      {/* Selector de periodo */}
      <Card className="bg-white dark:bg-zinc-900">
        <CardBody>
          <div className="flex gap-4 items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Periodo:
            </span>
            <Select
              selectedKeys={[periodo]}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-48"
              size="sm"
              aria-label="Seleccionar periodo"
            >
              <SelectItem key="mes" value="mes">
                Este mes
              </SelectItem>
              <SelectItem key="trimestre" value="trimestre">
                Este trimestre
              </SelectItem>
              <SelectItem key="año" value="año">
                Este año
              </SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Métricas principales (Gradientes usualmente se ven bien en dark, no requieren cambios mayores) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none">
          <CardBody className="text-center">
            <p className="text-3xl font-bold">
              {formatearMoneda(estadisticas.totalRecaudado || 0)}
            </p>
            <p className="text-sm opacity-90">Total Recaudado</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-none">
          <CardBody className="text-center">
            <p className="text-3xl font-bold">
              {formatearMoneda(estadisticas.totalFacturado || 0)}
            </p>
            <p className="text-sm opacity-90">Total Facturado</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-none">
          <CardBody className="text-center">
            <p className={`text-3xl font-bold`}>
              {formatearPorcentaje(estadisticas.porcentajeCobranza || 0)}
            </p>
            <p className="text-sm opacity-90">% de Cobranza</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-none">
          <CardBody className="text-center">
            <p className="text-3xl font-bold">
              {formatearMoneda(estadisticas.pagosPendientes || 0)}
            </p>
            <p className="text-sm opacity-90">Pagos Pendientes</p>
          </CardBody>
        </Card>
      </div>

      {/* Métricas de facturas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800">
          <CardBody className="text-center">
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">
              {estadisticas.facturasPagadas || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Facturas Pagadas
            </p>
          </CardBody>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800">
          <CardBody className="text-center">
            <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
              {estadisticas.facturasPendientes || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Facturas Pendientes
            </p>
          </CardBody>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800">
          <CardBody className="text-center">
            <p className="text-4xl font-bold text-red-600 dark:text-red-400">
              {estadisticas.facturasVencidas || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Facturas Vencidas
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Métodos de pago */}
        <Card className="bg-white dark:bg-zinc-900">
          <CardBody>
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              Distribución por Método de Pago
            </h3>
            <div className="space-y-3">
              {estadisticas.metodosPago &&
                Object.entries(estadisticas.metodosPago).map(
                  ([metodo, monto]) => (
                    <div
                      key={metodo}
                      // MODIFICADO: Fondo oscuro para la lista
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-transparent dark:border-zinc-700"
                    >
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {metodo}
                      </span>
                      <div className="text-right">
                        <div className="font-bold text-green-600 dark:text-green-400">
                          {formatearMoneda(monto)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {calcularPorcentajeMetodo(monto)}%
                        </div>
                      </div>
                    </div>
                  )
                )}
            </div>
          </CardBody>
        </Card>

        {/* Información general */}
        <Card className="bg-white dark:bg-zinc-900">
          <CardBody>
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              Información General
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  Promedio de Consumo
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {estadisticas.promedioConsumo || 0} m³
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  Clientes con Pagos
                </span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {estadisticas.clientesConPagos || 0}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  Eficiencia de Cobranza
                </span>
                <span
                  className={`font-bold ${getColorPorcentaje(
                    estadisticas.porcentajeCobranza || 0
                  )}`}
                >
                  {formatearPorcentaje(estadisticas.porcentajeCobranza || 0)}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  Recaudo Promedio/Cliente
                </span>
                <span className="font-bold text-yellow-600 dark:text-yellow-400">
                  {formatearMoneda(
                    estadisticas.clientesConPagos
                      ? estadisticas.totalRecaudado /
                          estadisticas.clientesConPagos
                      : 0
                  )}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Evolución mensual (solo para periodo mes) */}
      {periodo === "mes" && estadisticas.evolutionMensual && (
        <Card className="bg-white dark:bg-zinc-900">
          <CardBody>
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              Evolución de los Últimos 4 Meses
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {estadisticas.evolutionMensual.map((mes, index) => (
                <div
                  key={index}
                  className="text-center p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-transparent dark:border-zinc-700"
                >
                  <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-100">
                    {mes.mes}
                  </h4>
                  <div className="space-y-1">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Recaudado:
                      </span>
                      <p className="font-bold text-green-600 dark:text-green-400">
                        {formatearMoneda(mes.recaudado)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Facturado:
                      </span>
                      <p className="font-bold text-blue-600 dark:text-blue-400">
                        {formatearMoneda(mes.facturado)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Eficiencia:
                      </span>
                      <p
                        className={`font-bold ${getColorPorcentaje(
                          (mes.recaudado / mes.facturado) * 100
                        )}`}
                      >
                        {formatearPorcentaje(
                          (mes.recaudado / mes.facturado) * 100
                        )}
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
