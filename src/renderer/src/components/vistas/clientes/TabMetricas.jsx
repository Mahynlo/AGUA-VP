import { Select, SelectItem, Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import ClientesRegistradosChart from "../../charts/ClientesRegistrados";
import ClientesPorMesChart from "../../charts/ChartClientesPorMes";
import {useClientes} from "../../../context/ClientesContext";

export const TabMetricas = () => {
    const [tableHeight, setTableHeight] = useState(getTableHeight()); // Altura inicial de la tabla
    const { clientes, loading } = useClientes();

    console.log("Clientes(contx):", clientes);

    function getTableHeight() { // Función para calcular la altura de la tabla
        return window.devicePixelRatio >= 1.25 ? "min-h-[29.5rem] max-h-[29.5rem]" : "min-h-[40rem] max-h-[40rem]";
    }

    useEffect(() => { // Ajustar la altura de la tabla al cambiar el tamaño de la ventana
        const handleResize = () => setTableHeight(getTableHeight());
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        
        <ClientesPorMesChart clientes={clientes} />


    )
}

