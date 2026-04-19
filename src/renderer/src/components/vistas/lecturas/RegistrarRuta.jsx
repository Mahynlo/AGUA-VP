import { useDisclosure } from "@nextui-org/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Tabs,
  Tab,
  Card,
  CardBody
} from "@nextui-org/react";
import { HiPlus, HiMap, HiInformationCircle, HiCollection, HiX, HiCheck } from "react-icons/hi";

import MapaRutas from "../../mapa/MapaRutas";
import { useMedidores } from "../../../context/MedidoresContext";
import { useRutaForm } from "../../../hooks/useRutaForm";
import PanelGestionRuta from "./PanelGestionRuta";

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
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { allMedidores } = useMedidores();

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
  } = useRutaForm({ modoEdicion: false, onSuccess: onClose });

  const handleCloseModal = () => {
    resetearFormulario();
    onClose();
  };

  return (
    <>
      <Button
        color="default"
        onPress={onOpen}
        startContent={<HiPlus className="text-lg" />}
        className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 shadow-sm"
      >
        Nueva Ruta
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="5xl"
        backdrop="blur"
        scrollBehavior="inside"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        placement="center"
        classNames={{
            wrapper: "items-start p-1 sm:p-2 pt-16 sm:pt-20 overflow-y-hidden",
            backdrop: "bg-slate-900/40 backdrop-blur-sm",
            base: "bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-2xl w-full max-w-[1200px] h-[calc(100dvh-4.25rem)] sm:h-[calc(100dvh-5.25rem)] max-h-[calc(100dvh-4.25rem)] sm:max-h-[calc(100dvh-5.25rem)]",
            header: "border-b border-slate-100 dark:border-zinc-800/50 pb-4 pt-6 px-8",
            body: "px-8 py-6 flex-1 min-h-0",
            footer: "border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8",
            closeButton: "hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 text-slate-400 p-2 top-4 right-4 z-50",
        }}
      >
        <ModalContent className="h-full">
          {() => (
            <>
              {/* HEADER */}
              <ModalHeader className="flex flex-col gap-1 shrink-0">
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
              </ModalHeader>

              {/* BODY */}
              <ModalBody className="flex flex-col min-h-0">
                <Tabs
                  aria-label="Configuración de Ruta"
                  color="primary"
                  variant="underlined"
                  classNames={{
                      base: "w-full",
                      tabList: "gap-6 w-full relative rounded-none p-0 border-b border-slate-200 dark:border-zinc-800",
                      cursor: "w-full bg-slate-800 dark:bg-zinc-200 h-[2px]",
                      tab: "max-w-fit px-0 h-12",
                      tabContent: "group-data-[selected=true]:text-slate-800 dark:group-data-[selected=true]:text-zinc-100 group-data-[selected=true]:font-bold text-slate-500 dark:text-zinc-400 font-medium text-sm transition-colors",
                      panel: "pt-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0" // Asegura que el panel crezca
                  }}
                >
                  {/* TAB 1: INFORMACIÓN GENERAL */}
                  <Tab 
                    key="info" 
                    title={
                        <div className="flex items-center gap-2">
                            <HiInformationCircle className="text-lg" />
                            <span>Información Básica</span>
                        </div>
                    }
                  >
                    <Card className="border border-slate-200 dark:border-zinc-800 shadow-none bg-slate-50 dark:bg-zinc-900/50 rounded-2xl h-full">
                        <CardBody className="p-6">
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
                        </CardBody>
                    </Card>
                  </Tab>

                  {/* TAB 2: GESTIÓN Y MAPA */}
                  <Tab 
                    key="lista" 
                    title={
                        <div className="flex items-center gap-2">
                            <HiCollection className="text-lg" />
                            <span>Secuencia y Mapa</span>
                        </div>
                    }
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 h-full min-h-[500px]">
                      
                      {/* Columna Izquierda: Panel gestión */}
                      <Card className="border border-slate-200 dark:border-zinc-800 shadow-none bg-white dark:bg-zinc-900/50 rounded-2xl flex flex-col h-full min-h-[500px]">
                          <CardBody className="p-0 flex flex-col h-full overflow-hidden">
                            {/* Ajustamos PanelGestionRuta para que ocupe el 100% de la CardBody interna */}
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
                          </CardBody>
                      </Card>

                      {/* Columna Derecha: Mapa */}
                      <Card className="border border-slate-200 dark:border-zinc-800 shadow-none bg-slate-50 dark:bg-zinc-900/50 rounded-2xl overflow-hidden h-full min-h-[400px] lg:min-h-[500px]">
                          <CardBody className="p-0 relative h-full">
                            <MapaRutas
                                medidores={allMedidores}
                                puntosRuta={puntosRuta}
                                rutaCalculada={rutaCalculada}
                                dibujar={dibujar}
                                readOnly={true}
                            />
                          </CardBody>
                      </Card>
                      
                    </div>
                  </Tab>
                </Tabs>
              </ModalBody>

              {/* FOOTER */}
              <ModalFooter>
                <Button 
                    color="default" 
                    variant="flat" 
                    onPress={handleCloseModal}
                    startContent={<HiX className="text-lg" />}
                    className="font-bold text-slate-600 dark:text-zinc-300 bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800"
                >
                  Cancelar
                </Button>
                <Button
                  color="default"
                  onClick={guardarRuta}
                  isDisabled={isSaving}
                  isLoading={isSaving}
                  startContent={!isSaving && <HiCheck className="text-lg" />}
                  className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 shadow-sm"
                >
                  {isSaving ? "Guardando Ruta..." : "Guardar Nueva Ruta"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
