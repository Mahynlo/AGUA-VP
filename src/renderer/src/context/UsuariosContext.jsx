import { createContext, useState, useContext, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useFeedback } from "./FeedbackContext";

export const UsuariosContext = createContext();

export const useUsuarios = () => {
    const context = useContext(UsuariosContext);
    if (!context) {
        throw new Error("useUsuarios debe usarse dentro de un UsuariosProvider");
    }
    return context;
};

export const UsuariosProvider = ({ children }) => {
    const { logout } = useAuth();
    const { setSuccess, setError: setFeedbackError } = useFeedback();

    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Obtener token
    const getToken = () => localStorage.getItem("token");

    // Listar usuarios
    const fetchUsuarios = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const token = getToken();
            if (!token) return;
            const data = await window.api.fetchUsuarios(token, params);
            setUsuarios(data);
            return data;
        } catch (err) {
            console.error("Error fetching usuarios:", err);
            setError(err.message);
            // setFeedbackError("Error al cargar usuarios"); // Optional, maybe too noisy on load
        } finally {
            setLoading(false);
        }
    }, []);

    // Crear usuario
    const createUser = async (userData) => {
        try {
            const token = getToken();
            const res = await window.api.createUser(userData, token);
            setSuccess("Usuario creado exitosamente");
            await fetchUsuarios(); // Recargar lista
            return res;
        } catch (err) {
            console.error("Error creando usuario:", err);
            setFeedbackError(err.message || "Error al crear usuario");
            throw err; // Re-throw for local handling if needed
        }
    };

    // Actualizar usuario
    const updateUser = async (userData) => {
        try {
            const token = getToken();
            const res = await window.api.updateUser(userData, token);
            setSuccess("Usuario actualizado correctamente");
            await fetchUsuarios();
            return res;
        } catch (err) {
            console.error("Error actualizando usuario:", err);
            setFeedbackError(err.message || "Error al actualizar usuario");
            throw err;
        }
    };

    // Eliminar / Desactivar usuario
    const deleteUser = async (id, razon) => {
        try {
            const token = getToken();
            const res = await window.api.deleteUser({ id, razon }, token);
            setSuccess("Usuario desactivado correctamente");
            await fetchUsuarios();
            return res;
        } catch (err) {
            console.error("Error eliminando usuario:", err);
            setFeedbackError(err.message || "Error al eliminar usuario");
            throw err;
        }
    };

    // Reactivar usuario
    const reactivateUser = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const result = await window.api.reactivateUser(id, token);
            if (result.success) {
                setSuccess("Usuario reactivado correctamente");
                await fetchUsuarios();
            } else {
                setFeedbackError(result.error || "Error al reactivar usuario");
            }
        } catch (error) {
            setFeedbackError("Error de conexión al reactivar usuario");
            console.error(error);
        }
    };

    // Gestión de Sesiones
    const fetchUserSessions = async (usuarioId) => {
        try {
            const token = localStorage.getItem('token');
            const result = await window.api.getSession(usuarioId, token);
            // El backend devuelve { usuario_id, sesiones_activas: [], total: N }
            return result && result.sesiones_activas ? result.sesiones_activas : [];
        } catch (error) {
            console.error("Error fetching sessions:", error);
            return [];
        }
    };

    const closeSession = async (sessionId) => {
        const token = localStorage.getItem('token');
        try {
            const result = await window.api.closeSpecificSession(sessionId, token);
            if (result.success) {
                setSuccess("Sesión cerrada exitosamente");
                return true;
            } else {
                setFeedbackError(result.error || "No se pudo cerrar la sesión");
                return false;
            }
        } catch (error) {
            setFeedbackError("Error al cerrar la sesión");
            return false;
        }
    };

    const closeAllSessions = async (usuarioId) => {
        const token = localStorage.getItem('token');
        try {
            const result = await window.api.closeAllUserSessions(usuarioId, token);
            if (result.success) {
                setSuccess("Todas las sesiones del usuario han sido cerradas");
                return true;
            } else {
                setFeedbackError(result.error || "Error al cerrar sesiones");
                return false;
            }
        } catch (error) {
            setFeedbackError("Error al cerrar sesiones");
            return false;
        }
    };

    return (
        <UsuariosContext.Provider
            value={{
                usuarios,
                loading,
                fetchUsuarios,
                createUser,
                updateUser,
                deleteUser,
                reactivateUser,
                fetchUserSessions,
                closeSession,
                closeAllSessions
            }}
        >
            {children}
        </UsuariosContext.Provider>
    );
};
