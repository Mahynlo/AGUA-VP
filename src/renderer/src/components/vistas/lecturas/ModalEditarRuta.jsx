import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Chip,
  Spinner
} from "@nextui-org/react";
import { HiPencil, HiMap, HiLocationMarker, HiTrash } from "react-icons/hi";

import MapaRutas from "../../mapa/MapaRutas";
import { useMedidores } from "../../../context/MedidoresContext";
import { useRutaForm } from "../../../hooks/useRutaForm";

export default function ModalEditarRuta({ isOpen, onClose, ruta }) {
  const { medidores } = useMedidores();

  // Hook personalizado para manejar toda la lógica del formulario en modo edición
  const {
    nombre,
    setNombre,
    descripcion,
    setDescripcion,
    puntosRuta,
    rutaCalculada,
    dibujar,
    erroresCampos,
    mostrarErrores,
    isLoading,
    isSaving,
    handleAgregarPunto,
    eliminarPuntoRuta,
    limpiarError,
    handleDibujarRuta,
    reiniciarRuta,
    guardarRuta
  } = useRutaForm({
    modoEdicion: true,
    rutaInicial: ruta,
    isOpen: isOpen,
    onSuccess: onClose
  });

  const handleCloseModal = () => {
    onClose();
  };

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
          
          <ModalBody className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner size="lg" label="Cargando información de la ruta..." />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Columna izquierda - Formulario */}
                <div className="space-y-4">
                  {/* Card de Información Básica */}
                  <Card className="border border-blue-200 dark:border-blue-800">
                    <CardBody className="space-y-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <HiMap className="w-5 h-5 text-blue-600" />
                        Información de la Ruta
                      </h3>

                      {/* Nombre de la ruta */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nombre de la Ruta*
                        </label>
                        <div className="relative w-full flex">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                            <HiMap className="inline-block mr-1 h-5 w-5 text-blue-600" />
                          </span>
                          <input
                            type="text"
                            placeholder="Ej: Ruta Centro 1"
                            value={nombre}
                            onChange={(e) => {
                              setNombre(e.target.value);
                              limpiarError('nombre');
                            }}
                            required
                            className={`border ${mostrarErrores && erroresCampos.nombre ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-600 focus:border-blue-500'} text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`}
                          />
                        </div>
                        {mostrarErrores && erroresCampos.nombre && (
                          <p className="text-sm text-red-500 mt-1">El nombre es requerido</p>
                        )}
                      </div>

                      {/* Descripción */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Descripción*
                        </label>
                        <textarea
                          placeholder="Describe la ruta, zona o características..."
                          value={descripcion}
                          onChange={(e) => {
                            setDescripcion(e.target.value);
                            limpiarError('descripcion');
                          }}
                          required
                          rows="3"
                          className={`border ${mostrarErrores && erroresCampos.descripcion ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-600 focus:border-blue-500'} text-gray-600 rounded-xl pl-4 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white resize-none`}
                        />
                        {mostrarErrores && erroresCampos.descripcion && (
                          <p className="text-sm text-red-500 mt-1">La descripción es requerida</p>
                        )}
                      </div>
                    </CardBody>
                  </Card>

                  {/* Card de Acciones */}
                  <Card className="border border-green-200 dark:border-green-800">
                    <CardBody className="space-y-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <HiLocationMarker className="w-5 h-5 text-green-600" />
                        Gestión de Medidores
                      </h3>
                      
                      <div className="flex gap-2">
                        <Button 
                          color="secondary" 
                          onClick={handleDibujarRuta}
                          className="flex-1"
                          startContent={<HiMap className="w-4 h-4" />}
                          isDisabled={puntosRuta.length < 2}
                        >
                          Recalcular Ruta
                        </Button>
                        <Button 
                          color="danger" 
                          onClick={reiniciarRuta}
                          variant="flat"
                        >
                          Reiniciar
                        </Button>
                      </div>

                      {mostrarErrores && (erroresCampos.puntos || erroresCampos.rutaCalculada) && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                            {erroresCampos.puntos && "⚠️ Selecciona al menos 2 puntos en el mapa"}
                            {erroresCampos.rutaCalculada && "⚠️ Debes recalcular la ruta antes de guardar"}
                          </p>
                        </div>
                      )}
                    </CardBody>
                  </Card>

                  {/* Card de Puntos Seleccionados */}
                  <Card className="border border-purple-200 dark:border-purple-800">
                    <CardBody>
                      <h3 className="font-semibold mb-2 text-gray-900 dark:text-white flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          📍 Medidores en la Ruta
                          <Chip size="sm" color="primary" variant="flat">
                            {puntosRuta.length}
                          </Chip>
                        </span>
                      </h3>
                      
                      <div className="max-h-[200px] overflow-auto">
                        {puntosRuta.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                            Haz clic en los medidores del mapa para agregarlos
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {puntosRuta.map((p, idx) => (
                              <li key={idx} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                                <span className="text-sm">
                                  <span className="font-semibold">Punto {idx + 1}:</span> ({p.lat.toFixed(4)}, {p.lng.toFixed(4)})
                                </span>
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="flat"
                                  onClick={() => eliminarPuntoRuta(idx)}
                                  isIconOnly
                                >
                                  <HiTrash className="w-4 h-4" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {/* Columna derecha - Mapa */}
                <div className="h-[300px] md:h-full min-h-[600px] rounded-2xl shadow-lg overflow-hidden">
                  <MapaRutas
                    medidores={medidores}
                    puntosRuta={puntosRuta}
                    rutaCalculada={rutaCalculada}
                    dibujar={dibujar}
                    onAgregarMedidor={handleAgregarPunto}
                    onEliminarMedidor={eliminarPuntoRuta}
                  />
                </div>
              </div>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={handleCloseModal}
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
