import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "flowbite-react";
import { HiX, HiCreditCard, HiCash, HiExclamationCircle, HiArrowLeft, HiShieldCheck } from "react-icons/hi";
import { SearchIcon } from "../../../IconsApp/IconsSidebar";
import { useFeedback } from "../../../context/FeedbackContext";
import { usePagos } from "../../../context/PagosContext";

const premiumModalTheme = {
  root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80 mt-10", off: "hidden" } },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-6xl w-full"
  },
  header: {
    base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/50 px-8 py-6 rounded-t-2xl shrink-0",
    close: { base: "absolute top-6 right-6 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
  },
  body: { base: "px-8 py-6 flex-1 overflow-y-auto" },
  footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8 rounded-b-2xl shrink-0" }
};

const inputBaseClasses = "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all font-medium text-slate-800 dark:text-zinc-100 h-[52px]";

const MAX_COMENTARIO = 500;
const LIST_PAGE = 20; // Tamaño de "ventana" de la lista (render incremental / scroll infinito)
const STORAGE_KEY = "aguavp:liquidacion-total:seleccion"; // selección "sigue debiendo" persistida

const cargarSeleccionGuardada = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((id) => Number(id)).filter((id) => Number.isFinite(id));
  } catch {
    return [];
  }
};

const limpiarSeleccionGuardada = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
};

const toMoney = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100) / 100;
};

const formatMoney = (value) =>
  Number(toMoney(value)).toLocaleString("es-MX", { minimumFractionDigits: 2 });

