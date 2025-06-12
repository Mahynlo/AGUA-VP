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
  }
];

export default function CarruselLecturasModal() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lecturas, setLecturas] = useState({});

  const total = clientesMock.length;
  const clienteActual = clientesMock[currentIndex];
  const lecturaActual = lecturas[clienteActual.id] || "";

  const handleLecturaChange = (e) => {
    setLecturas({
      ...lecturas,
      [clienteActual.id]: e.target.value,
    });
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
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
        classNames={{
          header: "dark:border-b border-b border-gray-400 dark:border-[#6879bd]",
          footer: "dark:border-t border-t border-gray-400 dark:border-[#6879bd]",
          closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
        }}
        backdrop="transparent"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-2xl font-bold text-gray-900 bg-gray-300 dark:bg-gray-700 dark:text-white">
                Toma de lectura {currentIndex + 1}/{total}
              </ModalHeader>

              <ModalBody className="bg-gray-200 dark:bg-gray-80">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Información del cliente */}
                  <div className="lg:w-1/2 bg-gray-200 dark:bg-gray-700 p-4 rounded-lg shadow-inner dark:text-white">
                    <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                      Información del Cliente
                    </h3>
                    <div className="flex flex-col gap-6">
                      <div className="grid grid-cols-[40%_1fr] gap-x-6 text-gray-900 dark:text-white">
                        {[
                          ["Cliente", clienteActual.nombre],
                          ["Fecha", "15 de mayo de 2024"],
                          ["Dirección", clienteActual.dirección],
                          ["Número de Medidor", clienteActual.medidor],
                          ["Ruta", "Ruta 7"],
                          ["Ciudad", clienteActual.ciudad],
                          ["Latitud", clienteActual.lat],
                          ["Longitud", clienteActual.lng],
                        ].map(([label, value], idx) => (
                          <div
                            key={idx}
                            className="col-span-2 grid grid-cols-subgrid border-t border-t-[#314c68] py-4 dark:border-t-gray-600"
                          >
                            <p className="text-[#90accb] text-sm text-black dark:text-white">{label}</p>
                            <p className="text-sm text-gray-800 dark:text-white">{value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-2">
                        <label className="block text-sm font-medium text-[#90accb] mb-1">
                          Lectura Actual
                        </label>
                        <TextInput
                          type="number"
                          value={lecturaActual}
                          onChange={handleLecturaChange}
                          placeholder="Ingrese la lectura del medidor"
                          className="w-full max-w-xs"
                          color="gray"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mapa */}
                  <div className="lg:w-1/2 bg-gray-100 dark:bg-gray-600 p-4 rounded-lg shadow-inner">
                    <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                      Ubicación del Cliente
                    </h3>
                    <div className="h-[250px] bg-gray-300 dark:bg-gray-500 rounded-lg flex items-center justify-center">
                      Mapa de {clienteActual.ciudad} (aquí iría el mapa)
                    </div>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      Guardado automáticamente al cambiar de cliente.
                      </div>
                  </div>
                </div>
              </ModalBody>

              <ModalFooter className="bg-gray-300 dark:bg-gray-700">
                <div className="flex justify-between w-full">
                  <Button color="warning" onClick={handlePrev} isDisabled={currentIndex === 0}>
                    Anterior
                  </Button>
                  <Button color="primary" onClick={handleNext} isDisabled={currentIndex === total - 1}>
                    Siguiente
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

