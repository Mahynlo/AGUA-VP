import { useState, useEffect, useCallback } from "react";
import {
  HiCloud,
  HiRefresh,
  HiSave,
  HiTrash,
  HiEye,
  HiEyeOff,
  HiCheckCircle,
  HiXCircle,
  HiInformationCircle,
  HiLightningBolt,
  HiUpload
} from "react-icons/hi";
import { useFeedback } from "../../../../context/FeedbackContext";
import { useAuth } from "../../../../context/AuthContext";

export default function PanelSincronizacionNube() {
  const { setSuccess, setError } = useFeedback();
  const { user } = useAuth();
  const getUserToken = () => localStorage.getItem("token") || "";

  // Estados de configuración
  const [tursoUrl, setTursoUrl] = useState("");
  const [tursoToken, setTursoToken] = useState("");
  const [autoSync, setAutoSync] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  // Estados visuales y de operación
  const [cargandoConfig, setCargandoConfig] = useState(true);
  const [probandoConexion, setProbandoConexion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [sembrando, setSembrando] = useState(false);
  const [mostrarToken, setMostrarToken] = useState(false);
  const [statusDetalle, setStatusDetalle] = useState(null);

  // Cargar configuración actual de Turso desde safeStorage vía IPC
  const cargarConfiguracion = useCallback(async () => {
    try {
      setCargandoConfig(true);
      const res = await window.api.system.getTursoConfig();
      if (res?.success && res.config) {
        setTursoUrl(res.config.tursoUrl || "");
        setConfigured(res.config.configured);
        setAutoSync(res.config.autoSync !== false);
        setLastSync(res.config.lastSync || null);
      }

      // Consultar estado en vivo del worker de sincronización
      const statusRes = await window.api.system.getTursoSyncStatus();
      if (statusRes?.success && statusRes.status) {
        setStatusDetalle(statusRes.status);
        if (statusRes.status.lastSync) setLastSync(statusRes.status.lastSync);
      }
    } catch (err) {
      console.error("Error cargando configuración de Turso:", err);
      setError("No se pudo cargar la configuración de sincronización", "Nube");
    } finally {
      setCargandoConfig(false);
    }
  }, [setError]);

  useEffect(() => {
    cargarConfiguracion();
  }, [cargarConfiguracion]);

  // Probar conexión sin guardar
  const probarConexion = async () => {
    if (!tursoUrl.trim()) {
      setError("Por favor ingresa la URL de la base de Turso", "Nube");
      return;
    }

    try {
      setProbandoConexion(true);
      const res = await window.api.system.testTursoConnection(tursoUrl.trim(), tursoToken.trim());
      if (res?.success) {
        setSuccess(`Conexión exitosa con Turso Cloud (${res.latencyMs || 0} ms de latencia)`, "Nube");
      } else {
        setError(res?.error || "No se pudo conectar a la base de Turso", "Nube");
      }
    } catch (err) {
      setError(`Error de red al probar conexión: ${err.message}`, "Nube");
    } finally {
      setProbandoConexion(false);
    }
  };

  // Guardar configuración cifrada con safeStorage
  const guardarConfiguracion = async () => {
    if (!tursoUrl.trim()) {
      setError("La URL de Turso es obligatoria", "Nube");
      return;
    }

    if (!configured && !tursoToken.trim()) {
      setError("Por favor ingresa el Token de Turso para vincular la base de datos", "Nube");
      return;
    }

    try {
      setGuardando(true);
      const res = await window.api.system.saveTursoConfig(
        {
          tursoUrl: tursoUrl.trim(),
          tursoToken: tursoToken.trim(),
          autoSync
        },
        getUserToken()
      );

      if (res?.success) {
        setSuccess("Configuración de Turso guardada de forma segura y cifrada", "Nube");
        setConfigured(true);
        setTursoToken(""); // Limpiar campo del token tras guardar por seguridad
        await cargarConfiguracion();
      } else {
        setError(res?.error || "Error al guardar la configuración", "Nube");
      }
    } catch (err) {
      setError(`Error guardando configuración: ${err.message}`, "Nube");
    } finally {
      setGuardando(false);
    }
  };

  // Desvincular Turso y regresar a modo local puro
  const desvincularNube = async () => {
    const confirmar = window.confirm(
      "¿Estás seguro de desvincular la sincronización con Turso Cloud?\n\nLa aplicación volverá a funcionar en modo local puro. Los datos locales NO se verán afectados."
    );
    if (!confirmar) return;

    try {
      setGuardando(true);
      const res = await window.api.system.clearTursoConfig(getUserToken());
      if (res?.success) {
        setSuccess("Credenciales de Turso eliminadas. Modo local autónomo activo.", "Nube");
        setTursoUrl("");
        setTursoToken("");
        setConfigured(false);
        setStatusDetalle(null);
      } else {
        setError(res?.error || "No se pudo desvincular", "Nube");
      }
    } catch (err) {
      setError(`Error al desvincular: ${err.message}`, "Nube");
    } finally {
      setGuardando(false);
    }
  };

  // La API bloqueó la carga completa para proteger la copia en la nube (base local vacía,
  // de otra instalación o con menos registros). Solo se reemplaza la nube con doble confirmación.
  const resolverConflicto = async (conflicto) => {
    const motivos = (conflicto?.motivos || []).map((m) => `• ${m.mensaje}`).join("\n");
    const tabla = (conflicto?.comparacion || [])
      .map((c) => `   ${c.tabla}: local ${c.local} / nube ${c.nube}`)
      .join("\n");

    setError("Sincronización bloqueada para proteger la copia en la nube", "Nube");

    const revisar = window.confirm(
      "⛔ La sincronización se detuvo para proteger tu copia en la nube.\n\n" +
        `${motivos}\n\nRegistros:\n${tabla}\n\n` +
        "Si perdiste o restauraste la base local, NO reemplaces la nube: usa la copia de la nube para recuperar tus datos.\n\n" +
        "¿Quieres REEMPLAZAR la copia de la nube con la base local actual?"
    );
    if (!revisar) return;

    const confirmarReemplazo = window.confirm(
      "Confirmación final: los datos que existen en la nube y no en esta base local se PERDERÁN de la copia en la nube.\n\n" +
        "¿Reemplazar la copia en la nube?"
    );
    if (!confirmarReemplazo) return;

    try {
      setSembrando(true);
      const res = await window.api.system.syncTursoNow(true, getUserToken(), true);
      if (res?.success) {
        setSuccess(`Copia en la nube reemplazada (${res.data?.totalRows || 0} registros)`, "Nube");
      } else {
        setError(res?.error || "No se pudo reemplazar la copia en la nube", "Nube");
      }
    } catch (err) {
      setError(`Error al reemplazar la copia en la nube: ${err.message}`, "Nube");
    } finally {
      setSembrando(false);
      await cargarConfiguracion();
    }
  };

  // Forzar sincronización inmediata de cambios
  const sincronizarAhora = async () => {
    try {
      setSincronizando(true);
      const res = await window.api.system.syncTursoNow(false, getUserToken());
      if (res?.conflict) {
        await resolverConflicto(res);
      } else if (res?.success) {
        setSuccess("Sincronización completada exitosamente", "Nube");
        await cargarConfiguracion();
      } else {
        setError(res?.error || "Error durante la sincronización", "Nube");
      }
    } catch (err) {
      setError(`Error al sincronizar: ${err.message}`, "Nube");
    } finally {
      setSincronizando(false);
    }
  };

  // Carga semilla inicial (Copia completa de la base local a Turso)
  const ejecutarCargaSemilla = async () => {
    const confirmar = window.confirm(
      "¿Deseas enviar una copia completa inicial de tu base de datos local hacia Turso Cloud?\n\nEsto asegurará que todas tus tablas, clientes, facturas y lecturas queden registradas en la nube."
    );
    if (!confirmar) return;

    try {
      setSembrando(true);
      const res = await window.api.system.syncTursoNow(true, getUserToken());
      if (res?.conflict) {
        await resolverConflicto(res);
      } else if (res?.success) {
        const total = res.data?.totalRows || 0;
        setSuccess(`Carga inicial completada exitosamente (${total} registros respaldados)`, "Nube");
        await cargarConfiguracion();
      } else {
        setError(res?.error || "Error al subir la base de datos a Turso", "Nube");
      }
    } catch (err) {
      setError(`Error en carga semilla: ${err.message}`, "Nube");
    } finally {
      setSembrando(false);
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "Nunca";
    try {
      const d = new Date(fechaStr);
      return d.toLocaleString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (_) {
      return fechaStr;
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── TARJETA RESUMEN DE ESTADO ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Estado Conexión */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              Estado del Espejo
            </span>
            <HiCloud className={`w-5 h-5 ${configured ? "text-emerald-500" : "text-slate-400"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  configured ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                }`}
              />
              <span className="text-lg font-black text-slate-800 dark:text-zinc-100">
                {configured ? "Nube Vinculada" : "Modo Local Puro"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {configured
                ? "La copia espejo se mantiene actualizada en Turso"
                : "La app opera de forma 100% autónoma en disco"}
            </p>
          </div>
        </div>

        {/* Última Sincronización */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              Última Copia en Nube
            </span>
            <HiRefresh className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <span className="text-lg font-black text-slate-800 dark:text-zinc-100 font-mono">
              {formatearFecha(lastSync)}
            </span>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {statusDetalle?.conflicto
                ? "⛔ Copia protegida: conflicto pendiente"
                : statusDetalle?.lastSyncSuccess === false
                  ? "⚠️ Último intento con aviso de red"
                  : statusDetalle?.verificacion && !statusDetalle.verificacion.ok
                    ? `⚠️ Diferencias en: ${(statusDetalle.verificacion.diferencias || []).map((d) => d.tabla).join(", ")}`
                    : statusDetalle?.verificacion?.ok
                      ? "Respaldo remoto verificado"
                      : "Respaldo remoto"}
              {statusDetalle?.cambiosPendientes > 0 && ` · ${statusDetalle.cambiosPendientes} cambio(s) por subir`}
            </p>
          </div>
        </div>

        {/* Sincronización Automática */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              Auto-Sincronización
            </span>
            <HiLightningBolt className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-lg font-black text-slate-800 dark:text-zinc-100">
              {configured && autoSync ? "Activa (Cada 15 min)" : "Manual"}
            </span>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Delta inteligente: 0 bytes si no hay cambios (cuida cuota 3GB)
            </p>
          </div>
        </div>
      </div>

      {/* ── AVISO DE CONFLICTO (carga completa bloqueada para proteger la nube) ── */}
      {statusDetalle?.conflicto && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center gap-4">
          <HiXCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
          <div className="flex-1 text-sm text-rose-700 dark:text-rose-300">
            <p className="font-bold">La sincronización está detenida para proteger la copia en la nube</p>
            {(statusDetalle.conflicto.motivos || []).map((m, i) => (
              <p key={i} className="text-xs mt-1">{m.mensaje}</p>
            ))}
          </div>
          <button
            onClick={() => resolverConflicto(statusDetalle.conflicto)}
            disabled={sembrando}
            className="h-[40px] px-4 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50 shrink-0"
          >
            Revisar
          </button>
        </div>
      )}

      {/* ── FORMULARIO DE CREDENCIALES TURSO ── */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100 tracking-tight">
            Credenciales de la Base de Datos en Turso
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
            Configura la dirección única y el token de acceso para la réplica en la nube de este cliente.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* URL de Turso */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-zinc-400 mb-1.5">
              URL de la Base de Datos Remota
            </label>
            <input
              type="text"
              placeholder="libsql://aguavp-cliente-01-usuario.turso.io"
              value={tursoUrl}
              onChange={(e) => setTursoUrl(e.target.value)}
              className="w-full h-[50px] px-4 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
              Dirección generada en tu consola de Turso para esta base de datos.
            </p>
          </div>

          {/* Token de Turso */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-zinc-400 mb-1.5">
              Token de Autenticación (Auth Token)
            </label>
            <div className="relative flex items-center">
              <input
                type={mostrarToken ? "text" : "password"}
                placeholder={configured ? "••••••••••••••••••••••••••••••••••••••••" : "Pega aquí el token JWT generado en Turso"}
                value={tursoToken}
                onChange={(e) => setTursoToken(e.target.value)}
                className="w-full h-[50px] pl-4 pr-12 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setMostrarToken(!mostrarToken)}
                className="absolute right-3.5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                title={mostrarToken ? "Ocultar token" : "Mostrar token"}
              >
                {mostrarToken ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
              El token se almacena de forma cifrada en disco mediante <code>safeStorage</code> (DPAPI).
            </p>
          </div>

          {/* Checkbox autoSync */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="checkAutoSync"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
            />
            <label htmlFor="checkAutoSync" className="text-sm font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer">
              Sincronizar automáticamente en segundo plano cuando haya conexión a internet
            </label>
          </div>
        </div>

        {/* ── BOTONERA DE ACCIÓN ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={probarConexion}
              disabled={probandoConexion || !tursoUrl}
              className="h-[44px] px-4 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <HiLightningBolt className="w-4 h-4" />
              {probandoConexion ? "Probando..." : "Probar Conexión"}
            </button>

            <button
              onClick={guardarConfiguracion}
              disabled={guardando || !tursoUrl}
              className="h-[44px] px-5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <HiSave className="w-4 h-4" />
              {guardando ? "Guardando..." : "Guardar y Vincular"}
            </button>
          </div>

          {configured && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={sincronizarAhora}
                disabled={sincronizando}
                className="h-[44px] px-4 rounded-xl text-sm font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                title="Sube los cambios locales más recientes a Turso Cloud"
              >
                <HiRefresh className={`w-4 h-4 ${sincronizando ? "animate-spin" : ""}`} />
                {sincronizando ? "Sincronizando..." : "Sincronizar Ahora"}
              </button>

              <button
                onClick={ejecutarCargaSemilla}
                disabled={sembrando}
                className="h-[44px] px-4 rounded-xl text-sm font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                title="Copia completa inicial de la base de datos local hacia Turso"
              >
                <HiUpload className="w-4 h-4" />
                {sembrando ? "Subiendo base..." : "Subir Base Completa a Turso"}
              </button>

              <button
                onClick={desvincularNube}
                disabled={guardando}
                className="h-[44px] px-3 rounded-xl text-sm font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                title="Desvincular la nube y volver a modo local puro"
              >
                <HiTrash className="w-4 h-4" />
                Desvincular
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── NOTA DE ARQUITECTURA / INFORMATIVA ── */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 flex items-start gap-3">
        <HiInformationCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
          <p className="font-bold text-slate-700 dark:text-zinc-200 mb-0.5">
            Arquitectura Local-First con Espejo en la Nube y Consumo Zero-Waste
          </p>
          La base de datos local (<code>agua-vp.db</code>) procesa el 100% de las operaciones de cobro, impresión y lecturas de manera instantánea y autónoma. La base de Turso Cloud funciona como una copia viva accesible remotamente por los administradores para consultas, auditoría y respaldo. El sincronizador inteligente analiza primero la base local: si no se generaron cambios nuevos, no envía peticiones por red (0 bytes consumidos), protegiendo holgadamente el límite mensual de 3 GB de Turso.
        </div>
      </div>

    </div>
  );
}
