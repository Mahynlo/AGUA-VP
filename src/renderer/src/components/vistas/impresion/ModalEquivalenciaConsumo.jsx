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
  Chip,
  Tabs,
  Tab,
  Spinner
} from "@nextui-org/react";
import { useState } from "react";
import { HiScale, HiBeaker, HiCollection, HiX } from "react-icons/hi";
import useEquivalenciaConsumo from "../../../hooks/useEquivalenciaConsumo";

// Componente de Input Personalizado (Estandarizado)
const CustomInput = ({ label, value, onChange, icon, type = "text", color = "blue", description, min, max, placeholder, suffix }) => (
  <div>
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
      {label}
    </label>
    <div className="relative w-full flex">
      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2 pr-2">
        {icon}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        className={`border border-gray-300 focus:ring-${color}-600 focus:border-${color}-500 text-gray-600 rounded-xl pl-12 ${suffix ? 'pr-10' : 'pr-4'} py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium text-sm pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
    {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
  </div>
);

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
      classNames={{
        backdrop: "bg-gradient-to-t mt-18 from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
        closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white"
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full">
                  <HiScale className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-800 dark:text-white">
                    Equivalencias de Consumo
                  </span>
                  <span className="text-sm font-normal text-gray-500">
                    Configure las frases automáticas que aparecen en los recibos
                  </span>
                </div>
              </div>
            </ModalHeader>

            <ModalBody className="py-6">
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
                  <div className="space-y-6 pt-2">
                    <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
                      <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Simulador de Consumo</h4>
                      </CardHeader>
                      <CardBody className="space-y-6 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                          <CustomInput
                            label="Consumo a probar"
                            type="number"
                            placeholder="Ej: 25"
                            value={consumoPrueba}
                            onChange={(e) => setConsumoPrueba(parseInt(e.target.value) || 0)}
                            icon={<HiBeaker className="w-5 h-5 text-blue-500" />}
                            suffix="m³"
                            color="blue"
                            min={0}
                            max={1000}
                            description="Ingrese un valor en metros cúbicos para ver el mensaje resultante."
                          />

                          <Button
                            color="primary"
                            onPress={handlePrueba}
                            startContent={<HiBeaker />}
                            className="h-11 shadow-lg shadow-blue-500/30 w-full md:w-auto"
                            radius="lg"
                          >
                            Generar Equivalencia
                          </Button>
                        </div>

                        {frasePrueba && (
                          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800/30 flex items-start gap-4">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full shrink-0">
                              <HiScale className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-green-800 dark:text-green-300">
                                Resultado:
                              </p>
                              <p className="text-base text-green-700 dark:text-green-400 italic leading-relaxed">
                                "{frasePrueba}"
                              </p>
                            </div>
                          </div>
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
                  <div className="space-y-4 pt-2">
                    <Card className="shadow-none border border-gray-200 dark:border-gray-700 bg-transparent">
                      <CardBody className="p-0">
                        <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {frasesDisponibles.map((item, index) => (
                            <div key={index} className="group p-4 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-sm hover:shadow-md">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    <span>Rango:</span>
                                    <span className="text-blue-900 dark:text-blue-100">{item.rango_min}-{item.rango_max} m³</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/40 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    {item.categoria}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed pl-1 py-1">
                                  {item.frase}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>

            <ModalFooter className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <Button
                variant="light"
                color="danger"
                onPress={onClose}
                startContent={<HiX />}
                radius="lg"
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
