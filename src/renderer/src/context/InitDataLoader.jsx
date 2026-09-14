import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useClientes } from "./ClientesContext";
import { useMedidores } from "./MedidoresContext";
import { useTarifas } from "./TarifasContext";
import { preloadPdfViewer } from "../utils/pdfPreloader";

// Componente para cargar datos iniciales de clientes, medidores y tarifas
const InitDataLoader = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { actualizarClientes } = useClientes();
  const { actualizarMedidores } = useMedidores();
  const { actualizarTarifas } = useTarifas();

  useEffect(() => {
    const isAuxiliary = 
      location.pathname === '/ayuda' ||
      location.pathname.startsWith('/recibo') ||
      location.pathname.startsWith('/reporte') ||
      location.pathname.startsWith('/comprobante');

    if (isAuxiliary) return;

    const yaInicializado = localStorage.getItem("datosInicializados");
    if (isAuthenticated() && user && !yaInicializado) {
      actualizarClientes();
      actualizarMedidores();
      actualizarTarifas();
      localStorage.setItem("datosInicializados", "true");
    }

    // Precargar el motor de visualización PDF en segundo plano durante tiempo inactivo
    if (isAuthenticated() && user) {
      preloadPdfViewer();
    }
  }, [user, isAuthenticated, location.pathname, actualizarClientes, actualizarMedidores, actualizarTarifas]);

  return null;
};

export default InitDataLoader;
