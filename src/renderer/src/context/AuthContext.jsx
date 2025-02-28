import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            try {
                const decoded = JSON.parse(atob(storedToken.split(".")[1])); // Decodificar el payload del JWT
                setUser({ id: decoded.id, correo: decoded.correo, rol: decoded.rol });
            } catch (error) {
                console.error("Error al decodificar el token", error);
                logout();
            }
        }
    }, []);

    const login = (token) => {
        try {
            localStorage.setItem("token", token);
            
            const decoded = JSON.parse(atob(token.split(".")[1])); // Decodificar token
            setUser({ id: decoded.id, correo: decoded.correo, rol: decoded.rol });

            // Redirigir según el rol
            navigate(decoded.rol === "administrador" ? "/home" : "/ayuda");
        } catch (error) {
            console.error("Token inválido", error);
            logout();
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        window.location.href = "/"; // Redirigir sin problemas de `useNavigate`
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);

