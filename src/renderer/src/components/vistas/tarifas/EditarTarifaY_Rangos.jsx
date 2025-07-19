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

//para los iconos de los mensajes de feedback
import { useFeedback } from "../../../context/FeedbackContext";



export default function EditarTarifaYRangos({ tarifa, rangosIniciales = [] }) {
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

  // Estados para mensajes de feedback
  const { setSuccess, setError } = useFeedback();


  const [isSaving, setIsSaving] = useState(false);

  const id_usuario = user?.id || null;


  //useEffect para inicializar los rangos del componente
  useEffect(() => {
    if (isOpen) { // Si el modal se abre, inicializa los campos con los datos de la tarifa
      setNombre(tarifa.nombre);
      setDescripcion(tarifa.descripcion || "");
      setFechaInicio(tarifa.fecha_inicio || "");
      setFechaFin(tarifa.fecha_fin || "");
      setRangos(rangosIniciales.map(r => ({ ...r })));
      setTab("tarifa");
    }
  }, [isOpen, tarifa, rangosIniciales]);


  //handleGuardarTarifa es la función que se encarga de guardar los cambios de la tarifa
  const handleGuardarTarifa = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    if (!nombre || !fechaInicio) {
      setError("El nombre y la fecha de inicio son obligatorios.(Advertencia-FNED)", "Edición de Tarifa");
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
      setSuccess("Tarifa actualizada correctamente.(Sheck-FNED)", "Edición de Tarifa");
      onClose();
      setIsSaving(false);
      actualizarTarifas();
    } catch (err) {
      setError("Error al actualizar tarifa.(Error-FNED)", "Edición de Tarifa");
      setIsSaving(false);
    }
  };

  const handleGuardarRangos = async () => {
  setError("");
  setSuccess("");
  setIsSaving(true);

  const parsedRangos = rangos.map((r, i) => ({
    index: i + 1,
    consumo_min: parseFloat(r.consumo_min),
    consumo_max: parseFloat(r.consumo_max),
    precio_por_m3: parseFloat(r.precio_por_m3),
  }));

  // Validaciones de campos vacíos o inválidos
  for (const r of parsedRangos) {
    if (
      isNaN(r.consumo_min) || isNaN(r.consumo_max) || isNaN(r.precio_por_m3) ||
      r.consumo_min === "" || r.consumo_max === "" || r.precio_por_m3 === ""
    ) {
      setError("Todos los campos deben ser numéricos y no vacíos.(Advertencia-FNED)", "Edición de Rangos");
      setIsSaving(false);
      return;
    }

    if (r.consumo_min < 0 || r.consumo_max < 0 || r.precio_por_m3 < 0) {
      setError("Los valores no pueden ser negativos.(Advertencia-FNED)", "Edición de Rangos");
      setIsSaving(false);
      return;
    }

    if (r.consumo_min >= r.consumo_max) {
      setError(`El consumo mínimo debe ser menor que el máximo en el rango ${r.index}.(Advertencia-FNED)`, "Edición de Rangos");
      setIsSaving(false);
      return;
    }
  }

  // Detección de duplicados exactos
  const claves = new Set();
  for (const r of parsedRangos) {
    const clave = `${r.consumo_min}-${r.consumo_max}`;
    if (claves.has(clave)) {
      setError(`Rango duplicado [${clave}].(Advertencia-FNED)`, "Edición de Rangos");
      setIsSaving(false);
      return;
    }
    claves.add(clave);
  }

  // Validación de solapamientos o contactos
  const ordenados = [...parsedRangos].sort((a, b) => a.consumo_min - b.consumo_min);
  for (let i = 0; i < ordenados.length - 1; i++) {
    const actual = ordenados[i];
    const siguiente = ordenados[i + 1];

    if (actual.consumo_max >= siguiente.consumo_min) {
      setError(
        `El rango ${actual.index} se solapa o toca con el rango ${siguiente.index}.(Advertencia-FNED)`,
        "Edición de Rangos"
      );
      setIsSaving(false);
      return;
    }
  }

  // (Opcional) Detectar huecos entre rangos
  for (let i = 0; i < ordenados.length - 1; i++) {
    const actual = ordenados[i];
    const siguiente = ordenados[i + 1];

    if (actual.consumo_max + 1 < siguiente.consumo_min) {
      setError(
        `Hay un hueco entre los rangos ${actual.index} y ${siguiente.index}.(Advertencia-FNED)`,
        "Edición de Rangos"
      );
      setIsSaving(false);
      return;
    }
  }

  // Si pasa todas las validaciones, enviar
  try {
    const token = localStorage.getItem("token");

    const response = await window.tarifasApp.updateRangosTarifa({
      id: tarifa.id,
      rangos: parsedRangos.map(r => ({
        id: rangos[r.index - 1].id || null,
        consumo_min: r.consumo_min,
        consumo_max: r.consumo_max,
        precio_por_m3: r.precio_por_m3,
      })),
      token_session: token
    });

    if (!response.success) throw new Error(response.message);

    setSuccess("Rangos actualizados correctamente.(Sheck-FNED)", "Edición de Rangos");
    setTimeout(() => {
      onClose();
      actualizarTarifas();
      setIsSaving(false);
    }, 1000);

  } catch (err) {
    console.error(err);
    setError("Error al guardar los rangos.(Error-FNED de BK)", "Edición de Rangos");
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
        setError("Completa el rango actual antes de agregar otro.", "Edición de Rangos");
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
      setError("Ese rango ya ha sido agregado.", "Edición de Rangos");
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
          {(onClose) => (
            <>
              <ModalHeader className="text-2xl font-bold text-gray-900 bg-gray-300 dark:bg-gray-700 dark:text-white">
                Editar Tarifa y Rangos
              </ModalHeader>

              <ModalBody className="bg-gray-200 dark:bg-gray-800">

                <Tabs
                  selectedKey={tab}
                  onSelectionChange={setTab}
                  variant="underlined"
                  className="mb-4"
                >

                  <Tab key="tarifa" title="Tarifa">
                    <form className="grid gap-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleGuardarTarifa();
                      }}
                      id="form-editar-tarifa"
                    >
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
                          required
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
                          required
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
                    </form>
                  </Tab>

                  <Tab key="rangos" title="Rangos">

                    <form className="overflow-x-auto"

                      id="form-editar-rangos"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleGuardarRangos();
                      }}
                    >
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
                                    required
                                  />
                                </div>

                              </td>

                              <td className="px-4 py-2">
                                <input
                                  placeholder="Máx"
                                  value={r.consumo_max}
                                  onChange={(e) => handleChangeRango(i, "consumo_max", e.target.value)}
                                  className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-neutral-700 dark:text-white"
                                  required
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  placeholder="$/m³"
                                  value={r.precio_por_m3}
                                  onChange={(e) => handleChangeRango(i, "precio_por_m3", e.target.value)}
                                  className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-neutral-700 dark:text-white"
                                  required
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

                    </form>

                  </Tab>
                </Tabs>


              </ModalBody>

              <ModalFooter className="bg-gray-300 dark:bg-gray-700">
                <Button
                  type="submit"
                  form={tab === "tarifa" ? "form-editar-tarifa" : "form-editar-rangos"}
                  isDisabled={isSaving}
                  className="bg-blue-700 hover:bg-blue-800 text-white"
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
