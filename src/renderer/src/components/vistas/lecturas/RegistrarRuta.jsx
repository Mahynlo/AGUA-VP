import { useState } from "react";
import { Modal, Button } from "flowbite-react";
import { HiPlus, HiMap, HiInformationCircle, HiCollection, HiX, HiCheck } from "react-icons/hi";

import MapaRutas from "../../mapa/MapaRutas";
import { useMedidores } from "../../../context/MedidoresContext";
import { useRutaForm } from "../../../hooks/useRutaForm";
import { usePermissions } from "../../../context/PermissionsContext";
import { useFeedback } from "../../../context/FeedbackContext";
import PanelGestionRuta from "./PanelGestionRuta";

const largeModalTheme = {
    root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" } },
    content: {
        base: "relative h-full w-full p-1 sm:p-2 pt-16 sm:pt-20",
        inner: "relative flex h-[calc(100dvh-4.25rem)] sm:h-[calc(100dvh-5.25rem)] flex-col rounded-[2rem] bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-[1300px] w-full"
    },
    header: {
        base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/50 pb-4 pt-6 px-8 shrink-0",
        close: { base: "absolute top-4 right-4 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors z-50", icon: "h-5 w-5" }
    },
    body: { base: "px-8 py-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar" },
    footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8 shrink-0" }
};

// Componente de Input Personalizado (Premium UI) reutilizado para consistencia
const CustomInput = ({ label, value, onChange, icon, type = "text", color = "blue", description, placeholder, as = "input", rows }) => {
    const focusColors = {
        blue: "focus:ring-slate-400/20 focus:border-slate-300",
        red: "focus:ring-red-500 focus:border-red-500 bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-800",
    };

    const inputClasses = `
        w-full pl-10 pr-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 resize-none
    bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100
    border border-slate-200 dark:border-zinc-800
    hover:border-slate-300 dark:hover:border-zinc-700
        focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-zinc-900
    placeholder-slate-400 dark:placeholder-zinc-500 shadow-none
        ${focusColors[color] || focusColors.blue}
    `;

    return (
        <div className="w-full">
            {label && (
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mb-1.5 block uppercase tracking-widest">
                    {label}
                </label>
            )}
            <div className="relative w-full flex items-start">
                <span className="absolute left-3 top-3.5 text-slate-400 dark:text-zinc-500 flex items-center justify-center pointer-events-none">
                    {icon}
                </span>
                {as === "textarea" ? (
                    <textarea
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        rows={rows || 3}
                        className={inputClasses}
                    />
                ) : (
                    <input
                        type={type}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        className={inputClasses}
                    />
                )}
            </div>
            {description && (
                <p className={`text-[10px] mt-1.5 ml-1 font-bold ${color === 'red' ? 'text-red-500' : 'text-slate-400 dark:text-zinc-500'}`}>
                    {description}
                </p>
            )}
        </div>
    );
};

