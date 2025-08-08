import { 
  Card, 
  CardBody, 
  CardHeader, 
  CardFooter, 
  Chip, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Divider,
  Button
} from "@nextui-org/react";
import { HiCalendar, HiCurrencyDollar, HiPlus, HiPencil, HiExclamation } from "react-icons/hi";
import RegistrarRangoTarifa from "./RegistrarRango";
import EditarTarifaYRangos from "./EditarTarifaY_Rangos";
import { formatoFirstDay } from "../../../utils/formatFecha";

export default function TarifaCard({ tarifa }) {
  const tieneRangos = (tarifa.rangos?.length ?? 0) > 0;
  
  // Verificar si la tarifa está vigente
  const hoy = new Date();
  const fechaFin = new Date(tarifa.fecha_fin);
  const fechaInicio = new Date(tarifa.fecha_inicio);
  const esVigente = hoy >= fechaInicio && hoy <= fechaFin;
  
  // Verificar si vence pronto (30 días)
  const treintaDias = new Date();
  treintaDias.setDate(treintaDias.getDate() + 30);
  const vencePronto = fechaFin <= treintaDias && fechaFin >= hoy;

  const getStatusColor = () => {
    if (!esVigente) return "danger";
    if (vencePronto) return "warning";
    return "success";
  };

  const getStatusText = () => {
    if (!esVigente) return "Vencida";
    if (vencePronto) return "Por vencer";
    return "Vigente";
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-200 border border-gray-400 dark:border-gray-700">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start w-full">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tarifa {tarifa.nombre}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Chip
                size="sm"
                color={getStatusColor()}
                variant="flat"
                startContent={<HiCalendar className="w-3 h-3" />}
              >
                {getStatusText()}
              </Chip>
              {vencePronto && (
                <Chip size="sm" color="warning" variant="solid">
                  <HiExclamation className="w-3 h-3" />
                </Chip>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {!tieneRangos ? (
              <RegistrarRangoTarifa tarifaId={tarifa.id} />
            ) : (
              <EditarTarifaYRangos tarifa={tarifa} rangosIniciales={tarifa.rangos} />
            )}
          </div>
        </div>
      </CardHeader>

      <Divider />

      <CardBody className="pt-4">
        <div className="space-y-3">
          {/* Descripción */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {tarifa.descripcion || "Sin descripción disponible."}
            </p>
          </div>

          {/* Periodo de vigencia */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <HiCalendar className="w-4 h-4" />
            <span>
              <strong>{formatoFirstDay(tarifa.fecha_inicio)}</strong> - {" "}
              <strong>{formatoFirstDay(tarifa.fecha_fin) || "Indefinida"}</strong>
            </span>
          </div>

          {/* Rangos de tarifas */}
          {tieneRangos ? (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <HiCurrencyDollar className="w-4 h-4" />
                Estructura de Precios
              </h4>
              <Table 
                aria-label="Tabla de rangos de tarifa" 
                removeWrapper
                classNames={{
                  table: "min-h-[100px]",
                  th: "bg-gray-50 dark:bg-gray-800 text-xs font-medium",
                  td: "text-xs"
                }}
              >
                <TableHeader>
                  <TableColumn>CONSUMO (m³)</TableColumn>
                  <TableColumn>TARIFA ($/m³)</TableColumn>
                </TableHeader>
                <TableBody>
                  {tarifa.rangos.map((rango, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <span className="font-medium">
                          {rango.consumo_min}
                          {rango.consumo_max != null ? ` - ${rango.consumo_max}` : "+"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" color="primary" variant="flat">
                          ${parseFloat(rango.precio_por_m3).toFixed(2)}
                        </Chip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6">
              <HiCurrencyDollar className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Sin rangos definidos
              </p>
              <RegistrarRangoTarifa tarifaId={tarifa.id} />
            </div>
          )}
        </div>
      </CardBody>

      {tieneRangos && (
        <CardFooter className="pt-0">
          <div className="w-full text-xs text-gray-500 dark:text-gray-400 text-center">
            {tarifa.rangos.length} rango{tarifa.rangos.length !== 1 ? 's' : ''} configurado{tarifa.rangos.length !== 1 ? 's' : ''}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
