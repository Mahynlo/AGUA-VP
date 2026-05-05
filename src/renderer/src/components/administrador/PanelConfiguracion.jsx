import { useState, useEffect } from "react";
import { Button, Spinner, Divider } from "@nextui-org/react";
// Aquí está la corrección: se agregó HiCheck
import { HiCog, HiSave, HiBan, HiExclamation, HiCalendar, HiBell, HiClock, HiCheck } from "react-icons/hi";
import { usePermissions } from "../../context/PermissionsContext";
import SelectorPeriodoAvanzado from "../ui/SelectorPeriodoAvanzado";
import { formatearPeriodo, obtenerPeriodoActual } from "../../utils/periodoUtils";
import { nowHermosilloDateStr } from "../../utils/diasHabiles";

// Input reutilizable (Premium SaaS UI - Token 4)
const ConfigInput = ({ label, value, onChange, icon, type = "number", description, min = 0 }) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 ml-1">
          {label}
        </label>
      )}
      <div className="relative w-full flex items-center">
        <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          min={min}
          onChange={onChange}
          className="w-full pl-11 pr-4 h-[52px] text-sm font-medium rounded-xl transition-all duration-200 resize-none bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 focus:border-slate-400 dark:focus:border-zinc-500 shadow-none"
        />
      </div>
      {description && <p className="text-[10px] text-slate-400 dark:text-zinc-500 ml-1 mt-0.5 leading-tight">{description}</p>}
    </div>
  );
};