export default function ModalRegistrarRuta() {
  const [isOpen, setIsOpen] = useState(false);
  const { allMedidores } = useMedidores();
  const { can } = usePermissions();
  const { setError } = useFeedback();
  const canCrearRutas = can("rutas.crear");

  const [tabActiva, setTabActiva] = useState("info");

  const {
    nombre,
    setNombre,
    descripcion,
    setDescripcion,
    puntosRuta,
    setPuntosRuta,
    rutaCalculada,
    dibujar,
    erroresCampos,
    mostrarErrores,
    isSaving,
    limpiarError,
    handleDibujarRuta,
    reiniciarRuta,
    resetearFormulario,
    guardarRuta,
  } = useRutaForm({ modoEdicion: false, onSuccess: () => setIsOpen(false) });

  const handleCloseModal = () => {
    resetearFormulario();
    setIsOpen(false);
  };

  const handleGuardarRuta = () => {
    if (!canCrearRutas) {
      setError("No tienes permisos para crear rutas.", "Registro de Rutas");
      return;
    }
    guardarRuta();
  };

  const tabs = [
    { key: "info", label: "Información Básica", icon: <HiInformationCircle className="text-lg" /> },
    { key: "lista", label: "Secuencia y Mapa", icon: <HiCollection className="text-lg" /> },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={!canCrearRutas}
        className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 shadow-sm h-11 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <HiPlus className="text-lg" />Nueva Ruta
      </button>

      <Modal
        show={isOpen}
        onClose={handleCloseModal}
        dismissible={false}
        theme={largeModalTheme}
        size="7xl"
      >
        <Modal.Header>
          <div className="flex items-center gap-4">
              <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl shrink-0">
                  <HiMap className="w-7 h-7" />
              </div>
              <div className="flex flex-col">
                  <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                      Crear Nueva Ruta
                  </h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
                      Configuración y Trazado de Medidores
                  </p>
              </div>
          </div>
        </Modal.Header>

        <Modal.Body>
          <div className="flex flex-col min-h-0 h-full">
            {/* Tabs header */}
            <div className="flex border-b border-slate-200 dark:border-zinc-800 gap-6 shrink-0">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setTabActiva(tab.key)}
                  className={`flex items-center gap-2 h-12 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    tabActiva === tab.key
                      ? "border-slate-800 dark:border-zinc-200 text-slate-800 dark:text-zinc-100 font-bold"
                      : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="pt-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">

              {/* TAB 1: INFORMACIÓN GENERAL */}
              {tabActiva === "info" && (
                <div className="border border-slate-200 dark:border-zinc-800 shadow-none bg-slate-50 dark:bg-zinc-900/50 rounded-2xl h-full">
                    <div className="p-6">
                        <div className="max-w-3xl space-y-6">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-zinc-300 mb-2">
                                Detalles de Identificación
                            </h4>

                            <CustomInput
                                label="Nombre de la Ruta *"
                                placeholder="Ej: Ruta Centro Comercial Norte"
                                value={nombre}
                                onChange={(e) => { setNombre(e.target.value); limpiarError("nombre"); }}
                                icon={<HiMap className="w-5 h-5 text-slate-500" />}
                                color={mostrarErrores && erroresCampos.nombre ? "red" : "blue"}
                                description={mostrarErrores && erroresCampos.nombre ? "⚠ El nombre es requerido" : "Un nombre corto y descriptivo para ubicarla en el sistema."}
                            />

                            <CustomInput
                                as="textarea"
                                label="Descripción *"
                                placeholder="Describe la zona, calles abarcadas o notas para el lecturista..."
                                value={descripcion}
                                onChange={(e) => { setDescripcion(e.target.value); limpiarError("descripcion"); }}
                                icon={<HiCollection className="w-5 h-5 text-slate-500" />}
                                color={mostrarErrores && erroresCampos.descripcion ? "red" : "blue"}
                                rows={5}
                                description={mostrarErrores && erroresCampos.descripcion ? "⚠ La descripción es requerida" : "Información adicional de utilidad."}
                            />
                        </div>
                    </div>
                </div>
              )}

              {/* TAB 2: GESTIÓN Y MAPA */}
              {tabActiva === "lista" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 h-full min-h-[500px]">

                  {/* Columna Izquierda: Panel gestión */}
                  <div className="border border-slate-200 dark:border-zinc-800 shadow-none bg-white dark:bg-zinc-900/50 rounded-2xl flex flex-col h-full min-h-[500px] overflow-hidden">
                    <div className="p-0 flex flex-col h-full overflow-hidden">
                      <PanelGestionRuta
                          puntosRutaInicial={[]}
                          modoEdicion={false}
                          onPuntosChange={setPuntosRuta}
                          erroresCampos={erroresCampos}
                          mostrarErrores={mostrarErrores}
                          handleDibujarRuta={handleDibujarRuta}
                          reiniciarRuta={reiniciarRuta}
                          rutaCalculada={rutaCalculada}
                          isSaving={isSaving}
                      />
                    </div>
                  </div>

                  {/* Columna Derecha: Mapa */}
                  <div className="border border-slate-200 dark:border-zinc-800 shadow-none bg-slate-50 dark:bg-zinc-900/50 rounded-2xl overflow-hidden h-full min-h-[400px] lg:min-h-[500px] relative">
                    <div className="p-0 relative h-full">
                      <MapaRutas
                          medidores={allMedidores}
                          puntosRuta={puntosRuta}
                          rutaCalculada={rutaCalculada}
                          dibujar={dibujar}
                          readOnly={true}
                      />
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <button
              onClick={handleCloseModal}
              className="font-bold text-slate-600 dark:text-zinc-300 bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-zinc-800"
          >
            <HiX className="text-lg" /> Cancelar
          </button>
          <button
            onClick={handleGuardarRuta}
            disabled={isSaving || !canCrearRutas}
            className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 py-2 shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando Ruta...</>
            ) : (
              <><HiCheck className="text-lg" />Guardar Nueva Ruta</>
            )}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
