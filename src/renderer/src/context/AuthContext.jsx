import { createContext, useState, useEffect, useContext, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFeedback } from "./FeedbackContext";

// =====================================================
// Context
// =====================================================
export const AuthContext = createContext();

// =====================================================
// Sesión
// =====================================================
// Los tokens de sesión viven en el proceso principal (src/main/auth/sessionStore.js), cifrados en
// disco; aquí solo se conoce al usuario. Las pantallas siguen leyendo localStorage "token" para
// saber si hay sesión y pasarlo por IPC, pero su valor es este marcador, que no autentica nada:
// el proceso principal pone el token real en cada petición.
const MARCADOR_SESION = "sesion-en-proceso-principal";

const marcarSesion = () => localStorage.setItem("token", MARCADOR_SESION);

const limpiarSesionLocal = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken"); // lo dejaban versiones anteriores
    localStorage.removeItem("datosInicializados");
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
    const isFetchingSesionesRef = useRef(false);

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
    const programarRenovacion = (segundosRestantes = 15 * 60) => {
        if (renovacionTimerRef.current) {
            clearTimeout(renovacionTimerRef.current);
        }

        // Dos minutos antes de que venza el access token (nunca de inmediato, para no encadenar renovaciones)
        const segundos = Number(segundosRestantes) > 0 ? Number(segundosRestantes) : 15 * 60;
        const renovarEn = Math.max(segundos - 2 * 60, 5) * 1000;

        renovacionTimerRef.current = setTimeout(async () => {
            console.log("🔄 Renovación automática de la sesión");
            await renovarAccessToken();
        }, renovarEn);
    };

    // Pide al proceso principal que renueve la sesión. Devuelve true si quedó renovada.
    const renovarAccessToken = async () => {
        // Mutex: si ya hay una renovación en curso, esperar su resultado
        if (refreshPromiseRef.current) {
            console.log("🔒 Renovación en curso, esperando resultado...");
            return refreshPromiseRef.current;
        }

        const refreshPromise = (async () => {
            try {
                const response = await window.api.refreshToken();

                if (response?.success) {
                    marcarSesion();
                    programarRenovacion(response.expiraEnSegundos);
                    window.dispatchEvent(new CustomEvent("token-refreshed"));
                    return true;
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
    const obtenerSesionesActivas = useCallback(async (usuarioId) => {
        if (!usuarioId) return;
        if (isFetchingSesionesRef.current) return;
        isFetchingSesionesRef.current = true;
        try {
            // Marcador de sesión (el token real lo pone el proceso principal)
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await window.api.getSession(usuarioId, token);
            console.log("🔍 Respuesta obtenerSesionesActivas:", response);

            // Fix: Permitir si success es true O si contiene el array directamente (fallback)
            if (response?.success || Array.isArray(response?.sesiones_activas)) {
                setSesiones(response.sesiones_activas || []);
            } else {
                setSesiones([]);
            }
        } catch (error) {
            console.error("💥 Error al obtener sesiones:", error);
            setSesiones([]);
        } finally {
            isFetchingSesionesRef.current = false;
        }
    }, []);

    // =====================================================
    // Bootstrap inicial (incluye modo impresión)
    // =====================================================
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const isPrintMode = urlParams.get("print") === "true";
        let cancelado = false;

        (async () => {
            // Versiones anteriores guardaban los tokens aquí: se entregan una vez al proceso principal
            // (para no cerrar la sesión al actualizar la app) y se borran de localStorage.
            const refreshAnterior = localStorage.getItem("refreshToken");
            const anterior = refreshAnterior
                ? { token: localStorage.getItem("token"), refreshToken: refreshAnterior }
                : undefined;

            let estado = null;
            try {
                estado = await window.api.sessionState(anterior);
            } catch (error) {
                console.error("❌ Error al consultar la sesión:", error);
            }
            localStorage.removeItem("refreshToken");
            if (cancelado) return;

            if (estado?.activa && estado.user?.id) {
                marcarSesion();
                setUser(estado.user);
                if (!isPrintMode) {
                    obtenerSesionesActivas(estado.user.id);
                }
                programarRenovacion(estado.expiraEnSegundos);
            } else {
                // Sin sesión (o no se pudo comprobar): las rutas protegidas llevan al inicio de sesión
                limpiarSesionLocal();
            }
            setLoading(false);
        })();

        return () => {
            cancelado = true;
        };
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
    // El proceso principal ya guardó los tokens al iniciar sesión; aquí llegan solo los datos del usuario
    const login = useCallback((usuario, segundosRestantes) => {
        try {
            if (!usuario?.id || !usuario?.correo || !usuario?.rol) {
                throw new Error("Sesión inválida");
            }

            marcarSesion();
            setUser({
                id: usuario.id,
                nombre: usuario.nombre,
                username: usuario.username,
                correo: usuario.correo,
                rol: usuario.rol,
                fecha_creacion: usuario.fecha_creacion
            });

            // Cada contexto carga sus datos al recibir al usuario: no hace falta avisarles aquí
            obtenerSesionesActivas(usuario.id);
            programarRenovacion(segundosRestantes);

            navigate("/home");
        } catch (error) {
            console.error("Error en login:", error);
            logout();
        }
    }, [navigate, obtenerSesionesActivas]);

    const logout = useCallback(async () => {
        if (renovacionTimerRef.current) {
            clearTimeout(renovacionTimerRef.current);
            renovacionTimerRef.current = null;
        }

        // Cierra la sesión en la API y borra los tokens guardados en el proceso principal
        try {
            await window.api.logout();
        } catch (error) {
            console.error("❌ Error en logout backend:", error);
        }

        limpiarSesionLocal();

        setUser(null);
        setSesiones([]);
        window.dispatchEvent(new CustomEvent("dashboard-update"));
        navigate("/");
    }, [navigate]);

    // =====================================================
    // API pública del contexto
    // =====================================================
    const isAuthenticated = useCallback(() => user !== null, [user]);

    const value = useMemo(() => ({
        user,
        sesiones,
        loading,
        login,
        logout,
        renovarAccessToken,
        obtenerSesionesActivas,
        isAuthenticated
    }), [
        user,
        sesiones,
        loading,
        login,
        logout,
        obtenerSesionesActivas,
        isAuthenticated
    ]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// =====================================================
// Hook
// =====================================================
export const useAuth = () => useContext(AuthContext);



