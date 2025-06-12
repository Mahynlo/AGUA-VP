import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button
} from "@nextui-org/react";

const ModalLectura = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      classNames={{
        backdrop: "bg-black/60",
        base: "bg-[#101923] font-[Manrope, 'Noto Sans', sans-serif] rounded-2xl",
      }}
      scrollBehavior="inside"
      hideCloseButton
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="text-white text-[28px] font-bold pt-6 pb-2 px-6">
              ¿Estás seguro de que quieres guardar esta lectura?
            </ModalHeader>

            <ModalBody className="px-6 pt-0 pb-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Columna izquierda */}
                <div className="flex flex-col w-full max-w-[400px]">
                  <div className="grid grid-cols-[20%_1fr] gap-x-6">
                    {[
                      ["Cliente", "Cliente 1/23"],
                      ["Lectura", "123456"],
                      ["Fecha", "15 de mayo de 2024"],
                      ["Dirección", "Calle Principal 123, Ciudad"],
                      ["Número de Medidor", "456789"],
                      ["Ruta", "Ruta 7"],
                    ].map(([label, value], idx) => (
                      <div key={idx} className="col-span-2 grid grid-cols-subgrid border-t border-t-[#314c68] py-4">
                        <p className="text-[#90accb] text-sm">{label}</p>
                        <p className="text-white text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Columna derecha */}
                <div className="flex-1 bg-[#172a3a] rounded-xl min-h-[250px]">
                  {/* Aquí irá el mapa más adelante */}
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="px-6 pb-6 flex-wrap gap-3">
              <Button
                onPress={onClose}
                className="bg-[#223549] text-white rounded-full text-sm font-bold min-w-[84px] h-10"
              >
                Cancelar
              </Button>
              <Button
                className="bg-[#0b79ee] text-white rounded-full text-sm font-bold min-w-[84px] h-10"
              >
                Guardar Toma de Lectura
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ModalLectura;

