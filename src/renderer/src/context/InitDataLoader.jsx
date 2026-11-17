import { useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { preloadPdfViewer } from "../utils/pdfPreloader";

// Precarga en tiempo inactivo los módulos pesados que se usarán después de iniciar sesión.
//
// Los datos (clientes, medidores, tarifas, etc.) NO se cargan aquí: cada contexto pide los suyos
// cuando recibe al usuario autenticado. Antes este componente los volvía a pedir, y cada pantalla
// hacía las mismas consultas dos o tres veces al iniciar sesión.
const InitDataLoader = () => {
  const { user } = useAuth();
  const isPdfPreloadedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      isPdfPreloadedRef.current = false;
      return;
    }

    // Precargar el visor PDF una sola vez tras la autenticación
    if (!isPdfPreloadedRef.current) {
      isPdfPreloadedRef.current = true;
      preloadPdfViewer();
    }
  }, [user]);

  return null;
};

export default InitDataLoader;
