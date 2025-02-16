import React from "react";
import PieChart from "../charts/piechart"
import LineChart from "../charts/lineChart"
import { Button, Modal } from "flowbite-react";
import { useState } from "react";
import { Calendar } from "@nextui-org/calendar";
import { today, getLocalTimeZone } from "@internationalized/date";
import { Datepicker } from "flowbite-react";
import { Link } from "react-router-dom";

const InicioVista = () => {
    const [openModal, setOpenModal] = useState(true);
   
    return (
        <>
            
            <div className="  mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">


                <div className="grid grid-cols-4 gap-4 mb-4 mt-3">

                    <a className="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">

                        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Consumo Diario</h5>
                        <h1 className="mb-2 text-6xl font-bold tracking-tight text-gray-900 dark:text-white">6</h1>
                    </a>


                    <a as={Link} to="/" className="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">

                        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Cantidad de Clientes</h5>
                        <h1 className="mb-2 text-6xl font-bold tracking-tight text-gray-900 dark:text-white">800</h1>
                       

                    </a>

                    <a href="#" className="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">

                        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Noteworthy technology acquisitions 2021</h5>
                        <p className="font-normal text-gray-700 dark:text-gray-400">Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.</p>
                    </a>
                    <a href="#" className="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Consumo Total</h5>
                        <PieChart />
                    </a>

                </div>


                <LineChart />
                
                
            </div>
        </>


    )
};

export default InicioVista;
