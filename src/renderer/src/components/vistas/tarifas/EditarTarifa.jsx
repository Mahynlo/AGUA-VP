import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import { useState, useEffect } from "react";
import { useAuth } from '../../../context/AuthContext';
import { useTarifas } from '../../../context/TarifasContext';

export default function EditarTarifa({ tarifa, onTarifaEditada }) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { user } = useAuth();
  const { actualizarTarifas } = useTarifas();

  const [nombre, setNombre] = useState(tarifa.nombre);
  const [descripcion, setDescripcion] = useState(tarifa.descripcion || "");
  const [fechaInicio, setFechaInicio] = useState(tarifa.fecha_inicio || "");
  const [fechaFin, setFechaFin] = useState(tarifa.fecha_fin || "");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const id_usuario = user?.id || null;

  useEffect(() => {
    if (!isOpen) {
      setNombre(tarifa.nombre);
      setDescripcion(tarifa.descripcion || "");
      setFechaInicio(tarifa.fecha_inicio || "");
      setFechaFin(tarifa.fecha_fin || "");
      setSuccess("");
      setError("");
      setIsSaving(false);
    }
  }, [isOpen, tarifa]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setIsSaving(true);

    if (!nombre || !fechaInicio) {
      setError("El nombre y la fecha de inicio son obligatorios.");
      setIsSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await window.tarifasApp.updateTarifa({
        id: tarifa.id,
        nuevosDatos: {
          nombre,
          descripcion,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin || null,
          modificado_por: id_usuario,
        },
        token_session: token,
      });

      if (response.success) {
        setSuccess("Tarifa actualizada correctamente.");
        setTimeout(() => {
          onClose();
          actualizarTarifas();
          setIsSaving(false);
          onTarifaEditada?.();
        }, 1500);
      } else {
        setError(response.message || "No se pudo actualizar la tarifa.");
        setIsSaving(false);
      }
    } catch (err) {
      console.error(err);
      setError("Error al actualizar la tarifa.");
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        color="secondary"
        className="ml-2 min-w-[50px] px-8 py-2"
        onPress={onOpen}
      >
        Editar
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="lg"
        scrollBehavior="inside"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        backdrop="blur"
        classNames={{
          backdrop: "bg-gradient-to-t mt-18 ml-24 from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
          header: "dark:border-b border-b border-gray-400 dark:border-[#6879bd]",
          footer: "dark:border-t border-t border-gray-400 dark:border-[#6879bd]",
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="text-2xl font-bold text-gray-900 bg-gray-300 dark:bg-gray-700 dark:text-white">
                Editar Tarifa
              </ModalHeader>
              <ModalBody className="bg-gray-200 dark:bg-gray-800">
                {success && (
                  <div className="p-3 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900 dark:text-green-300">
                    {success}
                  </div>
                )}
                {error && (
                  <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="grid gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
                      Nombre de la Tarifa
                    </label>
                    <input
                      type="text"
                      className="bg-gray-50 border rounded-xl dark:border-gray-600 text-gray-900 text-sm block w-full p-2.5 dark:bg-neutral-800 dark:text-white"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
                      Descripción
                    </label>
                    <textarea
                      className="bg-gray-50 border h-32 rounded-xl dark:border-gray-600 text-gray-900 text-sm block w-full p-2.5 dark:bg-neutral-800 dark:text-white resize-none"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      className="bg-gray-50 border rounded-xl dark:border-gray-600 text-gray-900 text-sm block w-full p-2.5 dark:bg-neutral-800 dark:text-white"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
                      Fecha de Fin (opcional)
                    </label>
                    <input
                      type="date"
                      className="bg-gray-50 border rounded-xl dark:border-gray-600 text-gray-900 text-sm block w-full p-2.5 dark:bg-neutral-800 dark:text-white"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                    />
                  </div>
                </form>
              </ModalBody>

              <ModalFooter className="bg-gray-300 dark:bg-gray-700">
                <Button
                  color="primary"
                  type="submit"
                  onClick={handleSubmit}
                  isDisabled={isSaving}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-xl text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Button
                  color="danger"
                  variant="light"
                  onPress={onClose}
                  className="bg-red-700 hover:bg-red-800 text-white font-medium rounded-xl text-sm px-5 py-2.5"
                >
                  Cancelar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
