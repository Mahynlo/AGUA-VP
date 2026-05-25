import { useEffect, useMemo, useState } from "react";
import { Modal } from "flowbite-react";
import { HiOutlineShieldCheck, HiCheck, HiX } from "react-icons/hi";
import { useUsuarios } from "../../context/UsuariosContext";

const OPTIONS = [
  { key: "inherit", label: "Heredar Rol" },
  { key: "allow", label: "Permitir" },
  { key: "deny", label: "Denegar" }
];

const groupByModule = (permissions) => {
  return permissions.reduce((acc, item) => {
    const key = item.module || "otros";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
};

const permisosModalTheme = {
  root: {
    base: "fixed top-0 right-0 left-0 z-[100000] h-modal h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full",
    show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" }
  },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-3xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-4xl w-full"
  },
  header: {
    base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/80 px-8 pb-4 pt-6 rounded-t-3xl shrink-0",
    close: { base: "absolute top-5 right-5 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
  },
  body: { base: "px-8 py-6 flex-1 overflow-y-auto" },
  footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/80 py-4 px-8 rounded-b-3xl shrink-0" }
};

export default function ModalPermisosUsuario({ isOpen, onClose, usuario }) {
  const { fetchUserPermissions, updateUserPermissions } = useUsuarios();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !usuario?.id) return;
      setLoading(true);
      const data = await fetchUserPermissions(usuario.id);
      setPermissions(data);

      const nextOverrides = {};
      data.forEach((p) => {
        if (p.override === "allow" || p.override === "deny") {
          nextOverrides[p.key] = p.override;
        }
      });
      setOverrides(nextOverrides);
      setLoading(false);
    };

    load();
  }, [isOpen, usuario?.id]);

  const grouped = useMemo(() => groupByModule(permissions), [permissions]);

  const handleChangeOverride = (permissionKey, value) => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (value === "inherit") {
        delete next[permissionKey];
      } else {
        next[permissionKey] = value;
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!usuario?.id) return;
    setSaving(true);
    const payload = Object.entries(overrides).map(([key, effect]) => ({ key, effect }));
    await updateUserPermissions(usuario.id, payload);
    setSaving(false);
    onClose();
  };

  return (
    <Modal
      show={isOpen}
      onClose={onClose}
      theme={permisosModalTheme}
      dismissible={!saving}
    >
      {/* ── HEADER ── */}
      <Modal.Header>
        <div className="flex items-center gap-4 shrink-0">
          <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl shrink-0">
            <HiOutlineShieldCheck className="w-7 h-7" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
              Permisos y Accesos
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mt-1.5 flex items-center gap-2">
              Usuario: <span className="text-purple-600 dark:text-purple-400">{usuario?.nombre}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-700"></span>
              Rol Base: {usuario?.rol}
            </p>
          </div>
        </div>
      </Modal.Header>

      {/* ── BODY ── */}
      <Modal.Body>
        <div className="flex flex-col gap-6">

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
            <p className="text-sm font-bold text-blue-700 dark:text-blue-400 leading-relaxed">
              Los permisos del rol <span className="uppercase tracking-wider">({usuario?.rol})</span> actúan como base. Puedes utilizar las opciones de la derecha para sobrescribir accesos específicos (Permitir/Denegar) exclusivamente para este usuario.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-70">
              <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-600 rounded-full animate-spin mb-4"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Cargando permisos...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {Object.entries(grouped).map(([moduleName, items]) => (
                <div key={moduleName} className="flex flex-col gap-4">

                  {/* Cabecera del Módulo */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-2 px-1">
                    <h4 className="font-black uppercase tracking-widest text-[11px] text-slate-700 dark:text-zinc-300">
                      Módulo: {moduleName}
                    </h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold text-[10px] uppercase tracking-widest">
                      {items.length} permisos
                    </span>
                  </div>

                  {/* Lista de Permisos */}
                  <div className="flex flex-col gap-3">
                    {items.map((perm) => {
                      const selected = overrides[perm.key] || "inherit";
                      return (
                        <div
                          key={perm.key}
                          className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4 items-center p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
                        >
                          <div className="flex flex-col gap-1.5">
                            <div className="text-sm font-black text-slate-800 dark:text-zinc-100 leading-tight">
                              {perm.description || perm.key}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                              {perm.key}
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                                Estado Resultante:
                              </span>
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest ${
                                perm.granted
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-red-500/10 text-red-600 dark:text-red-400"
                              }`}>
                                {perm.granted ? <HiCheck className="w-3 h-3" /> : <HiX className="w-3 h-3" />}
                                {perm.granted ? "Permitido" : "Denegado"}
                              </div>
                              <span className="text-[9px] font-medium text-slate-400 dark:text-zinc-500 italic">
                                (por {perm.source === "role" ? "Rol" : "Usuario"})
                              </span>
                            </div>
                          </div>

                          {/* Select nativo de permisos */}
                          <div className="relative flex items-center">
                            <select
                              aria-label={`Permiso ${perm.key}`}
                              value={selected}
                              onChange={(e) => handleChangeOverride(perm.key, e.target.value)}
                              className="w-full pl-3 pr-8 h-11 rounded-xl font-bold text-sm text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 dark:focus:border-purple-600 transition-all appearance-none cursor-pointer shadow-sm"
                            >
                              {OPTIONS.map((option) => (
                                <option key={option.key} value={option.key}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <svg className="absolute right-3 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal.Body>

      {/* ── FOOTER ── */}
      <Modal.Footer>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 rounded-xl h-11 px-6 text-sm transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 disabled:opacity-60 rounded-xl px-8 h-11 text-sm shadow-sm transition-all active:scale-95"
        >
          {saving && (
            <div className="w-4 h-4 rounded-full border-2 border-white/30 dark:border-zinc-950/30 border-t-white dark:border-t-zinc-950 animate-spin" />
          )}
          {saving ? "Guardando..." : "Guardar Permisos"}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
