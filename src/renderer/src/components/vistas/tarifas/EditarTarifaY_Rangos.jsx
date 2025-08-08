import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Tabs,
  Tab,
  Card,
  CardBody
} from "@nextui-org/react";
import { HiCurrencyDollar, HiCalendar, HiDocumentText, HiPencil, HiTrash, HiPlus } from "react-icons/hi";
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
  const [erroresCampos, setErroresCampos] = useState({});
  const [mostrarErrores, setMostrarErrores] = useState(false);

  const id_usuario = user?.id || null;

  // Función para limpiar errores cuando el usuario empiece a escribir
  const limpiarError = (campo) => {
    if (erroresCampos[campo]) {
      setErroresCampos(prev => ({
        ...prev,
        [campo]: false
      }));
    }
  };

  // Función para manejar el cierre del modal y resetear estados
  const handleCloseModal = () => {
    setErroresCampos({});
    setMostrarErrores(false);
    setIsSaving(false);
    onClose();
  };


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
    setMostrarErrores(true);

    // Validaciones de campos específicas
    const nuevosErrores = {};
    if (!nombre) nuevosErrores.nombre = true;
    if (!descripcion) nuevosErrores.descripcion = true;
    if (!fechaInicio) nuevosErrores.fechaInicio = true;

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresCampos(nuevosErrores);
      const camposFaltantes = Object.keys(nuevosErrores)
        .map((campo) => {
          switch (campo) {
            case "nombre": return "Nombre";
            case "descripcion": return "Descripción";
            case "fechaInicio": return "Fecha de Inicio";
            default: return campo;
          }
        });
      setError(`Los siguientes campos son obligatorios: ${camposFaltantes.join(", ")}`, "Edición de Tarifa");
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
      setSuccess("Tarifa actualizada correctamente.", "Edición de Tarifa");
      handleCloseModal();
      setIsSaving(false);
      actualizarTarifas();
    } catch (err) {
      setError("Error al actualizar tarifa.", "Edición de Tarifa");
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

    setSuccess("Rangos actualizados correctamente.", "Edición de Rangos");
    setTimeout(() => {
      handleCloseModal();
      actualizarTarifas();
      setIsSaving(false);
    }, 1000);

  } catch (err) {
    console.error(err);
    setError("Error al guardar los rangos.", "Edición de Rangos");
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

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} onClose={handleCloseModal} 
        size="3xl"
        scrollBehavior="inside"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        backdrop="transparent"
        placement="center"
        classNames={{
          closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2 text-xl font-bold">
                <HiPencil className="w-6 h-6 text-green-600" />
                Editar Tarifa y Rangos
              </ModalHeader>

              <ModalBody className="space-y-4">

                <Tabs
                  selectedKey={tab}
                  onSelectionChange={setTab}
                  variant="underlined"
                  className="mb-4"
                >

                  <Tab key="tarifa" title="Tarifa">
                    <Card className="border border-green-200 dark:border-green-800">
                      <CardBody className="space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <HiDocumentText className="w-5 h-5 text-green-600" />
                          Información de la Tarifa
                        </h3>
                        
                        <form className="space-y-4"
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleGuardarTarifa();
                          }}
                          id="form-editar-tarifa"
                        >
                          {/* Nombre de la Tarifa con estilo personalizado */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Nombre de la Tarifa*
                            </label>
                            <div className="relative w-full flex">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                                <HiCurrencyDollar className="inline-block mr-1 h-5 w-5 text-green-600" />
                              </span>
                              <input
                                type="text"
                                placeholder="ej. Tarifa Residencial 2024"
                                value={nombre}
                                onChange={(e) => {
                                  setNombre(e.target.value);
                                  limpiarError('nombre');
                                }}
                                required
                                className={`border ${mostrarErrores && erroresCampos.nombre ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-600 focus:border-green-500'} text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200`}
                              />
                            </div>
                            {mostrarErrores && erroresCampos.nombre && (
                              <p className="text-sm text-red-500 mt-1">El nombre de la tarifa es requerido</p>
                            )}
                          </div>

                          {/* Descripción con estilo personalizado */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Descripción*
                            </label>
                            <textarea
                              placeholder="Describe el propósito y características de esta tarifa..."
                              value={descripcion}
                              onChange={(e) => {
                                setDescripcion(e.target.value);
                                limpiarError('descripcion');
                              }}
                              required
                              rows={3}
                              className={`border ${mostrarErrores && erroresCampos.descripcion ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-600 focus:border-green-500'} text-gray-600 rounded-xl pl-4 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white resize-none transition-all duration-200`}
                            />
                            {mostrarErrores && erroresCampos.descripcion && (
                              <p className="text-sm text-red-500 mt-1">La descripción es requerida</p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Fecha de Inicio con estilo personalizado */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Fecha de Inicio*
                              </label>
                              <div className="relative w-full flex">
                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                                  <HiCalendar className="inline-block mr-1 h-5 w-5 text-green-600" />
                                </span>
                                <input
                                  type="date"
                                  value={fechaInicio}
                                  onChange={(e) => {
                                    setFechaInicio(e.target.value);
                                    limpiarError('fechaInicio');
                                  }}
                                  required
                                  className={`border ${mostrarErrores && erroresCampos.fechaInicio ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-600 focus:border-green-500'} text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200`}
                                />
                              </div>
                              {mostrarErrores && erroresCampos.fechaInicio && (
                                <p className="text-sm text-red-500 mt-1">La fecha de inicio es requerida</p>
                              )}
                            </div>

                            {/* Fecha de Fin con estilo personalizado */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Fecha de Fin (opcional)
                              </label>
                              <div className="relative w-full flex">
                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                                  <HiCalendar className="inline-block mr-1 h-5 w-5 text-green-600" />
                                </span>
                                <input
                                  type="date"
                                  value={fechaFin}
                                  onChange={(e) => setFechaFin(e.target.value)}
                                  className="border border-gray-300 focus:ring-green-600 focus:border-green-500 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200"
                                />
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dejar vacío para tarifa indefinida</p>
                            </div>
                          </div>

                          {fechaFin && fechaInicio && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                              <p className="text-sm text-green-600 dark:text-green-400">
                                ℹ️ Duración: {Math.ceil((new Date(fechaFin) - new Date(fechaInicio)) / (1000 * 60 * 60 * 24))} días
                              </p>
                            </div>
                          )}
                        </form>
                      </CardBody>
                    </Card>
                  </Tab>

                  <Tab key="rangos" title="Rangos">
                    <Card className="border border-blue-200 dark:border-blue-800">
                      <CardBody className="space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <HiCurrencyDollar className="w-5 h-5 text-blue-600" />
                          Rangos de Consumo
                        </h3>

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
                      </CardBody>
                    </Card>
                  </Tab>
                </Tabs>


              </ModalBody>
              
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={handleCloseModal}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  form={tab === "tarifa" ? "form-editar-tarifa" : "form-editar-rangos"}
                  isDisabled={isSaving}
                  isLoading={isSaving}
                >
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
