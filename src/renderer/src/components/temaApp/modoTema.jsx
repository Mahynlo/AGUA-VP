import React, { useEffect, useState } from "react";
import { ModoClaroIcon, ModoOscuroIcon, ModoSistemaIcon } from "../../IconsApp/IconsAppSystem";

function ModoTema() {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) return savedTheme;
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    });

    useEffect(() => {
        const html = document.querySelector("html");
        html.classList.remove("light", "dark");

        if (theme === "system") {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            html.classList.add(prefersDark ? "dark" : "light");
        } else {
            html.classList.add(theme);
        }

        localStorage.setItem("theme", theme);
    }, [theme]);

    useEffect(() => {
        if (theme === "system") {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            const handleChange = () => {
                const prefersDark = mediaQuery.matches;
                document.documentElement.classList.remove("light", "dark");
                document.documentElement.classList.add(prefersDark ? "dark" : "light");
            };

            mediaQuery.addEventListener("change", handleChange);
            handleChange();

            return () => mediaQuery.removeEventListener("change", handleChange);
        }
    }, [theme]);

    const opciones = [
        { key: "light", label: "Claro", icon: ModoClaroIcon },
        { key: "dark", label: "Oscuro", icon: ModoOscuroIcon },
        { key: "system", label: "Sistema", icon: ModoSistemaIcon }
    ];

    return (
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800">
            {opciones.map(({ key, label, icon: Icon }) => {
                const isSelected = theme === key;
                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setTheme(key)}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs transition-all duration-200 ${
                            isSelected
                                ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold shadow-sm border border-slate-200/80 dark:border-zinc-700"
                                : "text-slate-600 dark:text-zinc-400 font-medium hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/40 dark:hover:bg-zinc-800/40"
                        }`}
                    >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{label}</span>
                    </button>
                );
            })}
        </div>
    );
}

export default ModoTema;

