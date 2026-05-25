import { Modal } from "flowbite-react";
import { HiCurrencyDollar, HiPlus, HiCalendar } from "react-icons/hi";
import { useState } from "react";
import { useAuth } from '../../../context/AuthContext';
import { useTarifas } from '../../../context/TarifasContext';
import { usePermissions } from '../../../context/PermissionsContext';
import { useFeedback } from "../../../context/FeedbackContext";

const premiumModalTheme = {
    root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" } },
    content: {
        base: "relative h-full w-full p-4 md:h-auto",
        inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-4xl w-full"
    },
    header: {
        base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/50 px-8 py-6 rounded-t-2xl shrink-0",
        close: { base: "absolute top-6 right-6 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
    },
    body: { base: "px-8 py-6 flex-1 overflow-y-auto" },
    footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8 rounded-b-2xl shrink-0" }
};

export default function RegistrarTarifa({ onTarifaRegistrada }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { actualizarTarifas } = useTarifas();
  const { can } = usePermissions();
  const canCrearTarifas = can("tarifas.crear");

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [erroresCampos, setErroresCampos] = useState({});
  const [mostrarErrores, setMostrarErrores] = useState(false);

  const { setSuccess, setError } = useFeedback();
  const id_usuario = user?.id || null;

  const limpiarError = (campo) => {
    if (erroresCampos[campo]) {
      setErroresCampos(prev => ({ ...prev, [campo]: false }));
    }
  };

  const handleCloseModal = () => {
    setNombre("");
    setDescripcion("");
    setFechaInicio("");
    setFechaFin("");
    setErroresCampos({});
    setMostrarErrores(false);
    setIsSaving(false);
    setIsOpen(false);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!canCrearTarifas) {
      setError("No tienes permisos para crear tarifas.", "Registro de Tarifas");
      return;
    }

    setSuccess("");
    setError("");
    setIsSaving(true);
    setMostrarErrores(true);

    const nuevosErrores = {};
    if (!nombre) nuevosErrores.nombre = true;
    if (!descripcion) nuevosErrores.descripcion = true;
    if (!fechaInicio) nuevosErrores.fechaInicio = true;

    if (fechaFin && new Date(fechaFin) < new Date(fechaInicio)) {
      setError("La fecha de fin no puede ser anterior a la fecha de inicio.", "Registro de Tarifas");
      setIsSaving(false);
      return;
    }

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
      setError(`Los siguientes campos son obligatorios: ${camposFaltantes.join(", ")}`, "Registro de Tarifas");
      setIsSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await window.tarifasApp.registerTarifa({
        tarifa: {
          nombre,
          descripcion,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin || null,
          modificado_por: id_usuario,
        },
        token_session: token,
      });

      if (response.success) {
        setSuccess("Tarifa registrada correctamente.", "Registro de Tarifas");
        actualizarTarifas();
        if (onTarifaRegistrada) onTarifaRegistrada();
        setTimeout(() => {
          handleCloseModal();
        }, 1000);
      } else {
        setError(response.message || "Error al registrar la tarifa.", "Registro de Tarifas");
      }
    } catch (error) {
      console.error("Error al registrar tarifa:", error);
      setError("Ocurrió un error inesperado al registrar la tarifa.", "Registro de Tarifas");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClasses = (hasError) => `
    w-full text-sm font-medium rounded-xl transition-all duration-200 resize-none px-3
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
        disabled={!canCrearTarifas}
        className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 h-11 shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <HiPlus className="text-lg" />
        Nueva Tarifa
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
              <HiCurrencyDollar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                Registrar Nueva Tarifa
              </h2>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                Define los datos y la vigencia del cobro
              </p>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body>
          <form id="form-registro-tarifa" onSubmit={handleSubmit} className="grid gap-5">
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
                  placeholder="Ej. Tarifa Residencial 2024"
                  value={nombre}
                  onChange={(e) => { setNombre(e.target.value); limpiarError('nombre'); }}
                  className={`${inputClasses(mostrarErrores && erroresCampos.nombre)} pl-10 h-11`}
                />
              </div>
            </div>

            <div>
              <label className={labelClasses}>
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Describe el propósito y características..."
                value={descripcion}
                onChange={(e) => { setDescripcion(e.target.value); limpiarError('descripcion'); }}
                rows={3}
                className={`${inputClasses(mostrarErrores && erroresCampos.descripcion)} py-3 h-auto`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    className={`${inputClasses(mostrarErrores && erroresCampos.fechaInicio)} pl-10 h-11`}
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
                    className={`${inputClasses(false)} pl-10 h-11`}
                  />
                </div>
              </div>
            </div>
          </form>
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
            form="form-registro-tarifa"
            disabled={isSaving}
            className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-8 h-11 shadow-sm flex items-center gap-2 disabled:opacity-70"
          >
            {isSaving && <div className="w-4 h-4 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />}
            {isSaving ? "Guardando..." : "Guardar Tarifa"}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
