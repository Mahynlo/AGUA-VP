import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure
} from "@nextui-org/react";
import { useState, useEffect } from "react";

export default function EditarRangosTarifa({ tarifaId, rangosIniciales = [], onGuardado }) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [rangos, setRangos] = useState([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRangos(rangosIniciales.map(r => ({ ...r }))); // Clon profundo
      setSuccess("");
      setError("");
    }
  }, [isOpen, rangosIniciales]);

  const handleChange = (index, field, value) => {
    const nuevosRangos = [...rangos];
    nuevosRangos[index][field] = value;
    setRangos(nuevosRangos);
  };

  const agregarRango = () => {
    const ultimo = rangos[rangos.length - 1];
    if (!ultimo || !ultimo.consumo_min || !ultimo.consumo_max || !ultimo.precio_por_m3) {
      setError("Completa el rango actual antes de agregar otro.");
      return;
    }
    setError("");
    setRangos([...rangos, { consumo_min: "", consumo_max: "", precio_por_m3: "" }]);
  };

  const handleGuardar = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    const camposInvalidos = rangos.some(r =>
      r.consumo_min === "" || r.consumo_max === "" || r.precio_por_m3 === "" ||
      isNaN(r.consumo_min) || isNaN(r.consumo_max) || isNaN(r.precio_por_m3)
    );

    if (camposInvalidos) {
      setError("Todos los campos deben ser numéricos y no vacíos.");
      setIsSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await window.tarifasApp.updateRangosTarifa({
        id: tarifaId,
        rangos: rangos.map(r => ({
          id: r.id || null, // Si es nuevo, id será null o undefined
          consumo_min: parseFloat(r.consumo_min),
          consumo_max: parseFloat(r.consumo_max),
          precio_por_m3: parseFloat(r.precio_por_m3),
        })),
        token_session: token
      });

      if (response.success) {
        setSuccess("Rangos actualizados correctamente.");
        setTimeout(() => {
          onClose();
          setIsSaving(false);
          onGuardado?.();
        }, 1500);
      } else {
        setError(response.message || "No se pudo actualizar.");
        setIsSaving(false);
      }
    } catch (err) {
      console.error(err);
      setError("Error al guardar. Verifica la conexión.");
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button color="primary" onPress={onOpen} className="ml-2 px-8 py-2">
        Editar
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" scrollBehavior="inside" backdrop="transparent">
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="text-2xl font-bold text-gray-900 bg-gray-300 dark:bg-gray-700 dark:text-white">
                Editar Rangos
              </ModalHeader>
              <ModalBody className="bg-gray-200 dark:bg-gray-800">
                {success && <div className="p-3 text-sm text-green-700 bg-green-100 rounded-lg">{success}</div>}
                {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600 ">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white">Consumo mínimo</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white">Consumo máximo</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white">Precio ($/m³)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {rangos.map((rango, index) => (
                      <tr key={rango.id || index}>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            className="input-style w-full"
                            value={rango.consumo_min}
                            onChange={e => handleChange(index, "consumo_min", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            className="input-style w-full"
                            value={rango.consumo_max}
                            onChange={e => handleChange(index, "consumo_max", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            className="input-style w-full"
                            value={rango.precio_por_m3}
                            onChange={e => handleChange(index, "precio_por_m3", e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4">
                  <Button onClick={agregarRango} color="secondary" className="text-white bg-green-600">
                    + Agregar Rango
                  </Button>
                </div>
              </ModalBody>

              <ModalFooter className="bg-gray-300 dark:bg-gray-700">
                <Button
                  color="primary"
                  onClick={handleGuardar}
                  isDisabled={isSaving}
                  className="bg-blue-700 text-white"
                >
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Button
                  color="danger"
                  variant="light"
                  onPress={onClose}
                  className="bg-red-700 text-white"
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

