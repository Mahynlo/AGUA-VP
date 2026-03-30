import { useState, useEffect } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Card,
  CardBody,
  CardFooter,
  Chip,
  Progress,
  Button,
} from "@nextui-org/react";
import { 
  HiDotsVertical, 
  HiEye, 
  HiPencil, 
  HiMap, 
  HiCalendar, 
  HiCheckCircle, 
  HiExclamation, 
  HiCurrencyDollar 
} from "react-icons/hi";

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

  // Verificar integridad (medidores sin asignar) al montar
  useEffect(() => {
    let isMounted = true;
    const checkIntegrity = async () => {
      if (!ruta.id) return;
      try {
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

  return (
    <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-zinc-950 rounded-[2rem] overflow-hidden flex flex-col h-full ring-1 ring-slate-200 dark:ring-zinc-800/80 group">
      
      {/* ── 1. HEADER (IMAGEN + DROPDOWN + CHIPS) ── */}
      <div className="relative h-48 w-full shrink-0 overflow-hidden bg-slate-100 dark:bg-zinc-900">
        <img
          src={ruta.imagen}
          alt={ruta.nombre}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {/* Gradiente Oscuro para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent z-10" />

        {/* Dropdown de Opciones (Top Right) */}
        <div className="absolute top-4 right-4 z-20">
          <Dropdown placement="bottom-end" classNames={{ content: "min-w-[180px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl" }}>
            <DropdownTrigger>
              <Button
                isIconOnly
                variant="flat"
                size="sm"
                className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-slate-700 dark:text-zinc-200 shadow-sm hover:scale-105 transition-transform"
              >
                <HiDotsVertical className="w-4 h-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Opciones de ruta" itemClasses={{ base: "rounded-xl" }}>
              <DropdownItem
                key="view"
                startContent={<HiEye className="w-4 h-4 text-blue-500" />}
                onClick={() => setModalDetalleOpen(true)}
                className="font-medium text-slate-700 dark:text-zinc-300"
              >
                Ver Detalles
              </DropdownItem>
              <DropdownItem
                key="edit"
                startContent={<HiPencil className="w-4 h-4 text-emerald-500" />}
                onClick={() => setModalEditarOpen(true)}
                className="font-medium text-slate-700 dark:text-zinc-300"
              >
                Editar Ruta
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Chips de Estado (Bottom Left) */}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 z-20">
          <Chip
            size="sm"
            variant="solid"
            className={`border border-white/10 font-bold tracking-wide text-[10px] uppercase shadow-md ${
              porcentajeCompletado === 100 
                ? "bg-emerald-500/95 text-white backdrop-blur-md" 
                : "bg-blue-500/95 text-white backdrop-blur-md"
            }`}
            startContent={porcentajeCompletado === 100 && <HiCheckCircle className="w-3.5 h-3.5 ml-1" />}
          >
            {porcentajeCompletado === 100 ? "Completada" : "En progreso"}
          </Chip>

          {missingMetersCount > 0 && (
            <Chip
              size="sm"
              variant="flat"
              className="bg-red-500/90 text-white backdrop-blur-md border border-red-400/50 font-bold tracking-wide text-[10px] uppercase shadow-md"
              startContent={<HiExclamation className="w-4 h-4 ml-1" />}
            >
              {missingMetersCount} Sin Asignar
            </Chip>
          )}
        </div>
      </div>

      {/* ── 2. CUERPO DE LA TARJETA ── */}
      <CardBody className="px-5 sm:px-6 py-5 flex-1 flex flex-col gap-4">
        
        {/* Título y Descripción */}
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-tight mb-1 line-clamp-1">
            {ruta.nombre}
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {ruta.descripcion}
          </p>
        </div>

        {/* Barra de Progreso */}
        <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800 mt-auto">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
              Progreso de Lectura
            </span>
            <span className="text-xs font-black text-slate-700 dark:text-zinc-300">
              {ruta.completadas} <span className="text-slate-400 dark:text-zinc-500 font-medium">/ {ruta.total_puntos}</span>
            </span>
          </div>
          
          <Progress
            value={porcentajeCompletado}
            size="sm"
            classNames={{
              base: "w-full",
              track: "bg-slate-200 dark:bg-zinc-700 drop-shadow-sm",
              indicator: porcentajeCompletado === 100 ? "bg-emerald-500" : "bg-blue-500"
            }}
          />
          
          <div className="flex justify-between items-center mt-2">
            <span className={`text-[10px] font-bold ${porcentajeCompletado === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {porcentajeCompletado.toFixed(1)}% COMPLETADO
            </span>
            {missingMetersCount > 0 && (
              <span className="text-[10px] font-bold text-red-500 flex items-center gap-1 animate-pulse">
                <HiExclamation className="w-3 h-3" /> REVISAR INVENTARIO
              </span>
            )}
          </div>
        </div>

        {/* Info Extra (Metadatos) */}
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest px-1">
          <div className="flex items-center gap-1.5">
            <HiCalendar className="w-3.5 h-3.5" />
            <span>{ruta.periodo_mostrado}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HiMap className="w-3.5 h-3.5" />
            <span>Ruta #{ruta.id}</span>
          </div>
        </div>
      </CardBody>

      {/* ── 3. FOOTER Y BOTONES DE ACCIÓN ── */}
      <CardFooter className="px-5 sm:px-6 pb-6 pt-0 flex flex-col gap-3">
        
        {/* Componente Carrusel (Asume que renderiza su propio botón que se adaptará al width) */}
        <div className="w-full">
            <CarruselLecturasModal rutaId={ruta.id} periodoMostrado={ruta.periodo_mostrado} />
        </div>

        {/* Botón Principal: Generar Facturas */}
        <Button
          isDisabled={porcentajeCompletado < 100 || isGenerando || facturasGeneradas}
          isLoading={isGenerando}
          className={`w-full h-11 font-bold shadow-md transition-all duration-300 ${
              porcentajeCompletado === 100 && !facturasGeneradas
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30" // Listo para generar
                : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 shadow-none border border-slate-200 dark:border-zinc-700" // Pendiente o ya generado
          }`}
          startContent={!isGenerando && (facturasGeneradas ? <HiCheckCircle className="text-lg" /> : <HiCurrencyDollar className="text-lg" />)}
          onPress={handleGenerarFacturas}
        >
          {facturasGeneradas
            ? 'Facturas Generadas'
            : porcentajeCompletado < 100
              ? `Faltan ${ruta.total_puntos - ruta.completadas} Lecturas`
              : 'Generar Facturas de Ruta'
          }
        </Button>
      </CardFooter>

      {/* Modales */}
      <ModalEditarRuta
        isOpen={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        ruta={ruta}
      />
      <ModalDetalleRuta
        isOpen={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        ruta={ruta}
      />
    </Card>
  );
}

