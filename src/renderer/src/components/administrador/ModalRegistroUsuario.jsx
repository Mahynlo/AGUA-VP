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
        color="primary"
        onPress={onOpen}
        startContent={<HiUser className="w-5 h-5" />}
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
          backdrop: "bg-gradient-to-t mt-18 from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
          closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white"
        }}
        onClose={handleClose}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full">
                    <HiUser className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-gray-800 dark:text-white">
                      Registrar Usuario
                    </span>
                    <span className="text-sm font-normal text-gray-500">
                      Crear un nuevo acceso al sistema
                    </span>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody className="py-6 space-y-4">
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
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      Rol / Permisos <span className="text-red-500">*</span>
                    </label>
                    <Select
                      selectedKeys={[rol]}
                      onChange={(e) => setRol(e.target.value)}
                      placeholder="Selecciona el rol"
                      startContent={<HiShieldCheck className="text-gray-400 text-lg" />}
                      className="w-full"
                    >
                      <SelectItem key="operador" value="operador">Operador (Básico)</SelectItem>
                      <SelectItem key="administrador" value="administrador">Administrador (Gestión)</SelectItem>
                      <SelectItem key="superadmin" value="superadmin">Superadmin (Acceso Total)</SelectItem>
                    </Select>
                    <p className="text-xs text-gray-400 mt-1">Define el nivel de acceso al sistema.</p>
                  </div>

                </form>
              </ModalBody>

              <ModalFooter className="border-t border-gray-200 dark:border-zinc-800">
                <Button
                  color="danger"
                  variant="light"
                  onPress={handleClose}
                  isDisabled={isUpdating}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleRegistro}
                  isLoading={isUpdating}
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
