import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Chip,
  Tabs,
  Tab,
  Divider,
  Spinner
} from "@nextui-org/react";
import { useState } from "react";
import { HiScale, HiBeaker, HiCollection, HiX } from "react-icons/hi";
import useEquivalenciaConsumo from "../../../hooks/useEquivalenciaConsumo";

const ModalEquivalenciaConsumo = ({ isOpen, onClose }) => {
  const { obtenerTodasLasFrases, probarEquivalencia, loading, error } = useEquivalenciaConsumo();
  const [consumoPrueba, setConsumoPrueba] = useState(25);
  const [frasePrueba, setFrasePrueba] = useState("");

  const frasesDisponibles = obtenerTodasLasFrases();

  const handlePrueba = () => {
    const frase = probarEquivalencia(consumoPrueba);
    setFrasePrueba(frase);
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onOpenChange={onClose} size="2xl">
        <ModalContent>
          <ModalBody className="flex justify-center items-center h-64">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="mt-4 text-gray-600">Cargando equivalencias...</p>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal isOpen={isOpen} onOpenChange={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2 text-danger">
              <HiScale className="w-6 h-6" />
              Error al cargar equivalencias
            </div>
          </ModalHeader>
          <ModalBody>
            <Card>
              <CardBody className="bg-danger-50 dark:bg-danger-900/30">
                <p className="text-danger-600 dark:text-danger-400">{error}</p>
              </CardBody>
            </Card>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onPress={onClose}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onClose}
      size="4xl"
      backdrop="blur"
      placement="center"
      scrollBehavior="inside"
      className={{
        backdrop: "bg-gradient-to-t mt-18 ml-24 from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <HiScale className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Equivalencias de Consumo de Agua</h3>
                  <p className="text-sm text-gray-500 font-normal">
                    Configure las frases automáticas que aparecen en los recibos
                  </p>
                </div>
              </div>
            </ModalHeader>
            
            <ModalBody>
              <Tabs aria-label="Opciones de equivalencias" color="primary" variant="underlined">
                {/* Tab de Prueba */}
                <Tab 
                  key="prueba" 
                  title={
                    <div className="flex items-center gap-2">
                      <HiBeaker />
                      <span>Probar Equivalencia</span>
                    </div>
                  }
                >
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <h4 className="text-lg font-semibold">Probar Equivalencia</h4>
                      </CardHeader>
                      <CardBody className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            type="number"
                            label="Consumo a probar (m³)"
                            placeholder="Ej: 25"
                            value={consumoPrueba.toString()}
                            onValueChange={(value) => setConsumoPrueba(Number(value))}
                            min={0}
                            max={1000}
                            startContent={
                              <div className="pointer-events-none flex items-center">
                                <span className="text-default-400 text-small">m³</span>
                              </div>
                            }
                          />
                          <Button 
                            color="primary" 
                            onPress={handlePrueba}
                            startContent={<HiBeaker />}
                            className="h-14"
                          >
                            Generar Equivalencia
                          </Button>
                        </div>
                        
                        {frasePrueba && (
                          <Card>
                            <CardBody className="bg-success-50 dark:bg-success-900/30">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-success-200 dark:bg-success-800 rounded-lg">
                                  <HiScale className="w-5 h-5 text-success-600 dark:text-success-400" />
                                </div>
                                <div>
                                  <p className="font-semibold text-success-800 dark:text-success-200 mb-1">
                                    Equivalencia generada:
                                  </p>
                                  <p className="text-success-700 dark:text-success-300 italic">
                                    "{frasePrueba}"
                                  </p>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        )}
                      </CardBody>
                    </Card>
                  </div>
                </Tab>

                {/* Tab de Frases Disponibles */}
                <Tab 
                  key="frases" 
                  title={
                    <div className="flex items-center gap-2">
                      <HiCollection />
                      <span>Frases Disponibles</span>
                      <Chip size="sm" variant="flat" color="primary">
                        {frasesDisponibles.length}
                      </Chip>
                    </div>
                  }
                >
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <h4 className="text-lg font-semibold">Todas las Frases de Equivalencia</h4>
                      </CardHeader>
                      <CardBody>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {frasesDisponibles.map((item, index) => (
                            <Card key={index} className="border border-gray-200 dark:border-gray-700">
                              <CardBody className="py-3">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Chip 
                                        size="sm" 
                                        color="primary" 
                                        variant="flat"
                                      >
                                        {item.rango_min}-{item.rango_max} m³
                                      </Chip>
                                      <Chip 
                                        size="sm" 
                                        color="secondary" 
                                        variant="flat"
                                      >
                                        {item.categoria}
                                      </Chip>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      {item.frase}
                                    </p>
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          ))}
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>
            
            <ModalFooter>
              <Button 
                variant="light" 
                onPress={onClose}
                startContent={<HiX />}
              >
                Cerrar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ModalEquivalenciaConsumo;
