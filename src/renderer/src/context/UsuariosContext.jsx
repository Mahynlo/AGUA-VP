import { createContext, useState, useContext, useCallback, useMemo } from "react";
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
            // Guardar solo si es un array real — si la API devuelve un objeto de error
            // (p.ej. { success: false, error: "..." }) evitar romper usuarios.filter()
            const lista = Array.isArray(data) ? data : [];
            setUsuarios(lista);
            return lista;
        } catch (err) {
            console.error("Error fetching usuarios:", err);
            setUsuarios([]);
            setError(err.message);
            // setFeedbackError("Error al cargar usuarios"); // Optional, maybe too noisy on load
        } finally {
            setLoading(false);
        }
    }, []);

    // Crear usuario
    const createUser = useCallback(async (userData) => {
        try {
            const token = getToken();
            const res = await window.api.createUser(userData, token);
            setSuccess("Usuario creado exitosamente");
            await fetchUsuarios(); // Recargar lista
            return res;
        } catch (err) {
            console.error("Error creando usuario:", err);
            setFeedbackError(err.message || "Error al crear usuario");
            throw err;
        }
    }, [fetchUsuarios, setSuccess, setFeedbackError]);

    // Actualizar usuario
    const updateUser = useCallback(async (userData) => {
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
    }, [fetchUsuarios, setSuccess, setFeedbackError]);

    // Eliminar / Desactivar usuario
    const deleteUser = useCallback(async (id, razon) => {
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
    }, [fetchUsuarios, setSuccess, setFeedbackError]);

    // Reactivar usuario
    const reactivateUser = useCallback(async (id) => {
        try {
            const token = localStorage.getItem('token');
            const result = await window.api.reactivateUser(id, token);
            if (result.success) {
                setSuccess("Usuario reactivado correctamente");
                await fetchUsuarios();
                return result;
            } else {
                setFeedbackError(result.error || "Error al reactivar usuario");
                return result;
            }
        } catch (error) {
            setFeedbackError("Error de conexión al reactivar usuario");
            console.error(error);
            throw error;
        }
    }, [fetchUsuarios, setSuccess, setFeedbackError]);

    const purgeUser = useCallback(async (id) => {
        try {
            const token = localStorage.getItem('token');
            const result = await window.api.purgeUser(id, token);
            if (result && result.success) {
                setSuccess("Usuario eliminado definitivamente de la base de datos");
                await fetchUsuarios();
                return result;
            } else {
                const errorMsg = result?.error || "Error al eliminar definitivamente al usuario";
                setFeedbackError(errorMsg);
                throw new Error(errorMsg);
            }
        } catch (error) {
            setFeedbackError(error.message || "Error al eliminar definitivamente al usuario");
            console.error(error);
            throw error;
        }
    }, [fetchUsuarios, setSuccess, setFeedbackError]);

    const fetchPermissionsCatalog = useCallback(async () => {
        try {
            const token = getToken();
            const result = await window.api.fetchPermissionsCatalog(token);
            return result?.data || [];
        } catch (error) {
            console.error("Error fetching permissions catalog:", error);
            setFeedbackError(error.message || "Error al cargar catálogo de permisos");
            return [];
        }
    }, [setFeedbackError]);

    const fetchUserPermissions = useCallback(async (id) => {
        try {
            const token = getToken();
            const result = await window.api.fetchUserPermissions(id, token);
            return result?.permissions || [];
        } catch (error) {
            console.error("Error fetching user permissions:", error);
            setFeedbackError(error.message || "Error al cargar permisos del usuario");
            return [];
        }
    }, [setFeedbackError]);

    const updateUserPermissions = useCallback(async (id, overrides) => {
        try {
            const token = getToken();
            const result = await window.api.updateUserPermissions(id, overrides, token);
            if (!result?.success) {
                const errMsg = result?.error || "No se pudieron actualizar los permisos";
                setFeedbackError(errMsg);
                throw new Error(errMsg);
            }

            setSuccess("Permisos actualizados correctamente");
            return result;
        } catch (error) {
            console.error("Error updating user permissions:", error);
            setFeedbackError(error.message || "Error al actualizar permisos del usuario");
            throw error;
        }
    }, [setSuccess, setFeedbackError]);

    // Gestión de Sesiones
    const fetchUserSessions = useCallback(async (usuarioId) => {
        try {
            const token = localStorage.getItem('token');
            const result = await window.api.getSession(usuarioId, token);
            return result && result.sesiones_activas ? result.sesiones_activas : [];
        } catch (error) {
            console.error("Error fetching sessions:", error);
            return [];
        }
    }, []);

    const closeSession = useCallback(async (sessionId) => {
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
    }, [setSuccess, setFeedbackError]);

    const closeAllSessions = useCallback(async (usuarioId) => {
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
    }, [setSuccess, setFeedbackError]);

    const value = useMemo(() => ({
        usuarios,
        loading,
        fetchUsuarios,
        createUser,
        updateUser,
        deleteUser,
        reactivateUser,
        purgeUser,
        fetchPermissionsCatalog,
        fetchUserPermissions,
        updateUserPermissions,
        fetchUserSessions,
        closeSession,
        closeAllSessions
    }), [
        usuarios,
        loading,
        fetchUsuarios,
        createUser,
        updateUser,
        deleteUser,
        reactivateUser,
        purgeUser,
        fetchPermissionsCatalog,
        fetchUserPermissions,
        updateUserPermissions,
        fetchUserSessions,
        closeSession,
        closeAllSessions
    ]);

    return (
        <UsuariosContext.Provider value={value}>
            {children}
        </UsuariosContext.Provider>
    );
};
