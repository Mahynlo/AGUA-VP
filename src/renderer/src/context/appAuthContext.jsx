// src/context/appAuthContext.jsx
import React, { createContext, useState, useEffect,useContext } from "react";

const AuthAppContext = createContext();

export const AuthAppProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [error, setError] = useState(null);

    const verificarToken = async () => {
        try {
            const res = await window.authApp.ensureToken("Mi App en Producción");
            if (res?.success && res.token) {
                setToken(res.token);
                setModalAbierto(false);
                setError(null);
                return;
            }

            // Si no pudo garantizar token, forzar modal de registro.
            setModalAbierto(true);
            setError(res?.message || "No se pudo validar el token de aplicación.");
        } catch (err) {
            setModalAbierto(true);
            setError("Error al validar el token de aplicación.");
            console.error("Excepción al verificar token app:", err);
        }
    };

    const registrarApp = async () => {
        try {
            const res = await window.authApp.recoverOrRegister("Mi App en Producción");
            if (res?.success && res.token) { //si la respuesta es exitosa y contiene un token
                setToken(res.token);
                setModalAbierto(false);
                console.log("App registrada exitosamente:", res);
                setError(null); // Limpia cualquier error anterior
            } else {
                setError(res?.message || "No se pudo registrar la app. Verifica tu conexión a internet.");
                console.error("Error al registrar app:", res?.message || "Error desconocido");
            }
        } catch (err) {
            setError("Error al conectar. Verifica tu conexión a internet.");
            console.error("Excepción al registrar app:", err);
        }
    };


    useEffect(() => {
        verificarToken();
    }, []);

    useEffect(() => {
        if (!window?.authApp?.onTokenMissing) return;

        const unsubscribe = window.authApp.onTokenMissing(async () => {
            const ensureResult = await window.authApp.ensureToken("Mi App en Producción");
            if (ensureResult?.success && ensureResult.token) {
                setToken(ensureResult.token);
                setModalAbierto(false);
                setError(null);
                return;
            }

            setModalAbierto(true);
            setError("Token de app no disponible. Registra la app para continuar.");
        });

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    return (
        <AuthAppContext.Provider value={{ token, modalAbierto, registrarApp, error }}>
            {children}
        </AuthAppContext.Provider>
    );
};

// personalizado para exportar el contexto
export const useAuthApp = () => useContext(AuthAppContext);
