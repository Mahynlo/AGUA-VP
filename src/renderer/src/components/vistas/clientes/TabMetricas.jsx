import { Select, SelectItem, Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";



export const TabMetricas = () => {
    const [tableHeight, setTableHeight] = useState(getTableHeight()); // Altura inicial de la tabla
    
    function getTableHeight() { // Función para calcular la altura de la tabla
        return window.devicePixelRatio >= 1.25 ? "min-h-[29.5rem] max-h-[29.5rem]" : "min-h-[40rem] max-h-[40rem]";
    }

    useEffect(() => { // Ajustar la altura de la tabla al cambiar el tamaño de la ventana
        const handleResize = () => setTableHeight(getTableHeight());
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className={`p-3 bg-gray-100 rounded-lg shadow-lg dark:bg-gray-800 dark:text-white ${tableHeight}`}>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Metricas de clientes</h1>
            
            

        </div>
    )
}

