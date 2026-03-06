import { createContext, useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useFeedback } from "./FeedbackContext";

// =====================================================
// Context
// =====================================================
export const AuthContext = createContext();

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
    const refreshPromiseRef = useRef(null);

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
        // Mutex: si ya hay un refresh en curso, esperar su resultado
        if (refreshPromiseRef.current) {
            console.log("🔒 Refresh en curso, esperando resultado...");
            return refreshPromiseRef.current;
        }

        const refreshPromise = (async () => {
            const refreshToken = localStorage.getItem("refreshToken");

            if (!refreshToken) {
                logout();
                return null;
            }

            try {
                const response = await window.api.refreshToken(refreshToken);

                if (response?.success && response.accessToken) {
                    localStorage.setItem("token", response.accessToken);
                    // Rotación: guardar el nuevo refreshToken si se devolvió
                    if (response.refreshToken) {
                        localStorage.setItem("refreshToken", response.refreshToken);
                    }
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
            } finally {
                refreshPromiseRef.current = null;
            }
        })();

        refreshPromiseRef.current = refreshPromise;
        return refreshPromise;
    };

    // =====================================================
    // Sesiones
    // =====================================================
    // =====================================================
    // Sesiones
    // =====================================================
    const obtenerSesionesActivas = async (usuarioId) => {
        try {
            // Obtener token (puede ser del state o localStorage para asegurar)
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await window.api.getSession(usuarioId, token);
            console.log("🔍 Respuesta obtenerSesionesActivas:", response); // Debug Log

            // Fix: Permitir si success es true O si contiene el array directamente (fallback)
            if (response?.success || Array.isArray(response?.sesiones_activas)) {
                setSesiones(response.sesiones_activas || []);
            } else {
                setSesiones([]);
            }
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

        // Verificar si el token está expirado o próximo a expirar (< 2 min)
        const now = Math.floor(Date.now() / 1000);
        const tokenExpirado = decoded.exp && (decoded.exp - now) <= 120;

        const inicializarUsuario = (tokenDecoded) => {
            setUser({
                id: tokenDecoded.id,
                nombre: tokenDecoded.nombre,
                username: tokenDecoded.username,
                correo: tokenDecoded.correo,
                rol: tokenDecoded.rol,
                fecha_creacion: tokenDecoded.fecha_creacion
            });
            if (!isPrintMode) {
                obtenerSesionesActivas(tokenDecoded.id);
            }
            setLoading(false);
        };

        if (tokenExpirado) {
            // Token expirado o por expirar: renovar ANTES de exponer al usuario
            console.log("🔄 Token expirado/próximo a expirar en bootstrap, renovando...");
            renovarAccessToken().then((newToken) => {
                if (newToken) {
                    const newDecoded = decodeToken(newToken);
                    if (newDecoded?.id) {
                        inicializarUsuario(newDecoded);
                        return;
                    }
                }
                // Si la renovación falló, logout
                logout();
                setLoading(false);
            });
        } else {
            // Token válido: inicializar normalmente y programar renovación
            inicializarUsuario(decoded);
            if (decoded.exp) {
                const restante = decoded.exp - now;
                programarRenovacion(`${Math.ceil(restante / 60)}m`);
            }
        }
    }, []);

    // =====================================================
    // Limpieza del timer de renovación al desmontar
    // =====================================================
    useEffect(() => {
        return () => {
            if (renovacionTimerRef.current) clearTimeout(renovacionTimerRef.current);
        };
    }, []);

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
                obtenerSesionesActivas, // Exponer para recargar manualmente
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



