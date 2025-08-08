// RutaCard.jsx
import { useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Chip,
  Progress,
  Button
} from "@nextui-org/react";
import { HiDotsVertical, HiEye, HiPencil, HiMap, HiCalendar, HiCheckCircle } from "react-icons/hi";
import CarruselLecturasModal from "./CarruselLecturasModal";

export default function RutaCard({ ruta }) {
  const porcentajeCompletado = ruta.total_puntos > 0 
    ? (ruta.completadas / ruta.total_puntos) * 100 
    : 0;


  const getStatusColor = () => {
    if (porcentajeCompletado === 100) return "success";
    if (porcentajeCompletado >= 50) return "warning";
    return "danger";
  };
  console.log("ruta data card:",ruta);

  return (
    <Card className="relative h-full hover:shadow-lg transition-shadow duration-200">
      {/* Dropdown de opciones */}
      
      <div className="absolute top-3 right-3 z-20">
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Button
              isIconOnly
              variant="flat"
              color="default"
              size="sm"
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            >
              <HiDotsVertical className="w-4 h-4" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Opciones de ruta">
            <DropdownItem
              key="view"
              startContent={<HiEye className="w-4 h-4" />}
              onClick={() => alert(`Ver detalles de ${ruta.nombre}`)}
            >
              Ver Detalles
            </DropdownItem>
            <DropdownItem
              key="edit"
              startContent={<HiPencil className="w-4 h-4" />}
              onClick={() => alert(`Editar ruta ${ruta.nombre}`)}
            >
              Editar Ruta
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Imagen de encabezado */}
      <CardHeader className="p-0 relative">
        <div className="w-full h-40 overflow-hidden">
          <img
            src={ruta.imagen}
            alt={ruta.nombre}
            className="object-cover w-full h-full"
          />
        </div>
        
        {/* Estado superpuesto */}
        <div className="absolute bottom-2 left-2">
          <Chip
            size="sm"
            color={getStatusColor()}
            variant="solid"
            startContent={porcentajeCompletado === 100 ? <HiCheckCircle className="w-3 h-3" /> : null}
          >
            {porcentajeCompletado === 100 ? "Completada" : "En progreso"}
          </Chip>
        </div>
      </CardHeader>

      {/* Contenido principal */}
      <CardBody className="px-4 py-3 flex-1">
        <div className="space-y-3">
          {/* Título y estadísticas */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {ruta.nombre}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {ruta.descripcion}
            </p>
          </div>

          {/* Progreso */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progreso
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {ruta.completadas}/{ruta.total_puntos}
              </span>
            </div>
            <Progress
              value={porcentajeCompletado}
              color={getStatusColor()}
              size="sm"
              className="w-full"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
              {porcentajeCompletado.toFixed(1)}% completado
            </div>
          </div>

          {/* Información adicional */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <HiCalendar className="w-3 h-3" />
              <span>{ruta.periodo_mostrado}</span>
            </div>
            <div className="flex items-center gap-1">
              <HiMap className="w-3 h-3" />
              <span>Ruta #{ruta.id}</span>
            </div>
          </div>
        </div>
      </CardBody>

      {/* Footer con acciones */}
      <CardFooter className="px-4 pt-0 pb-4">
        <CarruselLecturasModal rutaId={ruta.id} periodoMostrado={ruta.periodo_mostrado} />
      </CardFooter>
    </Card>
  );
}
