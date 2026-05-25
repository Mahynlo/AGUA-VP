import React, { useState, useMemo, useEffect } from "react";
import { Modal } from "flowbite-react";
import { HiClipboardCheck, HiCalculator, HiCurrencyDollar, HiViewGrid, HiCalendar, HiExclamationCircle } from "react-icons/hi";

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

const inputClasses = "border border-gray-300 dark:border-zinc-700 focus:ring-blue-600 focus:border-blue-500 text-gray-600 dark:text-zinc-100 rounded-xl pl-12 pr-4 py-2 w-full focus:outline-none focus:ring-2 bg-white dark:bg-zinc-900 transition-all";

const CustomInput = ({ label, value, onChange, icon, type = "text", prefix }) => (
  <div>
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
      {label}
    </label>
    <div className="relative w-full flex">
      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2 pr-2">
        {icon}
      </span>
      {prefix && (
        <span className="absolute left-10 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-sm pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder="0"
        min={0}
        className={`${inputClasses} ${prefix ? "pl-14" : "pl-12"}`}
      />
    </div>
  </div>
);

const ModalCrearConvenio = ({ isOpen, onClose, selectedDeudor, onSuccess }) => {
  const token = localStorage.getItem("token");
  const [pagoInicial, setPagoInicial] = useState("");
  const [parcialidades, setParcialidades] = useState(6);
  const [periodicidad, setPeriodicidad] = useState("mensual");
  const [loading, setLoading] = useState(false);

  const deudaTotal = selectedDeudor?.deuda?.total || selectedDeudor?.saldo_pendiente || 0;

  const proyeccion = useMemo(() => {
    const inicial = Number(pagoInicial) || 0;
    const saldoRestante = deudaTotal - inicial;
    const cuota = parcialidades > 0 ? saldoRestante / parcialidades : 0;
    return {
      saldoRestante: saldoRestante > 0 ? saldoRestante : 0,
      cuota: cuota > 0 ? cuota : 0
    };
  }, [deudaTotal, pagoInicial, parcialidades]);

  useEffect(() => {
    if (isOpen && selectedDeudor) {
      setPagoInicial("");
      setParcialidades(6);
      setPeriodicidad("mensual");
      setLoading(false);
    }
  }, [isOpen, selectedDeudor]);

  if (!selectedDeudor) return null;

  const handleConfirm = async () => {
    if (!pagoInicial || Number(pagoInicial) <= 0) {
      alert("Por favor ingrese un pago inicial válido");
      return;
    }
    if (!selectedDeudor.medidor?.id) {
      console.error("Error: medidor.id no está disponible", selectedDeudor);
      alert("Error: No se pudo obtener el ID del medidor");
      return;
    }

    setLoading(true);
    const payload = {
      medidor_id: selectedDeudor.medidor.id,
      monto_inicial: Number(pagoInicial),
      numero_parcialidades: Number(parcialidades),
      periodicidad,
      observaciones: "Convenio generado desde módulo Deudores"
    };
    console.log("Enviando convenio con payload:", payload);

    try {
      const result = await window.api.deudores.crearConvenio(token, payload);
      console.log("Convenio creado exitosamente:", result);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creando convenio:", error);
      alert(`Error al crear el convenio: ${error.message || "Error desconocido"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} theme={premiumModalTheme} dismissible>
      <Modal.Header>
        <div className="flex gap-3 items-center">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <HiClipboardCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
              Crear Convenio
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
              Plan de pagos diferidos
            </p>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 text-center">
              <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase font-bold tracking-wider">Deuda Total</p>
              <p className="text-xl font-black text-gray-800 dark:text-zinc-100 mt-1">${deudaTotal?.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 text-center">
              <p className="text-xs text-blue-500 dark:text-blue-400 uppercase font-bold tracking-wider">Saldo a Diferir</p>
              <p className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">${proyeccion.saldoRestante.toLocaleString()}</p>
            </div>
          </div>

          <CustomInput
            label="Pago Inicial (Enganche)"
            type="number"
            value={pagoInicial}
            onChange={(e) => setPagoInicial(e.target.value)}
            icon={<HiCurrencyDollar className="w-5 h-5 text-green-600" />}
            prefix="$"
          />

          <div className="grid grid-cols-2 gap-4">
            <CustomInput
              label="Nº de Parcialidades"
              type="number"
              value={parcialidades}
              onChange={(e) => setParcialidades(Number(e.target.value))}
              icon={<HiViewGrid className="w-5 h-5 text-purple-500" />}
            />

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Periodicidad
              </label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
                  <HiCalendar className="w-5 h-5" />
                </span>
                <select
                  value={periodicidad}
                  onChange={(e) => setPeriodicidad(e.target.value)}
                  className="border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-100 rounded-xl pl-8 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium transition-all h-10"
                >
                  <option value="mensual">Mensual</option>
                  <option value="quincenal">Quincenal</option>
                </select>
              </div>
            </div>
          </div>

          {proyeccion.saldoRestante < 0 && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-800/30 flex items-center gap-2">
              <HiExclamationCircle className="w-4 h-4" />
              El pago inicial excede la deuda total.
            </p>
          )}

          <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-3 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-zinc-700 pb-2">
              <HiCalculator className="w-5 h-5" />
              <span className="font-bold text-sm">Resumen del Plan</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {parcialidades} pagos {periodicidad}es de:
              </span>
              <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">
                ${proyeccion.cuota.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          onClick={onClose}
          className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6 h-11"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading || !pagoInicial || proyeccion.saldoRestante < 0}
          className="font-bold bg-green-600 text-white rounded-xl px-8 h-11 shadow-sm flex items-center gap-2 disabled:opacity-70 shadow-green-500/30"
        >
          {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          <HiClipboardCheck className="w-4 h-4" />
          {loading ? "Generando..." : "Generar Convenio"}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalCrearConvenio;