export default function PanelConfiguracion() {
  const token = localStorage.getItem("token");
  const { can } = usePermissions();
  const canRecalcularLecturas = can("lecturas.recalcular");
  
  const [config, setConfig] = useState({
    facturas_para_primer_aviso: 1,
    facturas_para_segundo_aviso: 2,
    facturas_para_tercer_aviso: 3,
    facturas_para_corte: 4,
    dias_gracia: 0,
    dias_vencimiento_factura: 15,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingRecalculo, setLoadingRecalculo] = useState(false);
  const [periodoRecalculo, setPeriodoRecalculo] = useState(obtenerPeriodoActual());
  const [actualizarFechaEmision, setActualizarFechaEmision] = useState(false);
  const [fechaEmisionObjetivo, setFechaEmisionObjetivo] = useState(nowHermosilloDateStr());

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

  const handleRecalcularVencimientos = async () => {
    if (!token) return;
    if (!canRecalcularLecturas) {
      alert("No tienes permisos para recalcular vencimientos.");
      return;
    }

    const confirmar = window.confirm(
      `Se recalculará la fecha de vencimiento de facturas NO pagadas del período ${formatearPeriodo(periodoRecalculo)} usando los días de vencimiento configurados actualmente.${actualizarFechaEmision ? `\nAdemás, se actualizará fecha de emisión a ${fechaEmisionObjetivo}.` : ""}\n\n¿Desea continuar?`
    );
    if (!confirmar) return;

    setLoadingRecalculo(true);
    try {
      const resultado = await window.api.deudores.recalcularVencimientosPorPeriodo(token, {
        periodo: periodoRecalculo,
        incluir_pagadas: false,
        actualizar_fecha_emision: actualizarFechaEmision,
        fecha_emision_objetivo: actualizarFechaEmision ? fechaEmisionObjetivo : null,
      });

      alert(
        `${resultado.message || "Recalculo completado"}\n` +
        `Período: ${formatearPeriodo(resultado.periodo || periodoRecalculo)}\n` +
        `${resultado.actualizo_fecha_emision ? `Fecha emisión aplicada: ${resultado.fecha_emision_aplicada}\n` : ""}` +
        `Facturas actualizadas: ${resultado.facturas_actualizadas || 0}`
      );
    } catch (error) {
      console.error("Error recalculando vencimientos:", error);
      alert(`Error al recalcular vencimientos: ${error.message || error}`);
    } finally {
      setLoadingRecalculo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-64 gap-4 animate-in fade-in">
        <Spinner size="lg" color="default" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 animate-pulse">
          Cargando configuración del sistema...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10 print:shadow-none print:rounded-none print:bg-white print:border-none print:p-0 animate-in fade-in duration-500 flex flex-col gap-8">
      
      {/* ── HEADER GLOBAL ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
            <HiCog className="w-7 h-7" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
              Configuración General
            </h2>
            <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Reglas de negocio y facturación
            </p>
          </div>
        </div>
        
        <Button
          onPress={handleSave}
          isLoading={saving}
          startContent={saved ? null : <HiSave className="text-lg" />}
          className={`font-bold h-[52px] px-8 w-full sm:w-auto shadow-sm rounded-xl transition-all ${
            saved 
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
              : "bg-slate-900 text-white dark:bg-white dark:text-zinc-950"
          }`}
        >
          {saved ? "Guardado Exitoso" : "Guardar Cambios"}
        </Button>
      </div>

      <Divider className="bg-slate-100 dark:bg-zinc-800/80" />

      {/* Nota informativa Superior */}
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 flex items-start gap-4">
        <div className="p-2 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl shrink-0">
          <HiExclamation className="w-5 h-5" />
        </div>
        <div className="flex flex-col gap-1.5 pt-0.5">
          <p className="text-[10px] font-bold text-orange-600/80 dark:text-orange-400/80 uppercase tracking-widest">
            Aviso Importante
          </p>
          <p className="text-sm font-medium text-orange-800 dark:text-orange-200 leading-relaxed">
            Modificar estos valores afectará el cálculo automático de deudores en todo el sistema durante la próxima sincronización nocturna. Asegúrate de que los valores de avisos sean progresivos (Primer Aviso &lt; Segundo &lt; Tercer &lt; Corte).
          </p>
        </div>
      </div>

      {/* ── SECCIÓN 1: AVISOS ── */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <HiBell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-0.5">
              Generación de avisos a morosos
            </h3>
            <p className="text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100">
              Umbrales de Notificación
            </p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ConfigInput
              label="Primer Aviso"
              value={config.facturas_para_primer_aviso}
              onChange={(e) => setConfig({ ...config, facturas_para_primer_aviso: Number(e.target.value) })}
              icon={<HiBell className="w-5 h-5" />}
              description="Ej. Al deber 1 factura"
            />
            <ConfigInput
              label="Segundo Aviso"
              value={config.facturas_para_segundo_aviso}
              onChange={(e) => setConfig({ ...config, facturas_para_segundo_aviso: Number(e.target.value) })}
              icon={<HiBell className="w-5 h-5" />}
              description="Ej. Al deber 2 facturas"
            />
            <ConfigInput
              label="Tercer Aviso"
              value={config.facturas_para_tercer_aviso}
              onChange={(e) => setConfig({ ...config, facturas_para_tercer_aviso: Number(e.target.value) })}
              icon={<HiBell className="w-5 h-5" />}
              description="Aviso previo o extrajudicial"
            />
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 2: CORTES ── */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl shrink-0">
            <HiBan className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-0.5">
              Criterios para emitir órdenes
            </h3>
            <p className="text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100">
              Reglas de Suspensión
            </p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ConfigInput
              label="Límite de Facturas para Corte"
              value={config.facturas_para_corte}
              onChange={(e) => setConfig({ ...config, facturas_para_corte: Number(e.target.value) })}
              icon={<HiBan className="w-5 h-5" />}
              description="¿A las cuántas facturas impagas se corta el servicio?"
            />
            <ConfigInput
              label="Días de Gracia post-vencimiento"
              value={config.dias_gracia}
              onChange={(e) => setConfig({ ...config, dias_gracia: Number(e.target.value) })}
              icon={<HiClock className="w-5 h-5" />}
              description="Días extra que se le dan al cliente antes de ejecutar el corte."
            />
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 3: FACTURACIÓN ── */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <HiCalendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-0.5">
              Tiempos estándar para recibos
            </h3>
            <p className="text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100">
              Ciclo de Facturación
            </p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8">
          <div className="max-w-md">
            <ConfigInput
              label="Días de Vigencia del Recibo"
              value={config.dias_vencimiento_factura}
              onChange={(e) => setConfig({ ...config, dias_vencimiento_factura: Number(e.target.value) })}
              icon={<HiCalendar className="w-5 h-5" />}
              description="Tiempo límite para pagar (Estándar: 15 días desde la emisión)."
            />
          </div>
        </div>
      </div>

      <Divider className="bg-slate-100 dark:bg-zinc-800/80 my-2" />

      {/* ── SECCIÓN 4: CORRECCIÓN DE VENCIMIENTOS ── */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <HiExclamation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-0.5">
              Ajuste para facturas históricas no pagadas
            </h3>
            <p className="text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100">
              Corrección de Vencimientos
            </p>
          </div>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 sm:p-8 space-y-6">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200 leading-relaxed max-w-3xl">
            Use esta acción para corregir facturas generadas con lógica anterior. Solo afecta facturas no pagadas del período seleccionado.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 ml-1">
                Período a recalcular
              </label>
              <SelectorPeriodoAvanzado
                value={periodoRecalculo}
                onChange={setPeriodoRecalculo}
                placeholder="Seleccionar período a recalcular"
                startYear={2020}
                size="md"
                isDisabled={saving || loadingRecalculo}
                className="w-full h-[52px]"
              />
            </div>

            {actualizarFechaEmision && (
              <ConfigInput
                label="Nueva fecha de emisión"
                type="date"
                value={fechaEmisionObjetivo}
                onChange={(e) => setFechaEmisionObjetivo(e.target.value)}
                icon={<HiCalendar className="w-5 h-5" />}
                description="Aplicará a todas las facturas impagas del período"
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={actualizarFechaEmision}
                  onChange={(e) => setActualizarFechaEmision(e.target.checked)}
                  disabled={saving || loadingRecalculo}
                  className="peer appearance-none w-5 h-5 border-2 border-slate-300 dark:border-zinc-700 rounded-md checked:bg-amber-500 checked:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all cursor-pointer disabled:opacity-50"
                />
                <HiCheck className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-zinc-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Actualizar también la fecha de emisión
              </span>
            </label>

            <Button
              variant="flat"
              onPress={handleRecalcularVencimientos}
              isLoading={loadingRecalculo}
              isDisabled={!canRecalcularLecturas || saving || loadingRecalculo || !periodoRecalculo || (actualizarFechaEmision && !fechaEmisionObjetivo)}
              className="font-bold bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/20 rounded-xl px-8 h-11 w-full sm:w-auto"
            >
              Ejecutar Recálculo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}