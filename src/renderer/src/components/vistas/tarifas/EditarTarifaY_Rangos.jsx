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
import { HiCurrencyDollar, HiCalendar, HiDocumentText, HiPencil, HiTrash, HiPlus, HiCheck, HiX } from "react-icons/hi";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useTarifas } from "../../../context/TarifasContext";
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

  // Limpiar error al escribir
  const limpiarError = (campo) => {
    if (erroresCampos[campo]) {
      setErroresCampos(prev => ({ ...prev, [campo]: false }));
    }
  };

  // Cerrar modal y resetear estados
  const handleCloseModal = () => {
    setErroresCampos({});
    setMostrarErrores(false);
    setIsSaving(false);
    onClose();
  };

  // Inicializar estados al abrir el modal
  useEffect(() => {
    if (isOpen && tarifa) {
      setNombre(tarifa.nombre || "");
      setDescripcion(tarifa.descripcion || "");
      setFechaInicio(tarifa.fecha_inicio || "");
      setFechaFin(tarifa.fecha_fin || "");
      setRangos(rangosIniciales.map(r => ({ ...r })));
      setTab("tarifa");
    }
  }, [isOpen, tarifa, rangosIniciales]);

  const handleGuardarTarifa = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");
    setMostrarErrores(true);

    const nuevosErrores = {};
    if (!nombre) nuevosErrores.nombre = true;
    if (!descripcion) nuevosErrores.descripcion = true;
    if (!fechaInicio) nuevosErrores.fechaInicio = true;

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresCampos(nuevosErrores);
      const camposFaltantes = Object.keys(nuevosErrores).map((campo) => {
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
      actualizarTarifas();
      setTimeout(() => {
        handleCloseModal();
      }, 1000);
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

    // Validaciones
    for (const r of parsedRangos) {
      if (
        isNaN(r.consumo_min) || isNaN(r.consumo_max) || isNaN(r.precio_por_m3) ||
        r.consumo_min === "" || r.consumo_max === "" || r.precio_por_m3 === ""
      ) {
        setError("Todos los campos deben ser numéricos y no vacíos.", "Edición de Rangos");
        setIsSaving(false);
        return;
      }
      if (r.consumo_min < 0 || r.consumo_max < 0 || r.precio_por_m3 < 0) {
        setError("Los valores no pueden ser negativos.", "Edición de Rangos");
        setIsSaving(false);
        return;
      }
      if (r.consumo_min >= r.consumo_max) {
        setError(`El consumo mínimo debe ser menor que el máximo en el rango ${r.index}.`, "Edición de Rangos");
        setIsSaving(false);
        return;
      }
    }

    // Duplicados
    const claves = new Set();
    for (const r of parsedRangos) {
      const clave = `${r.consumo_min}-${r.consumo_max}`;
      if (claves.has(clave)) {
        setError(`Rango duplicado [${clave}].`, "Edición de Rangos");
        setIsSaving(false);
        return;
      }
      claves.add(clave);
    }

    // Solapamientos
    const ordenados = [...parsedRangos].sort((a, b) => a.consumo_min - b.consumo_min);
    for (let i = 0; i < ordenados.length - 1; i++) {
      const actual = ordenados[i];
      const siguiente = ordenados[i + 1];

      if (actual.consumo_max >= siguiente.consumo_min) {
        setError(`El rango ${actual.index} se solapa o toca con el rango ${siguiente.index}.`, "Edición de Rangos");
        setIsSaving(false);
        return;
      }
    }

    // Huecos
    for (let i = 0; i < ordenados.length - 1; i++) {
      const actual = ordenados[i];
      const siguiente = ordenados[i + 1];

      if (actual.consumo_max + 1 < siguiente.consumo_min) {
        setError(`Hay un hueco entre los rangos ${actual.index} y ${siguiente.index}.`, "Edición de Rangos");
        setIsSaving(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      const response = await window.tarifasApp.updateRangosTarifa({
        id: tarifa.id,
        rangos: parsedRangos.map(r => ({
          id: rangos[r.index - 1].id || null, // Mantenemos el ID original si existe
          consumo_min: r.consumo_min,
          consumo_max: r.consumo_max,
          precio_por_m3: r.precio_por_m3,
        })),
        token_session: token
      });

      if (!response.success) throw new Error(response.message);

      setSuccess("Rangos actualizados correctamente.", "Edición de Rangos");
      actualizarTarifas();
      setTimeout(() => {
        handleCloseModal();
      }, 1000);

    } catch (err) {
      console.error(err);
      setError("Error al guardar los rangos.", "Edición de Rangos");
      setIsSaving(false);
    }
  };

  const agregarRango = () => {
    const ultimo = rangos[rangos.length - 1];

    if (!ultimo || !ultimo.consumo_min || !ultimo.consumo_max || !ultimo.precio_por_m3) {
      setError("Completa el rango actual antes de agregar otro.", "Edición de Rangos");
      return;
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

  const handleChangeRango = (index, field, value) => {
    const nuevos = [...rangos];
    nuevos[index][field] = value;
    setRangos(nuevos);
  };

  const eliminarRango = (indexToRemove) => {
    if (rangos.length === 1) return;
    setRangos(rangos.filter((_, index) => index !== indexToRemove));
  };

  // Clases para inputs
  const inputClasses = (hasError) => `
    w-full text-sm font-medium rounded-xl transition-all duration-200 resize-none
    border focus:outline-none focus:ring-2 px-4 py-2.5 bg-white dark:bg-zinc-900
    ${hasError 
      ? 'border-red-300 dark:border-red-800 focus:ring-red-500/50 focus:border-red-500' 
      : 'border-slate-200 dark:border-zinc-700 focus:ring-blue-500/50 focus:border-blue-500 dark:text-zinc-100 hover:border-blue-300 dark:hover:border-zinc-500'
    }
  `;

  // Clases para inputs de tabla (más compactos)
  const tableInputClasses = `
    w-full text-sm font-medium rounded-xl transition-all duration-200 resize-none
    border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50
    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-950
    px-3 py-2 text-slate-800 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 text-center
  `;

  return (
    <>
      <Button 
        color="primary" 
        variant="flat" 
        onPress={onOpen} 
        startContent={<HiPencil className="w-4 h-4" />}
        className="font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
      >
        Editar
      </Button>

      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        onClose={handleCloseModal} 
        size="3xl"
        scrollBehavior="inside"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        backdrop="blur"
        placement="center"
        classNames={{
          base: "bg-white dark:bg-zinc-900 shadow-2xl",
          backdrop: "bg-zinc-900/50 backdrop-blur-sm",
          header: "border-b border-slate-100 dark:border-zinc-800",
          footer: "border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900",
          closeButton: "hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 text-slate-400 dark:text-zinc-500 transition-colors z-50",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              {/* ── HEADER ── */}
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                        <HiPencil className="w-7 h-7" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
                            Editar Tarifa
                        </h2>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                            Modificación de parámetros
                        </p>
                    </div>
                </div>
              </ModalHeader>

              {/* ── BODY CON TABS ── */}
              <ModalBody>
                <Tabs
                  selectedKey={tab}
                  onSelectionChange={setTab}
                  variant="underlined"
                  aria-label="Opciones de Edición"
                  classNames={{
                    base: "w-full border-b border-slate-200 dark:border-zinc-800 px-6 pt-2 bg-white dark:bg-zinc-950",
                    tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                    cursor: "w-full bg-blue-500",
                    tab: "max-w-fit px-0 h-12",
                    tabContent: "group-data-[selected=true]:text-blue-600 dark:group-data-[selected=true]:text-blue-400 group-data-[selected=true]:font-bold text-slate-500 dark:text-zinc-400 font-medium text-sm"
                  }}
                >
                  {/* TAB 1: DATOS DE TARIFA */}
                  <Tab key="tarifa" title="Datos Generales">
                    <div className="p-6 sm:p-8 space-y-6">
                        <form 
                            id="form-editar-tarifa" 
                            onSubmit={(e) => { e.preventDefault(); handleGuardarTarifa(); }}
                            className="flex flex-col gap-6"
                        >
                            {/* Información General */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/50 pb-2">
                                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-slate-500">1</span>
                                    <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Información General
                                    </h3>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-4 p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5 block">
                                            Nombre de la Tarifa <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                <HiCurrencyDollar className="w-5 h-5" />
                                            </span>
                                            <input
                                                type="text"
                                                value={nombre}
                                                onChange={(e) => { setNombre(e.target.value); limpiarError('nombre'); }}
                                                className={`${inputClasses(mostrarErrores && erroresCampos.nombre)} pl-10`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5 block">
                                            Descripción <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={descripcion}
                                            onChange={(e) => { setDescripcion(e.target.value); limpiarError('descripcion'); }}
                                            rows={3}
                                            className={inputClasses(mostrarErrores && erroresCampos.descripcion)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Vigencia */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/50 pb-2">
                                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-slate-500">2</span>
                                    <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Período de Vigencia
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5 block">
                                            Fecha de Inicio <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                <HiCalendar className="w-5 h-5" />
                                            </span>
                                            <input
                                                type="date"
                                                value={fechaInicio}
                                                onChange={(e) => { setFechaInicio(e.target.value); limpiarError('fechaInicio'); }}
                                                className={`${inputClasses(mostrarErrores && erroresCampos.fechaInicio)} pl-10`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5 block">
                                            Fecha de Fin <span className="font-normal text-slate-400">(Opcional)</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                <HiCalendar className="w-5 h-5" />
                                            </span>
                                            <input
                                                type="date"
                                                value={fechaFin}
                                                onChange={(e) => setFechaFin(e.target.value)}
                                                className={`${inputClasses(false)} pl-10`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                  </Tab>

                  {/* TAB 2: RANGOS */}
                  <Tab key="rangos" title="Bloques de Consumo">
                    <div className="p-6 sm:p-8 space-y-6">
                        <form 
                            id="form-editar-rangos" 
                            onSubmit={(e) => { e.preventDefault(); handleGuardarRangos(); }}
                            className="flex flex-col gap-6"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/50 pb-2">
                                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-slate-500">1</span>
                                    <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Configuración de Rangos
                                    </h3>
                                </div>
                                
                                {/* Tabla Moderna */}
                                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800">
                                                <tr>
                                                    <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 w-12">#</th>
                                                    <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Mínimo (m³)</th>
                                                    <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Máximo (m³)</th>
                                                    <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Precio ($/m³)</th>
                                                    <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 w-12"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                                                {rangos.map((r, index) => (
                                                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">{index + 1}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number" min="0" step="0.01"
                                                                value={r.consumo_min}
                                                                onChange={(e) => handleChangeRango(index, "consumo_min", e.target.value)}
                                                                className={tableInputClasses}
                                                                required
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number" min="0" step="0.01"
                                                                value={r.consumo_max}
                                                                onChange={(e) => handleChangeRango(index, "consumo_max", e.target.value)}
                                                                className={tableInputClasses}
                                                                required
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                                                                <input
                                                                    type="number" min="0" step="0.01"
                                                                    value={r.precio_por_m3}
                                                                    onChange={(e) => handleChangeRango(index, "precio_por_m3", e.target.value)}
                                                                    className={`${tableInputClasses} pl-7`}
                                                                    required
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {rangos.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => eliminarRango(index)}
                                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                >
                                                                    <HiTrash className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/30 border-t border-slate-100 dark:border-zinc-800">
                                        <Button
                                            type="button" onClick={agregarRango} variant="flat"
                                            className="w-full font-bold bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-800 shadow-sm"
                                            startContent={<HiPlus className="w-4 h-4 text-blue-500" />}
                                        >
                                            Añadir Nuevo Rango
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                  </Tab>
                </Tabs>
              </ModalBody>

              {/* ── FOOTER ── */}
              <ModalFooter className="flex justify-end gap-3">
                <Button
                    variant="flat"
                    onPress={handleCloseModal}
                    isDisabled={isSaving}
                    startContent={<HiX className="text-lg" />}
                    className="font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 h-11 px-6"
                >
                    Cancelar
                </Button>
                <Button
                    color="primary"
                    type="submit"
                    form={tab === "tarifa" ? "form-editar-tarifa" : "form-editar-rangos"}
                    isDisabled={isSaving}
                    isLoading={isSaving}
                    startContent={!isSaving && <HiCheck className="text-lg" />}
                    className="font-bold shadow-md shadow-blue-500/30 h-11 px-8"
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
