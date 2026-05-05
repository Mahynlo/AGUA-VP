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
} from "@nextui-org/react";
import { HiCalendar, HiCurrencyDollar, HiExclamation } from "react-icons/hi";
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

  // Regla de los tintes: 10% fondo, 100% texto
  const getStatusStyles = () => {
    if (!esVigente) return "bg-red-500/10 text-red-600 dark:text-red-400";
    if (vencePronto) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  };

  const getStatusText = () => {
    if (!esVigente) return "Vencida";
    if (vencePronto) return "Por vencer";
    return "Vigente";
  };

  return (
    /* Token 5: Tarjeta KPI Base */
    <Card className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 h-full shadow-none flex flex-col">
      <CardHeader className="px-6 pt-6 pb-4">
        <div className="flex justify-between items-start w-full gap-4">
          <div className="flex-1 min-w-0">
            {/* Token 3: Textos principales */}
            <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100 truncate">
              Tarifa {tarifa.nombre}
            </h3>
            
            <div className="flex items-center gap-2 mt-2">
              <Chip
                size="sm"
                classNames={{
                  base: `border-none ${getStatusStyles()}`,
                  content: "font-bold tracking-wide text-[10px] uppercase",
                }}
                startContent={<HiCalendar className="w-3.5 h-3.5 ml-1" />}
              >
                {getStatusText()}
              </Chip>
              {vencePronto && (
                <Chip 
                  size="sm" 
                  classNames={{
                    base: "border-none bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    content: "font-bold"
                  }}
                >
                  <HiExclamation className="w-3.5 h-3.5" />
                </Chip>
              )}
            </div>
          </div>
          
          <div className="flex shrink-0">
            {!tieneRangos ? (
              <RegistrarRangoTarifa tarifaId={tarifa.id} />
            ) : (
              <EditarTarifaYRangos tarifa={tarifa} rangosIniciales={tarifa.rangos} />
            )}
          </div>
        </div>
      </CardHeader>

      <Divider className="bg-slate-200 dark:bg-zinc-800/80" />

      <CardBody className="px-6 py-5 flex-1">
        <div className="space-y-6">
          
          {/* Header Interno: Periodo y Descripción */}
          <div className="space-y-2">
            {/* Token 3: Overlines (Etiqueta técnica) */}
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              <HiCalendar className="w-3.5 h-3.5" />
              <span>
                {formatoFirstDay(tarifa.fecha_inicio)} - {formatoFirstDay(tarifa.fecha_fin) || "INDEFINIDA"}
              </span>
            </div>
            
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
              {tarifa.descripcion || "Sin descripción disponible."}
            </p>
          </div>

          {/* Rangos de tarifas */}
          {tieneRangos ? (
            <div>
              <div className="flex items-center gap-1.5 mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                <HiCurrencyDollar className="w-3.5 h-3.5" />
                <span>Estructura de Precios</span>
              </div>
              
              {/* Token 6: Tablas de datos */}
              <Table 
                aria-label="Tabla de rangos de tarifa" 
                removeWrapper
                classNames={{
                  table: "min-h-[100px]",
                  th: "bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-2 px-2",
                  td: "text-sm font-medium text-slate-600 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/50 py-3 px-2",
                  tr: "hover:bg-slate-100/50 dark:hover:bg-zinc-800/50 transition-colors"
                }}
              >
                <TableHeader>
                  <TableColumn>CONSUMO (m³)</TableColumn>
                  <TableColumn align="end">TARIFA ($/m³)</TableColumn>
                </TableHeader>
                <TableBody>
                  {tarifa.rangos.map((rango, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <span>
                          {rango.consumo_min}
                          {rango.consumo_max != null ? ` - ${rango.consumo_max}` : "+"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {/* Ratio de datos: Sin chips, tipografía gruesa */}
                        <span className="font-black tracking-tight text-slate-800 dark:text-zinc-100">
                          ${parseFloat(rango.precio_por_m3).toFixed(2)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* Regla de tintes y Ratio de Datos para Empty State */
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-slate-500/10 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-3">
                <HiCurrencyDollar className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-4">
                Sin rangos definidos
              </p>
              <RegistrarRangoTarifa tarifaId={tarifa.id} />
            </div>
          )}
        </div>
      </CardBody>

      {tieneRangos && (
        <CardFooter className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800/50">
          <div className="w-full text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 text-center">
            {tarifa.rangos.length} rango{tarifa.rangos.length !== 1 ? 's' : ''} configurado{tarifa.rangos.length !== 1 ? 's' : ''}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

