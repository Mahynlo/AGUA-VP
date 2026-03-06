import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Button, Divider, Spinner } from "@nextui-org/react";
import { HiCog, HiSave, HiBan, HiExclamation, HiCalendar, HiBell, HiClock } from "react-icons/hi";

// Input reutilizable
const ConfigInput = ({ label, value, onChange, icon, type = "number", color = "blue", description, min = 0 }) => (
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
        min={min}
        onChange={onChange}
        className={`border border-gray-300 focus:ring-${color}-600 focus:border-${color}-500 text-gray-600 rounded-xl pl-12 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all`}
      />
    </div>
    {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
  </div>
);

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

  // Cargar configuración al montar
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
      <div className="flex justify-center items-center h-64">
        <Spinner label="Cargando configuración..." />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Configuración del Sistema
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Reglas de avisos, cortes de servicio y facturación
          </p>
        </div>
        <Button
          color={saved ? "success" : "primary"}
          onPress={handleSave}
          isLoading={saving}
          startContent={saved ? null : <HiSave className="w-4 h-4" />}
          radius="lg"
          className={saved ? "shadow-lg shadow-green-500/30" : "shadow-lg shadow-blue-500/30"}
        >
          {saved ? "✓ Guardado" : "Guardar Cambios"}
        </Button>
      </div>

      {/* Sección: Avisos */}
      <Card className="shadow-sm">
        <CardHeader className="flex gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <HiBell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Reglas de Avisos</h3>
            <p className="text-xs text-gray-400">
              Umbrales de facturas vencidas para generar avisos a los clientes
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ConfigInput
              label="Primer Aviso"
              value={config.facturas_para_primer_aviso}
              onChange={(e) =>
                setConfig({ ...config, facturas_para_primer_aviso: Number(e.target.value) })
              }
              icon={<HiBell className="w-5 h-5 text-blue-500" />}
              description="Facturas vencidas para 1er aviso"
            />
            <ConfigInput
              label="Segundo Aviso"
              value={config.facturas_para_segundo_aviso}
              onChange={(e) =>
                setConfig({ ...config, facturas_para_segundo_aviso: Number(e.target.value) })
              }
              icon={<HiBell className="w-5 h-5 text-amber-500" />}
              color="amber"
              description="Facturas vencidas para 2do aviso"
            />
            <ConfigInput
              label="Tercer Aviso"
              value={config.facturas_para_tercer_aviso}
              onChange={(e) =>
                setConfig({ ...config, facturas_para_tercer_aviso: Number(e.target.value) })
              }
              icon={<HiBell className="w-5 h-5 text-orange-500" />}
              color="orange"
              description="Facturas vencidas para 3er aviso"
            />
          </div>
        </CardBody>
      </Card>

      {/* Sección: Cortes */}
      <Card className="shadow-sm">
        <CardHeader className="flex gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
            <HiBan className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Reglas de Corte</h3>
            <p className="text-xs text-gray-400">
              Umbrales para generar órdenes de corte de servicio
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ConfigInput
              label="Facturas para Corte de Servicio"
              value={config.facturas_para_corte}
              onChange={(e) =>
                setConfig({ ...config, facturas_para_corte: Number(e.target.value) })
              }
              icon={<HiBan className="w-5 h-5 text-red-600" />}
              color="red"
              description="Cantidad de facturas vencidas para generar orden de corte"
            />
            <ConfigInput
              label="Días de Gracia"
              value={config.dias_gracia}
              onChange={(e) =>
                setConfig({ ...config, dias_gracia: Number(e.target.value) })
              }
              icon={<HiClock className="w-5 h-5 text-purple-600" />}
              color="purple"
              description="Días de gracia después del vencimiento antes de considerar candidato a corte"
            />
          </div>
        </CardBody>
      </Card>

      {/* Sección: Facturación */}
      <Card className="shadow-sm">
        <CardHeader className="flex gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
            <HiCalendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Facturación</h3>
            <p className="text-xs text-gray-400">
              Configuración de plazos de facturación
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="max-w-sm">
            <ConfigInput
              label="Días de Vencimiento de Factura"
              value={config.dias_vencimiento_factura}
              onChange={(e) =>
                setConfig({ ...config, dias_vencimiento_factura: Number(e.target.value) })
              }
              icon={<HiCalendar className="w-5 h-5 text-amber-600" />}
              color="amber"
              description="Días desde la emisión hasta que una factura se considera vencida (por defecto 30)"
            />
          </div>
        </CardBody>
      </Card>

      {/* Nota informativa */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 flex gap-3">
        <HiExclamation className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Importante</p>
          <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
            Cambiar estas reglas actualizará automáticamente el estado de todos los deudores en la próxima
            sincronización. Los valores de avisos deben ser progresivos (1er &lt; 2do &lt; 3er &lt; Corte).
          </p>
        </div>
      </div>
    </div>
  );
}
