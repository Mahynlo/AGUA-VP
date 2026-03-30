import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Button, Spinner } from "@nextui-org/react";
import { HiCog, HiSave, HiBan, HiExclamation, HiCalendar, HiBell, HiClock } from "react-icons/hi";

// Input reutilizable (Premium UI)
const ConfigInput = ({ label, value, onChange, icon, type = "number", color = "blue", description, min = 0 }) => {
  const focusColors = {
    blue: "focus:ring-blue-500 focus:border-blue-500",
    amber: "focus:ring-amber-500 focus:border-amber-500",
    orange: "focus:ring-orange-500 focus:border-orange-500",
    red: "focus:ring-red-500 focus:border-red-500",
    purple: "focus:ring-purple-500 focus:border-purple-500",
  };

  const focusClass = focusColors[color] || focusColors.blue;

  return (
    <div className="w-full">
      <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">
        {label}
      </label>
      <div className="relative w-full flex items-center">
        <span className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          min={min}
          onChange={onChange}
          className={`
            w-full pl-10 pr-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 resize-none h-11
            bg-slate-50 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-100
            border border-slate-200 dark:border-zinc-700
            hover:bg-slate-100 dark:hover:bg-zinc-800
            focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-zinc-900 shadow-sm
            ${focusClass}
          `}
        />
      </div>
      {description && <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1.5 ml-1 font-bold leading-tight">{description}</p>}
    </div>
  );
};

export default function PanelConfiguracion() {
  const token = localStorage.getItem("token");
  const [config, setConfig] = useState({
    facturas_para_primer_aviso: 1,
    facturas_para_segundo_aviso: 2,
    facturas_para_tercer_aviso: 3,
    facturas_para_corte: 4,
    dias_gracia: 0,
    dias_vencimiento_factura: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (token) {
      setLoading(true);
      window.api.deudores
        .fetchConfiguracion(token)
        .then((res) => {
          setConfig((prev) => ({ ...prev, ...res }));
        })
        .catch((err) => console.error("Error cargando config:", err))
        .finally(() => setLoading(false));
    }
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await window.api.deudores.updateConfiguracion(token, config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error guardando config:", error);
      alert("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-64 gap-4 animate-in fade-in">
        <Spinner size="lg" color="primary" />
        <span className="text-sm font-bold text-slate-500 dark:text-zinc-400 animate-pulse">Cargando configuración del sistema...</span>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-20">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl">
                <HiCog className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">
                Configuración General
            </h2>
            <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                Reglas de negocio y facturación
            </p>
            </div>
        </div>
        <Button
          color={saved ? "success" : "primary"}
          onPress={handleSave}
          isLoading={saving}
          startContent={saved ? null : <HiSave className="w-5 h-5" />}
          className={`font-bold h-12 px-6 w-full sm:w-auto shadow-md ${saved ? "text-white shadow-emerald-500/30" : "shadow-blue-500/30"}`}
        >
          {saved ? "✓ Guardado correctamente" : "Guardar Cambios"}
        </Button>
      </div>

      {/* Nota informativa Superior */}
      <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200/60 dark:border-orange-800/50 rounded-xl p-4 flex gap-3 animate-in slide-in-from-top-2">
        <HiExclamation className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider">Aviso Importante</p>
          <p className="text-xs font-medium text-orange-700/80 dark:text-orange-400/80 leading-relaxed max-w-2xl">
            Modificar estos valores afectará el cálculo automático de deudores en todo el sistema durante la próxima sincronización nocturna. Asegúrate de que los valores de avisos sean progresivos (Primer Aviso &lt; Segundo &lt; Tercer &lt; Corte).
          </p>
        </div>
      </div>

      {/* ── SECCIÓN 1: AVISOS (AZUL) ── */}
      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800/50 px-6 pt-6 pb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <HiBell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">Umbrales de Avisos</h3>
            <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-500">
              Cantidad de facturas vencidas requeridas para generar cada tipo de aviso.
            </p>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ConfigInput
              label="Primer Aviso"
              value={config.facturas_para_primer_aviso}
              onChange={(e) => setConfig({ ...config, facturas_para_primer_aviso: Number(e.target.value) })}
              icon={<HiBell className="w-5 h-5 text-blue-500" />}
              color="blue"
              description="Ej. Al deber 1 factura"
            />
            <ConfigInput
              label="Segundo Aviso"
              value={config.facturas_para_segundo_aviso}
              onChange={(e) => setConfig({ ...config, facturas_para_segundo_aviso: Number(e.target.value) })}
              icon={<HiBell className="w-5 h-5 text-amber-500" />}
              color="amber"
              description="Ej. Al deber 2 facturas"
            />
            <ConfigInput
              label="Tercer Aviso"
              value={config.facturas_para_tercer_aviso}
              onChange={(e) => setConfig({ ...config, facturas_para_tercer_aviso: Number(e.target.value) })}
              icon={<HiBell className="w-5 h-5 text-orange-500" />}
              color="orange"
              description="Aviso previo o extrajudicial"
            />
          </div>
        </CardBody>
      </Card>

      {/* ── SECCIÓN 2: CORTES (ROJO/PÚRPURA) ── */}
      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800/50 px-6 pt-6 pb-4">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <HiBan className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">Reglas de Suspensión</h3>
            <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-500">
              Criterios para emitir órdenes de corte de servicio a morosos.
            </p>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ConfigInput
              label="Límite de Facturas para Corte"
              value={config.facturas_para_corte}
              onChange={(e) => setConfig({ ...config, facturas_para_corte: Number(e.target.value) })}
              icon={<HiBan className="w-5 h-5 text-red-500" />}
              color="red"
              description="¿A las cuántas facturas impagas se corta el servicio?"
            />
            <ConfigInput
              label="Días de Gracia post-vencimiento"
              value={config.dias_gracia}
              onChange={(e) => setConfig({ ...config, dias_gracia: Number(e.target.value) })}
              icon={<HiClock className="w-5 h-5 text-purple-500" />}
              color="purple"
              description="Días extra que se le dan al cliente antes de ejecutar el corte."
            />
          </div>
        </CardBody>
      </Card>

      {/* ── SECCIÓN 3: FACTURACIÓN (AMBER) ── */}
      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800/50 px-6 pt-6 pb-4">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <HiCalendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">Ciclo de Facturación</h3>
            <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-500">
              Tiempos estándar para la emisión y cobro de recibos.
            </p>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          <div className="max-w-md">
            <ConfigInput
              label="Días de Vigencia del Recibo"
              value={config.dias_vencimiento_factura}
              onChange={(e) => setConfig({ ...config, dias_vencimiento_factura: Number(e.target.value) })}
              icon={<HiCalendar className="w-5 h-5 text-emerald-500" />}
              color="green"
              description="Tiempo límite para pagar (Standard: 30 días desde la emisión)."
            />
          </div>
        </CardBody>
      </Card>

    </div>
  );
}