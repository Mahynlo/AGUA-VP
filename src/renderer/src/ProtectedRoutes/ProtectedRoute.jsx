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

  const {actualizarClientes} = useClientes();
  const {actualizarMedidores} = useMedidores();
  const {actualizarTarifas} = useTarifas();

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setEspera(false);
    }, 3000); // 3 segundos

    return () => clearTimeout(temporizador); // limpieza
  }, []);

  if (loading || espera) {
    return <LoadingVistas />;
  }

  return isAuthenticated() ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoute;


