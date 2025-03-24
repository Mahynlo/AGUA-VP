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

            <div className="  mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64 ">


                <div class="grid grid-cols-[repeat(4,_2fr)_1fr] grid-rows-[2fr_repeat(4,_1fr)] gap-4 mt-2">
                    <div class="col-start-1 col-end-2 row-start-1 row-end-2 block max-w-sm p-6 bg-gray-100 border border-gray-400 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">

                        <div class="flex justify-between items-start">
                            <div class="flex flex-col">
                                <p class="text-3xl text-gray-600 dark:text-gray-100  font-bold tracking-wide">Consumo</p>
                                <h3 class="mt-1 text-5xl text-red-500 font-bold mt-4">600 m³</h3>
                                <span class="mt-4 text-xs text-gray-500">Numero corresponde al consumo diario corespondiente el mes anterior.</span>
                            </div>
                            <div class="bg-red-500 p-2 md:p-1 xl:p-2 rounded-md text-white">
                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-wiper"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 18m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M3 9l5.5 5.5a5 5 0 0 1 7 0l5.5 -5.5a12 12 0 0 0 -18 0" /><path d="M12 18l-2.2 -12.8" /></svg>
                            </div>
                        </div>
                    </div>

                    <div class="col-start-2 col-end-3 row-start-1 row-end-2 block max-w-sm p-6 bg-gray-100 border border-gray-400 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                   
                        <div class="flex justify-between items-start">
                            <div class="flex flex-col">
                                <p class="text-3xl text-gray-600 dark:text-gray-100  font-bold tracking-wide">Clientes</p>
                                <h3 class="mt-1 text-5xl text-green-500 font-bold mt-4">600</h3>
                                <span class="mt-4 text-xs text-gray-500">Numero corespondiente a los clientes registrados hasta el mes anterior.</span>
                            </div>
                            <div class="bg-green-500 p-2 md:p-1 xl:p-2 rounded-md text-white">
                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-users-group"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1" /><path d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M17 10h2a2 2 0 0 1 2 2v1" /><path d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M3 13v-1a2 2 0 0 1 2 -2h2" /></svg>
                            </div>
                        </div>
                    </div>

                    <div class="col-start-3 col-end-4 row-start-1 row-end-2 block max-w-sm p-6 bg-gray-100 border border-gray-400 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                    <div class="flex justify-between items-start">
                            <div class="flex flex-col">
                                <p class="text-3xl text-gray-600 dark:text-gray-100  font-bold tracking-wide">Medidores</p>
                                <h3 class="mt-1 text-5xl text-blue-500 font-bold mt-4">100</h3>
                                <span class="mt-4 text-xs text-gray-500">Numero corespondiente el mes anterior.</span>
                            </div>
                            <div class="bg-blue-500 p-2 md:p-1 xl:p-2 rounded-md text-white">
                                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="currentColor"  class="icon icon-tabler icons-tabler-filled icon-tabler-droplets"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 12.003c.541 0 1.045 .273 1.342 .727l2.122 3.273a3.999 3.999 0 0 1 -6.035 5.063c-1.487 -1.248 -1.864 -3.382 -.867 -5.11l2.098 -3.226a1.6 1.6 0 0 1 1.34 -.727" /><path d="M18 12.003c.541 0 1.045 .273 1.342 .727l2.122 3.273a3.999 3.999 0 0 1 -6.035 5.063c-1.487 -1.248 -1.864 -3.382 -.867 -5.11l2.098 -3.227a1.6 1.6 0 0 1 1.34 -.726" /><path d="M12 2.003c.541 0 1.045 .273 1.342 .727l2.122 3.273a3.999 3.999 0 0 1 -6.035 5.063c-1.487 -1.248 -1.864 -3.382 -.867 -5.11l2.098 -3.226a1.6 1.6 0 0 1 1.34 -.727" /></svg>
                            </div>
                        </div>
                    </div>

                    <div class="col-start-4 col-end-6 row-start-1 row-end-2 block  p-6 bg-gray-100 border border-gray-400 rounded-lg shadow  dark:bg-gray-800 dark:border-gray-700 " >
                        
                        <p class="text-3xl text-gray-600 dark:text-gray-100  font-bold tracking-wide">Participacion del Consumo</p>
                        <PieChart />
                    </div>

                    <div class="col-start-1 col-end-3 row-start-2 row-end-6 block h-96 p-6 bg-gray-100 border border-gray-400 rounded-lg shadow  dark:bg-gray-800 dark:border-gray-700 ">
                        <Calendar isReadOnly aria-label="Date (Read Only)" value={today(getLocalTimeZone())} />

                    </div>

                    <div class="col-start-3 col-end-6 row-start-2 row-end-6 ">
                        <LineChart />
                    </div>
                </div>


            </div>
        </>


    )
};

export default InicioVista;
