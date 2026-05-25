import { Modal } from "flowbite-react";
import { useState } from "react";
import { HiUser, HiMail, HiLockClosed, HiShieldCheck, HiBadgeCheck } from "react-icons/hi";
import FeedbackMessages from "../toast/FeedbackMessages";
import { CustomInput } from "../ui/FormComponents";

import { useUsuarios } from "../../context/UsuariosContext";
import { useAuth } from "../../context/AuthContext";

const registroModalTheme = {
  root: {
    base: "fixed top-0 right-0 left-0 z-[100000] h-modal h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full",
    show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" }
  },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-3xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-2xl w-full"
  },
  header: {
    base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/80 px-8 py-6 rounded-t-3xl shrink-0",
    close: { base: "absolute top-5 right-5 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
  },
  body: { base: "px-8 py-8 flex-1 overflow-y-auto" },
  footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/80 px-8 py-6 rounded-b-3xl shrink-0" }
};

export default function ModalRegistrarUsuario({ onUserRegistered }) {
  const { createUser } = useUsuarios();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // ─── State ──────────────────────────────────────────────────────────
  const [username, setUsername] = useState("");
  const [correo, setCorreo] = useState("");
  const [nombre, setNombre] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [rol, setRol] = useState("operador");

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [success, setSuccess] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // ─── Registro real ─────────────────────────────────────────────────
  const handleRegistro = async () => {
    setGeneralError("");
    setSuccess("");
    setFieldErrors({});

    const newErrors = {};

    if (!nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!correo.trim()) newErrors.correo = "El correo es obligatorio";

    if (!username.trim()) {
      newErrors.username = "El usuario es obligatorio";
    } else if (username.includes(" ") || username.length < 4) {
      newErrors.username = "Mínimo 4 caracteres y sin espacios";
    }

    if (!contrasena) {
      newErrors.contrasena = "La contraseña es obligatoria";
    } else {
      if (contrasena.length < 8) {
        newErrors.contrasena = "Mínimo 8 caracteres";
      } else if (!/[A-Z]/.test(contrasena)) {
        newErrors.contrasena = "Requiere al menos una mayúscula";
      } else if (!/[0-9]/.test(contrasena)) {
        newErrors.contrasena = "Requiere al menos un número";
      } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(contrasena)) {
        newErrors.contrasena = "Requiere un carácter especial (@, #, $, etc.)";
      }
    }

    if (contrasena !== confirmarContrasena) {
      newErrors.confirmarContrasena = "Las contraseñas no coinciden";
    }

    const rolesPermitidosPorUsuario = getRolesDisponibles();
    if (!rolesPermitidosPorUsuario.includes(rol)) {
      newErrors.rol = "No tienes permiso para registrar este rol";
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    try {
      setIsUpdating(true);

      await createUser({
        correo,
        nombre,
        contrasena,
        username,
        rol,
        confirmarContrasena
      });

      setSuccess("Usuario registrado exitosamente.");
      setTimeout(() => {
        limpiarCampos();
        setIsOpen(false);
        if (onUserRegistered) onUserRegistered();
      }, 1500);

    } catch (err) {
      setGeneralError(err.message || "Ocurrió un error en el registro.");
    } finally {
      setIsUpdating(false);
    }
  };

  const limpiarCampos = () => {
    setNombre("");
    setUsername("");
    setCorreo("");
    setContrasena("");
    setConfirmarContrasena("");
    setRol("operador");
    setGeneralError("");
    setFieldErrors({});
    setSuccess("");
  };

  const handleClose = () => {
    limpiarCampos();
    setIsOpen(false);
  };

  const getRolesDisponibles = () => {
    if (!user) return ["operador"];
    switch (user.rol) {
      case "superadmin":
        return ["operador", "administrador", "superadmin"];
      case "administrador":
        return ["operador", "administrador"];
      default:
        return ["operador"];
    }
  };

  const rolesDisponibles = getRolesDisponibles();

  if (!rolesDisponibles.includes(rol)) {
    setRol("operador");
  }

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <>
      {/* ── BOTÓN DISPARADOR ── */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 h-[52px] shadow-sm transition-transform active:scale-95 hover:opacity-90"
      >
        <HiUser className="text-lg" />
        Nuevo Usuario
      </button>

      {/* ── MODAL ── */}
      <Modal
        show={isOpen}
        onClose={handleClose}
        theme={registroModalTheme}
        dismissible={!isUpdating}
      >
        {/* ── HEADER ── */}
        <Modal.Header>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl shrink-0">
              <HiUser className="w-7 h-7" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                Registrar Usuario
              </h2>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mt-1">
                Crear un nuevo acceso al sistema
              </p>
            </div>
          </div>
        </Modal.Header>

        {/* ── BODY ── */}
        <Modal.Body>
          <div className="space-y-2">
            <FeedbackMessages
              error={generalError}
              success={success}
              setError={setGeneralError}
              setSuccess={setSuccess}
            />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRegistro();
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4 pt-2"
            >
              <CustomInput
                label="Nombre Completo"
                placeholder="Nombre del personal"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (fieldErrors.nombre) setFieldErrors({ ...fieldErrors, nombre: null });
                }}
                icon={<HiBadgeCheck className="w-5 h-5 text-slate-400 dark:text-zinc-500" />}
                isInvalid={!!fieldErrors.nombre}
                errorMessage={fieldErrors.nombre}
                required
                className="md:col-span-2"
              />

              <CustomInput
                label="Usuario (Login)"
                placeholder="Ej. juan.perez"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: null });
                }}
                icon={<HiUser className="w-5 h-5 text-slate-400 dark:text-zinc-500" />}
                isInvalid={!!fieldErrors.username}
                errorMessage={fieldErrors.username}
                required
              />

              <CustomInput
                label="Correo Electrónico"
                type="email"
                placeholder="contacto@ejemplo.com"
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value);
                  if (fieldErrors.correo) setFieldErrors({ ...fieldErrors, correo: null });
                }}
                icon={<HiMail className="w-5 h-5 text-slate-400 dark:text-zinc-500" />}
                isInvalid={!!fieldErrors.correo}
                errorMessage={fieldErrors.correo}
                required
              />

              <CustomInput
                label="Contraseña"
                type="password"
                placeholder="Mín. 8 chars, 1 Mayús, 1 Num, 1 Símbolo"
                value={contrasena}
                onChange={(e) => {
                  setContrasena(e.target.value);
                  if (fieldErrors.contrasena) setFieldErrors({ ...fieldErrors, contrasena: null });
                }}
                icon={<HiLockClosed className="w-5 h-5 text-slate-400 dark:text-zinc-500" />}
                isInvalid={!!fieldErrors.contrasena}
                errorMessage={fieldErrors.contrasena}
                required
              />

              <CustomInput
                label="Confirmar Contraseña"
                type="password"
                placeholder="••••••••"
                value={confirmarContrasena}
                onChange={(e) => {
                  setConfirmarContrasena(e.target.value);
                  if (fieldErrors.confirmarContrasena) setFieldErrors({ ...fieldErrors, confirmarContrasena: null });
                }}
                icon={<HiLockClosed className="w-5 h-5 text-slate-400 dark:text-zinc-500" />}
                isInvalid={!!fieldErrors.confirmarContrasena}
                errorMessage={fieldErrors.confirmarContrasena}
                required
              />

              {/* ── SELECT DE ROL ── */}
              <div className="md:col-span-2 flex flex-col gap-1.5 mt-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 ml-1">
                  Rol / Permisos <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <HiShieldCheck className="absolute left-3 w-5 h-5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    className="w-full pl-10 pr-4 h-11 rounded-xl font-bold text-sm text-slate-700 dark:text-zinc-200 bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 dark:focus:border-purple-600 transition-all appearance-none cursor-pointer"
                  >
                    {rolesDisponibles.includes("operador") && (
                      <option value="operador">Operador (Básico)</option>
                    )}
                    {rolesDisponibles.includes("administrador") && (
                      <option value="administrador">Administrador (Gestión)</option>
                    )}
                    {rolesDisponibles.includes("superadmin") && (
                      <option value="superadmin">Superadmin (Acceso Total)</option>
                    )}
                  </select>
                  <svg className="absolute right-3 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {fieldErrors.rol && (
                  <p className="text-[11px] font-medium text-red-500 ml-1 mt-0.5">{fieldErrors.rol}</p>
                )}
                <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 ml-1 mt-0.5">
                  Define el nivel de acceso base al sistema.
                </p>
              </div>
            </form>
          </div>
        </Modal.Body>

        {/* ── FOOTER ── */}
        <Modal.Footer>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUpdating}
            className="font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 rounded-xl px-6 h-11 text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleRegistro}
            disabled={isUpdating}
            className="inline-flex items-center gap-2 font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 disabled:opacity-60 rounded-xl px-8 h-11 text-sm shadow-sm transition-all active:scale-95"
          >
            {isUpdating && (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 dark:border-zinc-950/30 border-t-white dark:border-t-zinc-950 animate-spin" />
            )}
            {isUpdating ? "Registrando..." : "Confirmar Registro"}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
