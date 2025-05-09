import React, { useEffect, useState } from "react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@nextui-org/react";
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

    return (
        <Dropdown>
            <DropdownTrigger>
                <Button>
                    {theme === "light" && (
                        <>
                            <ModoClaroIcon className="w-6 h-6"/> Claro
                        </>
                    )}
                    {theme === "dark" && (
                        <>
                            <ModoOscuroIcon className="w-6 h-6"/> Oscuro
                        </>
                    )}
                    {theme === "system" && (
                        <>
                            <ModoSistemaIcon className="w-6 h-6"/> Sistema
                        </>
                    )}
                </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Cambiar tema">
                <DropdownItem key="light" onClick={() => setTheme("light")} startContent={<ModoClaroIcon className="w-6 h-6" />} isSelected={theme === "light"}>
                    Claro
                </DropdownItem>
                <DropdownItem key="dark" onClick={() => setTheme("dark")} startContent={<ModoOscuroIcon className="w-6 h-6" />} isSelected={theme === "dark"}>
                    Oscuro
                </DropdownItem>
                <DropdownItem key="system" onClick={() => setTheme("system")} startContent={<ModoSistemaIcon className="w-6 h-6" />} isSelected={theme === "system"}>
                    Sistema
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
}

export default ModoTema;

