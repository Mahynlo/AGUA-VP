// src/context/appAuthContext.jsx
import React, { createContext, useState, useEffect,useContext } from "react";

const AuthAppContext = createContext();

export const AuthAppProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [error, setError] = useState(null);

    const verificarToken = async () => {
        const res = await window.authApp.leerToken();
        if (res?.token) { // Si el token es válido, lo guardamos en el estado
            setToken(res.token);
            console.log("Token de sesión encontrado:", res.token);
            setModalAbierto(false);
            
        } else { // Si no hay token o es inválido, mostramos el modal de registro
            const yaRegistrada = localStorage.getItem("AppRegistrada"); 
            console.log("se crea un o", yaRegistrada);

            if (!yaRegistrada) { // Si la app no está registrada, abrimos el modal
                setModalAbierto(true);
            }
        }
    };

    const registrarApp = async () => {
        try {
            const res = await window.authApp.registrarApp("Mi App en Producción");
            if (res?.success && res.token) { //si la respuesta es exitosa y contiene un token
                setToken(res.token);
                setModalAbierto(false);
                localStorage.setItem("AppRegistrada", "true"); // Marcamos la app como registrada
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

    return (
        <AuthAppContext.Provider value={{ token, modalAbierto, registrarApp, error }}>
            {children}
        </AuthAppContext.Provider>
    );
};

// personalizado para exportar el contexto
export const useAuthApp = () => useContext(AuthAppContext);
