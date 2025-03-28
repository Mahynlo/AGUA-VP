import { createContext, useContext, useState, useEffect } from "react";

// Crear el contexto
const ThemeContext = createContext();

// Proveedor del contexto
export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        return savedTheme || (prefersDark ? "dark" : "light");
    });

    useEffect(() => {// Cambiar el tema en el DOM al cambiar el estado
        const html = document.documentElement;

        const applyTheme = (currentTheme) => { // Remover clases existentes y agregar la clase del tema actual
            html.classList.remove("light", "dark"); // Remover clases existentes 
            if (currentTheme === "system") { // Si el tema es el sistema, obtener el tema del sistema y aplicarlo al HTML
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                html.classList.add(prefersDark ? "dark" : "light");
            } else { // Si el tema es claro u oscuro, aplicarlo al HTML
                html.classList.add(currentTheme);
            }
        };

        applyTheme(theme);

        if (theme === "system") {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            const handleChange = () => applyTheme("system");

            mediaQuery.addEventListener("change", handleChange);

            return () => mediaQuery.removeEventListener("change", handleChange);
        }
    }, [theme]);

    useEffect(() => {
        localStorage.setItem("theme", theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Custom hook para usar el contexto
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme debe usarse dentro de ThemeProvider");
    }
    return context;
};

