import { Modal } from "flowbite-react";
import { HiCurrencyDollar, HiCalendar, HiPencil, HiTrash, HiPlus } from "react-icons/hi";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useTarifas } from "../../../context/TarifasContext";
import { usePermissions } from "../../../context/PermissionsContext";
import { useFeedback } from "../../../context/FeedbackContext";

const premiumModalTheme = {
    root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" } },
    content: {
        base: "relative h-full w-full p-4 md:h-auto",
        inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-3xl w-full"
    },
    header: {
        base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/50 px-8 py-6 rounded-t-2xl shrink-0",
        close: { base: "absolute top-6 right-6 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
    },
    body: { base: "flex-1 overflow-y-auto min-h-0" },
    footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8 rounded-b-2xl shrink-0" }
};

export default function EditarTarifaYRangos({ tarifa, rangosIniciales = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { actualizarTarifas } = useTarifas();
  const { can } = usePermissions();
  const canModificarTarifas = can("tarifas.modificar");

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [rangos, setRangos] = useState([]);
  const [tab, setTab] = useState("tarifa");

  const { setSuccess, setError } = useFeedback();
  const [isSaving, setIsSaving] = useState(false);
  const [erroresCampos, setErroresCampos] = useState({});
  const [mostrarErrores, setMostrarErrores] = useState(false);

  const id_usuario = user?.id || null;

  const limpiarError = (campo) => {
    if (erroresCampos[campo]) {
      setErroresCampos(prev => ({ ...prev, [campo]: false }));
    }
  };

  const handleCloseModal = () => {
    setErroresCampos({});
    setMostrarErrores(false);
    setIsSaving(false);
    setIsOpen(false);
  };

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
    if (!canModificarTarifas) {
      setError("No tienes permisos para modificar tarifas.", "Edición de Tarifa");
      return;
    }

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
      setTimeout(() => { handleCloseModal(); }, 1000);
    } catch (err) {
      setError("Error al actualizar tarifa.", "Edición de Tarifa");
      setIsSaving(false);
    }
  };

  const handleGuardarRangos = async () => {
    if (!canModificarTarifas) {
      setError("No tienes permisos para modificar rangos de tarifa.", "Edición de Rangos");
      return;
    }

    setError("");
    setSuccess("");
    setIsSaving(true);

    const parsedRangos = rangos.map((r, i) => ({
      index: i + 1,
      consumo_min: parseFloat(r.consumo_min),
      consumo_max: parseFloat(r.consumo_max),
      precio_por_m3: parseFloat(r.precio_por_m3),
    }));

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
          id: rangos[r.index - 1].id || null,
          consumo_min: r.consumo_min,
          consumo_max: r.consumo_max,
          precio_por_m3: r.precio_por_m3,
        })),
        token_session: token
      });

      if (!response.success) throw new Error(response.message);
      setSuccess("Rangos actualizados correctamente.", "Edición de Rangos");
      actualizarTarifas();
      setTimeout(() => { handleCloseModal(); }, 1000);
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

  const getInputClasses = (hasError) => `
    w-full text-sm font-medium rounded-xl transition-all duration-200 resize-none px-3 h-11
    ${hasError
      ? 'bg-red-50/50 dark:bg-red-900/10 border border-red-300 dark:border-red-800/50 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-red-900 dark:text-red-200'
      : 'bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 focus:border-slate-400 dark:focus:border-zinc-500 text-slate-800 dark:text-zinc-100'
    }
    focus:outline-none shadow-none
  `;

  const labelClasses = "block mb-1.5 ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={!canModificarTarifas}
        className="font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-xl px-4 h-10 min-w-0 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Editar"
      >
        <HiPencil className="w-4 h-4" />
      </button>

      <Modal
        show={isOpen}
        onClose={handleCloseModal}
        theme={premiumModalTheme}
        dismissible={false}
      >
        <Modal.Header>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
              <HiPencil className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                Editar Tarifa
              </h2>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                Modificación de parámetros y estructura de precios
              </p>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body>
          {/* Tab bar */}
          <div className="flex border-b border-slate-200 dark:border-zinc-800 px-8 shrink-0">
            {[
              { key: "tarifa", label: "Datos Generales" },
              { key: "rangos", label: "Bloques de Consumo" },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-0 h-12 mr-6 text-sm border-b-2 transition-colors ${
                  tab === key
                    ? "border-slate-800 dark:border-zinc-200 text-slate-800 dark:text-zinc-100 font-bold"
                    : "border-transparent text-slate-500 dark:text-zinc-400 font-medium hover:text-slate-700 dark:hover:text-zinc-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* TAB 1: Datos Generales */}
          {tab === "tarifa" && (
            <div className="px-8 py-6">
              <form
                id="form-editar-tarifa"
                onSubmit={(e) => { e.preventDefault(); handleGuardarTarifa(); }}
                className="flex flex-col gap-8"
              >
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-500/10 text-slate-500 flex items-center justify-center text-[10px] font-bold">1</span>
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                      Información General
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-5 pl-7">
                    <div>
                      <label className={labelClasses}>
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
                          className={`${getInputClasses(mostrarErrores && erroresCampos.nombre)} pl-10`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClasses}>
                        Descripción <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={descripcion}
                        onChange={(e) => { setDescripcion(e.target.value); limpiarError('descripcion'); }}
                        rows={3}
                        className={`${getInputClasses(mostrarErrores && erroresCampos.descripcion)} py-3 h-auto`}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-500/10 text-slate-500 flex items-center justify-center text-[10px] font-bold">2</span>
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                      Período de Vigencia
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pl-7">
                    <div>
                      <label className={labelClasses}>
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
                          className={`${getInputClasses(mostrarErrores && erroresCampos.fechaInicio)} pl-10`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClasses}>
                        Fecha de Fin <span className="font-normal text-slate-400 lowercase">(Opcional)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <HiCalendar className="w-5 h-5" />
                        </span>
                        <input
                          type="date"
                          value={fechaFin}
                          onChange={(e) => setFechaFin(e.target.value)}
                          className={`${getInputClasses(false)} pl-10`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Rangos */}
          {tab === "rangos" && (
            <div className="px-8 py-6">
              <form
                id="form-editar-rangos"
                onSubmit={(e) => { e.preventDefault(); handleGuardarRangos(); }}
                className="flex flex-col gap-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-500/10 text-slate-500 flex items-center justify-center text-[10px] font-bold">1</span>
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                      Estructura de Precios
                    </h3>
                  </div>

                  <div className="w-full overflow-x-auto pl-7">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-3 px-2 w-12 text-center">#</th>
                          <th className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-3 px-2">Mín. (m³)</th>
                          <th className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-3 px-2">Máx. (m³)</th>
                          <th className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-3 px-2">Precio ($/m³)</th>
                          <th className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-3 px-2 w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rangos.map((r, index) => (
                          <tr key={index} className="hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-colors">
                            <td className="border-b border-slate-100 dark:border-zinc-800/50 py-3 px-2 text-center">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">{index + 1}</span>
                            </td>
                            <td className="border-b border-slate-100 dark:border-zinc-800/50 py-3 px-2">
                              <input
                                type="number" min="0" step="0.01"
                                value={r.consumo_min}
                                onChange={(e) => handleChangeRango(index, "consumo_min", e.target.value)}
                                className={getInputClasses(false)}
                                required
                              />
                            </td>
                            <td className="border-b border-slate-100 dark:border-zinc-800/50 py-3 px-2">
                              <input
                                type="number" min="0" step="0.01"
                                value={r.consumo_max}
                                onChange={(e) => handleChangeRango(index, "consumo_max", e.target.value)}
                                className={getInputClasses(false)}
                                required
                              />
                            </td>
                            <td className="border-b border-slate-100 dark:border-zinc-800/50 py-3 px-2">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                                <input
                                  type="number" min="0" step="0.01"
                                  value={r.precio_por_m3}
                                  onChange={(e) => handleChangeRango(index, "precio_por_m3", e.target.value)}
                                  className={`${getInputClasses(false)} pl-7`}
                                  required
                                />
                              </div>
                            </td>
                            <td className="border-b border-slate-100 dark:border-zinc-800/50 py-3 px-2 text-center">
                              {rangos.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => eliminarRango(index)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
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

                  <div className="pt-2 pl-7">
                    <button
                      type="button"
                      onClick={agregarRango}
                      className="w-full font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl h-11 flex items-center justify-center gap-2 hover:bg-blue-500/20 transition-colors"
                    >
                      <HiPlus className="text-lg" />
                      Agregar Nuevo Rango
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <button
            type="button"
            onClick={handleCloseModal}
            disabled={isSaving}
            className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6 h-11 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form={tab === "tarifa" ? "form-editar-tarifa" : "form-editar-rangos"}
            disabled={isSaving}
            className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-8 h-11 shadow-sm flex items-center gap-2 disabled:opacity-70"
          >
            {isSaving && <div className="w-4 h-4 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />}
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
