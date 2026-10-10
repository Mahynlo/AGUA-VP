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
  HiUpload,
  HiDownload
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
  const [restaurando, setRestaurando] = useState(false);
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
      const res = await window.api.system.testTursoConnection(tursoUrl.trim(), tursoToken.trim(), getUserToken());
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
    // Qué registros se eliminarían de la nube si se reemplaza (calculado por la API)
    const eliminaria = conflicto?.eliminaria || [];
    const totalEliminaria = eliminaria.reduce((s, e) => s + e.total, 0);
    const detalleEliminaria = eliminaria.length
      ? eliminaria
          .map((e) => `   ${e.tabla}: ${e.total} (ids ${e.ids.join(", ")}${e.total > e.ids.length ? ", …" : ""})`)
          .join("\n")
      : "   Ninguno";

    setError("Sincronización bloqueada para proteger la copia en la nube", "Nube");

    const revisar = window.confirm(
      "⛔ La sincronización se detuvo para proteger tu copia en la nube.\n\n" +
        `${motivos}\n\nRegistros:\n${tabla}\n\n` +
        `Si reemplazas la nube se ELIMINARÁN de la copia en la nube ${totalEliminaria} registro(s):\n${detalleEliminaria}\n\n` +
        "Si perdiste o restauraste la base local, NO reemplaces la nube: usa \"Restaurar desde la Nube\" para recuperar tus datos.\n\n" +
        "¿Quieres REEMPLAZAR la copia de la nube con la base local actual?"
    );
    if (!revisar) return;

    const confirmarReemplazo = window.confirm(
      `Confirmación final: ${totalEliminaria} registro(s) que existen en la nube y no en esta base local se PERDERÁN de la copia en la nube.\n\n` +
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

  // Restaurar la base local desde la copia de la nube (se aplica al reiniciar la app)
  const restaurarDesdeNube = async () => {
    try {
      setRestaurando(true);
      const prev = await window.api.system.previewCloudRestore(getUserToken());
      if (!prev?.success) {
        setError(prev?.error || "No se pudo consultar la copia en la nube", "Nube");
        return;
      }
      if (!prev.data?.disponible) {
        setError("La nube no contiene una copia de AguaVP para restaurar", "Nube");
        return;
      }

      const tabla = (prev.data.comparacion || [])
        .map((c) => `   ${c.tabla}: nube ${c.nube} / esta computadora ${c.local}`)
        .join("\n");
      const continuar = window.confirm(
        "Restaurar desde la nube\n\n" +
          `Copia de la nube actualizada: ${formatearFecha(prev.data.lastSyncNube)}\n` +
          (prev.data.mismaBase ? "" : "⚠️ La copia pertenece a otra base o a una instalación anterior.\n") +
          `\nRegistros:\n${tabla}\n\n` +
          "La base de esta computadora será REEMPLAZADA por la copia de la nube. Antes se guardará un respaldo local de la base actual.\n" +
          "AguaVP se reiniciará y los usuarios deberán iniciar sesión de nuevo.\n\n¿Continuar?"
      );
      if (!continuar) return;

      const confirmar = window.confirm(
        "Confirmación final: los cambios hechos en esta computadora que no estén en la copia de la nube se perderán (seguirán en el respaldo local).\n\n¿Restaurar desde la nube?"
      );
      if (!confirmar) return;

      const res = await window.api.system.restoreFromCloud(getUserToken());
      if (res?.success) {
        setSuccess(res.message || "Copia de la nube verificada. AguaVP se reiniciará para aplicarla.", "Nube");
      } else {
        setError(res?.error || res?.message || "No se pudo restaurar desde la nube", "Nube");
      }
    } catch (err) {
      setError(`Error al restaurar desde la nube: ${err.message}`, "Nube");
    } finally {
      setRestaurando(false);
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

      {/* ── TARJETAS DE ESTADO ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Estado de la vinculación */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              Estado
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
                {configured ? "Nube Vinculada" : "Modo Local"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {configured
                ? "Esta computadora guarda una copia de respaldo en Turso"
                : "Sin copia en la nube. La app funciona igual con los respaldos locales"}
            </p>
          </div>
        </div>

        {/* Última copia */}
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
                      ? "Copia verificada"
                      : "Copia de respaldo"}
              {statusDetalle?.cambiosPendientes > 0 && ` · ${statusDetalle.cambiosPendientes} cambio(s) por subir`}
            </p>
            {statusDetalle?.ultimaSincronizacionCorrecta && (
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                Última sincronización correcta: {formatearFecha(statusDetalle.ultimaSincronizacionCorrecta)}
                {statusDetalle?.verificacion?.tipo === "contenido" && " · contenido verificado"}
              </p>
            )}
            {statusDetalle?.fallosConsecutivos > 0 && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                {statusDetalle.fallosConsecutivos} intento(s) fallido(s) seguidos: {statusDetalle.lastError}
              </p>
            )}
            {statusDetalle?.fkViolaciones > 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                {statusDetalle.fkViolaciones} referencia(s) huérfanas en la base local
              </p>
            )}
          </div>
        </div>

        {/* Sincronización automática */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              Sincronización Automática
            </span>
            <HiLightningBolt className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-lg font-black text-slate-800 dark:text-zinc-100">
              {!configured ? "Inactiva" : autoSync ? "Cada 15 minutos" : "Manual"}
            </span>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {!configured
                ? "Se activa al vincular una base de Turso"
                : autoSync
                  ? "Solo sube lo que cambió; si no hay cambios no usa internet"
                  : "Usa «Sincronizar ahora» para subir los cambios"}
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
            <p className="text-xs mt-2">
              No se ha borrado nada. «Revisar» muestra qué registros se eliminarían de la nube si decides reemplazarla.
              Si perdiste la base de esta computadora, no la reemplaces: usa «Restaurar desde la nube».
            </p>
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

      {/* ── 1. CONEXIÓN CON TURSO ── */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col gap-6">
        <EncabezadoSeccion
          numero="1"
          titulo="Conexión con Turso"
          descripcion={configured
            ? "Esta computadora ya está vinculada. Solo cambia estos datos si vas a usar otra base de Turso."
            : "Escribe la dirección y el token de la base de Turso donde se guardará la copia de esta computadora. Usa una base exclusiva para cada computadora."}
        />

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
              Se copia de la consola de Turso (empieza con <code>libsql://</code>).
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
              Se guarda cifrado en esta computadora y no se vuelve a mostrar.
              {configured && " Déjalo vacío para conservar el token actual."}
            </p>
          </div>

          {/* Checkbox autoSync */}
          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="checkAutoSync"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
            />
            <label htmlFor="checkAutoSync" className="cursor-pointer">
              <span className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Sincronizar automáticamente en segundo plano
              </span>
              <span className="block text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                Cada 15 minutos sube los cambios mientras la app está abierta. Recomendado.
              </span>
            </label>
          </div>
        </div>

        {/* Botones de conexión */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
          <div className="flex flex-col gap-1.5">
            <button
              onClick={probarConexion}
              disabled={probandoConexion || !tursoUrl}
              className="h-[44px] px-4 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <HiLightningBolt className="w-4 h-4" />
              {probandoConexion ? "Probando..." : "Probar Conexión"}
            </button>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 text-center">
              Comprueba que la URL y el token funcionan. No guarda nada.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={guardarConfiguracion}
              disabled={guardando || !tursoUrl}
              className="h-[44px] px-5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <HiSave className="w-4 h-4" />
              {guardando ? "Guardando..." : configured ? "Guardar Cambios" : "Guardar y Vincular"}
            </button>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 text-center">
              {configured
                ? "Guarda la nueva configuración y reconecta."
                : "Guarda la conexión. La primera copia completa se hace en el siguiente ciclo automático o al pulsar «Subir base completa»."}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. ACCIONES SOBRE LA COPIA ── */}
      <div className="flex flex-col gap-4">
        <EncabezadoSeccion
          numero="2"
          titulo="Acciones sobre la copia"
          descripcion={configured
            ? "Normalmente no necesitas usarlas: la copia se mantiene sola. Úsalas en los casos que indica cada una."
            : "Disponibles al vincular una base de Turso en el paso 1."}
        />

        {configured && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AccionNube
              icon={HiRefresh}
              color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              titulo="Sincronizar ahora"
              descripcion="Sube a la nube solo los registros que cambiaron desde la última copia. Es lo mismo que hace la sincronización automática, pero en este momento."
              cuando="antes de apagar la computadora después de muchos cobros, o para confirmar que la copia está al día."
            >
              <button
                onClick={sincronizarAhora}
                disabled={sincronizando}
                className="w-full h-[42px] px-4 rounded-xl text-sm font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <HiRefresh className={`w-4 h-4 ${sincronizando ? "animate-spin" : ""}`} />
                {sincronizando ? "Sincronizando..." : "Sincronizar Ahora"}
              </button>
            </AccionNube>

            <AccionNube
              icon={HiUpload}
              color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
              titulo="Subir base completa"
              descripcion="Vuelve a copiar todas las tablas a la nube y compara la copia fila por fila. Si la nube tiene datos de otra base o más registros que esta computadora, se detiene y te muestra qué se borraría antes de hacer nada."
              cuando="la primera vez, o si el estado muestra diferencias en la copia."
            >
              <button
                onClick={ejecutarCargaSemilla}
                disabled={sembrando}
                className="w-full h-[42px] px-4 rounded-xl text-sm font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <HiUpload className="w-4 h-4" />
                {sembrando ? "Subiendo base..." : "Subir Base Completa"}
              </button>
            </AccionNube>

            <AccionNube
              icon={HiDownload}
              color="bg-amber-500/10 text-amber-700 dark:text-amber-400"
              titulo="Restaurar desde la nube"
              descripcion="Reemplaza la base de esta computadora con la copia de la nube. Antes guarda un respaldo local de la base actual, verifica la copia descargada y reinicia la app para aplicarla."
              cuando="en una computadora nueva, o si la base de esta computadora se perdió o se dañó."
            >
              <button
                onClick={restaurarDesdeNube}
                disabled={restaurando || sembrando || sincronizando}
                className="w-full h-[42px] px-4 rounded-xl text-sm font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <HiDownload className="w-4 h-4" />
                {restaurando ? "Preparando copia..." : "Restaurar desde la Nube"}
              </button>
            </AccionNube>
          </div>
        )}

        {/* Desvincular: separado de las acciones habituales */}
        {configured && (
          <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="p-2.5 rounded-xl shrink-0 bg-rose-500/10 text-rose-600 dark:text-rose-400 self-start sm:self-center">
              <HiTrash className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-slate-800 dark:text-zinc-100">Desvincular la nube</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Deja de enviar copias y borra la conexión guardada en esta computadora. No borra los datos locales ni la copia que ya está en la nube.
                Úsalo para cambiar a otra base de Turso o dejar de usar la nube.
              </p>
            </div>
            <button
              onClick={desvincularNube}
              disabled={guardando}
              className="h-[42px] px-4 rounded-xl text-sm font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
            >
              <HiTrash className="w-4 h-4" />
              Desvincular
            </button>
          </div>
        )}
      </div>

      {/* ── CÓMO FUNCIONA ── */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 flex items-start gap-3">
        <HiInformationCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
          <p className="font-bold text-slate-700 dark:text-zinc-200 mb-2">Cómo funciona la copia en la nube</p>
          <ul className="space-y-1.5 list-disc pl-4">
            <li>Todo el trabajo (cobros, lecturas, impresión) se hace en esta computadora. La nube es solo una copia de respaldo: sin internet la app funciona igual y los cambios se suben al reconectar.</li>
            <li>Una vez al día la copia completa se compara fila por fila con la base local y se corrige si hay diferencias.</li>
            <li>La copia nunca se vacía ni se reemplaza sin avisarte. Si algo no cuadra, la sincronización se detiene y aparece un aviso aquí y para los administradores.</li>
            <li>Las sesiones y los tokens de acceso no se suben: después de restaurar hay que iniciar sesión de nuevo.</li>
            <li>La nube guarda el estado actual, no un historial. Para volver a una fecha anterior usa la pestaña <span className="font-semibold">Backups</span>.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}

/** Título de sección numerado (pasos del panel). */
function EncabezadoSeccion({ numero, titulo, descripcion }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-7 h-7 rounded-full bg-slate-800 dark:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-black flex items-center justify-center shrink-0">
        {numero}
      </span>
      <div>
        <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-tight">{titulo}</h3>
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-0.5">{descripcion}</p>
      </div>
    </div>
  );
}

/** Tarjeta de una acción: qué hace, cuándo usarla y su botón. */
function AccionNube({ icon: Icon, color, titulo, descripcion, cuando, children }) {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800 dark:text-zinc-100">{titulo}</h4>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">{descripcion}</p>
        </div>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2">
        <span className="font-bold text-slate-600 dark:text-zinc-300">Cuándo usarlo: </span>
        {cuando}
      </p>
      <div className="mt-auto pt-1">{children}</div>
    </div>
  );
}
