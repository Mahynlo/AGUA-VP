import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Select,
  SelectItem
} from "@nextui-org/react";
import { useState } from "react";
import { HiUser, HiMail, HiLockClosed, HiShieldCheck, HiBadgeCheck } from "react-icons/hi";
import FeedbackMessages from "../toast/FeedbackMessages";
import { CustomInput } from "../ui/FormComponents";

// Changed Import: Use UsuariosContext instead of AuthContext
import { useUsuarios } from "../../context/UsuariosContext";

export default function ModalRegistrarUsuario({ onUserRegistered }) {
  const { createUser } = useUsuarios();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  // ─── State ──────────────────────────────────────────────────────────
  const [username, setUsername] = useState("");
  const [correo, setCorreo] = useState("");
  const [nombre, setNombre] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [rol, setRol] = useState("operador"); // valor por defecto

  // Validation state
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

    // Validaciones
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

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      // setGeneralError("Por favor corrige los errores antes de continuar.");
      return;
    }

    // Llamada API
    try {
      setIsUpdating(true);

      // Usamos createUser del contexto (ya maneja token internamente)
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
        onClose();
        if (onUserRegistered) onUserRegistered(); // Refrescar lista si se pasa prop
      }, 1500);

    } catch (err) {
      // El error ya se muestra en toast por el context, pero también lo mostramos local
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
    onClose();
  }

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <>
      <Button
        color="default"
        onPress={onOpen}
        startContent={<HiUser className="w-5 h-5" />}
        className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 shadow-sm"
      >
        Nuevo Usuario
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="2xl"
        backdrop="blur"
        scrollBehavior="inside"
        isDismissable={!isUpdating}
        isKeyboardDismissDisabled={isUpdating}
        classNames={{
          wrapper: "items-start p-1 sm:p-2 pt-16 sm:pt-20 overflow-y-hidden",
          backdrop: "bg-slate-900/40 backdrop-blur-sm",
          base: "bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-2xl h-[calc(100dvh-4.25rem)] sm:h-[calc(100dvh-5.25rem)] max-h-[calc(100dvh-4.25rem)] sm:max-h-[calc(100dvh-5.25rem)]",
          header: "border-b border-slate-100 dark:border-zinc-800/50 pb-4 pt-6 px-8",
          body: "px-8 py-6 flex-1 min-h-0",
          footer: "border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8",
          closeButton: "hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 text-slate-400 p-2 top-4 right-4"
        }}
        onClose={handleClose}
      >
        <ModalContent className="h-full">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl">
                    <HiUser className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                      Registrar Usuario
                    </span>
                    <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                      Crear un nuevo acceso al sistema
                    </span>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody className="space-y-4 custom-scrollbar">
                <FeedbackMessages
                  error={generalError}
                  success={success}
                  setError={setGeneralError}
                  setSuccess={setSuccess}
                />

                {/* Formulario */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRegistro();
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <CustomInput
                    label="Nombre Completo"
                    placeholder="Nombre del personal"
                    value={nombre}
                    onChange={(e) => {
                      setNombre(e.target.value);
                      if (fieldErrors.nombre) setFieldErrors({ ...fieldErrors, nombre: null });
                    }}
                    icon={<HiBadgeCheck className="w-5 h-5 text-gray-400" />}
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
                    icon={<HiUser className="w-5 h-5 text-gray-400" />}
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
                    icon={<HiMail className="w-5 h-5 text-gray-400" />}
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
                    icon={<HiLockClosed className="w-5 h-5 text-gray-400" />}
                    isInvalid={!!fieldErrors.contrasena}
                    errorMessage={fieldErrors.contrasena}
                    required
                  />

                  <CustomInput
                    label="Confirmar Contraseña"
                    type="password"
                    placeholder="••••••"
                    value={confirmarContrasena}
                    onChange={(e) => {
                      setConfirmarContrasena(e.target.value);
                      if (fieldErrors.confirmarContrasena) setFieldErrors({ ...fieldErrors, confirmarContrasena: null });
                    }}
                    icon={<HiLockClosed className="w-5 h-5 text-gray-400" />}
                    isInvalid={!!fieldErrors.confirmarContrasena}
                    errorMessage={fieldErrors.confirmarContrasena}
                    required
                  />

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1.5 block">
                      Rol / Permisos <span className="text-red-500">*</span>
                    </label>
                    <Select
                      selectedKeys={[rol]}
                      onChange={(e) => setRol(e.target.value)}
                      placeholder="Selecciona el rol"
                      startContent={<HiShieldCheck className="text-slate-400 dark:text-zinc-500 text-lg" />}
                      classNames={{
                        trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-none h-[52px]",
                        value: "text-sm font-medium text-slate-700 dark:text-zinc-200",
                        listboxWrapper: "bg-white dark:bg-zinc-950"
                      }}
                      className="w-full"
                    >
                      <SelectItem key="operador" value="operador">Operador (Básico)</SelectItem>
                      <SelectItem key="administrador" value="administrador">Administrador (Gestión)</SelectItem>
                      <SelectItem key="superadmin" value="superadmin">Superadmin (Acceso Total)</SelectItem>
                    </Select>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Define el nivel de acceso al sistema.</p>
                  </div>

                </form>
              </ModalBody>

              <ModalFooter>
                <Button
                  color="default"
                  variant="flat"
                  onPress={handleClose}
                  isDisabled={isUpdating}
                  className="font-bold text-slate-600 dark:text-zinc-300 bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800"
                >
                  Cancelar
                </Button>
                <Button
                  color="default"
                  onPress={handleRegistro}
                  isLoading={isUpdating}
                  className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 shadow-sm"
                >
                  {isUpdating ? "Registrando..." : "Confirmar Registro"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