const isValidPaymentDate = (fecha) => {
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const parsed = new Date(`${fecha}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
};

// Normaliza para búsqueda: insensible a mayúsculas/minúsculas Y a acentos
// (ej. "jose" encuentra "José", "nunez" encuentra "Núñez").
const normalizarTexto = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const parsePredio = (predio) => {
  const onlyDigits = String(predio ?? "").replace(/\D/g, "");
  if (!onlyDigits) return Number.MAX_SAFE_INTEGER;
  const num = Number(onlyDigits);
  return Number.isFinite(num) ? num : Number.MAX_SAFE_INTEGER;
};

// Deuda que el backend SÍ puede liquidar vía pago distribuido. Replica el filtro
// de pagosService.registrarPagoDistribuido: saldo > 0, estado != 'Pagado' y SIN
// convenio. Las facturas en convenio NO se tocan aquí (se gestionan aparte).
const calcularDeudaLiquidable = (cliente) => {
  const facturas = Array.isArray(cliente?.facturas) ? cliente.facturas : null;
  if (!facturas) return toMoney(cliente?.deuda_total); // fallback defensivo
  return facturas.reduce((acc, f) => {
    const saldo = toMoney(f?.saldo_pendiente);
    const estado = String(f?.estado || "").toLowerCase();
    const esConvenio = estado === "en convenio" || !!f?.convenio_id;
    if (saldo > 0 && estado !== "pagado" && !esConvenio) {
      return toMoney(acc + saldo);
    }
    return acc;
  }, 0);
};

/**
 * Liquidación total por cliente: muestra la lista de clientes con deuda
 * (la misma que se imprime en "Imprimir Deudores"), permite marcar los que
 * SIGUEN debiendo y liquida la deuda total completa del resto vía pago
 * distribuido FIFO (atómico por cliente en el backend).
 */
const ModalLiquidacionTotal = ({ isOpen, onClose, clientesConDeuda = [], onLiquidacionRegistrada }) => {
  const { setSuccess, setError } = useFeedback();
  const { registrarPagoDistribuido } = usePagos();

  const [fase, setFase] = useState("seleccion"); // "seleccion" | "confirmacion"
  const [confirmacionFinal, setConfirmacionFinal] = useState(false); // gate "¿completamente seguro?"
  const [procesando, setProcesando] = useState(false);
  const [clientesSiguenDebiendo, setClientesSiguenDebiendo] = useState(cargarSeleccionGuardada);
  const [search, setSearch] = useState("");
  const [soloExcluidos, setSoloExcluidos] = useState(false);
  const [ordenLista, setOrdenLista] = useState("predio"); // base: número de predio
  const [confSearch, setConfSearch] = useState(""); // búsqueda en la vista de revisión
  const [confOrden, setConfOrden] = useState("predio"); // orden en la vista de revisión
  const [visibleCount, setVisibleCount] = useState(LIST_PAGE);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split("T")[0]);
  const [comentario, setComentario] = useState("Liquidación total desde cobranza");
  const [mostrarErrores, setMostrarErrores] = useState(false);

  const listRef = useRef(null);

  // Solo son elegibles los clientes con deuda LIQUIDABLE (no-convenio) > 0.
  // Se les adjunta deuda_liquidable (lo que realmente se aplicará) y la parte
  // no liquidable (convenio) para mostrarla con transparencia.
  const clientesElegibles = useMemo(
    () =>
      (clientesConDeuda || [])
        .map((c) => {
          const deudaLiquidable = calcularDeudaLiquidable(c);
          return {
            ...c,
            deuda_liquidable: deudaLiquidable,
            deuda_no_liquidable: toMoney(toMoney(c.deuda_total) - deudaLiquidable)
          };
        })
        .filter((c) => c.deuda_liquidable > 0),
    [clientesConDeuda]
  );

  // Reinicia solo la UI efímera. La selección NO se toca aquí: persiste entre
  // aperturas/cierres del modal y reinicios de la app (ver STORAGE_KEY).
  const resetEstadoUI = () => {
    setFase("seleccion");
    setConfirmacionFinal(false);
    setSearch("");
    setSoloExcluidos(false);
    setOrdenLista("predio");
    setConfSearch("");
    setConfOrden("predio");
    setVisibleCount(LIST_PAGE);
    setMetodoPago("Efectivo");
    setFechaPago(new Date().toISOString().split("T")[0]);
    setComentario("Liquidación total desde cobranza");
    setMostrarErrores(false);
  };

  useEffect(() => {
    if (isOpen) resetEstadoUI();
  }, [isOpen]);

  // Guarda la selección "sigue debiendo" en localStorage en cada cambio para que
  // sobreviva al cierre del modal y de la app. Solo se borra al liquidar con éxito.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clientesSiguenDebiendo));
    } catch {
      /* noop */
    }
  }, [clientesSiguenDebiendo]);

  const elegiblesSet = useMemo(
    () => new Set(clientesElegibles.map((c) => c.cliente_id)),
    [clientesElegibles]
  );

  const siguenDebiendoValidos = useMemo(
    () => clientesSiguenDebiendo.filter((id) => elegiblesSet.has(id)),
    [clientesSiguenDebiendo, elegiblesSet]
  );

  const excluidosSet = useMemo(() => new Set(siguenDebiendoValidos), [siguenDebiendoValidos]);

  const clientesAplicables = useMemo(
    () => clientesElegibles.filter((c) => !excluidosSet.has(c.cliente_id)),
    [clientesElegibles, excluidosSet]
  );

  const totalAplicar = useMemo(
    () => clientesAplicables.reduce((acc, c) => toMoney(acc + toMoney(c.deuda_liquidable)), 0),
    [clientesAplicables]
  );

  // Vista de revisión: búsqueda + orden sobre los clientes que SÍ se liquidarán
  // (no cambia lo que se envía, solo cómo se muestra para revisar).
  const clientesAplicablesVista = useMemo(() => {
    const termino = normalizarTexto(confSearch);
    let base = clientesAplicables;
    if (termino) {
      base = base.filter((c) =>
        [c.cliente_nombre, c.numero_predio, c.cliente_id].map(normalizarTexto).join(" ").includes(termino)
      );
    }
    const ordenada = [...base];
    switch (confOrden) {
      case "deuda_desc":
        ordenada.sort((a, b) => toMoney(b.deuda_liquidable) - toMoney(a.deuda_liquidable));
        break;
      case "deuda_asc":
        ordenada.sort((a, b) => toMoney(a.deuda_liquidable) - toMoney(b.deuda_liquidable));
        break;
      case "predio":
      default:
        ordenada.sort((a, b) => {
          const pa = parsePredio(a.numero_predio);
          const pb = parsePredio(b.numero_predio);
          if (pa !== pb) return pa - pb;
          return String(a.numero_predio || "").localeCompare(String(b.numero_predio || ""), "es", { numeric: true, sensitivity: "base" });
        });
        break;
    }
    return ordenada;
  }, [clientesAplicables, confSearch, confOrden]);

  const clientesFiltrados = useMemo(() => {
    const termino = normalizarTexto(search);
    let base = clientesElegibles;

    if (soloExcluidos) {
      base = base.filter((c) => excluidosSet.has(c.cliente_id));
    }

    if (termino) {
      base = base.filter((c) => {
        const texto = [c.cliente_nombre, c.numero_predio, c.direccion, c.telefono, c.correo, c.cliente_id]
          .map((v) => normalizarTexto(v))
          .join(" ");
        return texto.includes(termino);
      });
    }

    const ordenada = [...base];
    switch (ordenLista) {
      case "deuda_desc":
        ordenada.sort((a, b) => toMoney(b.deuda_liquidable) - toMoney(a.deuda_liquidable));
        break;
      case "deuda_asc":
        ordenada.sort((a, b) => toMoney(a.deuda_liquidable) - toMoney(b.deuda_liquidable));
        break;
      case "predio":
      default:
        ordenada.sort((a, b) => {
          const pa = parsePredio(a.numero_predio);
          const pb = parsePredio(b.numero_predio);
          if (pa !== pb) return pa - pb;
          return String(a.numero_predio || "").localeCompare(String(b.numero_predio || ""), "es", { numeric: true, sensitivity: "base" });
        });
        break;
    }
    return ordenada;
  }, [clientesElegibles, search, soloExcluidos, excluidosSet, ordenLista]);

  const idsFiltrados = useMemo(() => clientesFiltrados.map((c) => c.cliente_id), [clientesFiltrados]);

  // Render incremental: solo se monta una "ventana" de filas; al hacer scroll se agregan más.
  // Reiniciamos al tope SOLO cuando cambian los criterios de filtro/orden o los datos base,
  // NO al marcar/desmarcar un cliente (eso conserva la posición de scroll).
  useEffect(() => {
    setVisibleCount(LIST_PAGE);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [search, soloExcluidos, ordenLista, clientesElegibles]);

  const handleListScroll = useCallback((e) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 240) {
      setVisibleCount((c) => (c < clientesFiltrados.length ? c + LIST_PAGE : c));
    }
  }, [clientesFiltrados.length]);

  const clientesVisibles = useMemo(
    () => clientesFiltrados.slice(0, visibleCount),
    [clientesFiltrados, visibleCount]
  );

  const toggleSigueDebiendo = (clienteId) => {
    setClientesSiguenDebiendo((prev) =>
      prev.includes(clienteId) ? prev.filter((id) => id !== clienteId) : [...prev, clienteId]
    );
  };

  const marcarPaginaSigueDebiendo = () => {
    setClientesSiguenDebiendo((prev) => Array.from(new Set([...prev, ...idsFiltrados])));
  };

  const limpiarExcluidos = () => setClientesSiguenDebiendo([]);

  const handleClose = () => {
    if (procesando) return;
    onClose();
  };

  const validarFormulario = () => {
    setMostrarErrores(true);
    if (!metodoPago) {
      setError("Debe seleccionar un método de pago.", "Liquidación total");
      return false;
    }
    if (!isValidPaymentDate(fechaPago)) {
      setError("Debe ingresar una fecha de pago válida (YYYY-MM-DD).", "Liquidación total");
      return false;
    }
    if (String(comentario || "").length > MAX_COMENTARIO) {
      setError(`El comentario no puede exceder ${MAX_COMENTARIO} caracteres.`, "Liquidación total");
      return false;
    }
    if (clientesAplicables.length === 0) {
      setError("No hay clientes a liquidar (todos están marcados como deudores).", "Liquidación total");
      return false;
    }
    return true;
  };

  const irAConfirmacion = () => {
    if (!validarFormulario()) return;
    setFase("confirmacion");
  };

  const ejecutarLiquidacion = async () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    const token_session = localStorage.getItem("token");
    if (!token_session) {
      setError("No se encontró token de sesión", "Liquidación total");
      return;
    }
    const modificadoPor = usuario.id || 1;

    setProcesando(true);

    let exitos = 0;
    let totalLiquidado = 0;
    const errores = [];

    for (const cliente of clientesAplicables) {
      const cantidad = toMoney(cliente.deuda_liquidable);
      if (!Number.isFinite(cantidad) || cantidad <= 0) continue;

      try {
        const response = await registrarPagoDistribuido({
          cliente_id: cliente.cliente_id,
          fecha_pago: fechaPago,
          cantidad_entregada: cantidad,
          metodo_pago: metodoPago,
          comentario: comentario || null,
          modificado_por: modificadoPor
        });

        if (!response?.success) {
          throw new Error(response?.message || "Error al registrar liquidación");
        }

        // Usamos el monto que el backend confirmó haber aplicado (no lo enviado):
        // si el saldo cambió entre la carga y la ejecución, el backend aplica solo
        // hasta el saldo real y devuelve el resto como cambio. Fallback a `cantidad`
        // por si una respuesta antigua no trae el campo.
        const aplicado = toMoney(response?.data?.monto_aplicado ?? cantidad);
        exitos += 1;
        totalLiquidado = toMoney(totalLiquidado + aplicado);
      } catch (error) {
        errores.push(`${cliente.cliente_nombre || `#${cliente.cliente_id}`}`);
      }
    }

    setProcesando(false);

    if (onLiquidacionRegistrada) {
      await onLiquidacionRegistrada();
    }

    if (exitos > 0 && errores.length === 0) {
      // Éxito total: este es el único punto donde se borra la selección guardada.
      setClientesSiguenDebiendo([]);
      limpiarSeleccionGuardada();
      setSuccess(`Liquidación aplicada a ${exitos} cliente(s) por $${formatMoney(totalLiquidado)}.`, "Liquidación total");
      onClose();
      return;
    }

    if (exitos > 0 && errores.length > 0) {
      setError(
        `Se liquidaron ${exitos} cliente(s), pero fallaron ${errores.length} (${errores.slice(0, 5).join(", ")}${errores.length > 5 ? "…" : ""}). Revisa y reintenta solo los pendientes.`,
        "Liquidación total"
      );
      // Volvemos a selección para que pueda reintentar; el refresh ya actualizó deudas.
      setConfirmacionFinal(false);
      setFase("seleccion");
      return;
    }

    setError("No se pudo registrar ninguna liquidación.", "Liquidación total");
    setConfirmacionFinal(false);
    setFase("seleccion");
  };

  const canContinuar = clientesAplicables.length > 0
    && isValidPaymentDate(fechaPago)
    && String(comentario || "").length <= MAX_COMENTARIO;

  return (
    <Modal
      show={isOpen}
      size="6xl"
      onClose={handleClose}
      theme={premiumModalTheme}
      dismissible={!procesando}
    >
      <Modal.Header>
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl p-3">
            <HiCash className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
              Liquidación Total por Cliente
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
              {fase === "seleccion" ? (
                <>Marca los clientes que <strong className="text-orange-500 dark:text-orange-400">SIGUEN debiendo</strong>. Al resto se le liquidará su deuda total completa.</>
              ) : (
                <>Revisa el resumen antes de aplicar. Esta acción registra pagos reales.</>
              )}
            </p>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        {fase === "seleccion" ? (
          <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Total Deudores</p>
                <p className="text-4xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{clientesElegibles.length}</p>
              </div>
              <div className="bg-orange-500/5 dark:bg-orange-900/10 border border-orange-500/20 rounded-2xl p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600/80 dark:text-orange-400/80 mb-2">Siguen Debiendo</p>
                <p className="text-4xl font-black tracking-tight text-orange-600 dark:text-orange-400">{siguenDebiendoValidos.length}</p>
              </div>
              <div className="bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/80 dark:text-emerald-400/80 mb-2">Se Liquidan</p>
                <p className="text-4xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">{clientesAplicables.length}</p>
              </div>
              <div className="bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/80 dark:text-emerald-400/80 mb-2">Total a Aplicar</p>
                <p className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">${formatMoney(totalAplicar)}</p>
              </div>
            </div>

            {/* Formulario */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 block">
                  Método de pago*
                </label>
                <div className="relative">
                  <HiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className={`${inputBaseClasses} pl-10`}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 block">
                  Fecha de pago*
                </label>
                <input
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  className={`${inputBaseClasses} ${mostrarErrores && !isValidPaymentDate(fechaPago) ? "border-rose-500 focus:ring-rose-500" : "focus:ring-emerald-500"}`}
                />
                {mostrarErrores && !isValidPaymentDate(fechaPago) && (
                  <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">Fecha inválida</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 block">
                  Comentario
                </label>
                <input
                  type="text"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  maxLength={MAX_COMENTARIO}
                  placeholder="Nota interna..."
                  className={`${inputBaseClasses} focus:ring-emerald-500`}
                />
                <div className="flex justify-end mt-1">
                  <p className={`text-[10px] font-bold ${String(comentario || "").length > MAX_COMENTARIO ? "text-rose-500" : "text-slate-400 dark:text-zinc-600"}`}>
                    {String(comentario || "").length} / {MAX_COMENTARIO}
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-slate-100 dark:border-zinc-800/50" />

            {/* Área de selección */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative w-full sm:w-[320px]">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <SearchIcon className="w-5 h-5" />
                    </span>
                    <input
                      placeholder="Buscar cliente o predio..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-12 pr-10 py-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                      >
                        <HiX className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <select
                    value={ordenLista}
                    onChange={(e) => setOrdenLista(e.target.value)}
                    aria-label="Ordenar lista"
                    className="h-[46px] px-4 pr-8 text-sm font-bold rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 appearance-none cursor-pointer"
                  >
                    <option value="predio">Por número de predio</option>
                    <option value="deuda_desc">Mayor deuda primero</option>
                    <option value="deuda_asc">Menor deuda primero</option>
                  </select>

                  <label className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={soloExcluidos}
                      onChange={(e) => setSoloExcluidos(e.target.checked)}
                      className="w-4 h-4 rounded accent-orange-500"
                    />
                    <span className="text-sm font-bold text-slate-600 dark:text-zinc-400">Ver solo deudores marcados</span>
                  </label>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button type="button" onClick={marcarPaginaSigueDebiendo} className="px-4 h-9 text-sm font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
                    Marcar todos
                  </button>
                  <button type="button" onClick={limpiarExcluidos} className="px-4 h-9 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                    Resetear
                  </button>
                </div>
              </div>

              <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                <HiShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Tu selección se guarda automáticamente y se conserva aunque cierres el modal o la app; solo se borra al liquidar con éxito.
              </p>

              {/* Lista de clientes (scroll infinito / render incremental) */}
              <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div ref={listRef} onScroll={handleListScroll} className="max-h-[400px] overflow-auto">
                  {clientesFiltrados.length === 0 ? (
                    <div className="p-12 text-center text-sm font-medium text-slate-400 dark:text-zinc-500">
                      No hay clientes con deuda en los filtros actuales.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                      {clientesVisibles.map((cliente) => {
                        const isExcluded = excluidosSet.has(cliente.cliente_id);
                        return (
                          <label
                            key={cliente.cliente_id}
                            className={`flex items-center justify-between gap-4 p-4 cursor-pointer transition-all ${isExcluded ? "bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-50 dark:hover:bg-orange-900/20" : "hover:bg-slate-50 dark:hover:bg-zinc-900/50"}`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono font-bold text-slate-400 dark:text-zinc-500">#{cliente.cliente_id}</span>
                                <p className={`text-sm font-bold truncate ${isExcluded ? "text-orange-700 dark:text-orange-400" : "text-slate-800 dark:text-zinc-100"}`}>
                                  {cliente.cliente_nombre}
                                </p>
                              </div>
                              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 truncate flex items-center gap-2">
                                <span><strong className="text-slate-400 uppercase tracking-wider text-[10px]">Predio</strong> {cliente.numero_predio || "-"}</span>
                                <span className="text-slate-300">•</span>
                                <span><strong className="text-slate-400 uppercase tracking-wider text-[10px]">Pendientes</strong> {cliente.facturas_pendientes ?? "-"}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-6 shrink-0">
                              <div className="text-right">
                                <p className={`text-base font-black tracking-tight ${isExcluded ? "text-orange-600/50 dark:text-orange-500/50 line-through" : "text-emerald-600 dark:text-emerald-400"}`}>
                                  ${formatMoney(cliente.deuda_liquidable)}
                                </p>
                                {cliente.deuda_no_liquidable > 0 && (
                                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400" title="Saldo en convenio: no se liquida con esta herramienta">
                                    + ${formatMoney(cliente.deuda_no_liquidable)} en convenio
                                  </p>
                                )}
                              </div>
                              <div className="w-[150px] flex items-center justify-end gap-2">
                                <input
                                  type="checkbox"
                                  checked={isExcluded}
                                  onChange={() => toggleSigueDebiendo(cliente.cliente_id)}
                                  className="w-4 h-4 rounded accent-orange-500"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className={`text-xs font-bold ${isExcluded ? "text-orange-600 dark:text-orange-500" : "text-slate-400"}`}>
                                  {isExcluded ? "Sigue debiendo" : "Liquidar"}
                                </span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                      {visibleCount < clientesFiltrados.length && (
                        <div className="p-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                          Desplázate para ver más · {clientesFiltrados.length - visibleCount} restantes
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 text-center">
                Mostrando {Math.min(visibleCount, clientesFiltrados.length)} de {clientesFiltrados.length}
              </p>
            </div>
          </div>
        ) : (
          /* ── FASE CONFIRMACIÓN ── */
          <div className="space-y-6">
            <div className="bg-amber-500/5 dark:bg-amber-900/10 border border-amber-500/30 rounded-2xl p-6 flex items-start gap-4">
              <HiExclamationCircle className="w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <p className="text-base font-bold text-slate-800 dark:text-zinc-100">Confirma la liquidación masiva</p>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
                  Se registrarán pagos reales que saldan la deuda total de cada cliente seleccionado (reparto FIFO sobre todas sus facturas pendientes). Esta acción queda en la auditoría a tu nombre.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/80 dark:text-emerald-400/80 mb-2">Clientes a liquidar</p>
                <p className="text-4xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">{clientesAplicables.length}</p>
              </div>
              <div className="bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/80 dark:text-emerald-400/80 mb-2">Total a aplicar</p>
                <p className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">${formatMoney(totalAplicar)}</p>
              </div>
              <div className="bg-orange-500/5 dark:bg-orange-900/10 border border-orange-500/20 rounded-2xl p-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600/80 dark:text-orange-400/80 mb-2">Quedan debiendo</p>
                <p className="text-4xl font-black tracking-tight text-orange-600 dark:text-orange-400">{siguenDebiendoValidos.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Método</span>
                <p className="font-bold text-slate-800 dark:text-zinc-100">{metodoPago}</p>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fecha de pago</span>
                <p className="font-bold text-slate-800 dark:text-zinc-100">{fechaPago}</p>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Comentario</span>
                <p className="font-bold text-slate-800 dark:text-zinc-100 truncate">{comentario || "—"}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800/50 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <HiShieldCheck className="w-4 h-4 text-emerald-500" /> Se liquidarán ({clientesAplicables.length}{confSearch ? ` · ${clientesAplicablesVista.length} en vista` : ""})
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <SearchIcon className="w-4 h-4" />
                    </span>
                    <input
                      placeholder="Buscar..."
                      value={confSearch}
                      onChange={(e) => setConfSearch(e.target.value)}
                      className="w-[150px] sm:w-[200px] pl-8 pr-7 h-9 bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                    />
                    {confSearch && (
                      <button
                        onClick={() => setConfSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                      >
                        <HiX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <select
                    value={confOrden}
                    onChange={(e) => setConfOrden(e.target.value)}
                    aria-label="Ordenar revisión"
                    className="h-9 px-3 pr-7 text-sm font-bold rounded-lg bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer"
                  >
                    <option value="predio">Predio</option>
                    <option value="deuda_desc">Mayor deuda</option>
                    <option value="deuda_asc">Menor deuda</option>
                  </select>
                </div>
              </div>
              <div className="max-h-[280px] overflow-auto divide-y divide-slate-100 dark:divide-zinc-800/50">
                {clientesAplicablesVista.length === 0 ? (
                  <div className="p-8 text-center text-sm font-medium text-slate-400 dark:text-zinc-500">
                    Sin coincidencias para la búsqueda.
                  </div>
                ) : clientesAplicablesVista.map((cliente) => (
                  <div key={cliente.cliente_id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400 dark:text-zinc-500">#{cliente.cliente_id}</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">{cliente.cliente_nombre}</span>
                      <span className="text-xs text-slate-400">· Predio {cliente.numero_predio || "-"}</span>
                    </div>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 shrink-0">${formatMoney(cliente.deuda_liquidable)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        {fase === "seleccion" ? (
          <>
            <button
              type="button"
              onClick={handleClose}
              disabled={procesando}
              className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6 h-11 disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={irAConfirmacion}
              disabled={!canContinuar}
              className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-8 h-11 shadow-sm disabled:opacity-50 hover:bg-slate-800 dark:hover:bg-zinc-100 transition-colors"
            >
              Revisar y confirmar ({clientesAplicables.length})
            </button>
          </>
        ) : (
          confirmacionFinal ? (
            <>
              <span className="mr-auto text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <HiExclamationCircle className="w-5 h-5 shrink-0" />
                ¿Estás completamente seguro? Se registrarán {clientesAplicables.length} pago(s) por ${formatMoney(totalAplicar)}.
              </span>
              <button
                type="button"
                onClick={() => setConfirmacionFinal(false)}
                disabled={procesando}
                className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6 h-11 disabled:opacity-40"
              >
                No, revisar
              </button>
              <button
                type="button"
                onClick={ejecutarLiquidacion}
                disabled={procesando || clientesAplicables.length === 0}
                className="font-bold bg-rose-600 text-white rounded-xl px-8 h-11 shadow-sm disabled:opacity-50 flex items-center gap-2 hover:bg-rose-700 transition-colors"
              >
                {procesando && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Sí, registrar ahora
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setConfirmacionFinal(false); setFase("seleccion"); }}
                disabled={procesando}
                className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6 h-11 disabled:opacity-40 flex items-center gap-2"
              >
                <HiArrowLeft className="w-4 h-4" /> Volver
              </button>
              <button
                type="button"
                onClick={() => setConfirmacionFinal(true)}
                disabled={procesando || clientesAplicables.length === 0}
                className="font-bold bg-emerald-600 text-white rounded-xl px-8 h-11 shadow-sm disabled:opacity-50 flex items-center gap-2 hover:bg-emerald-700 transition-colors"
              >
                Liquidar {clientesAplicables.length} cliente(s) · ${formatMoney(totalAplicar)}
              </button>
            </>
          )
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ModalLiquidacionTotal;
