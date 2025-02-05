import { Dropdown } from "flowbite-react"
import PieChart from "./charts/piechart"
import LineChart from "./charts/lineChart"
import { Datepicker } from "flowbite-react";
function Content() {

    return (
        <>
            <div class="p-4 sm:ml-64 pt-20">
                
                    <div class="grid grid-cols-4 gap-4 mb-4">

                        <a href="#" class="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">

                            <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Consumo Diario</h5>
                            <h1 class="mb-2 text-6xl font-bold tracking-tight text-gray-900 dark:text-white">6</h1>
                        </a>


                        <a href="#" class="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">

                            <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Cantidad de Clientes</h5>
                            <h1 class="mb-2 text-6xl font-bold tracking-tight text-gray-900 dark:text-white">800</h1>
                            
                        </a>


                        <a href="#" class="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">

                            <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Noteworthy technology acquisitions 2021</h5>
                            <p class="font-normal text-gray-700 dark:text-gray-400">Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.</p>
                        </a>
                        <a href="#" class="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                        <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Consumo Total</h5>
                        <PieChart />
                        
                        </a>
                        
                        
                    </div>
                    <LineChart />

            </div>

        </>
    )
}

export default Content