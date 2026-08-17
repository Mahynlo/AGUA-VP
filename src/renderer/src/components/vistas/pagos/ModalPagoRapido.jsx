import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "flowbite-react";
import { HiX, HiCreditCard, HiCash, HiExclamationCircle, HiArrowLeft, HiShieldCheck } from "react-icons/hi";
import { SearchIcon } from "../../../IconsApp/IconsSidebar";
import { useFeedback } from "../../../context/FeedbackContext";

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
const STORAGE_KEY_BASE = "aguavp:pago-rapido:seleccion"; // selección "no pagaron" persistida por periodo

const keyFor = (periodo) => `${STORAGE_KEY_BASE}:${periodo || "actual"}`;

const cargarSeleccionGuardada = (periodo) => {
  try {
    const raw = localStorage.getItem(keyFor(periodo));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((id) => Number(id)).filter((id) => Number.isFinite(id));
  } catch {
    return [];
  }
};

const limpiarSeleccionGuardada = (periodo) => {
  try {
    localStorage.removeItem(keyFor(periodo));
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

const ModalPagoRapido = ({ isOpen, onClose, periodo, onPagoRegistrado }) => {
  const { setSuccess, setError } = useFeedback();

  const [fase, setFase] = useState("seleccion"); // "seleccion" | "confirmacion"
  const [confirmacionFinal, setConfirmacionFinal] = useState(false); // gate "¿completamente seguro?"
  const [procesandoPagoRapido, setProcesandoPagoRapido] = useState(false);
  const [facturasNoPagaron, setFacturasNoPagaron] = useState([]);
  const [facturasPagoRapido, setFacturasPagoRapido] = useState([]);
  const [cargandoFacturasPagoRapido, setCargandoFacturasPagoRapido] = useState(false);
  const [searchPagoRapido, setSearchPagoRapido] = useState("");
  const [soloNoPagaron, setSoloNoPagaron] = useState(false);
  const [ordenLista, setOrdenLista] = useState("predio"); // base: número de predio
  const [confSearch, setConfSearch] = useState(""); // búsqueda en la vista de revisión
  const [confOrden, setConfOrden] = useState("predio"); // orden en la vista de revisión
  const [visibleCount, setVisibleCount] = useState(LIST_PAGE);
  const [metodoPagoRapido, setMetodoPagoRapido] = useState("Efectivo");
  const [fechaPagoRapido, setFechaPagoRapido] = useState(new Date().toISOString().split("T")[0]);
  const [comentarioPagoRapido, setComentarioPagoRapido] = useState("Pago masivo desde modo rapido");
  const [mostrarErrores, setMostrarErrores] = useState(false);

  const listRef = useRef(null);

  const facturasElegiblesPagoRapido = useMemo(() => {
    return facturasPagoRapido.filter((factura) => {
      const saldo = Number(factura.saldo_pendiente || 0);
      const esConvenio = factura.estado === "En Convenio" || !!factura.convenio_id;
      return saldo > 0 && factura.estado !== "Pagado" && !esConvenio;
    });
  }, [facturasPagoRapido]);

  const idsElegiblesSet = useMemo(
    () => new Set(facturasElegiblesPagoRapido.map((f) => f.id)),
    [facturasElegiblesPagoRapido]
  );

  const facturasNoPagaronValidas = useMemo(
    () => facturasNoPagaron.filter((id) => idsElegiblesSet.has(id)),
    [facturasNoPagaron, idsElegiblesSet]
  );

  const noPagaronSet = useMemo(() => new Set(facturasNoPagaronValidas), [facturasNoPagaronValidas]);

  const facturasFiltradasPagoRapido = useMemo(() => {
    const termino = normalizarTexto(searchPagoRapido);
    let base = facturasElegiblesPagoRapido;

    if (soloNoPagaron) {
      base = base.filter((factura) => noPagaronSet.has(factura.id));
    }

    if (termino) {
      base = base.filter((factura) => {
        const textoBusqueda = [
          factura.cliente_nombre,
          factura.direccion_cliente,
          factura.medidor_numero_serie,
          factura?.medidor?.numero_serie,
          factura?.medidor?.ubicacion,
          factura.cliente_numero_predio,
          factura.id
        ]
          .map((v) => normalizarTexto(v))
          .join(" ");

        return textoBusqueda.includes(termino);
      });
    }

    const ordenada = [...base];
    switch (ordenLista) {
      case "deuda_desc":
        ordenada.sort((a, b) => toMoney(b.saldo_pendiente) - toMoney(a.saldo_pendiente));
        break;
      case "deuda_asc":
        ordenada.sort((a, b) => toMoney(a.saldo_pendiente) - toMoney(b.saldo_pendiente));
        break;
      case "predio":
      default:
        ordenada.sort((a, b) => {
          const pa = parsePredio(a.cliente_numero_predio);
          const pb = parsePredio(b.cliente_numero_predio);
          if (pa !== pb) return pa - pb;
          return String(a.cliente_numero_predio || "").localeCompare(String(b.cliente_numero_predio || ""), "es", { numeric: true, sensitivity: "base" });
        });
        break;
    }
    return ordenada;
  }, [facturasElegiblesPagoRapido, searchPagoRapido, soloNoPagaron, noPagaronSet, ordenLista]);

  const idsFiltradosPagoRapido = useMemo(
    () => facturasFiltradasPagoRapido.map((f) => f.id),
    [facturasFiltradasPagoRapido]
  );

  // Facturas a las que SÍ se aplicará pago (las elegibles no excluidas).
  const pagosRapidosAplicables = useMemo(
    () => facturasElegiblesPagoRapido.filter((factura) => !noPagaronSet.has(factura.id)),
    [facturasElegiblesPagoRapido, noPagaronSet]
  );

  const totalAplicar = useMemo(
    () => pagosRapidosAplicables.reduce((acc, f) => toMoney(acc + toMoney(f.saldo_pendiente)), 0),
    [pagosRapidosAplicables]
  );

  // Vista de revisión: búsqueda + orden sobre las facturas que SÍ se cobrarán
  // (no cambia lo que se envía, solo cómo se muestra para revisar).
  const pagosRapidosAplicablesVista = useMemo(() => {
    const termino = normalizarTexto(confSearch);
    let base = pagosRapidosAplicables;
    if (termino) {
      base = base.filter((f) =>
        [f.cliente_nombre, f.cliente_numero_predio, f.medidor_numero_serie, f.id]
          .map(normalizarTexto)
          .join(" ")
          .includes(termino)
      );
    }
    const ordenada = [...base];
    switch (confOrden) {
      case "deuda_desc":
        ordenada.sort((a, b) => toMoney(b.saldo_pendiente) - toMoney(a.saldo_pendiente));
        break;
      case "deuda_asc":
        ordenada.sort((a, b) => toMoney(a.saldo_pendiente) - toMoney(b.saldo_pendiente));
        break;
      case "predio":
      default:
        ordenada.sort((a, b) => {
          const pa = parsePredio(a.cliente_numero_predio);
          const pb = parsePredio(b.cliente_numero_predio);
          if (pa !== pb) return pa - pb;
          return String(a.cliente_numero_predio || "").localeCompare(String(b.cliente_numero_predio || ""), "es", { numeric: true, sensitivity: "base" });
        });
        break;
    }
    return ordenada;
  }, [pagosRapidosAplicables, confSearch, confOrden]);

  // Render incremental: solo se monta una "ventana" de filas; al hacer scroll se agregan más.
  // Reiniciamos al tope SOLO cuando cambian criterios de filtro o los datos base,
  // NO al marcar/desmarcar una factura (eso conserva la posición de scroll).
  useEffect(() => {
    setVisibleCount(LIST_PAGE);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [searchPagoRapido, soloNoPagaron, ordenLista, facturasPagoRapido]);

  const handleListScroll = useCallback((e) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 240) {
      setVisibleCount((c) => (c < facturasFiltradasPagoRapido.length ? c + LIST_PAGE : c));
    }
  }, [facturasFiltradasPagoRapido.length]);

  const facturasVisibles = useMemo(
    () => facturasFiltradasPagoRapido.slice(0, visibleCount),
    [facturasFiltradasPagoRapido, visibleCount]
  );

  // Reinicia solo la UI efímera. La selección NO se toca aquí.
  const resetEstadoUI = () => {
    setFase("seleccion");
    setConfirmacionFinal(false);
    setSearchPagoRapido("");
    setSoloNoPagaron(false);
    setOrdenLista("predio");
    setConfSearch("");
    setConfOrden("predio");
    setVisibleCount(LIST_PAGE);
    setMetodoPagoRapido("Efectivo");
    setFechaPagoRapido(new Date().toISOString().split("T")[0]);
    setComentarioPagoRapido("Pago masivo desde modo rapido");
    setMostrarErrores(false);
  };

  const cargarFacturasPagoRapidoCompleto = async () => {
    const token_session = localStorage.getItem("token");
    if (!token_session) {
      throw new Error("No se encontró token de sesión");
    }

    setCargandoFacturasPagoRapido(true);

    const limit = 200;
    let page = 1;
    let totalPagesApi = 1;
    const acumuladas = [];

    do {
      const response = await window.api.fetchFacturas(token_session, {
        periodo,
        page,
        limit,
        search: "",
        estado: ""
      });

      const facturasPagina = Array.isArray(response)
        ? response
        : Array.isArray(response?.facturas)
          ? response.facturas
          : [];

      acumuladas.push(...facturasPagina);

      if (Array.isArray(response)) {
        totalPagesApi = 1;
      } else {
        totalPagesApi = Number(response?.pagination?.totalPages || 1);
      }

      page += 1;
    } while (page <= totalPagesApi && page <= 200);

    const unicas = Array.from(
      new Map(acumuladas.map((factura) => [factura.id, factura])).values()
    );

    setFacturasPagoRapido(unicas);
    setCargandoFacturasPagoRapido(false);
  };

  const handleOpen = async () => {
    resetEstadoUI();
    // Restaura la selección guardada de este periodo (persistida entre cierres / reinicios).
    setFacturasNoPagaron(cargarSeleccionGuardada(periodo));
    try {
      await cargarFacturasPagoRapidoCompleto();
    } catch (error) {
      setError(error.message || "No se pudieron cargar todas las facturas para modo rápido", "Pago rápido");
      setCargandoFacturasPagoRapido(false);
    }
  };

  const handleClose = () => {
    if (procesandoPagoRapido) return;
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      handleOpen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, periodo]);

  // Guarda la selección "no pagaron" del periodo en cada cambio para que sobreviva
  // al cierre del modal y de la app. Solo se borra al registrar con éxito.
  useEffect(() => {
    if (!isOpen) return;
    try {
      localStorage.setItem(keyFor(periodo), JSON.stringify(facturasNoPagaron));
    } catch {
      /* noop */
    }
  }, [facturasNoPagaron, periodo, isOpen]);

  const toggleFacturaNoPago = (facturaId) => {
    setFacturasNoPagaron((prev) => {
      if (prev.includes(facturaId)) {
        return prev.filter((id) => id !== facturaId);
      }
      return [...prev, facturaId];
    });
  };

  const marcarTodasNoPagaron = () => {
    setFacturasNoPagaron((prev) => Array.from(new Set([...prev, ...idsFiltradosPagoRapido])));
  };

  const limpiarNoPagaron = () => {
    setFacturasNoPagaron([]);
  };

  const validarFormulario = () => {
    setMostrarErrores(true);

    if (!metodoPagoRapido) {
      setError("Debe seleccionar un método de pago.", "Pago rápido");
      return false;
    }
    if (!isValidPaymentDate(fechaPagoRapido)) {
      setError("Debe ingresar una fecha de pago válida (YYYY-MM-DD).", "Pago rápido");
      return false;
    }
    if (String(comentarioPagoRapido || "").length > MAX_COMENTARIO) {
      setError(`El comentario no puede exceder ${MAX_COMENTARIO} caracteres.`, "Pago rápido");
      return false;
    }
    if (pagosRapidosAplicables.length === 0) {
      setError("No hay facturas para aplicar pago en este modo.", "Pago rápido");
      return false;
    }
    return true;
  };

  const irAConfirmacion = () => {
    if (!validarFormulario()) return;
    setFase("confirmacion");
  };

  const ejecutarPagoRapido = async () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    const token_session = localStorage.getItem("token");
    if (!token_session) {
      setError("No se encontró token de sesión", "Pago rápido");
      return;
    }
    const modificadoPor = usuario.id || 1;

    setProcesandoPagoRapido(true);

    let exitos = 0;
    let totalCobrado = 0;
    const errores = [];

    for (const factura of pagosRapidosAplicables) {
      try {
        const cantidad = Number(factura.saldo_pendiente || 0);
        if (!Number.isFinite(cantidad) || cantidad <= 0) {
          continue;
        }

        const response = await window.api.registerPago({
          factura_id: factura.id,
          fecha_pago: fechaPagoRapido,
          cantidad_entregada: cantidad,
          metodo_pago: metodoPagoRapido,
          comentario: comentarioPagoRapido || null,
          modificado_por: modificadoPor
        }, token_session);

        if (!response?.success) {
          throw new Error(response?.message || "Error al registrar pago");
        }

        // Usamos el monto que el backend confirmó haber aplicado (no lo enviado):
        // si el saldo cambió entre la carga y la ejecución, el backend aplica solo
        // hasta el saldo real. Fallback a `cantidad` por compatibilidad.
        const aplicado = toMoney(response?.monto_aplicado ?? cantidad);
        exitos += 1;
        totalCobrado = toMoney(totalCobrado + aplicado);
      } catch (error) {
        errores.push(`#${factura.id}`);
      }
    }

    setProcesandoPagoRapido(false);

    if (onPagoRegistrado) {
      await onPagoRegistrado();
    }

    if (exitos > 0 && errores.length === 0) {
      // Éxito total: único punto donde se borra la selección guardada del periodo.
      setFacturasNoPagaron([]);
      limpiarSeleccionGuardada(periodo);
      setSuccess(`Pago rápido aplicado en ${exitos} facturas por $${formatMoney(totalCobrado)}.`);
      onClose();
      return;
    }

    if (exitos > 0 && errores.length > 0) {
      setError(
        `Se aplicaron ${exitos} pagos, pero fallaron ${errores.length} facturas (${errores.slice(0, 8).join(", ")}${errores.length > 8 ? "…" : ""}). Las pagadas ya no aparecen; revisa y reintenta las pendientes.`,
        "Pago rápido"
      );
      setConfirmacionFinal(false);
      setFase("seleccion");
      // Recarga la lista local para que las facturas ya pagadas (saldo 0) salgan
      // de las elegibles y un reintento no las vuelva a cobrar.
      try {
        await cargarFacturasPagoRapidoCompleto();
      } catch {
        /* el feedback de error ya se mostró arriba */
      }
      return;
    }

    setError("No se pudo registrar ningún pago en modo rápido.", "Pago rápido");
    setConfirmacionFinal(false);
    setFase("seleccion");
  };

  const canContinuar = !cargandoFacturasPagoRapido
    && pagosRapidosAplicables.length > 0
    && isValidPaymentDate(fechaPagoRapido)
    && String(comentarioPagoRapido || "").length <= MAX_COMENTARIO;

  return (
    <Modal
      show={isOpen}
      size="6xl"
      onClose={handleClose}
      theme={premiumModalTheme}
      dismissible={!procesandoPagoRapido}
    >
      <Modal.Header>
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl p-3">
            <HiCash className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
              Liquidación de Periodo
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
              {fase === "seleccion" ? (
                <>Marca las facturas que <strong className="text-orange-500 dark:text-orange-400">NO</strong> pagaron. El sistema aplicará pago total al resto.</>
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
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Total Elegibles</p>
                <p className="text-4xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{facturasElegiblesPagoRapido.length}</p>
              </div>
              <div className="bg-orange-500/5 dark:bg-orange-900/10 border border-orange-500/20 rounded-2xl p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600/80 dark:text-orange-400/80 mb-2">Excluidas (No pagaron)</p>
                <p className="text-4xl font-black tracking-tight text-orange-600 dark:text-orange-400">{facturasNoPagaronValidas.length}</p>
              </div>
              <div className="bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/80 dark:text-emerald-400/80 mb-2">Se Cobrarán</p>
                <p className="text-4xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">{pagosRapidosAplicables.length}</p>
              </div>
              <div className="bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/80 dark:text-emerald-400/80 mb-2">Total a Cobrar</p>
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
                    value={metodoPagoRapido}
                    onChange={(e) => setMetodoPagoRapido(e.target.value)}
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
                  value={fechaPagoRapido}
                  onChange={(e) => setFechaPagoRapido(e.target.value)}
                  className={`${inputBaseClasses} ${mostrarErrores && !isValidPaymentDate(fechaPagoRapido) ? "border-rose-500 focus:ring-rose-500" : "focus:ring-emerald-500"}`}
                />
                {mostrarErrores && !isValidPaymentDate(fechaPagoRapido) && (
                  <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">Fecha inválida</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 block">
                  Comentario
                </label>
                <input
                  type="text"
                  value={comentarioPagoRapido}
                  onChange={(e) => setComentarioPagoRapido(e.target.value)}
                  maxLength={MAX_COMENTARIO}
                  placeholder="Nota interna..."
                  className={`${inputBaseClasses} focus:ring-emerald-500`}
                />
                <div className="flex justify-end mt-1">
                  <p className={`text-[10px] font-bold ${String(comentarioPagoRapido || "").length > MAX_COMENTARIO ? "text-rose-500" : "text-slate-400 dark:text-zinc-600"}`}>
                    {String(comentarioPagoRapido || "").length} / {MAX_COMENTARIO}
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
                      value={searchPagoRapido}
                      onChange={(e) => setSearchPagoRapido(e.target.value)}
                      className="w-full pl-12 pr-10 py-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm"
                    />
                    {searchPagoRapido && (
                      <button
                        onClick={() => setSearchPagoRapido("")}
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

                  <label className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors h-[46px]">
                    <input
                      type="checkbox"
                      checked={soloNoPagaron}
                      onChange={(e) => setSoloNoPagaron(e.target.checked)}
                      className="w-4 h-4 rounded accent-orange-500 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-slate-600 dark:text-zinc-400">Ver solo excluidas</span>
                  </label>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button 
                    type="button" 
                    onClick={marcarTodasNoPagaron} 
                    className="px-4 h-[46px] text-sm font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-xl hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors shadow-sm"
                  >
                    Excluir todas
                  </button>
                  <button 
                    type="button" 
                    onClick={limpiarNoPagaron} 
                    className="px-4 h-[46px] text-sm font-bold bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                  >
                    Resetear
                  </button>
                </div>
              </div>

              <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                <HiShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Tu selección se guarda automáticamente para este periodo y se conserva aunque cierres el modal o la app; solo se borra al registrar con éxito.
              </p>

              {/* Lista de facturas (scroll infinito / render incremental) */}
              <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div ref={listRef} onScroll={handleListScroll} className="max-h-[400px] overflow-auto">
                  {cargandoFacturasPagoRapido ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-4 text-slate-500 dark:text-zinc-400">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-600 dark:border-zinc-400" />
                      <p className="text-sm font-bold tracking-wider uppercase">Cargando facturas...</p>
                    </div>
                  ) : facturasFiltradasPagoRapido.length === 0 ? (
                    <div className="p-12 text-center text-sm font-medium text-slate-400 dark:text-zinc-500">
                      No hay facturas pendientes en los filtros actuales.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                      {facturasVisibles.map((factura) => {
                        const isExcluded = noPagaronSet.has(factura.id);
                        return (
                          <label
                            key={factura.id}
                            className={`flex items-center justify-between gap-4 p-4 cursor-pointer transition-all ${isExcluded ? "bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-50 dark:hover:bg-orange-900/20" : "hover:bg-slate-50 dark:hover:bg-zinc-900/50"}`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono font-bold text-slate-400 dark:text-zinc-500">#{factura.id}</span>
                                <p className={`text-sm font-bold truncate ${isExcluded ? "text-orange-700 dark:text-orange-400" : "text-slate-800 dark:text-zinc-100"}`}>
                                  {factura.cliente_nombre}
                                </p>
                              </div>
                              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 truncate flex items-center gap-2">
                                <span><strong className="text-slate-400 uppercase tracking-wider text-[10px]">Predio</strong> {factura.cliente_numero_predio || "-"}</span>
                                <span className="text-slate-300">•</span>
                                <span><strong className="text-slate-400 uppercase tracking-wider text-[10px]">Medidor</strong> {factura.medidor_numero_serie || factura?.medidor?.numero_serie || "-"}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-6 shrink-0">
                              <p className={`text-base font-black tracking-tight ${isExcluded ? "text-orange-600/50 dark:text-orange-500/50 line-through" : "text-emerald-600 dark:text-emerald-400"}`}>
                                ${formatMoney(factura.saldo_pendiente)}
                              </p>
                              <div className="w-[120px] flex items-center justify-end gap-2">
                                <input
                                  type="checkbox"
                                  checked={isExcluded}
                                  onChange={() => toggleFacturaNoPago(factura.id)}
                                  className="w-4 h-4 rounded accent-orange-500"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className={`text-xs font-bold ${isExcluded ? "text-orange-600 dark:text-orange-500" : "text-slate-400"}`}>
                                  {isExcluded ? "Excluida" : "Cobrar"}
                                </span>
                              </div>
                            </div>
                          </label>
                        );
                      })}

                      {visibleCount < facturasFiltradasPagoRapido.length && (
                        <div className="p-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                          Desplázate para ver más · {facturasFiltradasPagoRapido.length - visibleCount} restantes
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {!cargandoFacturasPagoRapido && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 text-center">
                  Mostrando {Math.min(visibleCount, facturasFiltradasPagoRapido.length)} de {facturasFiltradasPagoRapido.length}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* ── FASE CONFIRMACIÓN ── */
          <div className="space-y-6">
            <div className="bg-amber-500/5 dark:bg-amber-900/10 border border-amber-500/30 rounded-2xl p-6 flex items-start gap-4">
              <HiExclamationCircle className="w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <p className="text-base font-bold text-slate-800 dark:text-zinc-100">Confirma el pago masivo</p>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
                  Se registrarán pagos reales que saldan por completo cada factura seleccionada. Esta acción queda en la auditoría a tu nombre.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/80 dark:text-emerald-400/80 mb-2">Facturas a cobrar</p>
                <p className="text-4xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">{pagosRapidosAplicables.length}</p>
              </div>
              <div className="bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/80 dark:text-emerald-400/80 mb-2">Total a cobrar</p>
                <p className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">${formatMoney(totalAplicar)}</p>
              </div>
              <div className="bg-orange-500/5 dark:bg-orange-900/10 border border-orange-500/20 rounded-2xl p-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600/80 dark:text-orange-400/80 mb-2">Excluidas (No pagaron)</p>
                <p className="text-4xl font-black tracking-tight text-orange-600 dark:text-orange-400">{facturasNoPagaronValidas.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Método</span>
                <p className="font-bold text-slate-800 dark:text-zinc-100">{metodoPagoRapido}</p>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fecha de pago</span>
                <p className="font-bold text-slate-800 dark:text-zinc-100">{fechaPagoRapido}</p>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Comentario</span>
                <p className="font-bold text-slate-800 dark:text-zinc-100 truncate">{comentarioPagoRapido || "—"}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800/50 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <HiShieldCheck className="w-4 h-4 text-emerald-500" /> Se cobrarán ({pagosRapidosAplicables.length}{confSearch ? ` · ${pagosRapidosAplicablesVista.length} en vista` : ""})
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
                {pagosRapidosAplicablesVista.length === 0 ? (
                  <div className="p-8 text-center text-sm font-medium text-slate-400 dark:text-zinc-500">
                    Sin coincidencias para la búsqueda.
                  </div>
                ) : pagosRapidosAplicablesVista.map((factura) => (
                  <div key={factura.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400 dark:text-zinc-500">#{factura.id}</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">{factura.cliente_nombre}</span>
                      <span className="text-xs text-slate-400">· Predio {factura.cliente_numero_predio || "-"}</span>
                    </div>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 shrink-0">${formatMoney(factura.saldo_pendiente)}</span>
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
              disabled={procesandoPagoRapido}
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
              Revisar y confirmar ({pagosRapidosAplicables.length})
            </button>
          </>
        ) : (
          confirmacionFinal ? (
            <>
              <span className="mr-auto text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <HiExclamationCircle className="w-5 h-5 shrink-0" />
                ¿Estás completamente seguro? Se registrarán {pagosRapidosAplicables.length} pago(s) por ${formatMoney(totalAplicar)}.
              </span>
              <button
                type="button"
                onClick={() => setConfirmacionFinal(false)}
                disabled={procesandoPagoRapido}
                className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6 h-11 disabled:opacity-40"
              >
                No, revisar
              </button>
              <button
                type="button"
                onClick={ejecutarPagoRapido}
                disabled={procesandoPagoRapido || pagosRapidosAplicables.length === 0}
                className="font-bold bg-rose-600 text-white rounded-xl px-8 h-11 shadow-sm disabled:opacity-50 flex items-center gap-2 hover:bg-rose-700 transition-colors"
              >
                {procesandoPagoRapido && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Sí, registrar ahora
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setConfirmacionFinal(false); setFase("seleccion"); }}
                disabled={procesandoPagoRapido}
                className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6 h-11 disabled:opacity-40 flex items-center gap-2"
              >
                <HiArrowLeft className="w-4 h-4" /> Volver
              </button>
              <button
                type="button"
                onClick={() => setConfirmacionFinal(true)}
                disabled={procesandoPagoRapido || pagosRapidosAplicables.length === 0}
                className="font-bold bg-emerald-600 text-white rounded-xl px-8 h-11 shadow-sm disabled:opacity-50 flex items-center gap-2 hover:bg-emerald-700 transition-colors"
              >
                Aplicar pago a {pagosRapidosAplicables.length} factura(s) · ${formatMoney(totalAplicar)}
              </button>
            </>
          )
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ModalPagoRapido;
