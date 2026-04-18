import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Checkbox,
  Spinner,
  Pagination
} from "@nextui-org/react";
import { HiX, HiCreditCard, HiCash, HiDocumentText } from "react-icons/hi";
import { SearchIcon } from "../../../IconsApp/IconsSidebar";
import { useFeedback } from "../../../context/FeedbackContext";

const MAX_COMENTARIO = 500;

const isValidPaymentDate = (fecha) => {
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const parsed = new Date(`${fecha}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
};

const ModalPagoRapido = ({ isOpen, onClose, periodo, onPagoRegistrado }) => {
  const { setSuccess, setError } = useFeedback();

  const [procesandoPagoRapido, setProcesandoPagoRapido] = useState(false);
  const [facturasNoPagaron, setFacturasNoPagaron] = useState([]);
  const [facturasPagoRapido, setFacturasPagoRapido] = useState([]);
  const [cargandoFacturasPagoRapido, setCargandoFacturasPagoRapido] = useState(false);
  const [searchPagoRapido, setSearchPagoRapido] = useState("");
  const [soloNoPagaron, setSoloNoPagaron] = useState(false);
  const [paginaPagoRapido, setPaginaPagoRapido] = useState(1);
  const [metodoPagoRapido, setMetodoPagoRapido] = useState("Efectivo");
  const [fechaPagoRapido, setFechaPagoRapido] = useState(new Date().toISOString().split("T")[0]);
  const [comentarioPagoRapido, setComentarioPagoRapido] = useState("Pago masivo desde modo rapido");
  const [mostrarErrores, setMostrarErrores] = useState(false);

  const filasPagoRapido = 10; // Ajustado para mejor visualización en layout limpio

  const normalizarTexto = (valor) => String(valor || "").toLowerCase().trim();

  const facturasElegiblesPagoRapido = facturasPagoRapido.filter((factura) => {
    const saldo = Number(factura.saldo_pendiente || 0);
    const esConvenio = factura.estado === "En Convenio" || !!factura.convenio_id;
    return saldo > 0 && factura.estado !== "Pagado" && !esConvenio;
  });

  const facturasFiltradasPagoRapido = useMemo(() => {
    const termino = normalizarTexto(searchPagoRapido);
    let base = facturasElegiblesPagoRapido;

    if (soloNoPagaron) {
      const idsNoPagaron = new Set(facturasNoPagaron);
      base = base.filter((factura) => idsNoPagaron.has(factura.id));
    }

    if (!termino) return base;

    return base.filter((factura) => {
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
  }, [facturasElegiblesPagoRapido, searchPagoRapido, soloNoPagaron, facturasNoPagaron]);

  const idsFiltradosPagoRapido = facturasFiltradasPagoRapido.map((f) => f.id);
  const idsElegiblesSet = new Set(facturasElegiblesPagoRapido.map((f) => f.id));
  const facturasNoPagaronValidas = facturasNoPagaron.filter((id) => idsElegiblesSet.has(id));
  const noPagaronSet = new Set(facturasNoPagaronValidas);

  const totalPaginasPagoRapido = Math.max(1, Math.ceil(facturasFiltradasPagoRapido.length / filasPagoRapido));
  const paginaPagoRapidoActiva = Math.min(paginaPagoRapido, totalPaginasPagoRapido);
  const inicioPagoRapido = (paginaPagoRapidoActiva - 1) * filasPagoRapido;
  const finPagoRapido = inicioPagoRapido + filasPagoRapido;
  const facturasPaginadasPagoRapido = facturasFiltradasPagoRapido.slice(inicioPagoRapido, finPagoRapido);

  const pagosRapidosAplicables = facturasElegiblesPagoRapido.filter(
    (factura) => !noPagaronSet.has(factura.id)
  );

  const resetEstado = () => {
    setFacturasNoPagaron([]);
    setFacturasPagoRapido([]);
    setSearchPagoRapido("");
    setSoloNoPagaron(false);
    setPaginaPagoRapido(1);
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
    resetEstado();
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
  }, [isOpen, periodo]);

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

  const ejecutarPagoRapido = async () => {
    setMostrarErrores(true);

    if (!metodoPagoRapido) {
      setError("Debe seleccionar un método de pago.", "Pago rápido");
      return;
    }

    if (!isValidPaymentDate(fechaPagoRapido)) {
      setError("Debe ingresar una fecha de pago válida (YYYY-MM-DD).", "Pago rápido");
      return;
    }

    if (String(comentarioPagoRapido || "").length > MAX_COMENTARIO) {
      setError(`El comentario no puede exceder ${MAX_COMENTARIO} caracteres.`, "Pago rápido");
      return;
    }

    if (pagosRapidosAplicables.length === 0) {
      setError("No hay facturas para aplicar pago en este modo.", "Pago rápido");
      return;
    }

    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    const token_session = localStorage.getItem("token");
    if (!token_session) {
      setError("No se encontró token de sesión", "Pago rápido");
      return;
    }
    const modificadoPor = usuario.id || 1;

    setProcesandoPagoRapido(true);

    let exitos = 0;
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

        exitos += 1;
      } catch (error) {
        errores.push(`#${factura.id}`);
      }
    }

    setProcesandoPagoRapido(false);

    if (onPagoRegistrado) {
      await onPagoRegistrado();
    }

    if (exitos > 0 && errores.length === 0) {
      setSuccess(`Pago rápido aplicado en ${exitos} facturas.`);
      onClose();
      return;
    }

    if (exitos > 0 && errores.length > 0) {
      setError(
        `Se aplicaron ${exitos} pagos, pero fallaron ${errores.length} facturas (${errores.join(", ")}).`,
        "Pago rápido"
      );
      return;
    }

    setError("No se pudo registrar ningún pago en modo rápido.", "Pago rápido");
  };

  // Clases base compartidas
  const inputBaseClasses = "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 font-medium text-slate-800 dark:text-zinc-100 h-[52px]";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="5xl"
      backdrop="blur"
      scrollBehavior="inside"
      isDismissable={!procesandoPagoRapido}
      classNames={{
        backdrop: "bg-slate-900/40 backdrop-blur-sm",
        base: "bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-2xl",
        header: "border-b border-slate-100 dark:border-zinc-800/50 pb-4 pt-6 px-8",
        body: "px-8 py-6",
        footer: "border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8",
        closeButton: "hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 text-slate-400 p-2 top-4 right-4"
      }}
    >
      <ModalContent>
        {/* HEADER */}
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl p-3">
              <HiCash className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                Pago Rápido Masivo
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
                Marca las facturas que <strong className="text-orange-500 dark:text-orange-400">NO</strong> pagaron. El sistema aplicará pago total al resto.
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-8">
          
          {/* KPIs SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Total Elegibles</p>
              <p className="text-4xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{facturasElegiblesPagoRapido.length}</p>
            </div>
            <div className="bg-orange-500/5 dark:bg-orange-900/10 border border-orange-500/20 rounded-2xl p-6 transition-all duration-200">
              <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600/80 dark:text-orange-400/80 mb-2">Excluidas (No pagaron)</p>
              <p className="text-4xl font-black tracking-tight text-orange-600 dark:text-orange-400">{facturasNoPagaronValidas.length}</p>
            </div>
            <div className="bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-6 transition-all duration-200">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/80 dark:text-emerald-400/80 mb-2">Se Cobrarán</p>
              <p className="text-4xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">{pagosRapidosAplicables.length}</p>
            </div>
          </div>

          {/* FORMULARIO DE APLICACIÓN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 block">
                Método de pago*
              </label>
              <Select
                aria-label="Método de pago"
                placeholder="Seleccionar"
                selectedKeys={[metodoPagoRapido]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0];
                  if (value) setMetodoPagoRapido(value);
                }}
                size="lg"
                variant="flat"
                classNames={{ trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 transition-all shadow-none h-[52px]" }}
                startContent={<HiCreditCard className="text-slate-400 w-5 h-5" />}
              >
                <SelectItem key="Efectivo" value="Efectivo">Efectivo</SelectItem>
                <SelectItem key="Transferencia" value="Transferencia">Transferencia</SelectItem>
                <SelectItem key="Tarjeta" value="Tarjeta">Tarjeta</SelectItem>
                <SelectItem key="Cheque" value="Cheque">Cheque</SelectItem>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 block">
                Fecha de pago*
              </label>
              <input
                type="date"
                value={fechaPagoRapido}
                onChange={(e) => setFechaPagoRapido(e.target.value)}
                className={`${inputBaseClasses} ${mostrarErrores && !isValidPaymentDate(fechaPagoRapido) ? "border-rose-500 focus:ring-rose-500 text-rose-600" : "focus:ring-emerald-500"}`}
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

          {/* ÁREA DE SELECCIÓN Y BÚSQUEDA */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-[320px]">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                    <SearchIcon className="w-5 h-5" />
                  </span>
                  <input
                    placeholder="Buscar cliente o predio..."
                    value={searchPagoRapido}
                    onChange={(e) => {
                      setSearchPagoRapido(e.target.value);
                      setPaginaPagoRapido(1);
                    }}
                    className="w-full pl-12 pr-10 py-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm"
                  />
                  {searchPagoRapido && (
                    <button
                      onClick={() => { setSearchPagoRapido(""); setPaginaPagoRapido(1); }}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                    >
                      <HiX className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center px-4 py-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
                  <Checkbox
                    isSelected={soloNoPagaron}
                    onValueChange={(value) => {
                      setSoloNoPagaron(value);
                      setPaginaPagoRapido(1);
                    }}
                    color="warning"
                    size="sm"
                    classNames={{ label: "text-sm font-bold text-slate-600 dark:text-zinc-400" }}
                  >
                    Ver solo excluidas
                  </Checkbox>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <Button size="sm" className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold rounded-lg px-4" onPress={marcarTodasNoPagaron}>
                  Excluir página
                </Button>
                <Button size="sm" className="bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 font-bold rounded-lg px-4" onPress={limpiarNoPagaron}>
                  Resetear
                </Button>
              </div>
            </div>

            {/* LISTA DE FACTURAS */}
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="max-h-[400px] overflow-auto">
                {cargandoFacturasPagoRapido ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-4 text-slate-500 dark:text-zinc-400">
                    <Spinner size="lg" color="default" />
                    <p className="text-sm font-bold tracking-wider uppercase">Cargando facturas...</p>
                  </div>
                ) : facturasFiltradasPagoRapido.length === 0 ? (
                  <div className="p-12 text-center text-sm font-medium text-slate-400 dark:text-zinc-500">
                    No hay facturas pendientes en los filtros actuales.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                    {facturasPaginadasPagoRapido.map((factura) => {
                      const isExcluded = noPagaronSet.has(factura.id);
                      return (
                        <label
                          key={factura.id}
                          className={`flex items-center justify-between gap-4 p-4 cursor-pointer transition-all ${isExcluded ? 'bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-50 dark:hover:bg-orange-900/20' : 'hover:bg-slate-50 dark:hover:bg-zinc-900/50'}`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono font-bold text-slate-400 dark:text-zinc-500">#{factura.id}</span>
                              <p className={`text-sm font-bold truncate ${isExcluded ? 'text-orange-700 dark:text-orange-400' : 'text-slate-800 dark:text-zinc-100'}`}>
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
                            <p className={`text-base font-black tracking-tight ${isExcluded ? 'text-orange-600/50 dark:text-orange-500/50 line-through' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              ${Number(factura.saldo_pendiente || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </p>
                            <div className="w-[120px] flex justify-end">
                              <Checkbox
                                isSelected={isExcluded}
                                onValueChange={() => toggleFacturaNoPago(factura.id)}
                                color="warning"
                                size="md"
                                classNames={{ label: `text-xs font-bold ${isExcluded ? 'text-orange-600 dark:text-orange-500' : 'text-slate-400'}` }}
                              >
                                {isExcluded ? "Excluida" : "Cobrar"}
                              </Checkbox>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* PAGINATION */}
            {!cargandoFacturasPagoRapido && totalPaginasPagoRapido > 1 && (
              <div className="flex justify-center pt-4">
                <Pagination
                  total={totalPaginasPagoRapido}
                  page={paginaPagoRapidoActiva}
                  onChange={setPaginaPagoRapido}
                  showControls
                  color="default"
                  variant="light"
                  classNames={{ cursor: "bg-slate-800 text-white dark:bg-zinc-200 dark:text-slate-900 font-bold" }}
                />
              </div>
            )}
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button 
            className="font-bold bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6" 
            onPress={handleClose} 
            isDisabled={procesandoPagoRapido}
          >
            Cancelar
          </Button>
          <Button
            className="font-bold bg-emerald-600 text-white rounded-xl px-8 shadow-sm"
            onPress={ejecutarPagoRapido}
            isLoading={procesandoPagoRapido}
            isDisabled={
              cargandoFacturasPagoRapido
              || pagosRapidosAplicables.length === 0
              || !isValidPaymentDate(fechaPagoRapido)
              || String(comentarioPagoRapido || "").length > MAX_COMENTARIO
            }
          >
            Aplicar pago a {pagosRapidosAplicables.length} factura(s)
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModalPagoRapido;
