import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure
} from "@nextui-org/react";
import { useState, useEffect } from "react";
import { HiPlus } from "react-icons/hi";

export default function EditarRangosTarifa({ tarifaId, rangosIniciales = [], onGuardado }) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [rangos, setRangos] = useState([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRangos(rangosIniciales.map(r => ({ ...r }))); // Clon profundo
      setSuccess("");
      setError("");
    }
  }, [isOpen, rangosIniciales]);

  const handleChange = (index, field, value) => {
    const nuevosRangos = [...rangos];
    nuevosRangos[index][field] = value;
    setRangos(nuevosRangos);
  };

  const agregarRango = () => {
    const ultimo = rangos[rangos.length - 1];
    if (!ultimo || !ultimo.consumo_min || !ultimo.consumo_max || !ultimo.precio_por_m3) {
      setError("Completa el rango actual antes de agregar otro.");
      return;
    }
    setError("");
    setRangos([...rangos, { consumo_min: "", consumo_max: "", precio_por_m3: "" }]);
  };

  const handleGuardar = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    const camposInvalidos = rangos.some(r =>
      r.consumo_min === "" || r.consumo_max === "" || r.precio_por_m3 === "" ||
      isNaN(r.consumo_min) || isNaN(r.consumo_max) || isNaN(r.precio_por_m3)
    );

    if (camposInvalidos) {
      setError("Todos los campos deben ser numéricos y no vacíos.");
      setIsSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await window.tarifasApp.updateRangosTarifa({
        id: tarifaId,
        rangos: rangos.map(r => ({
          id: r.id || null, // Si es nuevo, id será null o undefined
          consumo_min: parseFloat(r.consumo_min),
          consumo_max: parseFloat(r.consumo_max),
          precio_por_m3: parseFloat(r.precio_por_m3),
        })),
        token_session: token
      });

      if (response.success) {
        setSuccess("Rangos actualizados correctamente.");
        setTimeout(() => {
          onClose();
          setIsSaving(false);
          onGuardado?.();
        }, 1500);
      } else {
        setError(response.message || "No se pudo actualizar.");
        setIsSaving(false);
      }
    } catch (err) {
      console.error(err);
      setError("Error al guardar. Verifica la conexión.");
      setIsSaving(false);
    }
  };

  // Clases compartidas para los inputs (Token 4 adaptado para HTML nativo)
  const inputClasses = "w-full bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 transition-all duration-200 shadow-none h-11 px-3 text-sm font-medium text-slate-800 dark:text-zinc-100";

  return (
    <>
      <Button 
        onPress={onOpen} 
        variant="flat"
        className="font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-xl px-6"
      >
        Editar Rangos
      </Button>

      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        size="2xl" 
        scrollBehavior="inside"
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
                  Editar Estructura de Precios
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                  Configura los bloques de consumo y sus valores asociados
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

                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        {/* Token 6: Cabeceras de tabla */}
                        <th className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-3 px-2 w-1/3">
                          Min. (m³)
                        </th>
                        <th className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-3 px-2 w-1/3">
                          Máx. (m³)
                        </th>
                        <th className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-3 px-2 w-1/3">
                          Precio ($/m³)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rangos.map((rango, index) => (
                        <tr key={rango.id || index}>
                          {/* Token 6: Filas de tabla (Adaptado para inputs) */}
                          <td className="border-b border-slate-100 dark:border-zinc-800/50 py-3 px-2">
                            <input
                              type="number"
                              className={inputClasses}
                              placeholder="0"
                              value={rango.consumo_min}
                              onChange={e => handleChange(index, "consumo_min", e.target.value)}
                            />
                          </td>
                          <td className="border-b border-slate-100 dark:border-zinc-800/50 py-3 px-2">
                            <input
                              type="number"
                              className={inputClasses}
                              placeholder="Ej. 10"
                              value={rango.consumo_max}
                              onChange={e => handleChange(index, "consumo_max", e.target.value)}
                            />
                          </td>
                          <td className="border-b border-slate-100 dark:border-zinc-800/50 py-3 px-2">
                            <input
                              type="number"
                              step="0.01"
                              className={inputClasses}
                              placeholder="0.00"
                              value={rango.precio_por_m3}
                              onChange={e => handleChange(index, "precio_por_m3", e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4">
                  {/* Regla de Tintes: Botón secundario suave */}
                  <Button 
                    onPress={agregarRango} 
                    variant="flat" 
                    className="w-full font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl h-11"
                    startContent={<HiPlus className="text-lg" />}
                  >
                    Agregar Nuevo Rango
                  </Button>
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="light"
                  onPress={onClose}
                  className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl"
                >
                  Cancelar
                </Button>
                {/* Token 4: Botón Primario (SaaS) */}
                <Button
                  isLoading={isSaving}
                  onPress={handleGuardar}
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
