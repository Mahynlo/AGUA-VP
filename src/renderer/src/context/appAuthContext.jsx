// src/context/appAuthContext.jsx
import React, { createContext, useState, useEffect } from "react";


export const AuthAppContext = createContext();

export const AuthAppProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [error, setError] = useState(null);

    const verificarToken = async () => {
        const res = await window.authApp.leerToken();
        if (res?.token) { // Si el token es válido, lo guardamos en el estado
            setToken(res.token);
            setModalAbierto(false);
        } else { // Si no hay token o es inválido, mostramos el modal de registro
            const yaRegistrada = localStorage.getItem("appRegistrada");
            if (!yaRegistrada) { // Si la app no está registrada, abrimos el modal
                setModalAbierto(true);
            }
        }
    };

    const registrarApp = async () => {
        try {
            const res = await window.authApp.registrarApp("Mi App en Producción");
            if (res?.success && res.token) {
                setToken(res.token);
                setModalAbierto(false);
                localStorage.setItem("appRegistrada", "true");
                setError(null); // Limpia cualquier error anterior
            } else {
                setError(res?.message || "No se pudo registrar la app. Verifica tu conexión a internet.");
                //console.error("Error al registrar app:", res?.message || "Error desconocido");
            }
        } catch (err) {
            setError("Error al conectar. Verifica tu conexión a internet.");
            //console.error("Excepción al registrar app:", err);
        }
    };


    useEffect(() => {
        verificarToken();
    }, []);

    return (
        <AuthAppContext.Provider value={{ token, modalAbierto, registrarApp, error }}>
            {children}
        </AuthAppContext.Provider>
    );
};


