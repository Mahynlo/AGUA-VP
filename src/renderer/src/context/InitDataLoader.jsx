import { useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useClientes } from "./ClientesContext";
import { useMedidores } from "./MedidoresContext";
import { useTarifas } from "./TarifasContext";
// // Componente para cargar datos iniciales de clientes, medidores y tarifas
const InitDataLoader = () => {
  const { user, isAuthenticated } = useAuth();
  const { actualizarClientes } = useClientes();
  const { actualizarMedidores } = useMedidores();
  const { actualizarTarifas } = useTarifas();

  useEffect(() => { // Efecto para cargar datos al iniciar sesión
    const yaInicializado = localStorage.getItem("datosInicializados"); // Verifica si los datos ya fueron inicializados
    if (isAuthenticated() && user && !yaInicializado) { // Si el usuario está autenticado y los datos no han sido inicializados
      actualizarClientes();
      actualizarMedidores();
      actualizarTarifas();
      localStorage.setItem("datosInicializados", "true");
    }
  }, [user, isAuthenticated, actualizarClientes, actualizarMedidores, actualizarTarifas]);

  return null; // No renderiza nada
};

export default InitDataLoader;
