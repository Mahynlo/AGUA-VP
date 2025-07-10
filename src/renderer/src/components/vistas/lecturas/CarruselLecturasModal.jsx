import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import { TextInput } from "flowbite-react";

const clientesMock = [
  {
    id: 1,
    nombre: "Juan Pérez",
    dirección: "Calle 123, Col. Centro",
    medidor: "A12345",
    ciudad: "Nacori Grande",
    lat: 29.567,
    lng: -109.456,
  },
  {
    id: 2,
    nombre: "Ana López",
    dirección: "Av. Reforma 456",
    medidor: "B67890",
    ciudad: "Matape",
    lat: 29.789,
    lng: -109.234,
  },
  {
    id: 3,
    nombre: "Carlos García",
    dirección: "Calle Falsa 789",
    medidor: "C54321",
    ciudad: "Adivino",
    lat: 29.123,
    lng: -109.678,
  },
];

export default function CarruselLecturasModal() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lecturas, setLecturas] = useState({});

  const total = clientesMock.length;
  const cliente = clientesMock[currentIndex];
  const lecturaActual = lecturas[cliente.id] || "";

  const handleLecturaChange = (e) => {
    setLecturas({
      ...lecturas,
      [cliente.id]: e.target.value,
    });
  };

  const handleNext = () => {
    if (currentIndex < total - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  return (
    <>
      <Button color="primary" onPress={onOpen}>
        Abrir Toma de Lecturas
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="4xl"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        backdrop="transparent"
        classNames={{
          header: "dark:border-b-[1px] dark:border-[#6879bd] border-b-[1px] border-gray-400",
          footer: "dark:border-t-[1px] dark:border-[#6879bd] border-t-[1px] border-gray-400",
          closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-2xl font-bold text-gray-900 bg-gray-300 dark:bg-gray-700 dark:text-white">
                Lectura {currentIndex + 1} de {total}
              </ModalHeader>

              <ModalBody className="bg-gray-100 dark:bg-gray-800 px-6 py-4">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Cliente info */}
                  <div className="lg:w-1/2 bg-white dark:bg-gray-700 rounded-lg p-4 shadow-inner">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                      Información del Cliente
                    </h3>

                    <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                      {[
                        ["Cliente", cliente.nombre],
                        ["Fecha", "15 de mayo de 2024"],
                        ["Dirección", cliente.dirección],
                        ["Número de Medidor", cliente.medidor],
                        ["Ruta", "Ruta 7"],
                        ["Ciudad", cliente.ciudad],
                        ["Latitud", cliente.lat],
                        ["Longitud", cliente.lng],
                      ].map(([label, value], idx) => (
                        <div
                          key={idx}
                          className="flex justify-between border-b border-dashed border-gray-300 dark:border-gray-600 pb-1"
                        >
                          <span className="font-medium text-[#90accb]">{label}:</span>
                          <span>{value}</span>
                        </div>
                      ))}

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-[#90accb] mb-1">
                          Lectura Actual
                        </label>
                        <TextInput
                          type="number"
                          value={lecturaActual}
                          onChange={handleLecturaChange}
                          placeholder="Ingrese la lectura"
                          className="w-full max-w-xs"
                          color="gray"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mapa simulado */}
                  <div className="lg:w-1/2 bg-white dark:bg-gray-700 rounded-lg p-4 shadow-inner">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                      Ubicación
                    </h3>
                    <div className="h-[250px] bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center text-gray-700 dark:text-gray-200">
                      Mapa de {cliente.ciudad}
                    </div>
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 italic">
                      * La lectura se guarda automáticamente al avanzar.
                    </p>
                  </div>
                </div>
              </ModalBody>

              <ModalFooter className="bg-gray-300 dark:bg-gray-700">
                <Button
                  onClick={handlePrev}
                  color="default"
                  variant="ghost"
                  isDisabled={currentIndex === 0}
                >
                  ← Anterior
                </Button>

                <div className="space-x-2">
                  <Button
                    onClick={handleNext}
                    color="primary"
                    isDisabled={currentIndex === total - 1}
                  >
                    Siguiente →
                  </Button>

                  <Button color="success" onClick={onClose}>
                    Guardar y Cerrar
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}


