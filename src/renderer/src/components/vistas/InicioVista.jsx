import React from "react";
import PieChart from "../charts/piechart"
import LineChart from "../charts/lineChart"
import { Button, Modal } from "flowbite-react";
import { useState } from "react";
import { today, getLocalTimeZone } from "@internationalized/date";
import { Datepicker } from "flowbite-react";
import { Link } from "react-router-dom";
import { parseDate } from "@internationalized/date";
import CalendarInicio from "../calendario/CalendarioInicio";
import { ConsumoIcon, ClientesHomeIcon, MedidioresIcon,CalendarioHomeIcon } from "../../IconsApp/IconsHome"; // se importa los iconos 
import { useMedidores } from "../../../src/context/MedidoresContext"; // se importa el contexto de medidores
import { useClientes } from "../../../src/context/ClientesContext"; // se importa el contexto de clientes
const InicioVista = () => {
    const {medidores} = useMedidores();
    const {clientes} = useClientes(); // se obtiene el contexto de clientes
    const [openModal, setOpenModal] = useState(true);
    let [value, setValue] = React.useState(parseDate("2024-04-07"));
    return (
        <>

            <div className="  mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64 ">


                <div className="grid grid-cols-[repeat(4,_2fr)_1fr] grid-rows-[2fr_repeat(4,_1fr)] gap-4 h-full">
                    <div className="col-start-1 col-end-2 row-start-1 row-end-2 block  p-6 bg-gray-100 border border-gray-400 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">

                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <p className="text-3xl text-gray-600 dark:text-gray-100  font-bold tracking-wide">Consumo</p>
                                <h3 className="mt-1 text-5xl text-red-500 font-bold mt-4">600 m³</h3>
                                <span className="mt-4 text-xs text-gray-500">Numero corresponde al consumo diario corespondiente el mes anterior.</span>
                            </div>
                            <div className="bg-red-500 p-2 md:p-1 xl:p-2 rounded-md text-white">
                               <ConsumoIcon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="col-start-2 col-end-3 row-start-1 row-end-2 block  p-6 bg-gray-100 border border-gray-400 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">

                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <p className="text-3xl text-gray-600 dark:text-gray-100  font-bold tracking-wide">Clientes</p>
                                <h3 className="mt-1 text-5xl text-green-500 font-bold mt-4">{clientes.length}</h3>
                                <span className="mt-4 text-xs text-gray-500">Numero corespondiente a los clientes registrados hasta el mes anterior.</span>
                            </div>
                            <div className="bg-green-500 p-2 md:p-1 xl:p-2 rounded-md text-white">
                               <ClientesHomeIcon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="col-start-3 col-end-4 row-start-1 row-end-2 block  p-6 bg-gray-100 border border-gray-400 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <p className="text-3xl text-gray-600 dark:text-gray-100  font-bold tracking-wide">Medidores</p>
                                <h3 className="mt-1 text-5xl text-blue-500 font-bold mt-4">{medidores.length}</h3>
                                <span className="mt-4 text-xs text-gray-500">Numero corespondiente el mes anterior.</span>
                            </div>
                            <div className="bg-blue-500 p-2 md:p-1 xl:p-2 rounded-md text-white">
                                <MedidioresIcon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="col-start-4 col-end-6 row-start-1 row-end-2 block  p-6 bg-gray-100 border border-gray-400 rounded-lg shadow  dark:bg-gray-800 dark:border-gray-700 " >

                        <p className="text-2xl text-gray-600 dark:text-gray-100  font-bold tracking-wide">Participacion del Consumo</p>
                        <PieChart />
                    </div>

                    <div className="col-start-1 col-end-3 row-start-2 row-end-6 block h-full w-full bg-gray-100 border border-gray-400 rounded-lg shadow  dark:bg-gray-800 dark:border-gray-700 ">

                        
                        <CalendarInicio />
                    </div>

                    <div className="col-start-3 col-end-6 row-start-2 row-end-6 ">
                        <LineChart />
                    </div>
                </div>


            </div>
        </>


    )
};

export default InicioVista;
