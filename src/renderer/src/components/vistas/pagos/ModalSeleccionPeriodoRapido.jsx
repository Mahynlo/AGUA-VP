import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/react";
import SelectorPeriodoAvanzado from "../../ui/SelectorPeriodoAvanzado";

const ModalSeleccionPeriodoRapido = ({
  isOpen,
  onClose,
  periodo,
  onChangePeriodo,
  onConfirmar,
  formatearPeriodo
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" backdrop="opaque">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <span className="text-xl font-bold">Modo rapido de pagos</span>
          <span className="text-sm text-slate-500 dark:text-zinc-400">Selecciona el periodo para aplicar pagos masivos</span>
        </ModalHeader>
        <ModalBody>
          <SelectorPeriodoAvanzado
            value={periodo}
            onChange={onChangePeriodo}
            placeholder="Buscar y seleccionar período"
            startYear={2020}
            size="sm"
            className="w-full"
          />
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Periodo seleccionado: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatearPeriodo(periodo)}</span>
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>Cancelar</Button>
          <Button color="success" onPress={onConfirmar}>Continuar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModalSeleccionPeriodoRapido;
