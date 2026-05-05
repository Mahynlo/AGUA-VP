import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure
} from "@nextui-org/react";
import { HiCurrencyDollar, HiPlus, HiCalendar } from "react-icons/hi";
import { useState } from "react";
import { useAuth } from '../../../context/AuthContext';
import { useTarifas } from '../../../context/TarifasContext';
import { usePermissions } from '../../../context/PermissionsContext';
import { useFeedback } from "../../../context/FeedbackContext";

export default function RegistrarTarifa({ onTarifaRegistrada }) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { user } = useAuth();
  const { actualizarTarifas } = useTarifas();
  const { can } = usePermissions();
  const canCrearTarifas = can("tarifas.crear");

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [erroresCampos, setErroresCampos] = useState({});
  const [mostrarErrores, setMostrarErrores] = useState(false);

  const { setSuccess, setError } = useFeedback();

  const id_usuario = user?.id || null;

  const limpiarError = (campo) => {
    if (erroresCampos[campo]) {
      setErroresCampos(prev => ({ ...prev, [campo]: false }));
    }
  };

  const handleCloseModal = () => {
    setNombre("");
    setDescripcion("");
    setFechaInicio("");
    setFechaFin("");
    setErroresCampos({});
    setMostrarErrores(false);
    setIsSaving(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!canCrearTarifas) {
      setError("No tienes permisos para crear tarifas.", "Registro de Tarifas");
      return;
    }

    setSuccess("");
    setError("");
    setIsSaving(true);
    setMostrarErrores(true);

    const nuevosErrores = {};
    if (!nombre) nuevosErrores.nombre = true;
    if (!descripcion) nuevosErrores.descripcion = true;
    if (!fechaInicio) nuevosErrores.fechaInicio = true;

    if (fechaFin && new Date(fechaFin) < new Date(fechaInicio)) {
      setError("La fecha de fin no puede ser anterior a la fecha de inicio.", "Registro de Tarifas");
      setIsSaving(false);
      return;
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresCampos(nuevosErrores);
      const camposFaltantes = Object.keys(nuevosErrores).map((campo) => {
        switch (campo) {
          case "nombre": return "Nombre";
          case "descripcion": return "Descripción";
          case "fechaInicio": return "Fecha de Inicio";
          default: return campo;
        }
      });
      setError(`Los siguientes campos son obligatorios: ${camposFaltantes.join(", ")}`, "Registro de Tarifas");
      setIsSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await window.tarifasApp.registerTarifa({
        tarifa: {
          nombre,
          descripcion,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin || null,
          modificado_por: id_usuario,
        },
        token_session: token,
      });

      if (response.success) {
        setSuccess("Tarifa registrada correctamente.", "Registro de Tarifas");
        actualizarTarifas();
        if (onTarifaRegistrada) onTarifaRegistrada();
        setTimeout(() => {
          handleCloseModal();
        }, 1000);
      } else {
        setError(response.message || "Error al registrar la tarifa.", "Registro de Tarifas");
      }
    } catch (error) {
      console.error("Error al registrar tarifa:", error);
      setError("Ocurrió un error inesperado al registrar la tarifa.", "Registro de Tarifas");
    } finally {
      setIsSaving(false);
    }
  };

  // Clases estandarizadas (Token 4)
  const inputClasses = (hasError) => `
    w-full text-sm font-medium rounded-xl transition-all duration-200 resize-none px-3
    ${hasError 
      ? 'bg-red-50/50 dark:bg-red-900/10 border border-red-300 dark:border-red-800/50 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-red-900 dark:text-red-200' 
      : 'bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 focus:border-slate-400 dark:focus:border-zinc-500 text-slate-800 dark:text-zinc-100'
    }
    focus:outline-none shadow-none
  `;

  const labelClasses = "block mb-1.5 ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400";

  return (
    <>
      <Button
        aria-label="Registrar Tarifa"
        onPress={onOpen}
        isDisabled={!canCrearTarifas}
        /* Token 4: Botón Primario */
        className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 shadow-sm"
        startContent={<HiPlus className="text-lg" />}
      >
        Nueva Tarifa
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onClose={handleCloseModal}
        size="4xl"
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
              {/* ── HEADER ── */}
              <ModalHeader>
                <div className="flex items-center gap-4">
                  {/* Regla de tintes */}
                  <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                    <HiCurrencyDollar className="w-6 h-6" />
                  </div>
                  <div>
                    {/* Token 3 */}
                    <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                      Registrar Nueva Tarifa
                    </h2>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                      Define los datos y la vigencia del cobro
                    </p>
                  </div>
                </div>
              </ModalHeader>

              {/* ── BODY ── */}
              <ModalBody>
                <form 
                  id="form-registro-tarifa" 
                  onSubmit={handleSubmit} 
                  className="grid gap-5"
                >
                  <div>
                    <label className={labelClasses}>
                      Nombre de la Tarifa <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <HiCurrencyDollar className="w-5 h-5" />
                      </span>
                      <input
                        type="text"
                        placeholder="Ej. Tarifa Residencial 2024"
                        value={nombre}
                        onChange={(e) => { setNombre(e.target.value); limpiarError('nombre'); }}
                        className={`${inputClasses(mostrarErrores && erroresCampos.nombre)} pl-10 h-11`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>
                      Descripción <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      placeholder="Describe el propósito y características..."
                      value={descripcion}
                      onChange={(e) => { setDescripcion(e.target.value); limpiarError('descripcion'); }}
                      rows={3}
                      className={`${inputClasses(mostrarErrores && erroresCampos.descripcion)} py-3 h-auto`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>
                        Fecha de Inicio <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <HiCalendar className="w-5 h-5" />
                        </span>
                        <input
                          type="date"
                          value={fechaInicio}
                          onChange={(e) => { setFechaInicio(e.target.value); limpiarError('fechaInicio'); }}
                          className={`${inputClasses(mostrarErrores && erroresCampos.fechaInicio)} pl-10 h-11`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClasses}>
                        Fecha de Fin <span className="font-normal text-slate-400 lowercase">(Opcional)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <HiCalendar className="w-5 h-5" />
                        </span>
                        <input
                          type="date"
                          value={fechaFin}
                          onChange={(e) => setFechaFin(e.target.value)}
                          className={`${inputClasses(false)} pl-10 h-11`}
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </ModalBody>

              {/* ── FOOTER ── */}
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={handleCloseModal}
                  isDisabled={isSaving}
                  className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6"
                >
                  Cancelar
                </Button>
                {/* Token 4: Botón Primario */}
                <Button
                  type="submit"
                  form="form-registro-tarifa"
                  isDisabled={isSaving}
                  isLoading={isSaving}
                  className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-8 shadow-sm"
                >
                  {isSaving ? "Guardando..." : "Guardar Tarifa"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}