import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingVistas from "../components/pantalladecarga/LoadingVistas";
import { useEffect, useState } from "react";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const [espera, setEspera] = useState(true);

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


