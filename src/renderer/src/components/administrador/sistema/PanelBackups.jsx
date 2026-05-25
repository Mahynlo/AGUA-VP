import { useState, useEffect, useCallback } from "react";
import { Modal } from "flowbite-react";
import {
  HiExclamationCircle, HiSave, HiRefresh, HiDatabase,
  HiClock, HiDownload
} from "react-icons/hi";
import { useFeedback } from "../../../context/FeedbackContext";
import { formatSize, formatDate } from "../../../utils/formatSystem";

const backupModalTheme = {
  root: {
    base: "fixed top-0 right-0 left-0 z-[100000] h-modal h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full",
    show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" }
  },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-3xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-lg w-full"
  },
  header: {
    base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/80 px-6 py-5 rounded-t-3xl shrink-0",
    close: { base: "absolute top-5 right-5 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
  },
  body: { base: "px-6 py-5 flex-1 overflow-y-auto" },
  footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/80 px-6 py-4 rounded-b-3xl shrink-0" }
};

const extraerRazon = (nombre) => {
  if (!nombre) return "—";
  if (nombre.includes("pre-update"))  return "Pre-actualización";
  if (nombre.includes("pre-arranque")) return "Pre-arranque";
  if (nombre.includes("pre-restore")) return "Pre-restauración";
  if (nombre.includes("manual"))      return "Manual";
  return "Automático";
};

const RAZON_COLOR = (nombre) => {
  if (!nombre) return "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400";
  if (nombre.includes("manual"))      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  if (nombre.includes("pre-update"))  return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
  if (nombre.includes("pre-restore")) return "bg-red-500/10 text-red-600 dark:text-red-400";
  return "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400";
};

