import { Modal } from "flowbite-react";
import { useState, useEffect } from "react";
import { HiPlus } from "react-icons/hi";

const premiumModalTheme = {
    root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" } },
    content: {
        base: "relative h-full w-full p-4 md:h-auto",
        inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-2xl w-full"
    },
    header: {
        base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/50 px-8 py-6 rounded-t-2xl shrink-0",
        close: { base: "absolute top-6 right-6 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
    },
    body: { base: "px-8 py-6 flex-1 overflow-y-auto" },
    footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8 rounded-b-2xl shrink-0" }
};

export default function EditarRangosTarifa({ tarifaId, rangosIniciales = [], onGuardado }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rangos, setRangos] = useState([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRangos(rangosIniciales.map(r => ({ ...r })));
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
          id: r.id || null,
          consumo_min: parseFloat(r.consumo_min),
          consumo_max: parseFloat(r.consumo_max),
          precio_por_m3: parseFloat(r.precio_por_m3),
        })),
        token_session: token
      });

      if (response.success) {
        setSuccess("Rangos actualizados correctamente.");
        setTimeout(() => {
          setIsOpen(false);
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

  const inputClasses = "w-full bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 transition-all duration-200 shadow-none h-11 px-3 text-sm font-medium text-slate-800 dark:text-zinc-100";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-xl px-6 h-10 flex items-center"
      >
        Editar Rangos
      </button>

      <Modal
        show={isOpen}
        onClose={() => setIsOpen(false)}
        theme={premiumModalTheme}
        dismissible={false}
      >
        <Modal.Header>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
            Editar Estructura de Precios
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
            Configura los bloques de consumo y sus valores asociados
          </p>
        </Modal.Header>

        <Modal.Body>
          {success && (
            <div className="p-4 mb-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              {success}
            </div>
          )}
          {error && (
            <div className="p-4 mb-4 text-sm font-bold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
              {error}
            </div>
          )}

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-3 px-2 w-1/3">
                    Min. (m³)
                  </th>
                  <th className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-3 px-2 w-1/3">
                    Máx. (m³)
                  </th>
                  <th className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-3 px-2 w-1/3">
                    Precio ($/m³)
                  </th>
                </tr>
              </thead>
              <tbody>
                {rangos.map((rango, index) => (
                  <tr key={rango.id || index}>
                    <td className="border-b border-slate-100 dark:border-zinc-800/50 py-3 px-2">
                      <input
                        type="number"
                        className={inputClasses}
                        placeholder="0"
                        value={rango.consumo_min}
                        onChange={e => handleChange(index, "consumo_min", e.target.value)}
                      />
                    </td>
                    <td className="border-b border-slate-100 dark:border-zinc-800/50 py-3 px-2">
                      <input
                        type="number"
                        className={inputClasses}
                        placeholder="Ej. 10"
                        value={rango.consumo_max}
                        onChange={e => handleChange(index, "consumo_max", e.target.value)}
                      />
                    </td>
                    <td className="border-b border-slate-100 dark:border-zinc-800/50 py-3 px-2">
                      <input
                        type="number"
                        step="0.01"
                        className={inputClasses}
                        placeholder="0.00"
                        value={rango.precio_por_m3}
                        onChange={e => handleChange(index, "precio_por_m3", e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={agregarRango}
              className="w-full font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl h-11 flex items-center justify-center gap-2 hover:bg-blue-500/20 transition-colors"
            >
              <HiPlus className="text-lg" />
              Agregar Nuevo Rango
            </button>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6 h-11"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
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
