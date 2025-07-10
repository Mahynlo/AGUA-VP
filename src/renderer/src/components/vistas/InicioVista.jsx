import React, { useState } from "react";
import PieChart from "../charts/piechart";
import LineChart from "../charts/lineChart";
import CalendarInicio from "../calendario/CalendarioInicio";
import { ConsumoIcon, ClientesHomeIcon, MedidioresIcon } from "../../IconsApp/IconsHome";
import { useMedidores } from "../../../src/context/MedidoresContext";
import { useClientes } from "../../../src/context/ClientesContext";
import { parseDate } from "@internationalized/date";

const InicioVista = () => {
    const { medidores } = useMedidores();
    const { clientes } = useClientes();
    const [openModal, setOpenModal] = useState(true);
    let [value, setValue] = useState(parseDate("2024-04-07"));

    return (
        <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
            <div
                className="
      grid gap-4 auto-rows-max h-full p-2
      grid-cols-1
      sm:grid-cols-1
      md:grid-cols-4
      lg:grid-cols-4
      2xl:grid-cols-4 
    "
            >
                {/* Tarjetas */}
                <div className="p-6 bg-gray-100 border rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                    {/* Consumo */}
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <p className="2xl:text-3xl lg:text-2xl text-gray-600 dark:text-gray-100 font-bold tracking-wide">Consumo</p>
                            <h3 className="mt-1 text-5xl text-red-500 font-bold mt-4">600 m³</h3>
                            <span className="mt-4 text-xs text-gray-500">Número corresponde al consumo diario correspondiente al mes anterior.</span>
                        </div>
                        <div className="bg-red-500 p-2 rounded-md text-white">
                            <ConsumoIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>


                <div className="p-6 bg-gray-100 border rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                    {/* Clientes */}
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <p className="2xl:text-3xl lg:text-2xl text-gray-600 dark:text-gray-100 font-bold tracking-wide">Clientes</p>
                            <h3 className="mt-1 text-5xl text-green-500 font-bold mt-4">{clientes.length}</h3>
                            <span className="mt-4 text-xs text-gray-500">Número correspondiente a los clientes registrados hasta el mes anterior.</span>
                        </div>
                        <div className="bg-green-500 p-2 rounded-md text-white">
                            <ClientesHomeIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-100 border rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                    {/* Medidores */}
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <p className="2xl:text-3xl lg:text-2xl text-gray-600 dark:text-gray-100 font-bold tracking-wide">Medidores</p>
                            <h3 className="mt-1 text-5xl text-blue-500 font-bold mt-4">{medidores.length}</h3>
                            <span className="mt-4 text-xs text-gray-500">Número correspondiente al mes anterior.</span>
                        </div>
                        <div className="bg-blue-500 p-2 rounded-md text-white">
                            <MedidioresIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-100 border rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                    {/* Medidores */}
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <p className="2xl:text-3xl lg:text-2xl text-gray-600 dark:text-gray-100 font-bold tracking-wide">Pagos</p>
                            <h3 className="mt-1 text-5xl text-blue-500 font-bold mt-4">{medidores.length}</h3>
                            <span className="mt-4 text-xs text-gray-500">Número correspondiente al mes anterior.</span>
                        </div>
                        <div className="bg-blue-500 p-2 rounded-md text-white">
                            <MedidioresIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Calendario */}
                <div
                    className="
                        p-6 bg-gray-100 border rounded-lg shadow dark:bg-gray-800 dark:border-gray-700
                        col-span-1
                        md:col-span-4
                        lg:col-span-4
                        lg:h-[600px]
                        2xl:col-span-4
                        2xl:h-[600px]
                    
                    "
                >
                    {/* LineChart */}

                    <CalendarInicio />
                </div>

                {/* Linechart*/}
                <div
                    className="
                        p-6 bg-gray-100 border rounded-lg shadow dark:bg-gray-800 dark:border-gray-700
                        col-span-1
                        md:col-span-4
                        md:h-[500px]
                        lg:col-span-3
                        lg:h-[500px]
                        2xl:col-span-3
                        2xl:h-[500px]
                    "
                >
                    <LineChart />
                </div>

                {/* PieChart */}
                <div
                    className="
                        p-6 bg-gray-100 border rounded-lg shadow dark:bg-gray-800 dark:border-gray-700
                        col-span-1 
                        md:col-span-4
                        lg:col-span-1
                        lg:h-[500px]
                        2xl:col-span-1
                        2xl:h-[500px]
                        
                    "
                >
                    <p className="2xl:text-2xl lg:text-lg md:text-2xl font-bold text-gray-600 dark:text-gray-100">Participación del Consumo</p>
                    <PieChart />
                </div>





            </div>
        </div>

    );
};

export default InicioVista;
