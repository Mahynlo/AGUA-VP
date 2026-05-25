import React, { useState, useEffect } from "react";
import { Modal } from "flowbite-react";
import { HiCog, HiSave, HiBan, HiExclamation, HiCalendar } from "react-icons/hi";

const premiumModalTheme = {
  root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" } },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-lg w-full"
  },
  header: {
    base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/50 px-8 py-6 rounded-t-2xl shrink-0",
    close: { base: "absolute top-6 right-6 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
  },
  body: { base: "px-8 py-6 flex-1 overflow-y-auto" },
  footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8 rounded-b-2xl shrink-0" }
};

const CustomInput = ({ label, value, onChange, icon, type = "text", color = "blue", description }) => (
  <div>
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
      {label}
    </label>
    <div className="relative w-full flex">
      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2 pr-2">
        {icon}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="border border-gray-300 focus:ring-blue-600 focus:border-blue-500 text-gray-600 rounded-xl pl-12 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 transition-all"
      />
    </div>
    {description && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">{description}</p>}
  </div>
);

const ModalConfiguracionCortes = ({ isOpen, onClose }) => {
  const token = localStorage.getItem("token");
  const [config, setConfig] = useState({
    facturas_para_primer_aviso: 1,
    facturas_para_segundo_aviso: 2,
    facturas_para_tercer_aviso: 3,
    facturas_para_corte: 4,
    dias_gracia: 0,
    dias_vencimiento_factura: 15
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      setLoading(true);
      window.api.deudores.fetchConfiguracion(token)
        .then(res => setConfig(res))
        .catch(err => console.error("Error cargando config:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, token]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await window.api.deudores.updateConfiguracion(token, config);
      onClose();
    } catch (error) {
      console.error("Error guardando config:", error);
      alert("Error al guardar la configuración");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} theme={premiumModalTheme} dismissible>
      <Modal.Header>
        <div className="flex gap-3 items-center">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <HiCog className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
              Configuración de Reglas
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
              Define los umbrales para cortes y avisos
            </p>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className="space-y-6">
          <div className="space-y-4">
            <CustomInput
              label="Facturas para Primer Aviso"
              type="number"
              value={config.facturas_para_primer_aviso}
              onChange={(e) => setConfig({ ...config, facturas_para_primer_aviso: Number(e.target.value) })}
              icon={<HiCog className="w-5 h-5 text-blue-600" />}
              description="Cantidad de facturas para enviar el primer aviso"
            />

            <CustomInput
              label="Facturas para Corte de Servicio"
              type="number"
              value={config.facturas_para_corte}
              onChange={(e) => setConfig({ ...config, facturas_para_corte: Number(e.target.value) })}
              icon={<HiBan className="w-5 h-5 text-red-600" />}
              description="Cantidad de facturas vencidas para generar orden de corte"
            />

            <CustomInput
              label="Días de Vencimiento de Factura"
              type="number"
              value={config.dias_vencimiento_factura}
              onChange={(e) => setConfig({ ...config, dias_vencimiento_factura: Number(e.target.value) })}
              icon={<HiCalendar className="w-5 h-5 text-amber-600" />}
              description="Días calendario desde la emisión hasta vencimiento (por defecto 15)"
            />
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 flex gap-3">
            <HiExclamation className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Importante</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                Cambiar estas reglas actualizará automáticamente el estado de todos los deudores en la próxima sincronización. Asegúrese de que los valores sean correctos.
              </p>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          onClick={onClose}
          className="font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl px-6 h-11"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="font-bold bg-blue-600 text-white rounded-xl px-8 h-11 shadow-sm flex items-center gap-2 disabled:opacity-70 shadow-blue-500/30"
        >
          {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          <HiSave className="w-4 h-4" />
          {loading ? "Guardando..." : "Guardar Cambios"}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalConfiguracionCortes;
