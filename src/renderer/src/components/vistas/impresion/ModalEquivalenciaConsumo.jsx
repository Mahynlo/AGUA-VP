import { Modal } from "flowbite-react";
import { useState } from "react";
import { HiScale, HiBeaker, HiCollection, HiX, HiInformationCircle, HiCheckCircle } from "react-icons/hi";
import useEquivalenciaConsumo from "../../../hooks/useEquivalenciaConsumo";

const equivalenciaModalTheme = {
  root: {
    base: "fixed top-0 right-0 left-0 z-[100000] h-modal h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full",
    show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" }
  },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-3xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-4xl w-full"
  },
  header: {
    base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/50 px-8 pb-4 pt-6 rounded-t-3xl shrink-0",
    close: { base: "absolute top-5 right-5 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
  },
  body: { base: "p-0 flex-1 overflow-y-auto" },
  footer: { base: "flex items-center justify-end border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8 rounded-b-3xl shrink-0" }
};

const SUB_TABS = [
  { key: "prueba",  label: "Simulador",          icon: HiBeaker },
  { key: "frases",  label: "Catálogo de Frases",  icon: HiCollection },
];

const ModalEquivalenciaConsumo = ({ isOpen, onClose }) => {
  const { obtenerTodasLasFrases, probarEquivalencia, loading, error } = useEquivalenciaConsumo();
  const [consumoPrueba, setConsumoPrueba] = useState(25);
  const [frasePrueba, setFrasePrueba] = useState("");
  const [activeTab, setActiveTab] = useState("prueba");

  const frasesDisponibles = obtenerTodasLasFrases();

  const handlePrueba = () => {
    const frase = probarEquivalencia(consumoPrueba);
    setFrasePrueba(frase);
  };

  return (
    <Modal
      show={isOpen}
      onClose={onClose}
      theme={equivalenciaModalTheme}
      dismissible
    >
      {/* ── HEADER ── */}
      <Modal.Header>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
            <HiScale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
              Equivalencias de Consumo
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
              Configuración de mensajes para recibos
            </p>
          </div>
        </div>
      </Modal.Header>

      {/* ── BODY ── */}
      <Modal.Body>
        {loading ? (
          /* Estado de carga */
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 animate-pulse">
              Cargando equivalencias...
            </p>
          </div>
        ) : error ? (
          /* Estado de error */
          <div className="p-8">
            <div className="flex items-start gap-3 p-5 rounded-2xl bg-red-500/10 border border-red-200 dark:border-red-900/40">
              <HiX className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700 dark:text-red-400">Error de carga</p>
                <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          /* Contenido principal */
          <div>
            {/* Sub-tabs */}
            <div className="flex gap-0 border-b border-slate-200 dark:border-zinc-800 px-8">
              {SUB_TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-0 mr-6 h-12 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none ${
                    activeTab === key
                      ? "border-slate-800 dark:border-zinc-200 text-slate-800 dark:text-zinc-100 font-bold"
                      : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300"
                  }`}
                >
                  <Icon className="text-lg shrink-0" />
                  <span>{label}</span>
                  {key === "frases" && (
                    <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 px-2 py-0.5 rounded-md text-[10px] font-bold ml-1">
                      {frasesDisponibles.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* TAB: Simulador */}
            {activeTab === "prueba" && (
              <div className="px-8 py-6 flex flex-col gap-6">
                <div className="flex items-center gap-2">
                  <HiInformationCircle className="w-5 h-5 text-slate-400 dark:text-zinc-500" />
                  <h4 className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                    Ingrese un valor para probar
                  </h4>
                </div>

                <div className="flex flex-col md:flex-row items-start gap-4">
                  <div className="flex-1 w-full flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 ml-1">
                      Consumo
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none">
                        <HiBeaker className="w-5 h-5" />
                      </span>
                      <input
                        type="number"
                        placeholder="Ej: 25"
                        value={consumoPrueba}
                        onChange={(e) => setConsumoPrueba(parseInt(e.target.value) || 0)}
                        min={0}
                        max={1000}
                        className="w-full pl-11 pr-12 h-[52px] text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 focus:border-slate-400 dark:focus:border-zinc-500 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500"
                      />
                      <span className="absolute right-4 text-slate-400 dark:text-zinc-500 font-bold text-xs pointer-events-none">m³</span>
                    </div>
                  </div>
                  <div className="w-full md:w-auto shrink-0 md:mt-6">
                    <button
                      type="button"
                      onClick={handlePrueba}
                      className="inline-flex items-center gap-2 font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 rounded-xl px-8 h-[52px] w-full md:w-auto shadow-sm transition-all active:scale-95"
                    >
                      <HiCheckCircle className="w-5 h-5" />
                      Generar Mensaje
                    </button>
                  </div>
                </div>

                {/* Resultado */}
                <div className={`p-6 rounded-2xl transition-all min-h-[120px] flex items-center ${
                  frasePrueba
                    ? "bg-emerald-500/10"
                    : "bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800"
                }`}>
                  {frasePrueba ? (
                    <div className="flex gap-4 items-start w-full">
                      <div className="p-2.5 bg-emerald-500/20 rounded-xl shrink-0">
                        <HiScale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex flex-col gap-1 flex-1 pt-1">
                        <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest">
                          Resultado en Recibo
                        </p>
                        <p className="text-base font-semibold text-emerald-900 dark:text-emerald-100 italic leading-relaxed">
                          "{frasePrueba}"
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center w-full flex flex-col items-center gap-2">
                      <HiInformationCircle className="text-2xl text-slate-300 dark:text-zinc-600" />
                      <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">El mensaje generado aparecerá aquí</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Catálogo */}
            {activeTab === "frases" && (
              <div className="px-8 py-6 flex flex-col gap-3 max-h-[450px] overflow-y-auto">
                {frasesDisponibles.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 py-4 border-b border-slate-100 dark:border-zinc-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-colors px-2 rounded-xl"
                  >
                    <div className="flex sm:flex-col gap-2 sm:w-36 shrink-0">
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md w-fit whitespace-nowrap">
                        {item.rango_min} - {item.rango_max} m³
                      </span>
                      <span className="bg-slate-500/10 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md w-fit whitespace-nowrap">
                        {item.categoria}
                      </span>
                    </div>
                    <div className="hidden sm:block w-px h-10 bg-slate-200 dark:bg-zinc-800 shrink-0" />
                    <p className="text-sm font-medium text-slate-600 dark:text-zinc-300 leading-relaxed italic flex-1">
                      "{item.frase}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal.Body>

      {/* ── FOOTER ── */}
      <Modal.Footer>
        <button
          type="button"
          onClick={onClose}
          className="font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-xl px-6 h-10 text-sm transition-colors"
        >
          Cerrar Panel
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalEquivalenciaConsumo;
