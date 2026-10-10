// components/feedback/AlertaSincronizacion.jsx
// Muestra a los administradores los avisos del monitor de la copia en la nube (main/managers/syncMonitor.js).
import { useEffect } from "react";
import { useFeedback } from "../../context/FeedbackContext";
import { useAuth } from "../../context/AuthContext";

const ROLES_ADMIN = ["administrador", "superadmin"];

const AlertaSincronizacion = () => {
  const { setError } = useFeedback();
  const { user } = useAuth();
  const esAdmin = ROLES_ADMIN.includes(user?.rol);

  useEffect(() => {
    if (!esAdmin || !window.api?.system?.onSyncAlerta) return undefined;
    return window.api.system.onSyncAlerta((alerta) => {
      if (alerta?.mensaje) setError(alerta.mensaje, "Respaldo en la nube");
    });
  }, [esAdmin, setError]);

  return null;
};

export default AlertaSincronizacion;
