import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Inicializamos en `null` para indicar que no hay un usuario.
    const navigate = useNavigate(); // Hook para redirigir a una ruta

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            try {
                const decoded = JSON.parse(atob(storedToken.split(".")[1])); // Decodificar el payload del JWT
                // Verificamos si los datos decodificados son válidos
                if (decoded?.id && decoded?.correo && decoded?.rol) {
                    setUser({ id: decoded.id, correo: decoded.correo, rol: decoded.rol });
                } else {
                    logout(); // Si no es válido, salimos
                }
            } catch (error) {
                console.error("Error al decodificar el token", error);
                logout(); // Si no se puede decodificar el token, salimos
            }
        }
    }, []);

    const login = (token) => {
        try {
            localStorage.setItem("token", token); // Guardamos el token

            const decoded = JSON.parse(atob(token.split(".")[1])); // Decodificar token
            // Validamos si el token es válido
            if (decoded?.id && decoded?.correo && decoded?.rol) {
                setUser({ id: decoded.id, correo: decoded.correo, rol: decoded.rol });
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

    const logout = () => {
        localStorage.removeItem("token"); // Eliminar token del almacenamiento local
        setUser(null); // Limpiar el estado del usuario
        navigate("/"); // Redirigir al login
    };

    // Función para saber si hay un usuario autenticado
    const isAuthenticated = () => {
        return user !== null; // Si `user` es distinto de `null`, el usuario está autenticado
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);


