// RutaCard.jsx
import { useState, useEffect } from "react";
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
  Button,
  Spinner
} from "@nextui-org/react";
import { HiDotsVertical, HiEye, HiPencil, HiMap, HiCalendar, HiCheckCircle, HiExclamation, HiCurrencyDollar } from "react-icons/hi";
import CarruselLecturasModal from "./CarruselLecturasModal";
import ModalEditarRuta from "./ModalEditarRuta";
import ModalDetalleRuta from "./ModalDetalleRuta";
import { useRutas } from "../../../context/RutasContext";
import { useFeedback } from "../../../context/FeedbackContext";
import { useAuth } from "../../../context/AuthContext";

export default function RutaCard({ ruta }) {
  const { obtenerInfoRuta } = useRutas();
  const { setError, setSuccess } = useFeedback();
  const { user } = useAuth();
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [missingMetersCount, setMissingMetersCount] = useState(0);
  const [isGenerando, setIsGenerando] = useState(false);
  const [facturasGeneradas, setFacturasGeneradas] = useState(false);

  const porcentajeCompletado = ruta.total_puntos > 0
    ? (ruta.completadas / ruta.total_puntos) * 100
    : 0;

  const handleGenerarFacturas = async () => {
    if (isGenerando) return;
    setIsGenerando(true);
    try {
      const token = localStorage.getItem('token');
      const hoy = new Date().toISOString().split('T')[0];
      const result = await window.api.generarFacturasRuta(
        { ruta_id: ruta.id, periodo: ruta.periodo_mostrado, fecha_emision: hoy },
        token
      );
      if (result.success) {
        const n = result.data?.facturas_generadas ?? 0;
        if (n === 0) {
          setSuccess('Todas las lecturas de esta ruta ya estaban facturadas.', 'Facturación');
        } else {
          setSuccess(`${n} factura${n !== 1 ? 's' : ''} generada${n !== 1 ? 's' : ''} correctamente.`, 'Facturación');
          setFacturasGeneradas(true);
        }
      } else {
        setError(result.message || 'Error al generar facturas', 'Facturación');
      }
    } catch (err) {
      setError('Error inesperado al generar facturas', 'Facturación');
    } finally {
      setIsGenerando(false);
    }
  };

  // Check for integrity (unassigned meters) on mount
  useEffect(() => {
    let isMounted = true;
    const checkIntegrity = async () => {
      if (!ruta.id) return;
      try {
        // We fetch the detailed info which excludes unassigned meters
        // Optimistic check: only if we have total > 0
        if (ruta.total_puntos > 0) {
          const detailedRuta = await obtenerInfoRuta(ruta.id);
          if (isMounted && detailedRuta && detailedRuta.puntos) {
            const sinCliente = detailedRuta.puntos.filter(p => !p.cliente_id).length;
            if (sinCliente > 0) {
              setMissingMetersCount(sinCliente);
            }
          }
        }
      } catch (error) {
        console.error("Error checking route integrity:", error);
      }
    };

    checkIntegrity();
    return () => { isMounted = false; };
  }, [ruta.id, ruta.total_puntos, obtenerInfoRuta]);


  const getStatusColor = () => {
    if (porcentajeCompletado === 100) return "success";
    if (porcentajeCompletado >= 50) return "warning";
    return "danger";
  };
  // console.log("ruta data card:",ruta);

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
              onClick={() => setModalDetalleOpen(true)}
            >
              Ver Detalles
            </DropdownItem>
            <DropdownItem
              key="edit"
              startContent={<HiPencil className="w-4 h-4" />}
              onClick={() => setModalEditarOpen(true)}
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
        <div className="absolute bottom-2 left-2 flex gap-2">
          <Chip
            size="sm"
            color={getStatusColor()}
            variant="solid"
            startContent={porcentajeCompletado === 100 ? <HiCheckCircle className="w-3 h-3" /> : null}
          >
            {porcentajeCompletado === 100 ? "Completada" : "En progreso"}
          </Chip>
          {missingMetersCount > 0 && (
            <Chip
              size="sm"
              color="danger"
              variant="flat"
              className="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200"
              startContent={<HiExclamation className="w-4 h-4" />}
            >
              {missingMetersCount} sin asignar
            </Chip>
          )}
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

            // Visual warning in progress bar if needed (optional)
            />
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400 text-right">
                {porcentajeCompletado.toFixed(1)}% completado
              </span>
              {missingMetersCount > 0 && (
                <span className="text-red-500 font-bold">
                  ⚠ Revise inventario
                </span>
              )}
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
      <CardFooter className="px-4 pt-0 pb-4 flex flex-col gap-2">
        <CarruselLecturasModal rutaId={ruta.id} periodoMostrado={ruta.periodo_mostrado} />

        {/* Botón Generar Facturas: activo solo cuando la ruta está completa */}
        <Button
          color={porcentajeCompletado === 100 ? (facturasGeneradas ? "default" : "success") : "default"}
          variant={porcentajeCompletado === 100 && !facturasGeneradas ? "solid" : "flat"}
          isDisabled={porcentajeCompletado < 100 || isGenerando || facturasGeneradas}
          isLoading={isGenerando}
          className="w-full font-semibold"
          startContent={!isGenerando && (facturasGeneradas ? <HiCheckCircle className="text-lg" /> : <HiCurrencyDollar className="text-lg" />)}
          onPress={handleGenerarFacturas}
        >
          {facturasGeneradas
            ? 'Facturas generadas ✓'
            : porcentajeCompletado < 100
              ? `Generar Facturas (${ruta.total_puntos - ruta.completadas} pendientes)`
              : 'Generar Facturas de Ruta'
          }
        </Button>
      </CardFooter>

      {/* Modal de edición */}
      <ModalEditarRuta
        isOpen={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        ruta={ruta}
      />

      {/* Modal de Detalles (Nuevo) */}
      <ModalDetalleRuta
        isOpen={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        ruta={ruta}
      />
    </Card>
  );
}

