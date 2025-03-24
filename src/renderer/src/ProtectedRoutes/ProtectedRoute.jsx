import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth(); // Obtener la función isAuthenticated

    // Si el usuario no está autenticado, redirige al login
    return isAuthenticated() ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoute;

