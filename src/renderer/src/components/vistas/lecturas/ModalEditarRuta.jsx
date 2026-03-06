import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  Tabs,
  Tab,
} from "@nextui-org/react";
import { HiPencil } from "react-icons/hi";

import MapaRutas from "../../mapa/MapaRutas";
import { useMedidores } from "../../../context/MedidoresContext";
import { useRutaForm } from "../../../hooks/useRutaForm";
import PanelGestionRuta from "./PanelGestionRuta";

export default function ModalEditarRuta({ isOpen, onClose, ruta }) {
  const { allMedidores } = useMedidores();

  const {
    nombre,
    setNombre,
    descripcion,
    setDescripcion,
    puntosRuta,
    setPuntosRuta,
    rutaCalculada,
    dibujar,
    erroresCampos,
    mostrarErrores,
    isLoading,
    isSaving,
    limpiarError,
    handleDibujarRuta,
    reiniciarRuta,
    guardarRuta,
  } = useRutaForm({
    modoEdicion: true,
    rutaInicial: ruta,
    isOpen: isOpen,
    onSuccess: onClose,
  });

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      size="5xl"
      backdrop="blur"
      scrollBehavior="inside"
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      placement="center"
      classNames={{
        backdrop: "bg-gradient-to-t mt-18 from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
        closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
      }}
    >
      <ModalContent>
        <>
          <ModalHeader className="flex items-center gap-2 text-xl font-bold">
            <HiPencil className="w-6 h-6 text-blue-600" />
            Editar Ruta de Lectura
          </ModalHeader>

          <ModalBody className="p-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner size="lg" label="Cargando informacion de la ruta..." />
              </div>
            ) : (
              <Tabs
                variant="underlined"
                color="primary"
                fullWidth
                classNames={{
                  tabList: "border-b border-gray-200 dark:border-gray-700 bg-transparent px-0 mb-0",
                  panel: "p-0 pt-3",
                }}
              >
                {/* Tab 1: solo formulario */}
                <Tab key="info" title="Información de la Ruta">
                  <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">Nombre *</label>
                      <input
                        type="text"
                        placeholder="Ej: Ruta Centro 1"
                        value={nombre}
                        onChange={(e) => { setNombre(e.target.value); limpiarError("nombre"); }}
                        className={`border text-sm ${
                          mostrarErrores && erroresCampos.nombre
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                        } text-gray-700 dark:text-white rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 dark:bg-gray-700 placeholder-gray-400`}
                      />
                      {mostrarErrores && erroresCampos.nombre && (
                        <p className="text-xs text-red-500 mt-0.5">El nombre es requerido</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">Descripcion *</label>
                      <textarea
                        placeholder="Describe la ruta, zona o caracteristicas..."
                        value={descripcion}
                        onChange={(e) => { setDescripcion(e.target.value); limpiarError("descripcion"); }}
                        rows={4}
                        className={`border text-sm resize-none ${
                          mostrarErrores && erroresCampos.descripcion
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                        } text-gray-700 dark:text-white rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 dark:bg-gray-700 placeholder-gray-400`}
                      />
                      {mostrarErrores && erroresCampos.descripcion && (
                        <p className="text-xs text-red-500 mt-0.5">La descripcion es requerida</p>
                      )}
                    </div>
                  </div>
                </Tab>

                {/* Tab 2: lista + mapa */}
                <Tab key="lista" title="Ordenar Lista">
                  <div className="grid grid-cols-2 gap-4" style={{ minHeight: 580 }}>
                    {/* Panel gestión */}
                    <div className="overflow-hidden p-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800" style={{ height: 580 }}>
                      <PanelGestionRuta
                        key={ruta?.id}
                        puntosRutaInicial={puntosRuta}
                        modoEdicion={true}
                        onPuntosChange={setPuntosRuta}
                        erroresCampos={erroresCampos}
                        mostrarErrores={mostrarErrores}
                        handleDibujarRuta={handleDibujarRuta}
                        reiniciarRuta={reiniciarRuta}
                        rutaCalculada={rutaCalculada}
                        isSaving={isSaving}
                      />
                    </div>
                    {/* Mapa */}
                    <div className="rounded-2xl shadow-lg overflow-hidden" style={{ height: 580 }}>
                      <MapaRutas
                        medidores={allMedidores}
                        puntosRuta={puntosRuta}
                        rutaCalculada={rutaCalculada}
                        dibujar={dibujar}
                        readOnly={true}
                      />
                    </div>
                  </div>
                </Tab>
              </Tabs>
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={onClose}
              isDisabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onClick={guardarRuta}
              isDisabled={isSaving || isLoading}
              isLoading={isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}