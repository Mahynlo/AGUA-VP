import { useState, useEffect } from "react";
import { Card, CardBody, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Select, SelectItem, Input, Chip } from "@nextui-org/react";
import { HiPrinter, HiEye, HiCash, HiCreditCard } from "react-icons/hi";

const TabPagos = () => {
  const [pagos, setPagos] = useState([]);
  const [pagosFiltrados, setPagosFiltrados] = useState([]);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroMetodo, setFiltroMetodo] = useState("todos");

  // Datos de ejemplo
  const pagosEjemplo = [
    {
      id: 1,
      facturaId: 2,
      cliente: "María García",
      fecha: "2025-01-20",
      monto: 620.00,
      metodoPago: "Transferencia Bancaria",
      observaciones: "Pago completo de factura enero",
      recibo: "REC-001-2025"
    },
    {
      id: 2,
      facturaId: 4,
      cliente: "Ana Martínez",
      fecha: "2025-01-18",
      monto: 450.00,
      metodoPago: "Efectivo",
      observaciones: "",
      recibo: "REC-002-2025"
    },
    {
      id: 3,
      facturaId: 5,
      cliente: "Pedro Rodríguez",
      fecha: "2025-01-15",
      monto: 300.00,
      metodoPago: "Tarjeta de Crédito",
      observaciones: "Pago parcial",
      recibo: "REC-003-2025"
    },
    {
      id: 4,
      facturaId: 1,
      cliente: "Juan Pérez",
      fecha: "2025-01-10",
      monto: 850.00,
      metodoPago: "Cheque",
      observaciones: "Cheque #1234",
      recibo: "REC-004-2025"
    }
  ];

  const metodosPago = [...new Set(pagosEjemplo.map(p => p.metodoPago))];

  useEffect(() => {
    setPagos(pagosEjemplo);
    setPagosFiltrados(pagosEjemplo);
  }, []);

  useEffect(() => {
    let pagosFiltrados = pagos;

    if (filtroCliente) {
      pagosFiltrados = pagosFiltrados.filter(p => 
        p.cliente.toLowerCase().includes(filtroCliente.toLowerCase())
      );
    }

    if (filtroMetodo !== "todos") {
      pagosFiltrados = pagosFiltrados.filter(p => p.metodoPago === filtroMetodo);
    }

    setPagosFiltrados(pagosFiltrados);
  }, [filtroCliente, filtroMetodo, pagos]);

  const getMetodoPagoColor = (metodo) => {
    switch (metodo) {
      case "Efectivo": return "success";
      case "Transferencia Bancaria": return "primary";
      case "Tarjeta de Crédito": return "secondary";
      case "Cheque": return "warning";
      default: return "default";
    }
  };

  const handleImprimirRecibo = (pago) => {
    console.log("Imprimir recibo:", pago.recibo);
    alert(`Imprimiendo recibo: ${pago.recibo}`);
  };

  const calcularTotalPagos = () => {
    return pagosFiltrados.reduce((total, pago) => total + pago.monto, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header de la sección */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
            <HiCreditCard className="text-green-600 dark:text-green-400 text-xl" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Historial de Pagos
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gestiona y consulta los pagos registrados
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total de pagos</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            ${calcularTotalPagos().toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="backdrop-blur-md bg-white/50 dark:bg-gray-800/50 border-0 shadow-sm">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Buscar cliente"
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              placeholder="Nombre del cliente"
              variant="bordered"
              classNames={{
                input: "bg-transparent",
                inputWrapper: "border-gray-300 dark:border-gray-600 hover:border-green-400 focus-within:border-green-500"
              }}
            />
            
            <Select
              label="Método de pago"
              selectedKeys={[filtroMetodo]}
              onSelectionChange={(keys) => setFiltroMetodo(Array.from(keys)[0])}
              variant="bordered"
              classNames={{
                trigger: "border-gray-300 dark:border-gray-600 hover:border-green-400 focus-within:border-green-500"
              }}
            >
              <SelectItem key="todos" value="todos">Todos los métodos</SelectItem>
              {metodosPago.map(metodo => (
                <SelectItem key={metodo} value={metodo}>{metodo}</SelectItem>
              ))}
            </Select>

            <div className="flex items-end">
              <Button
                color="default"
                variant="flat"
                className="w-full"
                onPress={() => {
                  setFiltroCliente("");
                  setFiltroMetodo("todos");
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="backdrop-blur-md bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-0">
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{pagosFiltrados.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pagos registrados</p>
          </CardBody>
        </Card>
        
        <Card className="backdrop-blur-md bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-0">
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${calcularTotalPagos().toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total de pagos</p>
          </CardBody>
        </Card>

        <Card className="backdrop-blur-md bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-0">
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              ${pagosFiltrados.length > 0 ? (calcularTotalPagos() / pagosFiltrados.length).toFixed(0) : 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Promedio por pago</p>
          </CardBody>
        </Card>
      </div>

      {/* Tabla de pagos */}
      <Card className="backdrop-blur-md bg-white/50 dark:bg-gray-800/50 border-0 shadow-sm">
        <CardBody className="p-0">
          <Table 
            aria-label="Tabla de pagos"
            classNames={{
              wrapper: "shadow-none bg-transparent",
              th: "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold",
              td: "border-b border-gray-200 dark:border-gray-700"
            }}
          >
            <TableHeader>
              <TableColumn>CLIENTE</TableColumn>
              <TableColumn>FECHA</TableColumn>
              <TableColumn>MONTO</TableColumn>
              <TableColumn>MÉTODO</TableColumn>
              <TableColumn>RECIBO</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody>
              {pagosFiltrados.map((pago) => (
                <TableRow key={pago.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{pago.cliente}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Factura #{pago.facturaId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(pago.fecha).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      ${pago.monto.toLocaleString()}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      color={getMetodoPagoColor(pago.metodoPago)}
                      variant="flat"
                      size="sm"
                    >
                      {pago.metodoPago}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                      {pago.recibo}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        color="primary"
                        onPress={() => handleImprimirRecibo(pago)}
                      >
                        <HiPrinter />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        color="default"
                      >
                        <HiEye />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
};

export default TabPagos;