export default function PanelBackups() {
  const { setSuccess, setError } = useFeedback();
  const [backups, setBackups] = useState([]);
  const [config, setConfig] = useState({ maxBackups: 5 });
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [backupSeleccionado, setBackupSeleccionado] = useState(null);
  const [maxBackupsInput, setMaxBackupsInput] = useState("5");
  const [confirmText, setConfirmText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cargarBackups = useCallback(async () => {
    try {
      setCargando(true);
      const [listResult, configResult] = await Promise.all([
        window.api.system.listBackups(),
        window.api.system.getBackupConfig(),
      ]);
      if (listResult?.success) setBackups(listResult.backups || []);
      if (configResult?.success) {
        const cfg = configResult.config || configResult;
        setConfig(cfg);
        setMaxBackupsInput(String(cfg.maxBackups || 5));
      }
    } catch (err) {
      console.error("Error cargando backups:", err);
      setError("No se pudo cargar la lista de backups", "Backups");
    } finally {
      setCargando(false);
    }
  }, [setError]);

  useEffect(() => { cargarBackups(); }, [cargarBackups]);

  const crearBackup = async () => {
    try {
      setCreando(true);
      const result = await window.api.system.createBackup();
      if (result?.success) {
        setSuccess("Backup creado exitosamente", "Backups");
        cargarBackups();
      } else {
        setError(result?.error || "No se pudo crear el backup", "Backups");
      }
    } catch (err) {
      setError("Error al crear el backup", "Backups");
    } finally {
      setCreando(false);
    }
  };

  const abrirRestauracion = (backup) => {
    setBackupSeleccionado(backup);
    setConfirmText("");
    setIsModalOpen(true);
  };

  const ejecutarRestauracion = async () => {
    if (confirmText !== "RESTAURAR") return;
    try {
      setRestaurando(true);
      const userToken = localStorage.getItem("token");
      const result = await window.api.system.restoreBackup(backupSeleccionado.path, userToken);
      if (result?.success) {
        setSuccess("Backup restaurado exitosamente", "Backups");
        setIsModalOpen(false);
        cargarBackups();
      } else {
        setError(result?.error || "Error al restaurar el backup", "Backups");
      }
    } catch (err) {
      setError("Error inesperado al restaurar el backup", "Backups");
    } finally {
      setRestaurando(false);
    }
  };

  const guardarConfig = async () => {
    const num = parseInt(maxBackupsInput, 10);
    if (isNaN(num) || num < 1 || num > 50) return;
    try {
      const result = await window.api.system.updateBackupConfig({ maxBackups: num });
      if (result?.success) {
        setConfig((prev) => ({ ...prev, maxBackups: num }));
        setSuccess(`Límite actualizado a ${num} backups`, "Backups");
      } else {
        setError("No se pudo guardar la configuración", "Backups");
      }
    } catch (err) {
      setError("Error al guardar la configuración", "Backups");
    }
  };

  return (
    <div className="space-y-5 w-full">

      {/* ── ACCIONES ── */}
      <div className="flex flex-wrap items-center gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
        <button
          type="button"
          onClick={crearBackup}
          disabled={creando}
          className="inline-flex items-center gap-2 font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 rounded-xl px-5 h-10 text-sm shadow-sm transition-all active:scale-95"
        >
          {creando
            ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Creando...</>
            : <><HiSave className="w-4 h-4" />Crear Backup Manual</>
          }
        </button>

        <div className="w-px h-8 bg-slate-200 dark:bg-zinc-700" />

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600 dark:text-zinc-400">Máx. backups:</span>
          <input
            type="number"
            min={1}
            max={50}
            value={maxBackupsInput}
            onChange={(e) => setMaxBackupsInput(e.target.value)}
            className="w-20 px-3 h-9 rounded-xl text-sm font-bold text-center bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          />
          <button
            type="button"
            onClick={guardarConfig}
            disabled={parseInt(maxBackupsInput, 10) === config.maxBackups}
            className="font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 disabled:opacity-40 rounded-xl px-4 h-9 text-sm transition-colors"
          >
            Guardar
          </button>
        </div>

        <span className="ml-auto text-[11px] font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
          {backups.length} backup{backups.length !== 1 ? "s" : ""} almacenado{backups.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── TABLA DE BACKUPS ── */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-14 gap-4">
            <div className="w-8 h-8 rounded-full border-4 border-slate-300/50 border-t-slate-600 dark:border-zinc-700/50 dark:border-t-zinc-400 animate-spin" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Cargando backups...</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <div className="p-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl border border-slate-100 dark:border-zinc-700">
              <HiDatabase className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
            </div>
            <p className="font-bold text-slate-700 dark:text-zinc-300">No hay backups disponibles</p>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Crea uno con el botón de arriba.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-zinc-800">
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Fecha</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Razón</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Tamaño</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 hidden md:table-cell">Archivo</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {backups.map((backup, i) => (
                <tr key={backup.path || i} className="border-b border-slate-50 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300 font-medium">
                      <HiClock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                      {formatDate(backup.created || backup.name?.match(/\d{4}-\d{2}-\d{2}/)?.[0])}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${RAZON_COLOR(backup.name)}`}>
                      {extraerRazon(backup.name)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-slate-700 dark:text-zinc-200">{formatSize(backup.size)}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono truncate max-w-[200px] block">
                      {backup.name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      title="Restaurar este backup (operación destructiva)"
                      onClick={() => abrirRestauracion(backup)}
                      className="inline-flex items-center gap-1.5 font-bold text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20 rounded-lg px-3 h-7 transition-colors"
                    >
                      <HiRefresh className="w-3.5 h-3.5" />
                      Restaurar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── MODAL DE CONFIRMACIÓN DE RESTAURACIÓN ── */}
      <Modal
        show={isModalOpen}
        onClose={() => !restaurando && setIsModalOpen(false)}
        theme={backupModalTheme}
        dismissible={!restaurando}
      >
        <Modal.Header>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 rounded-xl shrink-0">
              <HiExclamationCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100 leading-tight">
                Confirmar Restauración
              </h3>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mt-0.5">
                Operación destructiva e irreversible
              </p>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body>
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">
              Estás a punto de restaurar la base de datos desde:
            </p>
            <div className="px-3 py-2 bg-slate-100 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700">
              <p className="font-mono text-xs text-slate-700 dark:text-zinc-200 break-all">{backupSeleccionado?.name}</p>
            </div>

            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-200 dark:border-red-900/40">
              <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-2">¡ADVERTENCIA! Esta operación:</p>
              <ul className="space-y-1">
                {[
                  "Detendrá el servidor API temporalmente",
                  "Reemplazará TODOS los datos de la base de datos actual",
                  "Se creará un backup de seguridad antes de restaurar",
                  "No se puede deshacer",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                    <span className="text-red-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200 mb-2">
                Escribe <span className="font-black text-red-600 dark:text-red-400">RESTAURAR</span> para confirmar:
              </p>
              <input
                type="text"
                placeholder="Escribe RESTAURAR"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className={`w-full px-4 h-11 rounded-xl text-sm font-bold bg-slate-50 dark:bg-zinc-800 border-2 transition-colors focus:outline-none ${
                  confirmText === "RESTAURAR"
                    ? "border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400"
                    : "border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200"
                }`}
              />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            disabled={restaurando}
            className="font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 rounded-xl px-6 h-10 text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={ejecutarRestauracion}
            disabled={confirmText !== "RESTAURAR" || restaurando}
            className="inline-flex items-center gap-2 font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 rounded-xl px-6 h-10 text-sm shadow-sm transition-all active:scale-95"
          >
            {restaurando && (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            )}
            {restaurando ? "Restaurando..." : "Restaurar Backup"}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
