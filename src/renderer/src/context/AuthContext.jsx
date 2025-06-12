import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Inicializamos en `null` para indicar que no hay un usuario.
    const navigate = useNavigate(); // Hook para redirigir a una ruta
    const [sesiones, setSesiones] = useState([]);
    const [loading, setLoading] = useState(true); // Estado para manejar la carga


    const obtenerSesionesActivas = async (usuarioId) => {
        try {
            const response = await window.api.getSession(usuarioId)
            if (response.success) {
                setSesiones(response.sesiones);
            } else {
                console.error("No se pudieron obtener las sesiones activas:", response.error);
            }
        } catch (error) {
            console.error("Error al obtener sesiones activas:", error);
        }
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            try {
                const decoded = JSON.parse(atob(storedToken.split(".")[1]));
                if (decoded?.id && decoded?.correo && decoded?.rol) {
                    setUser({ id: decoded.id,username:decoded.username, correo: decoded.correo, rol: decoded.rol });
                    obtenerSesionesActivas(decoded.id).finally(() => setLoading(false));
                } else {
                    logout();
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error al decodificar el token", error);
                logout();
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const login = (token) => {
        try {
            localStorage.setItem("token", token); // Guardamos el token

            const decoded = JSON.parse(atob(token.split(".")[1])); // Decodificar token
            // Validamos si el token es válido
            if (decoded?.id && decoded?.correo && decoded?.rol) {
                setUser({ id: decoded.id,username:decoded.username, correo: decoded.correo, rol: decoded.rol });
                obtenerSesionesActivas(decoded.id); // Obtenemos las sesiones activas del usuario
                // Redirigimos dependiendo del rol
                navigate(decoded.rol === "administrador" ? "/home" : "/ayuda");
            } else {
                throw new Error("Token inválido");
            }
        } catch (error) {
            console.error("Error al procesar el token", error);
            logout();
        }
    };



    const logout = async () => { // Limpiar el token y el estado del usuario 
        const token = localStorage.getItem("token");

        if (token) { // Si hay un token, intentamos cerrar sesión en el backend 
            try {
                await window.electron.ipcRenderer.invoke("logout", token);
            } catch (error) {
                console.error("Error al cerrar sesión:", error);
            }
        }

        localStorage.removeItem("token"); // Eliminar token del almacenamiento local
        setUser(null); // Limpiar el estado del usuario
        setSesiones([]); // Limpiar sesiones activas
        navigate("/"); // Redirigir al login
    };

    // Función para saber si hay un usuario autenticado
    const isAuthenticated = () => {
        return user !== null; // Si `user` es distinto de `null`, el usuario está autenticado
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated, sesiones, loading}}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);


