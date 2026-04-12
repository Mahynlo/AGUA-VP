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

  const filasPagoRapido = 12;

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
      throw new Error("No se encontro token de sesion");
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
      setError(error.message || "No se pudieron cargar todas las facturas para modo rapido", "Pago rapido");
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
      setError("Debe seleccionar un metodo de pago.", "Pago rapido");
      return;
    }

    if (!isValidPaymentDate(fechaPagoRapido)) {
      setError("Debe ingresar una fecha de pago valida (YYYY-MM-DD).", "Pago rapido");
      return;
    }

    if (String(comentarioPagoRapido || "").length > MAX_COMENTARIO) {
      setError(`El comentario no puede exceder ${MAX_COMENTARIO} caracteres.`, "Pago rapido");
      return;
    }

    if (pagosRapidosAplicables.length === 0) {
      setError("No hay facturas para aplicar pago en este modo.", "Pago rapido");
      return;
    }

    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    const token_session = localStorage.getItem("token");
    if (!token_session) {
      setError("No se encontro token de sesion", "Pago rapido");
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
      setSuccess(`Pago rapido aplicado en ${exitos} facturas.`);
      onClose();
      return;
    }

    if (exitos > 0 && errores.length > 0) {
      setError(
        `Se aplicaron ${exitos} pagos, pero fallaron ${errores.length} facturas (${errores.join(", ")}).`,
        "Pago rapido"
      );
      return;
    }

    setError("No se pudo registrar ningun pago en modo rapido.", "Pago rapido");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="5xl"
      backdrop="opaque"
      scrollBehavior="inside"
      isDismissable={!procesandoPagoRapido}
      classNames={{
        backdrop: "bg-black/60",
        modal: "bg-white dark:bg-zinc-900 rounded-xl shadow-2xl",
        closeButton: "hover:bg-red-600 hover:text-white text-gray-600"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-3 text-xl font-bold">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <HiCreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3>Modo rapido de pagos</h3>
            <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
              Marca solo las facturas que NO pagaron. El sistema aplicara pago total al resto.
            </p>
          </div>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-3 border border-slate-200 dark:border-zinc-800">
              <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-bold">Elegibles</p>
              <p className="text-xl font-black text-slate-800 dark:text-zinc-100">{facturasElegiblesPagoRapido.length}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 border border-orange-200 dark:border-orange-800">
              <p className="text-[11px] uppercase tracking-wider text-orange-600 dark:text-orange-300 font-bold">No pagaron</p>
              <p className="text-xl font-black text-orange-700 dark:text-orange-300">{facturasNoPagaronValidas.length}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
              <p className="text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-300 font-bold">Se cobraran</p>
              <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{pagosRapidosAplicables.length}</p>
            </div>
          </div>

          

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Metodo de pago*</label>
              <Select
                aria-label="Metodo de pago"
                placeholder="Seleccionar"
                selectedKeys={[metodoPagoRapido]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0];
                  if (value) setMetodoPagoRapido(value);
                }}
                color="primary"
                variant="bordered"
                startContent={<HiCreditCard className="text-gray-400" />}
                className="w-full"
              >
                <SelectItem key="Efectivo" value="Efectivo" startContent={<HiCash />}>Efectivo</SelectItem>
                <SelectItem key="Transferencia" value="Transferencia" startContent={<HiCreditCard />}>Transferencia</SelectItem>
                <SelectItem key="Tarjeta" value="Tarjeta" startContent={<HiCreditCard />}>Tarjeta</SelectItem>
                <SelectItem key="Cheque" value="Cheque" startContent={<HiDocumentText />}>Cheque</SelectItem>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Fecha de pago</label>
              <input
                type="date"
                value={fechaPagoRapido}
                onChange={(e) => setFechaPagoRapido(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border ${mostrarErrores && !isValidPaymentDate(fechaPagoRapido) ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300 focus:ring-green-600 focus:border-green-500"} focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:border-gray-600 dark:text-white transition-all`}
              />
              {mostrarErrores && !isValidPaymentDate(fechaPagoRapido) && (
                <p className="text-xs text-red-600 mt-1">Ingrese una fecha valida (YYYY-MM-DD).</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Comentario</label>
              <input
                type="text"
                value={comentarioPagoRapido}
                onChange={(e) => setComentarioPagoRapido(e.target.value)}
                maxLength={MAX_COMENTARIO}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-green-600 focus:border-green-500 focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:border-gray-600 dark:text-white transition-all"
                placeholder="Pago masivo desde modo rapido"
              />
              <p className={`text-[11px] mt-1 ${String(comentarioPagoRapido || "").length > MAX_COMENTARIO ? "text-red-600" : "text-slate-500 dark:text-zinc-400"}`}>
                {String(comentarioPagoRapido || "").length}/{MAX_COMENTARIO}
              </p>
            </div>
          </div>


          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative w-full flex items-center">
              <span className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                <SearchIcon className="w-5 h-5" />
              </span>
              <input
                placeholder="Buscar por cliente, medidor o numero de predio..."
                value={searchPagoRapido}
                onChange={(e) => {
                  setSearchPagoRapido(e.target.value);
                  setPaginaPagoRapido(1);
                }}
                className="w-full pl-10 pr-10 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-sm"
              />
              {searchPagoRapido && (
                <button
                  onClick={() => {
                    setSearchPagoRapido("");
                    setPaginaPagoRapido(1);
                  }}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <HiX className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
              <Checkbox
                isSelected={soloNoPagaron}
                onValueChange={(value) => {
                  setSoloNoPagaron(value);
                  setPaginaPagoRapido(1);
                }}
                color="warning"
              >
                Solo no pagaron
              </Checkbox>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="flat" onPress={marcarTodasNoPagaron}>Marcar todos como no pagaron</Button>
            <Button size="sm" variant="light" onPress={limpiarNoPagaron}>Limpiar seleccion</Button>
          </div>

          <div className="max-h-[320px] overflow-auto border border-slate-200 dark:border-zinc-800 rounded-xl divide-y divide-slate-100 dark:divide-zinc-800">
            {cargandoFacturasPagoRapido ? (
              <div className="p-6 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-zinc-400">
                <Spinner size="sm" color="primary" />
                Cargando facturas del periodo...
              </div>
            ) : facturasFiltradasPagoRapido.length === 0 ? (
              <div className="p-4 text-sm font-medium text-slate-500 dark:text-zinc-400">No hay facturas pendientes elegibles para pago rapido en los filtros actuales.</div>
            ) : (
              facturasPaginadasPagoRapido.map((factura) => (
                <label
                  key={factura.id}
                  className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50 dark:hover:bg-zinc-900/60 cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">#{factura.id} - {factura.cliente_nombre}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                      Predio: {factura.cliente_numero_predio || "-"} | Medidor: {factura.medidor_numero_serie || factura?.medidor?.numero_serie || "-"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      ${Number(factura.saldo_pendiente || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </p>
                    <Checkbox
                      isSelected={noPagaronSet.has(factura.id)}
                      onValueChange={() => toggleFacturaNoPago(factura.id)}
                      color="warning"
                    >
                      No pagaron
                    </Checkbox>
                  </div>
                </label>
              ))
            )}
          </div>

          {!cargandoFacturasPagoRapido && totalPaginasPagoRapido > 1 && (
            <div className="flex justify-center pt-2">
              <Pagination
                total={totalPaginasPagoRapido}
                page={paginaPagoRapidoActiva}
                onChange={setPaginaPagoRapido}
                showControls
                color="primary"
                variant="light"
              />
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose} isDisabled={procesandoPagoRapido}>Cancelar</Button>
          <Button
            color="success"
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
