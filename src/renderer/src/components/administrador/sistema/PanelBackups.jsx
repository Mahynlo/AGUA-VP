/**
 * PanelBackups — Gestión de backups de la base de datos
 *
 * Características:
 *  - Crear backup manual
 *  - Listar backups existentes con fecha y tamaño
 *  - Restaurar backup (con confirmación doble)
 *  - Configurar cantidad máxima de backups
 */

import { useState, useEffect, useCallback } from "react";
import {
  Card, CardBody,
  Button, Chip, Input, Tooltip,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  useDisclosure, Spinner, Divider
} from "@nextui-org/react";
import { HiExclamationCircle } from "react-icons/hi";
import { useFeedback } from "../../../context/FeedbackContext";
import { formatSize, formatDate } from "../../../utils/formatSystem";

export default function PanelBackups() {
  const { setSuccess, setError } = useFeedback();
  const [backups, setBackups] = useState([]);
  const [config, setConfig] = useState({ maxBackups: 5 });
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [backupSeleccionado, setBackupSeleccionado] = useState(null);
  const [maxBackupsInput, setMaxBackupsInput] = useState("5");
  const [confirmText, setConfirmText] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  const cargarBackups = useCallback(async () => {
    try {
      setCargando(true);
      const [listResult, configResult] = await Promise.all([
        window.api.system.listBackups(),
        window.api.system.getBackupConfig(),
      ]);

      if (listResult?.success) {
        setBackups(listResult.backups || []);
      }
      if (configResult?.success) {
        const cfg = configResult.config || configResult;
        setConfig(cfg);
        setMaxBackupsInput(String(cfg.maxBackups || 5));
      }
    } catch (err) {
      console.error("Error cargando backups:", err);
      setError("No se pudo cargar la lista de backups", "Backups");
    } finally {
      setCargando(false);
    }
  }, [setError]);

  useEffect(() => {
    cargarBackups();
  }, [cargarBackups]);

  const crearBackup = async () => {
    try {
      setCreando(true);
      const result = await window.api.system.createBackup();
      if (result?.success) {
        setSuccess("Backup creado exitosamente", "Backups");
        cargarBackups();
      } else {
        setError(result?.error || "No se pudo crear el backup", "Backups");
      }
    } catch (err) {
      console.error("Error creando backup:", err);
      setError("Error al crear el backup", "Backups");
    } finally {
      setCreando(false);
    }
  };

  const abrirRestauracion = (backup) => {
    setBackupSeleccionado(backup);
    setConfirmText("");
    onOpen();
  };

  const ejecutarRestauracion = async () => {
    if (confirmText !== "RESTAURAR") return;
    try {
      setRestaurando(true);
      const userToken = localStorage.getItem("token");
      const result = await window.api.system.restoreBackup(backupSeleccionado.path, userToken);
      if (result?.success) {
        setSuccess("Backup restaurado exitosamente", "Backups");
        onClose();
        cargarBackups();
      } else {
        setError(result?.error || "Error al restaurar el backup", "Backups");
      }
    } catch (err) {
      console.error("Error restaurando:", err);
      setError("Error inesperado al restaurar el backup", "Backups");
    } finally {
      setRestaurando(false);
    }
  };

  const guardarConfig = async () => {
    const num = parseInt(maxBackupsInput, 10);
    if (isNaN(num) || num < 1 || num > 50) return;
    try {
      const result = await window.api.system.updateBackupConfig({ maxBackups: num });
      if (result?.success) {
        setConfig((prev) => ({ ...prev, maxBackups: num }));
        setSuccess(`Límite actualizado a ${num} backups`, "Backups");
      } else {
        setError("No se pudo guardar la configuración", "Backups");
      }
    } catch (err) {
      console.error("Error guardando config:", err);
      setError("Error al guardar la configuración", "Backups");
    }
  };

  const extraerRazon = (nombre) => {
    if (!nombre) return "—";
    if (nombre.includes("pre-update")) return "Pre-actualización";
    if (nombre.includes("pre-arranque")) return "Pre-arranque";
    if (nombre.includes("pre-restore")) return "Pre-restauración";
    if (nombre.includes("manual")) return "Manual";
    return "Automático";
  };

  return (
    <div className="space-y-4">
      {/* Acciones y configuración */}
      <div className="flex flex-wrap items-center gap-4">
        <Button
          color="primary"
          onPress={crearBackup}
          isLoading={creando}
        >
          {creando ? "Creando..." : "Crear Backup Manual"}
        </Button>

        <Divider orientation="vertical" className="h-8" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Máx. backups:
          </span>
          <Input
            size="sm"
            type="number"
            min={1}
            max={50}
            className="w-20"
            value={maxBackupsInput}
            onValueChange={setMaxBackupsInput}
          />
          <Button
            size="sm"
            variant="flat"
            onPress={guardarConfig}
            isDisabled={parseInt(maxBackupsInput, 10) === config.maxBackups}
          >
            Guardar
          </Button>
        </div>

        <Chip variant="flat" color="default" size="sm" className="ml-auto">
          {backups.length} backup{backups.length !== 1 ? "s" : ""} almacenado{backups.length !== 1 ? "s" : ""}
        </Chip>
      </div>

      {/* Tabla de backups */}
      <Card>
        <CardBody className="p-0">
          {cargando ? (
            <div className="flex justify-center py-8">
              <Spinner label="Cargando backups..." />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay backups disponibles. Crea uno con el botón de arriba.
            </div>
          ) : (
            <Table
              aria-label="Lista de backups"
              removeWrapper
              classNames={{
                th: "bg-gray-100 dark:bg-gray-700",
              }}
            >
              <TableHeader>
                <TableColumn>Fecha</TableColumn>
                <TableColumn>Razón</TableColumn>
                <TableColumn>Tamaño</TableColumn>
                <TableColumn>Archivo</TableColumn>
                <TableColumn>Acciones</TableColumn>
              </TableHeader>
              <TableBody>
                {backups.map((backup, i) => (
                  <TableRow key={backup.path || i}>
                    <TableCell>
                      <span className="text-sm">
                        {formatDate(backup.created || backup.name?.match(/\d{4}-\d{2}-\d{2}/)?.[0])}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={
                          backup.name?.includes("manual") ? "primary" :
                          backup.name?.includes("pre-update") ? "warning" :
                          backup.name?.includes("pre-restore") ? "danger" :
                          "default"
                        }
                      >
                        {extraerRazon(backup.name)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatSize(backup.size)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500 font-mono truncate max-w-[200px] block">
                        {backup.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Tooltip content="Restaurar este backup (operación destructiva)">
                        <Button
                          size="sm"
                          color="warning"
                          variant="flat"
                          onPress={() => abrirRestauracion(backup)}
                        >
                          Restaurar
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Modal de confirmación de restauración */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader className="text-warning-600 flex items-center gap-2">
            <HiExclamationCircle className="w-5 h-5 text-warning" />
            Confirmar Restauración de Backup
          </ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              <p className="text-sm">
                Estás a punto de restaurar la base de datos desde:
              </p>
              <p className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {backupSeleccionado?.name}
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm font-bold text-red-600 dark:text-red-400">
                  ¡ADVERTENCIA! Esta operación:
                </p>
                <ul className="text-sm text-red-500 dark:text-red-400 list-disc ml-4 mt-1 space-y-1">
                  <li>Detendrá el servidor API temporalmente</li>
                  <li>Reemplazará TODOS los datos de la base de datos actual</li>
                  <li>Se creará un backup de seguridad antes de restaurar</li>
                  <li>No se puede deshacer</li>
                </ul>
              </div>
              <div>
                <p className="text-sm mb-2">
                  Escribe <strong>RESTAURAR</strong> para confirmar:
                </p>
                <Input
                  placeholder="Escribe RESTAURAR"
                  value={confirmText}
                  onValueChange={setConfirmText}
                  color={confirmText === "RESTAURAR" ? "success" : "default"}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose} isDisabled={restaurando}>
              Cancelar
            </Button>
            <Button
              color="danger"
              isDisabled={confirmText !== "RESTAURAR"}
              isLoading={restaurando}
              onPress={ejecutarRestauracion}
            >
              {restaurando ? "Restaurando..." : "Restaurar Backup"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
