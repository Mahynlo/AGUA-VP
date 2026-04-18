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
      classNames={{
        base: "bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-xl",
        header: "border-b border-slate-100 dark:border-zinc-800/50 pb-4 pt-6 px-8",
        body: "px-8 py-6",
        footer: "border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
            Detalle del Cliente
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
            {clienteDetalle?.cliente_nombre} <span className="mx-2 text-slate-300 dark:text-zinc-700">•</span> Predio {clienteDetalle?.numero_predio}
          </p>
        </ModalHeader>

        <ModalBody className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide">
                Facturas historial: <span className="font-black ml-1">{clienteDetalle?.total_facturas || 0}</span>
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wide">
                Pendientes: <span className="font-black ml-1">{clienteDetalle?.facturas_pendientes || 0}</span>
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 tracking-wide">
                Deuda total: <span className="font-black ml-1">${toMoney(clienteDetalle?.deuda_total || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
              </p>
            </div>
          </div>

          <Tabs
            selectedKey={detalleTab}
            onSelectionChange={(key) => setDetalleTab(String(key))}
            variant="underlined"
            classNames={{
              base: "w-full",
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-slate-200 dark:border-zinc-800",
              cursor: "w-full bg-slate-800 dark:bg-zinc-200 h-[2px]",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-slate-800 dark:group-data-[selected=true]:text-zinc-100 group-data-[selected=true]:font-bold text-slate-500 dark:text-zinc-400 font-medium text-sm transition-colors"
            }}
          >
            <Tab key="facturas" title={<div className="flex items-center gap-2"><HiDocumentText className="w-4 h-4" /><span>Facturas</span></div>}>
              <div className="space-y-6 mt-4">
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
                    classNames={{ trigger: "bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-none" }}
                  >
                    <SelectItem key="all" value="all">Todos los años</SelectItem>
                    {aniosClienteDetalle.map((anio) => (
                      <SelectItem key={anio} value={anio}>{anio}</SelectItem>
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
                    classNames={{ trigger: "bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-none" }}
                  >
                    <SelectItem key="all" value="all">Todos los períodos del año</SelectItem>
                    {periodosClienteDetalle.map((periodo) => (
                      <SelectItem key={periodo} value={periodo}>{formatearPeriodo(periodo)}</SelectItem>
                    ))}
                  </Select>

                  <div className="flex items-end">
                    <Button
                      variant="flat"
                      className="w-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold rounded-xl"
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

                <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
                  <Table
                    aria-label="Facturas del cliente"
                    removeWrapper
                    classNames={{
                      th: "bg-slate-50 dark:bg-zinc-900 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800",
                      td: "text-sm font-medium text-slate-600 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/50 py-3"
                    }}
                  >
                    <TableHeader>
                      <TableColumn>FACTURA</TableColumn>
                      <TableColumn>PERIODO</TableColumn>
                      <TableColumn>ESTADO</TableColumn>
                      <TableColumn>TOTAL</TableColumn>
                      <TableColumn>SALDO</TableColumn>
                      <TableColumn>ULT. PAGO</TableColumn>
                      <TableColumn>ACCIONES</TableColumn>
                    </TableHeader>
                    <TableBody items={facturasDetalleFiltradas} emptyContent="No hay facturas para ese filtro">
                      {(item) => (
                        <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                          <TableCell className="font-bold text-slate-800 dark:text-zinc-100">#{item.id}</TableCell>
                          <TableCell>{item.periodo || item.mes_facturado || "Sin periodo"}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${item.estado === 'Pendiente' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'}`}>
                              {item.estado || "Pendiente"}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-slate-800 dark:text-zinc-100">${toMoney(item.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="font-mono text-rose-600 dark:text-rose-400">${toMoney(item.saldo_pendiente).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>{formatFecha(ultimoPagoPorFactura.get(Number(item.id)))}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              className="bg-slate-900 text-white dark:bg-white dark:text-zinc-950 font-semibold rounded-lg"
                              onPress={() => setFacturaSeleccionadaDetalle(String(item.id))}
                            >
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {facturaDetalleSeleccionada && (
                  <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Estado</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">{facturaDetalleSeleccionada.estado || "Pendiente"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Periodo facturado</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{facturaDetalleSeleccionada.periodo || facturaDetalleSeleccionada.mes_facturado || "Sin periodo"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Vencimiento</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{formatFecha(facturaDetalleSeleccionada.fecha_vencimiento)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Consumo registrado</p>
                        <p className="text-sm font-mono font-bold text-slate-800 dark:text-zinc-100">{facturaDetalleSeleccionada.consumo_m3 ?? "-"} <span className="text-xs text-slate-500">m3</span></p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Fecha de lectura</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{formatFecha(facturaDetalleSeleccionada.fecha_lectura)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Último pago</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{formatFecha(ultimoPagoPorFactura.get(Number(facturaDetalleSeleccionada.id)))}</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-zinc-800">
                      <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <HiCog className="w-4 h-4" /> Datos del Servicio
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="md:col-span-1">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Medidor</p>
                          <p className="text-sm font-mono font-bold text-slate-800 dark:text-zinc-100">{facturaDetalleSeleccionada.medidor?.numero_serie || "N/A"}</p>
                        </div>
                        <div className="md:col-span-1">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Tarifa</p>
                          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{facturaDetalleSeleccionada.tarifa_nombre || "N/A"}</p>
                        </div>
                        <div className="md:col-span-1">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Ruta</p>
                          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{facturaDetalleSeleccionada.ruta?.nombre || "Sin ruta"}</p>
                        </div>
                        <div className="md:col-span-1">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Total factura</p>
                          <p className="text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100">${toMoney(facturaDetalleSeleccionada.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="md:col-span-1">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Saldo pendiente</p>
                          <p className="text-lg font-black tracking-tight text-rose-600 dark:text-rose-400">${toMoney(facturaDetalleSeleccionada.saldo_pendiente).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Tab>

            <Tab key="cliente" title={<div className="flex items-center gap-2"><HiUser className="w-4 h-4" /><span>Datos del Cliente</span></div>}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-slate-300 dark:hover:border-zinc-700 transition-all">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Identificación</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Nombre</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">{clienteDetalle?.cliente_nombre || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Número de predio</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{clienteDetalle?.numero_predio || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Estado del cliente</p>
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${String(clienteDetalle?.estado_cliente || "").toLowerCase() === "activo" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                        {clienteDetalle?.estado_cliente || "Activo"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-slate-300 dark:hover:border-zinc-700 transition-all">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Contacto</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Teléfono</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{clienteDetalle?.telefono || "No registrado"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Correo</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300 break-all">{clienteDetalle?.correo || "No registrado"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Dirección</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{clienteDetalle?.direccion || "No registrada"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Tab>

            <Tab key="pagos" title={<div className="flex items-center gap-2"><HiCash className="w-4 h-4" /><span>Pagos Hechos</span></div>}>
              <div className="space-y-6 mt-4">
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
                    classNames={{ trigger: "bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-none" }}
                  >
                    <SelectItem key="all" value="all">Todos los años</SelectItem>
                    {aniosPagosClienteDetalle.map((anio) => (
                      <SelectItem key={anio} value={anio}>{anio}</SelectItem>
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
                    classNames={{ trigger: "bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-none" }}
                  >
                    <SelectItem key="all" value="all">Todos los períodos del año</SelectItem>
                    {periodosPagosClienteDetalle.map((periodo) => (
                      <SelectItem key={periodo} value={periodo}>{formatearPeriodo(periodo)}</SelectItem>
                    ))}
                  </Select>

                  <div className="flex items-end">
                    <Button
                      variant="flat"
                      className="w-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold rounded-xl"
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

                <div className="flex flex-wrap items-center gap-3">
                  <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800">
                    <p className="text-xs font-bold text-slate-600 dark:text-zinc-300 tracking-wide">
                      Pagos: <span className="font-black ml-1">{resumenPagosClienteDetalle.totalPagos}</span>
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide">
                      Monto total: <span className="font-black ml-1">${toMoney(resumenPagosClienteDetalle.montoTotal).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800">
                    <p className="text-xs font-bold text-slate-600 dark:text-zinc-300 tracking-wide">
                      Último pago: <span className="font-black ml-1">{formatFecha(resumenPagosClienteDetalle.ultimoPago?.fecha_pago || resumenPagosClienteDetalle.ultimoPago?.fecha_creacion)}</span>
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
                  <Table
                    aria-label="Pagos del cliente"
                    removeWrapper
                    classNames={{
                      th: "bg-slate-50 dark:bg-zinc-900 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800",
                      td: "text-sm font-medium text-slate-600 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/50 py-3"
                    }}
                  >
                    <TableHeader>
                      <TableColumn>PAGO</TableColumn>
                      <TableColumn>FACTURA</TableColumn>
                      <TableColumn>FECHA</TableColumn>
                      <TableColumn>MÉTODO</TableColumn>
                      <TableColumn>MONTO</TableColumn>
                      <TableColumn>ACCIONES</TableColumn>
                    </TableHeader>
                    <TableBody items={pagosClienteDetalleFiltrados} emptyContent="No hay pagos registrados para ese filtro">
                      {(item) => (
                        <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                          <TableCell className="font-bold text-slate-800 dark:text-zinc-100">#{item.id}</TableCell>
                          <TableCell className="font-mono">#{item.factura_id || "-"}</TableCell>
                          <TableCell>{formatFecha(item.fecha_pago || item.fecha_creacion)}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              {item.metodo_pago || "No especificado"}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono font-bold text-emerald-600 dark:text-emerald-400">${toMoney(item.monto || item.cantidad_entregada).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              className="bg-slate-900 text-white dark:bg-white dark:text-zinc-950 font-semibold rounded-lg"
                              onPress={() => setPagoSeleccionadoDetalle(String(item.id))}
                            >
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {pagoDetalleSeleccionado && (
                  <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">ID del pago</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">#{pagoDetalleSeleccionado.id}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Factura relacionada</p>
                        <p className="text-sm font-mono font-bold text-slate-800 dark:text-zinc-100">#{pagoDetalleSeleccionado.factura_id || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Fecha de pago</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{formatFecha(pagoDetalleSeleccionado.fecha_pago || pagoDetalleSeleccionado.fecha_creacion)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Método</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{pagoDetalleSeleccionado.metodo_pago || "No especificado"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Monto pagado</p>
                        <p className="text-lg font-black tracking-tight text-emerald-600 dark:text-emerald-400">${toMoney(pagoDetalleSeleccionado.monto || pagoDetalleSeleccionado.cantidad_entregada).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Comentario</p>
                        <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">{pagoDetalleSeleccionado.comentario || "Sin comentario"}</p>
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
            className="font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl px-6"
            onPress={onClose}
          >
            Cerrar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModalDetalleCobranzaCliente;
