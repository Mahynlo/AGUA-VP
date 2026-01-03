import React from "react";
import { Button, Card, CardBody } from "@nextui-org/react";
import { HiPrinter, HiCog, HiUsers } from "react-icons/hi";
import { Link } from "react-router-dom";
import useImpresionRecibos from "../../../hooks/useImpresionRecibos";
import ClientesList from "./components/ClientesList";
import AccionesImpresion from "./components/AccionesImpresion";
import ModalVistaPrevia from "./components/ModalVistaPrevia";

import { useState } from "react";

/**
 * TabImpresion - Componente orquestador para impresión de recibos
 * 
 * Este componente maneja la UI principal para:
 * - Selección de período de facturación
 * - Selección de clientes
 * - Generación de vista previa e impresión de recibos
 * 
 * La lógica de negocio está delegada al hook useImpresionRecibos
 */
const TabImpresion = () => {
  // Hook personalizado con toda la lógica
  const {
    periodoSeleccionado,
    clientesSeleccionados,
    loading,
    clientesConFacturasYLecturas,
    facturasParaImprimir,
    estadisticas,
    handleCambioPeriodo,
    handleToggleCliente,
    handleToggleTodos,
    handleImprimirRecibos,
    handleVistaPreviaRecibos,
    handlePruebaConDatosMock,
    handleTestUrls,
    procesandoAccion, // Nuevo: string o null
    pdfUrl,          // Estado del PDF
    setPdfUrl        // Setter para cerrar
  } = useImpresionRecibos();

  return (
    <div className="space-y-6 p-2">


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUMNA IZQUIERDA: Selección de Datos */}
        <div className="lg:col-span-2 space-y-6">

          {/* Lista Unificada con Filtros */}
          <ClientesList
            clientes={clientesConFacturasYLecturas}
            clientesSeleccionados={clientesSeleccionados}
            onToggleCliente={handleToggleCliente}
            onToggleTodos={handleToggleTodos}
            periodoSeleccionado={periodoSeleccionado}
            onCambioPeriodo={handleCambioPeriodo}
            loading={loading}
          />

          {/* Herramientas de desarrollo (Colapsables/Pequeñas) */}
          <details className="cursor-pointer group">
            <summary className="text-sm text-gray-500 font-medium flex items-center gap-2 select-none">
              <HiCog className="w-4 h-4" /> Herramientas Avanzadas
            </summary>
            <Card className="mt-2">
              <CardBody className="p-4 bg-gray-50 dark:bg-gray-800">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button onPress={handleTestUrls} size="sm" variant="flat">Test URLs</Button>
                  <Button onPress={handlePruebaConDatosMock} size="sm" variant="flat" color="warning">Datos Mock</Button>
                  <Button as={Link} to="/recibo" size="sm" variant="flat">Ver Plantilla</Button>
                  <Button as={Link} to="/reporteLecturas" size="sm" variant="flat">Reporte</Button>
                </div>
              </CardBody>
            </Card>
          </details>
        </div>

        {/* COLUMNA DERECHA: Centro de Acción (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            {facturasParaImprimir.length > 0 ? (
              <AccionesImpresion
                estadisticas={estadisticas}
                onVistaPrevia={handleVistaPreviaRecibos} // Revertido a la función original
                onImprimir={handleImprimirRecibos}
                procesandoAccion={procesandoAccion}
              />
            ) : (
              <Card className="border-dashed border-2 border-gray-300 dark:border-gray-700 bg-transparent">
                <CardBody className="text-center py-8 text-gray-400">
                  <HiPrinter className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Selecciona clientes para habilitar la impresión</p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>

      </div>


      {/* MODAL DE VISTA PREVIA PDF */}
      {
        pdfUrl && (
          <ModalVistaPrevia
            pdfUrl={pdfUrl}
            onClose={() => setPdfUrl(null)}
          />
        )
      }

    </div >
  );
};

export default TabImpresion;
