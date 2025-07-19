import React, { useState } from "react";
import { FlechaIzquierdaIcon, FlechaDerechaIcon } from "../../IconsApp/IconsAppSystem";
import { CalendarioHomeIcon } from "../../IconsApp/IconsHome";
import { useTarifas } from "../../context/TarifasContext";

// Definición de eventos


const CalendarComponent = () => {
    const [selectedDate, setSelectedDate] = useState("");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const { tarifas } = useTarifas();
    console.log("Tarifas:", tarifas);

    const handleDateChange = (dateString) => {
        setSelectedDate(dateString);
    };


    const events = {};

    tarifas.forEach((tarifa) => {
        const startDate = parseDate(tarifa.fecha_inicio);
        const startDateString = startDate.toISOString().split("T")[0];
        if (!events[startDateString]) events[startDateString] = [];
        events[startDateString].push({
            title: `Inicio de tarifa ${tarifa.nombre}`,
            descripcion: tarifa.descripcion,
            time: null,
        });

        if (tarifa.fecha_fin) {
            const endDate = parseDate(tarifa.fecha_fin);
            const endDateString = endDate.toISOString().split("T")[0];
            if (!events[endDateString]) events[endDateString] = [];
            events[endDateString].push({
                title: `Fin de tarifa ${tarifa.nombre}`,
                descripcion: tarifa.descripcion,
                time: null,
            });
        }
    });

    // Ejemplo de agregar eventos adicionales que no son tarifas:
    events["2025-07-20"] = events["2025-07-20"] || [];
    events["2025-07-20"].push({
        title: "Evento especial fuera de tarifas",
        descripcion: "Descripción adicional",
        time: "10:00 am",
    });
    
    events["2025-07-20"].push({
        title: "Evento especial fuera de tarifas 2",
        descripcion: "Descripción adicional",
        time: "11:00 am",
    });

    events["2025-07-20"].push({
        title: "Evento especial fuera de tarifas 3",
        descripcion: "Descripción adicional",
        time: "12:00 am",
    });

   

   


    // Función auxiliar para parsear fechas yyyy-mm-dd
    function parseDate(str) {
        const [year, month, day] = str.split("-").map(Number);
        return new Date(year, month - 1, day);
    }





    const getDaysInMonth = (date) => {
        const days = [];
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        // Días del mes anterior
        const startDay = firstDay.getDay();
        const prevMonthLastDay = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            const prevDate = new Date(date.getFullYear(), date.getMonth() - 1, prevMonthLastDay - i);
            days.push({ date: prevDate, currentMonth: false });
        }

        // Días del mes actual
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const currentDate = new Date(date.getFullYear(), date.getMonth(), i);
            days.push({ date: currentDate, currentMonth: true });
        }

        // Días del mes siguiente
        const remainingDays = 7 - (days.length % 7);
        if (remainingDays < 7) {
            for (let i = 1; i <= remainingDays; i++) {
                const nextDate = new Date(date.getFullYear(), date.getMonth() + 1, i);
                days.push({ date: nextDate, currentMonth: false });
            }
        }

        return days;
    };

    const changeMonth = (direction) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(currentMonth.getMonth() + direction);
        setCurrentMonth(newDate);
    };

    const hasEvent = (date) => {
        const dateString = date.toISOString().split("T")[0];
        return !!events[dateString];
    };

    const isToday = (date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const daysInMonth = getDaysInMonth(currentMonth);

    return (

        <div className="flex w-full h-full">

            {/* Calendario */}
            <div className="flex w-full h-full">
                {/* Calendario */}
                <div className="w-full p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg  flex flex-col h-full min-h-[250px] max-h-[90vh]">
                    {/*Titulo del calaendario e icono */}
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <p className="text-3xl text-gray-600 dark:text-gray-100 p-2  font-bold tracking-wide">Calendario</p>

                        </div>
                        <div className="bg-orange-500 p-2 md:p-1 xl:p-2 rounded-md text-white h-full">
                            <CalendarioHomeIcon className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-4 h-[40px] mt-4">

                        <button onClick={() => changeMonth(-1)} className="p-2 text-gray-700 bg-gray-300 dark:bg-gray-800  dark:text-gray-300 border border-gray-300 rounded-full">
                            <FlechaIzquierdaIcon className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-100">
                            {currentMonth.toLocaleString("default", { month: "long" })} {currentMonth.getFullYear()}
                        </h2>
                        <button onClick={() => changeMonth(1)} className="p-2 text-gray-700 bg-gray-300 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 rounded-full">
                            <FlechaDerechaIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 gap-1 text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-100 h-[30px]">


                        {["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"].map((day) => (
                            <div key={day} className="py-2">{day}</div>
                        ))}
                    </div>

                    {/* Días del mes */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-2  flex-1 overflow-auto ">

                        {daysInMonth.map(({ date, currentMonth }, index) => {
                            const dateString = date.toISOString().split("T")[0];

                            return (
                                <div
                                    key={index}
                                    className={`w-full  flex  p-4 rounded-lg cursor-pointer transition-all
                                                    ${currentMonth
                                            ? isToday(date)
                                                ? "bg-green-500 text-white font-bold " // Día actual resaltado
                                                : hasEvent(date)
                                                    ? "bg-blue-500 text-white" // Día con evento
                                                    : "bg-transparent border-2 border-gray-200 dark:border-slate-700" // Días del mes actual 
                                            : "text-gray-400 dark:text-gray-500 bg-gray-200  dark:bg-gray-700" // Días del mes anterior/siguiente
                                        }
                                                    hover:bg-blue-200 hover:text-gray-700 dark:hover:bg-blue-400 dark:hover:text-white
                                                `}
                                    onClick={() => handleDateChange(dateString)}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-lg">{date.getDate()}</span>
                                        {hasEvent(date) && (
                                            <span className=" text-xs text-gray-200 dark:text-gray-200 bg-green-600 rounded-full px-2 py-1 ">
                                                {events[dateString].length}
                                                {events[dateString].length > 1 ? " eventos" : " evento"}
                                                
                                                
                                            </span>
                                        )}
                                    </div>


                                </div>
                            );
                        })}
                    </div>
                </div>


            </div>

            {/* Lista de eventos */}
            <div className="w-1/3 ml-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border ">
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-100 mb-4">
                    
                    {selectedDate ? (() => {
                        const [year, month, day] = selectedDate.split("-");
                        const localDate = new Date(Number(year), Number(month) - 1, Number(day));
                        return localDate.toLocaleDateString("es-MX", {
                            timeZone: "America/Hermosillo",
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        });
                    })() : "Selecciona una fecha"}
                </h2>


                {selectedDate && events[selectedDate] ? (
                    <ul className="space-y-3 overflow-y-auto max-h-[500px] w-full">
                        {events[selectedDate].map((event, index) => (
                            <li key={index} className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg shadow hover:bg-gray-200 dark:hover:bg-gray-600 transition-all ">
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    {event.time}
                                </div>
                                <div className="text-lg text-gray-900 dark:text-white">
                                    {event.title}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">No Hay eventos para este dia.</p>
                )}
            </div>
        </div>
    );
};

export default CalendarComponent;



