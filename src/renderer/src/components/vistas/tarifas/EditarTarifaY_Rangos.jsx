import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Tabs,
  Tab
} from "@nextui-org/react";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useTarifas } from "../../../context/TarifasContext";

//Mensajes de éxito y error===========================================================================
import FeedbackMessages from "../../toast/FeedbackMessages";


export default function EditarTarifaYRangos({ tarifa, rangosIniciales = [], onCambio }) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { user } = useAuth();
  const { actualizarTarifas } = useTarifas();

  // Estado de Tarifa
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Estado de Rangos
  const [rangos, setRangos] = useState([]);
  const [tab, setTab] = useState("tarifa");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const id_usuario = user?.id || null;


  //useEffect para inicializar los rangos del componente
  useEffect(() => {
    if (isOpen) {
      setNombre(tarifa.nombre);
      setDescripcion(tarifa.descripcion || "");
      setFechaInicio(tarifa.fecha_inicio || "");
      setFechaFin(tarifa.fecha_fin || "");
      setRangos(rangosIniciales.map(r => ({ ...r })));
      setSuccess("");
      setError("");
      setTab("tarifa");
    }
  }, [isOpen, tarifa, rangosIniciales]);


  //handleGuardarTarifa es la función que se encarga de guardar los cambios de la tarifa
  const handleGuardarTarifa = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

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

      if (!response.success) throw new Error(response.message);
      setSuccess("Tarifa actualizada correctamente.");
      setTimeout(() => {
        onClose();
        actualizarTarifas();
        onCambio?.();
        setIsSaving(false);
      }, 1200);
    } catch (err) {
      setError("Error al actualizar tarifa.");
      setIsSaving(false);
    }
  };

  const handleGuardarRangos = async () => {
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
        id: tarifa.id,
        rangos: rangos.map(r => ({
          id: r.id || null,
          consumo_min: parseFloat(r.consumo_min),
          consumo_max: parseFloat(r.consumo_max),
          precio_por_m3: parseFloat(r.precio_por_m3),
        })),
        token_session: token
      });

      if (!response.success) throw new Error(response.message);
      setSuccess("Rangos actualizados correctamente.");
      setTimeout(() => {
        onClose();
        onCambio?.();
        setIsSaving(false);
      }, 1200);
    } catch (err) {
      setError("Error al guardar los rangos.");
      setIsSaving(false);
    }
  };

  // Función para agregar un nuevo rango
  const agregarRango = () => {
    const ultimo = rangos[rangos.length - 1];

    if (
      ultimo.consumo_min === "" || ultimo.consumo_min === null || ultimo.consumo_min === undefined ||
      ultimo.consumo_max === "" || ultimo.consumo_max === null || ultimo.consumo_max === undefined ||
      ultimo.precio_por_m3 === "" || ultimo.precio_por_m3 === null || ultimo.precio_por_m3 === undefined
    ) {
      setTimeout(() => {
        setError("Completa el rango actual antes de agregar otro.");
        return;
      }, 1000);

    }

    const yaExiste = rangos.some((r, idx) =>
      idx !== rangos.length - 1 &&
      r.consumo_min === ultimo.consumo_min &&
      r.consumo_max === ultimo.consumo_max &&
      r.precio_por_m3 === ultimo.precio_por_m3
    );

    if (yaExiste) {
      setError("Ese rango ya ha sido agregado.");
      return;
    }

    setError("");
    setRangos([...rangos, { consumo_min: "", consumo_max: "", precio_por_m3: "" }]);
  };

  // Función para manejar el cambio de un rango específico
  const handleChangeRango = (index, field, value) => {
    const nuevos = [...rangos];
    nuevos[index][field] = value;
    setRangos(nuevos);
  };


  return (
    <>
      <Button color="primary" onPress={onOpen} className="ml-2 px-8 py-2">
        Editar
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} scrollBehavior="inside"
        size="2xl"

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
          {() => (
            <>
              <ModalHeader className="text-2xl font-bold text-gray-900 bg-gray-300 dark:bg-gray-700 dark:text-white">
                Editar Tarifa y Rangos
              </ModalHeader>

              <ModalBody className="bg-gray-200 dark:bg-gray-800">
                <FeedbackMessages
                  // Mensajes de éxito y error
                  success={success}
                  error={error}
                  setSuccess={setSuccess}
                  setError={setError}
                />

                <Tabs
                  selectedKey={tab}
                  onSelectionChange={setTab}
                  variant="underlined"
                  className="mb-4"
                >

                  <Tab key="tarifa" title="Tarifa">
                    <div className="grid gap-4">
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
                          Nombre de la Tarifa
                        </label>
                        <input
                          type="text"
                          placeholder="Nombre"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          className="bg-gray-50 border rounded-xl dark:border-gray-600 text-gray-900 text-sm block w-full p-2.5 dark:bg-neutral-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
                          Descripción
                        </label>
                        <textarea
                          placeholder="Descripción"
                          value={descripcion}
                          onChange={(e) => setDescripcion(e.target.value)}
                          className="bg-gray-50 border h-32 rounded-xl dark:border-gray-600 text-gray-900 text-sm block w-full p-2.5 dark:bg-neutral-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
                          Fecha de Inicio
                        </label>
                        <input
                          type="date"
                          value={fechaInicio}
                          onChange={(e) => setFechaInicio(e.target.value)}
                          className="bg-gray-50 border rounded-xl dark:border-gray-600 text-gray-900 text-sm block w-full p-2.5 dark:bg-neutral-800 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
                          Fecha de Fin
                        </label>
                        <input
                          type="date"
                          value={fechaFin}
                          onChange={(e) => setFechaFin(e.target.value)}
                          className="bg-gray-50 border rounded-xl dark:border-gray-600 text-gray-900 text-sm block w-full p-2.5 dark:bg-neutral-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </Tab>

                  <Tab key="rangos" title="Rangos">

                    <div className="overflow-x-auto">
                      <table className="min-w-full border-separate border-spacing-y-2">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-center text-sm font-semibold text-gray-900 dark:text-white">
                              Consumo mínimo
                            </th>
                            <th className="px-4 py-2 text-center text-sm font-semibold text-gray-900 dark:text-white">
                              Consumo máximo
                            </th>
                            <th className="px-4 py-2 text-center text-sm font-semibold text-gray-900 dark:text-white">
                              Precio ($/m³)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {rangos.map((r, i) => (
                            <tr key={i} className="bg-gray-50 dark:bg-neutral-800">
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    {i + 1}:
                                  </label>
                                  <input
                                    placeholder="Mín"
                                    value={r.consumo_min}
                                    onChange={(e) => handleChangeRango(i, "consumo_min", e.target.value)}
                                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-neutral-700 dark:text-white"
                                  />
                                </div>

                              </td>

                              <td className="px-4 py-2">
                                <input
                                  placeholder="Máx"
                                  value={r.consumo_max}
                                  onChange={(e) => handleChangeRango(i, "consumo_max", e.target.value)}
                                  className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-neutral-700 dark:text-white"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  placeholder="$/m³"
                                  value={r.precio_por_m3}
                                  onChange={(e) => handleChangeRango(i, "precio_por_m3", e.target.value)}
                                  className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-neutral-700 dark:text-white"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="mt-4">
                        <Button size="sm" onClick={agregarRango} color="secondary" className="text-white bg-green-600">
                          + Agregar Rango
                        </Button>
                      </div>

                    </div>

                  </Tab>
                </Tabs>


              </ModalBody>

              <ModalFooter className="bg-gray-300 dark:bg-gray-700">
                <Button
                  color="primary"
                  onClick={tab === "tarifa" ? handleGuardarTarifa : handleGuardarRangos}
                  isDisabled={isSaving}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-xl text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Button color="danger" variant="light" onPress={onClose}
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
