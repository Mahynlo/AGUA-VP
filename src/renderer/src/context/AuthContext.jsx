import { createContext, useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useFeedback } from "./FeedbackContext";

// =====================================================
// Context
// =====================================================
const AuthContext = createContext();

// =====================================================
// Helper: decodificar JWT de forma segura
// =====================================================
const decodeToken = (token) => {
    try {
        return JSON.parse(atob(token.split(".")[1]));
    } catch {
        return null;
    }
};

// =====================================================
// Provider
// =====================================================
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const { setSuccess, setError } = useFeedback();

    // --------------------
    // State
    // --------------------
    const [user, setUser] = useState(null);
    const [sesiones, setSesiones] = useState([]);
    const [loading, setLoading] = useState(true);

    // --------------------
    // Refs
    // --------------------
    const renovacionTimerRef = useRef(null);

    // =====================================================
    // Servidor
    // =====================================================
    const verificarEstadoServidor = async () => {
        try {
            const response = await window.api.checkServerStatus();
            return response?.status === "OK";
        } catch (error) {
            console.error("❌ Error al verificar servidor:", error);
            return false;
        }
    };

    // =====================================================
    // Token: programación y renovación
    // =====================================================
    const programarRenovacion = (expiresIn = "15m") => {
        if (renovacionTimerRef.current) {
            clearTimeout(renovacionTimerRef.current);
        }

        const duracionMs = expiresIn.includes("m")
            ? parseInt(expiresIn) * 60 * 1000
            : parseInt(expiresIn) * 1000;

        const renovarEn = duracionMs - 2 * 60 * 1000;

        renovacionTimerRef.current = setTimeout(async () => {
            console.log("🔄 Renovación automática del token");
            await renovarAccessToken();
        }, renovarEn);
    };

    const renovarAccessToken = async () => {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
            logout();
            return null;
        }

        try {
            const response = await window.api.refreshToken(refreshToken);

            if (response?.success && response.accessToken) {
                localStorage.setItem("token", response.accessToken);
                programarRenovacion(response.expiresIn || "15m");
                return response.accessToken;
            }

            const servidorActivo = await verificarEstadoServidor();
            if (!servidorActivo) {
                setTimeout(() => renovarAccessToken(), 60000);
                return null;
            }

            logout();
            return null;
        } catch (error) {
            const servidorActivo = await verificarEstadoServidor();
            if (!servidorActivo) {
                setTimeout(() => renovarAccessToken(), 60000);
                return null;
            }

            logout();
            return null;
        }
    };

    // =====================================================
    // Sesiones
    // =====================================================
    const obtenerSesionesActivas = async (usuarioId) => {
        try {
            const response = await window.api.getSession(usuarioId);
            setSesiones(response?.success ? response.sesiones || [] : []);
        } catch (error) {
            console.error("💥 Error al obtener sesiones:", error);
            setSesiones([]);
        }
    };

    // =====================================================
    // Bootstrap inicial (incluye modo impresión)
    // =====================================================
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const isPrintMode = urlParams.get("print") === "true";

        const storedToken = localStorage.getItem("token");
        if (!storedToken) {
            setLoading(false);
            return;
        }

        const decoded = decodeToken(storedToken);
        if (!decoded?.id || !decoded?.correo || !decoded?.rol) {
            logout();
            setLoading(false);
            return;
        }

        setUser({
            id: decoded.id,
            nombre: decoded.nombre,
            username: decoded.username,
            correo: decoded.correo,
            rol: decoded.rol,
            fecha_creacion: decoded.fecha_creacion
        });

        if (!isPrintMode) {
            obtenerSesionesActivas(decoded.id);
        }

        setLoading(false);
    }, []);

    // =====================================================
    // Verificación del token activo
    // =====================================================
    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        const decoded = decodeToken(token);
        if (!decoded?.exp) return;

        const now = Math.floor(Date.now() / 1000);
        const restante = decoded.exp - now;

        if (restante <= 120) {
            renovarAccessToken();
        } else {
            programarRenovacion(`${Math.ceil(restante / 60)}m`);
        }

        return () => {
            if (renovacionTimerRef.current) clearTimeout(renovacionTimerRef.current);
        };
    }, [user]);

    // =====================================================
    // Conectividad y eventos globales
    // =====================================================
    useEffect(() => {
        if (!user) return;

        const handleOnline = async () => {
            if (await verificarEstadoServidor()) {
                await renovarAccessToken();
                window.dispatchEvent(new CustomEvent("connection-restored"));
                setSuccess("Conexión restaurada. Actualizando datos...", "Sistema");
            }
        };

        const handleOffline = () => {
            setError("Conexión a internet perdida", "Sistema");
        };

        const handleTokenExpired = async () => {
            await renovarAccessToken();
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        window.addEventListener("token-expired", handleTokenExpired);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("token-expired", handleTokenExpired);
        };
    }, [user]);

    // =====================================================
    // Login / Logout
    // =====================================================
    const login = (token, refreshToken, expiresIn = "15m") => {
        try {
            localStorage.setItem("token", token);
            if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

            const decoded = decodeToken(token);
            if (!decoded?.id || !decoded?.correo || !decoded?.rol) {
                throw new Error("Token inválido");
            }

            setUser({
                id: decoded.id,
                nombre: decoded.nombre,
                username: decoded.username,
                correo: decoded.correo,
                rol: decoded.rol,
                fecha_creacion: decoded.fecha_creacion
            });

            obtenerSesionesActivas(decoded.id);
            programarRenovacion(expiresIn);

            navigate(decoded.rol === "administrador" ? "/home" : "/ayuda");
        } catch (error) {
            console.error("Error en login:", error);
            logout();
        }
    };

    const logout = async () => {
        const token = localStorage.getItem("token");

        if (token) {
            try {
                await window.api.logout(token);
            } catch (error) {
                console.error("❌ Error en logout backend:", error);
            }
        }

        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("datosInicializados");

        setUser(null);
        setSesiones([]);
        navigate("/");
    };

    // =====================================================
    // API pública del contexto
    // =====================================================
    const isAuthenticated = () => user !== null;

    return (
        <AuthContext.Provider
            value={{
                user,
                sesiones,
                loading,
                login,
                logout,
                renovarAccessToken,
                isAuthenticated
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// =====================================================
// Hook
// =====================================================
export const useAuth = () => useContext(AuthContext);



