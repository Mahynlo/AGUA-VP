import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingVistas from "../components/pantalladecarga/LoadingVistas";
import { useEffect, useState } from "react";

import { useClientes } from "../context/ClientesContext";
import { useMedidores } from "../context/MedidoresContext";
import { useTarifas } from "../context/TarifasContext";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const [espera, setEspera] = useState(true);

  // Verificar si estamos en modo impresión
  const urlParams = new URLSearchParams(window.location.search);
  const isPrintMode = urlParams.get('print') === 'true';

  const {actualizarClientes} = useClientes();
  const {actualizarMedidores} = useMedidores();
  const {actualizarTarifas} = useTarifas();

  useEffect(() => {
    if (isPrintMode) {
      // En modo impresión, no esperar
      setEspera(false);
      return;
    }

    const temporizador = setTimeout(() => {
      setEspera(false);
    }, 3000); // 3 segundos

    return () => clearTimeout(temporizador); // limpieza
  }, [isPrintMode]);

  // SEGURIDAD: En modo impresión, PRIMERO verificar autenticación
  if (isPrintMode) {
    // Solo permitir modo impresión si el usuario YA está autenticado
    if (isAuthenticated()) {
      console.log('Modo impresión autorizado para usuario autenticado');
      return <Outlet />;
    } else {
      // Usuario no autenticado intentando usar modo impresión - BLOQUEAR
      console.warn('Intento de acceso no autorizado al modo impresión');
      return <Navigate to="/" />;
    }
  }

  if (loading || espera) {
    return <LoadingVistas />;
  }

  return isAuthenticated() ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoute;


