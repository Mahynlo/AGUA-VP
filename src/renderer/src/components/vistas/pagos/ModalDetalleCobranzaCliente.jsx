import { Modal } from "flowbite-react";
import { HiDocumentText, HiUser, HiCash, HiCog } from "react-icons/hi";

const premiumModalTheme = {
  root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80 mt-10", off: "hidden" } },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-5xl w-full h-[calc(100dvh-4rem)]"
  },
  header: {
    base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/50 px-10 pt-8 pb-6 rounded-t-2xl shrink-0",
    close: { base: "absolute top-6 right-6 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
  },
  body: { base: "flex-1 overflow-y-auto min-h-0" },
  footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/50 py-6 px-10 rounded-b-2xl shrink-0" }
};

const selectClasses = "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 h-11 text-sm font-bold text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 transition-all w-full";

const TABS = [
  { key: "facturas", label: "Facturas", icon: HiDocumentText },
  { key: "cliente", label: "Datos del Cliente", icon: HiUser },
  { key: "pagos", label: "Historial de Pagos", icon: HiCash }
];

const ModalDetalleCobranzaCliente = ({
  isOpen,
  onClose,
  clienteDetalle,
  detalleTab,
  setDetalleTab,
  anioFiltroDetalle,
  setAnioFiltroDetalle,
  periodoFiltroDetalle,
  setPeriodoFiltroDetalle,
  facturaSeleccionadaDetalle,
  setFacturaSeleccionadaDetalle,
  aniosClienteDetalle,
  periodosClienteDetalle,
  facturasDetalleFiltradas,
  ultimoPagoPorFactura,
  facturaDetalleSeleccionada,
  anioFiltroPagosDetalle,
  setAnioFiltroPagosDetalle,
  periodoFiltroPagosDetalle,
  setPeriodoFiltroPagosDetalle,
  setPagoSeleccionadoDetalle,
  aniosPagosClienteDetalle,
  periodosPagosClienteDetalle,
  resumenPagosClienteDetalle,
  pagosClienteDetalleFiltrados,
  pagoDetalleSeleccionado,
  toMoney,
  formatFecha,
  formatearPeriodo
}) => {
  return (
    <Modal show={isOpen} onClose={onClose} theme={premiumModalTheme} dismissible size="5xl">
      <Modal.Header>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
            Detalle de Cobranza
          </h2>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mt-2">
            <span className="text-emerald-600 dark:text-emerald-400">{clienteDetalle?.cliente_nombre}</span>
            <span className="mx-2 text-slate-300 dark:text-zinc-700">•</span>
            Predio #{clienteDetalle?.numero_predio}
          </p>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className="px-10 py-8 space-y-6">
          {/* KPIs */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="px-4 py-2.5 rounded-xl bg-blue-500/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">
                Facturas Historial <span className="font-black ml-2 text-base">{clienteDetalle?.total_facturas || 0}</span>
              </p>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-amber-500/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                Pendientes <span className="font-black ml-2 text-base">{clienteDetalle?.facturas_pendientes || 0}</span>
              </p>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-rose-500/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-700 dark:text-rose-400">
                Deuda Total <span className="font-black ml-2 text-base">${toMoney(clienteDetalle?.deuda_total || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
              </p>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="border-b border-slate-200 dark:border-zinc-800 flex gap-6">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setDetalleTab(key)}
                className={`flex items-center gap-2 pb-3 h-12 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  detalleTab === key
                    ? "border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
                    : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className="text-lg" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* ── TAB FACTURAS ── */}
          {detalleTab === "facturas" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1.5 block">Año</label>
                  <select
                    value={anioFiltroDetalle}
                    onChange={(e) => {
                      setAnioFiltroDetalle(e.target.value);
                      setPeriodoFiltroDetalle("all");
                      setFacturaSeleccionadaDetalle(null);
                    }}
                    className={selectClasses}
                  >
                    <option value="all">Todos los años</option>
                    {aniosClienteDetalle.map((anio) => (
                      <option key={anio} value={anio}>{anio}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1.5 block">Período del año</label>
                  <select
                    value={periodoFiltroDetalle}
                    disabled={anioFiltroDetalle === "all"}
                    onChange={(e) => {
                      setPeriodoFiltroDetalle(e.target.value);
                      setFacturaSeleccionadaDetalle(null);
                    }}
                    className={`${selectClasses} disabled:opacity-50`}
                  >
                    <option value="all">Todos los períodos del año</option>
                    {periodosClienteDetalle.map((periodo) => (
                      <option key={periodo} value={periodo}>{formatearPeriodo(periodo)}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setAnioFiltroDetalle("all");
                      setPeriodoFiltroDetalle("all");
                      setFacturaSeleccionadaDetalle(null);
                    }}
                    className="w-full h-11 bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-colors text-sm"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-x-auto bg-white dark:bg-zinc-950">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800">
                      {["FACTURA", "PERIODO", "ESTADO", "TOTAL", "SALDO", "ULT. PAGO", "ACCIONES"].map((col, i) => (
                        <th key={col} className={`px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-900/50 whitespace-nowrap ${i === 6 ? "text-right" : ""}`}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {facturasDetalleFiltradas.length === 0 ? (
                      <tr><td colSpan={7} className="px-6 py-8 text-center font-bold text-slate-400">No hay facturas para ese filtro</td></tr>
                    ) : (
                      facturasDetalleFiltradas.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="px-6 py-4 font-black text-slate-800 dark:text-zinc-100">#{item.id}</td>
                          <td className="px-6 py-4 font-medium text-slate-600 dark:text-zinc-300">{item.periodo || item.mes_facturado || "Sin periodo"}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${item.estado === "Pendiente" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
                              {item.estado || "Pendiente"}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-800 dark:text-zinc-100">${toMoney(item.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 font-mono font-bold text-rose-600 dark:text-rose-400">${toMoney(item.saldo_pendiente).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 text-xs text-slate-500">{formatFecha(ultimoPagoPorFactura.get(Number(item.id)))}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => setFacturaSeleccionadaDetalle(String(item.id))}
                                className="px-3 h-8 text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                              >
                                Ver Detalle
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {facturaDetalleSeleccionada && (
                <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-8">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <HiDocumentText className="w-4 h-4" /> Resumen Factura #{facturaDetalleSeleccionada.id}
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                    {[
                      { label: "Estado", value: facturaDetalleSeleccionada.estado || "Pendiente" },
                      { label: "Periodo facturado", value: facturaDetalleSeleccionada.periodo || facturaDetalleSeleccionada.mes_facturado || "Sin periodo" },
                      { label: "Vencimiento", value: formatFecha(facturaDetalleSeleccionada.fecha_vencimiento) },
                      { label: "Consumo", value: `${facturaDetalleSeleccionada.consumo_m3 ?? "-"} m³` },
                      { label: "Lectura", value: formatFecha(facturaDetalleSeleccionada.fecha_lectura) },
                      { label: "Último pago", value: formatFecha(ultimoPagoPorFactura.get(Number(facturaDetalleSeleccionada.id))) }
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{label}</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-zinc-800">
                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <HiCog className="w-4 h-4" /> Datos del Servicio
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Medidor</p>
                        <p className="text-sm font-mono font-black text-slate-800 dark:text-zinc-100">{facturaDetalleSeleccionada.medidor?.numero_serie || "N/A"}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Tarifa</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{facturaDetalleSeleccionada.tarifa_nombre || "N/A"}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Total factura</p>
                        <p className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">${toMoney(facturaDetalleSeleccionada.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Saldo pendiente</p>
                        <p className="text-xl font-black tracking-tight text-rose-600 dark:text-rose-400">${toMoney(facturaDetalleSeleccionada.saldo_pendiente).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB CLIENTE ── */}
          {detalleTab === "cliente" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-8 flex flex-col gap-6">
                <div className="border-b border-slate-200 dark:border-zinc-800 pb-3">
                  <h4 className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Identificación</h4>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Nombre Completo</p>
                    <p className="text-base font-black text-slate-800 dark:text-zinc-100">{clienteDetalle?.cliente_nombre || "-"}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Número de predio</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 font-mono">{clienteDetalle?.numero_predio || "-"}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Estado del cliente</p>
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest w-fit ${String(clienteDetalle?.estado_cliente || "").toLowerCase() === "activo" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                      {clienteDetalle?.estado_cliente || "Activo"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-8 flex flex-col gap-6">
                <div className="border-b border-slate-200 dark:border-zinc-800 pb-3">
                  <h4 className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Contacto y Ubicación</h4>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Teléfono</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{clienteDetalle?.telefono || "No registrado"}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Correo Electrónico</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 break-all">{clienteDetalle?.correo || "No registrado"}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Dirección completa</p>
                    <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400 leading-relaxed">{clienteDetalle?.direccion || "No registrada"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB PAGOS ── */}
          {detalleTab === "pagos" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1.5 block">Año</label>
                  <select
                    value={anioFiltroPagosDetalle}
                    onChange={(e) => {
                      setAnioFiltroPagosDetalle(e.target.value);
                      setPeriodoFiltroPagosDetalle("all");
                      setPagoSeleccionadoDetalle(null);
                    }}
                    className={selectClasses}
                  >
                    <option value="all">Todos los años</option>
                    {aniosPagosClienteDetalle.map((anio) => (
                      <option key={anio} value={anio}>{anio}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1.5 block">Período del año</label>
                  <select
                    value={periodoFiltroPagosDetalle}
                    disabled={anioFiltroPagosDetalle === "all"}
                    onChange={(e) => {
                      setPeriodoFiltroPagosDetalle(e.target.value);
                      setPagoSeleccionadoDetalle(null);
                    }}
                    className={`${selectClasses} disabled:opacity-50`}
                  >
                    <option value="all">Todos los períodos del año</option>
                    {periodosPagosClienteDetalle.map((periodo) => (
                      <option key={periodo} value={periodo}>{formatearPeriodo(periodo)}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setAnioFiltroPagosDetalle("all");
                      setPeriodoFiltroPagosDetalle("all");
                      setPagoSeleccionadoDetalle(null);
                    }}
                    className="w-full h-11 bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-colors text-sm"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>

              {/* Resumen Pagos */}
              <div className="flex flex-wrap items-center gap-4 py-2 border-y border-slate-100 dark:border-zinc-800/80">
                <div className="flex flex-col gap-0.5 pr-6 border-r border-slate-200 dark:border-zinc-800">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Total de Pagos</p>
                  <p className="text-xl font-black text-slate-700 dark:text-zinc-200">{resumenPagosClienteDetalle.totalPagos}</p>
                </div>
                <div className="flex flex-col gap-0.5 px-6 border-r border-slate-200 dark:border-zinc-800">
                  <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-widest">Monto Total Pagado</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    ${toMoney(resumenPagosClienteDetalle.montoTotal).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex flex-col gap-0.5 pl-6">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Último Pago Registrado</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 mt-1">
                    {formatFecha(resumenPagosClienteDetalle.ultimoPago?.fecha_pago || resumenPagosClienteDetalle.ultimoPago?.fecha_creacion) || "N/A"}
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-x-auto bg-white dark:bg-zinc-950">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800">
                      {["PAGO ID", "FACTURA", "FECHA", "MÉTODO", "MONTO", "ACCIONES"].map((col, i) => (
                        <th key={col} className={`px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-900/50 whitespace-nowrap ${i === 5 ? "text-right" : ""}`}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagosClienteDetalleFiltrados.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-8 text-center font-bold text-slate-400">No hay pagos registrados para ese filtro</td></tr>
                    ) : (
                      pagosClienteDetalleFiltrados.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="px-6 py-4 font-black text-slate-800 dark:text-zinc-100">#{item.id}</td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-zinc-300">#{item.factura_id || "-"}</td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-zinc-400">{formatFecha(item.fecha_pago || item.fecha_creacion)}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              {item.metodo_pago || "S/E"}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono font-black text-emerald-600 dark:text-emerald-400">
                            ${toMoney(item.monto || item.cantidad_entregada).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => setPagoSeleccionadoDetalle(String(item.id))}
                                className="px-3 h-8 text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                              >
                                Ver Detalle
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {pagoDetalleSeleccionado && (
                <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-8">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <HiCash className="w-4 h-4" /> Recibo de Pago #{pagoDetalleSeleccionado.id}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Factura Relacionada</p>
                      <p className="text-sm font-mono font-black text-slate-800 dark:text-zinc-100">#{pagoDetalleSeleccionado.factura_id || "-"}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Fecha de Registro</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{formatFecha(pagoDetalleSeleccionado.fecha_pago || pagoDetalleSeleccionado.fecha_creacion)}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Método de Pago</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{pagoDetalleSeleccionado.metodo_pago || "No especificado"}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-500/70">Monto Entregado</p>
                      <p className="text-xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                        ${toMoney(pagoDetalleSeleccionado.monto || pagoDetalleSeleccionado.cantidad_entregada).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="col-span-2 md:col-span-5 flex flex-col gap-1 mt-2 p-4 bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Comentarios / Notas</p>
                      <p className="text-sm font-medium text-slate-600 dark:text-zinc-400 leading-relaxed italic">{pagoDetalleSeleccionado.comentario || "Sin comentarios."}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          onClick={onClose}
          className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-8 h-11"
        >
          Cerrar Panel
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalDetalleCobranzaCliente;
