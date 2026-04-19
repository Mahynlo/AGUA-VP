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
  Chip,
  Divider
} from "@nextui-org/react";
import { HiShieldCheck } from "react-icons/hi";
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
        wrapper: "items-start p-1 sm:p-2 pt-16 sm:pt-20 overflow-y-hidden",
        backdrop: "bg-slate-900/40",
        base: "bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-2xl h-[calc(100dvh-4.25rem)] sm:h-[calc(100dvh-5.25rem)] max-h-[calc(100dvh-4.25rem)] sm:max-h-[calc(100dvh-5.25rem)]",
        header: "border-b border-slate-100 dark:border-zinc-800/50 pb-4 pt-6 px-8",
        body: "px-8 py-6 flex-1 min-h-0",
        footer: "border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8"
      }}
    >
      <ModalContent className="h-full">
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl">
              <HiShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">Permisos de Usuario</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400">{usuario?.nombre} ({usuario?.rol})</p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="custom-scrollbar">
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-2">
            Los permisos del rol son la base. Puedes sobrescribirlos por usuario con Permitir o Denegar.
          </p>

          {loading ? (
            <div className="text-sm text-slate-500 dark:text-zinc-400">Cargando permisos...</div>
          ) : (
            Object.entries(grouped).map(([moduleName, items]) => (
              <div key={moduleName} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-extrabold uppercase tracking-wider text-xs text-slate-700 dark:text-zinc-300">{moduleName}</h4>
                  <Chip size="sm" variant="flat" className="text-[10px]">{items.length} permisos</Chip>
                </div>

                <div className="space-y-2">
                  {items.map((perm) => {
                    const selected = overrides[perm.key] || "inherit";
                    return (
                      <div key={perm.key} className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-2 items-center p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40">
                        <div>
                          <div className="text-sm font-bold text-slate-800 dark:text-zinc-100">{perm.description || perm.key}</div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400">{perm.key}</div>
                          <div className="text-[11px] mt-1 text-slate-500 dark:text-zinc-400">Estado actual: <span className="font-semibold">{perm.granted ? "Permitido" : "Denegado"}</span> ({perm.source})</div>
                        </div>

                        <Select
                          aria-label={`Permiso ${perm.key}`}
                          selectedKeys={[selected]}
                          onChange={(e) => handleChangeOverride(perm.key, e.target.value)}
                          size="sm"
                          classNames={{
                            trigger: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg",
                            value: "font-semibold"
                          }}
                        >
                          {OPTIONS.map((option) => (
                            <SelectItem key={option.key} value={option.key}>{option.label}</SelectItem>
                          ))}
                        </Select>
                      </div>
                    );
                  })}
                </div>
                <Divider className="mt-4" />
              </div>
            ))
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            variant="flat"
            onPress={onClose}
            className="font-bold text-slate-600 dark:text-zinc-300 bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800"
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSave}
            isLoading={saving}
            className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950"
          >
            Guardar Permisos
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
