import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import { useState, useEffect } from "react";
import { useAuth } from '../../../context/AuthContext';
import { useTarifas } from '../../../context/TarifasContext';

export default function EditarTarifa({ tarifa, onTarifaEditada }) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { user } = useAuth();
  const { actualizarTarifas } = useTarifas();

  const [nombre, setNombre] = useState(tarifa.nombre);
  const [descripcion, setDescripcion] = useState(tarifa.descripcion || "");
  const [fechaInicio, setFechaInicio] = useState(tarifa.fecha_inicio || "");
  const [fechaFin, setFechaFin] = useState(tarifa.fecha_fin || "");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const id_usuario = user?.id || null;

  useEffect(() => {
    if (!isOpen) {
      setNombre(tarifa.nombre);
      setDescripcion(tarifa.descripcion || "");
      setFechaInicio(tarifa.fecha_inicio || "");
      setFechaFin(tarifa.fecha_fin || "");
      setSuccess("");
      setError("");
      setIsSaving(false);
    }
  }, [isOpen, tarifa]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setIsSaving(true);

    if (!nombre || !fechaInicio) {
      setError("El nombre y la fecha de inicio son obligatorios.");
      setIsSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await window.tarifasApp.updateTarifa({
        id: tarifa.id,
        nuevosDatos: {
          nombre,
          descripcion,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin || null,
          modificado_por: id_usuario,
        },
        token_session: token,
      });

      if (response.success) {
        setSuccess("Tarifa actualizada correctamente.");
        setTimeout(() => {
          onClose();
          actualizarTarifas();
          setIsSaving(false);
          onTarifaEditada?.();
        }, 1500);
      } else {
        setError(response.message || "No se pudo actualizar la tarifa.");
        setIsSaving(false);
      }
    } catch (err) {
      console.error(err);
      setError("Error al actualizar la tarifa.");
      setIsSaving(false);
    }
  };

  // Clases compartidas para los inputs (Token 4)
  const inputClasses = "w-full bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 transition-all duration-200 shadow-none px-3 text-sm font-medium text-slate-800 dark:text-zinc-100";
  const labelClasses = "block mb-1.5 ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400";

  return (
    <>
      <Button
        variant="flat"
        className="font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-xl px-6 ml-2"
        onPress={onOpen}
      >
        Editar Configuración
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="lg"
        scrollBehavior="inside"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        /* Token 2: Modal Premium SaaS */
        classNames={{
          backdrop: "bg-slate-900/40 backdrop-blur-sm",
          base: "bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-2xl",
          header: "border-b border-slate-100 dark:border-zinc-800/50 pb-4 pt-6 px-8 flex flex-col gap-1",
          body: "px-8 py-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent",
          footer: "border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8",
          closeButton: "hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 text-slate-400 p-2 top-4 right-4"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {/* Token 3: Textos Principales */}
                <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                  Editar Tarifa
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                  Modifica los datos generales y la vigencia
                </p>
              </ModalHeader>
              
              <ModalBody>
                {/* Regla de tintes para alertas */}
                {success && (
                  <div className="p-4 mb-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    {success}
                  </div>
                )}
                {error && (
                  <div className="p-4 mb-2 text-sm font-bold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                    {error}
                  </div>
                )}

                <form id="form-editar-tarifa" onSubmit={handleSubmit} className="grid gap-5">
                  <div>
                    <label className={labelClasses}>
                      Nombre de la Tarifa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`${inputClasses} h-11`}
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                      placeholder="Ej. Residencial, Comercial..."
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>
                      Descripción
                    </label>
                    <textarea
                      className={`${inputClasses} py-3 h-32 resize-none`}
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Detalles adicionales sobre esta tarifa..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>
                        Fecha de Inicio <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        className={`${inputClasses} h-11`}
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className={labelClasses}>
                        Fecha de Fin <span className="text-slate-400 font-normal lowercase">(Opcional)</span>
                      </label>
                      <input
                        type="date"
                        className={`${inputClasses} h-11`}
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                      />
                    </div>
                  </div>
                </form>
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="light"
                  onPress={onClose}
                  className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6"
                >
                  Cancelar
                </Button>
                {/* Token 4: Botón Primario */}
                <Button
                  type="submit"
                  form="form-editar-tarifa" // Vinculado al form mediante ID para accesibilidad y evitar onClick redundant
                  isLoading={isSaving}
                  className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-8 shadow-sm"
                >
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
