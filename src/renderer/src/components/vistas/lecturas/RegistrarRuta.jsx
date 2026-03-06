// src/components/rutas/ModalRegistrarRuta.jsx
import { useDisclosure } from "@nextui-org/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Tabs,
  Tab,
} from "@nextui-org/react";
import { HiPlus, HiMap } from "react-icons/hi";

import MapaRutas from "../../mapa/MapaRutas";
import { useMedidores } from "../../../context/MedidoresContext";
import { useRutaForm } from "../../../hooks/useRutaForm";
import PanelGestionRuta from "./PanelGestionRuta";

export default function ModalRegistrarRuta() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
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
    isSaving,
    limpiarError,
    handleDibujarRuta,
    reiniciarRuta,
    resetearFormulario,
    guardarRuta,
  } = useRutaForm({ modoEdicion: false, onSuccess: onClose });

  const handleCloseModal = () => {
    resetearFormulario();
    onClose();
  };

  return (
    <>
      <Button
        color="primary"
        onPress={onOpen}
        startContent={<HiPlus className="w-4 h-4" />}
        variant="solid"
        className="font-medium"
      >
        Nueva Ruta
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
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
              <HiMap className="w-6 h-6 text-blue-600" />
              Crear Nueva Ruta de Lectura
            </ModalHeader>

            <ModalBody className="p-4">
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
                        puntosRutaInicial={[]}
                        modoEdicion={false}
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
            </ModalBody>

            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleCloseModal}>
                Cancelar
              </Button>
              <Button
                color="primary"
                onClick={guardarRuta}
                isDisabled={isSaving}
                isLoading={isSaving}
              >
                {isSaving ? "Registrando..." : "Guardar Ruta"}
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </>
  );
}
