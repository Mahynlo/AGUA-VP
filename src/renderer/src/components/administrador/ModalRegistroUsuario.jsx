import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import { useState } from "react";
import FeedbackMessages from "../toast/FeedbackMessages";

export default function ModalRegistrarUsuario() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  // ─── State ──────────────────────────────────────────────────────────
  const [username, setUsername] = useState("");
  const [correo, setCorreo] = useState("");
  const [nombre, setNombre] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [rol, setRol] = useState("operador"); // valor por defecto
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // ─── Registro real ─────────────────────────────────────────────────
  const handleRegistro = async () => {
    setError("");
    setSuccess("");

    // Validaciones
    if (!username || !correo || !contrasena || !confirmarContrasena) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    if (username.includes(" ") || username.length < 4) {
      setError("El nombre de usuario debe tener al menos 4 caracteres y no contener espacios.");
      return;
    }
    if (contrasena.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (contrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    // Llamada API
    try {
      setIsUpdating(true);
      const response = await window.api.register({ correo,nombre, contrasena, username, rol });

      if (response.success) {
        setSuccess("Registro exitoso.");
        setTimeout(() => {
          limpiarCampos();
          onClose();
        }, 1500);
      } else {
        setError(response.message || "No se pudo registrar.");
      }
    } catch (err) {
      setError("Ocurrió un error en el registro. Intenta nuevamente.");
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
    setError("");
    setSuccess("");
  };

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <>
      <Button color="primary" onPress={onOpen}>
        Nuevo Usuario
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="lg"
        backdrop="transparent"
        scrollBehavior="inside"
        isDismissable={!isUpdating}
        isKeyboardDismissDisabled={isUpdating}
        classNames={{
          header:
            "dark:border-b-[1px] dark:border-[#6879bd] border-b-[1px] border-gray-400",
          footer:
            "dark:border-t-[1px] dark:border-[#6879bd] border-t-[1px] border-gray-400",
          closeButton:
            "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
        }}
      >
        <ModalContent>
          {(onCloseModal) => (
            <>
              <ModalHeader className="text-2xl font-bold text-gray-900 bg-gray-300 dark:bg-gray-700 dark:text-white">
                Registrar Usuario
              </ModalHeader>

              <ModalBody className="bg-gray-100 dark:bg-gray-800">
                <FeedbackMessages
                  error={error}
                  success={success}
                  setError={setError}
                  setSuccess={setSuccess}
                />

                {/* Formulario */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRegistro();
                  }}
                  className="grid gap-4"
                >
                  <div>
                    <label className="text-sm font-medium dark:text-white">Nombre</label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Nombre del usuario"
                      className="mt-1 w-full p-2 rounded border border-gray-300 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium dark:text-white">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="mt-1 w-full p-2 rounded border border-gray-300 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium dark:text-white">Correo</label>
                    <input
                      type="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      className="mt-1 w-full p-2 rounded border border-gray-300 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium dark:text-white">Contraseña</label>
                    <input
                      type="password"
                      value={contrasena}
                      onChange={(e) => setContrasena(e.target.value)}
                      className="mt-1 w-full p-2 rounded border border-gray-300 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium dark:text-white">Confirmar contraseña</label>
                    <input
                      type="password"
                      value={confirmarContrasena}
                      onChange={(e) => setConfirmarContrasena(e.target.value)}
                      className="mt-1 w-full p-2 rounded border border-gray-300 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium dark:text-white">Rol</label>
                    <select
                      value={rol}
                      onChange={(e) => setRol(e.target.value)}
                      className="mt-1 w-full p-2 rounded border border-gray-300 dark:bg-neutral-800 dark:text-white"
                    >
                      <option value="operador">Operador</option>
                      <option value="administrador">Administrador</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </div>
                </form>
              </ModalBody>

              <ModalFooter className="bg-gray-300 dark:bg-gray-700">
                <Button
                  color="primary"
                  onClick={handleRegistro}
                  isDisabled={isUpdating}
                >
                  {isUpdating ? "Procesando..." : "Registrar"}
                </Button>
                <Button
                  color="danger"
                  onPress={onCloseModal}
                  isDisabled={isUpdating}
                >
                  Cancelar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
