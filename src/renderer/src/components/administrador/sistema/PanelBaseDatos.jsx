/**
 * PanelBaseDatos — Información y estado de la base de datos + migraciones
 *
 * Muestra: tamaño, tablas/registros, integridad, migraciones aplicadas
 * Auto-refresca cada 60 segundos
 */

import { useState, useEffect, useCallback } from "react";
import {
  Card, CardBody, CardHeader,
  Chip, Spinner, Button, Divider,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Tabs, Tab
} from "@nextui-org/react";
import { HiRefresh, HiExclamationCircle } from "react-icons/hi";
import { useFeedback } from "../../../context/FeedbackContext";
import { formatSize, formatDateFromTimestamp } from "../../../utils/formatSystem";

export default function PanelBaseDatos() {
  const { setError } = useFeedback();
  const [dbInfo, setDbInfo] = useState(null);
  const [migrations, setMigrations] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [subTab, setSubTab] = useState("info");

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setErrorCarga(null);
      const [infoResult, migResult] = await Promise.all([
        window.api.system.getDatabaseInfo(),
        window.api.system.getMigrations(),
      ]);

      if (infoResult?.success) setDbInfo(infoResult.info);
      if (migResult?.success) setMigrations(migResult.migrations || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error cargando info BD:", err);
      setErrorCarga("No se pudo cargar la información de la base de datos.");
      setError("Error al cargar información de la base de datos", "Base de Datos");
    } finally {
      setCargando(false);
    }
  }, [setError]);

  useEffect(() => {
    cargarDatos();
    // Auto-refresh cada 60 segundos
    const interval = setInterval(cargarDatos, 60000);
    return () => clearInterval(interval);
  }, [cargarDatos]);

  if (cargando && !dbInfo) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Cargando información de la base de datos..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Banner de error */}
      {errorCarga && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
          <HiExclamationCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorCarga}</span>
        </div>
      )}

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
                    {dbInfo?.foreignKeyCheck?.length === 0 ? "✓ OK" : `${dbInfo?.foreignKeyCheck?.length} errores`}
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
                  <div className="flex items-center gap-3">
                    {lastUpdated && (
                      <span className="text-xs text-gray-400">
                        Actualizado: {lastUpdated.toLocaleTimeString("es-MX", { hour12: false })}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={cargarDatos}
                      isLoading={cargando}
                      startContent={!cargando && <HiRefresh className="w-4 h-4" />}
                    >
                      Actualizar
                    </Button>
                  </div>
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
                          <TableCell>{formatDateFromTimestamp(m.created_at)}</TableCell>
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
