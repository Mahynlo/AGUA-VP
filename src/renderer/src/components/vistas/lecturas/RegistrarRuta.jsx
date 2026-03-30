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
        blue: "focus:ring-blue-500 focus:border-blue-500",
        red: "focus:ring-red-500 focus:border-red-500 bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-800",
    };

    const inputClasses = `
        w-full pl-10 pr-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 resize-none
        bg-slate-50 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-100
        border border-slate-200 dark:border-zinc-700
        hover:bg-slate-100 dark:hover:bg-zinc-800
        focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-zinc-900
        placeholder-slate-400 dark:placeholder-zinc-500 shadow-sm
        ${focusColors[color] || focusColors.blue}
    `;

    return (
        <div className="w-full">
            {label && (
                <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">
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
        color="primary"
        onPress={onOpen}
        startContent={<HiPlus className="text-lg" />}
        className="font-bold shadow-md shadow-blue-500/30"
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
            base: "bg-white dark:bg-zinc-900 shadow-2xl w-full max-w-[1200px] h-[90vh]", // Ajuste para que se vea ancho y alto
            backdrop: "bg-zinc-900/60 dark:bg-black/80 backdrop-blur-md",
            header: "border-b border-slate-100 dark:border-zinc-800",
            footer: "border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900",
            closeButton: "hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 text-slate-400 dark:text-zinc-500 transition-colors z-50",
        }}
      >
        <ModalContent>
          {() => (
            <>
              {/* HEADER */}
              <ModalHeader className="flex flex-col gap-1 pt-6 px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                        <HiMap className="w-7 h-7" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                            Crear Nueva Ruta
                        </h2>
                        <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-1">
                            Configuración y Trazado de Medidores
                        </p>
                    </div>
                </div>
              </ModalHeader>

              {/* BODY */}
              <ModalBody className="py-4 px-4 sm:px-6 flex flex-col min-h-0">
                <Tabs
                  aria-label="Configuración de Ruta"
                  color="primary"
                  variant="underlined"
                  classNames={{
                      tabList: "gap-6 w-full relative rounded-none p-0 border-b border-slate-200 dark:border-zinc-800",
                      cursor: "w-full bg-blue-500",
                      tab: "max-w-fit px-0 h-12",
                      tabContent: "group-data-[selected=true]:text-blue-600 dark:group-data-[selected=true]:text-blue-400 font-bold",
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
                    <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-800/50 rounded-2xl h-full">
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
                                    icon={<HiMap className="w-5 h-5 text-blue-500" />}
                                    color={mostrarErrores && erroresCampos.nombre ? "red" : "blue"}
                                    description={mostrarErrores && erroresCampos.nombre ? "⚠ El nombre es requerido" : "Un nombre corto y descriptivo para ubicarla en el sistema."}
                                />

                                <CustomInput
                                    as="textarea"
                                    label="Descripción *"
                                    placeholder="Describe la zona, calles abarcadas o notas para el lecturista..."
                                    value={descripcion}
                                    onChange={(e) => { setDescripcion(e.target.value); limpiarError("descripcion"); }}
                                    icon={<HiCollection className="w-5 h-5 text-blue-500" />}
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
                      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col h-full min-h-[500px]">
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
                      <Card className="border-none shadow-sm bg-slate-50 dark:bg-zinc-800/50 rounded-2xl overflow-hidden h-full min-h-[400px] lg:min-h-[500px]">
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
              <ModalFooter className="px-6 py-4">
                <Button 
                    color="default" 
                    variant="light" 
                    onPress={handleCloseModal}
                    startContent={<HiX className="text-lg" />}
                    className="font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onClick={guardarRuta}
                  isDisabled={isSaving}
                  isLoading={isSaving}
                  startContent={!isSaving && <HiCheck className="text-lg" />}
                  className="font-bold shadow-md shadow-blue-500/30 px-6"
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
