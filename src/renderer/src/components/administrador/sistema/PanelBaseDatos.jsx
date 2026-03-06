/**
 * PanelBaseDatos — Información y estado de la base de datos + migraciones
 *
 * Muestra: tamaño, tablas/registros, integridad, migraciones aplicadas
 */

import { useState, useEffect, useCallback } from "react";
import {
  Card, CardBody, CardHeader,
  Chip, Spinner, Button, Divider,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Tabs, Tab
} from "@nextui-org/react";

export default function PanelBaseDatos() {
  const [dbInfo, setDbInfo] = useState(null);
  const [migrations, setMigrations] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subTab, setSubTab] = useState("info");

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      const [infoResult, migResult] = await Promise.all([
        window.api.system.getDatabaseInfo(),
        window.api.system.getMigrations(),
      ]);

      if (infoResult.success) setDbInfo(infoResult.info);
      if (migResult.success) setMigrations(migResult.migrations || []);
    } catch (err) {
      console.error("Error cargando info BD:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const formatSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    // El timestamp puede venir en segundos (Drizzle) o milisegundos
    const num = Number(ts);
    const date = num > 1e12 ? new Date(num) : new Date(num * 1000);
    return date.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
  };

  if (cargando) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Cargando información de la base de datos..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs
        selectedKey={subTab}
        onSelectionChange={setSubTab}
        size="sm"
        variant="bordered"
      >
        {/* ── Información general ── */}
        <Tab key="info" title="Información">
          <div className="space-y-4 mt-3">
            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardBody className="text-center py-3">
                  <p className="text-2xl font-bold text-primary">
                    {formatSize(dbInfo?.size)}
                  </p>
                  <p className="text-xs text-gray-500">Tamaño DB</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="text-center py-3">
                  <p className="text-2xl font-bold text-primary">
                    {dbInfo?.tables?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500">Tablas</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="text-center py-3">
                  <Chip
                    size="lg"
                    color={dbInfo?.integrityCheck === "ok" ? "success" : "danger"}
                    variant="flat"
                  >
                    {dbInfo?.integrityCheck === "ok" ? "✓ OK" : "✗ Error"}
                  </Chip>
                  <p className="text-xs text-gray-500 mt-1">Integridad</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="text-center py-3">
                  <Chip
                    size="lg"
                    color={dbInfo?.foreignKeyCheck?.length === 0 ? "success" : "warning"}
                    variant="flat"
                  >
                    {dbInfo?.foreignKeyCheck?.length === 0 ? "✓ OK" : `${dbInfo.foreignKeyCheck.length} errores`}
                  </Chip>
                  <p className="text-xs text-gray-500 mt-1">Foreign Keys</p>
                </CardBody>
              </Card>
            </div>

            {/* Detalles técnicos */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold">Detalles Técnicos</h3>
              </CardHeader>
              <CardBody className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ruta:</span>
                  <span className="font-mono text-xs truncate max-w-[400px]">{dbInfo?.path || "—"}</span>
                </div>
                <Divider />
                <div className="flex justify-between">
                  <span className="text-gray-500">Última modificación:</span>
                  <span>{dbInfo?.lastModified ? new Date(dbInfo.lastModified).toLocaleString("es-MX") : "—"}</span>
                </div>
                <Divider />
                <div className="flex justify-between">
                  <span className="text-gray-500">WAL Size:</span>
                  <span>{formatSize(dbInfo?.walSize)}</span>
                </div>
              </CardBody>
            </Card>

            {/* Tablas */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <h3 className="text-sm font-semibold">Tablas ({dbInfo?.tables?.length || 0})</h3>
                  <Button size="sm" variant="flat" onPress={cargarDatos}>
                    Actualizar
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <Table removeWrapper aria-label="Tablas de la base de datos">
                  <TableHeader>
                    <TableColumn>Tabla</TableColumn>
                    <TableColumn>Registros</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {(dbInfo?.tables || []).map((t) => (
                      <TableRow key={t.name}>
                        <TableCell>
                          <span className="font-mono text-sm">{t.name}</span>
                        </TableCell>
                        <TableCell>
                          <Chip size="sm" variant="flat">{t.count}</Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* ── Migraciones ── */}
        <Tab key="migraciones" title={`Migraciones (${migrations.length})`}>
          <div className="mt-3">
            <Card>
              <CardBody className="p-0">
                {migrations.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    No se encontraron registros de migraciones
                  </p>
                ) : (
                  <Table removeWrapper aria-label="Historial de migraciones">
                    <TableHeader>
                      <TableColumn>#</TableColumn>
                      <TableColumn>Hash</TableColumn>
                      <TableColumn>Fecha de creación</TableColumn>
                      <TableColumn>Aplicada</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {migrations.map((m, i) => (
                        <TableRow key={m.id || i}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>
                            <span className="font-mono text-xs">{m.hash?.substring(0, 16)}...</span>
                          </TableCell>
                          <TableCell>{formatDate(m.created_at)}</TableCell>
                          <TableCell>
                            <Chip size="sm" color="success" variant="flat">
                              ✓ Aplicada
                            </Chip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
