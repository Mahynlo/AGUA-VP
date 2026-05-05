import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell
} from "@nextui-org/react";
import { HiDocumentText, HiUser, HiCash, HiCog } from "react-icons/hi";

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
      backdrop="blur"
      classNames={{
        backdrop: "bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm",
        base: "bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-2xl h-[calc(100dvh-4rem)]",
        header: "border-b border-slate-100 dark:border-zinc-800/80 pb-6 pt-8 px-10",
        body: "px-10 py-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent",
        footer: "border-t border-slate-100 dark:border-zinc-800/80 py-6 px-10",
        closeButton: "hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 text-slate-400 p-2 top-6 right-6 rounded-xl transition-colors"
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 shrink-0">
              <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                Detalle de Cobranza
              </h2>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mt-2">
                <span className="text-emerald-600 dark:text-emerald-400">{clienteDetalle?.cliente_nombre}</span> <span className="mx-2 text-slate-300 dark:text-zinc-700">•</span> Predio #{clienteDetalle?.numero_predio}
              </p>
            </ModalHeader>

            <ModalBody className="space-y-8">
              {/* KPIs de Resumen Rápido (Regla de Tintes) */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="px-4 py-2.5 rounded-xl bg-blue-500/10 transition-transform hover:-translate-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">
                    Facturas Historial <span className="font-black ml-2 text-base">{clienteDetalle?.total_facturas || 0}</span>
                  </p>
                </div>
                <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 transition-transform hover:-translate-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                    Pendientes <span className="font-black ml-2 text-base">{clienteDetalle?.facturas_pendientes || 0}</span>
                  </p>
                </div>
                <div className="px-4 py-2.5 rounded-xl bg-rose-500/10 transition-transform hover:-translate-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-rose-700 dark:text-rose-400">
                    Deuda Total <span className="font-black ml-2 text-base">${toMoney(clienteDetalle?.deuda_total || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                  </p>
                </div>
              </div>

              {/* TABS SaaS */}
              <Tabs
                selectedKey={detalleTab}
                onSelectionChange={(key) => setDetalleTab(String(key))}
                variant="underlined"
                classNames={{
                  base: "w-full",
                  tabList: "gap-6 w-full relative rounded-none p-0 border-b border-slate-200 dark:border-zinc-800",
                  cursor: "w-full bg-emerald-600 dark:bg-emerald-500 h-[2px]", // Cursor Esmeralda
                  tab: "max-w-fit px-0 h-12",
                  tabContent: "group-data-[selected=true]:text-emerald-600 dark:group-data-[selected=true]:text-emerald-400 group-data-[selected=true]:font-bold text-slate-500 dark:text-zinc-400 font-medium text-sm transition-colors"
                }}
              >
                {/* ── TAB FACTURAS ── */}
                <Tab key="facturas" title={<div className="flex items-center gap-2.5"><HiDocumentText className="text-lg" /><span>Facturas</span></div>}>
                  <div className="space-y-6 pt-4 animate-in fade-in duration-300">
                    
                    {/* Filtros Facturas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select
                        label="Año"
                        selectedKeys={[anioFiltroDetalle]}
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] || "all";
                          setAnioFiltroDetalle(String(value));
                          setPeriodoFiltroDetalle("all");
                          setFacturaSeleccionadaDetalle(null);
                        }}
                        size="sm"
                        variant="flat"
                        classNames={{ 
                          trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-none h-11",
                          value: "font-bold text-slate-700 dark:text-zinc-200"
                        }}
                      >
                        <SelectItem key="all" value="all" className="font-semibold">Todos los años</SelectItem>
                        {aniosClienteDetalle.map((anio) => (
                          <SelectItem key={anio} value={anio} className="font-semibold">{anio}</SelectItem>
                        ))}
                      </Select>

                      <Select
                        label="Período del año"
                        selectedKeys={[periodoFiltroDetalle]}
                        isDisabled={anioFiltroDetalle === "all"}
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] || "all";
                          setPeriodoFiltroDetalle(String(value));
                          setFacturaSeleccionadaDetalle(null);
                        }}
                        size="sm"
                        variant="flat"
                        classNames={{ 
                          trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-none h-11",
                          value: "font-bold text-slate-700 dark:text-zinc-200"
                        }}
                      >
                        <SelectItem key="all" value="all" className="font-semibold">Todos los períodos del año</SelectItem>
                        {periodosClienteDetalle.map((periodo) => (
                          <SelectItem key={periodo} value={periodo} className="font-semibold">{formatearPeriodo(periodo)}</SelectItem>
                        ))}
                      </Select>

                      <div className="flex items-end">
                        <Button
                          variant="flat"
                          className="w-full h-11 bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-colors"
                          onPress={() => {
                            setAnioFiltroDetalle("all");
                            setPeriodoFiltroDetalle("all");
                            setFacturaSeleccionadaDetalle(null);
                          }}
                        >
                          Limpiar filtros
                        </Button>
                      </div>
                    </div>

                    {/* Tabla Facturas */}
                    <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-x-auto bg-white dark:bg-zinc-950">
                      <Table
                        aria-label="Facturas del cliente"
                        removeWrapper
                        classNames={{
                          th: "bg-slate-50 dark:bg-zinc-900/50 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 py-4 px-6",
                          td: "text-sm font-medium text-slate-600 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/50 py-4 px-6",
                          tr: "hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 transition-colors"
                        }}
                      >
                        <TableHeader>
                          <TableColumn>FACTURA</TableColumn>
                          <TableColumn>PERIODO</TableColumn>
                          <TableColumn>ESTADO</TableColumn>
                          <TableColumn>TOTAL</TableColumn>
                          <TableColumn>SALDO</TableColumn>
                          <TableColumn>ULT. PAGO</TableColumn>
                          <TableColumn align="end">ACCIONES</TableColumn>
                        </TableHeader>
                        <TableBody items={facturasDetalleFiltradas} emptyContent={<div className="py-8 font-bold text-slate-400">No hay facturas para ese filtro</div>}>
                          {(item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-black text-slate-800 dark:text-zinc-100">#{item.id}</TableCell>
                              <TableCell>{item.periodo || item.mes_facturado || "Sin periodo"}</TableCell>
                              <TableCell>
                                <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${
                                  item.estado === 'Pendiente' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  {item.estado || "Pendiente"}
                                </span>
                              </TableCell>
                              <TableCell className="font-mono text-slate-800 dark:text-zinc-100">${toMoney(item.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</TableCell>
                              <TableCell className="font-mono font-bold text-rose-600 dark:text-rose-400">${toMoney(item.saldo_pendiente).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</TableCell>
                              <TableCell className="text-xs text-slate-500">{formatFecha(ultimoPagoPorFactura.get(Number(item.id)))}</TableCell>
                              <TableCell>
                                <div className="flex justify-end">
                                  <Button
                                    size="sm"
                                    className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700"
                                    onPress={() => setFacturaSeleccionadaDetalle(String(item.id))}
                                  >
                                    Ver Detalle
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Detalle Factura Expandido */}
                    {facturaDetalleSeleccionada && (
                      <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-8 transition-all duration-200 animate-in slide-in-from-top-4">
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <HiDocumentText className="w-4 h-4" /> Resumen Factura #{facturaDetalleSeleccionada.id}
                        </h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                          <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Estado</p>
                            <p className="text-sm font-black text-slate-800 dark:text-zinc-100">{facturaDetalleSeleccionada.estado || "Pendiente"}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Periodo facturado</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{facturaDetalleSeleccionada.periodo || facturaDetalleSeleccionada.mes_facturado || "Sin periodo"}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Vencimiento</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{formatFecha(facturaDetalleSeleccionada.fecha_vencimiento)}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Consumo</p>
                            <p className="text-sm font-mono font-black text-slate-800 dark:text-zinc-100">{facturaDetalleSeleccionada.consumo_m3 ?? "-"} <span className="text-xs font-bold text-slate-400">m³</span></p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Lectura</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{formatFecha(facturaDetalleSeleccionada.fecha_lectura)}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Último pago</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{formatFecha(ultimoPagoPorFactura.get(Number(facturaDetalleSeleccionada.id)))}</p>
                          </div>
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
                </Tab>

                {/* ── TAB DATOS DEL CLIENTE ── */}
                <Tab key="cliente" title={<div className="flex items-center gap-2.5"><HiUser className="text-lg" /><span>Datos del Cliente</span></div>}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 animate-in fade-in duration-300">
                    <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-8 flex flex-col gap-6">
                      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-3">
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
                        <div className="flex flex-col gap-1 items-start">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Estado del cliente</p>
                          <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${String(clienteDetalle?.estado_cliente || "").toLowerCase() === "activo" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                            {clienteDetalle?.estado_cliente || "Activo"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-8 flex flex-col gap-6">
                      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-3">
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
                </Tab>

                {/* ── TAB PAGOS ── */}
                <Tab key="pagos" title={<div className="flex items-center gap-2.5"><HiCash className="text-lg" /><span>Historial de Pagos</span></div>}>
                  <div className="space-y-6 pt-4 animate-in fade-in duration-300">
                    
                    {/* Filtros Pagos */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select
                        label="Año"
                        selectedKeys={[anioFiltroPagosDetalle]}
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] || "all";
                          setAnioFiltroPagosDetalle(String(value));
                          setPeriodoFiltroPagosDetalle("all");
                          setPagoSeleccionadoDetalle(null);
                        }}
                        size="sm"
                        variant="flat"
                        classNames={{ 
                          trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-none h-11",
                          value: "font-bold text-slate-700 dark:text-zinc-200" 
                        }}
                      >
                        <SelectItem key="all" value="all" className="font-semibold">Todos los años</SelectItem>
                        {aniosPagosClienteDetalle.map((anio) => (
                          <SelectItem key={anio} value={anio} className="font-semibold">{anio}</SelectItem>
                        ))}
                      </Select>

                      <Select
                        label="Período del año"
                        selectedKeys={[periodoFiltroPagosDetalle]}
                        isDisabled={anioFiltroPagosDetalle === "all"}
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] || "all";
                          setPeriodoFiltroPagosDetalle(String(value));
                          setPagoSeleccionadoDetalle(null);
                        }}
                        size="sm"
                        variant="flat"
                        classNames={{ 
                          trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-none h-11",
                          value: "font-bold text-slate-700 dark:text-zinc-200"
                        }}
                      >
                        <SelectItem key="all" value="all" className="font-semibold">Todos los períodos del año</SelectItem>
                        {periodosPagosClienteDetalle.map((periodo) => (
                          <SelectItem key={periodo} value={periodo} className="font-semibold">{formatearPeriodo(periodo)}</SelectItem>
                        ))}
                      </Select>

                      <div className="flex items-end">
                        <Button
                          variant="flat"
                          className="w-full h-11 bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-colors"
                          onPress={() => {
                            setAnioFiltroPagosDetalle("all");
                            setPeriodoFiltroPagosDetalle("all");
                            setPagoSeleccionadoDetalle(null);
                          }}
                        >
                          Limpiar filtros
                        </Button>
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
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">${toMoney(resumenPagosClienteDetalle.montoTotal).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="flex flex-col gap-0.5 pl-6">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Último Pago Registrado</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 mt-1">{formatFecha(resumenPagosClienteDetalle.ultimoPago?.fecha_pago || resumenPagosClienteDetalle.ultimoPago?.fecha_creacion) || "N/A"}</p>
                      </div>
                    </div>

                    {/* Tabla Pagos */}
                    <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-x-auto bg-white dark:bg-zinc-950">
                      <Table
                        aria-label="Pagos del cliente"
                        removeWrapper
                        classNames={{
                          th: "bg-slate-50 dark:bg-zinc-900/50 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 py-4 px-6",
                          td: "text-sm font-medium text-slate-600 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/50 py-4 px-6",
                          tr: "hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 transition-colors"
                        }}
                      >
                        <TableHeader>
                          <TableColumn>PAGO ID</TableColumn>
                          <TableColumn>FACTURA</TableColumn>
                          <TableColumn>FECHA</TableColumn>
                          <TableColumn>MÉTODO</TableColumn>
                          <TableColumn>MONTO</TableColumn>
                          <TableColumn align="end">ACCIONES</TableColumn>
                        </TableHeader>
                        <TableBody items={pagosClienteDetalleFiltrados} emptyContent={<div className="py-8 font-bold text-slate-400">No hay pagos registrados para ese filtro</div>}>
                          {(item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-black text-slate-800 dark:text-zinc-100">#{item.id}</TableCell>
                              <TableCell className="font-mono font-bold text-slate-700 dark:text-zinc-300">#{item.factura_id || "-"}</TableCell>
                              <TableCell className="text-xs">{formatFecha(item.fecha_pago || item.fecha_creacion)}</TableCell>
                              <TableCell>
                                <span className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                  {item.metodo_pago || "S/E"}
                                </span>
                              </TableCell>
                              <TableCell className="font-mono font-black text-emerald-600 dark:text-emerald-400">${toMoney(item.monto || item.cantidad_entregada).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</TableCell>
                              <TableCell>
                                <div className="flex justify-end">
                                  <Button
                                    size="sm"
                                    className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700"
                                    onPress={() => setPagoSeleccionadoDetalle(String(item.id))}
                                  >
                                    Ver Detalle
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Detalle Pago Expandido */}
                    {pagoDetalleSeleccionado && (
                      <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-8 transition-all duration-200 animate-in slide-in-from-top-4 mt-6">
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
                            <p className="text-xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">${toMoney(pagoDetalleSeleccionado.monto || pagoDetalleSeleccionado.cantidad_entregada).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div className="col-span-2 md:col-span-5 flex flex-col gap-1 mt-2 p-4 bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Comentarios / Notas</p>
                            <p className="text-sm font-medium text-slate-600 dark:text-zinc-400 leading-relaxed italic">{pagoDetalleSeleccionado.comentario || "Sin comentarios."}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>

            <ModalFooter>
              <Button
                variant="light"
                className="font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-8 h-11"
                onPress={onClose}
              >
                Cerrar Panel
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ModalDetalleCobranzaCliente;
