import { useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useClientes } from "./ClientesContext";
import { useMedidores } from "./MedidoresContext";
import { useTarifas } from "./TarifasContext";
import { preloadPdfViewer } from "../utils/pdfPreloader";

// Componente para asegurar datos iniciales y precargar módulos pesados en tiempo inactivo
const InitDataLoader = () => {
  const { user, isAuthenticated } = useAuth();
  const { actualizarClientes } = useClientes();
  const { actualizarMedidores } = useMedidores();
  const { actualizarTarifas } = useTarifas();

  // Control en memoria por ciclo de vida de la sesión (no persiste zombis en disco)
  const isInitializedRef = useRef(false);
  const isPdfPreloadedRef = useRef(false);

  useEffect(() => {
    // Si no hay usuario autenticado, reiniciar flags
    if (!isAuthenticated() || !user) {
      isInitializedRef.current = false;
      isPdfPreloadedRef.current = false;
      return;
    }

    // Comprobar si ya se inicializó en esta sesión de RAM
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;

      // Asegurar carga inicial ordenada
      Promise.allSettled([
        actualizarClientes(),
        actualizarMedidores(),
        actualizarTarifas()
      ]).catch((err) => {
        console.warn("Aviso en carga coordinada inicial:", err);
      });
    }

    // Precargar el visor PDF una sola vez tras la autenticación
    if (!isPdfPreloadedRef.current) {
      isPdfPreloadedRef.current = true;
      preloadPdfViewer();
    }
  }, [user, isAuthenticated, actualizarClientes, actualizarMedidores, actualizarTarifas]);

  return null;
};

export default InitDataLoader;
