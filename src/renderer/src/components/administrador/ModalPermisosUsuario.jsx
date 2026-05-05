import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Chip
} from "@nextui-org/react";
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
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      backdrop="blur"
      scrollBehavior="inside"
      classNames={{
        wrapper: "items-start sm:items-center p-2 sm:p-4",
        backdrop: "bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm",
        base: "bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-2xl h-[calc(100dvh-4.25rem)] sm:h-[calc(100dvh-5.25rem)]",
        header: "border-b border-slate-100 dark:border-zinc-800/80 pb-4 pt-6 px-8",
        body: "px-8 py-6 flex-1 min-h-0 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent",
        footer: "border-t border-slate-100 dark:border-zinc-800/80 py-4 px-8",
        closeButton: "hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 text-slate-400 p-2 top-6 right-6 rounded-xl transition-colors",
      }}
    >
      <ModalContent className="h-full">
        {(onClose) => (
          <>
            {/* ── HEADER DEL MODAL ── */}
            <ModalHeader>
              <div className="flex items-center gap-4 shrink-0">
                {/* Regla de Tintes: Púrpura para Seguridad/Administración */}
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
            </ModalHeader>

            {/* ── CUERPO DEL MODAL ── */}
            <ModalBody>
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
                          <Chip size="sm" variant="flat" className="bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold text-[10px] uppercase tracking-widest px-2 rounded-md">
                            {items.length} permisos
                          </Chip>
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
                                    {/* Regla de Tintes para el estado del permiso */}
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

                                {/* Select Premium (Invisible Input) */}
                                <Select
                                  aria-label={`Permiso ${perm.key}`}
                                  selectedKeys={[selected]}
                                  onChange={(e) => handleChangeOverride(perm.key, e.target.value)}
                                  className="w-full"
                                  classNames={{
                                    trigger: "h-11 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 transition-all focus:ring-2 focus:ring-purple-500/20",
                                    value: "font-bold text-sm text-slate-700 dark:text-zinc-200",
                                  }}
                                >
                                  {OPTIONS.map((option) => (
                                    <SelectItem key={option.key} value={option.key} className="font-semibold text-slate-700 dark:text-zinc-200">
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </Select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ModalBody>

            {/* ── FOOTER Y ACCIONES ── */}
            <ModalFooter className="flex justify-end gap-3">
              <Button
                variant="light"
                onPress={onClose}
                isDisabled={saving}
                className="font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl h-11 px-6"
              >
                Cancelar
              </Button>
              {/* Token 4: Botón Maestro de Acción */}
              <Button
                onPress={handleSave}
                isLoading={saving}
                className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-8 h-11 shadow-sm transition-transform active:scale-95"
              >
                {saving ? "Guardando..." : "Guardar Permisos"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
